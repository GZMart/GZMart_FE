/**
 * Home Service - APIs for Homepage
 * Handles banners, deals, featured content
 */

import axiosClient from '../axiosClient';

const homeService = {
  /**
   * Get all homepage sections (banners + deals + featured products + categories)
   * @returns {Promise} Homepage sections data
   */
  getHomeSections: async () => {
    try {
      const response = await axiosClient.get('/api/home/sections');
      return response.data;
    } catch (error) {
      console.error('Error fetching home sections:', error);
      throw error;
    }
  },

  /**
   * Get banners for hero section
   * @returns {Promise} Banners data
   */
  getBanners: async () => {
    try {
      const response = await axiosClient.get('/api/home/banners');
      return response.data;
    } catch (error) {
      console.error('Error fetching banners:', error);
      throw error;
    }
  },

  /**
   * Get deals of the day
   * @returns {Promise} Deals data
   */
  getDealsOfTheDay: async () => {
    try {
      const response = await axiosClient.get('/api/home/deals-of-the-day');
      return response.data;
    } catch (error) {
      console.error('Error fetching deals of the day:', error);
      throw error;
    }
  },

  /**
   * Increment banner click count (for analytics)
   * @param {string} bannerId - Banner ID
   * @returns {Promise}
   */
  incrementBannerClick: async (bannerId) => {
    try {
      const response = await axiosClient.post(`/api/home/banners/${bannerId}/click`);
      return response.data;
    } catch (error) {
      console.error('Error incrementing banner click:', error);
      throw error;
    }
  },
};

export default homeService;
