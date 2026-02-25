import { useState } from 'react';
import { Modal, Form } from 'react-bootstrap';
import styles from '../../assets/styles/ProfilePage/ReviewModal.module.css';

const ReviewModal = ({ isOpen, onClose, onSubmit, orderNumber, isSubmitting }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');

  const handleSubmit = async () => {
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }
    if (!comment.trim()) {
      alert('Please write a review');
      return;
    }

    await onSubmit({
      rating,
      title: title || 'Review',
      comment,
    });

    // Reset form
    setRating(0);
    setTitle('');
    setComment('');
  };

  const handleClose = () => {
    setRating(0);
    setTitle('');
    setComment('');
    onClose();
  };

  return (
    <Modal show={isOpen} onHide={handleClose} centered contentClassName={styles.reviewModalContent}>
      <div className={styles.modalHeader}>
        <h4 className={styles.modalTitle}>Add Review</h4>
        <button className={styles.modalCloseBtn} onClick={handleClose}>
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
        <p className={styles.orderInfo}>Order #{orderNumber}</p>

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
          />
        </div>

        {/* Comment Section */}
        <div className={styles.formSection}>
          <label className={styles.formLabel}>Your Review</label>
          <textarea
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience with this product..."
            className={styles.formTextarea}
            maxLength="1000"
          />
          <div className={styles.charCount}>{comment.length}/1000</div>
        </div>
      </div>

      <div className={styles.modalFooter}>
        <button className={styles.modalCancelBtn} onClick={handleClose} disabled={isSubmitting}>
          Cancel
        </button>
        <button
          className={styles.modalSubmitBtn}
          onClick={handleSubmit}
          disabled={isSubmitting || rating === 0}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Review'}
        </button>
      </div>
    </Modal>
  );
};

export default ReviewModal;
