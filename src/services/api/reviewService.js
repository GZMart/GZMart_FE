import axiosClient from '../axiosClient';

/**
 * Create a new review for a product
 * @param {Object} reviewData - Review data
 * @param {string} reviewData.productId - Product ID
 * @param {number} reviewData.rating - Rating (1-5)
 * @param {string} reviewData.title - Review title (optional)
 * @param {string} reviewData.content - Review content (required, min 10 chars)
 * @param {Array} reviewData.images - Array of image URLs (max 5)
 * @param {string} reviewData.orderId - Order ID for verified purchase (optional)
 */
const createReview = async (reviewData) => {
  console.log('🔵 [ADD RATING API] Request:', {
    endpoint: 'POST /api/reviews',
    data: reviewData,
    timestamp: new Date().toISOString(),
  });

  try {
    const response = await axiosClient.post('/api/reviews', reviewData);
    console.log('✅ [ADD RATING API] Response:', {
      status: response.status,
      data: response.data,
      timestamp: new Date().toISOString(),
    });
    return response.data;
  } catch (error) {
    console.error('❌ [ADD RATING API] Error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
};

/**
 * Get reviews for a specific product
 * @param {string} productId - Product ID
 * @param {Object} options - Query options
 * @param {number} options.page - Page number (default: 1)
 * @param {number} options.limit - Items per page (default: 10)
 * @param {number} options.rating - Filter by rating (1-5, optional)
 * @param {string} options.sortBy - Sort by: 'recent', 'helpful', 'rating_high', 'rating_low' (default: recent)
 */
const getProductReviews = async (productId, options = {}) => {
  const params = new URLSearchParams();
  if (options.page) {
    params.append('page', options.page);
  }
  if (options.limit) {
    params.append('limit', options.limit);
  }
  if (options.rating) {
    params.append('rating', options.rating);
  }
  if (options.sortBy) {
    params.append('sortBy', options.sortBy);
  }

  const response = await axiosClient.get(
    `/api/reviews/product/${productId}${params.toString() ? `?${params.toString()}` : ''}`
  );
  return response.data;
};

/**
 * Get current user's reviews
 * @param {Object} options - Query options
 * @param {number} options.page - Page number (default: 1)
 * @param {number} options.limit - Items per page (default: 10)
 */
const getUserReviews = async (options = {}) => {
  const params = new URLSearchParams();
  if (options.page) {
    params.append('page', options.page);
  }
  if (options.limit) {
    params.append('limit', options.limit);
  }

  const response = await axiosClient.get(
    `/api/reviews/user${params.toString() ? `?${params.toString()}` : ''}`
  );
  return response.data;
};

/**
 * Get a single review by ID
 * @param {string} reviewId - Review ID
 */
const getReviewById = async (reviewId) => {
  const response = await axiosClient.get(`/api/reviews/${reviewId}`);
  return response.data;
};

/**
 * Update a review
 * @param {string} reviewId - Review ID
 * @param {Object} updateData - Data to update
 * @param {number} updateData.rating - New rating (optional)
 * @param {string} updateData.title - New title (optional)
 * @param {string} updateData.content - New content (optional)
 * @param {Array} updateData.images - New images array (optional)
 */
const updateReview = async (reviewId, updateData) => {
  const response = await axiosClient.put(`/api/reviews/${reviewId}`, updateData);
  return response.data;
};

/**
 * Delete a review
 * @param {string} reviewId - Review ID to delete
 */
const deleteReview = async (reviewId) => {
  const response = await axiosClient.delete(`/api/reviews/${reviewId}`);
  return response.data;
};

/**
 * Mark a review as helpful
 * @param {string} reviewId - Review ID
 */
const markHelpful = async (reviewId) => {
  const response = await axiosClient.post(`/api/reviews/${reviewId}/helpful`);
  return response.data;
};

/**
 * Mark a review as unhelpful
 * @param {string} reviewId - Review ID
 */
const markUnhelpful = async (reviewId) => {
  const response = await axiosClient.post(`/api/reviews/${reviewId}/unhelpful`);
  return response.data;
};

/**
 * Get review statistics for a product
 * @param {string} productId - Product ID
 */
const getReviewStats = async (productId) => {
  const response = await axiosClient.get(`/api/reviews/stats/${productId}`);
  return response.data;
};

const reviewService = {
  createReview,
  getProductReviews,
  getUserReviews,
  getReviewById,
  updateReview,
  deleteReview,
  markHelpful,
  markUnhelpful,
  getReviewStats,
};

export default reviewService;
