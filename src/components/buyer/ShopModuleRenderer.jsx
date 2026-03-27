/**
 * ShopModuleRenderer — Buyer-side module renderer for ShopProfilePage
 *
 * Renders modules from shop decoration config (liveModules) on the storefront.
 * Each module type has its own render component.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MODULE_TYPES } from '@services/api/shopDecorationService';
import styles from '@assets/styles/buyer/ShopModuleRenderer.module.css';

// ─── Banner Carousel ───────────────────────────────────────────────────────────
function BannerCarouselModule({ module, isMobile }) {
  const navigate = useNavigate();
  const { props = {} } = module;
  const images = props.images || [];
  const aspectRatio = props.aspectRatio || '2:1';
  
  const ratioPad = aspectRatio === '2:1' ? '50%' : aspectRatio === '16:9' ? '56.25%' : '75%';

  const handleLinkClick = (link) => {
    if (!link) {
return;
}
    if (link.startsWith('/product/')) {
      navigate(`/product/${link.replace('/product/', '')}`);
    } else if (link.startsWith('/category/')) {
      navigate(`/category/${link.replace('/category/', '')}`);
    } else if (link.startsWith('/voucher/')) {
      // Handle voucher link
    } else if (link.startsWith('/combo/')) {
      navigate(`/combo/${link.replace('/combo/', '')}`);
    } else if (link.startsWith('/addon/')) {
      navigate(`/addon/${link.replace('/addon/', '')}`);
    } else if (link.startsWith('/')) {
      navigate(link);
    } else if (typeof link === 'string' && link.startsWith('__')) {
      // Internal link types (voucher, combo, addon without specific ID)
    }
  };

  if (images.length === 0) {
return null;
}

  return (
    <div className={styles.bannerCarousel}>
      <div style={{ position: 'relative', width: '100%', paddingBottom: ratioPad }}>
        <div style={{ position: 'absolute', inset: 0 }}>
          {images.map((img, idx) => (
            <div
              key={idx}
              className={styles.bannerSlide}
              onClick={() => handleLinkClick(img.link)}
              style={{ cursor: img.link ? 'pointer' : 'default' }}
            >
              <img src={img.url} alt={`Banner ${idx + 1}`} className={styles.bannerSlideImg} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Banner Multi ──────────────────────────────────────────────────────────────
function BannerMultiModule({ module }) {
  const navigate = useNavigate();
  const { props = {} } = module;
  const images = props.images || [];
  const columns = props.columns || 2;

  const handleLinkClick = (link) => {
    if (!link) {
return;
}
    if (link.startsWith('/product/')) {
      navigate(`/product/${link.replace('/product/', '')}`);
    } else if (link.startsWith('/category/')) {
      navigate(`/category/${link.replace('/category/', '')}`);
    } else if (link.startsWith('/')) {
      navigate(link);
    }
  };

  if (images.length === 0) {
return null;
}

  return (
    <div className={styles.bannerMulti} style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {images.map((img, idx) => (
        <div
          key={idx}
          className={styles.bannerMultiItem}
          onClick={() => handleLinkClick(img.link)}
          style={{ cursor: img.link ? 'pointer' : 'default' }}
        >
          <img src={img.url} alt={`Banner ${idx + 1}`} className={styles.bannerMultiImg} />
        </div>
      ))}
    </div>
  );
}

// ─── Banner Single ─────────────────────────────────────────────────────────────
function BannerSingleModule({ module }) {
  const navigate = useNavigate();
  const { props = {} } = module;
  const image = props.image;
  const link = props.link;

  const handleLinkClick = () => {
    if (!link) {
return;
}
    if (link.startsWith('/product/')) {
      navigate(`/product/${link.replace('/product/', '')}`);
    } else if (link.startsWith('/category/')) {
      navigate(`/category/${link.replace('/category/', '')}`);
    } else if (link.startsWith('/')) {
      navigate(link);
    }
  };

  if (!image) {
return null;
}

  return (
    <div className={styles.bannerSingle} onClick={handleLinkClick} style={{ cursor: link ? 'pointer' : 'default' }}>
      <img src={image} alt="Banner" className={styles.bannerSingleImg} />
    </div>
  );
}

// ─── Banner Hotspot ─────────────────────────────────────────────────────────────
function BannerHotspotModule({ module }) {
  const navigate = useNavigate();
  const { props = {} } = module;
  const image = props.image;
  const hotspots = props.hotspots || [];

  const handleLinkClick = (link) => {
    if (!link) {
return;
}
    if (link.startsWith('/product/')) {
      navigate(`/product/${link.replace('/product/', '')}`);
    } else if (link.startsWith('/category/')) {
      navigate(`/category/${link.replace('/category/', '')}`);
    } else if (link.startsWith('/')) {
      navigate(link);
    }
  };

  if (!image) {
return null;
}

  return (
    <div className={styles.bannerHotspot}>
      <div className={styles.bannerHotspotImgWrap}>
        <img src={image} alt="Banner" className={styles.bannerHotspotImg} />
        {hotspots.map((hotspot, idx) => (
          <div
            key={idx}
            className={styles.hotspot}
            style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
            onClick={() => handleLinkClick(hotspot.link)}
            title={hotspot.label}
          >
            <div className={styles.hotspotPulse} />
            <div className={styles.hotspotDot} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Text Module ───────────────────────────────────────────────────────────────
function TextModule({ module }) {
  const { props = {} } = module;
  const title = props.title;
  const content = props.content;
  const align = props.align || 'left';

  if (!title && !content) {
return null;
}

  return (
    <div className={styles.textModule} style={{ textAlign: align }}>
      {title && <h3 className={styles.textTitle}>{title}</h3>}
      {content && <p className={styles.textContent}>{content}</p>}
    </div>
  );
}

// ─── Image Text Module ─────────────────────────────────────────────────────────
function ImageTextModule({ module }) {
  const navigate = useNavigate();
  const { props = {} } = module;
  const image = props.image;
  const title = props.title;
  const content = props.content;
  const position = props.position || 'left';

  const handleLinkClick = () => {
    if (!props.link) {
return;
}
    if (props.link.startsWith('/product/')) {
      navigate(`/product/${props.link.replace('/product/', '')}`);
    } else if (props.link.startsWith('/category/')) {
      navigate(`/category/${props.link.replace('/category/', '')}`);
    } else if (props.link.startsWith('/')) {
      navigate(props.link);
    }
  };

  return (
    <div className={`${styles.imageTextModule} ${styles[`imageText_${position}`]}`}>
      {image && (
        <div className={styles.imageTextImgWrap} onClick={handleLinkClick}>
          <img src={image} alt={title || 'Image'} className={styles.imageTextImg} />
        </div>
      )}
      <div className={styles.imageTextContent}>
        {title && <h3 className={styles.imageTextTitle}>{title}</h3>}
        {content && <p className={styles.imageTextDesc}>{content}</p>}
      </div>
    </div>
  );
}

// ─── Shop Info Module (simplified for buyer) ───────────────────────────────────
function ShopInfoModule({ module }) {
  const { props = {} } = module;
  const title = props.title;

  // ShopInfo is rendered separately in ShopProfilePage, so this module
  // might just show additional info or be hidden
  return (
    <div className={styles.shopInfoModule}>
      {title && <h3 className={styles.shopInfoTitle}>{title}</h3>}
    </div>
  );
}

// ─── Discount Module ────────────────────────────────────────────────────────────
function DiscountModule({ module }) {
  const { props = {} } = module;
  const vouchers = props.vouchers || [];

  // Discount module is rendered separately in ShopProfilePage
  // This could show additional discount info if needed
  return (
    <div className={styles.discountModule}>
      {vouchers.length > 0 && (
        <div className={styles.discountItems}>
          {vouchers.slice(0, 5).map((v, idx) => (
            <div key={idx} className={styles.discountItem}>
              {v.discountType === 'percent' ? `${v.discountValue}%` : `${v.discountValue}đ`}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Module Renderer Map ───────────────────────────────────────────────────────
const MODULE_RENDERERS = {
  [MODULE_TYPES.BANNER_CAROUSEL]: BannerCarouselModule,
  [MODULE_TYPES.BANNER_MULTI]: BannerMultiModule,
  [MODULE_TYPES.BANNER_SINGLE]: BannerSingleModule,
  [MODULE_TYPES.BANNER_HOTSPOT]: BannerHotspotModule,
  [MODULE_TYPES.TEXT]: TextModule,
  [MODULE_TYPES.IMAGE_TEXT]: ImageTextModule,
  [MODULE_TYPES.SHOP_INFO]: ShopInfoModule,
  [MODULE_TYPES.DISCOUNT]: DiscountModule,
  // These types are handled separately in ShopProfilePage:
  // VOUCHER, FLASH_DEALS, ADDON_DEALS, COMBO_PROMOS,
  // FEATURED_PRODUCTS, FEATURED_CATEGORIES, BEST_SELLING,
  // NEW_PRODUCTS, CATEGORY_LIST, SUGGESTED_FOR_YOU
};

/**
 * Main component: renders all modules from decoration config
 * 
 * @param {Object} props
 * @param {Array} props.modules - Array of module objects from liveModules
 * @param {boolean} props.isMobile - Whether to render mobile version
 */
export default function ShopModuleRenderer({ modules = [], isMobile = false }) {
  if (!modules || modules.length === 0) {
    return null;
  }

  // Filter out modules that are not rendered here (handled separately)
  const renderableModules = modules.filter((m) => {
    // Skip mandatory/order modules that are rendered separately
    const skipTypes = [
      MODULE_TYPES.SHOP_INFO,
      MODULE_TYPES.DISCOUNT,
      MODULE_TYPES.SUGGESTED_FOR_YOU,
      MODULE_TYPES.VOUCHER,
    ];
    return !skipTypes.includes(m.type);
  });

  return (
    <div className={`${styles.moduleRenderer} ${isMobile ? styles.mobile : styles.desktop}`}>
      {renderableModules.map((module) => {
        const Renderer = MODULE_RENDERERS[module.type];
        if (!Renderer) {
          console.warn(`No renderer for module type: ${module.type}`);
          return null;
        }
        return <Renderer key={module.id || module._id} module={module} isMobile={isMobile} />;
      })}
    </div>
  );
}

// Export individual module components for flexibility
export { BannerCarouselModule, BannerMultiModule, BannerSingleModule, BannerHotspotModule };
