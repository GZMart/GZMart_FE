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
  throw new Error(`Invalid API_BASE_URL: ${API_BASE_URL}. Please check your .env file.`);
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

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle responses and errors
axiosClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;

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
      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt to refresh token
        const refreshToken = getRefreshToken();

        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post(`${API_BASE_URL}/api/auth/refresh-token`, {
          refreshToken,
        });

        const newToken = response.data?.token || response.data?.data?.token;

        if (newToken) {
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
        // Process queue with error
        processQueue(refreshError, null);

        // Refresh failed - logout user
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
