import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useState } from 'react';
import { toast } from 'react-toastify';
import PropTypes from 'prop-types';
import { formatCurrency } from '@utils/formatters';
import { getProductImages } from '@utils/data/ProductsPage_MockData';
import * as favouriteService from '@services/api/favouriteService';
import styles from '@assets/styles/ProductListItem.module.css';

const ProductListItem = ({ product }) => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const [isFav, setIsFav] = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  const productImage = (() => {
    if (product.tier_variations && product.tier_variations.length > 0) {
      const images = getProductImages(product);
      return images.length > 0 ? images[0] : product.image;
    }
    return product.image;
  })();

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
      toast.info('Please login to add favourites');
      navigate('/login');
      return;
    }

    setFavLoading(true);
    try {
      if (isFav) {
        await favouriteService.removeFromFavourites(product.id);
        setIsFav(false);
        toast.success('Removed from wishlist');
      } else {
        await favouriteService.addToFavourites(product.id);
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
    <div className={styles.productListItem} onClick={handleCardClick} role="link" tabIndex={0}>
      <div className={styles.imageWrapper}>
        <img src={productImage} alt={product.name} className={styles.productImage} />
        {discountPercentage > 0 && (
          <div className={styles.discountBadge}>-{discountPercentage}%</div>
        )}
        {product.badge && (
          <div className={`${styles.badge} ${styles[product.badgeColor]}`}>{product.badge}</div>
        )}
      </div>

      <div className={styles.productInfo}>
        <h3 className={styles.productName}>{product.name}</h3>
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
};

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
  }).isRequired,
};

export default ProductListItem;
