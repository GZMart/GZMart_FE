import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import styles from '@assets/styles/buyer/Cart/CartSuccessModal.module.css';

const MODAL_DURATION = 2200; // ms before auto-close

/* ── Flying image clone that travels to the cart icon ── */
const FlyingItem = ({ image, startRect, onDone }) => {
  const elRef = useRef(null);

  useEffect(() => {
    const cartIcon = document.getElementById('header-cart-icon');
    const el = elRef.current;
    if (!cartIcon || !el) {
      return;
    }

    const cartRect = cartIcon.getBoundingClientRect();
    const dx = cartRect.left + cartRect.width / 2 - (startRect.left + startRect.width / 2);
    const dy = cartRect.top + cartRect.height / 2 - (startRect.top + startRect.height / 2);

    el.style.setProperty('--fly-dx', `${dx}px`);
    el.style.setProperty('--fly-dy', `${dy}px`);

    const handleEnd = () => {
      // Bounce the cart icon
      cartIcon.classList.add(styles.cartBounce);
      cartIcon.addEventListener(
        'animationend',
        () => cartIcon.classList.remove(styles.cartBounce),
        { once: true }
      );
      onDone?.();
    };

    el.addEventListener('animationend', handleEnd, { once: true });
  }, [startRect, onDone]);

  return createPortal(
    <img
      ref={elRef}
      src={image}
      alt=""
      className={styles.flyingItem}
      style={{
        left: startRect.left,
        top: startRect.top,
        width: startRect.width,
        height: startRect.height,
        borderRadius: '10px',
      }}
    />,
    document.body
  );
};

/* ── Main modal ── */
const CartSuccessModal = ({ show, onClose, productImage, productName }) => {
  const navigate = useNavigate();
  const thumbRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const hasTriggeredFlyRef = useRef(false);
  const [flyRect, setFlyRect] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Reset & show
  useEffect(() => {
    if (!show) {
      setFlyRect(null);
      setVisible(false);
      hasTriggeredFlyRef.current = false;
      return;
    }

    setVisible(true);

    if (hasTriggeredFlyRef.current) {
      return;
    }

    hasTriggeredFlyRef.current = true;

    // Trigger fly after modal renders and thumbnail is visible
    const t1 = setTimeout(() => {
      const el = thumbRef.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        setFlyRect({ left: rect.left, top: rect.top, width: rect.width, height: rect.height });
      }
    }, 350);

    // Auto-close
    const t2 = setTimeout(() => {
      onCloseRef.current?.();
    }, MODAL_DURATION + 100);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [show]);

  if (!visible) {
    return null;
  }

  return createPortal(
    <>
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          {/* Progress bar */}
          <div
            className={styles.progressBar}
            style={{ '--modal-duration': `${MODAL_DURATION}ms` }}
          />

          <div className={styles.productInfoRow}>
            <img
              ref={thumbRef}
              src={productImage}
              alt={productName}
              className={styles.productThumb}
            />
            <p className={styles.productName}>{productName}</p>
          </div>

          <p className={styles.successText}>Đã thêm vào giỏ hàng!</p>

          <div className={styles.actions}>
            <button className={styles.btnContinue} onClick={onClose}>
              Tiếp tục mua
            </button>
            <button
              className={styles.btnGoCart}
              onClick={() => {
                onClose();
                navigate('/buyer/cart');
              }}
            >
              Xem giỏ hàng
            </button>
          </div>
        </div>
      </div>

      {/* Flying clone */}
      {flyRect && (
        <FlyingItem image={productImage} startRect={flyRect} onDone={() => setFlyRect(null)} />
      )}
    </>,
    document.body
  );
};

CartSuccessModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  productImage: PropTypes.string,
  productName: PropTypes.string,
};

export default CartSuccessModal;
