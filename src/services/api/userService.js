import axiosClient from '../axiosClient';

/**
 * Get all users with pagination and filtering
 */
export const getAllUsers = async (params = {}) => {
  const response = await axiosClient.get('/api/users', { params });
  return response.data || response;
};

/**
 * Get user by ID
 */
export const getUserById = async (id) => {
  const response = await axiosClient.get(`/api/users/${id}`);
  return response.data || response;
};

/**
 * Toggle user ban status (isActive)
 */
export const toggleUserBan = async (id) => {
  const response = await axiosClient.patch(`/api/users/${id}/ban`);
  return response.data || response;
};
