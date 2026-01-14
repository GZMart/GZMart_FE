import axiosClient from '../axiosClient';

const BASE_URL = '/api/dashboard';

/**
 * Dashboard Analytics API Service
 * Handles all dashboard and statistics operations for sellers
 */
export const dashboardService = {
  /**
   * Get complete dashboard overview
   * @returns {Promise} Complete dashboard data (revenue, best sellers, low stock, order stats, customer stats)
   */
  getComplete: async () => {
    return await axiosClient.get(BASE_URL);
  },

  /**
   * Get revenue statistics
   * @returns {Promise} Revenue data (today, thisWeek, thisMonth, thisYear, total)
   */
  getRevenue: async () => {
    return await axiosClient.get(`${BASE_URL}/revenue`);
  },

  /**
   * Get revenue trend over time
   * @param {object} params - Query parameters
   * @param {string} [params.period='daily'] - Period type: 'daily', 'weekly', 'monthly'
   * @returns {Promise} Revenue trend data grouped by period
   */
  getRevenueTrend: async (params = {}) => {
    return await axiosClient.get(`${BASE_URL}/revenue-trend`, { params });
  },

  /**
   * Get best selling products
   * @param {object} params - Query parameters
   * @param {number} [params.limit=5] - Number of products to retrieve
   * @returns {Promise} List of best selling products with sales metrics
   */
  getBestSellers: async (params = {}) => {
    return await axiosClient.get(`${BASE_URL}/best-sellers`, { params });
  },

  /**
   * Get low stock products (inventory alert)
   * @param {object} params - Query parameters
   * @param {number} [params.threshold=20] - Stock level threshold
   * @param {number} [params.limit=10] - Number of products to retrieve
   * @returns {Promise} List of low stock products with alert details
   */
  getLowStock: async (params = {}) => {
    return await axiosClient.get(`${BASE_URL}/low-stock`, { params });
  },

  /**
   * Get order statistics
   * @returns {Promise} Order data (total, pending, processing, shipped, delivered, cancelled, averageValue)
   */
  getOrderStats: async () => {
    return await axiosClient.get(`${BASE_URL}/order-stats`);
  },

  /**
   * Get customer statistics
   * @returns {Promise} Customer data (totalCustomers, repeatCustomers, newCustomers, repeatedPurchaseRate)
   */
  getCustomerStats: async () => {
    return await axiosClient.get(`${BASE_URL}/customer-stats`);
  },

  /**
   * Get detailed product analytics
   * @param {object} params - Query parameters
   * @param {number} [params.limit=10] - Number of products to retrieve
   * @returns {Promise} Detailed product analytics (quantity, revenue, profit, orders)
   */
  getProductAnalytics: async (params = {}) => {
    return await axiosClient.get(`${BASE_URL}/product-analytics`, { params });
  },

  /**
   * Get sales trend for specified number of days
   * @param {object} params - Query parameters
   * @param {number} [params.days=30] - Number of days to retrieve
   * @returns {Promise} Sales trend data (sales, revenue, quantity per day)
   */
  getSalesTrend: async (params = {}) => {
    return await axiosClient.get(`${BASE_URL}/sales-trend`, { params });
  },

  /**
   * Get comparison statistics (current vs previous period)
   * @param {object} params - Query parameters
   * @param {string} [params.period='month'] - Period type: 'month' or 'week'
   * @returns {Promise} Comparison data with growth percentages
   */
  getComparison: async (params = {}) => {
    return await axiosClient.get(`${BASE_URL}/comparison`, { params });
  },
};

export default dashboardService;
