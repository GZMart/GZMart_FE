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
  checkEligibility: async (orderId) => {
    return axiosClient.get(`/api/rma/eligibility/${orderId}`);
  },

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
  createReturnRequest: async (data) => {
    console.log('🔵 [RETURN/REFUND REQUEST API] Request:', {
      endpoint: 'POST /api/rma/requests',
      data: data,
      timestamp: new Date().toISOString(),
    });

    try {
      const response = await axiosClient.post('/api/rma/requests', data);
      console.log('✅ [RETURN/REFUND REQUEST API] Response:', {
        status: response.status,
        data: response.data,
        timestamp: new Date().toISOString(),
      });
      return response;
    } catch (error) {
      console.error('❌ [RETURN/REFUND REQUEST API] Error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  },

  /**
   * Get user's return requests
   */
  getMyReturnRequests: async (params = {}) => {
    return axiosClient.get('/api/rma/requests', { params });
  },

  /**
   * Get return request details
   */
  getReturnRequestById: async (id) => {
    return axiosClient.get(`/api/rma/requests/${id}`);
  },

  /**
   * Cancel return request (before seller responds)
   */
  cancelReturnRequest: async (id) => {
    return axiosClient.put(`/api/rma/requests/${id}/cancel`);
  },

  // ==================== WALLET ENDPOINTS ====================

  /**
   * Get wallet balance and transaction history
   */
  getWalletInfo: async () => {
    return axiosClient.get('/api/rma/wallet');
  },

  /**
   * Get wallet transaction details
   */
  getTransactionById: async (id) => {
    return axiosClient.get(`/api/rma/wallet/transactions/${id}`);
  },

  // ==================== SELLER ENDPOINTS ====================

  /**
   * Get all return requests for seller
   */
  getSellerReturnRequests: async (params = {}) => {
    return axiosClient.get('/api/rma/seller/requests', { params });
  },

  /**
   * Approve or reject return request
   * @param {string} id - Request ID
   * @param {Object} data - Response data
   * @param {string} data.decision - 'approve' or 'reject'
   * @param {string} data.notes - Response notes
   */
  respondToReturnRequest: async (id, data) => {
    return axiosClient.put(`/api/rma/seller/requests/${id}/respond`, data);
  },

  /**
   * Process refund (add coins to buyer wallet)
   */
  processRefund: async (id) => {
    return axiosClient.post(`/api/rma/seller/requests/${id}/process-refund`);
  },

  /**
   * Process exchange (create new order)
   */
  processExchange: async (id) => {
    return axiosClient.post(`/api/rma/seller/requests/${id}/process-exchange`);
  },

  // ==================== ADMIN ENDPOINTS ====================

  /**
   * Get all return requests (Admin)
   */
  getAllReturnRequests: async (params = {}) => {
    return axiosClient.get('/api/rma/admin/requests', { params });
  },

  /**
   * Manually process refund or exchange (Admin override)
   * @param {string} id - Request ID
   * @param {Object} data - Action data
   * @param {string} data.action - 'refund' or 'exchange'
   */
  adminProcessRequest: async (id, data) => {
    return axiosClient.post(`/api/rma/admin/requests/${id}/process`, data);
  },
};

export default rmaService;
