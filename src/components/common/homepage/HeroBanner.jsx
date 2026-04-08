import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import bannerAdsService from '@services/api/bannerAdsService';

// --- 1. CONSTANTS & STYLES ---
const COLORS = {
  bg: '#f8f9fa',
};

const styles = {
  heroBannerWrapper: {
    position: 'relative',
    width: '100%',
    maxWidth: '1300px',
    height: '450px',
    margin: '0 auto',
    zIndex: 1,
    fontFamily: "'Poppins', sans-serif",
  },

  // Nút tròn trang trí (Notch)
  heroBannerNotch: {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '100px',
    height: '100px',
    backgroundColor: COLORS.bg,
    borderRadius: '50%',
    pointerEvents: 'none',
    zIndex: 10,
  },
  heroBannerNotchLeft: { left: '-50px' },
  heroBannerNotchRight: { right: '-50px' },

  // Nút điều hướng (Btn)
  heroBannerBtn: {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '60px',
    height: '60px',
    backgroundColor: '#fff',
    color: '#333',
    border: '2px solid #eaeaea',
    borderRadius: '50%',
    cursor: 'pointer',
    zIndex: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s ease',
  },
  heroBannerBtnPrev: { left: '-30px' },
  heroBannerBtnNext: { right: '-30px' },

  // Khung chứa slide
  heroBannerCard: {
    width: '100%',
    height: '100%',
    position: 'relative',
    borderRadius: '20px',
    zIndex: 5,
    background: '#000',
    overflow: 'hidden',
  },
  heroBannerInner: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  heroBannerTrack: {
    display: 'flex',
    height: '100%',
    transition: 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)',
  },

  // Slide đơn lẻ — chỉ ảnh nền
  heroBannerSlide: {
    minWidth: '100%',
    height: '100%',
    position: 'relative',
    display: 'flex',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  },

  // Dots Navigation
  heroBannerNav: {
    position: 'absolute',
    bottom: '30px',
    left: '80px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    zIndex: 10,
  },
  heroBannerIndicator: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.4)',
    cursor: 'pointer',
    border: 'none',
    padding: 0,
    transition: 'all 0.4s cubic-bezier(0.25, 1, 0.5, 1)',
  },
  heroBannerActiveIndicator: {
    background: 'var(--color-primary)',
    width: '45px',
    borderRadius: '10px',
  },
};

function resolveBannerHref(banner) {
  const lt = banner.linkType || 'none';
  if (!lt || lt === 'none') {
    return null;
  }

  if (lt === 'external' && banner.link) {
    const u = String(banner.link).trim();
    if (!u) {
      return null;
    }
    return /^https?:\/\//i.test(u) ? u : `https://${u}`;
  }

  if (lt === 'product') {
    const pid =
      banner.productId && typeof banner.productId === 'object'
        ? banner.productId._id
        : banner.productId;
    const id = pid || banner.link;
    if (id) {
      return `/product/${id}`;
    }
  }

  if (banner.link) {
    const path = String(banner.link).trim();
    return path.startsWith('/') ? path : `/${path}`;
  }

  return null;
}

// --- 2. COMPONENT ---
const HeroBanner = () => {
  const navigate = useNavigate();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const raw = await bannerAdsService.getActiveBanners();
        const list = Array.isArray(raw) ? raw : [];
        const slides = list
          .filter((b) => b?.image)
          .map((b) => ({
            id: String(b._id ?? b.id),
            raw: b,
            image: b.image,
            linkHref: resolveBannerHref(b),
          }));
        if (!cancelled) {
          setBanners(slides);
          setCurrentIndex(0);
        }
      } catch {
        if (!cancelled) {
          setBanners([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSlideClick = useCallback(
    (slide) => {
      if (!slide?.linkHref) {
        return;
      }
      if (slide?.raw?._id) {
        bannerAdsService.trackClick(slide.raw._id).catch(() => {});
      }
      if (/^https?:\/\//i.test(slide.linkHref)) {
        window.open(slide.linkHref, '_blank', 'noopener,noreferrer');
      } else {
        navigate(slide.linkHref);
      }
    },
    [navigate]
  );

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
  }, [banners.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
  }, [banners.length]);

  useEffect(() => {
    if (loading || banners.length === 0) {
      return;
    }
    const interval = setInterval(() => handleNext(), 5000);
    return () => clearInterval(interval);
  }, [currentIndex, loading, banners, handleNext]);

  if (loading || !banners.length) {
    return null;
  }

  return (
    <>
      <div style={styles.heroBannerWrapper}>
        {/* Notch */}
        <div style={{ ...styles.heroBannerNotch, ...styles.heroBannerNotchLeft }}></div>
        <div style={{ ...styles.heroBannerNotch, ...styles.heroBannerNotchRight }}></div>

        {/* Buttons */}
        <button
          style={{ ...styles.heroBannerBtn, ...styles.heroBannerBtnPrev }}
          onClick={handlePrev}
          aria-label="Previous Slide"
        >
          <ChevronLeft size={24} />
        </button>
        <button
          style={{ ...styles.heroBannerBtn, ...styles.heroBannerBtnNext }}
          onClick={handleNext}
          aria-label="Next Slide"
        >
          <ChevronRight size={24} />
        </button>

        {/* Main Card */}
        <div style={styles.heroBannerCard}>
          <div style={styles.heroBannerInner}>
            <div
              style={{
                ...styles.heroBannerTrack,
                transform: `translateX(-${currentIndex * 100}%)`,
              }}
            >
              {banners.map((banner) => (
                  <div
                    key={banner.id}
                    role={banner.linkHref ? 'button' : undefined}
                    tabIndex={banner.linkHref ? 0 : undefined}
                    onClick={() => handleSlideClick(banner)}
                    onKeyDown={(e) => {
                      if (!banner.linkHref) {
                        return;
                      }
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSlideClick(banner);
                      }
                    }}
                    style={{
                      ...styles.heroBannerSlide,
                      backgroundImage: `url(${banner.image})`,
                      cursor: banner.linkHref ? 'pointer' : 'default',
                    }}
                  />
              ))}
            </div>
          </div>

          {/* Indicators / Dots */}
          <div style={styles.heroBannerNav}>
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                style={{
                  ...styles.heroBannerIndicator,
                  ...(index === currentIndex ? styles.heroBannerActiveIndicator : {}),
                }}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default HeroBanner;
