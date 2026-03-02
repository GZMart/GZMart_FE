/**
 * Deal Service - APIs for Deals and Promotions
 * Handles flash sales, daily deals, weekend deals, deal details, and my deals.
 *
 * Base URL: /api/deals
 */

import axiosClient from '../axiosClient';

const dealService = {
  /**
   * Get all active deals (paginated)
   * GET /api/deals
   * @param {object} params - { page, limit }
   */
  getActiveDeals: (params = {}) =>
    axiosClient.get('/api/deals', { params }),

  /** @deprecated use getActiveDeals() */
  getAllDeals: (params = {}) =>
    axiosClient.get('/api/deals', { params }),

  /**
   * Get only flash_sale type deals
   * GET /api/deals/flash-sales
   * @param {object} params - { page, limit }
   */
  getFlashSaleDeals: (params = {}) =>
    axiosClient.get('/api/deals/flash-sales', { params }),

  /** @deprecated use getFlashSaleDeals() */
  getFlashSales: (params = {}) =>
    axiosClient.get('/api/deals/flash-sales', { params }),

  /**
   * Get only daily_deal type deals
   * GET /api/deals/daily-deals
   * @param {object} params - { page, limit }
   */
  getDailyDeals: (params = {}) =>
    axiosClient.get('/api/deals/daily-deals', { params }),

  /**
   * Get only weekly_deal type deals (Weekend Deals)
   * GET /api/deals/weekend-deals
   * @param {object} params - { page, limit }
   */
  getWeekendDeals: (params = {}) =>
    axiosClient.get('/api/deals/weekend-deals', { params }),

  /**
   * Get product-level deal badge info
   * GET /api/deals/product/:productId
   * @param {string} productId
   */
  getDealByProduct: (productId) =>
    axiosClient.get(`/api/deals/product/${productId}`),

  /**
   * Get full deal details by deal ID — used by DealDetailsPage
   * GET /api/deals/:dealId
   *
   * Response shape:
   *   deal.dealPrice           → discounted price to display
   *   deal.productId.originalPrice → original price (strikethrough)
   *   deal.discountPercent     → % off badge
   *   deal.endDate             → countdown timer
   *   deal.soldCount           → buyers filled
   *   deal.quantityLimit       → max buyers / members
   *   deal.productId.tier_variations → variant selectors
   *
   * @param {string} dealId
   */
  getDealById: (dealId) =>
    axiosClient.get(`/api/deals/${dealId}`),

  /**
   * Get authenticated user's deals (pending + approved)
   * GET /api/deals/my-deals  🔒 Requires Authorization header
   *
   * Response: { success, pendingDeals: [], approvedDeals: [] }
   * NOTE: BE currently returns empty arrays (stub). Display empty state gracefully.
   */
  getMyDeals: () =>
    axiosClient.get('/api/deals/my-deals'),
};

export default dealService;
