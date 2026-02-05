import axiosClient from '../axiosClient';

/**
 * ===================================================================
 * ERP / SOURCING API SERVICE
 * Handles Supplier, Purchase Order, Inventory, and Reporting APIs
 * ===================================================================
 */

// ============================================================
// PURCHASE ORDERS
// ============================================================

/**
 * Create new purchase order
 */
export const createPurchaseOrder = async (orderData) => {
  const response = await axiosClient.post('/purchase-orders', orderData);
  return response.data;
};

/**
 * Get all purchase orders with filters
 */
export const getPurchaseOrders = async (params = {}) => {
  const response = await axiosClient.get('/purchase-orders', { params });
  return response.data;
};

/**
 * Get purchase order by ID
 */
export const getPurchaseOrderById = async (id) => {
  const response = await axiosClient.get(`/purchase-orders/${id}`);
  return response.data;
};

/**
 * Update purchase order
 */
export const updatePurchaseOrder = async (id, updateData) => {
  const response = await axiosClient.put(`/purchase-orders/${id}`, updateData);
  return response.data;
};

/**
 * Complete purchase order (nhập kho)
 */
export const completePurchaseOrder = async (id) => {
  const response = await axiosClient.post(`/purchase-orders/${id}/complete`);
  return response.data;
};

/**
 * Cancel purchase order
 */
export const cancelPurchaseOrder = async (id, cancelReason) => {
  const response = await axiosClient.post(`/purchase-orders/${id}/cancel`, {
    cancelReason,
  });
  return response.data;
};

// ============================================================
// SUPPLIERS
// ============================================================

/**
 * Create new supplier
 */
export const createSupplier = async (supplierData) => {
  const response = await axiosClient.post('/purchase-orders/suppliers', supplierData);
  return response.data;
};

/**
 * Get all suppliers
 */
export const getSuppliers = async (params = {}) => {
  const response = await axiosClient.get('/purchase-orders/suppliers', { params });
  return response.data;
};

/**
 * Get supplier by ID
 */
export const getSupplierById = async (id) => {
  const response = await axiosClient.get(`/purchase-orders/suppliers/${id}`);
  return response.data;
};

/**
 * Update supplier
 */
export const updateSupplier = async (id, updateData) => {
  const response = await axiosClient.put(`/purchase-orders/suppliers/${id}`, updateData);
  return response.data;
};

/**
 * Delete supplier
 */
export const deleteSupplier = async (id) => {
  const response = await axiosClient.delete(`/purchase-orders/suppliers/${id}`);
  return response.data;
};

/**
 * Get supplier purchase history
 */
export const getSupplierPurchaseHistory = async (id, params = {}) => {
  const response = await axiosClient.get(`/purchase-orders/suppliers/${id}/purchase-history`, {
    params,
  });
  return response.data;
};

// ============================================================
// INVENTORY MANAGEMENT
// ============================================================

/**
 * Get low stock items
 */
export const getLowStockItems = async (params = {}) => {
  const response = await axiosClient.get('/purchase-orders/inventory/low-stock', {
    params,
  });
  return response.data;
};

/**
 * Get inventory valuation
 */
export const getInventoryValuation = async (params = {}) => {
  const response = await axiosClient.get('/purchase-orders/inventory/valuation', {
    params,
  });
  return response.data;
};

// ============================================================
// REPORTS
// ============================================================

/**
 * Get Profit & Loss report
 */
export const getProfitLossReport = async (startDate, endDate) => {
  const response = await axiosClient.get('/purchase-orders/reports/profit-loss', {
    params: { startDate, endDate },
  });
  return response.data;
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
};
