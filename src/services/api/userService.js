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

/**
 * Admin: gợi ý seller (tên shop, email, …) — dùng cho autocomplete lọc campaign
 * @param {string} q - từ khóa (tối thiểu 2 ký tự khi tìm theo chữ)
 */
export const searchSellers = async (q, limit = 20) => {
  const response = await axiosClient.get('/api/users/sellers/search', {
    params: { q, limit },
  });
  const payload = response.data != null ? response.data : response;
  if (Array.isArray(payload)) {
    return payload;
  }
  if (Array.isArray(payload?.data)) {
    return payload.data;
  }
  return [];
};
