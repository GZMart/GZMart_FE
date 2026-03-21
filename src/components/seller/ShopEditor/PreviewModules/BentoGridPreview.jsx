/* eslint-disable react/prop-types */
/**
 * BentoGridPreview — Live Render Component cho Product Grid Module
 *
 * Ho tro 2 layout:
 * - Bento: 1 o lon + 4 o nho
 * - Standard: grid 4 cot
 *
 * Props:
 * - module: module object tu Redux
 * - isSelected: boolean
 * - onSelect: callback
 */

import { getModuleProducts } from '@services/shopDecoration/moduleTemplates';
import ProductCard from './Common/ProductCard';
import styles from '@assets/styles/seller/ShopDecorationPage.module.css';

export default function BentoGridPreview({ module, isSelected, onSelect }) {
  const { props = {} } = module || {};
  const layout = props.layout || 'bento';
  const hideTitle = props.hideTitle || false;
  const title = props.title || 'San Pham Noi Bat';
  const bgColor = props.bgColor || '#fff';
  const dropShadow = props.dropShadow !== false;

  const products = getModuleProducts(module, layout === 'bento' ? 5 : 8);

  if (products.length === 0) {
    return (
      <div
        className={`${styles.bentoWrap} ${isSelected ? styles.bentoSelected : ''}`}
        style={{ background: bgColor }}
        onClick={onSelect}
      >
        {!hideTitle && <h3 className={styles.bentoTitle}>{title}</h3>}
        <div className={styles.bentoEmpty}>
          <i className="bi bi-grid-3x3-gap" />
          <p>Chua co san pham nao</p>
          <small>Chon san pham trong panel cau hinh</small>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${styles.bentoWrap} ${isSelected ? styles.bentoSelected : ''}`}
      style={{ background: bgColor, boxShadow: dropShadow ? '0 2px 12px rgba(0,0,0,0.06)' : 'none' }}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect && onSelect()}
    >
      {/* Header */}
      {!hideTitle && (
        <div className={styles.bentoHeader}>
          <h3 className={styles.bentoTitle}>{title}</h3>
          <button className={styles.bentoSeeAll}>Xem tat ca</button>
        </div>
      )}

      {/* Grid Body */}
      {layout === 'bento' ? (
        <BentoLayout products={products} />
      ) : (
        <StandardLayout products={products} />
      )}
    </div>
  );
}

function BentoLayout({ products }) {
  const [main, ...rest] = products;
  return (
    <div className={styles.bentoGrid}>
      {/* Main large item */}
      {main && (
        <div className={styles.bentoMainItem}>
          <ProductCard product={main} size="lg" />
        </div>
      )}
      {/* Small items */}
      <div className={styles.bentoSmallItems}>
        {rest.slice(0, 4).map((p, idx) => (
          <div key={p.id || idx} className={styles.bentoSmallItem}>
            <ProductCard product={p} size="sm" />
          </div>
        ))}
      </div>
    </div>
  );
}

function StandardLayout({ products }) {
  return (
    <div className={styles.bentoStandardGrid}>
      {products.map((p, idx) => (
        <div key={p.id || idx} className={styles.bentoStandardItem}>
          <ProductCard product={p} size="md" />
        </div>
      ))}
    </div>
  );
}
