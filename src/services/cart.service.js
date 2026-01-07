import { api } from './axiosClient';

export const cartService = {
  getCart: async () => {
    return await api.get('/api/cart');
  },

  addToCart: async (data) => {
    // data: { productId, quantity, color, size }
    return await api.post('/api/cart', data);
  },

  updateCartItem: async (itemId, quantity) => {
    return await api.put(`/api/cart/${itemId}`, { quantity });
  },

  removeFromCart: async (itemId) => {
    return await api.delete(`/api/cart/${itemId}`);
  },
};
