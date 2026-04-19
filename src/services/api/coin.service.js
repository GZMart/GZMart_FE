import axiosClient from '../axiosClient';

const coinService = {
  /**
   * Get user's coin balance and breakdown
   * @returns {Promise} Balance data with breakdown
   */
  getCoinBalance: () => axiosClient.get('/api/coins/balance'),

  /**
   * Get coin transaction history
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.limit - Items per page
   * @param {string} params.type - Transaction type filter
   * @param {string} params.startDate - Start date filter
   * @param {string} params.endDate - End date filter
   * @returns {Promise} Transaction history
   */
  getCoinTransactions: (params = {}) => axiosClient.get('/api/coins/transactions', { params }),

  /**
   * Get user's coin statistics
   * @returns {Promise} Coin statistics
   */
  getCoinStats: () => axiosClient.get('/api/coins/stats'),

  /**
   * Get expiring coins alert
   * @param {number} days - Number of days to check
   * @returns {Promise} Expiring coins data
   */
  getExpiringCoins: (days = 7) =>
    axiosClient.get('/api/coins/expiring', {
      params: { days },
    }),

  /** Admin — grant coins */
  adminGrant: (body) => axiosClient.post('/api/coins/admin/grant', body),

  /** Admin — expire old coins (batch job) */
  adminExpire: () => axiosClient.post('/api/coins/admin/expire'),

  /** Admin — sync user balances */
  adminSync: () => axiosClient.post('/api/coins/admin/sync'),

  /** Admin — notify users about expiring coins */
  adminNotifyExpiring: (days = 3) =>
    axiosClient.post('/api/coins/admin/notify-expiring', { days }),
};

export default coinService;
