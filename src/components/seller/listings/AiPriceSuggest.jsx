import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';
import { aiService } from '../../../services/api/aiService';
import { formatCurrency } from '../../../utils/formatters';
import AiPriceDetailModal from './AiPriceDetailModal';
import PoCostBreakdown from './PoCostBreakdown';
import styles from './AiPriceSuggest.module.css';

const PANEL_WIDTH = 300;
const PANEL_GAP = 8;
const VIEW_MARGIN = 8;
const PANEL_Z = 1100;

/**
 * AiPriceSuggest — 🪄 AI price suggestion button + popover panel.
 *
 * Props:
 *  - product: { id, name, price } — the row's product object
 *  - onApply(suggestedPrice): callback when seller clicks "Apply"
 *  - modelId (optional): selected variant ID for variant-aware price suggestion [Phase 2 - 4.1]
 *  - disabled (optional): prevent interaction until required fields are filled
 *  - disabledTitle (optional): tooltip shown when disabled
 */
const AiPriceSuggest = ({ product, onApply, modelId, disabled = false, disabledTitle = '' }) => {
  const { user } = useSelector((state) => state.auth);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const [data, setData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [showDetail, setShowDetail] = useState(false);
  // [Phase 3 - 5.1] Pricing Personas: strategy selector state
  const [strategy, setStrategy] = useState('balanced');
  // [Multi-strategy Redis cache] Pre-cached strategies from first API call
  const [allStrategies, setAllStrategies] = useState(null);
  // [Multi-strategy Redis cache] Track which strategies are pre-cached
  const [preCachedStrats, setPreCachedStrats] = useState([]);

  const anchorRef = useRef(null);
  const panelRef = useRef(null);
  const [panelPos, setPanelPos] = useState({ top: 0, left: 0 });

  // Close panel on outside click (panel is portaled — check both roots)
  useEffect(() => {
    if (!open) {
return;
}
    const handler = (e) => {
      const inAnchor = anchorRef.current?.contains(e.target);
      const inPanel = panelRef.current?.contains(e.target);
      if (!inAnchor && !inPanel) {
setOpen(false);
}
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Fixed position under anchor; flip above if clipped (table card uses overflow:hidden)
  useLayoutEffect(() => {
    if (!open || !anchorRef.current) {
return;
}

    const updatePosition = () => {
      const ar = anchorRef.current.getBoundingClientRect();
      const pr = panelRef.current;
      let left = ar.right - PANEL_WIDTH;
      left = Math.min(
        Math.max(VIEW_MARGIN, left),
        window.innerWidth - PANEL_WIDTH - VIEW_MARGIN
      );
      let top = ar.bottom + PANEL_GAP;
      const h = pr?.offsetHeight ?? 380;
      if (top + h > window.innerHeight - VIEW_MARGIN) {
        top = ar.top - h - PANEL_GAP;
      }
      if (top < VIEW_MARGIN) {
top = VIEW_MARGIN;
}
      setPanelPos({ top, left });
    };

    updatePosition();
    const ro = new ResizeObserver(updatePosition);
    const rafId = requestAnimationFrame(() => {
      updatePosition();
      if (panelRef.current) {
ro.observe(panelRef.current);
}
    });
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [open, status, data, errorMsg]);

  const fetchSuggestion = async () => {
    setStatus('loading');
    setData(null);
    setErrorMsg('');
    try {
      const sellerId = user?._id || user?.id;
      // [Phase 2 - 4.1] Pass modelId for variant-aware price suggestion
      // [Phase 3 - 5.1] Pass strategy for Pricing Personas
      const res = await aiService.getPriceSuggestion({
        productId: product.id,
        productName: product.name,
        sellerId,
        modelId: modelId || product.modelId || null,
        strategy,
      });

      // axiosClient wraps response in res.data
      const payload = res.data ?? res;

      // [Phase 1 - 3.3] Rate limit response — show friendly message
      if (payload.rateLimit) {
        const limitMsg = payload.message || 'Đã đạt giới hạn sử dụng.';
        setErrorMsg(limitMsg);
        setStatus('error');
        return;
      }

      if (payload.success && payload.suggestedPrice) {
        setData(payload);
        // [Multi-strategy Redis cache] Store all strategies for instant switching
        if (payload.allStrategies) {
          setAllStrategies(payload.allStrategies);
          const cachedList = Object.keys(payload.allStrategies).filter(
            (s) => payload.allStrategies[s]?.suggestedPrice != null
          );
          setPreCachedStrats(cachedList);
        } else {
          // Single strategy only (cache miss or old backend) — wrap it
          setAllStrategies({ [strategy]: payload });
          setPreCachedStrats([strategy]);
        }
        setStatus('success');
      } else {
        setErrorMsg(payload.message || 'Không thể đề xuất giá cho sản phẩm này.');
        setStatus('error');
      }
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || err.message || 'Lỗi kết nối.');
      setStatus('error');
    }
  };

  const handleToggle = () => {
    if (!open) {
      setOpen(true);
      if (status === 'idle' || status === 'error') {
        fetchSuggestion();
      }
    } else {
      setOpen(false);
    }
  };

  const handleApply = () => {
    if (data?.suggestedPrice && onApply) {
      onApply(data.suggestedPrice);
    }
    setOpen(false);
  };

  const handleRetry = () => {
    setStatus('idle');
    fetchSuggestion();
  };

  const handleViewDetail = () => {
    setShowDetail(true);
    setOpen(false);
  };

  const handleDetailApply = (price) => {
    setShowDetail(false);
    if (price && onApply) {
      onApply(price);
    }
  };

  const handleDetailClose = () => {
    setShowDetail(false);
  };

  // [Multi-strategy Redis cache] Switch strategy INSTANTLY using pre-cached data (no API call)
  const handleStrategyChange = (newStrategy) => {
    setStrategy(newStrategy);
    if (allStrategies && allStrategies[newStrategy]) {
      setData(allStrategies[newStrategy]);
      // Already have this strategy — no loading needed
    }
  };

  // Price diff vs current
  const priceDiff = data?.suggestedPrice && product.price
    ? data.suggestedPrice - product.price
    : null;
  const diffPct = priceDiff && product.price
    ? ((priceDiff / product.price) * 100).toFixed(1)
    : null;

  const renderSuggestionExplanation = () => {
    const costData = data?.costData;
    const cur = product?.price != null ? Number(product.price) : null;

    if (costData?.hasCostData) {
      return (
        <div className={styles.poCostBreakdownWrap}>
          <PoCostBreakdown
            variant="panel"
            costData={costData}
            suggestedPrice={data?.suggestedPrice}
            currentPrice={cur}
            marketAvg={data?.marketData?.avg}
          />
        </div>
      );
    }

    if (!reasoning) {
      return (
        <div className={styles.reasoning}>
          <div className={styles.reasoningNoPo}>
            ⚠️ Chưa có thông tin phiếu nhập (Purchase Order) cho sản phẩm này. Không thể tính chính xác giá vốn landed.
          </div>
        </div>
      );
    }

    return (
      <div className={styles.reasoning}>
        {reasoning}
        <div className={styles.reasoningNoPo}>
          ⚠️ Chưa có thông tin phiếu nhập (Purchase Order) cho sản phẩm này. Không thể tính chính xác giá vốn landed.
        </div>
      </div>
    );
  };

  const panelEl = open && (
    <div
      ref={panelRef}
      className={styles.panel}
      role="dialog"
      aria-label="Gợi ý giá tham khảo"
      style={{
        position: 'fixed',
        top: panelPos.top,
        left: panelPos.left,
        zIndex: PANEL_Z,
      }}
    >
      {/* Header */}
      <div className={styles.panelHeader}>
        <span className={styles.panelTitle}>
          ✨ Gợi ý giá tham khảo
        </span>
        <button className={styles.closeBtn} onClick={() => setOpen(false)} aria-label="Đóng">
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 1l12 12M13 1L1 13" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* [Phase 3 - 5.1] Strategy selector — instant switch via pre-cached data */}
      <div className={styles.strategySelector}>
        <select
          value={strategy}
          onChange={(e) => handleStrategyChange(e.target.value)}
          className={styles.strategySelect}
          title="Chọn chiến lược định giá"
        >
          <option value="balanced">⚖️ Cân bằng</option>
          <option value="penetration">📉 Xâm nhập</option>
          <option value="profit">📈 Tối đa lợi nhuận</option>
          <option value="clearance">🏷️ Xả kho</option>
        </select>
        {preCachedStrats.length > 1 && (
          <span className={styles.cachedBadge} title={`${preCachedStrats.length}/4 chiến lược đã lưu`}>
            ⚡ {preCachedStrats.length}/4
          </span>
        )}
      </div>

      {/* Body */}
      <div className={styles.panelBody}>

        {/* ─ Loading skeleton ─ */}
        {status === 'loading' && (
          <div className={styles.skeleton}>
            <div className={styles.skeletonLine} style={{ width: '100%', height: 14 }} />
            <div className={styles.skeletonLine} style={{ width: '80%', height: 14 }} />
            <div className={styles.skeletonLine} style={{ width: '60%', height: 40 }} />
            <div className={styles.skeletonLine} style={{ width: '100%', height: 12 }} />
            <div className={styles.skeletonLine} style={{ width: '75%', height: 12 }} />
            <div className={styles.skeletonLine} style={{ width: '100%', height: 36 }} />
          </div>
        )}

        {/* ─ Error ─ */}
        {status === 'error' && (
          <>
            <div className={styles.errorBox}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0, marginTop: 1 }}>
                <path d="M12 2a10 10 0 100 20A10 10 0 0012 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
              </svg>
              <span>{errorMsg}</span>
            </div>
            <button className={styles.applyBtn} style={{ marginTop: 10, background: '#64748b' }} onClick={handleRetry}>
              Thử lại
            </button>
          </>
        )}

        {/* ─ Success ─ */}
        {status === 'success' && data && (
          <>
            {/* Product name + competitor count + cache badge */}
            <div className={styles.metaRow}>
              <span className={styles.productName} title={product.name || data.product?.name}>
                {/* Prefer form / row name — API used to return a different DB product for draft listings */}
                {product.name || data.product?.name}
              </span>
              <span className={styles.competitorCount}>
                {data.marketData?.count ?? 0} đối thủ
              </span>
            </div>

            {/* [Phase 2 - 4.2] Cache indicator */}
            {data.fromCache && (
              <div className={styles.cacheBadge}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
                </svg>
                Từ cache
              </div>
            )}

            {/* Market data grid */}
            <div className={styles.marketGrid}>
              <div className={styles.marketCell}>
                <div className={styles.marketLabel}>Thấp nhất</div>
                <div className={styles.marketValue}>
                  {formatCurrency(data.marketData?.min)}
                </div>
              </div>
              <div className={styles.marketCell}>
                <div className={styles.marketLabel}>Trung bình</div>
                <div className={`${styles.marketValue} ${styles.marketValueAvg}`}>
                  {formatCurrency(data.marketData?.avg)}
                </div>
              </div>
              <div className={styles.marketCell}>
                <div className={styles.marketLabel}>Cao nhất</div>
                <div className={styles.marketValue}>
                  {formatCurrency(data.marketData?.max)}
                </div>
              </div>
            </div>

            {/* Top competitor note */}
            {data.marketData?.topSeller && (
              <div className={styles.topSellerNote}>
                <span>🏆</span>
                <span>
                  <strong>{data.marketData.topSeller.name}</strong> —{' '}
                  {data.marketData.topSeller.sold?.toLocaleString('vi-VN')} đã bán,{' '}
                  {formatCurrency(data.marketData.topSeller.price)}
                </span>
              </div>
            )}

            {/* AI suggested price card */}
            <div className={styles.suggestCard}>
              <div className={styles.suggestLabel}>Mức giá tham khảo</div>
              <div className={styles.suggestPrice}>
                {formatCurrency(data.suggestedPrice)}
              </div>
              {priceDiff !== null && (
                <div className={styles.suggestDiff}>
                  {priceDiff >= 0 ? '↑' : '↓'} {Math.abs(priceDiff).toLocaleString('vi-VN')}₫{' '}
                  ({priceDiff >= 0 ? '+' : ''}{diffPct}%) so với giá hiện tại
                </div>
              )}
            </div>

            {/* Lý giải: list phí PO + giải thích giá đề xuất (từ costData) */}
            {renderSuggestionExplanation()}

            {/* ─ [Phase 1] Risk / Warning banners ─ */}
            {data.riskLevel === 'high' && data.warningMessage && (
              <div className={styles.warningHigh}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
                  <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
                </svg>
                <span>{data.warningMessage}</span>
              </div>
            )}
            {data.riskLevel === 'moderate' && data.warningMessage && (
              <div className={styles.warningModerate}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                </svg>
                <span>{data.warningMessage}</span>
              </div>
            )}
            {data.riskLevel === 'safe' && data.warning === 'floor_price' && (
              <div className={styles.warningSafe}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                <span>{data.reasoning}</span>
              </div>
            )}

            {/* Action buttons */}
            <div className={styles.actionRow}>
              {/* View detail */}
              <button className={styles.detailBtn} onClick={handleViewDetail} title="Xem chi tiết so sánh đối thủ">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                  <path d="M11 8v6M8 11h6" />
                </svg>
                Xem chi tiết
              </button>

              {/* Apply button */}
              <button className={styles.applyBtn} onClick={handleApply}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Áp dụng
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className={styles.panelAnchor} ref={anchorRef}>
      {/* ── Trigger button ── */}
      <button
        className={styles.aiBtn}
        onClick={handleToggle}
        disabled={disabled || status === 'loading'}
        data-gated={disabled ? 'true' : undefined}
        title={disabled ? disabledTitle : 'Gợi ý giá bán (tham khảo thị trường)'}
        aria-label="Gợi ý giá tham khảo cho sản phẩm"
      >
        {status === 'loading' ? (
          <svg
            className={styles.spinning}
            width="11" height="11" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2.5"
          >
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
        ) : (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61z" />
          </svg>
        )}
        {status === 'loading' ? '...' : 'Tham khảo giá'}
      </button>

      {typeof document !== 'undefined' && panelEl
        ? createPortal(panelEl, document.body)
        : null}

      {/* ── Detail modal (portal) ── */}
      {typeof document !== 'undefined' && (
        createPortal(
          <AiPriceDetailModal
            show={showDetail}
            data={data}
            product={product}
            onApply={handleDetailApply}
            onClose={handleDetailClose}
          />,
          document.body
        )
      )}
    </div>
  );
};

AiPriceSuggest.propTypes = {
  product: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    modelId: PropTypes.string,
    price: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  }),
  onApply: PropTypes.func.isRequired,
  modelId: PropTypes.string,
  disabled: PropTypes.bool,
  disabledTitle: PropTypes.string,
};

export default AiPriceSuggest;
