import axiosClient from '../axiosClient';

const BASE_URL = '/api/flash-sales';

/**
 * Flash Sale API Service
 * Handles all flash sale operations for sellers and admins
 */
export const flashsaleService = {
  /**
   * Get all flash sales with pagination and filters
   * @param {object} params - Query parameters
   * @param {number} [params.page=1] - Page number
   * @param {number} [params.limit=10] - Items per page
   * @param {string} [params.status] - Filter by status (active, upcoming, expired, draft, paused)
   * @param {string} [params.sortBy] - Sort field (createdAt, newest-first, oldest-first, startDate, endDate)
   * @returns {Promise} Flash sales list with pagination info
   */
  getAll: async (params = {}) => await axiosClient.get(BASE_URL, { params }),

  /**
   * Get all active flash sales
   * @returns {Promise} Active flash sales list
   */
  getActive: async () => await axiosClient.get(`${BASE_URL}/active`),

  /**
   * Create a new flash sale
   * @param {object} flashSaleData - Flash sale data
   * @param {string} flashSaleData.productId - Product ID (required)
   * @param {number} flashSaleData.salePrice - Sale price (required)
   * @param {number} flashSaleData.totalQuantity - Total quantity available (required)
   * @param {string} flashSaleData.startAt - Start date and time in ISO 8601 format (required)
   * @param {string} flashSaleData.endAt - End date and time in ISO 8601 format (required)
   * @returns {Promise} Created flash sale object
   */
  create: async (flashSaleData) => await axiosClient.post(BASE_URL, flashSaleData),

  /**
   * Create a flash sale campaign with multiple SKU variants in one request
   * @param {object} payload
   * @param {string} payload.productId - Product ID (required)
   * @param {string} payload.campaignTitle - Campaign name (required)
   * @param {string} payload.startAt - ISO 8601 start time (required)
   * @param {string} payload.endAt - ISO 8601 end time (required)
   * @param {Array}  payload.variants - Array of variant configs
   * @param {string} payload.variants[].variantSku
   * @param {Array}  [payload.variants[].tierIndex]
   * @param {number} payload.variants[].salePrice
   * @param {number} payload.variants[].totalQuantity
   * @param {number} [payload.variants[].purchaseLimit]
   * @returns {Promise} Created flash sale campaign object
   */
  createBatch: async (payload) => await axiosClient.post(`${BASE_URL}/batch`, payload),

  /**
   * Get flash sale details by ID
   * @param {string} id - Flash sale ID
   * @returns {Promise} Flash sale details object
   */
  getById: async (id) => await axiosClient.get(`${BASE_URL}/${id}`),

  /**
   * Get flash sale statistics
   * @param {string} id - Flash sale ID
   * @returns {Promise} Statistics object (sold, discount amount, revenue, etc.)
   */
  getStats: async (id) => await axiosClient.get(`${BASE_URL}/${id}/stats`),

  /**
   * Search within flash sale products
   * @param {string} id - Flash sale ID
   * @param {object} params - Query parameters
   * @param {string} params.q - Search query keyword (required)
   * @param {number} [params.page=1] - Page number (optional)
   * @param {number} [params.limit=10] - Items per page (optional)
   * @returns {Promise} Search results with pagination
   */
  search: async (id, q, params = {}) =>
    await axiosClient.get(`${BASE_URL}/${id}/search`, { params: { q, ...params } }),

  /**
   * Update flash sale
   * @param {string} id - Flash sale ID
   * @param {object} updateData - Flash sale update data (all fields optional)
   * @param {number} [updateData.salePrice] - Sale price
   * @param {number} [updateData.totalQuantity] - Total quantity available
   * @param {string} [updateData.startAt] - Start date and time in ISO 8601 format
   * @param {string} [updateData.endAt] - End date and time in ISO 8601 format
   * @returns {Promise} Updated flash sale object
   */
  update: async (id, updateData) => await axiosClient.put(`${BASE_URL}/${id}`, updateData),

  /**
   * Delete flash sale
   * @param {string} id - Flash sale ID
   * @returns {Promise} Deletion confirmation
   */
  delete: async (id) => await axiosClient.delete(`${BASE_URL}/${id}`),
};

export default flashsaleService;
