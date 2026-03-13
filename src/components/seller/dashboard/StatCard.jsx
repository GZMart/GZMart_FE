import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import styles from '../../../assets/styles/seller/Dashboard.module.css';

export function StatCard({ icon: IconComponent, label, value, trend, trendUp, fromLabel }) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statHeader}>
        <div className={`${styles.statIcon} ${styles.statIconBlue}`}>
          {typeof IconComponent === 'string' ? IconComponent : <IconComponent size={24} />}
        </div>
      </div>
      <div className={styles.statLabel}>{label}</div>
      <div className={styles.statValue}>{value}</div>
      <div className={styles.statTrend}>
        <span className={trendUp ? styles.statTrendGreen : styles.statTrendRed}>
          {trendUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {trendUp ? '↑' : '↓'} {trend}
        </span>
        <span className={styles.statTrendLabel}>{fromLabel}</span>
      </div>
    </div>
  );
}
