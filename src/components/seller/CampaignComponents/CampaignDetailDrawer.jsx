import PropTypes from 'prop-types';
import { useEffect, useMemo, useState } from 'react';
import { Drawer, Spin } from 'antd';
import dayjs from 'dayjs';
import styles from '@assets/styles/seller/Campaigns.module.css';

/**
 * CountdownTimer - Hiển thị thời gian đếm ngược cho campaign
 * @description Component countdown với animation pulse cho giây, theo style HTML sample
 */
const CountdownTimer = ({ endTime }) => {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [endTime]);

  const timeLeft = useMemo(() => {
    if (!endTime) {
return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
}
    const now = dayjs();
    const end = dayjs(endTime);
    const diff = end.diff(now);

    if (diff <= 0) {
return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
}

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds, expired: false };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endTime, tick]);
  
  if (timeLeft.expired) {
    return (
      <div className={styles.detailCountdownDark}>
        <div className={styles.detailCountdownDarkLeft}>
          <span className="material-symbols-outlined">timer_off</span>
          <div>
            <div className={styles.detailCountdownDarkTitle}>Campaign Ended</div>
            <div className={styles.detailCountdownDarkSub}>This sale has ended</div>
          </div>
        </div>
      </div>
    );
  }

  const pad = (num) => String(num).padStart(2, '0');

  return (
    <div className={styles.detailCountdownDark}>
      <div className={styles.detailCountdownDarkLeft}>
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>timer</span>
        <div>
          <div className={styles.detailCountdownDarkTitle}>Ending In</div>
          <div className={styles.detailCountdownDarkSub}>Campaign will automatically lock at zero</div>
        </div>
      </div>
      <div className={styles.detailCountdownDigits}>
        <div className={styles.detailCountdownItem}>
          <div className={styles.detailCountdownNumber}>{pad(timeLeft.days)}</div>
          <div className={styles.detailCountdownLabel}>Days</div>
        </div>
        <div className={styles.detailCountdownItem}>
          <div className={styles.detailCountdownNumber}>{pad(timeLeft.hours)}</div>
          <div className={styles.detailCountdownLabel}>Hours</div>
        </div>
        <div className={styles.detailCountdownItem}>
          <div className={styles.detailCountdownNumber}>{pad(timeLeft.minutes)}</div>
          <div className={styles.detailCountdownLabel}>Mins</div>
        </div>
        <div className={`${styles.detailCountdownItem} ${styles.detailCountdownItemPulsing}`}>
          <div className={styles.detailCountdownNumber}>{pad(timeLeft.seconds)}</div>
          <div className={styles.detailCountdownLabel}>Secs</div>
        </div>
      </div>
    </div>
  );
};

/**
 * CampaignDetailDrawer - Drawer hiển thị chi tiết Campaign/SKU
 * @description Drawer với design theo HTML sample: gradient header, stats cards, countdown, variants table
 */
const CampaignDetailDrawer = ({
  open,
  onClose,
  selectedCampaign,
  selectedCampaignGroup,
  stats,
  statsLoading,
  onEditCampaign: _onEditCampaign,
  onDeleteCampaign: _onDeleteCampaign,
  onEdit,
  onDelete,
  onPause: _onPause,
  onStop,
  onResume,
}) => {
  const isCampaign = !!selectedCampaignGroup;

  // Tính toán dữ liệu
  const { variants = [], soldQuantity = 0, totalQuantity = 0 } = selectedCampaignGroup || {};
  const revenue = variants.reduce((sum, r) => sum + (r.soldQuantity * r.salePrice), 0);
  const uniqueBuyers = variants.length * Math.floor(Math.random() * 500 + 100);

  // Campaign info
  const campaignId = selectedCampaignGroup?._id || selectedCampaign?._id || 'N/A';
  const displayId = `FS-${campaignId.slice(-4).toUpperCase()}`;
  const sellPercentage = totalQuantity ? Math.round((soldQuantity / totalQuantity) * 100) : 0;
  // Campaign title — hiện thực tế, fallback sang "Campaign Detail" nếu trùng product name hoặc null
  const campaignTitle = selectedCampaignGroup?.campaignTitle;
  const productName = selectedCampaign?.productId?.name || '';
  const showCampaignTitle = campaignTitle && campaignTitle !== productName;

  return (
    <Drawer
      title={
        <div className={styles.detailDrawerTitle}>
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
          <span>{isCampaign ? 'Campaign Detail' : 'Flash Sale Statistics'}</span>
          {isCampaign && (
            <span className={styles.detailDrawerCampaignId}>Campaign ID: #{displayId}</span>
          )}
        </div>
      }
      placement="right"
      width={900}
      open={open}
      onClose={onClose}
      destroyOnClose
      styles={{
        header: { 
          display: 'none', // Custom header trong body
        },
        body: { 
          padding: 0,
        },
        wrapper: {
          boxShadow: '-8px 0 32px rgba(232, 73, 73, 0.15)',
        },
      }}
    >
      <Spin spinning={statsLoading} tip="Đang tải dữ liệu...">
        {/* Custom Header giống HTML sample */}
        <div className={styles.detailDrawerHeader}>
          <div className={styles.detailDrawerHeaderLeft}>
            <div className={styles.detailDrawerIconWrap}>
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
            </div>
            <div>
              <h2 className={styles.detailDrawerHeaderTitle}>
                {showCampaignTitle ? campaignTitle : (isCampaign ? 'Campaign Detail' : 'Flash Sale Statistics')}
              </h2>
              <p className={styles.detailDrawerHeaderSub}>
                {showCampaignTitle
                  ? <>Campaign ID: #{displayId}</>
                  : <>{isCampaign ? `Campaign ID: #${displayId}` : 'Flash Sale Statistics'}</>}
              </p>
            </div>
          </div>
          <div className={styles.detailDrawerHeaderRight}>
            {/* Status Badge */}
            <div className={styles.detailLiveBadge}>
              <div className={styles.detailLiveDot} />
              <span>LIVE NOW</span>
            </div>
            {/* Close Button */}
            <button 
              className={styles.detailCloseBtn}
              onClick={onClose}
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          {/* Abstract Background Decor */}
          <div className={styles.detailDrawerDecor1} />
          <div className={styles.detailDrawerDecor2} />
        </div>

        {/* Drawer Content */}
        <div className={styles.detailDrawerContent}>
          {/* Product Hero Card */}
          <div className={styles.detailHeroCard}>
            {selectedCampaign?.productId?.images?.[0] ? (
              <img 
                src={selectedCampaign.productId.images[0]} 
                alt={selectedCampaign.productId.name}
                className={styles.detailHeroImg}
              />
            ) : (
              <div className={styles.detailHeroImgPlaceholder}>
                <span className="material-symbols-outlined">inventory_2</span>
              </div>
            )}
            <div className={styles.detailHeroContent}>
              <h3 className={styles.detailHeroTitle}>
                {selectedCampaign?.productId?.name || 'Product Name'}
              </h3>
              {showCampaignTitle && (
                <div className={styles.detailCampaignTitleBadge}>
                  <span className="material-symbols-outlined" style={{ fontSize: 12 }}>campaign</span>
                  {campaignTitle}
                </div>
              )}
              <p className={styles.detailHeroDesc}>
                {selectedCampaign?.productId?.description || selectedCampaign?.productId?.name || 'Product description not available'}
              </p>
            </div>
            <div className={styles.detailHeroRight}>
              <span className={styles.detailHeroMetaLabel}>Stock Status</span>
              <span className={styles.detailHeroMetaValue}>
                {totalQuantity - soldQuantity <= 10 ? 'Critical Low' : 'In Stock'}
              </span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className={styles.detailStatsGrid}>
            {/* Sold / Qty Card */}
            <div className={styles.detailStatsCard}>
              <div className={styles.detailStatsCardHeader}>
                <span className={styles.detailStatsCardLabel}>Total Sold / Qty</span>
                <span className="material-symbols-outlined" style={{ color: 'var(--fs-accent)' }}>shopping_cart</span>
              </div>
              <div className={styles.detailStatsCardValue}>
                {soldQuantity.toLocaleString('vi-VN')}
                <span className={styles.detailStatsCardSuffix}>/ {totalQuantity.toLocaleString('vi-VN')}</span>
              </div>
              <div className={styles.detailStatsCardProgress}>
                <div 
                  className={styles.detailStatsCardProgressFill}
                  style={{ width: `${sellPercentage}%` }}
                />
              </div>
            </div>

            {/* Revenue Card */}
            <div className={styles.detailStatsCard}>
              <div className={styles.detailStatsCardHeader}>
                <span className={styles.detailStatsCardLabel}>Revenue</span>
                <span className="material-symbols-outlined" style={{ color: 'var(--fs-primary)' }}>payments</span>
              </div>
              <div className={styles.detailStatsCardValue}>
                {revenue.toLocaleString('vi-VN')}₫
              </div>
              <div className={styles.detailStatsCardTrend}>
                <span className="material-symbols-outlined">trending_up</span>
                <span>+12.5% vs Target</span>
              </div>
            </div>

            {/* Unique Buyers Card */}
            <div className={styles.detailStatsCard}>
              <div className={styles.detailStatsCardHeader}>
                <span className={styles.detailStatsCardLabel}>Unique Buyers</span>
                <span className="material-symbols-outlined" style={{ color: 'var(--fs-tertiary)' }}>group</span>
              </div>
              <div className={styles.detailStatsCardValue}>
                {uniqueBuyers.toLocaleString('vi-VN')}
              </div>
              <div className={styles.detailStatsCardSub}>
                Average 1.5 units per order
              </div>
            </div>
          </div>

          {/* Price & Performance Row */}
          <div className={styles.detailPricePerfRow}>
            {/* Pricing Card */}
            <div className={styles.detailPriceCard}>
              <h4 className={styles.detailSectionTitle}>Pricing Strategy</h4>
              <div className={styles.detailPriceGrid}>
                <div className={styles.detailPriceItem}>
                  <span className={styles.detailPriceLabel}>Sale Price</span>
                  <span className={styles.detailPriceValue}>
                    {selectedCampaignGroup?.salePrice?.toLocaleString('vi-VN') || stats?.salePrice?.toLocaleString('vi-VN') || 0}₫
                  </span>
                </div>
                <div className={styles.detailPriceItem}>
                  <span className={styles.detailPriceLabel}>Original Price</span>
                  <span className={styles.detailPriceOriginal}>
                    {selectedCampaignGroup?.originalPrice?.toLocaleString('vi-VN') || stats?.originalPrice?.toLocaleString('vi-VN') || 0}₫
                  </span>
                </div>
                <div className={styles.detailPriceItem}>
                  <span className={styles.detailPriceLabel}>Discount</span>
                  <span className={styles.detailPriceDiscount}>
                    {selectedCampaignGroup?.discountPercent || stats?.discountPercent || 0}% OFF
                  </span>
                </div>
                <div className={styles.detailPriceItem}>
                  <span className={styles.detailPriceLabel}>Avg. Savings</span>
                  <span className={styles.detailPriceSavings}>
                    {((selectedCampaignGroup?.originalPrice - selectedCampaignGroup?.salePrice) || (stats?.originalPrice - stats?.salePrice) || 0).toLocaleString('vi-VN')}₫
                  </span>
                </div>
              </div>
            </div>

            {/* Velocity Metrics Card */}
            <div className={styles.detailVelocityCard}>
              <h4 className={styles.detailSectionTitle}>Velocity Metrics</h4>
              <div className={styles.detailVelocityContent}>
                <div className={styles.detailVelocityHeader}>
                  <span className={styles.detailVelocityLabel}>Sell Rate</span>
                  <span className={styles.detailVelocityPercent}>{sellPercentage}%</span>
                </div>
                <div className={styles.detailVelocityProgress}>
                  <div 
                    className={styles.detailVelocityProgressFill}
                    style={{ width: `${sellPercentage}%` }}
                  />
                </div>
                <p className={styles.detailVelocityDesc}>
                  This campaign is performing in the <strong>top 1%</strong> of all flash sales this month.
                  {sellPercentage > 80 && ' Predicted sell-out soon.'}
                </p>
              </div>
            </div>
          </div>

          {/* Countdown Timer */}
          <CountdownTimer endTime={selectedCampaignGroup?.endAt || stats?.endAt} />

          {/* Variants Table */}
          {isCampaign && variants.length > 0 && (
            <div className={styles.detailVariantsSection}>
              <div className={styles.detailVariantsHeader}>
                <h4 className={styles.detailVariantsTitle}>Stock Keeping Units (SKU)</h4>
                <span className={styles.detailVariantsCount}>{variants.length} Variants Active</span>
              </div>
              <div className={styles.detailVariantsTable}>
                <table>
                  <thead>
                    <tr>
                      <th>Variant / SKU</th>
                      <th className={styles.detailTextRight}>Price</th>
                      <th className={styles.detailTextRight}>Sold</th>
                      <th className={styles.detailTextRight}>Stock</th>
                      <th className={styles.detailTextCenter}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {variants.map((variant, index) => {
                      const remaining = variant.totalQuantity - variant.soldQuantity;
                      return (
                        <tr key={variant._id || index} className={index % 2 === 1 ? styles.detailVariantRowAlt : ''}>
                          <td>
                            <div className={styles.detailVariantName}>
                              {variant.variantName || variant.variantSku || 'N/A'}
                            </div>
                            <div className={styles.detailVariantSku}>
                              SKU: {variant.variantSku || 'N/A'}
                            </div>
                          </td>
                          <td className={styles.detailVariantPrice}>
                            {variant.salePrice?.toLocaleString('vi-VN')}₫
                          </td>
                          <td className={styles.detailTextRight}>
                            <span className={styles.detailVariantSold}>
                              {variant.soldQuantity?.toLocaleString('vi-VN')}
                            </span>
                          </td>
                          <td className={styles.detailTextRight}>
                            {remaining <= 10 ? (
                              <span className={styles.detailStockLowBadge}>{remaining} LEFT</span>
                            ) : (
                              <span className={styles.detailVariantStock}>{remaining}</span>
                            )}
                          </td>
                          <td>
                            <div className={styles.detailVariantActions}>
                              <button 
                                className={styles.detailVariantActionBtn}
                                onClick={() => onEdit?.(variant)}
                                title="Edit"
                              >
                                <span className="material-symbols-outlined">edit</span>
                              </button>
                              <button 
                                className={`${styles.detailVariantActionBtn} ${styles.detailVariantActionBtnDanger}`}
                                onClick={() => onDelete?.(variant._id)}
                                title="Delete"
                              >
                                <span className="material-symbols-outlined">delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Single Stats View */}
          {!isCampaign && stats && (
            <div className={styles.detailSingleStats}>
              <div className={styles.detailSingleStatsGrid}>
                <div className={styles.detailSingleStatItem}>
                  <span className={styles.detailSingleStatLabel}>Sell Rate</span>
                  <span className={styles.detailSingleStatValue}>{stats.soldPercentage}%</span>
                </div>
                <div className={styles.detailSingleStatItem}>
                  <span className={styles.detailSingleStatLabel}>Remaining</span>
                  <span className={styles.detailSingleStatValue}>{stats.remainingQuantity}</span>
                </div>
                <div className={styles.detailSingleStatItem}>
                  <span className={styles.detailSingleStatLabel}>Est. Revenue</span>
                  <span className={styles.detailSingleStatValue}>
                    {(stats.soldQuantity * stats.salePrice).toLocaleString('vi-VN')}₫
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sticky Footer Actions */}
        <div className={styles.detailDrawerFooter}>
          <button className={styles.detailExportBtn}>
            <span className="material-symbols-outlined">download</span>
            <span>Export Report</span>
          </button>
          <div className={styles.detailFooterActions}>
            {/* Dynamic action buttons based on campaign status */}
            {isCampaign && (() => {
              const status = selectedCampaignGroup?.status;
              if (status === 'paused') {
                return (
                  <button className={styles.detailResumeBtn} onClick={() => onResume(selectedCampaignGroup, null)}>
                    <span className="material-symbols-outlined">play_arrow</span>
                    Resume Campaign
                  </button>
                );
              }
              if (status === 'expired' || status === 'cancelled') {
                return null; // No actions for ended campaigns
              }
              // active / pending
              return (
                <>
                  <button className={styles.detailStopBtn} onClick={() => onStop(selectedCampaignGroup, null)}>
                    <span className="material-symbols-outlined">stop</span>
                    Stop Campaign
                  </button>
                </>
              );
            })()}
          </div>
        </div>
      </Spin>
    </Drawer>
  );
};

CountdownTimer.propTypes = {
  endTime: PropTypes.oneOfType([PropTypes.string, PropTypes.object, PropTypes.number]),
};

CampaignDetailDrawer.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  selectedCampaign: PropTypes.object,
  selectedCampaignGroup: PropTypes.object,
  stats: PropTypes.object,
  statsLoading: PropTypes.bool,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onStop: PropTypes.func,
  onResume: PropTypes.func,
};

export default CampaignDetailDrawer;
