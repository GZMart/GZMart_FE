import { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { reviewService, productService } from '../../services/api';
import { orderService } from '../../services/api/orderService';
import { toast } from 'react-toastify';
import styles from '../../assets/styles/ProfilePage/ReviewModal.module.css';

const ReviewModal = ({ isOpen, onClose, onSubmit, orderNumber, isSubmitting, orderId }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [product, setProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState('');
  const [productLoading, setProductLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [reviewedProductsCount, setReviewedProductsCount] = useState(0);

  // Fetch product data when modal opens
  useEffect(() => {
    console.log('ReviewModal useEffect triggered:', { isOpen, orderId });
    if (isOpen && orderId) {
      // Fetch order details to get product info
      console.log('Fetching order details for orderId:', orderId);
      fetchOrderDetailsForProduct();
    }
  }, [isOpen, orderId]);

  const fetchOrderDetailsForProduct = async () => {
    try {
      setProductLoading(true);
      console.log('Calling orderService to get order details:', orderId);
      const response = await orderService.getOrderById(orderId);
      console.log('Order details response:', response);

      const orderData = response.data || response;
      const firstItem = orderData.items?.[0];

      // Build variant label from order item selections (size/color/etc.)
      const tierSelections = firstItem?.tierSelections;
      if (tierSelections) {
        const entries =
          tierSelections instanceof Map
            ? Array.from(tierSelections.entries())
            : Object.entries(tierSelections || {});
        const variantLabel = entries
          .filter(([, value]) => value)
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ');
        setSelectedVariant(variantLabel || '');
      } else {
        setSelectedVariant('');
      }

      // Extract productId from first populated item
      let actualProductId;
      if (firstItem?.productId) {
        actualProductId =
          typeof firstItem.productId === 'string' ? firstItem.productId : firstItem.productId._id;
        console.log('Extracted productId from order:', actualProductId);

        // Now fetch the product
        await fetchProductById(actualProductId);
      }

      // Check existing review(s) for this order to support edit mode
      try {
        const existing = await reviewService.getOrderReviews(orderId);
        const existingList = existing?.data || [];
        setReviewedProductsCount(existingList.length);

        if (existingList.length > 0) {
          const latestReview = existingList[0];
          setIsEditMode(true);
          setRating(latestReview.rating || 0);
          setTitle(latestReview.title || '');
          setComment(latestReview.content || '');
        } else {
          setIsEditMode(false);
          setRating(0);
          setTitle('');
          setComment('');
        }
      } catch (reviewErr) {
        console.error('Error fetching order reviews:', reviewErr);
        setIsEditMode(false);
        setReviewedProductsCount(0);
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      useDefaultProduct();
    } finally {
      setProductLoading(false);
    }
  };

  const fetchProductById = async (pId) => {
    try {
      const response = await productService.getById(pId);
      console.log('Product API response:', response);
      setProduct(response.data || response);
    } catch (error) {
      console.error('Error fetching product:', error);
      useDefaultProduct();
    }
  };

  const useDefaultProduct = () => {
    const mockProduct = {
      _id: 'unknown',
      name: 'Product (Demo)',
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200',
      category: 'Product',
    };
    console.log('Using mock product:', mockProduct);
    setProduct(mockProduct);
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }
    if (!comment.trim()) {
      toast.error('Please write a review (min 10 characters)');
      return;
    }
    if (comment.trim().length < 10) {
      toast.error('Review must be at least 10 characters');
      return;
    }

    try {
      setSubmitting(true);

      const reviewPayload = {
        // orderId-based flow: backend will apply this review to each product in order
        rating,
        title: title || `${rating} Star Review`,
        content: comment,
        orderId,
        images: [],
      };

      console.log('🔵 [ReviewModal] Submitting review:', {
        payload: reviewPayload,
        productInfo: {
          id: product?._id,
          name: product?.name,
        },
        mode: isEditMode ? 'edit' : 'create',
        timestamp: new Date().toISOString(),
      });

      // Create review using API
      await reviewService.createReview(reviewPayload);

      console.log('✅ [ReviewModal] Review submitted successfully');
      toast.success(isEditMode ? 'Review updated successfully!' : 'Review submitted successfully!');

      // Dispatch custom event to notify ProductReviewSection to refetch
      const event = new CustomEvent('reviewSubmitted', {
        detail: { productId: product?._id, orderId },
      });
      window.dispatchEvent(event);
      console.log('📣 Dispatched reviewSubmitted event for product:', product?._id);

      // Call parent callback
      if (onSubmit) {
        await onSubmit({
          rating,
          title: title || `${rating} Star Review`,
          comment,
        });
      }

      // Reset form
      setRating(0);
      setTitle('');
      setComment('');
      setIsEditMode(false);
      setReviewedProductsCount(0);
      onClose();
    } catch (error) {
      console.error('❌ [ReviewModal] Error submitting review:', {
        error,
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      toast.error(error.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setRating(0);
    setTitle('');
    setComment('');
    setProduct(null);
    setSelectedVariant('');
    setIsEditMode(false);
    setReviewedProductsCount(0);
    onClose();
  };

  // Get product image
  const productImage =
    product?.images?.[0] ||
    product?.image ||
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100';

  // Get product category
  const productCategory = product?.category?.name || product?.category || 'Product';

  return (
    <Modal
      show={isOpen}
      onHide={handleClose}
      dialogClassName={styles.drawerDialog}
      contentClassName={styles.reviewModalContent}
      backdropClassName={styles.drawerBackdrop}
    >
      <div className={styles.modalHeader}>
        <h4 className={styles.modalTitle}>{isEditMode ? 'Edit Rating' : 'Add Rating'}</h4>
        <button className={styles.modalCloseBtn} onClick={handleClose} disabled={submitting}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div className={styles.modalBody}>
        {/* Product Info */}
        {productLoading ? (
          <div className={styles.orderInfo} style={{ justifyContent: 'center', minHeight: '80px' }}>
            <p className={styles.loadingText}>Loading product...</p>
          </div>
        ) : product ? (
          <div className={styles.orderInfo}>
            <div className={styles.productThumb}>
              <img src={productImage} alt={product?.name} />
            </div>
            <div className={styles.productDetails}>
              <p className={styles.orderNumber}>Order #{orderNumber}</p>
              <h5 className={styles.productName}>{product?.name || 'Product'}</h5>
              <p className={styles.productCategory}>{productCategory}</p>
              {selectedVariant && (
                <p className={styles.productCategory}>Variant: {selectedVariant}</p>
              )}
              {isEditMode && reviewedProductsCount > 0 && (
                <p className={styles.productCategory}>
                  Existing review found for {reviewedProductsCount} product(s) in this order
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className={styles.orderInfo} style={{ justifyContent: 'center' }}>
            <p>Product information unavailable</p>
          </div>
        )}

        {/* Rating Section */}
        <div className={styles.formSection}>
          <label className={styles.formLabel}>Rating</label>
          <div className={styles.ratingSection}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className={`${styles.starBtn} ${
                  star <= (hoverRating || rating) ? styles.active : ''
                }`}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                disabled={submitting}
              >
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  stroke="currentColor"
                  strokeWidth="1"
                >
                  <polygon points="12 2 15.09 10.26 23.77 10.36 17.13 16.52 19.09 25.63 12 20.06 4.91 25.63 6.87 16.52 0.23 10.36 8.91 10.26 12 2"></polygon>
                </svg>
              </button>
            ))}
          </div>
        </div>

        {/* Title Section */}
        <div className={styles.formSection}>
          <label className={styles.formLabel}>Title (Optional)</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Sum up your experience"
            className={styles.formInput}
            maxLength="100"
            disabled={submitting}
          />
        </div>

        {/* Comment Section */}
        <div className={styles.formSection}>
          <label className={styles.formLabel}>Your Review</label>
          <textarea
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience with this product (min 10 characters)..."
            className={styles.formTextarea}
            maxLength="1000"
            disabled={submitting}
          />
          <div className={styles.charCount}>{comment.length}/1000</div>
        </div>
      </div>

      <div className={styles.modalFooter}>
        <button
          className={styles.modalCancelBtn}
          onClick={handleClose}
          disabled={submitting || isSubmitting}
        >
          Cancel
        </button>
        <button
          className={styles.modalSubmitBtn}
          onClick={handleSubmit}
          disabled={submitting || isSubmitting || rating === 0}
        >
          {submitting || isSubmitting
            ? 'Submitting...'
            : isEditMode
              ? 'Update Review'
              : 'Submit Review'}
        </button>
      </div>
    </Modal>
  );
};

export default ReviewModal;
