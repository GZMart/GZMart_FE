import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import livestreamService from '@services/api/livestreamService';
import socketService from '@services/socket/socketService';
import { formatSessionMoney, truncateProductNameWords } from '@utils/liveSessionDisplay';
import styles from '@assets/styles/buyer/LiveStreamPage.module.css';

function formatDuration(seconds) {
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

export default function LiveSessionStatsTab({ sessionId, isLive, showToolbarSessionLabel = true }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const user = useSelector((state) => state.auth?.user);

  const fetchStats = useCallback(
    async (silent = false) => {
      if (!sessionId) {
        return;
      }
      if (!silent) {
        setLoading(true);
      }
      setError(null);
      try {
        const res = await livestreamService.getSessionStats(sessionId);
        const payload = res?.data?.data ?? res?.data;
        setStats(payload ?? null);
      } catch (e) {
        if (!silent) {
          setStats(null);
          setError(e.response?.data?.message || e.message || 'Failed to load statistics.');
        }
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [sessionId],
  );

  useEffect(() => {
    void fetchStats(false);
  }, [fetchStats]);

  /** While live: push updates from server + backup poll (no full page refresh). */
  useEffect(() => {
    if (!sessionId || !isLive) {
      return undefined;
    }
    const id = setInterval(() => {
      void fetchStats(true);
    }, 5000);
    return () => clearInterval(id);
  }, [sessionId, isLive, fetchStats]);

  useEffect(() => {
    if (!sessionId || !isLive || !user?._id) {
      return undefined;
    }
    socketService.connect(user._id);
    const onTick = (payload) => {
      const sid = payload?.sessionId;
      if (sid && String(sid) !== String(sessionId)) {
        return;
      }
      void fetchStats(true);
    };
    socketService.on('livestream_session_stats_tick', onTick);
    return () => {
      socketService.off('livestream_session_stats_tick', onTick);
    };
  }, [sessionId, isLive, user?._id, fetchStats]);

  if (!sessionId) {
    return (
      <div className={styles.statsTabRoot}>
        <div className={styles.statsTabScroll}>
          <p className={styles.statsTabHint}>Create a session and go live to see real-time sales for this broadcast.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.statsTabRoot}>
      <div
        className={`${styles.statsTabToolbar} ${!showToolbarSessionLabel ? styles.statsTabToolbarEnd : ''}`}
      >
        {showToolbarSessionLabel && <span className={styles.statsTabToolbarLabel}>This session</span>}
        <button
          type="button"
          className={styles.statsTabRefresh}
          onClick={() => void fetchStats(false)}
          disabled={loading}
        >
          <i className={`bi bi-arrow-clockwise ${loading ? styles.spinning : ''}`} aria-hidden />
          Refresh
        </button>
      </div>

      <div className={styles.statsTabScroll}>
        {loading && !stats && <p className={styles.statsTabStatus}>Loading…</p>}
        {error && <p className={styles.statsTabError}>{error}</p>}

        {stats && (
          <>
            <div className={styles.statsTabKpis}>
              <div className={styles.statsTabKpi}>
                <span className={styles.statsTabKpiLabel}>Duration</span>
                <span className={styles.statsTabKpiValue}>{formatDuration(stats.durationSeconds)}</span>
              </div>
              <div className={styles.statsTabKpi}>
                <span className={styles.statsTabKpiLabel}>Revenue</span>
                <span className={styles.statsTabKpiValue}>{formatSessionMoney(stats.revenue)}</span>
              </div>
              <div className={styles.statsTabKpi}>
                <span className={styles.statsTabKpiLabel}>Orders</span>
                <span className={styles.statsTabKpiValue}>{stats.orderCount ?? 0}</span>
              </div>
              <div className={styles.statsTabKpi}>
                <span className={styles.statsTabKpiLabel}>Units</span>
                <span className={styles.statsTabKpiValue}>{stats.totalUnitsSold ?? 0}</span>
              </div>
            </div>

            {Array.isArray(stats.products) && stats.products.length > 0 ? (
              <div className={styles.statsTabTableWrap}>
                <table className={styles.statsTabTable}>
                  <thead>
                    <tr>
                      <th className={styles.statsTabColProduct}>Product</th>
                      <th className={styles.statsTabThQty}>Qty</th>
                      <th className={styles.statsTabThSub}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.products.map((row) => {
                      const { short, full } = truncateProductNameWords(row.name);
                      return (
                        <tr key={String(row.productId)}>
                          <td className={styles.statsTabColProduct} title={full || undefined}>
                            {short}
                          </td>
                          <td className={styles.statsTabTdQty}>{row.quantity ?? 0}</td>
                          <td className={styles.statsTabTdMoney}>{formatSessionMoney(row.lineSubtotal)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className={styles.statsTabEmpty}>No attributed orders yet.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

LiveSessionStatsTab.propTypes = {
  sessionId: PropTypes.string,
  isLive: PropTypes.bool,
  showToolbarSessionLabel: PropTypes.bool,
};
