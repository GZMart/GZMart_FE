/* eslint-disable react/prop-types */
/**
 * SuggestedForYouPreview — Live Render Component for Suggested For You Module
 *
 * Props:
 * - module: module object from Redux
 * - isSelected: boolean
 * - onSelect: callback
 */

import { getModuleProducts } from '@services/shopDecoration/moduleTemplates';
import ProductCard from './Common/ProductCard';
import styles from '@assets/styles/seller/ShopDecorationPage.module.css';

export default function SuggestedForYouPreview({ module, isSelected, onSelect }) {
  const products = getModuleProducts(module, 8);
  const hasEnoughProducts = products.length >= 3;

  return (
    <div
      className={`${styles.suggestedWrap} ${isSelected ? styles.suggestedWrapSelected : ''}`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect && onSelect()}
    >
      <div className={styles.suggestedHeader}>
        <h3 className={styles.suggestedTitle}>Suggested For You</h3>
        {hasEnoughProducts && (
          <button className={styles.suggestedSeeAll}>
            See All <i className="bi bi-chevron-right" />
          </button>
        )}
      </div>

      {hasEnoughProducts ? (
        <div className={styles.suggestedGrid}>
          {products.map((product, idx) => (
            <div key={product.id || idx} className={styles.suggestedItem}>
              <ProductCard product={product} size="md" />
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.suggestedWarning}>
          <div className={styles.suggestedWarningIcon}>
            <i className="bi bi-hand-thumbs-up" />
          </div>
          <p className={styles.suggestedWarningText}>
            Less than 3 valid products. This design will not be displayed on the Shop&apos;s homepage.
          </p>
        </div>
      )}
    </div>
  );
}
