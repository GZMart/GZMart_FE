import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';
import { aiService } from '../../../services/api/aiService';
import { formatCurrency } from '../../../utils/formatters';
import styles from './AiPriceSuggestModal.module.css';

/**
 * AiPriceSuggestModal — Full-screen modal for AI price suggestion across ALL variants.
 *
 * UX flow:
 *  1. Open modal → loading state (fetch batch suggestions)
 *  2. Show variant list with: current price, AI suggested price, diff %, risk badge
 *  3. Seller selects rows (checkbox) → clicks "Apply selected"
 *  4. Calls onApply({ modelId, suggestedPrice }[]) for parent to batch-update
 *
 * Props:
 *  - show: boolean
 *  - product: { id, name, models[], tiers[] }  — full product data (with _raw)
 *  - onApply(changes: { modelId, suggestedPrice }[]): callback
 *  - onClose(): void
 *  - onViewDetail?: ({ detailResult, batchData }) => void — open competitor detail in parent (stays open when batch closes)
 */
const AiPriceSuggestModal = ({ show, product, onApply, onClose, onViewDetail }) => {
  const { user } = useSelector((state) => state.auth);
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const [data, setData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [selected, setSelected] = useState(new Set()); // set of modelId strings
  // [Phase 3 - 5.1] Strategy selector state
  const [strategy, setStrategy] = useState('balanced');

  // Lock body scroll when modal is open
  useEffect(() => {
    if (!show) return;
    document.body.classList.add('drawer-open');
    return () => document.body.classList.remove('drawer-open');
  }, [show]);

  // Close on Escape
  useEffect(() => {
    if (!show) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [show, onClose]);

  // Reset when modal reopens, or when strategy changes
  useEffect(() => {
    if (show) {
      setStatus('loading');
      setData(null);
      setErrorMsg('');
      setSelected(new Set());
      fetchBatch(strategy);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  // Re-fetch when strategy changes (user picks a different strategy after modal is open)
  useEffect(() => {
    if (!show || status === 'loading') return;
    setStatus('loading');
    setData(null);
    setSelected(new Set());
    fetchBatch(strategy);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strategy]);

  const fetchBatch = async (activeStrategy) => {
    try {
      const sellerId = user?._id || user?.id;
      const rawProduct = product?._raw || product;
      const modelIds = (rawProduct.models || []).map((m) => m._id?.toString()).filter(Boolean);

      if (!modelIds.length) {
        setErrorMsg('Sản phẩm này chưa có variant nào để đề xuất giá.');
        setStatus('error');
        return;
      }

      const res = await aiService.getPriceSuggestionBatch({
        productId: product.id,
        productName: product.name,
        sellerId,
        modelIds,
        strategy: activeStrategy,
      });

      const payload = res.data ?? res;

      if (payload.rateLimit) {
        setErrorMsg(payload.message || 'Đã đạt giới hạn sử dụng.');
        setStatus('error');
        return;
      }

      if (payload.success && payload.results?.length) {
        // Pre-select all by default
        const allIds = new Set(payload.results.map((r) => r.modelId));
        setSelected(allIds);
        setData(payload);
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

  // Build variant label from tierIndex
  const getVariantLabel = (tierIndex) => {
    const tiers = product?._raw?.tiers || product?.tiers || [];
    return (tierIndex || [])
      .map((idx, tierIdx) => {
        const tier = tiers[tierIdx];
        if (!tier) return `?`;
        const opt = tier.options?.[idx];
        return typeof opt === 'object' ? opt?.value : opt;
      })
      .join(' / ');
  };

  // Selection handlers
  const toggleRow = (modelId) => {
    const next = new Set(selected);
    next.has(modelId) ? next.delete(modelId) : next.add(modelId);
    setSelected(next);
  };

  const toggleAll = () => {
    if (!data?.results) return;
    const allIds = data.results.map((r) => r.modelId);
    if (selected.size === allIds.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(allIds));
    }
  };

  const handleApply = () => {
    if (!data?.results || !selected.size) return;
    const changes = data.results
      .filter((r) => selected.has(r.modelId))
      .map((r) => ({ modelId: r.modelId, suggestedPrice: r.suggestedPrice }));
    onApply(changes);
    onClose();
  };

  const handleViewDetail = (result) => {
    if (onViewDetail && data) {
      onViewDetail({ detailResult: result, batchData: data });
    }
  };

  // Price diff helpers
  const diffClass = (diff) => {
    if (diff > 0) return styles.diffUp;
    if (diff < 0) return styles.diffDown;
    return styles.diffNeutral;
  };

  const riskClass = (level) => {
    if (level === 'high') return `${styles.riskBadge} ${styles.riskHigh}`;
    if (level === 'moderate') return `${styles.riskBadge} ${styles.riskModerate}`;
    return `${styles.riskBadge} ${styles.riskSafe}`;
  };

  const riskLabel = (level) => {
    if (level === 'high') return 'Cao';
    if (level === 'moderate') return 'TB';
    return 'OK';
  };

  if (!show) return null;

  const results = data?.results || [];

  return createPortal(
    <>
      {/* Backdrop */}
      <div className={styles.backdrop} onClick={onClose} aria-hidden="true" />

      {/* Modal */}
      <div className={styles.modal} role="dialog" aria-modal="true" aria-label="AI Price Suggestion for All Variants">

        {/* ── Header ── */}
        <div className={styles.modalHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61z" />
              </svg>
            </div>
            <div className={styles.headerText}>
              <h2 className={styles.modalTitle}>AI đề xuất giá — Tất cả Variants</h2>
              <p className={styles.modalSubtitle} title={product?.name}>{product?.name}</p>
            </div>
          </div>

          {/* [Phase 3 - 5.1] Strategy selector */}
          <div className={styles.headerRight}>
            <select
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
              className={styles.strategySelect}
              title="Chọn chiến lược định giá"
            >
              <option value="balanced">⚖️ Cân bằng</option>
              <option value="penetration">📉 Xâm nhập</option>
              <option value="profit">📈 Tối đa lợi nhuận</option>
              <option value="clearance">🏷️ Xả kho</option>
            </select>
            <button className={styles.closeBtn} onClick={onClose} aria-label="Đóng">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className={styles.modalBody}>

          {/* ── Error state ── */}
          {status === 'error' && (
            <div className={styles.errorBox}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
              </svg>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ── Success state: market data summary ── */}
          {status === 'success' && data && (
            <div className={styles.statsRow}>
              <div className={styles.statsCard}>
                <div className={styles.statsCardHeader}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 13h2v8H3v-8zm6-6h2v14H9V7zm6 3h2v11h-2V10zm6-7h2v18h-2V3z" />
                  </svg>
                  Thị trường
                  <span className={styles.competitorPill}>{data.marketData?.count ?? 0} đối thủ</span>
                </div>
                <div className={styles.priceStats}>
                  <div className={styles.priceStat}>
                    <span className={styles.priceStatLabel}>Thấp</span>
                    <span className={styles.priceStatValue}>{formatCurrency(data.marketData?.min)}</span>
                  </div>
                  <div className={`${styles.priceStat} ${styles.priceStatAvg}`}>
                    <span className={styles.priceStatLabel}>TB</span>
                    <span className={styles.priceStatValue}>{formatCurrency(data.marketData?.avg)}</span>
                  </div>
                  <div className={styles.priceStat}>
                    <span className={styles.priceStatLabel}>Cao</span>
                    <span className={styles.priceStatValue}>{formatCurrency(data.marketData?.max)}</span>
                  </div>
                </div>
              </div>
              <div className={styles.yourPriceCard}>
                <div className={styles.statsCardHeader}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm.31 8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z" />
                  </svg>
                  Sản phẩm của bạn
                </div>
                <div className={styles.yourPriceValue}>{results.length} variants</div>
                {data.marketData?.topSeller && (
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                    🏆 Top seller: {data.marketData.topSeller.name}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Variant table ── */}
          <div className={styles.tableSection}>
            <div className={styles.tableSectionHeader}>
              <span>Variants — chọn dòng để áp dụng</span>
              <span className={styles.tableCount}>
                {results.length} variant{results.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.thCheck}>
                      <input
                        type="checkbox"
                        className={styles.checkbox}
                        checked={results.length > 0 && selected.size === results.length}
                        onChange={toggleAll}
                      />
                    </th>
                    <th className={styles.thVar}>Variant</th>
                    <th className={styles.thCurrent}>Giá hiện tại</th>
                    <th className={styles.thSuggested}>Giá AI đề xuất</th>
                    <th className={styles.thDiff}>Chênh lệch</th>
                    <th className={styles.thRisk}>Rủi ro</th>
                    <th className={styles.thAction}></th>
                  </tr>
                </thead>
                <tbody>
                  {/* ── Loading skeleton ── */}
                  {status === 'loading' && (
                    Array.from({ length: 4 }).map((_, i) => (
                      <tr key={`sk-${i}`} className={styles.skeletonRow}>
                        <td><div className={styles.skeletonCell} style={{ width: 15, height: 15 }} /></td>
                        <td><div className={styles.skeletonCell} style={{ width: '70%', height: 14 }} /></td>
                        <td><div className={styles.skeletonCell} style={{ width: '60%', height: 14, marginLeft: 'auto' }} /></td>
                        <td><div className={styles.skeletonCell} style={{ width: '70%', height: 14, marginLeft: 'auto' }} /></td>
                        <td><div className={styles.skeletonCell} style={{ width: '50%', height: 14, marginLeft: 'auto' }} /></td>
                        <td><div className={styles.skeletonCell} style={{ width: 36, height: 18, margin: '0 auto' }} /></td>
                        <td></td>
                      </tr>
                    ))
                  )}

                  {/* ── Error empty ── */}
                  {status === 'error' && !results.length && (
                    <tr>
                      <td colSpan={7}>
                        <div className={styles.emptyState}>{errorMsg || 'Không có dữ liệu.'}</div>
                      </td>
                    </tr>
                  )}

                  {/* ── Result rows ── */}
                  {status === 'success' && results.map((result) => {
                    const diff = result.suggestedPrice - result.currentPrice;
                    const diffPct = result.currentPrice > 0
                      ? ((diff / result.currentPrice) * 100).toFixed(1)
                      : '0.0';
                    const isSelected = selected.has(result.modelId);
                    const label = getVariantLabel(result.tierIndex);
                    const isTopSeller = data?.marketData?.topSeller;

                    return (
                      <>
                        <tr
                          key={result.modelId}
                          className={isSelected ? styles.rowSelected : ''}
                          onClick={() => toggleRow(result.modelId)}
                          style={{ cursor: 'pointer' }}
                        >
                          <td className={styles.checkCell}>
                            <input
                              type="checkbox"
                              className={styles.checkbox}
                              checked={isSelected}
                              onChange={() => toggleRow(result.modelId)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </td>
                          <td>
                            <div className={styles.varLabel}>{label || result.sku || result.modelId}</div>
                            {result.sku && (
                              <div className={styles.varSku}>{result.sku}</div>
                            )}
                          </td>
                          <td className={styles.priceCurrent}>
                            {formatCurrency(result.currentPrice)}
                          </td>
                          <td className={styles.priceSuggested}>
                            {formatCurrency(result.suggestedPrice)}
                          </td>
                          <td className={diffClass(diff)}>
                            {diff === 0 ? '—' : `${diff >= 0 ? '+' : ''}${diff.toLocaleString('vi-VN')}₫`}
                            {' '}
                            <span style={{ fontSize: 10, opacity: 0.8 }}>
                              ({diff >= 0 ? '+' : ''}{diffPct}%)
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span className={riskClass(result.riskLevel)}>
                              {riskLabel(result.riskLevel)}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              type="button"
                              className={styles.detailBtn}
                              onClick={(e) => { e.stopPropagation(); handleViewDetail(result); }}
                              title="Xem chi tiết so sánh đối thủ"
                            >
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8" />
                                <path d="M21 21l-4.35-4.35" />
                                <path d="M11 8v6M8 11h6" />
                              </svg>
                              Chi tiết
                            </button>
                          </td>
                        </tr>
                        {/* Warning row */}
                        {result.warningMessage && (
                          <tr key={`warn-${result.modelId}`} className={styles.warningRow}>
                            <td colSpan={7}>
                              <div className={styles.warningMsg}>
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
                                </svg>
                                {result.warningMessage}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className={styles.modalFooter}>
          <div className={styles.footerLeft}>
            <button className={styles.selectAllBtn} onClick={toggleAll}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points={selected.size === results.length && results.length ? "20 6 9 17 4 12" : "9 11l2 2 4-4"} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {selected.size === results.length && results.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
            </button>
            <span className={styles.selectedCount}>
              {selected.size > 0
                ? `${selected.size} variant${selected.size !== 1 ? 's' : ''} đã chọn`
                : 'Chưa chọn variant nào'}
            </span>
          </div>

          <div className={styles.footerRight}>
            <button className={styles.cancelBtn} onClick={onClose}>
              Đóng
            </button>
            <button
              className={styles.applyBtn}
              onClick={handleApply}
              disabled={!selected.size || status !== 'success'}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Áp dụng {selected.size > 0 ? selected.size : ''} variant{selected.size !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};

export default AiPriceSuggestModal;
