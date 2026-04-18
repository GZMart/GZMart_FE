import React, { useRef, useEffect } from 'react';
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
import { DatePicker } from 'antd';
import dayjs from 'dayjs';
import { TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';
import styles from '../../../assets/styles/seller/Dashboard.module.css';

const { RangePicker } = DatePicker;

export function OverallSalesCard({
  chartData = [],
  period = '30days',
  onPeriodChange,
  customDateRange = null,
  onCustomDateRangeChange,
  loading = false,
  revenueCurrent = 0,
  trend = 0,
}) {
  const { t } = useTranslation();
  const i18nLang = typeof window !== 'undefined' ? localStorage.getItem('i18nextLng') || 'vi' : 'vi';
  const dateFormat = i18nLang?.startsWith('en') ? 'MM/DD/YYYY' : 'DD/MM/YYYY';

  // Controls whether the custom RangePicker panel is open
  const [showCustomPicker, setShowCustomPicker] = React.useState(false);
  const pickerRef = useRef(null);

  useEffect(() => {
    if (showCustomPicker && pickerRef.current) {
      // Focus the input inside the RangePicker so the calendar opens immediately
      const input = pickerRef.current.input;
      if (input && typeof input.focus === 'function') {
        input.focus();
      }
    }
  }, [showCustomPicker]);

  const isPositive = Number(trend) >= 0;
  const trendAbs = Math.abs(Number(trend));

  const periodShortLabels = {
    '7days':    t('sellerDashboard.periodShort.7days', '7 Days'),
    '30days':   t('sellerDashboard.periodShort.30days', '30 Days'),
    '90days':   t('sellerDashboard.periodShort.90days', '90 Days'),
    '12months': t('sellerDashboard.periodShort.12months', '12 Months'),
    yearly:   t('sellerDashboard.periodShort.yearly', 'Last Year'),
    custom:     t('sellerDashboard.periodShort.custom', 'Custom'),
  };

  return (
    <div className={styles.chartCard}>
      <div className={styles.chartHeader}>
        <h3 className={styles.chartCardTitle}>{t('sellerDashboard.overallSales.title', 'Doanh thu theo thời gian')}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {onPeriodChange ? (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              {['7days', '30days', '90days', '12months', 'yearly'].map((p) => (
                <button
                  key={p}
                  onClick={() => onPeriodChange(p)}
                  className={`${styles.periodBtn} ${period === p && !customDateRange ? styles.periodBtnActive : styles.periodBtnInactive}`}
                >
                  {periodShortLabels[p]}
                </button>
              ))}
              <button
                onClick={() => {
                  setShowCustomPicker(true);
                }}
                className={`${styles.periodBtn} ${customDateRange ? styles.periodBtnActive : styles.periodBtnInactive}`}
                style={{ minWidth: 90 }}
              >
                {t('sellerDashboard.period.custom', 'Tùy chọn')}
              </button>
              <RangePicker
                ref={pickerRef}
                open={showCustomPicker}
                value={[
                  customDateRange ? dayjs(customDateRange.startDate) : null,
                  customDateRange ? dayjs(customDateRange.endDate) : null,
                ]}
                onChange={(dates) => {
                  if (dates && dates[0] && dates[1]) {
                    onCustomDateRangeChange(dates);
                  }
                  setShowCustomPicker(false);
                }}
                onOpenChange={(open) => {
                  setShowCustomPicker(open);
                }}
                format={dateFormat}
                size="small"
                disabledDate={(current) => current && current > dayjs().endOf('day')}
                className={styles.customRangePicker}
                classNames={{ popup: { root: styles.customRangePopup } }}
                getPopupContainer={() => document.body}
              />
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
                tickFormatter={(v) => Number(v).toLocaleString('vi-VN')}
                width={95}
              />
              <Tooltip
                formatter={(value) => [formatCurrency(value), '']}
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
