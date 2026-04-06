import axiosClient from '../axiosClient';

/**
 * RMA (Return Merchandise Authorization) Service
 * Handles return/exchange requests and wallet transactions
 */

const rmaService = {
  // ==================== BUYER ENDPOINTS ====================

  /**
   * Check if order is eligible for return/exchange
   */
  checkEligibility: async (orderId) => axiosClient.get(`/api/rma/eligibility/${orderId}`),

  /**
   * Create a return/exchange request
   * @param {Object} data - Request data
   * @param {string} data.orderId - Order ID
   * @param {string} data.type - 'refund' or 'exchange'
   * @param {string} data.reason - Return reason
   * @param {string} data.description - Detailed description
   * @param {Array<string>} data.images - Evidence image URLs
   * @param {Array<Object>} data.items - Items to return
   */
  createReturnRequest: async (data) => axiosClient.post('/api/rma/requests', data),

  /**
   * Get user's return requests
   */
  getMyReturnRequests: async (params = {}) => axiosClient.get('/api/rma/requests', { params }),

  /**
   * Get latest return request by order for current buyer
   */
  getOrderReturnRequest: async (orderId) => axiosClient.get(`/api/rma/requests/order/${orderId}`),

  /**
   * Get return request details
   */
  getReturnRequestById: async (id) => axiosClient.get(`/api/rma/requests/${id}`),

  /**
   * Cancel return request (before seller responds)
   */
  cancelReturnRequest: async (id) => axiosClient.put(`/api/rma/requests/${id}/cancel`),

  /**
   * Buyer updates shipping info after handing item to courier
   */
  updateReturnShipping: async (id, data = {}) =>
    axiosClient.put(`/api/rma/requests/${id}/shipping`, data),

  /**
   * Buyer confirms handover at end of leg 1 (seller -> buyer)
   */
  confirmBuyerHandover: async (id, data = {}) =>
    axiosClient.put(`/api/rma/requests/${id}/confirm-handover`, data),

  // ==================== WALLET ENDPOINTS ====================

  /**
   * Get wallet balance and transaction history
   */
  getWalletInfo: async () => axiosClient.get('/api/rma/wallet'),

  /**
   * Get wallet transaction details
   */
  getTransactionById: async (id) => axiosClient.get(`/api/rma/wallet/transactions/${id}`),

  // ==================== SELLER ENDPOINTS ====================

  /**
   * Get all return requests for seller
   */
  getSellerReturnRequests: async (params = {}) =>
    axiosClient.get('/api/rma/seller/requests', { params }),

  /**
   * Approve or reject return request
   * @param {string} id - Request ID
   * @param {Object} data - Response data
   * @param {string} data.decision - 'approve' or 'reject'
   * @param {string} data.notes - Response notes
   */
  respondToReturnRequest: async (id, data) =>
    axiosClient.put(`/api/rma/seller/requests/${id}/respond`, data),

  /**
   * Seller confirms receiving returned faulty items
   */
  confirmItemsReceived: async (id, data = {}) =>
    axiosClient.put(`/api/rma/seller/requests/${id}/confirm-received`, data),

  /**
   * Process refund (add coins to buyer wallet)
   */
  processRefund: async (id) => axiosClient.post(`/api/rma/seller/requests/${id}/process-refund`),

  /**
   * Process exchange (create new order)
   */
  processExchange: async (id) =>
    axiosClient.post(`/api/rma/seller/requests/${id}/process-exchange`),

  // ==================== ADMIN ENDPOINTS ====================

  /**
   * Get all return requests (Admin)
   */
  getAllReturnRequests: async (params = {}) =>
    axiosClient.get('/api/rma/admin/requests', { params }),

  /**
   * Manually process refund or exchange (Admin override)
   * @param {string} id - Request ID
   * @param {Object} data - Action data
   * @param {string} data.action - 'refund' or 'exchange'
   */
  adminProcessRequest: async (id, data) =>
    axiosClient.post(`/api/rma/admin/requests/${id}/process`, data),
};

export default rmaService;
