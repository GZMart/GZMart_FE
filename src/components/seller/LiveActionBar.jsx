import styles from '@assets/styles/buyer/LiveStreamPage.module.css';
import PropTypes from 'prop-types';

export default function LiveActionBar({ onDiscard, onGoLive, isLive, isLoading }) {
  return (
    <div className={styles.actionBar}>
      {/* Network status */}
      <div className={styles.networkStatus}>
        <div className={styles.networkDotOuter}>
          <div className={styles.networkDotBg} />
          <div className={styles.networkDot} />
        </div>
        <span className={styles.networkText}>Network: Stable (Excellent)</span>
      </div>

      {/* Action buttons */}
      <div className={styles.actionBtns}>
        <button
          className={styles.btnDiscard}
          onClick={onDiscard}
          type="button"
        >
          Discard Draft
        </button>

        <button
          className={styles.btnGoLive}
          onClick={onGoLive}
          disabled={isLoading || isLive}
          type="button"
        >
          <i className={`bi bi-broadcast ${styles.btnGoLiveIcon}`} />
          {isLive ? 'LIVE NOW' : 'GO LIVE NOW'}
        </button>
      </div>
    </div>
  );
}

LiveActionBar.propTypes = {
  onDiscard: PropTypes.func,
  onGoLive: PropTypes.func,
  isLive: PropTypes.bool,
  isLoading: PropTypes.bool,
};
