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
  getAll: async (params = {}) => await axiosClient.get(BASE_URL, { params }),

  /**
   * Get category tree (hierarchical)
   * @param {boolean} includeAll - If true, include all statuses (admin)
   * @returns {Promise} Category tree
   */
  getTree: async (includeAll = false) =>
    await axiosClient.get(`${BASE_URL}/tree`, {
      params: includeAll ? { includeAll: 'true' } : {},
    }),

  /**
   * Get mega menu categories (with products)
   * @returns {Promise} Mega menu categories
   */
  getMegaMenu: async () => await axiosClient.get(`${BASE_URL}/mega-menu`),

  /**
   * Get top categories (most products)
   * @param {number} limit - Number of categories to fetch
   * @returns {Promise} Top categories
   */
  getTopCategories: async (limit = 10) =>
    await axiosClient.get(`${BASE_URL}/top`, { params: { limit } }),

  /**
   * Get featured categories
   * @returns {Promise} Featured categories
   */
  getFeaturedCategories: async () => await axiosClient.get(`${BASE_URL}/featured`),

  /**
   * Get categories with product counts
   * @returns {Promise} Categories with product counts
   */
  getCategoriesWithCounts: async () => await axiosClient.get(`${BASE_URL}/with-counts`),

  /**
   * Get products by category
   * @param {string} categoryId - Category ID
   * @param {object} params - Query parameters
   * @returns {Promise} Products in category
   */
  getProductsByCategory: async (categoryId, params = {}) =>
    await axiosClient.get(`${BASE_URL}/${categoryId}/products`, { params }),

  /**
   * Get single category by ID
   * @param {string} id - Category ID
   * @returns {Promise} Category details
   */
  getById: async (id) => await axiosClient.get(`${BASE_URL}/${id}`),

  /**
   * Create new category
   * @param {object} data - Category data
   * @returns {Promise} Created category
   */
  create: async (data) => await axiosClient.post(BASE_URL, data),

  /**
   * Update category
   * @param {string} id - Category ID
   * @param {object} data - Updated category data
   * @returns {Promise} Updated category
   */
  update: async (id, data) => await axiosClient.put(`${BASE_URL}/${id}`, data),

  /**
   * Delete category
   * @param {string} id - Category ID
   * @returns {Promise} Deletion response
   */
  delete: async (id) => await axiosClient.delete(`${BASE_URL}/${id}`),

  /**
   * Gợi ý danh mục từ ảnh (seller/admin). FormData field: image
   * @param {File|Blob} imageFile
   * @param {import('axios').AxiosRequestConfig} [config]
   */
  suggestFromImage: async (imageFile, config = {}) => {
    const form = new FormData();
    form.append('image', imageFile);
    return axiosClient.post(`${BASE_URL}/suggest-from-image`, form, {
      timeout: 90000,
      ...config,
    });
  },
};

export default categoryService;
