import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Activity,
  PlusCircle,
  Package,
  Info,
} from 'lucide-react';
import { selectUser } from '../../../store/slices/authSlice';
import inventoryService from '../../../services/api/inventoryService';
import styles from '../../../assets/styles/seller/DemandForecast.module.css';
import AnalysisDetailsModal from './AnalysisDetailsModal';

// ─── Demand Forecast Block (runs in background) ────────────────────────────────
const DemandForecastBlock = () => {
  const user = useSelector(selectUser);
  const sellerId = user?._id;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [trendDays, setTrendDays] = useState(30);
  const [collapsed, setCollapsed] = useState(true);
  const [detailsTarget, setDetailsTarget] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const loadForecast = useCallback(async () => {
    if (!sellerId) return;
    setLoading(true);
    try {
      const res = await inventoryService.getDemandForecast({ trendDays });
      setData(res.data);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401 || status === 403) setData(null);
    } finally {
      setLoading(false);
    }
  }, [sellerId, trendDays]);

  useEffect(() => {
    setCurrentPage(1);
  }, [trendDays]);

  useEffect(() => {
    loadForecast();
  }, [loadForecast]);

  const trendingProducts = data?.trendingProducts || [];
  const totalProducts = data?.summary?.totalProducts || 0;
  const forecastAccuracy =
    data?.dataPeriod?.forecastAccuracy === 'high'
      ? '7-day forecast (higher accuracy)'
      : '30-day forecast (standard accuracy)';

  const totalPages = Math.ceil(trendingProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = trendingProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const getTrendLabel = (item) => {
    if (item.restockPriority === 'urgent') return 'Urgent';
    if (item.restockPriority === 'moderate') return 'Restock Soon';
    if (item.restockPriority === 'opportunity') return 'Trending Up';
    if (item.trendCategory === 'trending_up') return 'Hot';
    if (item.trendCategory === 'trending_down') return 'Slow';
    return 'Stable';
  };

  const getTrendClass = (item) => {
    if (item.restockPriority === 'urgent') return styles.trendBadgeUrgent;
    if (item.restockPriority === 'moderate') return styles.trendBadgeModerate;
    if (item.restockPriority === 'opportunity') return styles.trendBadgeOpportunity;
    if (item.trendCategory === 'trending_up') return styles.trendBadgeUp;
    if (item.trendCategory === 'trending_down') return styles.trendBadgeDown;
    return styles.trendBadgeStable;
  };

  return (
    <>
      <div className={styles.demandBlock}>
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className={styles.demandHeader}>
          <div className={styles.demandTitle}>
            <BarChart3 size={18} />
            <span>Trend Forecast</span>

            {collapsed && !data && (
              <span className={styles.demandSubtitle}>
                <span className={styles.collapseLoading}>
                  <RefreshCw size={11} className={styles.spin} />
                  Analyzing market trends…
                </span>
              </span>
            )}
            {collapsed && data && (
              <span className={styles.demandSubtitle}>
                {totalProducts} products tracked · {forecastAccuracy}
              </span>
            )}
            {!collapsed && data && (
              <span className={styles.demandSubtitle}>
                {totalProducts} products tracked · {forecastAccuracy}
              </span>
            )}
            {!collapsed && !data && !loading && (
              <span className={styles.demandSubtitle}>Analyzing market trends…</span>
            )}
          </div>

          <div className={styles.demandActions}>
            <select
              className={styles.periodSelect}
              value={trendDays}
              onChange={(e) => setTrendDays(Number(e.target.value))}
            >
              <option value={7}>7 days — High Accuracy</option>
              <option value={30}>30 days — Standard</option>
            </select>
            <button
              className={styles.iconBtnSm}
              onClick={loadForecast}
              disabled={loading}
              title="Refresh"
            >
              <RefreshCw
                size={14}
                style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }}
              />
            </button>
            <button
              className={`${styles.iconBtnSm} ${data ? styles.iconBtnSmActive : ''}`}
              onClick={() => setCollapsed((c) => !c)}
              title={
                data
                  ? collapsed
                    ? 'Expand — data ready'
                    : 'Collapse'
                  : collapsed
                  ? 'Expand'
                  : 'Collapse'
              }
            >
              {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </button>
          </div>
        </div>

        {/* ── Collapsed banner ───────────────────────────────────────────── */}
        {collapsed && (
          <div className={styles.collapsedBanner}>
            {loading ? (
              <span className={styles.collapsedLoadingText}>
                <RefreshCw size={12} className={styles.spin} />
                Fetching trend data — this may take 10–30 seconds…
              </span>
            ) : data ? (
              <span className={styles.collapsedDoneText}>
                {trendingProducts.length > 0
                  ? `${trendingProducts.length} trending products ready`
                  : 'Analysis complete — no urgent trends detected'}
              </span>
            ) : (
              <span className={styles.collapsedErrorText}>
                Failed to load forecast — tap refresh to retry
              </span>
            )}
          </div>
        )}

        {/* ── Summary Chips ─────────────────────────────────────────────── */}
        {data && !collapsed && (
          <div className={styles.chipRow}>
            <span className={styles.chip}>
              <TrendingUp size={12} />
              {data.summary?.trendingUp || 0} Trending Up
            </span>
            <span className={styles.chipWarn}>
              <AlertTriangle size={12} />
              {data.summary?.urgentRestock || 0} Urgent Restock
            </span>
            <span className={styles.chip}>
              <TrendingDown size={12} />
              {data.summary?.trendingDown || 0} Slow
            </span>
          </div>
        )}

        {/* ── Trending Product List ─────────────────────────────────────── */}
        {!collapsed && (
          <>
            {loading ? (
              <div className={styles.forecastEmpty}>
                <RefreshCw size={20} className={styles.spin} style={{ color: '#94a3b8' }} />
                <p>Searching market trends for your products…</p>
              </div>
            ) : trendingProducts.length === 0 ? (
              <div className={styles.forecastEmpty}>
                <Activity size={28} style={{ color: '#94a3b8' }} />
                <p>
                  No trending products detected. Products will appear here when market demand is
                  detected.
                </p>
              </div>
            ) : (
              <>
              <div className={styles.trendList}>
                {/* Table header */}
                <div className={styles.trendListHeader}>
                  <span className={styles.trendColProduct}>Product</span>
                  <span className={styles.trendColBadge}>Status</span>
                  <span className={styles.trendColPct}>Trend</span>
                  <span className={styles.trendColQty}>Sold</span>
                  <span className={styles.trendColStock}>Stock</span>
                  <span className={styles.trendColSuggest}>Suggested</span>
                  <span className={styles.trendColAction}>Action</span>
                </div>

                {paginatedProducts.map((item) => {
                  const pct = item.displayTrendPct;
                  const pctStr = pct >= 0 ? `+${pct}%` : `${pct}%`;
                  const isUp = pct >= 0;
                  const rowKey = item.productId;
                  const isLowStock = item.currentStock <= 10;
                  const suggestedQty =
                    item.suggestedQuantity ||
                    Math.max(Math.ceil(item.avgWeeklyQty * (trendDays === 7 ? 1 : 4)), 0);
                  const soldPeriodLabel = trendDays === 7 ? '7 days' : '30 days';

                  const handleCreatePO = () => {
                    const qty =
                      item.suggestedQuantity ||
                      Math.max(Math.ceil(item.avgWeeklyQty * (trendDays === 7 ? 1 : 4)), 10);
                    window.open(
                      `/seller/erp/purchase-orders?add=${encodeURIComponent(
                        JSON.stringify({ productId: item.productId, name: item.name, qty })
                      )}`,
                      '_blank'
                    );
                  };

                  return (
                    <div key={rowKey} className={styles.trendRow}>
                      {/* Product name + image */}
                      <div className={styles.trendColProduct}>
                        {item.image ? (
                          <img src={item.image} alt={item.name} className={styles.trendThumb} />
                        ) : (
                          <div className={styles.trendThumbPlaceholder}>
                            <Package size={14} color="#d1d5db" />
                          </div>
                        )}
                        <div className={styles.trendProductInfo}>
                          <span className={styles.trendProductName}>{item.name}</span>
                          {item.hasWebData && (
                            <span className={styles.trendWebIndicator}>
                              <TrendingUp size={10} /> Market verified
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Status badge */}
                      <div className={styles.trendColBadge}>
                        <span className={`${styles.trendBadge} ${getTrendClass(item)}`}>
                          {getTrendLabel(item)}
                        </span>
                      </div>

                      {/* Trend percentage */}
                      <div className={styles.trendColPct}>
                        <span className={isUp ? styles.trendPctUp : styles.trendPctDown}>
                          {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                          {pctStr}
                        </span>
                      </div>

                      {/* Quantity sold (with period label) */}
                      <div className={styles.trendColQty}>
                        <span className={styles.trendQty}>{item.displayQty}</span>
                        <span className={styles.trendQtyPeriod}>{soldPeriodLabel}</span>
                      </div>

                      {/* Current stock */}
                      <div className={styles.trendColStock}>
                        <span
                          className={`${styles.trendStock} ${isLowStock ? styles.trendStockLow : ''}`}
                        >
                          {item.currentStock}
                        </span>
                        <span className={styles.trendQtyPeriod} />
                      </div>

                      {/* Suggested PO qty */}
                      <div className={styles.trendColSuggest}>
                        <span className={styles.suggestedQty}>
                          {suggestedQty > 0 ? `+${suggestedQty}` : '—'}
                        </span>
                        {suggestedQty === 0 && (
                          <span className={styles.noRestockHint}>No restock needed</span>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className={styles.trendColAction}>
                        <button
                          className={styles.detailsBtn}
                          onClick={() => setDetailsTarget(item)}
                          title="View detailed analysis"
                        >
                          <Info size={13} />
                          Details
                        </button>
                        <button
                          className={`${styles.createPoBtn} ${
                            item.restockPriority === 'urgent' || isLowStock
                              ? styles.createPoBtnUrgent
                              : ''
                          }`}
                          onClick={handleCreatePO}
                        >
                          <PlusCircle size={13} />
                          PO
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className={styles.pagination}>
                  <button
                    className={styles.pageBtn}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span className={styles.pageInfo}>
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    className={styles.pageBtn}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
              </>
            )}
          </>
        )}
      </div>

      {/* ── Analysis Details Modal ─────────────────────────────────────── */}
      {detailsTarget && (
        <AnalysisDetailsModal
          item={detailsTarget}
          trendDays={trendDays}
          onClose={() => setDetailsTarget(null)}
        />
      )}
    </>
  );
};

export default DemandForecastBlock;
