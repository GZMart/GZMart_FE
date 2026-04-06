import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import PropTypes from 'prop-types';
import { formatCurrency } from '@utils/formatters';
import * as wishlistService from '@/services/api/wishlistService';
import styles from '@assets/styles/buyer/Product/ProductListItem.module.css';

const ProductListItem = React.forwardRef(({ product }, ref) => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const [isFav, setIsFav] = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  const productImage = product.image || '';

  // Flash sale countdown timer
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!product.dealEndDate) {
      return;
    }

    const updateTimer = () => {
      const now = new Date().getTime();
      const end = new Date(product.dealEndDate).getTime();
      const distance = end - now;

      if (distance < 0) {
        setTimeLeft('Ended');
        return;
      }

      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [product.dealEndDate]);

  const isFlashSale = product.dealType === 'flash_sale';
  const soldPercentage = product.dealQuantityLimit
    ? Math.round((product.dealSoldCount / product.dealQuantityLimit) * 100)
    : 0;

  const discountPercentage =
    product.originalPrice > 0 && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0;

  const ratingValue = parseFloat(product.rating) || 0;
  const fullStars = Math.floor(ratingValue);
  const hasHalfStar = ratingValue - fullStars >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  const handleCardClick = () => {
    navigate(`/product/${product.id}`);
  };

  const handleWishlistToggle = async (e) => {
    e.stopPropagation();
    e.preventDefault();

    if (!user) {
      toast.info('Please login to add wishlists');
      navigate('/login');
      return;
    }

    setFavLoading(true);
    try {
      if (isFav) {
        await wishlistService.removeFromWishlists(product.id);
        setIsFav(false);
        toast.success('Removed from wishlist');
      } else {
        await wishlistService.addToWishlists(product.id);
        setIsFav(true);
        toast.success('Added to wishlist');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update wishlist');
    } finally {
      setFavLoading(false);
    }
  };
  return (
    <div
      className={styles.productListItem}
      onClick={handleCardClick}
      role="link"
      tabIndex={0}
      ref={ref}
    >
      <div className={styles.imageWrapper}>
        <img src={productImage} alt={product.name} className={styles.productImage} />
        {isFlashSale ? (
          <div
            className={styles.badge}
            style={{
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
            }}
          >
            ⚡ FLASH SALE
          </div>
        ) : discountPercentage > 0 ? (
          <div className={styles.discountBadge}>-{discountPercentage}%</div>
        ) : null}
        {product.badge && (
          <div className={`${styles.badge} ${styles[product.badgeColor]}`}>{product.badge}</div>
        )}
      </div>

      <div className={styles.productInfo}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <h3 className={styles.productName}>{product.name}</h3>
          {isFlashSale && timeLeft && (
            <span
              style={{
                background: '#fff3cd',
                color: '#856404',
                padding: '4px 12px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: '600',
                whiteSpace: 'nowrap',
              }}
            >
              ⏰ {timeLeft}
            </span>
          )}
        </div>

        {/* Sold Progress */}
        {isFlashSale && product.dealQuantityLimit && (
          <div style={{ marginBottom: '8px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '11px',
                marginBottom: '4px',
                color: '#666',
              }}
            >
              <span>
                Sold: {product.dealSoldCount} / {product.dealQuantityLimit}
              </span>
              <span>{soldPercentage}%</span>
            </div>
            <div
              style={{
                height: '6px',
                background: '#e9ecef',
                borderRadius: '3px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${soldPercentage}%`,
                  background: 'linear-gradient(90deg, #f093fb 0%, #f5576c 100%)',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>
        )}

        <div className={styles.rating}>
          <div className={styles.stars}>
            {[...Array(fullStars)].map((_, i) => (
              <i key={`full-${i}`} className={`bi bi-star-fill ${styles.starFilled}`}></i>
            ))}
            {hasHalfStar && <i className={`bi bi-star-half ${styles.starFilled}`}></i>}
            {[...Array(emptyStars)].map((_, i) => (
              <i key={`empty-${i}`} className={`bi bi-star ${styles.starEmpty}`}></i>
            ))}
            <span className={styles.ratingValue}>{ratingValue.toFixed(1)}</span>
          </div>
          <span className={styles.soldCount}>Sold {product.sold || 0}</span>
        </div>
        <div className={styles.prices}>
          <span className={styles.currentPrice}>{formatCurrency(product.price)}</span>
          {discountPercentage > 0 && (
            <span className={styles.originalPrice}>{formatCurrency(product.originalPrice)}</span>
          )}
        </div>
      </div>

      <div className={styles.actions}>
        <button
          className={`${styles.wishlistBtn} ${isFav ? styles.wishlistBtnActive : ''}`}
          onClick={handleWishlistToggle}
          disabled={favLoading}
          aria-label={isFav ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <i className={`bi ${isFav ? 'bi-heart-fill' : 'bi-heart'}`}></i>
        </button>
        <button
          className={styles.viewDetailBtn}
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/product/${product.id}`);
          }}
        >
          View Details
          <i className="bi bi-arrow-right"></i>
        </button>
      </div>
    </div>
  );
});

// Give the component a display name for debugging since it's wrapped in forwardRef
ProductListItem.displayName = 'ProductListItem';

ProductListItem.propTypes = {
  product: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    image: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
    originalPrice: PropTypes.number,
    rating: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    reviews: PropTypes.number,
    sold: PropTypes.number,
    badge: PropTypes.string,
    badgeColor: PropTypes.string,
    tier_variations: PropTypes.array,
    // Flash sale / Deal fields
    dealId: PropTypes.string,
    dealType: PropTypes.string,
    dealStatus: PropTypes.string,
    dealStartDate: PropTypes.string,
    dealEndDate: PropTypes.string,
    dealSoldCount: PropTypes.number,
    dealQuantityLimit: PropTypes.number,
  }).isRequired,
};

export default ProductListItem;
