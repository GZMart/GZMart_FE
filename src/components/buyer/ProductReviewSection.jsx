import { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { reviewService } from '../../services/api';
import Pagination from '../common/Pagination';
import styles from '../../assets/styles/ProductReviewSection.module.css';

const ProductReviewSection = ({ product }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterRating, setFilterRating] = useState(null); // null = all, 1-5 = specific rating
  const [filterType, setFilterType] = useState('all'); // 'all' or 'hasMedia'
  const [sortBy, setSortBy] = useState('recent');
  const [helpfulReviews, setHelpfulReviews] = useState(new Set());
  const [unhelpfulReviews, setUnhelpfulReviews] = useState(new Set());
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const reviewsPerPage = 5;

  // Fetch reviews
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        const reviewsResponse = await reviewService.getProductReviews(product._id, {
          page: 1,
          limit: 100,
          sortBy,
        });

        let reviewsData = [];
        if (Array.isArray(reviewsResponse)) {
          // Response is already an array
          reviewsData = reviewsResponse;
        } else if (reviewsResponse?.data) {
          // Response has data property
          reviewsData = Array.isArray(reviewsResponse.data) ? reviewsResponse.data : [];
        }

        setReviews(reviewsData);

        // Hydrate button states from server-provided userReaction
        const helpfulSet = new Set();
        const unhelpfulSet = new Set();
        reviewsData.forEach((review) => {
          if (review.userReaction === 'helpful') {
            helpfulSet.add(review._id);
          } else if (review.userReaction === 'unhelpful') {
            unhelpfulSet.add(review._id);
          }
        });
        setHelpfulReviews(helpfulSet);
        setUnhelpfulReviews(unhelpfulSet);
      } catch (error) {
        setReviews([]);
        setHelpfulReviews(new Set());
        setUnhelpfulReviews(new Set());
      } finally {
        setLoading(false);
      }
    };

    if (product?._id) {
      fetchReviews();
    }
  }, [product?._id, sortBy, refreshTrigger]);

  // Refetch reviews when window/tab gets focus (user comes back from another tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && product?._id) {
        setRefreshTrigger((prev) => prev + 1);
      }
    };

    const handleFocus = () => {
      if (product?._id) {
        setRefreshTrigger((prev) => prev + 1);
      }
    };

    // Listen for custom review submitted event
    const handleReviewSubmitted = (event) => {
      if (event.detail?.productId === product?._id) {
        setRefreshTrigger((prev) => prev + 1);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('reviewSubmitted', handleReviewSubmitted);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('reviewSubmitted', handleReviewSubmitted);
    };
  }, [product?._id]);

  // Filter reviews based on selected filters
  const filteredReviews = useMemo(() => {
    let filtered = [...reviews];

    // Filter by rating
    if (filterRating !== null) {
      filtered = filtered.filter((review) => review.rating === filterRating);
    }

    // Filter by type (only hasMedia filter is available)
    if (filterType === 'hasMedia') {
      filtered = filtered.filter((review) => review.images && review.images.length > 0);
    }

    return filtered;
  }, [reviews, filterRating, filterType]);

  // Paginate filtered reviews
  const paginatedReviews = useMemo(() => {
    const startIndex = (currentPage - 1) * reviewsPerPage;
    return filteredReviews.slice(startIndex, startIndex + reviewsPerPage);
  }, [filteredReviews, currentPage]);

  const totalPages = Math.ceil(filteredReviews.length / reviewsPerPage);

  // Calculate rating distribution
  const ratingDistribution = useMemo(() => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((review) => {
      if (review.rating >= 1 && review.rating <= 5) {
        distribution[review.rating]++;
      }
    });
    return distribution;
  }, [reviews]);

  // Count reviews with media
  const hasMediaCount = useMemo(
    () => reviews.filter((r) => r.images && r.images.length > 0).length,
    [reviews]
  );

  // Average rating
  const averageRating = useMemo(() => {
    if (reviews.length === 0) {
      return 0;
    }
    const sum = reviews.reduce((acc, review) => acc + (review.rating || 0), 0);
    return (sum / reviews.length).toFixed(1);
  }, [reviews]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleMarkHelpful = async (reviewId) => {
    const wasHelpful = helpfulReviews.has(reviewId);
    try {
      const response = await reviewService.markHelpful(reviewId);
      const updatedReview = response?.data || response;

      if (updatedReview?._id) {
        setReviews((prev) =>
          prev.map((r) =>
            r._id === updatedReview._id
              ? { ...r, helpful: updatedReview.helpful, unhelpful: updatedReview.unhelpful }
              : r
          )
        );

        if (wasHelpful) {
          // Toggle off
          setHelpfulReviews((prev) => {
            const next = new Set(prev);
            next.delete(reviewId);
            return next;
          });
        } else {
          // Toggle on, remove from unhelpful
          setHelpfulReviews((prev) => new Set(prev).add(reviewId));
          setUnhelpfulReviews((prev) => {
            const next = new Set(prev);
            next.delete(reviewId);
            return next;
          });
        }
      }
    } catch (error) {
      // noop
    }
  };

  const handleMarkUnhelpful = async (reviewId) => {
    const wasUnhelpful = unhelpfulReviews.has(reviewId);
    try {
      const response = await reviewService.markUnhelpful(reviewId);
      const updatedReview = response?.data || response;

      if (updatedReview?._id) {
        setReviews((prev) =>
          prev.map((r) =>
            r._id === updatedReview._id
              ? { ...r, helpful: updatedReview.helpful, unhelpful: updatedReview.unhelpful }
              : r
          )
        );

        if (wasUnhelpful) {
          // Toggle off
          setUnhelpfulReviews((prev) => {
            const next = new Set(prev);
            next.delete(reviewId);
            return next;
          });
        } else {
          // Toggle on, remove from helpful
          setUnhelpfulReviews((prev) => new Set(prev).add(reviewId));
          setHelpfulReviews((prev) => {
            const next = new Set(prev);
            next.delete(reviewId);
            return next;
          });
        }
      }
    } catch (error) {
      // noop
    }
  };

  if (loading) {
    return (
      <div className={styles.reviews}>
        <div style={{ textAlign: 'center', padding: '20px' }}>Loading reviews...</div>
      </div>
    );
  }

  return (
    <div className={styles.reviews}>
      {/* Review Summary & Filters Container */}
      <div className={styles.reviewHeaderContainer}>
        {/* Review Summary */}
        <div className={styles.reviewSummary}>
          <div className={styles.averageRating}>
            <div className={styles.ratingNumber}>{averageRating}</div>
            <div className={styles.stars}>
              {'★'.repeat(Math.floor(averageRating))}
              {averageRating % 1 >= 0.5 ? '★' : '☆'}
              {'☆'.repeat(Math.max(0, 4 - Math.floor(averageRating)))}
            </div>
            <div className={styles.totalReviews}>{reviews.length} Reviews</div>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className={styles.filterSection}>
          <div className={styles.ratingFilters}>
            <button
              className={`${styles.filterButton} ${filterRating === null ? styles.active : ''}`}
              onClick={() => {
                setFilterRating(null);
                setCurrentPage(1);
              }}
            >
              All
            </button>
            {[5, 4, 3, 2, 1].map((rating) => (
              <button
                key={rating}
                className={`${styles.filterButton} ${filterRating === rating ? styles.active : ''}`}
                onClick={() => {
                  setFilterRating(rating);
                  setCurrentPage(1);
                }}
              >
                {rating} Star{rating !== 1 ? 's' : ''} ({ratingDistribution[rating]})
              </button>
            ))}

            <button
              className={`${styles.filterButton} ${filterType === 'hasMedia' ? styles.active : ''}`}
              onClick={() => {
                setFilterType(filterType === 'hasMedia' ? 'all' : 'hasMedia');
                setCurrentPage(1);
              }}
            >
              Has Images/Videos ({hasMediaCount})
            </button>
          </div>

          <div className={styles.sortControls}>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={styles.sortSelect}
            >
              <option value="recent">Most Recent</option>
              <option value="helpful">Most Helpful</option>
              <option value="rating_high">Highest Rating</option>
              <option value="rating_low">Lowest Rating</option>
            </select>
          </div>
        </div>
      </div>

      {/* Review List */}
      <div className={styles.reviewList}>
        {paginatedReviews.length > 0 ? (
          paginatedReviews.map((review) => (
            <div key={review._id} className={styles.reviewItem}>
              <div className={styles.reviewHeader}>
                <div className={styles.reviewerInfo}>
                  {review.userId?.avatar && (
                    <img
                      src={review.userId.avatar}
                      alt={review.userId?.fullName}
                      className={styles.reviewerAvatar}
                    />
                  )}
                  <div>
                    <div className={styles.reviewerName}>
                      {review.userId?.fullName || 'Anonymous'}
                    </div>
                    <p className={styles.reviewVariant}>Variant: {review.variant || 'N/A'}</p>
                  </div>
                </div>
                <span className={styles.reviewDate}>
                  {new Date(review.createdAt).toLocaleDateString('vi-VN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              {/* Review Content Wrapper */}
              <div className={styles.reviewContentWrapper}>
                <div>
                  {/* Rating */}
                  <div className={styles.reviewRating}>
                    {'★'.repeat(review.rating)}
                    {'☆'.repeat(5 - review.rating)}
                  </div>

                  {/* Review Title */}
                  {review.title && <h4 className={styles.reviewTitle}>{review.title}</h4>}

                  {/* Review Content */}
                  <div>
                    {review.content && <p className={styles.reviewContent}>{review.content}</p>}

                    {/* Review Images */}
                    {review.images && review.images.length > 0 && (
                      <div className={styles.reviewImages}>
                        {review.images.map((image, index) => (
                          <img
                            key={index}
                            src={image}
                            alt={`Review ${index + 1}`}
                            className={styles.reviewImage}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Helpful Actions */}
                <div className={styles.reviewActions}>
                  <button
                    className={`${styles.helpfulButton} ${helpfulReviews.has(review._id) ? styles.active : ''}`}
                    onClick={() => handleMarkHelpful(review._id)}
                    title="Helpful"
                  >
                    <i
                      className={`bi ${helpfulReviews.has(review._id) ? 'bi-hand-thumbs-up-fill' : 'bi-hand-thumbs-up'}`}
                    ></i>
                    {review.helpful || 0}
                  </button>
                  <button
                    className={`${styles.unhelpfulButton} ${unhelpfulReviews.has(review._id) ? styles.active : ''}`}
                    onClick={() => handleMarkUnhelpful(review._id)}
                    title="Not Helpful"
                  >
                    <i
                      className={`bi ${unhelpfulReviews.has(review._id) ? 'bi-hand-thumbs-down-fill' : 'bi-hand-thumbs-down'}`}
                    ></i>
                    {review.unhelpful || 0}
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className={styles.noReviews}>
            <p>No reviews matching your filters.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.reviewPagination}>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
};

export default ProductReviewSection;

ProductReviewSection.propTypes = {
  product: PropTypes.shape({
    _id: PropTypes.string,
  }),
};
