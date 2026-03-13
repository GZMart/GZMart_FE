import { api } from './axiosClient';

export const cartService = {
  getCart: async () => await api.get('/api/cart'),

  addToCart: async (data) =>
    // data: { productId, quantity, color, size }
    await api.post('/api/cart', data),
  updateCartItem: async (itemId, quantity) => await api.put(`/api/cart/${itemId}`, { quantity }),

  removeFromCart: async (itemId) => await api.delete(`/api/cart/${itemId}`),
};
