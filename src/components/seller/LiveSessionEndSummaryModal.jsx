import PropTypes from 'prop-types';
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

export default function LiveSessionEndSummaryModal({ isOpen, loading, error, stats, onClose }) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className={styles.endSummaryBackdrop}
      role="presentation"
      onClick={onClose}
    >
      <div
        className={styles.endSummaryModal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="end-summary-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.endSummaryHeader}>
          <h2 id="end-summary-title" className={styles.endSummaryTitle}>
            Live session summary
          </h2>
          <button
            type="button"
            className={styles.endSummaryClose}
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <p className={styles.endSummarySubtitle}>
          Here is how this broadcast performed. Orders exclude cancelled purchases.
        </p>

        {loading && (
          <p className={styles.endSummaryStatus}>Loading statistics…</p>
        )}
        {error && !loading && (
          <p className={styles.endSummaryError} role="alert">
            {error}
          </p>
        )}

        {!loading && stats && (
          <>
            <div className={styles.endSummaryKpis}>
              <div className={styles.endSummaryKpi}>
                <span className={styles.endSummaryKpiLabel}>Duration</span>
                <span className={styles.endSummaryKpiValue}>
                  {formatDuration(stats.durationSeconds)}
                </span>
              </div>
              <div className={styles.endSummaryKpi}>
                <span className={styles.endSummaryKpiLabel}>Revenue</span>
                <span className={styles.endSummaryKpiValue}>{formatSessionMoney(stats.revenue)}</span>
              </div>
              <div className={styles.endSummaryKpi}>
                <span className={styles.endSummaryKpiLabel}>Orders</span>
                <span className={styles.endSummaryKpiValue}>{stats.orderCount ?? 0}</span>
              </div>
              <div className={styles.endSummaryKpi}>
                <span className={styles.endSummaryKpiLabel}>Units sold</span>
                <span className={styles.endSummaryKpiValue}>{stats.totalUnitsSold ?? 0}</span>
              </div>
            </div>

            {stats.title && (
              <p className={styles.endSummarySessionTitle}>
                <strong>Session:</strong> {stats.title}
              </p>
            )}

            {Array.isArray(stats.products) && stats.products.length > 0 ? (
              <div className={styles.endSummaryTableWrap}>
                <table className={styles.endSummaryTable}>
                  <thead>
                    <tr>
                      <th className={styles.endSummaryColProduct}>Product</th>
                      <th className={styles.endSummaryThQty}>Qty</th>
                      <th className={styles.endSummaryThSub}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.products.map((row) => {
                      const { short, full } = truncateProductNameWords(row.name);
                      return (
                        <tr key={String(row.productId)}>
                          <td className={styles.endSummaryColProduct} title={full || undefined}>
                            {short}
                          </td>
                          <td className={styles.endSummaryTdQty}>{row.quantity ?? 0}</td>
                          <td className={styles.endSummaryTdMoney}>{formatSessionMoney(row.lineSubtotal)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className={styles.endSummaryEmpty}>No product lines for this session.</p>
            )}
          </>
        )}

        <div className={styles.endSummaryFooter}>
          <button type="button" className={styles.endSummaryDone} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

LiveSessionEndSummaryModal.propTypes = {
  isOpen: PropTypes.bool,
  loading: PropTypes.bool,
  error: PropTypes.string,
  stats: PropTypes.shape({
    title: PropTypes.string,
    durationSeconds: PropTypes.number,
    revenue: PropTypes.number,
    orderCount: PropTypes.number,
    totalUnitsSold: PropTypes.number,
    products: PropTypes.arrayOf(
      PropTypes.shape({
        productId: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
        name: PropTypes.string,
        quantity: PropTypes.number,
        lineSubtotal: PropTypes.number,
      }),
    ),
  }),
  onClose: PropTypes.func,
};
