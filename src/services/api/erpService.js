import axiosClient from '../axiosClient';

/**
 * ===================================================================
 * ERP / SOURCING API SERVICE
 * Handles Supplier, Purchase Order, Inventory, and Reporting APIs
 *
 * NOTE: axiosClient interceptor already unwraps response.data,
 * so these functions return the parsed response directly.
 * ===================================================================
 */

const PO_BASE  = '/api/purchase-orders';
const SUP_BASE = '/api/purchase-orders/suppliers';
const INV_BASE = '/api/purchase-orders/inventory';
const REP_BASE = '/api/purchase-orders/reports';
const XR_BASE  = '/api/exchange-rate';

// ============================================================
// SELLER PRODUCTS (for PO Listing Picker)
// ============================================================

/**
 * Get seller's own product listings (to pre-fill PO items)
 */
export const getMyProducts = async (params = {}) => {
  return axiosClient.get('/api/products/my-products', { params });
};

// ============================================================
// PURCHASE ORDERS
// ============================================================

/**
 * Create new purchase order
 */
export const createPurchaseOrder = async (orderData) => {
  return axiosClient.post(PO_BASE, orderData);
};

/**
 * Get all purchase orders with filters
 */
export const getPurchaseOrders = async (params = {}) => {
  return axiosClient.get(PO_BASE, { params });
};

/**
 * Get purchase order by ID
 */
export const getPurchaseOrderById = async (id) => {
  return axiosClient.get(`${PO_BASE}/${id}`);
};

/**
 * Update purchase order
 */
export const updatePurchaseOrder = async (id, updateData) => {
  return axiosClient.put(`${PO_BASE}/${id}`, updateData);
};

/**
 * Complete purchase order (nhập kho)
 */
export const completePurchaseOrder = async (id) => {
  return axiosClient.post(`${PO_BASE}/${id}/complete`);
};

/**
 * Cancel purchase order
 */
export const cancelPurchaseOrder = async (id, cancelReason) => {
  return axiosClient.post(`${PO_BASE}/${id}/cancel`, { cancelReason });
};

// ============================================================
// SUPPLIERS
// ============================================================

/**
 * Create new supplier
 */
export const createSupplier = async (supplierData) => {
  return axiosClient.post(SUP_BASE, supplierData);
};

/**
 * Get all suppliers
 */
export const getSuppliers = async (params = {}) => {
  return axiosClient.get(SUP_BASE, { params });
};

/**
 * Get supplier by ID
 */
export const getSupplierById = async (id) => {
  return axiosClient.get(`${SUP_BASE}/${id}`);
};

/**
 * Update supplier
 */
export const updateSupplier = async (id, updateData) => {
  return axiosClient.put(`${SUP_BASE}/${id}`, updateData);
};

/**
 * Delete supplier
 */
export const deleteSupplier = async (id) => {
  return axiosClient.delete(`${SUP_BASE}/${id}`);
};

/**
 * Get supplier purchase history
 */
export const getSupplierPurchaseHistory = async (id, params = {}) => {
  return axiosClient.get(`${SUP_BASE}/${id}/purchase-history`, { params });
};

// ============================================================
// INVENTORY MANAGEMENT
// ============================================================

/**
 * Get low stock items
 */
export const getLowStockItems = async (params = {}) => {
  return axiosClient.get(`${INV_BASE}/low-stock`, { params });
};

/**
 * Get inventory valuation
 */
export const getInventoryValuation = async (params = {}) => {
  return axiosClient.get(`${INV_BASE}/valuation`, { params });
};

// ============================================================
// REPORTS
// ============================================================

/**
 * Get Profit & Loss report
 */
export const getProfitLossReport = async (startDate, endDate) => {
  return axiosClient.get(`${REP_BASE}/profit-loss`, {
    params: { startDate, endDate },
  });
};

// ============================================================
// EXCHANGE RATE
// ============================================================

/**
 * Get the current active CNY→VND exchange rate
 */
export const getExchangeRate = async () => {
  return axiosClient.get(XR_BASE);
};

/**
 * Manually override the exchange rate (admin/manager)
 * @param {Number} rate
 * @param {String} [note]
 */
export const updateExchangeRate = async (rate, note) => {
  return axiosClient.put(XR_BASE, { rate, note });
};

/**
 * Force an immediate sync from external APIs (admin/manager)
 */
export const syncExchangeRate = async () => {
  return axiosClient.post(`${XR_BASE}/sync`);
};

export default {
  // Purchase Orders
  createPurchaseOrder,
  getPurchaseOrders,
  getPurchaseOrderById,
  updatePurchaseOrder,
  completePurchaseOrder,
  cancelPurchaseOrder,
  // Suppliers
  createSupplier,
  getSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier,
  getSupplierPurchaseHistory,
  // Inventory
  getLowStockItems,
  getInventoryValuation,
  // Reports
  getProfitLossReport,
  // Exchange Rate
  getExchangeRate,
  updateExchangeRate,
  syncExchangeRate,
};
