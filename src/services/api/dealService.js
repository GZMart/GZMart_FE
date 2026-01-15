/**
 * Deal Service - APIs for Deals and Promotions
 * Handles flash sales, daily deals, weekend deals
 */

import axiosClient from '../axiosClient';

const dealService = {
  /**
   * Get all active deals
   * @returns {Promise} All deals data
   */
  getAllDeals: async () => {
    try {
      const response = await axiosClient.get('/api/deals');
      return response.data;
    } catch (error) {
      console.error('Error fetching all deals:', error);
      throw error;
    }
  },

  /**
   * Get flash sales
   * @returns {Promise} Flash sales data
   */
  getFlashSales: async () => {
    try {
      const response = await axiosClient.get('/api/deals/flash-sales');
      return response.data;
    } catch (error) {
      console.error('Error fetching flash sales:', error);
      throw error;
    }
  },

  /**
   * Get daily deals
   * @returns {Promise} Daily deals data
   */
  getDailyDeals: async () => {
    try {
      const response = await axiosClient.get('/api/deals/daily-deals');
      return response.data;
    } catch (error) {
      console.error('Error fetching daily deals:', error);
      throw error;
    }
  },

  /**
   * Get weekend deals
   * @returns {Promise} Weekend deals data
   */
  getWeekendDeals: async () => {
    try {
      const response = await axiosClient.get('/api/deals/weekend-deals');
      return response.data;
    } catch (error) {
      console.error('Error fetching weekend deals:', error);
      throw error;
    }
  },

  /**
   * Get deal by product ID
   * @param {string} productId - Product ID
   * @returns {Promise} Deal data for specific product
   */
  getDealByProduct: async (productId) => {
    try {
      const response = await axiosClient.get(`/api/deals/product/${productId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching deal by product:', error);
      throw error;
    }
  },
};

export default dealService;
