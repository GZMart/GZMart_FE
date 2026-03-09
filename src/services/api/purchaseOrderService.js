import { api } from '../axiosClient';

const BASE_URL = '/api/purchase-orders';
const SUPPLIER_URL = '/api/purchase-orders/suppliers';

/**
 * Purchase Order API Service (ERP Module)
 */
export const purchaseOrderService = {
  /**
   * Get all purchase orders
   * @param {object} params - Query parameters (status, supplier, date range, etc.)
   * @returns {Promise} Purchase orders list
   */
  getPurchaseOrders: async (params = {}) => {
    return api.get(BASE_URL, { params });
  },

  /**
   * Get single purchase order by ID
   * @param {string} id - PO ID
   * @returns {Promise} Purchase order details
   */
  getPurchaseOrderById: async (id) => {
    return api.get(`${BASE_URL}/${id}`);
  },

  /**
   * Create new purchase order
   * @param {object} poData - PO data
   * @returns {Promise} Created purchase order
   */
  createPurchaseOrder: async (poData) => {
    return api.post(BASE_URL, poData);
  },

  /**
   * Update purchase order
   * @param {string} id - PO ID
   * @param {object} poData - Updated PO data
   * @returns {Promise} Updated purchase order
   */
  updatePurchaseOrder: async (id, poData) => {
    return api.put(`${BASE_URL}/${id}`, poData);
  },

  /**
   * Delete purchase order
   * @param {string} id - PO ID
   * @returns {Promise} Deletion response
   */
  deletePurchaseOrder: async (id) => {
    return api.delete(`${BASE_URL}/${id}`);
  },

  /**
   * Submit purchase order for approval
   * @param {string} id - PO ID
   * @returns {Promise} Submission response
   */
  submitPurchaseOrder: async (id) => {
    return api.post(`${BASE_URL}/${id}/submit`);
  },

  /**
   * Approve purchase order
   * @param {string} id - PO ID
   * @param {object} approvalData - Approval notes, etc.
   * @returns {Promise} Approval response
   */
  approvePurchaseOrder: async (id, approvalData = {}) => {
    return api.post(`${BASE_URL}/${id}/approve`, approvalData);
  },

  /**
   * Reject purchase order
   * @param {string} id - PO ID
   * @param {object} rejectionData - Rejection reason, etc.
   * @returns {Promise} Rejection response
   */
  rejectPurchaseOrder: async (id, rejectionData) => {
    return api.post(`${BASE_URL}/${id}/reject`, rejectionData);
  },

  /**
   * Mark PO as ordered
   * @param {string} id - PO ID
   * @param {object} orderData - Order confirmation data
   * @returns {Promise} Order confirmation response
   */
  markAsOrdered: async (id, orderData) => {
    return api.post(`${BASE_URL}/${id}/ordered`, orderData);
  },

  /**
   * Record goods receipt
   * @param {string} id - PO ID
   * @param {object} receiptData - Receipt data (items received, dates, etc.)
   * @returns {Promise} Receipt response
   */
  recordGoodsReceipt: async (id, receiptData) => {
    return api.post(`${BASE_URL}/${id}/receive`, receiptData);
  },

  /**
   * Close purchase order
   * @param {string} id - PO ID
   * @returns {Promise} Closure response
   */
  closePurchaseOrder: async (id) => {
    return api.post(`${BASE_URL}/${id}/close`);
  },

  /**
   * Cancel purchase order
   * @param {string} id - PO ID
   * @param {object} cancellationData - Cancellation reason
   * @returns {Promise} Cancellation response
   */
  cancelPurchaseOrder: async (id, cancellationData) => {
    return api.post(`${BASE_URL}/${id}/cancel`, cancellationData);
  },

  /**
   * Get PO statistics
   * @param {object} params - Query parameters (date range, etc.)
   * @returns {Promise} PO statistics
   */
  getStatistics: async (params = {}) => {
    return api.get(`${BASE_URL}/statistics`, { params });
  },

  /**
   * Export purchase orders to CSV/Excel
   * @param {object} params - Export parameters
   * @returns {Promise} Export file
   */
  exportPurchaseOrders: async (params = {}) => {
    return api.get(`${BASE_URL}/export`, {
      params,
      responseType: 'blob',
    });
  },

  /**
   * Complete purchase order (mark goods as received, updates inventory)
   * @param {string} id - PO ID
   * @returns {Promise} Completion response
   */
  completePurchaseOrder: async (id) => {
    return api.post(`${BASE_URL}/${id}/complete`);
  },

  /**
   * Preview landed cost calculation
   * @param {object} poData - PO data for calculation
   * @returns {Promise} Landed cost preview
   */
  calculateLandedCost: async (poData) => {
    return api.post(`${BASE_URL}/calculate`, poData);
  },

  // ─── Supplier Methods ─────────────────────────────────────────────────────

  /**
   * Get all suppliers
   * @param {object} params - Query parameters (status, search, limit, etc.)
   * @returns {Promise} Suppliers list
   */
  getSuppliers: async (params = {}) => {
    return api.get(SUPPLIER_URL, { params });
  },

  /**
   * Get supplier by ID
   * @param {string} id - Supplier ID
   * @returns {Promise} Supplier details
   */
  getSupplierById: async (id) => {
    return api.get(`${SUPPLIER_URL}/${id}`);
  },

  /**
   * Create new supplier
   * @param {object} supplierData - Supplier data
   * @returns {Promise} Created supplier
   */
  createSupplier: async (supplierData) => {
    return api.post(SUPPLIER_URL, supplierData);
  },

  /**
   * Update supplier
   * @param {string} id - Supplier ID
   * @param {object} supplierData - Updated supplier data
   * @returns {Promise} Updated supplier
   */
  updateSupplier: async (id, supplierData) => {
    return api.put(`${SUPPLIER_URL}/${id}`, supplierData);
  },

  /**
   * Delete supplier
   * @param {string} id - Supplier ID
   * @returns {Promise} Deletion response
   */
  deleteSupplier: async (id) => {
    return api.delete(`${SUPPLIER_URL}/${id}`);
  },

  /**
   * Get supplier purchase history
   * @param {string} id - Supplier ID
   * @param {object} params - Query parameters
   * @returns {Promise} Purchase history
   */
  getSupplierPurchaseHistory: async (id, params = {}) => {
    return api.get(`${SUPPLIER_URL}/${id}/purchase-history`, { params });
  },
};

export default purchaseOrderService;
