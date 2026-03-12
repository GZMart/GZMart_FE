import axiosClient from '../axiosClient';

const promotionBuyerService = {
  /**
   * Get all active promotions for a product (public, no auth)
   * @param {string} productId
   * @returns {Promise<{ shopProgram, comboPromotions, addOnDeals }>}
   */
  getProductPromotions: (productId) =>
    axiosClient.get(`/api/products/${productId}/promotions`),

  /**
   * Get promotions for multiple products in one call (public, no auth)
   * @param {string[]} productIds
   * @returns {Promise<{ [productId]: { shopProgram, comboPromotions, addOnDeals } }>}
   */
  getProductPromotionsBatch: (productIds) =>
    axiosClient.post('/api/products/promotions/batch', { productIds }),
};

export default promotionBuyerService;
