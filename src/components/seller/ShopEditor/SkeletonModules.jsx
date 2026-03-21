/**
 * Skeleton Loaders for Shop Decoration Preview
 *
 * Hien thi loading state thay vi man hinh trong
 * khi du lieu dang duoc fetch tu API.
 */

import React from 'react';
import styles from '@assets/styles/seller/ShopDecorationPage.module.css';

/** Full preview skeleton - hien thi khi ca page dang loading */
export function PreviewSkeleton() {
  return (
    <div className={styles.previewInner}>
      <ShopProfileSkeleton />
      <BannerCarouselSkeleton />
      <ProductGridSkeleton />
    </div>
  );
}

/** Shop profile skeleton */
export function ShopProfileSkeleton() {
  return (
    <div className={styles.skeletonWrap}>
      <div className={`${styles.skeleton} ${styles.skeletonCover}`} />
      <div className={styles.skeletonProfileRow}>
        <div className={`${styles.skeleton} ${styles.skeletonAvatar}`} />
        <div className={styles.skeletonTextBlock}>
          <div className={`${styles.skeleton} ${styles.skeletonLine} ${styles.skeletonLineMd}`} />
          <div className={`${styles.skeleton} ${styles.skeletonLine} ${styles.skeletonLineSm}`} />
        </div>
      </div>
    </div>
  );
}

/** Banner carousel skeleton */
export function BannerCarouselSkeleton() {
  return (
    <div className={styles.skeletonWrap}>
      <div className={`${styles.skeleton} ${styles.skeletonBanner}`} />
    </div>
  );
}

/** Product grid skeleton */
export function ProductGridSkeleton() {
  return (
    <div className={styles.skeletonWrap}>
      <div className={`${styles.skeleton} ${styles.skeletonLine} ${styles.skeletonLineLg}`} />
      <div className={styles.skeletonProductGrid}>
        {[...Array(5)].map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

/** Individual product card skeleton */
export function ProductCardSkeleton() {
  return (
    <div className={styles.skeletonProductCard}>
      <div className={`${styles.skeleton} ${styles.skeletonProductImg}`} />
      <div className={`${styles.skeleton} ${styles.skeletonLine} ${styles.skeletonLineSm}`} />
      <div className={`${styles.skeleton} ${styles.skeletonLine} ${styles.skeletonLineXs}`} />
    </div>
  );
}

/** Voucher skeleton */
export function VoucherSkeleton() {
  return (
    <div className={styles.skeletonVoucher}>
      <div className={styles.skeletonVoucherLeft}>
        <div className={`${styles.skeleton} ${styles.skeletonLine} ${styles.skeletonLineMd}`} />
        <div className={`${styles.skeleton} ${styles.skeletonLine} ${styles.skeletonLineXs}`} />
      </div>
      <div className={styles.skeletonVoucherRight}>
        <div className={`${styles.skeleton} ${styles.skeletonLine} ${styles.skeletonLineSm}`} />
        <div className={`${styles.skeleton} ${styles.skeletonLine} ${styles.skeletonLineXs}`} />
        <div className={`${styles.skeleton} ${styles.skeletonLine} ${styles.skeletonLineXs}`} />
      </div>
    </div>
  );
}

export default PreviewSkeleton;
