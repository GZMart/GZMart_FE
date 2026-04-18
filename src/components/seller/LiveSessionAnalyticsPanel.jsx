import { useState } from 'react';
import PropTypes from 'prop-types';
import { useMediaQuery } from '@hooks/useMediaQuery';
import LiveSessionStatsTab from './LiveSessionStatsTab';
import LiveSessionHistoryTab from './LiveSessionHistoryTab';
import styles from '@assets/styles/buyer/LiveStreamPage.module.css';

/**
 * Dedicated panel for session revenue & history — kept out of LiveChatPanel tab strip.
 */
export default function LiveSessionAnalyticsPanel({ sessionId, isLive }) {
  const compact = useMediaQuery('(max-width: 768px)');
  const [sub, setSub] = useState('session'); // 'session' | 'history'

  return (
    <div className={styles.analyticsCard}>
      <div className={styles.analyticsSubTabs} role="tablist" aria-label="Session analytics">
        <button
          type="button"
          role="tab"
          aria-selected={sub === 'session'}
          className={`${styles.analyticsSubTab} ${sub === 'session' ? styles.analyticsSubTabActive : ''}`}
          onClick={() => setSub('session')}
        >
          {compact ? 'This' : 'This session'}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={sub === 'history'}
          className={`${styles.analyticsSubTab} ${sub === 'history' ? styles.analyticsSubTabActive : ''}`}
          onClick={() => setSub('history')}
        >
          {compact ? 'Past' : 'Past sessions'}
        </button>
      </div>
      <div className={styles.analyticsMainArea}>
        {sub === 'session' && (
          <LiveSessionStatsTab sessionId={sessionId} isLive={isLive} showToolbarSessionLabel={false} />
        )}
        {sub === 'history' && <LiveSessionHistoryTab />}
      </div>
    </div>
  );
}

LiveSessionAnalyticsPanel.propTypes = {
  sessionId: PropTypes.string,
  isLive: PropTypes.bool,
};
