import axiosClient from '../axiosClient';

/**
 * Get user's cart
 */
export const getCart = async () => {
  const response = await axiosClient.get('/api/cart');
  return response.data;
};

/**
 * Add item to cart
 * @param {string|object} productIdOrPayload - Product ID or full payload
 * @param {number} quantity - Quantity to add
 * @param {string} color - Variant color
 * @param {string} size - Variant size
 */
export const addToCart = async (productIdOrPayload, quantity = 1, color, size) => {
  const payload =
    typeof productIdOrPayload === 'object' && productIdOrPayload !== null
      ? productIdOrPayload
      : {
          productId: productIdOrPayload,
          quantity,
          color,
          size,
        };

  const response = await axiosClient.post('/api/cart', payload);
  return response.data;
};

/**
 * Update cart item quantity
 * @param {string} itemId - Cart item ID
 * @param {number} quantity - New quantity
 */
export const updateCartItem = async (itemId, quantity) => {
  const response = await axiosClient.put(`/api/cart/${itemId}`, { quantity });
  return response.data;
};

/**
 * Remove item from cart
 * @param {string} itemId - Cart item ID to remove
 */
export const removeFromCart = async (itemId) => {
  const response = await axiosClient.delete(`/api/cart/${itemId}`);
  return response.data;
};
