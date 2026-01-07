import axiosClient from '../axiosClient';

const BASE_URL = '/api/attributes';

/**
 * Attribute API Service
 */
export const attributeService = {
  /**
   * Get all attributes
   * @param {object} params - Query parameters
   * @returns {Promise} Attributes list
   */
  getAll: async (params = {}) => {
    return await axiosClient.get(BASE_URL, { params });
  },

  /**
   * Get attributes by category
   * @param {string} categoryId - Category ID
   * @returns {Promise} Category attributes
   */
  getByCategory: async (categoryId) => {
    return await axiosClient.get(`${BASE_URL}/category/${categoryId}`);
  },

  /**
   * Get attribute template by category name
   * @param {string} categoryName - Category name
   * @returns {Promise} Attribute template
   */
  getTemplate: async (categoryName) => {
    return await axiosClient.get(`${BASE_URL}/template/${categoryName}`);
  },

  /**
   * Create new attribute
   * @param {object} data - Attribute data
   * @returns {Promise} Created attribute
   */
  create: async (data) => {
    return await axiosClient.post(BASE_URL, data);
  },

  /**
   * Bulk create attributes
   * @param {array} attributes - Array of attributes
   * @returns {Promise} Created attributes
   */
  bulkCreate: async (attributes) => {
    return await axiosClient.post(`${BASE_URL}/bulk`, { attributes });
  },

  /**
   * Update attribute
   * @param {string} id - Attribute ID
   * @param {object} data - Updated attribute data
   * @returns {Promise} Updated attribute
   */
  update: async (id, data) => {
    return await axiosClient.put(`${BASE_URL}/${id}`, data);
  },

  /**
   * Delete attribute
   * @param {string} id - Attribute ID
   * @returns {Promise} Deletion response
   */
  delete: async (id) => {
    return await axiosClient.delete(`${BASE_URL}/${id}`);
  },
};

export default attributeService;
