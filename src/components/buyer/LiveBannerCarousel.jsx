/**
 * LiveBannerCarousel — Carousel for buyer-facing shop pages (ShopProfilePage)
 *
 * Props:
 *   images  — array of { url, link? } or strings
 *   autoplay — boolean (default: true)
 *   interval — ms between slides (default: 4000)
 */

import { useState, useEffect, useRef } from 'react';
import styles from '../../assets/styles/ShopProfilePage.module.css';

/** Cloudinary: request high-quality display for banner (width 1920, limit crop, best quality) */
function bannerDisplayUrl(url) {
  if (!url || typeof url !== 'string') {
return url;
}
  if (!url.includes('cloudinary.com')) {
return url;
}
  if (url.includes('w_1920') || url.includes('q_auto:best')) {
return url;
}
  return url.replace(/\/upload\//, '/upload/w_1920,c_limit,q_auto:best,f_auto/');
}

export default function LiveBannerCarousel({ images = [], autoplay = true, interval = 4000, aspectRatio = '2:1' }) {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef(null);
  const total = images.length;

  const RATIO_PAD = { '2:1': '50%', '16:9': '56.25%', '4:3': '75%', '1:1': '100%' };
  const ratioPad = RATIO_PAD[aspectRatio] || '50%';

  useEffect(() => {
    if (!autoplay || total <= 1) {
      if (timerRef.current) {
clearInterval(timerRef.current);
}
      return;
    }
    timerRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % total);
    }, interval);
    return () => {
      if (timerRef.current) {
clearInterval(timerRef.current);
}
    };
  }, [autoplay, interval, total]);

  if (total === 0) {
return null;
}

  const getSrc = (img) => {
    const raw = typeof img === 'string' ? img : img?.url || '';
    return bannerDisplayUrl(raw);
  };

  return (
    <div className={styles.liveCarousel}>
      {/* Aspect-ratio container matches seller's crop ratio */}
      <div style={{ position: 'relative', width: '100%', paddingBottom: ratioPad }}>
        <div style={{ position: 'absolute', inset: 0 }}>
          <div
            className={styles.liveCarouselSlides}
            style={{ transform: `translateX(-${current * 100}%)` }}
          >
            {images.map((img, idx) => {
              const src = getSrc(img);
              const link = typeof img === 'object' ? img.link : null;
              const content = (
                <img src={src} alt={`Banner ${idx + 1}`} className={styles.liveCarouselImg} draggable={false} />
              );
              return (
                <div key={idx} className={styles.liveCarouselSlide}>
                  {link ? (
                    <a href={link} target="_blank" rel="noopener noreferrer" className={styles.liveCarouselLink}>
                      {content}
                    </a>
                  ) : content}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
