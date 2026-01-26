import axiosClient from '../axiosClient';

/**
 * Get all favourites for current user
 */
export const getFavourites = async () => {
  const response = await axiosClient.get('/api/favourites');
  return response.data;
};

/**
 * Add product to favourites
 * @param {string} productId - Product ID to add
 */
export const addToFavourites = async (productId) => {
  const response = await axiosClient.post('/api/favourites', { productId });
  return response.data;
};

/**
 * Remove product from favourites
 * @param {string} productId - Product ID to remove
 */
export const removeFromFavourites = async (productId) => {
  const response = await axiosClient.delete(`/api/favourites/${productId}`);
  return response.data;
};

/**
 * Clear all favourites
 */
export const clearFavourites = async () => {
  const response = await axiosClient.delete('/api/favourites');
  return response.data;
};

/**
 * Check if product is in favourites
 * @param {string} productId - Product ID to check
 */
export const checkInFavourites = async (productId) => {
  const response = await axiosClient.get(`/api/favourites/check/${productId}`);
  return response.data;
};
