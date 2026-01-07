import axiosClient from '../axiosClient';

const BASE_URL = '/api/categories';

/**
 * Category API Service
 */
export const categoryService = {
  /**
   * Get all categories
   * @param {object} params - Query parameters (status, level, search)
   * @returns {Promise} Categories list
   */
  getAll: async (params = {}) => {
    return await axiosClient.get(BASE_URL, { params });
  },

  /**
   * Get category tree (hierarchical)
   * @returns {Promise} Category tree
   */
  getTree: async () => {
    return await axiosClient.get(`${BASE_URL}/tree`);
  },

  /**
   * Get single category by ID
   * @param {string} id - Category ID
   * @returns {Promise} Category details
   */
  getById: async (id) => {
    return await axiosClient.get(`${BASE_URL}/${id}`);
  },

  /**
   * Create new category
   * @param {object} data - Category data
   * @returns {Promise} Created category
   */
  create: async (data) => {
    return await axiosClient.post(BASE_URL, data);
  },

  /**
   * Update category
   * @param {string} id - Category ID
   * @param {object} data - Updated category data
   * @returns {Promise} Updated category
   */
  update: async (id, data) => {
    return await axiosClient.put(`${BASE_URL}/${id}`, data);
  },

  /**
   * Delete category
   * @param {string} id - Category ID
   * @returns {Promise} Deletion response
   */
  delete: async (id) => {
    return await axiosClient.delete(`${BASE_URL}/${id}`);
  },
};

export default categoryService;
