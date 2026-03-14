import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// --- 1. CONSTANTS & STYLES ---
const COLORS = {
  bg: '#f8f9fa',
  accent: 'var(--color-primary)',
  textWhite: '#fff',
  textDark: '#333',
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

  // Slide đơn lẻ
  heroBannerSlide: {
    minWidth: '100%',
    height: '100%',
    position: 'relative',
    display: 'flex',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  },
  heroBannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(120deg, rgba(0,0,0,0.9) 30%, rgba(0,0,0,0.3) 100%)',
    zIndex: 1,
  },
  heroBannerGrid: {
    position: 'relative',
    zIndex: 2,
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    padding: '0 80px',
  },

  // Cột nội dung (Text)
  heroBannerTextCol: {
    flex: 1,
    textAlign: 'left',
    maxWidth: '55%',
  },
  heroBannerTopTag: {
    fontSize: '0.9rem',
    fontWeight: 600,
    letterSpacing: '2px',
    textTransform: 'uppercase',
    color: COLORS.accent,
    marginBottom: '8px',
    display: 'block',
    opacity: 0,
    transform: 'translateY(20px)',
    transition: '0.5s ease-out',
  },
  heroBannerHeading: {
    fontFamily: "'Anton', sans-serif",
    fontSize: '4rem',
    lineHeight: 1,
    marginBottom: '10px',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    whiteSpace: 'pre-line',
    opacity: 0,
    transform: 'translateY(20px)',
    transition: '0.5s ease-out',
  },
  heroBannerPromo: {
    fontSize: '2.2rem',
    fontWeight: 800,
    color: '#fff',
    display: 'block',
    marginBottom: '10px',
    opacity: 0,
    transform: 'translateY(20px)',
    transition: '0.5s ease-out',
  },
  heroBannerDesc: {
    fontSize: '0.95rem',
    color: 'rgba(255,255,255,0.8)',
    fontWeight: 300,
    opacity: 0,
    transform: 'translateY(20px)',
    transition: '0.5s ease-out',
  },

  // Cột ảnh (Image)
  heroBannerImgCol: {
    flex: 1,
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  heroBannerTiltImg: {
    width: '320px',
    height: 'auto',
    objectFit: 'contain',
    transform: 'rotate(-15deg)',
    filter: 'drop-shadow(0 15px 25px rgba(0,0,0,0.5))',
    transition: 'transform 0.5s ease',
    opacity: 0,
  },

  // Trạng thái Active (Animation state)
  heroBannerActiveElem: {
    opacity: 1,
    transform: 'translateY(0)',
  },
  heroBannerActiveImg: {
    opacity: 1,
    transform: 'rotate(-15deg) translateX(0)',
    transition: 'all 0.8s ease-out 0.2s',
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

// --- 2. COMPONENT ---
const HeroBanner = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  // DATA (Giả lập)
  const fakeData = [
    {
      id: 1,
      bgImage:
        'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop',
      productImage:
        'https://png.pngtree.com/png-vector/20240309/ourmid/pngtree-the-smartwatch-banner-png-image_11919210.png',
      tag: 'Best Deal Online on',
      title: 'Smart Watches',
      promoPrefix: 'UP TO',
      promoHighlight: '50% OFF',
      desc: '*Applicable to Series 7 and above models.',
    },
    {
      id: 2,
      bgImage:
        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=2070&auto=format&fit=crop',
      productImage:
        'https://png.pngtree.com/png-clipart/20241210/original/pngtree-nike-shoes-transparent-png-image_17778783.png',
      tag: 'New Collection',
      title: 'Latest Nike Shoes',
      promoPrefix: 'FLAT',
      promoHighlight: '30% OFF',
      desc: 'Free shipping for orders placed today.',
    },
    {
      id: 3,
      bgImage:
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=2070&auto=format&fit=crop',
      productImage:
        'https://www.gonoise.com/cdn/shop/files/3_f6efac49-e93c-4cf1-93db-313be862cab9.webp?v=1720759166',
      tag: 'Premium Sound',
      title: 'Wireless Headset',
      promoPrefix: 'BUY 1',
      promoHighlight: 'GET 1',
      desc: 'Limited quantity gift combo.',
    },
  ];

  useEffect(() => {
    setBanners(fakeData);
    setLoading(false);
  }, []);

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
              {banners.map((banner, index) => {
                const isActive = index === currentIndex;

                return (
                  <div
                    key={banner.id}
                    style={{
                      ...styles.heroBannerSlide,
                      backgroundImage: `url(${banner.bgImage})`,
                    }}
                  >
                    <div style={styles.heroBannerOverlay}></div>
                    <div style={styles.heroBannerGrid}>
                      {/* Text Column */}
                      <div style={styles.heroBannerTextCol}>
                        <span
                          style={{
                            ...styles.heroBannerTopTag,
                            ...(isActive ? styles.heroBannerActiveElem : {}),
                            transitionDelay: '0.1s',
                          }}
                        >
                          {banner.tag}
                        </span>

                        <h1
                          style={{
                            ...styles.heroBannerHeading,
                            ...(isActive ? styles.heroBannerActiveElem : {}),
                            transitionDelay: '0.3s',
                          }}
                        >
                          {banner.title}
                        </h1>

                        <div
                          style={{
                            ...styles.heroBannerPromo,
                            ...(isActive ? styles.heroBannerActiveElem : {}),
                            transitionDelay: '0.5s',
                          }}
                        >
                          {banner.promoPrefix}{' '}
                          <span style={{ color: COLORS.accent }}>{banner.promoHighlight}</span>
                        </div>

                        <p
                          style={{
                            ...styles.heroBannerDesc,
                            ...(isActive ? styles.heroBannerActiveElem : {}),
                            transitionDelay: '0.6s',
                          }}
                        >
                          {banner.desc}
                        </p>
                      </div>

                      {/* Image Column */}
                      <div style={styles.heroBannerImgCol}>
                        <img
                          src={banner.productImage}
                          alt={banner.title}
                          style={{
                            ...styles.heroBannerTiltImg,
                            ...(isActive ? styles.heroBannerActiveImg : {}),
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
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
