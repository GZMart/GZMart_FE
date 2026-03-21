/* eslint-disable react/prop-types */
/**
 * ShopProfilePreview — Live Render Component cho Shop Info Module
 *
 * Props:
 * - module: module object tu Redux
 * - isSelected: boolean - co dang duoc chon khong
 * - onSelect: callback khi click vao module
 */

import { getModuleShopInfo } from '@services/shopDecoration/moduleTemplates';
import styles from '@assets/styles/seller/ShopDecorationPage.module.css';

export default function ShopProfilePreview({ module, isSelected, onSelect }) {
  const shop = getModuleShopInfo(module);

  const formatCount = (n) => {
    if (!n) {
return '0';
}
    if (n >= 1000) {
return `${(n / 1000).toFixed(1)}k`;
}
    return n.toString();
  };

  return (
    <div
      className={`${styles.spPreviewWrap} ${isSelected ? styles.spPreviewSelected : ''}`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect && onSelect()}
    >
      {/* Cover Image */}
      <div className={styles.spCover}>
        {shop.coverImage ? (
          <img
            src={shop.coverImage}
            alt="Shop Cover"
            className={styles.spCoverImg}
          />
        ) : (
          <div className={styles.spCoverPlaceholder}>
            <span>Tải ảnh bìa lên</span>
          </div>
        )}
      </div>

      {/* Profile Row */}
      <div className={styles.spProfileRow}>
        {/* Avatar */}
        <div className={styles.spAvatarWrap}>
          {shop.avatar ? (
            <img src={shop.avatar} alt={shop.name} className={styles.spAvatar} />
          ) : (
            <div className={styles.spAvatarPlaceholder}>
              <i className="bi bi-person-fill" />
            </div>
          )}
        </div>

        {/* Shop Info */}
        <div className={styles.spInfo}>
          <h2 className={styles.spName}>{shop.name}</h2>
          <div className={styles.spMeta}>
            <span className={styles.spMetaItem}>
              <i className="bi bi-star-fill" style={{ color: '#f59e0b' }} />
              {shop.rating} ({formatCount(shop.reviewCount)})
            </span>
            <span className={styles.spMetaDot}>|</span>
            <span className={styles.spMetaItem}>
              <i className="bi bi-people-fill" />
              {formatCount(shop.followerCount)} Theo doi
            </span>
          </div>
          {shop.location && (
            <p className={styles.spLocation}>
              <i className="bi bi-geo-alt-fill" />
              {shop.location}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className={styles.spActions}>
          <button className={styles.spBtnFollow}>
            <i className="bi bi-plus-lg" /> Theo doi
          </button>
          <button className={styles.spBtnChat}>
            <i className="bi bi-chat-dots-fill" /> Chat
          </button>
        </div>
      </div>
    </div>
  );
}
