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
  getComplete: async () => await axiosClient.get(BASE_URL),

  /**
   * Get revenue statistics
   * @returns {Promise} Revenue data (today, thisWeek, thisMonth, thisYear, total)
   */
  getRevenue: async () => await axiosClient.get(`${BASE_URL}/revenue`),

  /**
   * Get revenue trend over time
   * @param {object} params - Query parameters
   * @param {string} [params.period='daily'] - Period type: 'daily', 'weekly', 'monthly'
   * @returns {Promise} Revenue trend data grouped by period
   */
  getRevenueTrend: async (params = {}) =>
    await axiosClient.get(`${BASE_URL}/revenue-trend`, { params }),

  /**
   * Get best selling products
   * @param {object} params - Query parameters
   * @param {number} [params.limit=5] - Number of products to retrieve
   * @returns {Promise} List of best selling products with sales metrics
   */
  getBestSellers: async (params = {}) =>
    await axiosClient.get(`${BASE_URL}/best-sellers`, { params }),

  /**
   * Get low stock products (inventory alert)
   * @param {object} params - Query parameters
   * @param {number} [params.threshold=20] - Stock level threshold
   * @param {number} [params.limit=10] - Number of products to retrieve
   * @returns {Promise} List of low stock products with alert details
   */
  getLowStock: async (params = {}) => await axiosClient.get(`${BASE_URL}/low-stock`, { params }),

  /**
   * Get order statistics
   * @returns {Promise} Order data (total, pending, processing, shipped, delivered, cancelled, averageValue)
   */
  getOrderStats: async () => await axiosClient.get(`${BASE_URL}/order-stats`),

  /**
   * Get customer statistics
   * @returns {Promise} Customer data (totalCustomers, repeatCustomers, newCustomers, repeatedPurchaseRate)
   */
  getCustomerStats: async () => await axiosClient.get(`${BASE_URL}/customer-stats`),

  /**
   * Get detailed product analytics
   * @param {object} params - Query parameters
   * @param {number} [params.limit=10] - Number of products to retrieve
   * @returns {Promise} Detailed product analytics (quantity, revenue, profit, orders)
   */
  getProductAnalytics: async (params = {}) =>
    await axiosClient.get(`${BASE_URL}/product-analytics`, { params }),

  /**
   * Get sales trend for specified number of days
   * @param {object} params - Query parameters
   * @param {number} [params.days=30] - Number of days to retrieve
   * @returns {Promise} Sales trend data (sales, revenue, quantity per day)
   */
  getSalesTrend: async (params = {}) =>
    await axiosClient.get(`${BASE_URL}/sales-trend`, { params }),

  /**
   * Get comparison statistics (current vs previous period)
   * @param {object} params - Query parameters
   * @param {string} [params.period='month'] - Calendar: 'month', 'week'. Rolling (matches revenue-trend): 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
   * @returns {Promise} Comparison data with growth percentages
   */
  getComparison: async (params = {}) => await axiosClient.get(`${BASE_URL}/comparison`, { params }),

  /**
   * Get profit and loss analysis by period
   * @param {object} params - Query parameters
   * @param {string} [params.period='daily'] - Period type: 'daily', 'weekly', 'monthly', 'quarterly', 'yearly'
   * @returns {Promise} P&L data grouped by period with { _id, revenue, cost, quantity, orders, profit }
   */
  getProfitLossAnalysis: async (params = {}) => await axiosClient.get(`${BASE_URL}/profit-loss`, { params }),

  /**
   * Get expense analysis (product cost vs shipping cost)
   * @param {object} params - Query parameters
   * @param {string} [params.period='monthly'] - Period type: 'daily', 'weekly', 'monthly', 'quarterly', 'yearly'
   * @returns {Promise} Expense breakdown with { totalProductCost, totalShippingCost, totalExpense, breakdownByType }
   */
  getExpenseAnalysis: async (params = {}) => await axiosClient.get(`${BASE_URL}/expense`, { params }),

  /**
   * Get top selling products with profit analysis
   * @param {object} params - Query parameters
   * @param {number} [params.limit=10] - Number of products to retrieve
   * @param {string} [params.period='monthly'] - Period type: 'daily', 'weekly', 'monthly', 'quarterly', 'yearly'
   * @returns {Promise} Array of products with { _id, name, totalQuantity, totalRevenue, cost, profit, profitMargin }
   */
  getTopSellingProductsWithProfit: async (params = {}) => await axiosClient.get(`${BASE_URL}/top-products-profit`, { params }),

  /**
   * Get product analytics by category
   * @param {object} params - Query parameters
   * @param {string} [params.period='monthly'] - Period type: 'daily', 'weekly', 'monthly', 'quarterly', 'yearly'
   * @param {number} [params.limit=8] - Number of categories to retrieve
   * @returns {Promise} { categories: [{categoryName, totalRevenue, totalQuantity, profit, profitMargin, revenuePercent}], totalRevenue, totalQuantity, totalProfit, period }
   */
  getProductAnalyticsByCategory: async (params = {}) =>
    await axiosClient.get(`${BASE_URL}/product-by-category`, { params }),

  // ============= ADMIN DASHBOARD ENDPOINTS =============

  /**
   * Get overview statistics for admin dashboard
   * @returns {Promise} Overview stats (revenue, orders, users, products with trends)
   */
  getOverviewStats: async () => await axiosClient.get(`${BASE_URL}/overview-stats`),

  /**
   * Get top selling products (Admin only)
   * @param {object} params - Query parameters
   * @param {number} [params.limit=5] - Number of products to retrieve
   * @returns {Promise} List of top products with sales data
   */
  getTopProducts: async (params = {}) =>
    await axiosClient.get(`${BASE_URL}/top-products`, { params }),

  /**
   * Get recent orders (Admin only)
   * @param {object} params - Query parameters
   * @param {number} [params.limit=5] - Number of orders to retrieve
   * @returns {Promise} List of recent orders
   */
  getRecentOrders: async (params = {}) =>
    await axiosClient.get(`${BASE_URL}/recent-orders`, { params }),

  /**
   * Get category sales distribution (Admin only)
   * @returns {Promise} Category sales with percentages
   */
  getCategorySales: async () => await axiosClient.get(`${BASE_URL}/category-sales`),

  /**
   * Get revenue data by period (Admin only)
   * @param {object} params - Query parameters
   * @param {string} [params.period='monthly'] - Period type: 'monthly' or 'yearly'
   * @returns {Promise} Revenue data grouped by period
   */
  getRevenueData: async (params = {}) =>
    await axiosClient.get(`${BASE_URL}/revenue-data`, { params }),

  /**
   * Get user growth data by period (Admin only)
   * @param {object} params - Query parameters
   * @param {string} [params.period='monthly'] - Period type: 'monthly' or 'yearly'
   * @returns {Promise} User growth data grouped by period
   */
  getUserGrowth: async (params = {}) =>
    await axiosClient.get(`${BASE_URL}/user-growth`, { params }),

  /**
   * Get quick statistics (Admin only)
   * @returns {Promise} Quick stats (pending orders, low stock items, new users today, customer satisfaction)
   */
  getQuickStats: async () => await axiosClient.get(`${BASE_URL}/quick-stats`),

  /**
   * Get all dashboard data in one request (Admin only)
   * @param {object} params - Query parameters
   * @param {number} [params.topProductsLimit=5] - Number of top products
   * @param {number} [params.recentOrdersLimit=5] - Number of recent orders
   * @returns {Promise} All dashboard data including overview, products, orders, sales, revenue, users, quick stats
   */
  getAllDashboardData: async (params = {}) =>
    await axiosClient.get(`${BASE_URL}/admin/all`, { params }),

  /**
   * Get seller order counts by status (for Immediate To-Do section)
   * @returns {Promise} { pending, confirmed, packing, shipping, toShip, cancellationCount, rmaCount }
   */
  getSellerOrderCounts: async () => await axiosClient.get(`${BASE_URL}/seller-order-counts`),

  /**
   * Get recent orders filtered by seller products (for detail modal)
   * @param {object} params - Query parameters
   * @param {number} [params.limit=20] - Number of orders to retrieve
   * @returns {Promise} Array of { _id, orderNumber, customer, email, phone, totalPrice, status, statusLabel, statusColor, itemsCount, createdAt, createdAtStr }
   */
  getSellerRecentOrders: async (params = {}) =>
    await axiosClient.get(`${BASE_URL}/seller-recent-orders`, { params }),
};

export default dashboardService;
