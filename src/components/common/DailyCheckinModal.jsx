import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import {
  Gift,
  Flame,
  Coins,
  CheckCircle2,
  Lock,
  CalendarCheck,
  X,
  CircleAlert,
} from 'lucide-react';
import styles from '../../assets/styles/buyer/DailyCheckinModal.module.css';
import dailyCheckinService from '../../services/api/dailyCheckinService';

/* ── Day Icon Component ── */
const DayIcon = ({ status }) => {
  switch (status) {
    case 'completed':
    case 'today_completed':
      return <CheckCircle2 size={24} className={styles.dayIcon} />;
    case 'today_available':
      return <Coins size={24} className={styles.dayIcon} />;
    default:
      return <Lock size={24} className={styles.dayIcon} />;
  }
};

/* ── Main Modal ── */
const DailyCheckinModal = ({ isOpen, onClose }) => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [earnedCoins, setEarnedCoins] = useState(0);

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      const res = await dailyCheckinService.getCheckinStatus();
      setStatus(res.data);
    } catch (err) {
      console.error('[DailyCheckin] Failed to fetch status:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
      setShowSuccess(false);
    }
  }, [isOpen, fetchStatus]);

  const handleCheckin = async () => {
    if (checking || status?.checkedInToday) {
return;
}

    try {
      setChecking(true);
      const res = await dailyCheckinService.performCheckin();
      const { coinsEarned } = res.data.checkin;

      setEarnedCoins(coinsEarned);
      setShowSuccess(true);

      // Refresh status after short delay
      setTimeout(() => fetchStatus(), 1500);
    } catch (err) {
      const msg = err?.data?.message || err?.message || 'Check-in failed';
      alert(msg);
    } finally {
      setChecking(false);
    }
  };

  const handleDayClick = (dayData) => {
    if (dayData.status === 'today_available') {
      handleCheckin();
    }
  };

  if (!isOpen) {
return null;
}

  const modalContent = (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>

        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.headerTitle}>
            <Gift size={24} color="#fd7e14" />
            Daily Check-in Rewards
          </h2>
          <p className={styles.headerSubtitle}>
            Check in every day to earn coins. 7-day streak for maximum rewards!
          </p>
        </div>

        {/* Loading State */}
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <div
              className={styles.spinner}
              style={{ margin: '0 auto 12px', borderTopColor: '#6c757d' }}
            />
            <p style={{ color: '#6c757d', fontSize: '0.85rem' }}>Loading...</p>
          </div>
        ) : status ? (
          <>
            {/* Streak Banner */}
            <div className={styles.streakBanner}>
              <div className={styles.streakInfo}>
                <Flame size={20} />
                <span className={styles.streakText}>
                  Streak:{' '}
                  <span className={styles.streakCount}>
                    {status.currentStreak}/{7} days
                  </span>
                </span>
              </div>
              <div className={styles.balanceBadge}>
                <Coins size={16} />
                {(status.totalCoinsEarned || 0).toLocaleString()} coins earned
              </div>
            </div>

            {/* 7-Day Grid */}
            <div className={styles.dayGrid}>
              {status.weekData?.map((dayData) => {
                let cardClass = styles.dayCard;
                if (dayData.status === 'completed') {
cardClass += ` ${styles.completed}`;
} else if (dayData.status === 'today_available') {
cardClass += ` ${styles.todayAvailable}`;
} else if (dayData.status === 'today_completed') {
cardClass += ` ${styles.todayCompleted}`;
} else {
cardClass += ` ${styles.locked}`;
}

                return (
                  <div
                    key={dayData.day}
                    className={cardClass}
                    onClick={() => handleDayClick(dayData)}
                    role={dayData.status === 'today_available' ? 'button' : undefined}
                    tabIndex={dayData.status === 'today_available' ? 0 : undefined}
                  >
                    <span className={styles.dayLabel}>Day {dayData.day}</span>
                    <DayIcon status={dayData.status} />
                    <span className={styles.dayCoins}>+{dayData.coins}</span>
                  </div>
                );
              })}
            </div>

            {/* Check-in Button */}
            <div className={styles.checkinSection}>
              {status.checkedInToday ? (
                <button className={`${styles.checkinBtn} ${styles.checkinBtnDone}`} disabled>
                  <CalendarCheck size={20} />
                  Already checked in today
                </button>
              ) : (
                <button
                  className={`${styles.checkinBtn} ${checking ? styles.checkinBtnLoading : styles.checkinBtnActive}`}
                  onClick={handleCheckin}
                  disabled={checking}
                >
                  {checking ? (
                    <>
                      <div className={styles.spinner} /> Processing...
                    </>
                  ) : (
                    <>
                      <Coins size={20} />
                      Check in to earn {status.nextReward} coins
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Footer */}
            <div className={styles.footer}>
              <p className={styles.footerText}>
                Check in for <strong>7 consecutive days</strong> to earn up to{' '}
                <strong>2,800 coins</strong>. Missing a day resets the streak. GZCoin can only be
                used for purchases, not withdrawals.
              </p>
            </div>
          </>
        ) : (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6c757d' }}>
            <CircleAlert size={32} style={{ marginBottom: '12px' }} />
            <p>Unable to load data. Please try again.</p>
          </div>
        )}

        {/* Success Overlay */}
        {showSuccess && (
          <div className={styles.successOverlay}>
            <CheckCircle2 size={64} className={styles.successIcon} />
            <div className={styles.successCoins}>+{earnedCoins} GZCoin</div>
            <div className={styles.successLabel}>Check-in successful!</div>
          </div>
        )}
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

/* ── Floating Action Button ── */
export const DailyCheckinFAB = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasCheckedIn, setHasCheckedIn] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await dailyCheckinService.getCheckinStatus();
        setHasCheckedIn(res.data?.checkedInToday || false);
      } catch {
        // Silently fail — user might not be logged in
      }
    };
    checkStatus();
  }, [isOpen]);

  return (
    <>
      <button
        className={styles.fab}
        onClick={() => setIsOpen(true)}
        id="daily-checkin-fab"
        aria-label="Daily check-in"
      >
        <CalendarCheck size={28} />
        {!hasCheckedIn && <span className={styles.fabBadge} />}
        <span className={styles.fabTooltip}>Daily Check-in</span>
      </button>

      <DailyCheckinModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};

export default DailyCheckinModal;
