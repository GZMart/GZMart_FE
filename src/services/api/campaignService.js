import axiosClient from '../axiosClient';

const BASE_URL = '/api/campaigns';

/**
 * Campaign API Service
 * Handles all campaign operations for sellers and admins
 */
export const campaignService = {
  /**
   * Get all campaigns with pagination and filters
   * @param {object} params - Query parameters
   * @param {number} [params.page=1] - Page number
   * @param {number} [params.limit=10] - Items per page
   * @param {string} [params.status] - Filter by status (active, upcoming, expired, draft, paused)
   * @param {string} [params.sortBy] - Sort field (createdAt, newest-first, oldest-first, startDate, endDate)
   * @returns {Promise} Campaigns list with pagination info
   */
  getAll: async (params = {}) => await axiosClient.get(BASE_URL, { params }),

  /**
   * Get all active campaigns
   * @returns {Promise} Active campaigns list
   */
  getActive: async () => await axiosClient.get(`${BASE_URL}/active`),

  /**
   * Create a new campaign
   * @param {object} campaignData - Campaign data
   * @param {string} campaignData.productId - Product ID (required)
   * @param {number} campaignData.salePrice - Sale price (required)
   * @param {number} campaignData.totalQuantity - Total quantity available (required)
   * @param {string} campaignData.startAt - Start date and time in ISO 8601 format (required)
   * @param {string} campaignData.endAt - End date and time in ISO 8601 format (required)
   * @returns {Promise} Created campaign object
   */
  create: async (campaignData) => await axiosClient.post(BASE_URL, campaignData),

  /**
   * Create a campaign with multiple SKU variants in one request
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
   * @returns {Promise} Created campaign object
   */
  createBatch: async (payload) => await axiosClient.post(`${BASE_URL}/batch`, payload),

  /**
   * Get campaign details by ID
   * @param {string} id - Campaign ID
   * @returns {Promise} Campaign details object
   */
  getById: async (id) => await axiosClient.get(`${BASE_URL}/${id}`),

  /**
   * Get campaign statistics
   * @param {string} id - Campaign ID
   * @returns {Promise} Statistics object (sold, discount amount, revenue, etc.)
   */
  getStats: async (id) => await axiosClient.get(`${BASE_URL}/${id}/stats`),

  /**
   * Search within campaign products
   * @param {string} id - Campaign ID
   * @param {object} params - Query parameters
   * @param {string} params.q - Search query keyword (required)
   * @param {number} [params.page=1] - Page number (optional)
   * @param {number} [params.limit=10] - Items per page (optional)
   * @returns {Promise} Search results with pagination
   */
  search: async (id, q, params = {}) =>
    await axiosClient.get(`${BASE_URL}/${id}/search`, { params: { q, ...params } }),

  /**
   * Update campaign
   * @param {string} id - Campaign ID
   * @param {object} updateData - Campaign update data (all fields optional)
   * @param {number} [updateData.salePrice] - Sale price
   * @param {number} [updateData.totalQuantity] - Total quantity available
   * @param {string} [updateData.startAt] - Start date and time in ISO 8601 format
   * @param {string} [updateData.endAt] - End date and time in ISO 8601 format
   * @returns {Promise} Updated campaign object
   */
  update: async (id, updateData) => await axiosClient.put(`${BASE_URL}/${id}`, updateData),

  /**
   * Delete campaign
   * @param {string} id - Campaign ID
   * @returns {Promise} Deletion confirmation
   */
  delete: async (id) => await axiosClient.delete(`${BASE_URL}/${id}`),

  /**
   * Pause a campaign (sets status to "paused")
   * @param {string} id - Campaign ID
   * @returns {Promise} Updated campaign object
   */
  pause: async (id) => await axiosClient.patch(`${BASE_URL}/${id}/pause`),

  /**
   * Stop a campaign (sets status to "cancelled")
   * @param {string} id - Campaign ID
   * @returns {Promise} Updated campaign object
   */
  stop: async (id) => await axiosClient.patch(`${BASE_URL}/${id}/stop`),

  /**
   * Resume a paused campaign (sets status back to "active" or "pending")
   * @param {string} id - Campaign ID
   * @returns {Promise} Updated campaign object
   */
  resume: async (id) => await axiosClient.patch(`${BASE_URL}/${id}/resume`),
};

export default campaignService;
