import axiosClient from '../axiosClient';

const BASE_URL = '/api/search';

/**
 * Search Service
 * Handles all search-related API calls
 */
const searchService = {
  /**
   * Search products with keyword
   * @param {string} query - Search query
   * @param {object} params - Additional query parameters (page, limit, sort, etc.)
   * @returns {Promise} Search results
   */
  searchProducts: async (query, params = {}) => {
    return await axiosClient.get(`${BASE_URL}`, { params: { q: query, ...params } });
  },

  /**
   * Advanced search with multiple filters
   * @param {string} query - Search query
   * @param {object} filters - Advanced filters (category, brand, priceRange, etc.)
   * @returns {Promise} Advanced search results
   */
  advancedSearch: async (query, filters = {}) => {
    return await axiosClient.get(`${BASE_URL}/advanced`, {
      params: { q: query, ...filters },
    });
  },

  /**
   * Get search suggestions for autocomplete
   * @param {string} query - Partial search query
   * @param {number} limit - Maximum number of suggestions
   * @returns {Promise} Search suggestions
   */
  getSuggestions: async (query, limit = 10) => {
    return await axiosClient.get(`${BASE_URL}/suggestions`, {
      params: { q: query, limit },
    });
  },

  /**
   * Get autocomplete results (products, categories, brands)
   * @param {string} query - Partial search query
   * @returns {Promise} Autocomplete results
   */
  getAutocomplete: async (query) => {
    return await axiosClient.get(`${BASE_URL}/autocomplete`, {
      params: { q: query },
    });
  },

  /**
   * Get available filters for search results
   * @param {string} query - Search query
   * @param {object} currentFilters - Currently applied filters
   * @returns {Promise} Available filters (brands, categories, price ranges, etc.)
   */
  getFilters: async (query, currentFilters = {}) => {
    return await axiosClient.get(`${BASE_URL}/filters`, {
      params: { q: query, ...currentFilters },
    });
  },
};

export default searchService;
