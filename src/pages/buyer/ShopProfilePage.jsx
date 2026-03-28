import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { Ticket } from 'lucide-react';
import ProductCard from '../../components/common/ProductCard';
import Pagination from '../../components/common/Pagination';
import ShopInfoCard from '../../components/common/ShopInfoCard';
import { productService, followService, livestreamService } from '../../services/api';
import { MODULE_TYPES } from '../../services/api/shopDecorationService';
import voucherService from '../../services/api/voucherService';
import promotionBuyerService from '../../services/api/promotionBuyerService';
import { formatCurrency } from '../../utils/formatters';
import styles from '../../assets/styles/ShopProfilePage.module.css';

/* eslint-disable react/prop-types */

const normalizeProduct = (p) => {
  const activeModel = p.models?.find((m) => m.isActive) || p.models?.[0] || {};
  return {
    ...p,
    id: p._id || p.id,
    // Backend shopDecoration.service.js đã normalize image rồi → giữ nguyên.
    // Chỉ fallback sang logic phía FE khi backend chưa có (vd: getProductsBySeller).
    image:
      (p.image && String(p.image).trim()) ||
      p.images?.[0] ||
      p.tiers?.[0]?.images?.[0] ||
      activeModel.image ||
      '',
    price: activeModel.price || p.price || 0,
    originalPrice: activeModel.originalPrice || p.originalPrice || 0,
  };
};

// ─── Link handler helper ────────────────────────────────────────────────────────
const handleModuleLink = (link) => {
  if (!link) {
return;
}
  if (link.startsWith('/')) {
    window.location.href = link;
  } else if (link.startsWith('http')) {
    window.open(link, '_blank');
  } else {
    window.location.href = `/${link}`;
  }
};

// ─── Banner Carousel Component ──────────────────────────────────────────────────
function BannerCarouselModule({ module }) {
  const { props = {} } = module;
  // Filter và normalize images - chỉ giữ những cái có URL hợp lệ
  const images = (props.images || [])
    .map((img) => {
      if (typeof img === 'string') {
        return img && img.trim() ? { url: img.trim(), link: '', title: '', description: '' } : null;
      }
      return img?.url && img.url.trim() ? { ...img, url: img.url.trim() } : null;
    })
    .filter(Boolean); // Loại bỏ null/undefined

  const total = images.length;
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [imageErrors, setImageErrors] = useState(new Set());
  const containerRef = useRef(null);
  const intervalRef = useRef(null);

  const interval = props.interval || 4000;
  const autoplay = props.autoplay;

  // Auto-play with progress bar
  useEffect(() => {
    if (!autoplay || total <= 1 || isPaused) {
      clearInterval(intervalRef.current);
      return;
    }

    let tick = 0;
    const tickMs = 50;
    const totalTicks = Math.round(interval / tickMs);

    intervalRef.current = setInterval(() => {
      tick += 1;
      const newProgress = tick / totalTicks;
      setProgress(newProgress);

      if (tick >= totalTicks) {
        setCurrentSlide((c) => (c + 1) % total);
        tick = 0;
      }
    }, tickMs);

    return () => clearInterval(intervalRef.current);
  }, [autoplay, isPaused, interval, total]);

  const goToSlide = useCallback((idx) => {
    setCurrentSlide(idx);
    setProgress(0);
  }, []);

  const goNext = useCallback(() => {
    setCurrentSlide((c) => (c + 1) % total);
    setProgress(0);
  }, [total]);

  const goPrev = useCallback(() => {
    setCurrentSlide((c) => (c - 1 + total) % total);
    setProgress(0);
  }, [total]);

  // Touch handlers
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) {
return;
}
    const distance = touchStart - touchEnd;
    if (distance > minSwipeDistance) {
      goNext();
    } else if (distance < -minSwipeDistance) {
      goPrev();
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
return;
}

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goNext();
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [goNext, goPrev]);

  const handleImageError = useCallback((idx) => {
    setImageErrors((prev) => new Set([...prev, idx]));
  }, []);

  // Nếu không có images hợp lệ, không render gì cả
  if (total === 0) {
    return null;
  }

  return (
    <div className={styles.decorationBlock}>
      <div
        ref={containerRef}
        className={styles.carouselContainer}
        tabIndex={0}
        role="region"
        aria-label="Banner carousel"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          '--carousel-aspect-ratio': (() => {
            const ar = props.aspectRatio || '2:1';
            const [w, h] = ar.split(':').map(Number);
            return `${w} / ${h}`;
          })(),
        }}
      >
        {/* Slides wrapper */}
        <div
          className={styles.carouselSlides}
          style={{
            transform: `translateX(-${currentSlide * 100}%)`,
          }}
        >
          {images.map((img, idx) => (
            <div
              key={idx}
              className={styles.carouselSlide}
              role="group"
              aria-roledescription="slide"
              aria-label={`${idx + 1} of ${total}`}
              aria-hidden={idx !== currentSlide}
            >
              <div
                className={styles.carouselSlideLink}
                onClick={() => handleModuleLink(img.link)}
                style={{ cursor: img.link ? 'pointer' : 'default' }}
              >
                {imageErrors.has(idx) ? (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'var(--shop-surface-container-high)',
                      color: 'var(--shop-on-surface-variant)',
                      padding: '24px',
                    }}
                  >
                    <i
                      className="bi bi-image"
                      style={{ fontSize: '48px', opacity: 0.3, marginBottom: '12px' }}
                    />
                    <span style={{ fontSize: '14px', opacity: 0.6 }}>Không thể tải hình ảnh</span>
                  </div>
                ) : (
                  <img
                    src={img.url}
                    alt={img.title || `Banner ${idx + 1}`}
                    className={styles.carouselSlideImg}
                    loading={idx === 0 ? 'eager' : 'lazy'}
                    decoding="async"
                    onError={() => handleImageError(idx)}
                  />
                )}
                {/* Gradient overlay with title/description */}
                {(img.title || img.description) && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      padding: '24px 32px',
                      background:
                        'linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)',
                      color: '#fff',
                      pointerEvents: 'none',
                    }}
                  >
                    {img.title && (
                      <h3
                        style={{
                          margin: 0,
                          fontSize: '1.25rem',
                          fontWeight: 700,
                          textShadow: '0 1px 3px rgba(0,0,0,0.4)',
                        }}
                      >
                        {img.title}
                      </h3>
                    )}
                    {img.description && (
                      <p
                        style={{
                          margin: '4px 0 0',
                          fontSize: '0.875rem',
                          opacity: 0.9,
                          textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                        }}
                      >
                        {img.description}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Progress bar (autoplay) */}
        {autoplay && total > 1 && !isPaused && (
          <div className={styles.carouselProgressBar}>
            <div className={styles.carouselProgressFill} style={{ width: `${progress * 100}%` }} />
          </div>
        )}

        {/* Navigation arrows */}
        {total > 1 && (
          <>
            <button
              type="button"
              className={`${styles.carouselArrow} ${styles.carouselArrowLeft}`}
              onClick={goPrev}
              aria-label="Previous slide"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              type="button"
              className={`${styles.carouselArrow} ${styles.carouselArrowRight}`}
              onClick={goNext}
              aria-label="Next slide"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>

            {/* Dots + counter */}
            <div className={styles.carouselDots}>
              <div className={styles.carouselDotsInner}>
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`${styles.carouselDot} ${idx === currentSlide ? styles.carouselDotActive : ''}`}
                    onClick={() => goToSlide(idx)}
                    aria-label={`Go to slide ${idx + 1}`}
                    aria-current={idx === currentSlide ? 'true' : undefined}
                  />
                ))}
              </div>
              <span className={styles.carouselCounter}>
                {currentSlide + 1} / {total}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Banner Multi Component ─────────────────────────────────────────────────────
function BannerMultiModule({ module }) {
  const { props = {} } = module;
  const images = (props.images || []).map((img) =>
    typeof img === 'string' ? { url: img, link: '' } : img
  );
  const cols = props.columns || 2;

  return (
    <div className={styles.decorationBlock}>
      <div
        className={styles.bannerMultiGrid}
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {images.slice(0, cols).map((img, i) => (
          <div
            key={i}
            onClick={() => handleModuleLink(img.link)}
            style={{
              cursor: img.link ? 'pointer' : 'default',
              overflow: 'hidden',
              borderRadius: 8,
            }}
          >
            {img.url && <img src={img.url} alt="" className={styles.decorationBannerImg} />}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Banner Hotspot Component ───────────────────────────────────────────────────
function BannerHotspotModule({ module }) {
  const { props = {} } = module;

  return (
    <div className={styles.decorationBlock} style={{ position: 'relative' }}>
      <img src={props.image} alt="" className={styles.decorationBannerImg} />
      {(props.hotspots || []).map((h, i) => (
        <div
          key={i}
          onClick={() => handleModuleLink(h.link)}
          className={styles.hotspotPin}
          style={{ left: `${h.x || 0}%`, top: `${h.y || 0}%` }}
          title={h.label || h.link}
        >
          <i className="bi bi-plus-circle-fill" />
        </div>
      ))}
    </div>
  );
}

// ─── Banner Single Component ───────────────────────────────────────────────────
function BannerSingleModule({ module }) {
  const { props = {} } = module;

  return (
    <div className={styles.decorationBlock}>
      <div
        onClick={() => handleModuleLink(props.link)}
        style={{ cursor: props.link ? 'pointer' : 'default' }}
      >
        <img src={props.image} alt="" className={styles.decorationBannerImg} />
      </div>
    </div>
  );
}

// ─── Product Module Components (data now injected by backend via liveModules) ───

/** Flash Deals Module */
function FlashDealsModule({ module }) {
  const { props = {} } = module;
  const products = props.products || [];

  // Live countdown timer
  const [timeLeft, setTimeLeft] = useState({ h: 0, m: 0, s: 0 });

  useEffect(() => {
    const productsList = props.products || [];
    // Find the soonest endDate across all deals
    const endDates = productsList
      .map((d) => d.endDate)
      .filter(Boolean)
      .map((d) => new Date(d).getTime());
    if (endDates.length === 0) {
return;
}

    const tick = () => {
      const now = Date.now();
      const soonest = Math.min(...endDates);
      const diff = Math.max(0, soonest - now);
      setTimeLeft({
        h: Math.floor(diff / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [props.products]);

  if (products.length === 0) {
return null;
}

  const pad = (n) => String(n).padStart(2, '0');

  return (
    <div className={styles.decorationBlock}>
      <div className={styles.productsSection}>
        {!props.hideTitle && (
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleWrap}>
              <i className={`bi bi-lightning-charge-fill ${styles.icon}`} />
              <h3 className={styles.sectionTitle}>{props.title || 'Ưu Đãi Khủng'}</h3>
            </div>
            <div className={styles.countdownWrap}>
              <span className={styles.countdownLabel}>Kết thúc trong</span>
              <div className={styles.countdownBox}>
                <span className={styles.countdownNum}>{pad(timeLeft.h)}</span>
                <span style={{ color: 'var(--shop-secondary)', fontWeight: 700 }}>:</span>
                <span className={styles.countdownNum}>{pad(timeLeft.m)}</span>
                <span style={{ color: 'var(--shop-secondary)', fontWeight: 700 }}>:</span>
                <span className={styles.countdownNum}>{pad(timeLeft.s)}</span>
              </div>
            </div>
          </div>
        )}
        <div className={styles.productGrid}>
          {products.map((d) => (
            <div key={d.id} className={styles.productCardWrap}>
              <ProductCard
                product={{
                  id: d.productId || d.id,
                  _id: d.productId || d.id,
                  name: d.name,
                  image: d.image,
                  price: d.dealPrice || d.price,
                  originalPrice: d.originalPrice,
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Featured Products Module */
function FeaturedProductsModule({ module }) {
  const { props = {} } = module;
  const products = (props.products || []).map(normalizeProduct);

  if (products.length === 0) {
return null;
}

  return (
    <div className={styles.decorationBlock}>
      <div className={styles.productsSection}>
        {!props.hideTitle && (
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>{props.title || 'Sản phẩm nổi bật'}</h3>
          </div>
        )}
        <div className={styles.productGrid}>
          {products.map((p) => (
            <div key={p.id || p._id} className={styles.productCardWrap}>
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Best Selling Module */
function BestSellingModule({ module }) {
  const { props = {} } = module;
  const products = (props.products || []).map(normalizeProduct);

  if (products.length === 0) {
return null;
}

  return (
    <div className={styles.decorationBlock}>
      <div className={styles.productsSection}>
        {!props.hideTitle && (
          <div className={styles.sectionHeader}>
            <div className={`${styles.sectionTitleWrap} ${styles.gold}`}>
              <i className={`bi bi-trophy-fill ${styles.icon}`} />
              <h3 className={styles.sectionTitle}>{props.title || 'Sản Phẩm Bán Chạy'}</h3>
            </div>
          </div>
        )}
        <div className={styles.productGrid}>
          {products.map((p) => (
            <div key={p.id || p._id} className={styles.productCardWrap}>
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** New Products Module */
function NewProductsModule({ module }) {
  const { props = {} } = module;
  const products = (props.products || []).map(normalizeProduct);

  if (products.length === 0) {
return null;
}

  return (
    <div className={styles.decorationBlock}>
      <div className={styles.productsSection}>
        {!props.hideTitle && (
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>{props.title || 'Sản phẩm Mới'}</h3>
          </div>
        )}
        <div className={styles.productGrid}>
          {products.map((p) => (
            <div key={p.id || p._id} className={styles.productCardWrap}>
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Addon Deals Module */
function AddonDealsModule({ module }) {
  const { props = {} } = module;
  const products = (props.products || []).map(normalizeProduct);

  if (products.length === 0) {
return null;
}

  return (
    <div className={styles.decorationBlock}>
      <div className={styles.productsSection}>
        {!props.hideTitle && (
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>{props.title || 'Mua Kèm Deal Sốc'}</h3>
          </div>
        )}
        <div className={styles.productGrid}>
          {products.map((p) => (
            <div key={p.id || p._id} className={styles.productCardWrap}>
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Combo Promos Module */
function ComboPromosModule({ module }) {
  const { props = {} } = module;
  const products = (props.products || []).map(normalizeProduct);

  if (products.length === 0) {
return null;
}

  return (
    <div className={styles.decorationBlock}>
      <div className={styles.productsSection}>
        {!props.hideTitle && (
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>{props.title || 'Combo Khuyến Mãi'}</h3>
          </div>
        )}
        <div className={styles.productGrid}>
          {products.map((p) => (
            <div key={p.id || p._id} className={styles.productCardWrap}>
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Featured Categories Module */
function FeaturedCategoriesModule({ module, onCategoryClick }) {
  const { props = {} } = module;
  const categories = props.categories || [];

  if (categories.length === 0) {
return null;
}

  return (
    <div className={styles.decorationBlock}>
      <div className={styles.productsSection}>
        {!props.hideTitle && (
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>{props.title || 'Danh Mục Nổi Bật'}</h3>
          </div>
        )}
        <div className={styles.categoryRow}>
          {categories.slice(0, 8).map((c) => (
            <button
              key={c.id || c._id}
              type="button"
              className={styles.categoryChip}
              onClick={() => onCategoryClick?.(c.id || c._id)}
            >
              <div className={styles.categoryChipBox}>
                {c.image ? (
                  <img src={c.image} alt="" />
                ) : (
                  <i className="bi bi-tag" style={{ fontSize: 24, color: 'var(--shop-primary)' }} />
                )}
              </div>
              <span className={styles.categoryChipLabel}>{c.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Category List Module (for CATEGORY_LIST type) */
function CategoryListModule({ module, onCategoryClick }) {
  const { props = {} } = module;
  const categories = props.categories || [];

  if (categories.length === 0) {
return null;
}

  return (
    <div className={styles.decorationBlock}>
      <div className={styles.productsSection}>
        {!props.hideTitle && (
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>{props.title || 'Danh Mục'}</h3>
          </div>
        )}
        <div className={styles.categoryRow}>
          {categories.slice(0, 10).map((c) => (
            <button
              key={c.id || c._id}
              type="button"
              className={styles.categoryChip}
              onClick={() => onCategoryClick?.(c.id || c._id)}
            >
              <div className={styles.categoryChipBox}>
                {c.image ? (
                  <img src={c.image} alt="" />
                ) : (
                  <i className="bi bi-grid-3x2-gap-fill" style={{ fontSize: 24, color: 'var(--shop-primary)' }} />
                )}
              </div>
              <span className={styles.categoryChipLabel}>{c.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const ShopProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL');
  const [isFollowing, setIsFollowing] = useState(false);
  const [vouchers, setVouchers] = useState([]);
  const [activeVoucherFilter, setActiveVoucherFilter] = useState(null);
  const [liveModules, setLiveModules] = useState([]);
  const voucherScrollRef = useRef(null);
  const productsSectionRef = useRef(null);
  const { isAuthenticated } = useSelector((state) => state.auth);

  const [topCategories, setTopCategories] = useState([]);
  const [activeLive, setActiveLive] = useState(null);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    fetchShopData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, pagination.page, activeTab]);

  useEffect(() => {
    if (id) {
      fetchTopCategories();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (isAuthenticated && id) {
      checkFollowStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isAuthenticated]);

  useEffect(() => {
    if (id) {
      fetchShopVouchers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const fetchActive = () => {
      livestreamService
        .getActiveByShop(id)
        // axiosClient interceptor returns response.data directly (session object or null)
        .then((session) => setActiveLive(session || null))
        .catch(() => setActiveLive(null));
    };
    fetchActive();
    const interval = setInterval(fetchActive, 60_000);
    return () => clearInterval(interval);
  }, [id]);

  const checkFollowStatus = async () => {
    try {
      const res = await followService.checkFollowStatus(id);
      // `res` is the response data body: { success: true, data: { isFollowing: true } }
      setIsFollowing(res.data?.isFollowing || false);
    } catch (error) {
      console.error('Failed to check follow status:', error);
    }
  };

  const handleToggleFollow = async () => {
    if (!isAuthenticated) {
      toast.info('Vui lòng đăng nhập để theo dõi shop');
      navigate('/login');
      return;
    }

    try {
      const res = await followService.toggleFollow(id);
      const isNowFollowing = res.data?.isFollowing;
      setIsFollowing(isNowFollowing);

      setSeller((prev) => ({
        ...prev,
        followerCount: isNowFollowing
          ? (prev.followerCount || 0) + 1
          : Math.max(0, (prev.followerCount || 1) - 1),
      }));

      toast.success(res.message || (isNowFollowing ? 'Đã theo dõi' : 'Đã bỏ theo dõi'));
    } catch (error) {
      toast.error(error.message || 'Có lỗi xảy ra');
    }
  };

  const fetchTopCategories = async () => {
    try {
      const response = await productService.getProductsBySeller(id, { page: 1, limit: 500 });
      const responseData = response.data?.data || response.data || response;
      const allProducts = responseData.products || [];

      const catCount = {};
      allProducts.forEach((p) => {
        const cat = p.categoryId;
        if (cat && cat._id) {
          if (!catCount[cat._id]) {
            catCount[cat._id] = { _id: cat._id, name: cat.name, count: 0 };
          }
          catCount[cat._id].count++;
        }
      });

      const sorted = Object.values(catCount)
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);
      setTopCategories(sorted);
    } catch (err) {
      console.error('Error fetching top categories:', err);
    }
  };

  const fetchShopData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (activeTab !== 'HOME' && activeTab !== 'ALL' && activeTab !== 'PROFILE') {
        params.categoryId = activeTab;
      }

      const response = await productService.getProductsBySeller(id, params);

      const responseData = response.data?.data || response.data || response;
      if (responseData) {
        setSeller(responseData.seller);
        const transformedProducts = (responseData.products || []).map(normalizeProduct);
        setProducts(transformedProducts);
        setLiveModules(responseData.liveModules || []);

        // Fetch promotions for all visible products
        const productIds = transformedProducts.map((p) => p.id).filter(Boolean);
        if (productIds.length > 0) {
          try {
            const promoResponse = await promotionBuyerService.getProductPromotionsBatch(productIds);
            const promoMap = promoResponse?.data?.data || promoResponse?.data || promoResponse;
            if (promoMap && typeof promoMap === 'object') {
              setProducts((prev) =>
                prev.map((p) => {
                  const promo = promoMap[p.id];
                  if (!promo) {
                    return p;
                  }

                  const updated = { ...p };

                  // Shop program price override
                  if (
                    promo.shopProgram &&
                    promo.shopProgram.salePrice < promo.shopProgram.originalPrice
                  ) {
                    updated.price = promo.shopProgram.salePrice;
                    updated.originalPrice = promo.shopProgram.originalPrice;
                    updated.promotionType = 'shopProgram';
                  }

                  // Combo promotion info
                  if (promo.comboPromotions && promo.comboPromotions.length > 0) {
                    const combo = promo.comboPromotions[0];
                    const bestTier = combo.tiers?.reduce(
                      (best, t) => (t.value > (best?.value || 0) ? t : best),
                      null
                    );
                    updated.comboPromotion = {
                      name: combo.name,
                      comboType: combo.comboType,
                      bestDiscount: bestTier?.value || 0,
                    };
                  }

                  return updated;
                })
              );
            }
          } catch (promoErr) {
            console.error('Error fetching batch promotions:', promoErr);
          }
        }

        // Match the pagination structure from the backend
        const pageData = response.data?.pagination || response.pagination;
        if (pageData) {
          setPagination((prev) => ({
            ...prev,
            total: pageData.total || 0,
            pages: pageData.pages || 0,
          }));
        }
      }
    } catch (err) {
      console.error('Error fetching shop data:', err);
      setError(err.response?.data?.message || 'Failed to load shop profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setPagination((prev) => ({ ...prev, page: newPage }));
      window.scrollTo(0, 0);
    }
  };

  const fetchShopVouchers = async () => {
    try {
      const res = await voucherService.getShopVouchers(id);
      setVouchers(res.data?.data || res.data || []);
    } catch {
      // Silent fail - vouchers are optional
    }
  };

  const handleSaveVoucher = async (voucherId) => {
    if (!isAuthenticated) {
      toast.info('Vui lòng đăng nhập để lưu voucher');
      navigate('/login');
      return;
    }
    try {
      const voucher = vouchers.find((v) => v._id === voucherId);
      if (voucher?.isSaved) {
        await voucherService.unsaveVoucher(voucherId);
        setVouchers((prev) =>
          prev.map((v) => (v._id === voucherId ? { ...v, isSaved: false } : v))
        );
        toast.success('Đã bỏ lưu voucher');
        if (activeVoucherFilter?._id === voucherId) {
          setActiveVoucherFilter(null);
        }
      } else {
        await voucherService.saveVoucher(voucherId);
        setVouchers((prev) => prev.map((v) => (v._id === voucherId ? { ...v, isSaved: true } : v)));
        toast.success('Đã lưu voucher!');
      }
    } catch {
      toast.error('Không thể lưu voucher');
    }
  };

  const handleUseVoucher = (voucher) => {
    setActiveVoucherFilter(voucher);
    setActiveTab('ALL');
    setPagination((prev) => ({ ...prev, page: 1 }));

    // Slight delay to ensure tab switch before scrolling
    setTimeout(() => {
      productsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const scrollVouchers = (direction) => {
    if (voucherScrollRef.current) {
      const scrollAmount = 260;
      voucherScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };
  // eslint-disable-next-line no-unused-vars
  void scrollVouchers;

  if (loading && !seller) {
    return (
      <Container className="py-5 text-center">
        <div className="spinner-border text-primary" role="status"></div>
      </Container>
    );
  }

  if (error || !seller) {
    return (
      <Container className="py-5 text-center">
        <h2>{error || 'Shop not found'}</h2>
        <button className="btn btn-primary mt-3" onClick={() => navigate('/products')}>
          Go to Shop
        </button>
      </Container>
    );
  }

  const handleChatClick = () => {
    const sellerId = seller._id || seller.id;
    if (!sellerId) {
return;
}
    window.dispatchEvent(
      new CustomEvent('openChatWithShop', { detail: { shopId: sellerId, productInfo: null } })
    );
  };

  const formatJoined = seller?.createdAt
    ? new Date(seller.createdAt).toLocaleDateString('vi-VN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '';
  const onlineStatus = seller?.updatedAt
    ? `Online ${Math.max(1, Math.floor((Date.now() - new Date(seller.updatedAt).getTime()) / 60000))} phút trước`
    : t('product_details.shop_online', 'Đang hoạt động');
  const locationText = seller?.address?.city || seller?.address?.district || '';

  return (
    <>
      <div className={styles.pageWrap}>
        <div className={styles.inner}>
          {/* Hero: banner only — avatar lives in ShopInfoCard below (avoids duplicate) */}
          <section className={styles.hero}>
            <img
              src={
                seller.profileImage ||
                'https://placehold.co/1200x240/fae3e0/8b716e?text=Banner'
              }
              alt=""
              className={styles.heroImg}
            />
            <div className={styles.heroOverlay} />
          </section>

          <ShopInfoCard
            seller={seller}
            showViewShop={false}
            isFollowing={isFollowing}
            onToggleFollow={handleToggleFollow}
            activeLive={activeLive?._id ? activeLive : null}
          />

          {/* Shop Info Strip */}
          <section className={styles.strip}>
            <div className={styles.stripLeft}>
              <h1 className={styles.stripName}>
                {seller.fullName || 'Shop'}
                {(seller.isVerified ?? true) && (
                  <i className={`bi bi-patch-check-fill ${styles.stripVerified}`} aria-hidden />
                )}
              </h1>
              <p className={styles.stripStatus}>
                {onlineStatus}
                {locationText && ` | ${locationText}`}
              </p>
              {formatJoined && (
                <div className={styles.stripJoined}>
                  <i className="bi bi-calendar3" />
                  Tham gia: {formatJoined}
                </div>
              )}
            </div>
            <div className={styles.stripStats}>
              <div className={styles.statBlock}>
                <div className={styles.statValue}>
                  <i className="bi bi-box-seam" /> {seller.productCount ?? 0}
                </div>
                <div className={styles.statLabel}>
                  {t('product_details.shop_stat_products', 'Sản Phẩm')}
                </div>
              </div>
              <span className={styles.statDivider} />
              <div className={styles.statBlock}>
                <div className={styles.statValue}>
                  <i className="bi bi-people-fill" />{' '}
                  {(seller.followerCount ?? 0) >= 1000
                    ? `${((seller.followerCount ?? 0) / 1000).toFixed(1)}k`
                    : (seller.followerCount ?? 0)}
                </div>
                <div className={styles.statLabel}>
                  {t('product_details.shop_stat_followers', 'Người theo dõi')}
                </div>
              </div>
              <span className={styles.statDivider} />
              <div className={styles.statBlock}>
                <div className={styles.statValue}>
                  <i className="bi bi-star-fill" /> {(seller.rating ?? 0).toFixed(1)}/5
                </div>
                <div className={styles.statLabel}>
                  {t('product_details.shop_stat_rating', 'Đánh giá')}
                </div>
              </div>
              <span className={styles.statDivider} />
              <div className={styles.statBlock}>
                <div className={styles.statValue}>
                  <i className="bi bi-chat-dots-fill" /> {seller.chatResponseRate ?? 98}%
                </div>
                <div className={styles.statLabel}>Phản hồi Chat</div>
              </div>
            </div>
            <div className={styles.stripActions}>
              <button type="button" className={styles.btnFollow} onClick={handleToggleFollow}>
                <i className={`bi ${isFollowing ? 'bi-person-check-fill' : 'bi-plus-lg'}`} />
                {isFollowing
                  ? t('product_details.btn_following', 'Đang Theo Dõi')
                  : t('product_details.btn_follow', 'Theo Dõi')}
              </button>
              <button type="button" className={styles.btnChat} onClick={handleChatClick}>
                <i className="bi bi-chat-dots" />
                {t('product_details.btn_chat', 'Chat Ngay')}
              </button>
            </div>
          </section>

          {/* Voucher Section */}
          {vouchers.length > 0 && (
            <section className={styles.voucherSection}>
              <div className={styles.voucherHeader}>
                <h2 className={styles.voucherTitle}>
                  <Ticket size={22} />
                  Mã Giảm Giá Của Shop
                </h2>
                <button type="button" className={styles.voucherViewAll}>
                  Xem tất cả
                </button>
              </div>
              <div className={styles.voucherCarousel} ref={voucherScrollRef}>
                {vouchers.map((v) => {
                  const endDate = new Date(v.endTime);
                  const formattedEnd = `${String(endDate.getDate()).padStart(2, '0')}.${String(endDate.getMonth() + 1).padStart(2, '0')}.${endDate.getFullYear()}`;
                  const isSecondary = v.discountType !== 'percent' && v.discountValue >= 50000;
                  return (
                    <div key={v._id} className={styles.voucherCard}>
                      <div
                        className={
                          isSecondary
                            ? `${styles.voucherCardStripe} ${styles.secondary}`
                            : styles.voucherCardStripe
                        }
                      />
                      <div className={styles.voucherCardBody}>
                        <div>
                          <p className={styles.voucherDiscount}>
                            {v.discountType === 'percent'
                              ? `Giảm ${v.discountValue}%`
                              : `Giảm ${formatCurrency(v.discountValue)}`}
                          </p>
                          <p className={styles.voucherCondition}>
                            Đơn tối thiểu {formatCurrency(v.minBasketPrice)}
                            {v.maxDiscountAmount &&
                              ` | Tối đa ${formatCurrency(v.maxDiscountAmount)}`}
                          </p>
                        </div>
                        <p className={styles.voucherExpiry}>HSD: {formattedEnd}</p>
                      </div>
                      <div className={styles.voucherCardAction}>
                        {v.isSaved ? (
                          <button type="button" onClick={() => handleUseVoucher(v)}>
                            Dùng Ngay
                          </button>
                        ) : (
                          <button
                            type="button"
                            className={isSecondary ? styles.secondary : ''}
                            onClick={() => handleSaveVoucher(v._id)}
                          >
                            Lưu Mã
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Tabs */}
          <nav className={styles.tabsContainer}>
            <button
              type="button"
              className={`${styles.tabItem} ${activeTab === 'HOME' ? styles.active : ''}`}
              onClick={() => setActiveTab('HOME')}
            >
              <i className="bi bi-house-door-fill" /> {t('product_details.tab_home', 'Dạo')}
            </button>
            <button
              type="button"
              className={`${styles.tabItem} ${activeTab === 'ALL' ? styles.active : ''}`}
              onClick={() => {
                setActiveTab('ALL');
                setPagination((p) => ({ ...p, page: 1 }));
              }}
            >
              <i className="bi bi-grid-3x3-gap" />{' '}
              {t('product_details.tab_all_products', 'Tất cả sản phẩm')}
            </button>
            {topCategories.map((cat) => (
              <button
                key={cat._id}
                type="button"
                className={`${styles.tabItem} ${activeTab === cat._id ? styles.active : ''}`}
                onClick={() => {
                  setActiveTab(cat._id);
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
              >
                {cat.name}
              </button>
            ))}
            <button
              type="button"
              className={`${styles.tabItem} ${activeTab === 'PROFILE' ? styles.active : ''}`}
              onClick={() => setActiveTab('PROFILE')}
            >
              <i className="bi bi-rss" /> Hồ Sơ Cửa Hàng
            </button>
          </nav>

          {/* SUGGESTED FOR YOU Section - Always at top for HOME tab */}
          {activeTab === 'HOME' && products.length > 0 && (
            <div className={styles.suggestedSection}>
              <div className={styles.suggestedHeader}>
                <h3 className={styles.suggestedTitle}>
                  {t('product_details.suggested_for_you', 'Gợi Ý Cho Bạn')}
                </h3>
                {products.length > 6 && (
                  <button
                    type="button"
                    className={styles.suggestedSeeAll}
                    onClick={() => setActiveTab('ALL')}
                  >
                    Xem tất cả <i className="bi bi-chevron-right" />
                  </button>
                )}
              </div>
              <div className={styles.suggestedGrid}>
                {products.slice(0, 6).map((product) => (
                  <div key={product.id || product._id} className={styles.suggestedItem}>
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeVoucherFilter && (
            <div className={styles.activeFilterBanner}>
              <div>
                <Ticket size={16} />
                <span>
                  Đang lọc sản phẩm cho voucher:
                  <strong>
                    {' '}
                    {activeVoucherFilter.discountType === 'percent'
                      ? `${activeVoucherFilter.discountValue}%`
                      : formatCurrency(activeVoucherFilter.discountValue)}{' '}
                    Giảm
                  </strong>
                </span>
                <span className={styles.filterCondition}>
                  {' '}
                  (Đơn Tối Thiểu {formatCurrency(activeVoucherFilter.minBasketPrice)})
                </span>
              </div>
              <button
                className={styles.clearFilterBtn}
                onClick={() => setActiveVoucherFilter(null)}
              >
                Xóa Bộ Lọc
              </button>
            </div>
          )}

          {/* Shop decoration modules (from liveModules, HOME or PROFILE tab) */}
          {(activeTab === 'HOME' || activeTab === 'PROFILE') && liveModules.length > 0 && (
            <div className={styles.decorationBlocks}>
              {liveModules.map((mod) => {
                if (!mod.isEnabled) {
return null;
}
                const { type } = mod;

                // Banner Single
                if (type === MODULE_TYPES.BANNER_SINGLE && mod.props?.image) {
                  return <BannerSingleModule key={mod.id} module={mod} />;
                }

                // Banner Carousel
                if (type === MODULE_TYPES.BANNER_CAROUSEL && mod.props?.images?.length > 0) {
                  return <BannerCarouselModule key={mod.id} module={mod} />;
                }

                // Banner Multi
                if (type === MODULE_TYPES.BANNER_MULTI && mod.props?.images?.length > 0) {
                  return <BannerMultiModule key={mod.id} module={mod} />;
                }

                // Banner Hotspot
                if (type === MODULE_TYPES.BANNER_HOTSPOT && mod.props?.image) {
                  return <BannerHotspotModule key={mod.id} module={mod} />;
                }

                if (type === MODULE_TYPES.SHOP_INFO && seller) {
                  return (
                    <div key={mod.id} className={styles.decorationBlock}>
                      <section className={styles.strip}>
                        <div className={styles.stripLeft}>
                          <h2 className={styles.stripName}>
                            {seller.fullName || 'Shop'}
                            {(seller.isVerified ?? true) && (
                              <i
                                className={`bi bi-patch-check-fill ${styles.stripVerified}`}
                                aria-hidden
                              />
                            )}
                          </h2>
                          <p className={styles.stripStatus}>
                            {onlineStatus}
                            {locationText && ` | ${locationText}`}
                          </p>
                          {formatJoined && (
                            <div className={styles.stripJoined}>
                              <i className="bi bi-calendar3" />
                              Tham gia: {formatJoined}
                            </div>
                          )}
                        </div>
                        <div className={styles.stripStats}>
                          <div className={styles.statBlock}>
                            <div className={styles.statValue}>
                              <i className="bi bi-box-seam" /> {seller.productCount ?? 0}
                            </div>
                            <div className={styles.statLabel}>
                              {t('product_details.shop_stat_products', 'Sản Phẩm')}
                            </div>
                          </div>
                          <span className={styles.statDivider} />
                          <div className={styles.statBlock}>
                            <div className={styles.statValue}>
                              <i className="bi bi-people-fill" />{' '}
                              {(seller.followerCount ?? 0) >= 1000
                                ? `${((seller.followerCount ?? 0) / 1000).toFixed(1)}k`
                                : (seller.followerCount ?? 0)}
                            </div>
                            <div className={styles.statLabel}>
                              {t('product_details.shop_stat_followers', 'Người theo dõi')}
                            </div>
                          </div>
                          <span className={styles.statDivider} />
                          <div className={styles.statBlock}>
                            <div className={styles.statValue}>
                              <i className="bi bi-star-fill" /> {(seller.rating ?? 0).toFixed(1)}/5
                            </div>
                            <div className={styles.statLabel}>
                              {t('product_details.shop_stat_rating', 'Đánh giá')}
                            </div>
                          </div>
                          <span className={styles.statDivider} />
                          <div className={styles.statBlock}>
                            <div className={styles.statValue}>
                              <i className="bi bi-chat-dots-fill" /> {seller.chatResponseRate ?? 98}
                              %
                            </div>
                            <div className={styles.statLabel}>Phản hồi Chat</div>
                          </div>
                        </div>
                        <div className={styles.stripActions}>
                          <button
                            type="button"
                            className={styles.btnFollow}
                            onClick={handleToggleFollow}
                          >
                            <i
                              className={`bi ${isFollowing ? 'bi-person-check-fill' : 'bi-plus-lg'}`}
                            />
                            {isFollowing
                              ? t('product_details.btn_following', 'Đang Theo Dõi')
                              : t('product_details.btn_follow', 'Theo Dõi')}
                          </button>
                          <button
                            type="button"
                            className={styles.btnChat}
                            onClick={handleChatClick}
                          >
                            <i className="bi bi-chat-dots" />
                            {t('product_details.btn_chat', 'Chat Ngay')}
                          </button>
                        </div>
                      </section>
                    </div>
                  );
                }
                if (type === MODULE_TYPES.TEXT && (mod.props?.title || mod.props?.content)) {
                  return (
                    <div key={mod.id} className={styles.decorationBlock}>
                      <div className={styles.decorationText}>
                        {mod.props?.title && (
                          <h3 className={styles.decorationTextTitle}>{mod.props.title}</h3>
                        )}
                        {mod.props?.content && (
                          <div className={styles.decorationTextContent}>{mod.props.content}</div>
                        )}
                      </div>
                    </div>
                  );
                }
                if (
                  type === MODULE_TYPES.IMAGE_TEXT &&
                  (mod.props?.images?.length > 0 || mod.props?.image || mod.props?.title || mod.props?.content)
                ) {
                  // Support both images array and single image string
                  const imageUrl = mod.props.images?.[0]?.url || mod.props.image;
                  const position = mod.props?.position || 'left';
                  const aspectRatio = mod.props?.aspectRatio || '1:1';
                  const [ratioW, ratioH] = aspectRatio.split(':').map(Number);
                  const aspectRatioValue = `${ratioW} / ${ratioH}`;
                  return (
                    <div key={mod.id} className={styles.decorationBlock}>
                      <div className={`${styles.decorationText} ${styles[`position${position.charAt(0).toUpperCase() + position.slice(1)}`]}`}>
                        {imageUrl && (
                          <div className={styles.imageTextWrapper} style={{ aspectRatio: aspectRatioValue }}>
                            <img
                              src={imageUrl}
                              alt=""
                              className={styles.decorationInlineImg}
                            />
                          </div>
                        )}
                        <div className={styles.textContent}>
                          {mod.props?.title && (
                            <h3 className={styles.decorationTextTitle}>{mod.props.title}</h3>
                          )}
                          {mod.props?.content && (
                            <div className={styles.decorationTextContent}>{mod.props.content}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }

                // Product modules — data injected by backend via props.products
                if (type === MODULE_TYPES.FLASH_DEALS) {
                  return <FlashDealsModule key={mod.id} module={mod} />;
                }
                if (type === MODULE_TYPES.FEATURED_PRODUCTS) {
                  return <FeaturedProductsModule key={mod.id} module={mod} />;
                }
                if (type === MODULE_TYPES.BEST_SELLING) {
                  return <BestSellingModule key={mod.id} module={mod} />;
                }
                if (type === MODULE_TYPES.NEW_PRODUCTS) {
                  return <NewProductsModule key={mod.id} module={mod} />;
                }
                if (type === MODULE_TYPES.ADDON_DEALS) {
                  return <AddonDealsModule key={mod.id} module={mod} />;
                }
                if (type === MODULE_TYPES.COMBO_PROMOS) {
                  return <ComboPromosModule key={mod.id} module={mod} />;
                }
                if (type === MODULE_TYPES.FEATURED_CATEGORIES) {
                  return (
                    <FeaturedCategoriesModule
                      key={mod.id}
                      module={mod}
                      onCategoryClick={(catId) => {
                        setActiveTab(catId);
                        setPagination((p) => ({ ...p, page: 1 }));
                      }}
                    />
                  );
                }
                if (type === MODULE_TYPES.CATEGORY_LIST) {
                  return (
                    <CategoryListModule
                      key={mod.id}
                      module={mod}
                      onCategoryClick={(catId) => {
                        setActiveTab(catId);
                        setPagination((p) => ({ ...p, page: 1 }));
                      }}
                    />
                  );
                }

                return null;
              })}
            </div>
          )}

          {/* Widget sections (from liveModules product modules) */}
          <div ref={productsSectionRef}>
            {activeTab === 'PROFILE' && liveModules.length > 0 && (
              <div className="text-center py-5 text-secondary">
                <p>
                  {t(
                    'product_details.shop_profile_intro',
                    'Xem sản phẩm tại tab Tất cả sản phẩm hoặc Danh mục.'
                  )}
                </p>
              </div>
            )}
            {activeTab !== 'PROFILE' && (
              <>
                {loading && products.length === 0 ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status" />
                  </div>
                ) : products.length > 0 ? (
                  activeTab !== 'HOME' && (
                    <div className={styles.productsSection}>
                      <div className={styles.sectionHeader}>
                        <h3 className={styles.sectionTitle}>
                          {activeTab === 'ALL'
                            ? t('product_details.tab_all_products', 'Tất cả sản phẩm')
                            : topCategories.find((c) => c._id === activeTab)?.name || 'Sản phẩm'}
                        </h3>
                      </div>
                      <div className={styles.productGrid}>
                        {products
                          .filter(
                            (p) =>
                              !activeVoucherFilter || p.price >= activeVoucherFilter.minBasketPrice
                          )
                          .map((product) => (
                            <div key={product.id || product._id} className={styles.productCardWrap}>
                              <ProductCard product={product} />
                            </div>
                          ))}
                      </div>
                      {pagination.pages > 1 && (
                        <div className={styles.paginationWrap}>
                          <Pagination
                            currentPage={pagination.page}
                            totalPages={pagination.pages}
                            onPageChange={handlePageChange}
                          />
                        </div>
                      )}
                    </div>
                  )
                ) : (
                  <div className="text-center py-5">
                    <h4>{t('product_details.no_products', 'Shop chưa có sản phẩm nào.')}</h4>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav className={styles.bottomNav} aria-label="Mobile navigation">
        <Link to="/" className={styles.bottomNavLink}>
          <i className="bi bi-house-door-fill" /> Home
        </Link>
        <Link to="/categories" className={styles.bottomNavLink}>
          <i className="bi bi-grid-3x3-gap" /> Category
        </Link>
        <Link to="/products" className={styles.bottomNavLink}>
          <i className="bi bi-rss" /> Feed
        </Link>
        <Link to="/buyer/cart" className={styles.bottomNavLink}>
          <i className="bi bi-cart3" /> Cart
        </Link>
        <Link to="/buyer/profile" className={styles.bottomNavLink}>
          <i className="bi bi-person" /> Profile
        </Link>
      </nav>
    </>
  );
};

export default ShopProfilePage;
