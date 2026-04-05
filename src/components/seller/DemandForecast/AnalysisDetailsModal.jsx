import React, { useState, useEffect } from 'react';
import {
  X,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Package,
  BarChart3,
  ShoppingCart,
  Zap,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import inventoryService from '../../../services/api/inventoryService';
import modalStyles from '../../../assets/styles/seller/SharedModal.module.css';
import styles from '../../../assets/styles/seller/AnalysisDetailsModal.module.css';

// ─── Tiny SVG Line Chart ─────────────────────────────────────────────────────────
const VelocityChart = ({ data, trendDays }) => {
  if (!data || data.length === 0) {
    return (
      <div className={styles.chartEmpty}>
        <BarChart3 size={24} color="#94a3b8" />
        <p>No daily sales data available</p>
      </div>
    );
  }

  const W = 560;
  const H = 160;
  const PAD = { top: 12, right: 12, bottom: 28, left: 36 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const maxQty = Math.max(...data.map((d) => d.quantity), 1);
  const xs = data.map((_, i) => (i / (data.length - 1)) * plotW + PAD.left);
  const ys = data.map((d) => PAD.top + plotH - (d.quantity / maxQty) * plotH);

  const areaPath =
    `M ${xs[0]} ${PAD.top + plotH}` +
    xs.map((x, i) => ` L ${x} ${ys[i]}`).join('') +
    ` L ${xs[xs.length - 1]} ${PAD.top + plotH} Z`;

  const linePath =
    'M ' + xs[0] + ' ' + ys[0] + xs.map((x, i) => ` L ${x} ${ys[i]}`).join('');

  const first = data[0]?.quantity || 0;
  const last = data[data.length - 1]?.quantity || 0;
  const trendUp = last >= first;

  const labelIndices = [0, Math.floor(data.length / 2), data.length - 1];
  const labels = labelIndices.map((i) => {
    const d = data[i];
    if (!d) return '';
    const parts = d.date.split('-');
    return `${parts[1]}/${parts[2]}`;
  });
  const labelXs = labelIndices.map((i) => xs[i]);

  const tickCount = 4;
  const yTicks = Array.from({ length: tickCount }, (_, i) => {
    const val = Math.round((maxQty / (tickCount - 1)) * i);
    const y = PAD.top + plotH - (val / maxQty) * plotH;
    return { val, y };
  });

  return (
    <div className={styles.chartWrap}>
      <svg viewBox={`0 0 ${W} ${H}`} className={styles.chartSvg} preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {yTicks.map((t, i) => (
          <line
            key={`grid-y-${i}`}
            x1={PAD.left}
            y1={t.y}
            x2={PAD.left + plotW}
            y2={t.y}
            stroke="#f1f5f9"
            strokeWidth={1}
          />
        ))}

        <path d={areaPath} fill="url(#chartFill)" />

        <path
          d={linePath}
          fill="none"
          stroke="#3b82f6"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {data
          .filter((_, i) => i % Math.max(1, Math.floor(data.length / 20)) === 0)
          .map((d, _i, _arr) => {
            const origIdx = data.indexOf(d);
            const x = xs[origIdx];
            const y = ys[origIdx];
            if (d.quantity === 0) return null;
            return (
              <circle
                key={`point-${origIdx}`}
                cx={x}
                cy={y}
                r={2.5}
                fill="#3b82f6"
                stroke="#fff"
                strokeWidth={1.5}
              />
            );
          })}

        {yTicks.map((t, i) => (
          <text
            key={`y-label-${i}`}
            x={PAD.left - 5}
            y={t.y + 4}
            textAnchor="end"
            fontSize={10}
            fill="#94a3b8"
            fontFamily="inherit"
          >
            {t.val}
          </text>
        ))}

        {labels.map((label, i) => (
          <text
            key={`x-label-${i}`}
            x={labelXs[i]}
            y={H - 6}
            textAnchor="middle"
            fontSize={10}
            fill="#94a3b8"
            fontFamily="inherit"
          >
            {label}
          </text>
        ))}
      </svg>

      <div className={styles.chartFooter}>
        <span className={trendUp ? styles.chartTrendUp : styles.chartTrendDown}>
          {trendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {trendUp ? 'Uptrend' : 'Downtrend'} over {trendDays} days
        </span>
        <span className={styles.chartAxisLabel}>Daily units sold</span>
      </div>
    </div>
  );
};

// ─── Analysis Details Modal ──────────────────────────────────────────────────────
const AnalysisDetailsModal = ({ item, trendDays, onClose }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    inventoryService
      .getProductDemandDetails(item.productId, { days: trendDays })
      .then((res) => {
        if (!cancelled) setDetails(res.data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.response?.data?.error || err.message || 'Failed to load details');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [item.productId, trendDays]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const handleCreatePO = () => {
    const qty = details?.suggestedQty || 0;
    window.open(
      `/seller/erp/purchase-orders?add=${encodeURIComponent(
        JSON.stringify({ productId: item.productId, name: item.name, qty })
      )}`,
      '_blank'
    );
    onClose();
  };

  const fmtCurrency = (v) =>
    v > 0
      ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(v)
      : '—';

  const fmtNumber = (v) =>
    v != null ? v.toLocaleString('vi-VN') : '—';

  return (
    <>
      <div className={modalStyles.modalOverlay} onClick={onClose} />
      <div
        className={`${modalStyles.modal} ${styles.analysisModal}`}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className={modalStyles.modalHeader}>
          <div className={styles.analysisModalTitle}>
            {item.image && (
              <img src={item.image} alt={item.name} className={styles.analysisThumb} />
            )}
            {!item.image && (
              <div className={styles.analysisThumbPlaceholder}>
                <Package size={20} color="#d1d5db" />
              </div>
            )}
            <div>
              <p className={modalStyles.modalTitle}>{item.name}</p>
              <p className={modalStyles.modalSub}>
                Demand Analysis Report &middot; {trendDays === 7 ? '7-day' : '30-day'} period
              </p>
            </div>
          </div>
          <button className={modalStyles.modalClose} onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className={`${modalStyles.modalBody} ${styles.analysisModalBody}`}>
          {loading && (
            <div className={styles.analysisLoading}>
              <RefreshCw size={28} className={modalStyles.spin} style={{ color: '#94a3b8' }} />
              <p>Gathering internal &amp; market data&hellip;</p>
            </div>
          )}

          {error && (
            <div className={styles.analysisError}>
              <AlertTriangle size={24} color="#dc2626" />
              <p>{error}</p>
            </div>
          )}

          {details && (
            <div className={styles.analysisContent}>

              {/* ── Section A: Internal Shop Performance ───────────────────── */}
              <section className={styles.analysisSection}>
                <div className={styles.analysisSectionHeader}>
                  <span className={styles.analysisSectionIcon}><BarChart3 size={14} /></span>
                  <h3 className={styles.analysisSectionTitle}>Internal Performance</h3>
                </div>

                {/* Sales Velocity Chart */}
                <div className={styles.analysisCard}>
                  <p className={styles.analysisCardLabel}>Sales Velocity (daily units sold)</p>
                  <VelocityChart data={details.salesVelocity} trendDays={trendDays} />
                </div>

                {/* Inventory KPIs */}
                <div className={styles.analysisKpiRow}>
                  <div className={styles.analysisKpi}>
                    <span className={styles.analysisKpiLabel}>Current Stock</span>
                    <span className={styles.analysisKpiValue}>
                      {fmtNumber(details.totalStock)} <span className={styles.analysisKpiUnit}>units</span>
                    </span>
                  </div>
                  <div className={styles.analysisKpi}>
                    <span className={styles.analysisKpiLabel}>Avg / Day</span>
                    <span className={styles.analysisKpiValue}>
                      {fmtNumber(details.avgDailyQty)} <span className={styles.analysisKpiUnit}>/ day</span>
                    </span>
                  </div>
                  <div className={styles.analysisKpi}>
                    <span className={styles.analysisKpiLabel}>Lead Time</span>
                    <span className={styles.analysisKpiValue}>
                      {details.leadTimeDays != null ? (
                        <>{details.leadTimeDays} <span className={styles.analysisKpiUnit}>days</span></>
                      ) : (
                        <span className={styles.analysisKpiNoData}>No data</span>
                      )}
                    </span>
                  </div>
                  <div className={styles.analysisKpi}>
                    <span className={styles.analysisKpiLabel}>Total Sold</span>
                    <span className={styles.analysisKpiValue}>
                      {fmtNumber(details.totalSold)} <span className={styles.analysisKpiUnit}>units</span>
                    </span>
                  </div>
                </div>

                {/* Stockout warning */}
                {details.daysUntilStockout != null && (
                  <div
                    className={`${styles.analysisAlert} ${
                      details.daysUntilStockout <= 7
                        ? styles.analysisAlertDanger
                        : details.daysUntilStockout <= 14
                        ? styles.analysisAlertWarn
                        : styles.analysisAlertInfo
                    }`}
                  >
                    <AlertTriangle size={14} />
                    <span>
                      {details.daysUntilStockout <= 7
                        ? 'At the current sales pace, you will run out of stock in '
                        : details.daysUntilStockout <= 14
                        ? 'Expected stockout in approximately '
                        : 'Current stock covers about '}
                      <strong>
                        {details.daysUntilStockout} days
                      </strong>
                      {details.daysUntilStockout <= 7 && !details.leadTimeDays
                        ? ' — order now!'
                        : details.leadTimeDays && details.daysUntilStockout <= details.leadTimeDays
                        ? ` (Lead time: ${details.leadTimeDays} days — place order immediately)`
                        : '.'}
                    </span>
                  </div>
                )}
              </section>

              {/* ── Section B: External Market Proof ───────────────────────── */}
              <section className={styles.analysisSection}>
                <div className={styles.analysisSectionHeader}>
                  <span className={styles.analysisSectionIcon}><Zap size={14} /></span>
                  <h3 className={styles.analysisSectionTitle}>Market Proof</h3>
                </div>

                {/* Web trend score */}
                <div className={styles.analysisCard}>
                  <p className={styles.analysisCardLabel}>Market Interest Level</p>
                  {details.webTrends?.hasData ? (
                    <div className={styles.webScoreWrap}>
                      <div className={styles.webScoreBar}>
                        <div
                          className={styles.webScoreFill}
                          style={{
                            width: `${details.webTrends.globalTrendScore}%`,
                            background:
                              details.webTrends.globalTrendScore >= 70
                                ? '#16a34a'
                                : details.webTrends.globalTrendScore >= 40
                                ? '#d97706'
                                : '#94a3b8',
                          }}
                        />
                      </div>
                      <span className={styles.webScoreNum}>
                        {details.webTrends.globalTrendScore}/100
                      </span>
                    </div>
                  ) : (
                    <div className={styles.marketNoDataWrap}>
                      <p className={styles.analysisNoData}>
                        No external market data available for this product yet.
                      </p>
                      <p className={styles.marketNoDataHint}>
                        Market data is sourced from Shopee &amp; Tiki. Data appears when matching
                        products are found on those platforms.
                      </p>
                    </div>
                  )}
                </div>

                {/* Trend sources */}
                {details.webTrends?.hasData && details.webTrends.trendSources?.length > 0 && (
                  <div className={styles.analysisCard}>
                    <p className={styles.analysisCardLabel}>
                      Data Sources ({trendDays === 7 ? '7-day' : '30-day'} period)
                    </p>
                    <div className={styles.sourcesList}>
                      {details.webTrends.trendSources.map((src, i) => (
                        <div key={i} className={styles.sourceItem}>
                          <span className={styles.sourcePlatform}>{src.platform}</span>
                          <div className={styles.sourceStats}>
                            {src.sold != null && (
                              <span className={styles.sourceStat}>
                                <Package size={11} />
                                {fmtNumber(src.sold)} sold
                              </span>
                            )}
                            {src.rating != null && (
                              <span className={styles.sourceStat}>
                                <span className={styles.sourceRating}>
                                  &#9733; {src.rating.toFixed(1)}
                                </span>
                              </span>
                            )}
                            {src.review_count != null && (
                              <span className={styles.sourceStat}>
                                {fmtNumber(src.review_count)} reviews
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              {/* ── Section C: Analysis & Recommendation ─────────────────── */}
              <section className={styles.analysisSection}>
                <div className={styles.analysisSectionHeader}>
                  <span className={styles.analysisSectionIcon}><CheckCircle2 size={14} /></span>
                  <h3 className={styles.analysisSectionTitle}>Analysis &amp; Recommendation</h3>
                </div>

                <div className={styles.analysisCard}>
                  <p className={styles.analysisCardLabel}>Summary</p>
                  <div className={styles.aiInsight}>
                    {details.aiInsight.split('\n').map((line, i) => {
                      if (!line.trim()) return <br key={i} />;
                      const bold = line.startsWith('**') && line.endsWith('**');
                      const isBullet = line.startsWith('- ');
                      if (bold) {
                        return (
                          <p key={i} className={styles.aiInsightBold}>
                            {line.replace(/\*\*/g, '')}
                          </p>
                        );
                      }
                      if (isBullet) {
                        return (
                          <p key={i} className={styles.aiInsightBullet}>
                            {line}
                          </p>
                        );
                      }
                      return (
                        <p key={i} className={styles.aiInsightLine}>
                          {line}
                        </p>
                      );
                    })}
                  </div>
                </div>

                {/* Strategy KPIs */}
                <div className={styles.analysisKpiRow}>
                  <div className={`${styles.analysisKpi} ${details.suggestedQty > 0 ? styles.analysisKpiPrimary : ''}`}>
                    <span className={styles.analysisKpiLabel}>Suggested Order Qty</span>
                    <span className={styles.analysisKpiValue}>
                      {details.suggestedQty > 0 ? (
                        <>+{fmtNumber(details.suggestedQty)} <span className={styles.analysisKpiUnit}>units</span></>
                      ) : (
                        <span className={styles.noRestockLabel}>No restock needed</span>
                      )}
                    </span>
                  </div>
                  <div className={styles.analysisKpi}>
                    <span className={styles.analysisKpiLabel}>Est. Revenue</span>
                    <span className={styles.analysisKpiValue}>
                      {details.estimatedRevenue
                        ? fmtCurrency(details.estimatedRevenue)
                        : <span className={styles.analysisKpiNoData}>—</span>}
                    </span>
                  </div>
                </div>
              </section>

            </div>
          )}

          {/* Footer: Action Buttons */}
          {!loading && !error && (
            <div className={modalStyles.modalFooter}>
              <button className={modalStyles.btnSecondary} onClick={onClose}>
                Close
              </button>
              {details && details.suggestedQty > 0 && (
                <button
                  className={modalStyles.btnPrimary}
                  onClick={handleCreatePO}
                >
                  <ShoppingCart size={14} />
                  Create PO (+{details.suggestedQty})
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AnalysisDetailsModal;
