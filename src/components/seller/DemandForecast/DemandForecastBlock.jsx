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
  const [isFromCache, setIsFromCache] = useState(false);
  const ITEMS_PER_PAGE = 5;
  const CACHE_KEY = `demandForecast_${sellerId}`;

  const loadForecast = useCallback(async (bypassCache = false) => {
    if (!sellerId) return;
    setLoading(true);
    setIsFromCache(false);
    
    // Clear old cache to force fresh fetch
    try {
      localStorage.removeItem(CACHE_KEY);
    } catch (e) {
      console.warn('[DemandForecast] Failed to clear cache:', e);
    }
    
    try {
      const res = await inventoryService.getDemandForecast({ trendDays, bypassCache });
      setData(res.data);
      // Save to localStorage with timestamp
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          data: res.data,
          trendDays,
          timestamp: Date.now(),
        }));
      } catch (storageErr) {
        console.warn('[DemandForecast] Failed to save to cache:', storageErr);
      }
    } catch (err) {
      const status = err?.response?.status;
      const rateLimitReason = err?.response?.data?._rateLimit?.reason;
      
      // If rate limited or error, try to load from cache
      if (status === 429 || rateLimitReason === 'daily_limit') {
        try {
          const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
          if (cached?.data) {
            setData(cached.data);
            setIsFromCache(true);
          } else {
            setData(null);
          }
        } catch (cacheErr) {
          setData(null);
        }
      } else if (status === 401 || status === 403) {
        setData(null);
      } else {
        // For other errors, try to show cached data if available
        try {
          const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
          if (cached?.data) {
            setData(cached.data);
            setIsFromCache(true);
          } else {
            setData(null);
          }
        } catch (cacheErr) {
          setData(null);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [sellerId, trendDays, CACHE_KEY]);

  // Check cache validity on component mount (30 min TTL)
  useEffect(() => {
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
      if (cached?.timestamp) {
        const cacheAgeMinutes = (Date.now() - cached.timestamp) / (1000 * 60);
        if (cacheAgeMinutes >= 30) {
          // Cache expired, remove it and fetch fresh data
          localStorage.removeItem(CACHE_KEY);
        }
      }
    } catch (err) {
      console.warn('[DemandForecast] Cache validation error:', err);
    }
  }, [CACHE_KEY]);

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

  // Sort by trend % descending (highest trend first), then by web trend score
  const sortedTrendingProducts = [...trendingProducts].sort((a, b) => {
    const aTrend = a.displayTrendPct || 0;
    const bTrend = b.displayTrendPct || 0;
    
    if (aTrend !== bTrend) {
      return bTrend - aTrend;  // Descending: highest trend first
    }
    
    // Tie-breaker: web trend score
    const aWebScore = a.globalTrendScore || 0;
    const bWebScore = b.globalTrendScore || 0;
    return bWebScore - aWebScore;
  });

  const totalPages = Math.ceil(sortedTrendingProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = sortedTrendingProducts.slice(
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
                {isFromCache && <span style={{ marginLeft: '8px', opacity: 0.7 }}>📦 (Cached)</span>}
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
              onClick={() => loadForecast(true)}
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
                  ? `${trendingProducts.length} trending products ready${isFromCache ? ' (from cache)' : ''}`
                  : 'Analysis complete — no urgent trends detected'}
                {isFromCache && ' — Data may be outdated'}
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
          <>
            {isFromCache && (
              <div style={{
                padding: '12px 16px',
                backgroundColor: '#fef08a',
                border: '1px solid #fde047',
                borderRadius: '6px',
                marginBottom: '12px',
                fontSize: '13px',
                color: '#713f12',
              }}>
                📦 <strong>Showing cached data:</strong> Unable to fetch fresh forecast (daily limit reached). This data may be outdated. Try again tomorrow.
              </div>
            )}
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
          </>
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
                  const suggestedQty = item.suggestedQty || 0;

                  const handleCreatePO = () => {
                    const qty = item.suggestedQty || 0;
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

                      {/* Quantity sold */}
                      <div className={styles.trendColQty}>
                        <span className={styles.trendQty}>{item.displayQty}</span>
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
                        {suggestedQty > 0 ? (
                          <span className={styles.suggestedQty}>+{suggestedQty}</span>
                        ) : (
                          <span className={styles.noRestockLabel}>No restock needed</span>
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
