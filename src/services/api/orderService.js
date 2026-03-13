import { api } from '../axiosClient';

export const orderService = {
  // Create a new order
  createOrder: async (orderData) => await api.post('/api/orders', orderData),

  // Get current user's orders with pagination
  getMyOrders: async (page = 1, limit = 10) =>
    await api.get('/api/orders', { params: { page, limit } }),

  // Get specific order details
  getOrderById: async (id) => await api.get(`/api/orders/${id}`),

  // Cancel an order
  cancelOrder: async (id, reason) => await api.put(`/api/orders/${id}/cancel`, { reason }),

  // Get checkout info (customer details)
  getCheckoutInfo: async () => await api.get('/api/orders/checkout-info'),

  // Preview order (calculate simplified totals)
  previewOrder: async (data) => await api.post('/api/orders/preview', data),

  // Get invoice
  getInvoice: async (id) => await api.get(`/api/orders/${id}/invoice`),

  // Mark order as delivered (when map animation completes)
  markAsDelivered: async (id) => await api.put(`/api/orders/${id}/mark-delivered`),

  // Confirm receipt (delivered -> completed)
  confirmReceipt: async (id) => await api.put(`/api/orders/${id}/confirm-receipt`),
};
