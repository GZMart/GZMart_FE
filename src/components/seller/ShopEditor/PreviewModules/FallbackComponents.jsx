/**
 * Fallback Preview Components
 *
 * These render when a module type has no dedicated preview component yet.
 * Each renders a styled placeholder showing the module type + its current props,
 * and responds to click-to-select from the editor canvas.
 *
 * As each module type gets a full preview component, remove it from here
 * and register it in PreviewCanvas's MODULE_RENDERERS map.
 */

import PropTypes from 'prop-types';
import { MODULE_TYPES, MODULE_LABELS } from '@services/api/shopDecorationService';
import styles from '@assets/styles/seller/ShopDecorationPage.module.css';

// ─── Shared placeholder wrapper ─────────────────────────────────────────────
function PlaceholderWrap({ icon, label, sublabel, style, onClick }) {
  return (
    <div className={styles.bannerEmpty} onClick={onClick} style={style}>
      <i className={`bi ${icon}`} />
      <p>{label}</p>
      {sublabel && <small>{sublabel}</small>}
    </div>
  );
}

PlaceholderWrap.propTypes = {
  icon: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  sublabel: PropTypes.string,
  style: PropTypes.object,
  onClick: PropTypes.func.isRequired,
};

// ─── BannerSinglePreview ─────────────────────────────────────────────────────
export function BannerSinglePreview({ module, isSelected, onSelect }) {
  const { props = {} } = module || {};
  return (
    <div className={styles.bannerSingleWrap} onClick={onSelect}>
      {props.image ? (
        <img src={props.image} alt="Banner" className={styles.bannerSingleImg} />
      ) : (
        <div className={styles.bannerEmpty}>
          <i className="bi bi-image" />
          <p>Banner 1 Hình</p>
          <small>Thêm hình ảnh trong panel cấu hình</small>
        </div>
      )}
    </div>
  );
}

// ─── BannerHotspotPreview ───────────────────────────────────────────────────
export function BannerHotspotPreview({ module, isSelected, onSelect }) {
  const { props = {} } = module || {};
  return (
    <div className={styles.bannerHotspotWrap} onClick={onSelect}>
      {props.image ? (
        <div style={{ position: 'relative' }}>
          <img src={props.image} alt="Hotspot" className={styles.bannerSlideImg} />
          {(props.hotspots || []).map((h, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${h.x}%`,
                top: `${h.y}%`,
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: '#fff',
                transform: 'translate(-50%, -50%)',
                border: '2.5px solid #ee4d2d',
                zIndex: 2,
                boxShadow: '0 0 0 3px rgba(238,77,45,0.25)',
              }}
            />
          ))}
        </div>
      ) : (
        <div className={styles.bannerEmpty}>
          <i className="bi bi-pin-map" />
          <p>Banner Hotspot</p>
          <small>Thêm hình ảnh & hotspot trong panel cấu hình</small>
        </div>
      )}
    </div>
  );
}

// ─── AddonDealsPreview ──────────────────────────────────────────────────────
export function AddonDealsPreview({ module, isSelected, onSelect }) {
  const { props = {} } = module || {};
  return (
    <PlaceholderWrap
      icon="bi bi-bag-plus-fill"
      label={props.title || 'Mua Kèm Deal Sốc'}
      sublabel="Cấu hình chi tiết trong panel bên phải"
      style={{ minHeight: 80, color: '#6366f1' }}
      onClick={onSelect}
    />
  );
}

// ─── ComboPromosPreview ─────────────────────────────────────────────────────
export function ComboPromosPreview({ module, isSelected, onSelect }) {
  const { props = {} } = module || {};
  return (
    <PlaceholderWrap
      icon="bi bi-box-seam-fill"
      label={props.title || 'Combo Khuyến Mãi'}
      sublabel="Cấu hình chi tiết trong panel bên phải"
      style={{ minHeight: 80, color: '#10b981' }}
      onClick={onSelect}
    />
  );
}

// ─── CategoriesPreview ───────────────────────────────────────────────────────
const FALLBACK_CATEGORIES = [
  { name: 'Công Nghệ', icon: 'bi-laptop' },
  { name: 'Phụ Kiện', icon: 'bi-headphones' },
  { name: 'Thời Trang', icon: 'bi-handbag' },
  { name: 'Nhà Cửa', icon: 'bi-house-heart' },
  { name: 'Thể Thao', icon: 'bi-bicycle' },
  { name: 'Sắc Đẹp', icon: 'bi-stars' },
];

export function CategoriesPreview({ module, isSelected, onSelect }) {
  const { props = {} } = module || {};
  return (
    <div className={styles.categoriesWrap} onClick={onSelect}>
      {!props.hideTitle && (
        <h3 className={styles.categoriesTitle}>
          {props.title || MODULE_LABELS[module?.type] || 'Category'}
        </h3>
      )}
      <div className={styles.categoriesGrid}>
        {FALLBACK_CATEGORIES.map((cat, i) => (
          <div key={i} className={styles.categoryItem}>
            <i className={`bi ${cat.icon}`} />
            <span>{cat.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── TextPreview ────────────────────────────────────────────────────────────
export function TextPreview({ module, isSelected, onSelect }) {
  const { props = {} } = module || {};
  return (
    <div className={styles.textModuleWrap} onClick={onSelect}>
      {props.title && <h3 className={styles.textModuleTitle}>{props.title}</h3>}
      <p className={styles.textModuleContent}>
        {props.content || 'Nhập nội dung văn bản tại đây...'}
      </p>
    </div>
  );
}

// ─── ImageTextPreview ───────────────────────────────────────────────────────
export function ImageTextPreview({ module, isSelected, onSelect }) {
  const { props = {} } = module || {};
  return (
    <div className={styles.imageTextWrap} onClick={onSelect}>
      {props.image && (
        <img src={props.image} alt="" className={styles.imageTextImg} />
      )}
      <div className={styles.imageTextContent}>
        {props.title && <h3 className={styles.imageTextTitle}>{props.title}</h3>}
        <p className={styles.imageTextBody}>
          {props.content || 'Nhập nội dung...'}
        </p>
      </div>
    </div>
  );
}
