import axios from 'axios';
import { getAuthToken, getRefreshToken, setAuthToken, clearAuthData } from '@utils/storage';

// Validate và set API_BASE_URL
const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;

  // Nếu có VITE_API_BASE_URL và hợp lệ
  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
    const trimmedUrl = envUrl.trim();
    if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
      // Remove trailing slash
      return trimmedUrl.replace(/\/+$/, '');
    }
  }

  // Fallback về localhost với port mặc định của backend
  // Backend chạy trên port 3000 (theo server.js line 133)
  return 'http://localhost:3000';
};

const API_BASE_URL = getApiBaseUrl();

// Validate URL trước khi sử dụng
try {
  new URL(API_BASE_URL);
} catch (error) {
  console.error('❌ Invalid API_BASE_URL:', API_BASE_URL, error);
  throw new Error(`Invalid API_BASE_URL: ${API_BASE_URL}. Please check your .env file.`);
}

// Log để debug
if (import.meta.env.DEV) {
  console.log('🔧 API Base URL:', API_BASE_URL);
  console.log('🔧 VITE_API_BASE_URL from env:', import.meta.env.VITE_API_BASE_URL);
}

/**
 * Axios instance with interceptors for authentication and error handling
 */
const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Global flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  console.log('[AUTH-DEBUG] 📦 processQueue called:', {
    queueLength: failedQueue.length,
    hasError: !!error,
    hasToken: !!token,
    errorMessage: error?.message,
  });

  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// Request interceptor - Add auth token to requests
axiosClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Remove Content-Type for FormData - let Axios set it automatically with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    // Log request in development
    if (import.meta.env.DEV) {
      // console.log('🚀 Request:', {
      //   method: config.method?.toUpperCase(),
      //   url: config.url,
      //   data: config.data,
      // });
    }

    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - Handle responses and errors
axiosClient.interceptors.response.use(
  (response) => {
    // Log response in development
    if (import.meta.env.DEV) {
      // console.log('✅ Response:', {
      //   status: response.status,
      //   url: response.config.url,
      //   data: response.data,
      // });
    }

    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;

    // Log error in development
    if (import.meta.env.DEV) {
      console.error('❌ Response Error:', {
        status: error.response?.status,
        url: error.config?.url,
        message: error.message,
        data: error.response?.data,
      });
    }

    // Handle 401 Unauthorized - Token expired
    // Skip retry for login/change-password endpoint as 401 might mean incorrect password (due to backend issue)
    // Also skip retry for refresh-token endpoint to avoid infinite loops
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('login') &&
      !originalRequest.url?.includes('change-password') &&
      !originalRequest.url?.includes('refresh-token')
    ) {
      console.log('[AUTH-DEBUG] 🔴 401 Error detected:', {
        url: originalRequest.url,
        isRefreshing,
        queueLength: failedQueue.length,
        timestamp: new Date().toISOString(),
      });

      // If already refreshing, queue this request
      if (isRefreshing) {
        console.log('[AUTH-DEBUG] 📝 Queueing request (refresh in progress):', originalRequest.url);
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      console.log('[AUTH-DEBUG] 🔄 Starting token refresh...');

      try {
        // Attempt to refresh token
        const refreshToken = getRefreshToken();

        if (!refreshToken) {
          console.log('[AUTH-DEBUG] ❌ No refresh token available');
          throw new Error('No refresh token available');
        }

        const response = await axios.post(`${API_BASE_URL}/api/auth/refresh-token`, {
          refreshToken,
        });

        const newToken = response.data?.token || response.data?.data?.token;

        if (newToken) {
          console.log(
            '[AUTH-DEBUG] ✅ Token refresh successful, processing',
            failedQueue.length,
            'queued requests'
          );
          setAuthToken(newToken);

          // Process queued requests
          processQueue(null, newToken);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return axiosClient(originalRequest);
        } else {
          throw new Error('No token in refresh response');
        }
      } catch (refreshError) {
        console.log('[AUTH-DEBUG] 💥 Token refresh FAILED:', refreshError.message);
        console.log('[AUTH-DEBUG] 🚪 Calling clearAuthData() and redirecting to login...');

        // Process queue with error
        processQueue(refreshError, null);

        // Refresh failed - logout user
        console.error('Token refresh failed, logging out:', refreshError.message);
        clearAuthData();

        // Only redirect if not already on login page
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      // Redirect to unauthorized page or show message
      console.error('Access forbidden');
    }

    // Handle 404 Not Found
    if (error.response?.status === 404) {
      console.error('Resource not found');
    }

    // Handle 500 Server Error
    if (error.response?.status >= 500) {
      console.error('Server error occurred');
    }

    // Handle network errors
    if (!error.response) {
      console.error('Network error - Please check your connection');
    }

    // Return formatted error
    const formattedError = {
      message: error.response?.data?.message || error.message || 'An error occurred',
      status: error.response?.status,
      data: error.response?.data,
      originalError: error,
    };

    return Promise.reject(formattedError);
  }
);

/**
 * Helper methods for common HTTP operations
 */
export const api = {
  get: (url, config) => axiosClient.get(url, config),
  post: (url, data, config) => axiosClient.post(url, data, config),
  put: (url, data, config) => axiosClient.put(url, data, config),
  patch: (url, data, config) => axiosClient.patch(url, data, config),
  delete: (url, config) => axiosClient.delete(url, config),
};

export { API_BASE_URL };
export default axiosClient;
