import axiosClient from '../axiosClient';

const BASE_URL = '/api/products';

/**
 * Product API Service
 */
export const productService = {
  /**
   * Get all products with filters and pagination
   * @param {object} params - Query parameters (page, limit, status, condition, minPrice, maxPrice, sort, tags)
   * @returns {Promise} Products list with pagination
   */
  getAll: async (params = {}) => await axiosClient.get(BASE_URL, { params }),

  /**
   * Get products owned by current seller
   * @param {object} params
   */
  getMyProducts: async (params = {}) =>
    await axiosClient.get(`${BASE_URL}/my-products`, { params }),

  /**
   * Legacy method - alias for getAll
   */
  getProducts: async (params = {}) => await axiosClient.get(BASE_URL, { params }),

  /**
   * Get single product by ID
   * @param {string} id - Product ID
   * @returns {Promise} Product details
   */
  getById: async (id) => await axiosClient.get(`${BASE_URL}/${id}`),

  /**
   * Legacy method - alias for getById
   */
  getProductById: async (id) => await axiosClient.get(`${BASE_URL}/${id}`),

  /**
   * Get products by category
   * @param {string} categoryId - Category ID
   * @param {object} params - Query parameters
   * @returns {Promise} Products in category
   */
  getByCategory: async (categoryId, params = {}) =>
    await axiosClient.get(`${BASE_URL}/category/${categoryId}`, { params }),

  /**
   * Get products by seller ID
   * @param {string} sellerId - Seller ID
   * @param {object} params - Query parameters
   * @returns {Promise} Products by seller
   */
  getProductsBySeller: async (sellerId, params = {}) =>
    await axiosClient.get(`${BASE_URL}/seller/${sellerId}`, { params }),

  /**
   * Legacy method - alias for getByCategory
   */
  getProductsByCategory: async (categoryId, params = {}) =>
    await axiosClient.get(`${BASE_URL}/category/${categoryId}`, { params }),

  /**
   * Search products
   * @param {string} query - Search query
   * @param {object} filters - Additional filters
   * @returns {Promise} Search results
   */
  searchProducts: async (query, filters = {}) =>
    await axiosClient.get(`${BASE_URL}/search`, {
      params: { q: query, ...filters },
    }),

  /**
   * Get featured products
   * @param {number} limit - Number of products to fetch
   * @returns {Promise} Featured products
   */
  getFeaturedProducts: async (limit = 10) =>
    await axiosClient.get(`${BASE_URL}/featured`, { params: { limit } }),

  /**
   * Get trending products (bestsellers)
   * @param {number} limit - Number of products to fetch
   * @returns {Promise} Trending products
   */
  getTrendingProducts: async (limit = 10) =>
    await axiosClient.get(`${BASE_URL}/trending`, { params: { limit } }),

  /**
   * Get today's recommendations (Legacy/Fallback)
   * @param {number} limit - Number of products to fetch
   * @returns {Promise} Recommended products for today
   */
  getTodayRecommendations: async (limit = 10) =>
    await axiosClient.get(`${BASE_URL}/today-recommendations`, {
      params: { limit },
    }),

  /**
   * Get AI personalized hybrid recommendations
   * @param {number} limit - Number of products to fetch
   * @returns {Promise} Recommended products based on user behavior
   */
  getPersonalizedRecommendations: async (limit = 16) =>
    await axiosClient.get(`${BASE_URL}/personalized-recommendations`, {
      params: { limit },
    }),

  /**
   * Get new arrival products
   * @param {number} limit - Number of products to fetch
   * @returns {Promise} New arrival products
   */
  getNewArrivals: async (limit = 10) =>
    await axiosClient.get(`${BASE_URL}/new-arrivals`, { params: { limit } }),

  /**
   * Get best offers
   * @param {number} limit - Number of products to fetch
   * @returns {Promise} Products with best offers
   */
  getBestOffers: async (limit = 10) =>
    await axiosClient.get(`${BASE_URL}/best-offers`, { params: { limit } }),

  /**
   * Get products with advanced filters
   * @param {object} filters - Advanced filters
   * @returns {Promise} Filtered products
   */
  getProductsAdvanced: async (filters = {}) =>
    await axiosClient.get(`${BASE_URL}/advanced`, { params: filters }),

  /**
   * Get available filters for products
   * @param {string} categoryId - Category ID (optional)
   * @returns {Promise} Available filters
   */
  getAvailableFilters: async (categoryId = null) => {
    const params = categoryId ? { categoryId } : {};
    return await axiosClient.get(`${BASE_URL}/filters`, { params });
  },

  /**
   * Get related products
   * @param {string} productId - Product ID
   * @param {number} limit - Number of products to fetch
   * @returns {Promise} Related products
   */
  getRelatedProducts: async (productId, limit = 10) => {
    const response = await axiosClient.get(`${BASE_URL}/${productId}/related`, {
      params: { limit },
    });
    return response.data;
  },

  /**
   * Get variant by tier index (Shopee-style tier selection)
   * @param {string} productId - Product ID
   * @param {array} tierIndex - Array of tier indices [colorIndex, sizeIndex]
   * @returns {Promise} Variant details (sku, price, stock, image)
   */
  getVariantByTier: async (productId, tierIndex) =>
    await axiosClient.post(`${BASE_URL}/${productId}/variant`, { tierIndex }),

  /**
   * Get available options for tier selection
   * @param {string} productId - Product ID
   * @param {object} selection - Current tier selection {0: 0} means tier 0 option 0 selected
   * @returns {Promise} Available options for remaining tiers
   */
  getAvailableOptions: async (productId, selection) =>
    await axiosClient.post(`${BASE_URL}/${productId}/available-options`, { selection }),

  /**
   * Create new product (Seller/Admin)
   * @param {object} productData - Product data
   * @returns {Promise} Created product
   */
  create: async (productData) => await axiosClient.post(BASE_URL, productData),

  /**
   * Legacy method - alias for create
   */
  createProduct: async (productData) => await axiosClient.post(BASE_URL, productData),

  /**
   * Update product (Seller/Admin)
   * @param {string} id - Product ID
   * @param {object} productData - Updated product data
   * @returns {Promise} Updated product
   */
  update: async (id, productData) => await axiosClient.put(`${BASE_URL}/${id}`, productData),

  /**
   * Legacy method - alias for update
   */
  updateProduct: async (id, productData) => await axiosClient.put(`${BASE_URL}/${id}`, productData),

  /**
   * Delete product (Seller/Admin)
   * @param {string} id - Product ID
   * @returns {Promise} Deletion response
   */
  delete: async (id) => await axiosClient.delete(`${BASE_URL}/${id}`),

  /**
   * Legacy method - alias for delete
   */
  deleteProduct: async (id) => await axiosClient.delete(`${BASE_URL}/${id}`),

  /**
   * Upload product images
   * @param {string} productId - Product ID
   * @param {FormData} formData - Form data with images
   * @returns {Promise} Upload response
   */
  uploadImages: async (productId, formData) =>
    await axiosClient.post(`${BASE_URL}/${productId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  /**
   * Get product reviews
   * @param {string} productId - Product ID
   * @param {object} params - Query parameters
   * @returns {Promise} Product reviews
   */
  getProductReviews: async (productId, params = {}) =>
    await axiosClient.get(`${BASE_URL}/${productId}/reviews`, { params }),

  /**
   * Add product review
   * @param {string} productId - Product ID
   * @param {object} reviewData - Review data
   * @returns {Promise} Created review
   */
  addProductReview: async (productId, reviewData) =>
    await axiosClient.post(`${BASE_URL}/${productId}/reviews`, reviewData),
  /**
   * Check stock availability for a specific model
   * @param {string} productId - Product ID
   * @param {string} modelId - Model ID
   * @param {number} quantity - Quantity to check
   * @returns {Promise} Stock availability details
   */
  checkStockAvailability: async (productId, modelId, quantity = 1) =>
    await axiosClient.get(`${BASE_URL}/model/${modelId}/stock`, {
      params: { productId, quantity },
    }),

  /**
   * Toggle product status (hide = inactive, unhide = active)
   * @param {string} id - Product ID
   * @param {string} status - 'active' | 'inactive' | 'draft'
   */
  toggleStatus: async (id, status) =>
    await axiosClient.patch(`${BASE_URL}/${id}/status`, { status }),
};

export default productService;
