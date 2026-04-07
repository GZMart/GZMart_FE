import React from 'react';
import { useTranslation } from 'react-i18next';
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

export function OverallSalesCard({
  chartData = [],
  period = 'monthly',
  onPeriodChange,
  loading = false,
  revenueCurrent = 0,
  trend = 0,
}) {
  const { t } = useTranslation();

  const isPositive = Number(trend) >= 0;
  const trendAbs = Math.abs(Number(trend));

  const periodShortLabels = {
    daily: t('sellerDashboard.periodShort.daily', '30 Ngày'),
    weekly: t('sellerDashboard.periodShort.weekly', '13 Tuần'),
    monthly: t('sellerDashboard.periodShort.monthly', '12 Tháng'),
    quarterly: t('sellerDashboard.periodShort.quarterly', '4 Quý'),
    yearly: t('sellerDashboard.periodShort.yearly', '5 Năm'),
  };

  return (
    <div className={styles.chartCard}>
      <div className={styles.chartHeader}>
        <h3 className={styles.chartCardTitle}>{t('sellerDashboard.overallSales.title', 'Doanh thu theo thời gian')}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {onPeriodChange ? (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {['daily', 'weekly', 'monthly', 'quarterly', 'yearly'].map((p) => (
                <button
                  key={p}
                  onClick={() => onPeriodChange(p)}
                  className={`${styles.periodBtn} ${period === p ? styles.periodBtnActive : styles.periodBtnInactive}`}
                >
                  {periodShortLabels[p]}
                </button>
              ))}
            </div>
          ) : (
            <button className={styles.dateButton}>
              <Calendar size={14} />
              {periodShortLabels[period] || period}
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
        <span className={styles.chartMetricLabel}>{t('sellerDashboard.overallSales.vsPrevious', 'So với kỳ trước')}</span>
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
            {t('sellerDashboard.overallSales.loading', 'Đang tải dữ liệu...')}
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
            {t('sellerDashboard.overallSales.noData', 'Không có dữ liệu')}
          </div>
        )}
      </div>
    </div>
  );
}
