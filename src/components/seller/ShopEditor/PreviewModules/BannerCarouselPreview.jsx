/**
 * BannerCarouselPreview — Live Render Component cho Banner Carousel Module
 *
 * Props:
 * - module: module object tu Redux
 * - isSelected: boolean
 * - onSelect: callback
 */

import React, { useState, useEffect, useRef } from 'react';
import { getModuleBanners } from '@services/shopDecoration/moduleTemplates';
import styles from '@assets/styles/seller/ShopDecorationPage.module.css';

const RATIO_PADDING = {
  '2:1': '50%',
  '16:9': '56.25%',
  '4:3': '75%',
  '1:1': '100%',
};

export default function BannerCarouselPreview({ module, isSelected, onSelect }) {
  const banners = getModuleBanners(module);
  const { props = {} } = module || {};
  const autoplay = props.autoplay !== false;
  const interval = props.interval || 4000;
  const aspectRatio = props.aspectRatio || '2:1';
  const ratioPad = RATIO_PADDING[aspectRatio] || '50%';

  const [current, setCurrent] = useState(0);
  const timerRef = useRef(null);

  const total = banners.length;

  // Auto-play logic
  useEffect(() => {
    if (!autoplay || total <= 1) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % total);
    }, interval);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [autoplay, interval, total]);

  const goTo = (idx) => {
    setCurrent(idx);
    if (timerRef.current) clearInterval(timerRef.current);
    if (autoplay && total > 1) {
      timerRef.current = setInterval(() => {
        setCurrent((c) => (c + 1) % total);
      }, interval);
    }
  };

  if (total === 0) {
    return (
      <div className={styles.bannerEmpty} onClick={onSelect}>
        <i className="bi bi-images" />
        <p>Chua co banner nao</p>
        <small>Them hinh anh de bat dau</small>
      </div>
    );
  }

  return (
    <div
      className={`${styles.bannerCarousel} ${isSelected ? styles.bannerCarouselSelected : ''}`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect && onSelect()}
    >
      {/* Aspect-ratio box: ensures correct ratio regardless of image size */}
      <div style={{ position: 'relative', width: '100%', paddingBottom: ratioPad }}>
        <div style={{ position: 'absolute', inset: 0 }}>
          {/* Slides */}
          <div className={styles.bannerSlides} style={{ transform: `translateX(-${current * 100}%)` }}>
            {banners.map((banner, idx) => (
              <div key={banner.id || idx} className={styles.bannerSlide}>
                <img
                  src={banner.url}
                  alt={banner.alt || `Banner ${idx + 1}`}
                  className={styles.bannerSlideImg}
                  draggable={false}
                />
              </div>
            ))}
          </div>

          {/* Navigation Arrows */}
          {total > 1 && (
            <>
              <button
                className={`${styles.bannerArrow} ${styles.bannerArrowLeft}`}
                onClick={(e) => {
                  e.stopPropagation();
                  goTo((current - 1 + total) % total);
                }}
                aria-label="Previous"
              >
                <i className="bi bi-chevron-left" />
              </button>
              <button
                className={`${styles.bannerArrow} ${styles.bannerArrowRight}`}
                onClick={(e) => {
                  e.stopPropagation();
                  goTo((current + 1) % total);
                }}
                aria-label="Next"
              >
                <i className="bi bi-chevron-right" />
              </button>
            </>
          )}

          {/* Dots */}
          {total > 1 && (
            <div className={styles.bannerDots}>
              {banners.map((_, idx) => (
                <button
                  key={idx}
                  className={`${styles.bannerDot} ${idx === current ? styles.bannerDotActive : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    goTo(idx);
                  }}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          )}

          {/* Autoplay indicator */}
          {autoplay && (
            <div className={styles.bannerAutoplayTag}>
              <i className="bi bi-play-fill" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
