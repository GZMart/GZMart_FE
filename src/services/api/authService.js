import { api } from '../axiosClient';
import axios from 'axios';

// Backend routes không có /v1, chỉ là /api/auth
const BASE_URL = '/api/auth';

/**
 * Authentication API Service
 * Kết nối với tất cả API endpoints từ backend
 */
export const authService = {
  /**
   * User login
   * @param {object} credentials - { email, password, rememberMe? }
   * @returns {Promise} Login response with token and user data
   * Response: { success: true, data: { user, tokens: { accessToken, refreshToken } } }
   */
  login: async (credentials) => {
    return api.post(`${BASE_URL}/login`, credentials);
  },

  /**
   * User registration
   * @param {object} userData - { fullName, username, email, password, phone, address }
   * @returns {Promise} Registration response
   * Response: { success: true, data: { user, tokens: { accessToken, refreshToken } } }
   */
  register: async (userData) => {
    return api.post(`${BASE_URL}/register`, userData);
  },

  /**
   * Login with Google
   * @param {object} data - { email, name, picture, rememberMe? }
   * @returns {Promise} Login response
   * Response: { success: true, message, user, token, refreshToken, isNewUser }
   */
  loginWithGoogle: async (data) => {
    return api.post(`${BASE_URL}/google-login`, data);
  },

  /**
   * Login with Facebook
   * @param {object} data - { email, name, picture, rememberMe? }
   * @returns {Promise} Login response
   * Response: { success: true, message, user, token, refreshToken, isNewUser }
   */
  loginWithFacebook: async (data) => {
    return api.post(`${BASE_URL}/facebook-login`, data);
  },

  /**
   * Logout user
   * @returns {Promise} Logout response
   * Response: { success: true, data: {} }
   */
  logout: async () => {
    return api.post(`${BASE_URL}/logout`);
  },

  /**
   * Refresh authentication token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise} New access token
   * Response: { success: true, token }
   */
  refreshToken: async (refreshToken) => {
    return api.post(`${BASE_URL}/refresh-token`, { refreshToken });
  },

  /**
   * Get current user profile
   * @returns {Promise} User profile data
   * Response: { success: true, data: user }
   */
  getCurrentUser: async () => {
    return api.get(`${BASE_URL}/me`);
  },

  /**
   * Update user profile
   * @param {object} userData - Profile data to update
   * @param {FormData} formData - Optional FormData for file uploads (avatar, profileImage)
   * @returns {Promise} Updated user data
   * Response: { success: true, data: user }
   */
  updateProfile: async (userData, formData = null) => {
    if (formData) {
      // If FormData is provided, use it directly
      return api.put(`${BASE_URL}/update-profile`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    }
    // Otherwise, send as JSON
    return api.put(`${BASE_URL}/update-profile`, userData);
  },

  /**
   * Request password reset
   * @param {string} email - User email
   * @returns {Promise} Password reset request response
   * Response: { success: true, message: 'Password reset email sent' }
   */
  forgotPassword: async (email) => {
    return api.post(`${BASE_URL}/forgot-password`, { email });
  },

  /**
   * Reset password with token
   * @param {object} data - { token, newPassword }
   * @returns {Promise} Password reset response
   * Response: { success: true, message: 'Password reset successfully' }
   */
  resetPassword: async (data) => {
    return api.post(`${BASE_URL}/reset-password`, data);
  },

  /**
   * Change password for logged-in user
   * @param {object} data - { currentPassword, newPassword }
   * @returns {Promise} Password change response
   * Response: { success: true, message: 'Password changed successfully' }
   */
  changePassword: async (data) => {
    return api.put(`${BASE_URL}/change-password`, data);
  },

  /**
   * Set password for social login users
   * @param {object} data - { password }
   * @returns {Promise} Set password response
   * Response: { success: true, message: 'Set password successfully' }
   */
  setPassword: async (data) => {
    return api.post(`${BASE_URL}/set-password`, data);
  },

  /**
   * Verify email with token (GET request with query param)
   * Note: This endpoint redirects, so we use axios directly
   * @param {string} token - Email verification token
   * @returns {Promise} Verification response
   */
  verifyEmail: async (token) => {
    // Backend uses GET with query param and redirects
    // For frontend, we can check the redirect or use a different approach
    const getApiBaseUrl = () => {
      const envUrl = import.meta.env.VITE_API_BASE_URL;
      if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
        const trimmedUrl = envUrl.trim();
        if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
          return trimmedUrl.replace(/\/+$/, '');
        }
      }
      return 'http://localhost:3000';
    };
    
    const API_BASE_URL = getApiBaseUrl();
    
    // Validate URL trước khi tạo
    if (!token || typeof token !== 'string') {
      throw new Error('Invalid verification token');
    }
    
    const url = `${API_BASE_URL}${BASE_URL}/verify-email?token=${encodeURIComponent(token)}`;
    
    // Validate final URL
    try {
      new URL(url);
    } catch (error) {
      throw new Error(`Invalid verification URL: ${url}`);
    }
    
    return axios.get(url, {
      maxRedirects: 0,
      validateStatus: (status) => status >= 200 && status < 400,
    });
  },

  /**
   * Resend verification email
   * @param {string} email - User email
   * @returns {Promise} Resend response
   * Response: { success: true, message: 'Verification email sent successfully' }
   */
  resendVerification: async (email) => {
    return api.post(`${BASE_URL}/resend-verification`, { email });
  },

  /**
   * Send OTP to email
   * @param {string} email - User email
   * @returns {Promise} Send OTP response
   * Response: { success: true, message: 'OTP sent successfully to your email' }
   */
  sendOTP: async (email) => {
    return api.post(`${BASE_URL}/send-otp`, { email });
  },

  /**
   * Verify OTP
   * @param {object} data - { email, otp }
   * @returns {Promise} Verify OTP response with tokens
   * Response: { success: true, message: 'OTP verified successfully', data: { user, tokens: { accessToken, refreshToken } } }
   */
  verifyOTP: async (data) => {
    return api.post(`${BASE_URL}/verify-otp`, data);
  },
};

export default authService;
