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
};

export default inventoryService;
