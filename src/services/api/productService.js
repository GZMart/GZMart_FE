import { api } from '../axiosClient';
import { API_VERSION } from '@constants';

const BASE_URL = `${API_VERSION}/products`;

/**
 * Product API Service
 */
export const productService = {
  /**
   * Get all products with filters and pagination
   * @param {object} params - Query parameters (page, limit, category, search, etc.)
   * @returns {Promise} Products list
   */
  getProducts: async (params = {}) => api.get(BASE_URL, { params }),

  /**
   * Get single product by ID
   * @param {string} id - Product ID
   * @returns {Promise} Product details
   */
  getProductById: async (id) => api.get(`${BASE_URL}/${id}`),

  /**
   * Search products
   * @param {string} query - Search query
   * @param {object} filters - Additional filters
   * @returns {Promise} Search results
   */
  searchProducts: async (query, filters = {}) => api.get(`${BASE_URL}/search`, {
      params: { q: query, ...filters },
    }),

  /**
   * Get products by category
   * @param {string} category - Category slug
   * @param {object} params - Query parameters
   * @returns {Promise} Products in category
   */
  getProductsByCategory: async (category, params = {}) => api.get(`${BASE_URL}/category/${category}`, { params }),

  /**
   * Get featured products
   * @param {number} limit - Number of products to fetch
   * @returns {Promise} Featured products
   */
  getFeaturedProducts: async (limit = 10) => api.get(`${BASE_URL}/featured`, { params: { limit } }),

  /**
   * Get related products
   * @param {string} productId - Product ID
   * @param {number} limit - Number of products to fetch
   * @returns {Promise} Related products
   */
  getRelatedProducts: async (productId, limit = 6) => api.get(`${BASE_URL}/${productId}/related`, { params: { limit } }),

  /**
   * Create new product (Seller/Admin)
   * @param {object} productData - Product data
   * @returns {Promise} Created product
   */
  createProduct: async (productData) => api.post(BASE_URL, productData),

  /**
   * Update product (Seller/Admin)
   * @param {string} id - Product ID
   * @param {object} productData - Updated product data
   * @returns {Promise} Updated product
   */
  updateProduct: async (id, productData) => api.put(`${BASE_URL}/${id}`, productData),

  /**
   * Delete product (Seller/Admin)
   * @param {string} id - Product ID
   * @returns {Promise} Deletion response
   */
  deleteProduct: async (id) => api.delete(`${BASE_URL}/${id}`),

  /**
   * Upload product images
   * @param {string} productId - Product ID
   * @param {FormData} formData - Form data with images
   * @returns {Promise} Upload response
   */
  uploadImages: async (productId, formData) => api.post(`${BASE_URL}/${productId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  /**
   * Get product reviews
   * @param {string} productId - Product ID
   * @param {object} params - Query parameters
   * @returns {Promise} Product reviews
   */
  getProductReviews: async (productId, params = {}) => api.get(`${BASE_URL}/${productId}/reviews`, { params }),

  /**
   * Add product review
   * @param {string} productId - Product ID
   * @param {object} reviewData - Review data
   * @returns {Promise} Created review
   */
  addProductReview: async (productId, reviewData) => api.post(`${BASE_URL}/${productId}/reviews`, reviewData),
};

export default productService;
