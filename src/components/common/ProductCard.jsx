import { Link } from 'react-router-dom';
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

  return (
    <Link to={`/product/${product.id}`} className={styles.productCard}>
      {/* Badge */}
      {product.badge && (
        <div className={`${styles.badge} ${styles[product.badgeColor]}`}>{product.badge}</div>
      )}

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
  }).isRequired,
};

export default ProductCard;
