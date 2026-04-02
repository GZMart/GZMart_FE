import { useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { Modal } from 'react-bootstrap';
import { reviewService, productService, uploadService } from '../../services/api';
import { orderService } from '../../services/api/orderService';
// Giả định import uploadService (bạn cần điều chỉnh đường dẫn nếu khác)
// import { uploadService } from '../../services/api/uploadService';
import { toast } from 'react-toastify';
import styles from '@assets/styles/buyer/ProfilePage/ReviewModal.module.css';

const ReviewModal = ({
  isOpen,
  onClose,
  onSubmit,
  orderNumber = '',
  isSubmitting = false,
  orderId,
}) => {
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

  // --- THÊM STATE CHO UPLOAD ---
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const fileInputRef = useRef(null);

  const setDefaultProductData = useCallback(() => {
    setProduct({
      _id: 'unknown',
      name: 'Product (Demo)',
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200',
      category: 'Product',
    });
  }, []);

  const fetchProductById = useCallback(
    async (pId) => {
      try {
        const response = await productService.getById(pId);
        setProduct(response.data || response);
      } catch (error) {
        setDefaultProductData();
      }
    },
    [setDefaultProductData]
  );

  const fetchOrderDetailsForProduct = useCallback(async () => {
    try {
      setProductLoading(true);
      const response = await orderService.getOrderById(orderId);

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
          // Nếu có ảnh cũ từ review trước, bạn có thể load vào đây
          // setPreviewUrls(latestReview.images || []);
        } else {
          setIsEditMode(false);
          setRating(0);
          setTitle('');
          setComment('');
        }
      } catch (reviewErr) {
        setIsEditMode(false);
        setReviewedProductsCount(0);
      }
    } catch (error) {
      setDefaultProductData();
    } finally {
      setProductLoading(false);
    }
  }, [fetchProductById, orderId, setDefaultProductData]);

  // Fetch product data when modal opens
  useEffect(() => {
    if (isOpen && orderId) {
      fetchOrderDetailsForProduct();
    }
  }, [fetchOrderDetailsForProduct, isOpen, orderId]);

  // Cleanup object URLs when component unmounts or modal closes to prevent memory leaks
  useEffect(
    () => () => {
      previewUrls.forEach((media) => {
        // Gọi media.url thay vì gọi thẳng media
        if (media && media.url && media.url.startsWith('blob:')) {
          URL.revokeObjectURL(media.url);
        }
      });
    },
    [previewUrls]
  );

  // --- XỬ LÝ CHỌN FILE ---
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) {
      return;
    }

    // Optional: Kiểm tra số lượng file tối đa (ví dụ: 5 file)
    if (selectedFiles.length + files.length > 5) {
      toast.warning('You can only upload up to 5 files.');
      return;
    }

    const newFiles = [];
    const newPreviews = [];

    files.forEach((file) => {
      // Optional: Kiểm tra dung lượng (ví dụ: 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.warning(`${file.name} is too large. Max size is 10MB.`);
        return;
      }
      newFiles.push(file);
      newPreviews.push({
        url: URL.createObjectURL(file),
        type: file.type.startsWith('video/') ? 'video' : 'image',
      });
    });

    setSelectedFiles((prev) => [...prev, ...newFiles]);
    setPreviewUrls((prev) => [...prev, ...newPreviews]);

    // Reset input value to allow selecting the same file again if removed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // --- XÓA FILE ĐÃ CHỌN ---
  const handleRemoveFile = (indexToRemove) => {
    setSelectedFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
    setPreviewUrls((prev) => {
      const updated = [...prev];
      const removed = updated.splice(indexToRemove, 1)[0];
      if (removed.url.startsWith('blob:')) {
        URL.revokeObjectURL(removed.url);
      }
      return updated;
    });
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

      let uploadedImageUrls = [];

      // --- TIẾN HÀNH UPLOAD ẢNH/VIDEO TRƯỚC ---
      if (selectedFiles.length > 0) {
        try {
          // Gọi hàm uploadImages từ service, nó sẽ trả về mảng các response
          const uploadResults = await uploadService.uploadImages(selectedFiles);

          // Lấy ra mảng các URL (do trong service bạn đã return { ...data, url })
          uploadedImageUrls = uploadResults.map((res) => res.url).filter((url) => url); // Lọc bỏ các giá trị undefined/rỗng nếu có
        } catch (uploadError) {
          console.error('Lỗi upload media:', uploadError);
          toast.error(
            uploadError.response?.data?.message ||
              'Failed to upload images/videos. Please try again.'
          );
          setSubmitting(false);
          return; // Dừng việc submit review nếu upload file thất bại
        }
      }

      // --- SAU KHI UPLOAD XONG, TẠO PAYLOAD GỬI REVIEW ---
      const reviewPayload = {
        rating,
        title: title || `${rating} Star Review`,
        content: comment,
        orderId,
        images: uploadedImageUrls, // Đưa mảng URL ảnh/video vào đây
      };

      // Create review using API
      await reviewService.createReview(reviewPayload);
      toast.success(isEditMode ? 'Review updated successfully!' : 'Review submitted successfully!');

      // Dispatch custom event to notify ProductReviewSection to refetch
      const event = new CustomEvent('reviewSubmitted', {
        detail: { productId: product?._id, orderId },
      });
      window.dispatchEvent(event);

      // Call parent callback
      if (onSubmit) {
        await onSubmit({
          rating,
          title: title || `${rating} Star Review`,
          comment,
        });
      }

      handleClose();
    } catch (error) {
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

    // Clear upload state
    setSelectedFiles([]);
    setPreviewUrls([]);

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

        {/* --- Media Upload Section --- */}
        <div className={styles.formSection}>
          <label className={styles.formLabel}>Add Photos/Videos</label>
          <div className={styles.uploadContainer}>
            {/* Thêm display flex và flexWrap cho thẻ cha */}
            <div
              className={styles.mediaPreviewList}
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '12px', // Khoảng cách đều giữa các cột và hàng
                marginTop: '10px',
              }}
            >
              {previewUrls.map((media, index) => (
                <div
                  key={index}
                  className={styles.mediaPreviewItem}
                  style={{
                    position: 'relative',
                    width: '80px',
                    height: '80px',
                    flexShrink: 0, // Giữ cố định kích thước, không bị bóp méo
                  }}
                >
                  {media.type === 'video' ? (
                    <video
                      src={media.url}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: '8px',
                      }}
                    />
                  ) : (
                    <img
                      src={media.url}
                      alt="preview"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: '8px',
                      }}
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(index)}
                    disabled={submitting}
                    style={{
                      position: 'absolute',
                      top: '-6px',
                      right: '-6px',
                      background: '#ff4d4f', // Màu đỏ đẹp hơn
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: '22px',
                      height: '22px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      lineHeight: '1',
                      paddingBottom: '2px', // Căn giữa dấu x
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}

              {selectedFiles.length < 5 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={submitting}
                  style={{
                    width: '80px',
                    height: '80px',
                    border: '1px dashed #d9d9d9',
                    borderRadius: '8px',
                    background: '#fafafa',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0, // Đảm bảo nút + bằng đúng size ảnh
                    padding: 0,
                    margin: 0,
                    transition: 'border-color 0.3s',
                  }}
                >
                  <span style={{ fontSize: '24px', color: '#8c8c8c' }}>+</span>
                </button>
              )}
            </div>

            <input
              type="file"
              multiple
              accept="image/*,video/mp4,video/quicktime"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: 'none' }}
              disabled={submitting}
            />
          </div>
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

ReviewModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func,
  orderNumber: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  isSubmitting: PropTypes.bool,
  orderId: PropTypes.string,
};
