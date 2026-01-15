/**
 * Brand Service - APIs for Brands
 * Handles brand listing and brand-specific products
 */

import axiosClient from '../axiosClient';

const brandService = {
  /**
   * Get all brands
   * @returns {Promise} Brands data
   */
  getAllBrands: async () => {
    try {
      const response = await axiosClient.get('/api/brands');
      return response.data;
    } catch (error) {
      console.error('Error fetching all brands:', error);
      throw error;
    }
  },

  /**
   * Get top brands (most popular)
   * @param {number} limit - Number of brands to fetch
   * @returns {Promise} Top brands data
   */
  getTopBrands: async (limit = 10) => {
    try {
      const response = await axiosClient.get('/api/brands/top', {
        params: { limit },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching top brands:', error);
      throw error;
    }
  },

  /**
   * Get brand by ID
   * @param {string} brandId - Brand ID
   * @returns {Promise} Brand details
   */
  getBrandById: async (brandId) => {
    try {
      const response = await axiosClient.get(`/api/brands/${brandId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching brand details:', error);
      throw error;
    }
  },

  /**
   * Get products by brand
   * @param {string} brandId - Brand ID
   * @param {Object} params - Query parameters (page, limit, sort)
   * @returns {Promise} Products data
   */
  getProductsByBrand: async (brandId, params = {}) => {
    try {
      const response = await axiosClient.get(`/api/brands/${brandId}/products`, {
        params,
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching products by brand:', error);
      throw error;
    }
  },
};

export default brandService;
