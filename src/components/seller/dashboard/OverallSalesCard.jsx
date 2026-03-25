import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';
import styles from '../../../assets/styles/seller/Dashboard.module.css';

const PERIOD_LABELS = {
  daily: '30 Ngày',
  weekly: '13 Tuần',
  monthly: '12 Tháng',
  quarterly: '4 Quý',
  yearly: '5 Năm',
};

export function OverallSalesCard({
  chartData = [],
  period = 'monthly',
  onPeriodChange,
  loading = false,
  revenueCurrent = 0,
  trend = 0,
}) {
  const isPositive = Number(trend) >= 0;
  const trendAbs = Math.abs(Number(trend));

  return (
    <div className={styles.chartCard}>
      <div className={styles.chartHeader}>
        <h3 className={styles.chartCardTitle}>Doanh thu theo thời gian</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {onPeriodChange ? (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {['daily', 'weekly', 'monthly', 'quarterly', 'yearly'].map((p) => (
                <button
                  key={p}
                  onClick={() => onPeriodChange(p)}
                  className={`${styles.periodBtn} ${period === p ? styles.periodBtnActive : styles.periodBtnInactive}`}
                >
                  {PERIOD_LABELS[p]}
                </button>
              ))}
            </div>
          ) : (
            <button className={styles.dateButton}>
              <Calendar size={14} />
              {PERIOD_LABELS[period] || period}
            </button>
          )}
        </div>
      </div>

      <div className={styles.chartMetricRow}>
        <div className={styles.salesValue}>
          {formatCurrency(revenueCurrent)}
        </div>
        <span className={isPositive ? styles.trendup : styles.trendDown}>
          {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {isPositive ? '+' : '-'}
          {trendAbs}%
        </span>
        <span className={styles.chartMetricLabel}>So với kỳ trước</span>
      </div>

      <div className={styles.chartContainer}>
        {loading ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: '#94a3b8',
              fontSize: '0.875rem',
            }}
          >
            Đang tải dữ liệu...
          </div>
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }} barCategoryGap="25%">
              <CartesianGrid strokeDasharray="3 3" stroke="#e8ecf0" vertical={false} />
              <XAxis
                dataKey="_id"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => {
                  if (v >= 1_000_000) {
                    return `${(v / 1_000_000).toFixed(0)}M`;
                  }
                  if (v >= 1_000) {
                    return `${(v / 1_000).toFixed(0)}K`;
                  }
                  return v;
                }}
              />
              <Tooltip
                formatter={(value) => formatCurrency(value)}
                contentStyle={{
                  borderRadius: 8,
                  border: '1px solid #e8ecf0',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  fontSize: 12,
                }}
                labelStyle={{ color: '#0f172a', fontWeight: 600 }}
              />
              <Bar
                dataKey="revenue"
                fill="#1677ff"
                radius={[4, 4, 0, 0]}
                maxBarSize={60}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: '#94a3b8',
              fontSize: '0.875rem',
            }}
          >
            Không có dữ liệu
          </div>
        )}
      </div>
    </div>
  );
}
