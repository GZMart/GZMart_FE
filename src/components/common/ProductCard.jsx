import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import PropTypes from 'prop-types';
import { formatCurrency } from '@utils/formatters';
import * as wishlistService from '@/services/api/wishlistService';
import styles from '@assets/styles/common/ProductCard.module.css';

// 计算倒计时（HH:MM:SS 格式）
const formatCountdown = (distance) => {
  if (distance < 0) {
    return '00:00:00';
  }
  const hours = Math.floor(distance / (1000 * 60 * 60));
  const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((distance % (1000 * 60)) / 1000);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

// 计算距离开始的倒计时（用于 COMING SOON 状态）
const formatCountdownStart = (distance) => {
  if (distance < 0) {
    return '00:00:00';
  }
  const hours = Math.floor(distance / (1000 * 60 * 60));
  const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((distance % (1000 * 60)) / 1000);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

// 获取 deal 状态：active | ending | upcoming | ended
const getDealStatus = (dealEndDate, dealStartDate) => {
  const now = new Date().getTime();
  const end = dealEndDate ? new Date(dealEndDate).getTime() : null;
  const start = dealStartDate ? new Date(dealStartDate).getTime() : null;

  if (!dealStartDate && !dealEndDate) {
    return { type: 'active', label: 'Deal', urgent: false };
  }
  if (end && now > end) {
    return { type: 'ended', label: 'Ended', urgent: false };
  }
  if (start && now < start) {
    return { type: 'upcoming', label: 'Coming Soon', urgent: false };
  }
  if (end) {
    const remaining = end - now;
    const twoHours = 2 * 60 * 60 * 1000;
    return remaining <= twoHours
      ? { type: 'ending', label: 'Ending Soon', urgent: true }
      : { type: 'active', label: 'Flash Sale', urgent: false };
  }
  return { type: 'active', label: 'Flash Sale', urgent: false };
};

// Placeholder when product has no image (avoid empty src = broken image)
const PLACEHOLDER_IMAGE =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"%3E%3Crect fill="%23f1f5f9" width="200" height="200"/%3E%3Ctext fill="%2394a3b8" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-size="14"%3ENo image%3C/text%3E%3C/svg%3E';

const ProductCard = React.forwardRef(({ product }, ref) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const [isFav, setIsFav] = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  const productImage = (product.image && String(product.image).trim())
    ? product.image
    : PLACEHOLDER_IMAGE;

  const discountPercentage =
    product.originalPrice > 0 && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0;

  const ratingValue = parseFloat(product.rating) || 0;
  const fullStars = Math.floor(ratingValue);
  const hasHalfStar = ratingValue - fullStars >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  const handleCardClick = () => {
    navigate(`/product/${product.id}`);
  };

  const handleWishlistToggle = async (e) => {
    e.stopPropagation();
    e.preventDefault();

    if (!user) {
      toast.info('Please login to add wishlists');
      navigate('/login');
      return;
    }

    setFavLoading(true);
    try {
      if (isFav) {
        await wishlistService.removeFromWishlists(product.id);
        setIsFav(false);
        toast.success('Removed from wishlist');
      } else {
        await wishlistService.addToWishlists(product.id);
        setIsFav(true);
        toast.success('Added to wishlist');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update wishlist');
    } finally {
      setFavLoading(false);
    }
  };

  // Flash sale countdown timer (HH:MM:SS)
  const [timeLeft, setTimeLeft] = useState('');
  const [countdownToStart, setCountdownToStart] = useState('');

  useEffect(() => {
    if (!product.dealEndDate && !product.dealStartDate) {
      return;
    }

    const updateTimer = () => {
      const now = new Date().getTime();
      const end = product.dealEndDate ? new Date(product.dealEndDate).getTime() : null;
      const start = product.dealStartDate ? new Date(product.dealStartDate).getTime() : null;

      if (start && now < start) {
        // Deal chưa bắt đầu - đếm ngược đến lúc bắt đầu
        setTimeLeft('');
        setCountdownToStart(formatCountdownStart(start - now));
        return;
      }

      setCountdownToStart('');
      if (end && now < end) {
        setTimeLeft(formatCountdown(end - now));
      } else {
        setTimeLeft('Ended');
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [product.dealEndDate, product.dealStartDate]);

  const isFlashSale =
    product.promotionType === 'flashSale' ||
    !!(product.dealType && product.dealEndDate);
  const qtyLimit = product.dealQuantityLimit;
  const hasQtyLimit = qtyLimit != null && Number(qtyLimit) > 0;
  const soldPercentage = hasQtyLimit
    ? Math.min(100, Math.round(((product.dealSoldCount || 0) / Number(qtyLimit)) * 100))
    : 0;
  const remainingQty = hasQtyLimit
    ? Math.max(0, Number(qtyLimit) - (product.dealSoldCount || 0))
    : null;
  const dealStatus = getDealStatus(product.dealEndDate, product.dealStartDate);

  // Xác định badge dựa trên trạng thái deal
  const getDealBadge = () => {
    if (dealStatus.type === 'upcoming') {
      return { label: 'COMING SOON', variant: 'upcoming', urgent: false };
    }
    if (dealStatus.type === 'ended') {
      return { label: 'ENDED', variant: 'ended', urgent: false };
    }
    if (dealStatus.type === 'ending') {
      return { label: dealStatus.label.toUpperCase(), variant: 'ending', urgent: true };
    }
    if (isFlashSale) {
      return { label: 'FLASH SALE', variant: 'flash', urgent: false };
    }
    return null;
  };

  const dealBadge = getDealBadge();
  const preOrderDays = Number(product.preOrderDays) || 0;

  return (
    <div
      className={styles.productCard}
      onClick={handleCardClick}
      role="link"
      tabIndex={0}
      ref={ref}
    >
      {/* Discount Badge (fish-tail style) */}
      {discountPercentage > 0 && (
        <div className={styles.discountBadge}>
          -{discountPercentage}%<br />OFF
        </div>
      )}

      {/* Deal Status Badge (top-left) */}
      {dealBadge && (
        <div
          className={`${styles.dealBadge} ${styles[`dealBadge_${dealBadge.variant}`]} ${
            dealBadge.urgent ? styles.dealBadge_pulse : ''
          }`}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 12 }}>
            {dealStatus.type === 'upcoming'
              ? 'schedule'
              : dealStatus.type === 'ending'
              ? 'bolt'
              : isFlashSale
              ? 'bolt'
              : 'local_fire_department'}
          </span>
          {dealBadge.label}
        </div>
      )}

      {/* Product Image */}
      <div
        className={`${styles.imageWrapper} ${
          dealStatus.type === 'upcoming' ? styles.imageWrapper_grayscale : ''
        }`}
      >
        <img src={productImage} alt={product.name} className={styles.productImage} />
        <div className={styles.imageOverlay}>
          <button
            className={`${styles.actionBtn} ${isFav ? styles.actionBtnActive : ''}`}
            aria-label={isFav ? 'Remove from wishlist' : 'Add to wishlist'}
            onClick={handleWishlistToggle}
            disabled={favLoading}
          >
            <i className={`bi ${isFav ? 'bi-heart-fill' : 'bi-heart'}`}></i>
          </button>
        </div>
        {/* Combo Promotion Tag */}
        {product.comboPromotion && (
          <div className={styles.comboTag}>
            <i className="bi bi-tags-fill"></i>
            {product.comboPromotion.comboType === 'percent'
              ? `Combo -${product.comboPromotion.bestDiscount}%`
              : 'Combo Deal'}
          </div>
        )}
        {preOrderDays > 0 && (
          <div
            className={styles.preOrderChip}
            title={t('product_details.pre_order_eta', { days: preOrderDays })}
          >
            <i className="bi bi-clock-history" aria-hidden />
            <span>{t('product_details.pre_order_chip')}</span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className={styles.productInfo}>
        {/* Reserve one line so cards with/without campaign share the same height */}
        <div className={styles.campaignSlot}>
          {product.campaignTitle ? (
            <div className={styles.campaignTag}>
              <i className="bi bi-megaphone-fill"></i>
              {product.campaignTitle}
            </div>
          ) : null}
        </div>

        <h3 className={styles.productName}>{product.name}</h3>

        {/* ========== Flash Sale Info Box (参考 sample 的完整设计) ========== */}
        {(isFlashSale || product.dealEndDate || product.dealStartDate) &&
          dealStatus.type !== 'ended' && (
            <div className={styles.flashSaleBox}>
              {/* Top thin progress bar */}
              <div className={styles.flashBoxTopBar}>
                <div
                  className={styles.flashBoxTopBarFill}
                  style={{ width: `${Math.min(soldPercentage, 100)}%` }}
                />
              </div>

              <div className={styles.flashBoxContent}>
                {/* Timer Row */}
                <div className={styles.flashTimerRow}>
                  {dealStatus.type === 'upcoming' ? (
                    <>
                      <span className={styles.flashTimerLabel}>
                        <span className={`material-symbols-outlined ${styles.flashIcon}`}>
                          schedule
                        </span>
                        Opens in:
                      </span>
                      <span className={`${styles.flashTimerValue} ${styles.flashTimerUpcoming}`}>
                        {countdownToStart}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className={styles.flashTimerLabel}>
                        <span
                          className={`material-symbols-outlined ${styles.flashIcon} ${
                            dealStatus.urgent ? styles.flashIcon_pulse : ''
                          }`}
                        >
                          bolt
                        </span>
                        Flash Ends In:
                      </span>
                      <span
                        className={`${styles.flashTimerValue} ${
                          dealStatus.urgent ? styles.flashTimerUrgent : ''
                        }`}
                      >
                        {timeLeft}
                      </span>
                    </>
                  )}
                </div>

                {/* Progress row: always same block height (API may omit dealQuantityLimit) */}
                <div className={styles.flashProgressRow}>
                  <div className={styles.flashProgressLabels}>
                    <span className={styles.flashProgressLabel}>
                      {hasQtyLimit ? (
                        <>
                          Sold: {soldPercentage}%
                          {remainingQty !== null && (
                            <span className={styles.flashRemainingQty}>
                              {' · '}
                              {remainingQty} Left
                            </span>
                          )}
                        </>
                      ) : (
                        <span className={styles.flashProgressNoQuota}>Sold: —</span>
                      )}
                    </span>
                  </div>
                  <div className={styles.flashProgressTrack}>
                    <div
                      className={`${styles.flashProgressFill} ${
                        dealStatus.type === 'upcoming'
                          ? styles.flashProgressFill_upcoming
                          : !hasQtyLimit
                          ? styles.flashProgressFill_noQuota
                          : soldPercentage >= 80
                          ? styles.flashProgressFill_critical
                          : styles.flashProgressFill_normal
                      }`}
                      style={{
                        width: hasQtyLimit ? `${Math.min(soldPercentage, 100)}%` : '0%',
                      }}
                    />
                  </div>
                </div>

                {/* Set Reminder button for upcoming deals */}
                {dealStatus.type === 'upcoming' && (
                  <button className={styles.setReminderBtn}>
                    <i className="bi bi-bell"></i> Set Reminder
                  </button>
                )}
              </div>
            </div>
          )}

        <div className={styles.cardFooter}>
          <div className={styles.rating}>
            <div className={styles.stars}>
              {[...Array(fullStars)].map((_, i) => (
                <i key={`full-${i}`} className={`bi bi-star-fill ${styles.starFilled}`}></i>
              ))}
              {hasHalfStar && <i className={`bi bi-star-half ${styles.starFilled}`}></i>}
              {[...Array(emptyStars)].map((_, i) => (
                <i key={`empty-${i}`} className={`bi bi-star ${styles.starEmpty}`}></i>
              ))}
              <span className={styles.ratingValue}>{ratingValue.toFixed(1)}</span>
            </div>
            <span className={styles.soldCount}>Sold {product.sold || 0}</span>
          </div>
          <div className={styles.priceRow}>
            <span className={styles.currentPrice}>{formatCurrency(product.price)}</span>
            {discountPercentage > 0 && (
              <span className={styles.originalPrice}>{formatCurrency(product.originalPrice)}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

// Give the component a display name for debugging since it's wrapped in forwardRef
ProductCard.displayName = 'ProductCard';

ProductCard.propTypes = {
  product: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    image: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
    originalPrice: PropTypes.number,
    rating: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    reviews: PropTypes.number,
    sold: PropTypes.number,
    badge: PropTypes.string,
    badgeColor: PropTypes.string,
    tier_variations: PropTypes.array,
    // Campaign title (for flash sale cards)
    campaignTitle: PropTypes.string,
    // Flash sale / Deal fields
    dealId: PropTypes.string,
    dealType: PropTypes.string,
    dealStatus: PropTypes.string,
    dealStartDate: PropTypes.string,
    dealEndDate: PropTypes.string,
    dealSoldCount: PropTypes.number,
    dealQuantityLimit: PropTypes.number,
    // Promotion fields
    promotionType: PropTypes.string,
    comboPromotion: PropTypes.shape({
      name: PropTypes.string,
      comboType: PropTypes.string,
      bestDiscount: PropTypes.number,
    }),
    preOrderDays: PropTypes.number,
  }).isRequired,
};

export default ProductCard;
