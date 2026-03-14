import axiosClient from '../axiosClient';

/**
 * Get all wishlist for current user
 */
export const getWishlists = async () => {
  const response = await axiosClient.get('/api/wishlists');
  return response;
};

/**
 * Add product to wishlist
 * @param {string} productId - Product ID to add
 */
export const addToWishlists = async (productId, variant = {}) => {
  const response = await axiosClient.post('/api/wishlists', { productId, ...variant });
  return response;
};

/**
 * Remove product from wishlist
 * @param {string} productId - Product ID to remove
 */
export const removeFromWishlists = async (productId, variant = {}) => {
  const response = await axiosClient.delete(`/api/wishlists/${productId}`, {
    params: variant,
  });
  return response;
};

/**
 * Clear all wishlist
 */
export const clearWishlists = async () => {
  const response = await axiosClient.delete('/api/wishlists');
  return response;
};

/**
 * Check if product is in wishlist
 * @param {string} productId - Product ID to check
 */
export const checkInWishlists = async (productId, variant = {}) => {
  const response = await axiosClient.get(`/api/wishlists/check/${productId}`, {
    params: variant,
  });
  return response;
};
