import { api } from '../axiosClient';

export const paymentService = {
  // Create PayOS payment link for an order
  createPaymentLink: async (orderId) => await api.post('/api/payments/create-link', { orderId }),

  // Get payment status by orderCode
  getPaymentStatus: async (orderCode) => await api.get(`/api/payments/status/${orderCode}`),

  // Check payment status from PayOS directly
  checkPaymentFromPayOS: async (orderCode) => await api.get(`/api/payments/check/${orderCode}`),

  // Cancel pending payment
  cancelPayment: async (orderCode) => await api.put(`/api/payments/cancel/${orderCode}`),

  // Top up Wallet via PayOS
  createTopupLink: async (payload) => await api.post('/api/payments/wallet/create-link', payload),

  // Check topup status
  checkTopupStatus: async (orderCode) => await api.get(`/api/payments/wallet/check/${orderCode}`),
};
