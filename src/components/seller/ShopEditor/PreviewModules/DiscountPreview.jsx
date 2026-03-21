/* eslint-disable react/prop-types */
/**
 * DiscountPreview — Live Render Component for Discount Module
 *
 * Props:
 * - module: module object from Redux
 * - isSelected: boolean
 * - onSelect: callback
 */

import styles from '@assets/styles/seller/ShopDecorationPage.module.css';

export default function DiscountPreview({ _module, isSelected, onSelect }) {
  // Always show skeleton in preview (not actual vouchers)
  const skeletonCount = 4; // Show 4 skeleton cards

  return (
    <div
      className={`${styles.discountWrap} ${isSelected ? styles.discountWrapSelected : ''}`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect && onSelect()}
    >
      <div className={styles.discountContent}>
        <div className={styles.discountHeader}>
          <div className={styles.discountHeaderLeft}>
            <i className="bi bi-ticket-perforated" />
            <h3 className={styles.discountTitle}>Shop&apos;s Discount Codes</h3>
          </div>
          <button className={styles.discountSeeAll}>
            See All
          </button>
        </div>
        <div className={styles.discountScroll}>
          {[...Array(skeletonCount)].map((_, index) => (
            <DiscountSkeletonCard key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}

// Skeleton card for preview (always shows loading state)
function DiscountSkeletonCard() {
  return (
    <div className={styles.discountCard}>
      {/* Left section with red accent bar */}
      <div className={styles.discountCardLeft}>
        <div className={styles.discountCardAccent} />
        <div className={styles.discountCardLeftContent}>
          <div className={styles.discountCardSkeleton}>
            <div className={styles.skeletonLine} style={{ width: '80px', height: '18px', marginBottom: '6px' }} />
            <div className={styles.skeletonLine} style={{ width: '120px', height: '14px', marginBottom: '4px' }} />
            <div className={styles.skeletonLine} style={{ width: '90px', height: '11px' }} />
          </div>
        </div>
      </div>
      
      {/* Dashed divider */}
      <div className={styles.discountCardDivider}>
        {[...Array(6)].map((_, i) => (
          <div key={i} className={styles.discountCardDividerDot} />
        ))}
      </div>
      
      {/* Right section with button skeleton */}
      <div className={styles.discountCardRight}>
        <div className={styles.discountCardButtonSkeleton} />
      </div>
    </div>
  );
}
