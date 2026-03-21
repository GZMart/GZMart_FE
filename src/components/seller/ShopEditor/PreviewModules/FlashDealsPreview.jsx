/**
 * FlashDealsPreview — Live Render Component cho Flash Deals Module
 *
 * Hien thi countdown timer + horizontal scroll products
 *
 * Props:
 * - module: module object tu Redux
 * - isSelected: boolean
 * - onSelect: callback
 */

import React, { useState, useEffect } from 'react';
import { getModuleProducts } from '@services/shopDecoration/moduleTemplates';
import ProductCard from './Common/ProductCard';
import styles from '@assets/styles/seller/ShopDecorationPage.module.css';

export default function FlashDealsPreview({ module, isSelected, onSelect }) {
  const { props = {} } = module || {};
  const hideTitle = props.hideTitle || false;
  const title = props.title || 'Uu Dai Khung';
  const products = getModuleProducts(module, 6);

  // Countdown timer state (mock: 8h 32m 15s)
  const [timeLeft, setTimeLeft] = useState({
    hours: 8,
    minutes: 32,
    seconds: 15,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        let { hours, minutes, seconds } = prev;
        seconds -= 1;
        if (seconds < 0) {
          seconds = 59;
          minutes -= 1;
        }
        if (minutes < 0) {
          minutes = 59;
          hours -= 1;
        }
        if (hours < 0) {
          return { hours: 0, minutes: 0, seconds: 0 };
        }
        return { hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const pad = (n) => String(n).padStart(2, '0');

  return (
    <div
      className={`${styles.flashWrap} ${isSelected ? styles.flashWrapSelected : ''}`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect && onSelect()}
    >
      {/* Header with countdown */}
      <div className={styles.flashHeader}>
        <div className={styles.flashLeft}>
          <div className={styles.flashIconTag}>
            <i className="bi bi-lightning-charge-fill" />
          </div>
          {!hideTitle && <h3 className={styles.flashTitle}>{title}</h3>}
        </div>
        <div className={styles.flashCountdown}>
          <span className={styles.flashCountdownLabel}>Ket thuc trong</span>
          <div className={styles.flashCountdownTimer}>
            <span className={styles.flashTimeUnit}>{pad(timeLeft.hours)}</span>
            <span className={styles.flashTimeSep}>:</span>
            <span className={styles.flashTimeUnit}>{pad(timeLeft.minutes)}</span>
            <span className={styles.flashTimeSep}>:</span>
            <span className={styles.flashTimeUnit}>{pad(timeLeft.seconds)}</span>
          </div>
        </div>
        <button className={styles.flashSeeAll}>
          Xem tat ca <i className="bi bi-chevron-right" />
        </button>
      </div>

      {/* Products horizontal scroll */}
      {products.length > 0 ? (
        <div className={styles.flashProductsScroll}>
          {products.map((product, idx) => (
            <div key={product.id || idx} className={styles.flashProductItem}>
              <ProductCard product={product} size="sm" />
              <div className={styles.flashProgressWrap}>
                <div className={styles.flashProgressBar} style={{ width: `${60 + idx * 5}%` }} />
                <span className={styles.flashProgressText}>Da ban {60 + idx * 5}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.flashEmpty}>
          <i className="bi bi-lightning-charge" />
          <p>Chua co san pham nao</p>
        </div>
      )}
    </div>
  );
}
