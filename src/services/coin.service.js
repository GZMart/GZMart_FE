import axiosClient from './axiosClient';

const coinService = {
  /**
   * Get user's coin balance and breakdown
   * @returns {Promise} Balance data with breakdown
   */
  getCoinBalance: async () => {
    try {
      const response = await axiosClient.get('/api/coins/balance');
      return response;
    } catch (error) {
      throw error;
    }
  },

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
  getCoinTransactions: async (params = {}) => {
    try {
      const response = await axiosClient.get('/api/coins/transactions', { params });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get user's coin statistics
   * @returns {Promise} Coin statistics
   */
  getCoinStats: async () => {
    try {
      const response = await axiosClient.get('/api/coins/stats');
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get expiring coins alert
   * @param {number} days - Number of days to check
   * @returns {Promise} Expiring coins data
   */
  getExpiringCoins: async (days = 7) => {
    try {
      const response = await axiosClient.get('/api/coins/expiring', {
        params: { days },
      });
      return response;
    } catch (error) {
      throw error;
    }
  },
};

export default coinService;
