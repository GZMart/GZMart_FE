import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { formatCurrency } from '@utils/formatters';
import { getProductImages } from '@utils/data/ProductsPage_MockData';
import styles from '@assets/styles/ProductCard.module.css';

const ProductCard = ({ product }) => {
  // Get first image from tier_variations or fallback to product.image
  const productImage = (() => {
    if (product.tier_variations && product.tier_variations.length > 0) {
      const images = getProductImages(product);
      return images.length > 0 ? images[0] : product.image;
    }
    return product.image;
  })();
  const discountPercentage = Math.round(
    ((product.originalPrice - product.price) / product.originalPrice) * 100
  );

  // Flash sale countdown timer
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!product.dealEndDate) return;

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

  return (
    <Link to={`/product/${product.id}`} className={styles.productCard}>
      {/* Badge */}
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
      ) : product.badge ? (
        <div className={`${styles.badge} ${styles[product.badgeColor]}`}>{product.badge}</div>
      ) : null}

      {/* Product Image */}
      <div className={styles.imageWrapper}>
        <img src={productImage} alt={product.name} className={styles.productImage} />
        <div className={styles.actions}>
          <button className={styles.actionBtn} aria-label="Add to cart">
            <i className="bi bi-cart3"></i>
          </button>
          <button className={styles.actionBtn} aria-label="Add to wishlist">
            <i className="bi bi-plus"></i>
          </button>
        </div>
      </div>

      {/* Product Info */}
      <div className={styles.productInfo}>
        <h3 className={styles.productName}>{product.name}</h3>

        {/* Flash Sale Info */}
        {isFlashSale && product.dealEndDate && (
          <div
            style={{
              background: '#fff3cd',
              padding: '6px 10px',
              borderRadius: '4px',
              marginBottom: '8px',
              fontSize: '12px',
              fontWeight: '600',
              color: '#856404',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>⏰ Ends in:</span>
            <span style={{ color: '#dc3545' }}>{timeLeft}</span>
          </div>
        )}

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
            {[...Array(5)].map((_, i) => (
              <i key={i} className={`bi bi-star-fill ${styles.star}`}></i>
            ))}
            <span className={styles.ratingValue}>{product.rating}</span>
          </div>
          <span className={styles.reviews}>({product.reviews} Reviews)</span>
        </div>
        <div className={styles.priceRow}>
          <div className={styles.prices}>
            <span className={styles.currentPrice}>{formatCurrency(product.price)}</span>
            <span className={styles.originalPrice}>{formatCurrency(product.originalPrice)}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className={styles.cardActions}>
        <button className={styles.getDealBtn}>
          <i className="bi bi-lightning-fill"></i>
          GET DEAL - {formatCurrency(product.price)}
        </button>
        <button className={styles.buyNowBtn}>BUY NOW - {formatCurrency(product.price)}</button>
      </div>
    </Link>
  );
};

ProductCard.propTypes = {
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

export default ProductCard;
