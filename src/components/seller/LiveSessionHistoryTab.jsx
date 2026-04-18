import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import livestreamService from '@services/api/livestreamService';
import { formatSessionMoney, truncateProductNameWords } from '@utils/liveSessionDisplay';
import styles from '@assets/styles/buyer/LiveStreamPage.module.css';

function formatDurationCard(seconds) {
  if (seconds == null || Number.isNaN(seconds) || seconds < 0) {
    return '—';
  }
  const s = Math.floor(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) {
    return `${h}h ${m}m`;
  }
  return `${m}m`;
}

function formatDurationDetail(seconds) {
  if (seconds == null || Number.isNaN(seconds) || seconds < 0) {
    return '—';
  }
  const s = Math.floor(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) {
    return `${h}h ${m}m`;
  }
  if (m > 0) {
    return `${m}m ${sec}s`;
  }
  return `${sec}s`;
}

function formatMoney(n) {
  if (n == null || Number.isNaN(n)) {
    return '—';
  }
  return new Intl.NumberFormat('en-US').format(Math.round(n)) + ' ₫';
}

function formatEnded(d) {
  if (!d) {
    return '—';
  }
  try {
    return new Date(d).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return '—';
  }
}

export default function LiveSessionHistoryTab() {
  const [sessions, setSessions] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [detailModalRow, setDetailModalRow] = useState(null);
  const [detailStats, setDetailStats] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await livestreamService.getSessionsHistory({ page: 1, limit: 25 });
      const payload = res?.data?.data ?? res?.data;
      setSessions(payload?.sessions ?? []);
      setTotal(payload?.total ?? 0);
    } catch (e) {
      setSessions([]);
      setError(e.response?.data?.message || e.message || 'Failed to load history.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const closeDetailModal = useCallback(() => {
    setDetailModalRow(null);
    setDetailStats(null);
    setDetailError(null);
    setDetailLoading(false);
  }, []);

  useEffect(() => {
    if (!detailModalRow) {
      return undefined;
    }
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [detailModalRow]);

  useEffect(() => {
    if (!detailModalRow) {
      return undefined;
    }
    const onKey = (e) => {
      if (e.key === 'Escape') {
        closeDetailModal();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [detailModalRow, closeDetailModal]);

  const openDetailModal = async (row) => {
    setDetailModalRow(row);
    setDetailLoading(true);
    setDetailStats(null);
    setDetailError(null);
    try {
      const res = await livestreamService.getSessionStats(row.sessionId);
      const payload = res?.data?.data ?? res?.data;
      setDetailStats(payload ?? null);
    } catch (e) {
      setDetailStats(null);
      setDetailError(e.response?.data?.message || e.message || 'Could not load session detail.');
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className={styles.historyTabRoot}>
      <div className={styles.statsTabToolbar}>
        <span className={styles.statsTabToolbarLabel}>Ended sessions ({total})</span>
        <button type="button" className={styles.statsTabRefresh} onClick={() => void loadHistory()} disabled={loading}>
          <i className={`bi bi-arrow-clockwise ${loading ? styles.spinning : ''}`} aria-hidden />
          Refresh
        </button>
      </div>

      <div className={styles.historyListScroll}>
        {loading && sessions.length === 0 && <p className={styles.statsTabStatus}>Loading…</p>}
        {error && <p className={styles.statsTabError}>{error}</p>}

        {!loading && sessions.length === 0 && !error && (
          <p className={styles.statsTabHint}>No past live sessions yet.</p>
        )}

        {sessions.length > 0 && (
          <ul className={styles.historyList}>
            {sessions.map((row) => (
              <li key={row.sessionId} className={styles.historySessionCard}>
                <button
                  type="button"
                  className={styles.historySessionCardBtn}
                  onClick={() => void openDetailModal(row)}
                  aria-haspopup="dialog"
                >
                  <span className={styles.historySessionCardHead}>
                    <span className={styles.historySessionTitle}>{row.title || 'Live stream'}</span>
                    <span className={styles.historySessionSub}>
                      {formatDurationCard(row.durationSeconds)}
                      {row.totalUnitsSold != null ? ` · ${row.totalUnitsSold} units` : ''}
                    </span>
                  </span>

                  <span className={styles.historySessionMeta}>
                    <span className={styles.historySessionMetaBlock}>
                      <span className={styles.historySessionMetaLabel}>Ended</span>
                      <span className={styles.historySessionMetaValue}>{formatEnded(row.endedAt)}</span>
                    </span>
                    <span className={styles.historySessionMetaPair}>
                      <span className={styles.historySessionMetaCell}>
                        <span className={styles.historySessionMetaLabel}>Revenue</span>
                        <span className={styles.historySessionMetaValueNum}>{formatMoney(row.revenue)}</span>
                      </span>
                      <span className={styles.historySessionMetaCell}>
                        <span className={styles.historySessionMetaLabel}>Orders</span>
                        <span className={styles.historySessionMetaValueNum}>{row.orderCount ?? 0}</span>
                      </span>
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {detailModalRow &&
        createPortal(
          <div
            className={styles.historyDetailModalBackdrop}
            role="presentation"
            onClick={closeDetailModal}
          >
            <div
              className={styles.historyDetailModalPanel}
              role="dialog"
              aria-modal="true"
              aria-labelledby="history-session-detail-title"
              onClick={(e) => e.stopPropagation()}
            >
              <header className={styles.historyDetailModalHeader}>
                <span className={styles.historyDetailModalEyebrow}>Past session</span>
                <div className={styles.historyDetailModalTitleRow}>
                  <h2 id="history-session-detail-title" className={styles.historyDetailModalTitle}>
                    {detailModalRow.title || 'Live session'}
                  </h2>
                  <button
                    type="button"
                    className={styles.historyDetailModalClose}
                    onClick={closeDetailModal}
                    aria-label="Close"
                  >
                    ×
                  </button>
                </div>
                <p className={styles.historyDetailModalMeta}>
                  <span className={styles.historyDetailModalMetaIcon} aria-hidden>
                    <i className="bi bi-calendar3" />
                  </span>
                  Ended {formatEnded(detailModalRow.endedAt)}
                  <span className={styles.historyDetailModalMetaDot} aria-hidden>
                    ·
                  </span>
                  Revenue excludes cancelled orders
                </p>
              </header>

              {detailLoading && (
                <div className={styles.historyDetailModalLoading} aria-busy="true" aria-live="polite">
                  <div className={styles.historyDetailModalSkeletonGrid}>
                    <div className={styles.historyDetailSkeletonBlock} />
                    <div className={styles.historyDetailSkeletonBlock} />
                    <div className={styles.historyDetailSkeletonBlock} />
                    <div className={styles.historyDetailSkeletonBlock} />
                  </div>
                  <div className={styles.historyDetailSkeletonTable}>
                    <div className={styles.historyDetailSkeletonLine} />
                    <div className={styles.historyDetailSkeletonLine} />
                    <div className={styles.historyDetailSkeletonLine} />
                  </div>
                  <p className={styles.historyDetailModalLoadingText}>Loading session detail…</p>
                </div>
              )}

              {!detailLoading && detailError && (
                <p className={styles.historyDetailModalError} role="alert">
                  {detailError}
                </p>
              )}

              {!detailLoading && !detailError && detailStats && (
                <div className={styles.historyDetailModalBody}>
                  <p className={styles.historyDetailModalSectionLabel}>Performance</p>
                  <div className={`${styles.statsTabKpis} ${styles.historyDetailModalKpis}`}>
                    <div className={styles.statsTabKpi}>
                      <span className={styles.statsTabKpiLabel}>Duration</span>
                      <span className={styles.statsTabKpiValue}>
                        {formatDurationDetail(detailStats.durationSeconds)}
                      </span>
                    </div>
                    <div className={styles.statsTabKpi}>
                      <span className={styles.statsTabKpiLabel}>Revenue</span>
                      <span className={styles.statsTabKpiValue}>
                        {formatSessionMoney(detailStats.revenue)}
                      </span>
                    </div>
                    <div className={styles.statsTabKpi}>
                      <span className={styles.statsTabKpiLabel}>Orders</span>
                      <span className={styles.statsTabKpiValue}>{detailStats.orderCount ?? 0}</span>
                    </div>
                    <div className={styles.statsTabKpi}>
                      <span className={styles.statsTabKpiLabel}>Units</span>
                      <span className={styles.statsTabKpiValue}>{detailStats.totalUnitsSold ?? 0}</span>
                    </div>
                  </div>

                  <p className={styles.historyDetailModalSectionLabel}>Products</p>
                  {Array.isArray(detailStats.products) && detailStats.products.length > 0 ? (
                    <div className={styles.historyDetailModalTable}>
                      <table className={styles.statsTabTable}>
                        <thead>
                          <tr>
                            <th className={styles.statsTabColProduct}>Product</th>
                            <th className={styles.statsTabThQty}>Qty</th>
                            <th className={styles.statsTabThSub}>Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detailStats.products.map((p) => {
                            const { short, full } = truncateProductNameWords(p.name);
                            return (
                              <tr key={String(p.productId)}>
                                <td className={styles.statsTabColProduct} title={full || undefined}>
                                  {short}
                                </td>
                                <td className={styles.statsTabTdQty}>{p.quantity ?? 0}</td>
                                <td className={styles.statsTabTdMoney}>{formatSessionMoney(p.lineSubtotal)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className={styles.statsTabEmpty}>No product lines for this session.</p>
                  )}
                </div>
              )}

              <footer className={styles.historyDetailModalFooter}>
                <button type="button" className={styles.historyDetailModalBtnPrimary} onClick={closeDetailModal}>
                  Close
                </button>
              </footer>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
