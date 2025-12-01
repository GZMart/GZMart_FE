import { api } from '../axiosClient';
import { API_VERSION } from '@constants';

const BASE_URL = `${API_VERSION}/auth`;

/**
 * Authentication API Service
 */
export const authService = {
  /**
   * User login
   * @param {object} credentials - { email, password }
   * @returns {Promise} Login response with token and user data
   */
  login: async (credentials) => {
    return api.post(`${BASE_URL}/login`, credentials);
  },

  /**
   * User registration
   * @param {object} userData - User registration data
   * @returns {Promise} Registration response
   */
  register: async (userData) => {
    return api.post(`${BASE_URL}/register`, userData);
  },

  /**
   * Logout user
   * @returns {Promise} Logout response
   */
  logout: async () => {
    return api.post(`${BASE_URL}/logout`);
  },

  /**
   * Refresh authentication token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise} New access token
   */
  refreshToken: async (refreshToken) => {
    return api.post(`${BASE_URL}/refresh`, { refreshToken });
  },

  /**
   * Get current user profile
   * @returns {Promise} User profile data
   */
  getCurrentUser: async () => {
    return api.get(`${BASE_URL}/me`);
  },

  /**
   * Request password reset
   * @param {string} email - User email
   * @returns {Promise} Password reset request response
   */
  forgotPassword: async (email) => {
    return api.post(`${BASE_URL}/forgot-password`, { email });
  },

  /**
   * Reset password with token
   * @param {object} data - { token, newPassword }
   * @returns {Promise} Password reset response
   */
  resetPassword: async (data) => {
    return api.post(`${BASE_URL}/reset-password`, data);
  },

  /**
   * Change password for logged-in user
   * @param {object} data - { currentPassword, newPassword }
   * @returns {Promise} Password change response
   */
  changePassword: async (data) => {
    return api.post(`${BASE_URL}/change-password`, data);
  },

  /**
   * Verify email with token
   * @param {string} token - Email verification token
   * @returns {Promise} Verification response
   */
  verifyEmail: async (token) => {
    return api.post(`${BASE_URL}/verify-email`, { token });
  },

  /**
   * Resend verification email
   * @param {string} email - User email
   * @returns {Promise} Resend response
   */
  resendVerification: async (email) => {
    return api.post(`${BASE_URL}/resend-verification`, { email });
  },
};

export default authService;
