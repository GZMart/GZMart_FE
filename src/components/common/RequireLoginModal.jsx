import { useNavigate } from 'react-router-dom';
import styles from '../../assets/styles/buyer/RequireLoginModal.module.css';

const RequireLoginModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h5 className={styles.modalTitle}>Login Required</h5>
          <button
            type="button"
            className={styles.modalClose}
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className={styles.modalBody}>
          <p>Please log in to continue with this action.</p>
        </div>
        <div className={styles.modalFooter}>
          <button
            type="button"
            className={styles.modalBtnSecondary}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.modalBtnPrimary}
            onClick={() => {
              onClose();
              navigate('/login');
            }}
          >
            Go to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default RequireLoginModal;
