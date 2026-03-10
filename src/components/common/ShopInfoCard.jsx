import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styles from '../../assets/styles/ShopInfoCard.module.css';

const ShopInfoCard = ({ seller, showViewShop = true, isFollowing = false, onToggleFollow }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (!seller || typeof seller !== 'object') {
    return null;
  }

  const sellerId = seller._id || seller.id;

  const handleChatClick = () => {
    if (!sellerId) return;
    
    // Dispatch custom event that ChatWidget listens to
    console.log('ShopInfoCard: Dispatching openChatWithShop for:', sellerId);
    const event = new CustomEvent('openChatWithShop', { 
        detail: { shopId: sellerId } 
    });
    window.dispatchEvent(event);
  };

  return (
    <div className={styles.shopInfoCard}>
      {/* Left Side: Avatar, Name, Buttons */}
      <div className={styles.shopProfileLeft}>
        <div className={styles.shopAvatarContainer}>
          <img
            src={seller.avatar || 'https://ui-avatars.com/api/?name=Shop&background=random'}
            alt={seller.fullName || 'Shop'}
            className={styles.shopAvatarImg}
          />
          {(seller.isPreferred || true) && (
            <div className={styles.shopFavBadge}>{t('product_details.shop_badge_favorite')}</div>
          )}
        </div>
        <div className={styles.shopProfileInfo}>
          <div className={styles.shopName}>{seller.fullName || 'Shop'}</div>
          <div className={styles.shopOnlineStatus}>
              {seller.createdAt ? `${t('product_details.shop_joined')} ${Math.max(1, Math.floor((new Date() - new Date(seller.createdAt)) / (1000 * 60 * 60 * 24 * 30)))} ${t('product_details.shop_months_ago')}` : ''}
          </div>
          <div className={styles.shopActions}>
            {showViewShop ? (
              <>
                <button className={styles.btnViewShop} onClick={handleChatClick}>
                  <i className="bi bi-chat-dots-fill"></i> {t('product_details.btn_chat', 'Chat')}
                </button>
                <button
                  className={styles.btnChat}
                  onClick={() => navigate(`/shop/${sellerId}`)}
                >
                  <i className="bi bi-shop"></i> {t('product_details.btn_view_shop')}
                </button>
              </>
            ) : (
              <>
                <button 
                  className={`${styles.btnViewShop} ${isFollowing ? styles.following : ''}`} 
                  onClick={onToggleFollow}
                >
                  <i className={`bi ${isFollowing ? 'bi-person-check-fill' : 'bi-person-plus-fill'}`}></i> 
                  {isFollowing ? t('product_details.btn_following', 'Đang Theo Dõi') : t('product_details.btn_follow', 'Theo Dõi')}
                </button>
                <button className={styles.btnChat} onClick={handleChatClick}>
                  <i className="bi bi-chat-dots"></i> {t('product_details.btn_chat', 'Chat')}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className={styles.shopDivider}></div>

      {/* Right Side: Stats */}
      <div className={styles.shopStatsRight}>
        <div className={styles.statItem}>
          <i className="bi bi-shop statIcon"></i>
          <span className={styles.statLabel}>{t('product_details.shop_stat_products')}:</span>
          <span className={styles.statValue}>{seller.productCount !== undefined ? seller.productCount : t('product_details.val_updating')}</span>
        </div>
        <div className={styles.statItem}>
          <i className="bi bi-people statIcon"></i>
          <span className={styles.statLabel}>{t('product_details.shop_stat_followers')}:</span>
          <span className={styles.statValue}>{seller.followerCount !== undefined ? seller.followerCount : t('product_details.val_updating')}</span>
        </div>
        <div className={styles.statItem}>
          <i className="bi bi-person-check statIcon"></i>
          <span className={styles.statLabel}>{t('product_details.shop_stat_following')}:</span>
          <span className={styles.statValue}>{seller.followingCount !== undefined ? seller.followingCount : 0}</span>
        </div>
        <div className={styles.statItem}>
          <i className="bi bi-star statIcon"></i>
          <span className={styles.statLabel}>{t('product_details.shop_stat_rating')}:</span>
          <span className={styles.statValue}>
            {seller.rating !== undefined ? seller.rating.toFixed(1) : '0.0'} 
            {seller.ratingCount > 0 ? ` (${seller.ratingCount} ${t('product_details.shop_stat_rating')})` : ''}
          </span>
        </div>
        <div className={styles.statItem}>
          <i className="bi bi-chat-dots statIcon"></i>
          <span className={styles.statLabel}>{t('product_details.shop_stat_response_rate')}:</span>
          <span className={styles.statValue}>{seller.chatResponseRate !== undefined ? seller.chatResponseRate : 100}%</span>
        </div>
        <div className={styles.statItem}>
          <i className="bi bi-x-circle statIcon"></i>
          <span className={styles.statLabel}>{t('product_details.shop_stat_cancel_rate')}:</span>
          <span className={styles.statValue}>{seller.cancelDutyRate !== undefined ? seller.cancelDutyRate : 0}%</span>
        </div>
      </div>
    </div>
  );
};

export default ShopInfoCard;
