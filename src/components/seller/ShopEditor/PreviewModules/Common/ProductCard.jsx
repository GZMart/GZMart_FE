/* eslint-disable react/prop-types */
/**
 * ProductCard — Reusable product card component cho Grid/Bento/Flash Deals
 *
 * Props:
 * - product: product object
 * - size: 'sm' | 'md' | 'lg' (default 'md')
 * - showDiscount: boolean (default true)
 */

import { formatPrice, formatSold } from '@services/shopDecoration/mockData';
import styles from '@assets/styles/seller/ShopDecorationPage.module.css';

export default function ProductCard({ product, size = 'md', showDiscount = true }) {
  if (!product) {
return null;
}

  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const discount = product.discount || (hasDiscount
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0);

  return (
    <div className={`${styles.productCard} ${styles[`productCard_${size}`]}`}>
      {/* Image */}
      <div className={styles.productCardImgWrap}>
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className={styles.productCardImg}
            draggable={false}
          />
        ) : (
          <div className={styles.productCardImgPlaceholder}>
            <i className="bi bi-image" />
          </div>
        )}

        {/* Discount badge */}
        {hasDiscount && showDiscount && discount > 0 && (
          <div className={styles.productCardDiscount}>
            -{discount}%
          </div>
        )}

        {/* Sold indicator */}
        {product.sold > 0 && (
          <div className={styles.productCardSold}>
            Da ban {formatSold(product.sold)}
          </div>
        )}
      </div>

      {/* Info */}
      <div className={styles.productCardInfo}>
        <h4 className={styles.productCardName}>{product.name}</h4>
        <div className={styles.productCardPriceRow}>
          <span className={styles.productCardPrice}>{formatPrice(product.price)}</span>
          {hasDiscount && (
            <span className={styles.productCardOriginal}>
              {formatPrice(product.originalPrice)}
            </span>
          )}
        </div>
        {product.rating && (
          <div className={styles.productCardRating}>
            <i className="bi bi-star-fill" style={{ color: '#f59e0b', fontSize: 11 }} />
            <span>{product.rating}</span>
            {product.location && (
              <span className={styles.productCardLocation}>{product.location}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
