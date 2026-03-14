import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styles from '../../assets/styles/buyer/RequireLoginModal.module.css';

const RequireLoginModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.iconContainer}>
          <i className="bi bi-heart" style={{ fontSize: 28, color: '#f5a623' }}></i>
        </div>
        <div className={styles.modalBody}>
          <h5 className={styles.modalTitle}>{t('require_login.title')}</h5>
          <p className={styles.modalDesc}>{t('require_login.description')}</p>
        </div>
        <div className={styles.modalFooter}>
          <button type="button" className={styles.modalBtnSecondary} onClick={onClose}>
            {t('require_login.cancel')}
          </button>
          <button
            type="button"
            className={styles.modalBtnPrimary}
            onClick={() => {
              onClose();
              navigate('/login');
            }}
          >
            {t('require_login.go_to_login')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RequireLoginModal;
