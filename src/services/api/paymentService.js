import { api } from '../axiosClient';

export const paymentService = {
  // Create PayOS payment link for an order
  createPaymentLink: async (orderId) => {
    return await api.post('/api/payments/create-link', { orderId });
  },

  // Get payment status by orderCode
  getPaymentStatus: async (orderCode) => {
    return await api.get(`/api/payments/status/${orderCode}`);
  },

  // Check payment status from PayOS directly
  checkPaymentFromPayOS: async (orderCode) => {
    return await api.get(`/api/payments/check/${orderCode}`);
  },

  // Cancel pending payment
  cancelPayment: async (orderCode) => {
    return await api.put(`/api/payments/cancel/${orderCode}`);
  },
};
