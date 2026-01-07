import { api } from './axiosClient';

export const orderService = {
  // Create a new order
  createOrder: async (orderData) => {
    return await api.post('/api/orders', orderData);
  },

  // Get current user's orders
  getMyOrders: async (params) => {
    return await api.get('/api/orders', { params });
  },

  // Get specific order details
  getOrderById: async (id) => {
    return await api.get(`/api/orders/${id}`);
  },

  // Cancel an order
  cancelOrder: async (id, reason) => {
    return await api.put(`/api/orders/${id}/cancel`, { reason });
  },

  // Get checkout info (customer details)
  getCheckoutInfo: async () => {
    return await api.get('/api/orders/checkout-info');
  },

  // Preview order (calculate simplified totals)
  previewOrder: async (data) => {
    return await api.post('/api/orders/preview', data);
  },
};
