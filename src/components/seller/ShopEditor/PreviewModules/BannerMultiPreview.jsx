/* eslint-disable react/prop-types */
/**
 * BannerMultiPreview — Live Render Component cho Banner Multi-Column Module
 *
 * Props:
 * - module: module object tu Redux
 * - isSelected: boolean
 * - onSelect: callback
 */

import { getModuleBanners } from '@services/shopDecoration/moduleTemplates';
import styles from '@assets/styles/seller/ShopDecorationPage.module.css';

export default function BannerMultiPreview({ module, isSelected, onSelect }) {
  const banners = getModuleBanners(module);
  const { props = {} } = module || {};
  const columns = props.columns || 2;

  if (banners.length === 0) {
    return (
      <div className={styles.bannerEmpty} onClick={onSelect}>
        <i className="bi bi-grid-3x3-gap" />
        <p>Chua co banner nao</p>
        <small>Them hinh anh de hien thi</small>
      </div>
    );
  }

  return (
    <div
      className={`${styles.bannerMulti} ${isSelected ? styles.bannerMultiSelected : ''}`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect && onSelect()}
    >
      <div
        className={styles.bannerMultiGrid}
        style={{ gridTemplateColumns: `repeat(${Math.min(columns, banners.length)}, 1fr)` }}
      >
        {banners.slice(0, columns * 2).map((banner, idx) => (
          <div key={banner.id || idx} className={styles.bannerMultiItem}>
            <img
              src={banner.url}
              alt={banner.alt || `Banner ${idx + 1}`}
              className={styles.bannerMultiImg}
              draggable={false}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
