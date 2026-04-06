import axiosClient from '../axiosClient';

// Backend routes are at /api/inventory (NOT /api/v1/inventory)
const BASE = '/api/inventory';

const inventoryService = {
  /**
   * Adjust stock to a specific quantity (direct set)
   * POST /api/inventory/adjust
   * body: { productId, modelId, sku, newStock, note?, warehouseId? }
   */
  adjustStock: async (data) => axiosClient.post(`${BASE}/adjust`, data),

  /**
   * Add incoming stock
   * POST /api/inventory/stock-in
   * body: { productId, modelId, sku, quantity, costPrice?, note?, warehouseId? }
   */
  stockIn: async (data) => axiosClient.post(`${BASE}/stock-in`, data),

  /**
   * Remove stock (manual out)
   * POST /api/inventory/stock-out
   * body: { productId, modelId, sku, quantity, note?, warehouseId? }
   */
  stockOut: async (data) => axiosClient.post(`${BASE}/stock-out`, data),

  /**
   * Bulk update multiple SKUs at once
   * POST /api/inventory/bulk-update
   * body: { updates: [{ productId, modelId, sku, newStock, note? }] }
   */
  bulkUpdate: async (updates) => axiosClient.post(`${BASE}/bulk-update`, { updates }),

  /**
   * List all transactions (movements), filterable
   * GET /api/inventory/transactions
   * params: { productId?, sku?, type?, startDate?, endDate?, page?, limit? }
   */
  getTransactions: async (params = {}) => axiosClient.get(`${BASE}/transactions`, { params }),

  /**
   * Single transaction by ID
   * GET /api/inventory/transactions/:id
   */
  getTransaction: async (id) => axiosClient.get(`${BASE}/transactions/${id}`),

  /**
   * Product inventory summary (all models/SKUs for one product)
   * GET /api/inventory/summary/:productId
   */
  getProductSummary: async (productId) => axiosClient.get(`${BASE}/summary/${productId}`),

  /**
   * Aggregate stats (total stock, low stock count, out of stock count, etc.)
   * GET /api/inventory/stats
   * params: { startDate?, endDate?, productId? }
   */
  getStats: async (params = {}) => axiosClient.get(`${BASE}/stats`, { params }),

  /**
   * Get FIFO lot breakdown for a single SKU
   * GET /api/inventory/lots/:sku
   * Returns remaining stock per import batch (transaction "in")
   */
  getLotBreakdown: async (sku, warehouseId = null) => {
    const params = warehouseId ? { warehouseId } : {};
    return axiosClient.get(`${BASE}/lots/${encodeURIComponent(sku)}`, { params });
  },

  /**
   * Get demand forecast and restock alerts for seller
   * GET /api/inventory/demand-forecast
   * params: { days?: number } (default 90 days)
   */
  getDemandForecast: async (params = {}) =>
    axiosClient.get(`${BASE}/demand-forecast`, { params }),

  /**
   * Get detailed product performance with weekly breakdown
   * GET /api/inventory/product-performance/:productId
   * params: { weeks?: number } (default 12 weeks)
   */
  getProductPerformance: async (productId, params = {}) =>
    axiosClient.get(`${BASE}/product-performance/${productId}`, { params }),

  /**
   * Get rich demand analysis details for a single product (chart data + web insights)
   * GET /api/inventory/demand-forecast/:productId/details
   * params: { days?: number } (default 30 days)
   */
  getProductDemandDetails: async (productId, params = {}) =>
    axiosClient.get(`${BASE}/demand-forecast/${productId}/details`, { params }),
};

export default inventoryService;
