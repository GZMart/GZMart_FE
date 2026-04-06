import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';
import { formatCurrency } from '../../../utils/formatters';
import PoCostBreakdown from './PoCostBreakdown';
import styles from '@assets/styles/seller/AiPriceDetailModal.module.css';

const SORT_FIELDS = [
  { key: 'name',       label: 'Tên sản phẩm',   numeric: false },
  { key: 'price',      label: 'Giá bán',         numeric: true  },
  { key: 'rating',     label: 'Rating',           numeric: true  },
  { key: 'sold',       label: 'Đã bán',           numeric: true  },
  { key: 'score',      label: 'Độ tương đồng',   numeric: true  },
];

/**
 * AiPriceDetailModal — Full-screen modal showing AI price analysis
 * with a complete competitor comparison table.
 *
 * Props:
 *  - show: boolean — controls visibility
 *  - onClose: () => void
 *  - data: the AI price suggestion payload (same object as AiPriceSuggest)
 *  - product: the product row object { id, name, price }
 *  - onApply(suggestedPrice): callback when seller clicks "Áp dụng"
 */
const AiPriceDetailModal = ({ show, onClose, data, product, onApply }) => {
  const [sortField, setSortField] = useState('score');
  const [sortDir, setSortDir]     = useState('desc');

  // Lock body scroll when modal is open
  useEffect(() => {
    if (show) {
      document.body.classList.add('drawer-open');
    } else {
      document.body.classList.remove('drawer-open');
    }
    return () => document.body.classList.remove('drawer-open');
  }, [show]);

  // Close on Escape
  useEffect(() => {
    if (!show) {
return;
}
    const handler = (e) => {
      if (e.key === 'Escape') {
onClose();
}
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [show, onClose]);

  // ── Sort handler ────────────────────────────────────────────────
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  if (!show) {
return null;
}

  const currentPrice = product?.price ?? data?.product?.currentPrice ?? 0;
  const priceDiff = data?.suggestedPrice != null
    ? data.suggestedPrice - currentPrice
    : null;
  const diffPct = priceDiff != null && currentPrice > 0
    ? ((priceDiff / currentPrice) * 100).toFixed(1)
    : null;

  const competitors = data?.competitors ?? [];

  // Sort competitors by active sort field / direction
  const sortedCompetitors = [...competitors].sort((a, b) => {
    const aVal = a[sortField] ?? 0;
    const bVal = b[sortField] ?? 0;
    const cmp = sortField === 'name'
      ? String(aVal).localeCompare(String(bVal))
      : aVal - bVal;
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const isYourPriceLowest = data?.marketData?.min === currentPrice;
  const isYourPriceHighest = data?.marketData?.max === currentPrice;

  const handleApply = () => {
    if (data?.suggestedPrice && onApply) {
      onApply(data.suggestedPrice);
    }
    onClose();
  };

  const renderStars = (rating) => {
    const r = Math.round(rating ?? 0);
    return (
      <span className={styles.stars} title={`${rating?.toFixed(1) ?? 'N/A'} sao`}>
        {'★'.repeat(r)}{'☆'.repeat(5 - r)}
      </span>
    );
  };

  const getSimilarityBadge = (score) => {
    if (score == null) {
return null;
}
    const pct = Math.round(score * 100);
    const label = `${pct}%`;
    let cls = styles.simBadgeMedium;
    if (pct >= 90) {
cls = styles.simBadgeHigh;
} else if (pct >= 80) {
cls = styles.simBadgeMedium;
} else {
cls = styles.simBadgeLow;
}
    return <span className={`${styles.simBadge} ${cls}`}>{label}</span>;
  };

  // ── Lý giải: có PO → list phí + giải thích từ costData; không có PO → cảnh báo + text AI ──
  const renderSuggestionExplanation = () => {
    const costData = data?.costData;
    const reasoning = data?.reasoning;

    if (costData?.hasCostData) {
      return (
        <div className={styles.reasoningBox}>
          <PoCostBreakdown
            variant="modal"
            costData={costData}
            suggestedPrice={data?.suggestedPrice}
            currentPrice={currentPrice}
            marketAvg={data?.marketData?.avg}
          />
        </div>
      );
    }

    return (
      <div className={styles.reasoningBox}>
        <div className={styles.reasoningLabel}>Lý giải gợi ý</div>
        {reasoning ? (
          <div className={styles.reasoningText}>{reasoning}</div>
        ) : (
          <div className={styles.reasoningNoPo}>
            ⚠️ Chưa có thông tin phiếu nhập (Purchase Order) cho sản phẩm này. Không thể tính chính xác giá vốn landed.
          </div>
        )}
      </div>
    );
  };

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className={styles.backdrop}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal panel */}
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label="Chi tiết phân tích giá tham khảo"
      >
        {/* ── Header ── */}
        <div className={styles.modalHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61z" />
              </svg>
            </div>
            <div>
              <h2 className={styles.modalTitle}>Chi tiết phân tích giá tham khảo</h2>
              <p className={styles.modalSubtitle} title={data?.product?.name || product?.name}>
                {data?.product?.name || product?.name || '—'}
              </p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Đóng">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* ── Body ── */}
        <div className={styles.modalBody}>

          {/* Row 1: Market stats + Your price comparison */}
          <div className={styles.statsRow}>
            {/* Market overview */}
            <div className={styles.statsCard}>
              <div className={styles.statsCardHeader}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 13h2v8H3v-8zm6-6h2v14H9V7zm6 3h2v11h-2V10zm6-7h2v18h-2V3z" />
                </svg>
                Thị trường
                <span className={styles.competitorPill}>
                  {competitors.length} đối thủ
                </span>
              </div>
              <div className={styles.priceStats}>
                <div className={styles.priceStat}>
                  <span className={styles.priceStatLabel}>Thấp nhất</span>
                  <span className={styles.priceStatValue}>
                    {formatCurrency(data?.marketData?.min)}
                  </span>
                </div>
                <div className={`${styles.priceStat} ${styles.priceStatAvg}`}>
                  <span className={styles.priceStatLabel}>Trung bình</span>
                  <span className={styles.priceStatValue}>
                    {formatCurrency(data?.marketData?.avg)}
                  </span>
                </div>
                <div className={styles.priceStat}>
                  <span className={styles.priceStatLabel}>Cao nhất</span>
                  <span className={styles.priceStatValue}>
                    {formatCurrency(data?.marketData?.max)}
                  </span>
                </div>
              </div>
            </div>

            {/* Your price vs market */}
            <div className={styles.yourPriceCard}>
              <div className={styles.statsCardHeader}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z" />
                </svg>
                Giá hiện tại của bạn
              </div>
              <div className={styles.yourPriceValue}>
                {formatCurrency(currentPrice)}
              </div>
              {priceDiff != null && (
                <div className={`${styles.yourPriceNote} ${priceDiff >= 0 ? styles.noteUp : styles.noteDown}`}>
                  {priceDiff >= 0 ? '↑' : '↓'} {Math.abs(priceDiff).toLocaleString('vi-VN')}₫
                  {' '}({priceDiff >= 0 ? '+' : ''}{diffPct}%) so với mức giá tham khảo
                </div>
              )}
              {isYourPriceLowest && (
                <div className={`${styles.yourPriceNote} ${styles.noteNeutral}`}>
                  ✓ Bạn đang có giá thấp nhất thị trường
                </div>
              )}
              {isYourPriceHighest && (
                <div className={`${styles.yourPriceNote} ${styles.noteWarning}`}>
                  ⚠ Giá của bạn đang cao nhất thị trường
                </div>
              )}
            </div>
          </div>

          {/* [Phase 1] Risk banner */}
          {data?.riskLevel === 'high' && data?.warningMessage && (
            <div className={styles.riskBannerHigh}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
                <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
              </svg>
              <span>{data.warningMessage}</span>
            </div>
          )}
          {data?.riskLevel === 'moderate' && data?.warningMessage && (
            <div className={styles.riskBannerModerate}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
              </svg>
              <span>{data.warningMessage}</span>
            </div>
          )}

          {/* AI suggested price card */}
          <div className={styles.suggestCard}>
            <div className={styles.suggestLeft}>
              <div className={styles.suggestLabel}>Mức giá tham khảo</div>
              <div className={styles.suggestPrice}>
                {formatCurrency(data?.suggestedPrice)}
              </div>
              {priceDiff != null && (
                <div className={styles.suggestDiff}>
                  {priceDiff >= 0 ? '↑' : '↓'} {Math.abs(priceDiff).toLocaleString('vi-VN')}₫
                  {' '}({priceDiff >= 0 ? '+' : ''}{diffPct}%)
                  {' '}so với giá hiện tại
                </div>
              )}
            </div>
            <div className={styles.suggestRight}>
              {renderSuggestionExplanation()}
            </div>
          </div>

          {/* Competitor table */}
          <div className={styles.tableSection}>
            <div className={styles.tableSectionHeader}>
              <span>Bảng so sánh đối thủ</span>
              <span className={styles.tableCount}>{sortedCompetitors.length} sản phẩm</span>
            </div>
            {sortedCompetitors.length > 0 ? (
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th className={styles.thRank}>#</th>
                      {SORT_FIELDS.map(f => (
                        <th
                          key={f.key}
                          className={`${styles.thSortable} ${f.key === 'name' ? styles.thName : f.key === 'price' ? styles.thPrice : f.key === 'rating' ? styles.thRating : f.key === 'sold' ? styles.thSold : styles.thSim} ${sortField === f.key ? styles.thActive : ''}`}
                          onClick={() => handleSort(f.key)}
                        >
                          {f.label}
                          {sortField === f.key ? (
                            <span className={styles.sortIcon}>
                              {sortDir === 'asc' ? ' ↑' : ' ↓'}
                            </span>
                          ) : (
                            <span className={styles.sortIconMuted}> ⇅</span>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedCompetitors.map((comp, idx) => {
                      const diffFromAi = data?.suggestedPrice != null
                        ? comp.price - data.suggestedPrice
                        : null;
                          const isAboveAi = diffFromAi != null && diffFromAi > 0;
                      const isBelowAi = diffFromAi != null && diffFromAi < 0;
                      const isTopSeller = sortedCompetitors[0]?.id === comp.id;

                      return (
                        <tr
                          key={comp.id || idx}
                          className={`${styles.tr} ${isTopSeller ? styles.trTop : ''} ${isAboveAi ? styles.trAbove : isBelowAi ? styles.trBelow : ''}`}
                        >
                          <td className={styles.tdRank}>
                            {idx === 0 ? (
                              <span className={styles.rankBadge}>🥇</span>
                            ) : idx === 1 ? (
                              <span className={styles.rankBadge}>🥈</span>
                            ) : idx === 2 ? (
                              <span className={styles.rankBadge}>🥉</span>
                            ) : (
                              <span className={styles.rankNum}>{idx + 1}</span>
                            )}
                          </td>
                          <td className={styles.tdName}>
                            <div className={styles.compName}>{comp.name}</div>
                            {isTopSeller && (
                              <span className={styles.topSellerTag}>🏆 Bán chạy nhất</span>
                            )}
                          </td>
                          <td className={styles.tdPrice}>
                            <div className={styles.priceMain}>{formatCurrency(comp.price)}</div>
                            {diffFromAi != null && (isAboveAi || isBelowAi) && (
                              <div className={`${styles.priceHint} ${isAboveAi ? styles.hintAbove : styles.hintBelow}`}>
                                <span className={styles.priceHintLabel}>So với giá tham khảo</span>
                                <span className={styles.priceHintValue}>
                                  {isAboveAi ? '+' : '-'}
                                  {Math.abs(diffFromAi).toLocaleString('vi-VN')}₫
                                </span>
                              </div>
                            )}
                          </td>
                          <td className={styles.tdRating}>
                            {renderStars(comp.rating)}
                            <span className={styles.ratingNum}>{comp.rating?.toFixed(1)}</span>
                          </td>
                          <td className={styles.tdSold}>
                            {(comp.sold ?? 0).toLocaleString('vi-VN')}
                          </td>
                          <td className={styles.tdSim}>
                            {getSimilarityBadge(comp.score)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className={styles.emptyTable}>
                Không có dữ liệu đối thủ để hiển thị.
              </div>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className={styles.modalFooter}>
          <button className={styles.cancelBtn} onClick={onClose}>
            Đóng
          </button>
          <button className={styles.applyBtn} onClick={handleApply}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Áp dụng giá này
          </button>
        </div>
      </div>
    </>,
    document.body
  );
};

AiPriceDetailModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  product: PropTypes.shape({
    name: PropTypes.string,
    price: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  }),
  data: PropTypes.shape({
    product: PropTypes.shape({
      name: PropTypes.string,
      currentPrice: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    }),
    suggestedPrice: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    competitors: PropTypes.array,
    marketData: PropTypes.shape({
      min: PropTypes.number,
      max: PropTypes.number,
      avg: PropTypes.number,
    }),
    riskLevel: PropTypes.string,
    warningMessage: PropTypes.string,
    reasoning: PropTypes.string,
    // [Hướng 2] Chi phí nhập hàng từ Purchase Order
    costData: PropTypes.shape({
      hasCostData: PropTypes.bool,
      landedCostPerUnit: PropTypes.number,
      breakdown: PropTypes.shape({
        productCostCny: PropTypes.number,
        productCostVnd: PropTypes.number,
        exchangeRate: PropTypes.number,
        buyingServiceFeeRate: PropTypes.number,
        buyingServiceFeeVnd: PropTypes.number,
        shippingCostPerUnit: PropTypes.number,
        chargeableWeightKg: PropTypes.number,
        shippingRatePerKg: PropTypes.number,
        taxPerUnit: PropTypes.number,
        fixedCosts: PropTypes.shape({
          perUnit: PropTypes.number,
          note: PropTypes.string,
        }),
      }),
    }),
  }),
  onApply: PropTypes.func.isRequired,
};

export default AiPriceDetailModal;
