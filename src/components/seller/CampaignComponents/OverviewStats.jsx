import PropTypes from 'prop-types';
import { DatePicker } from 'antd';
import { BarChartOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import styles from '@assets/styles/seller/Campaigns.module.css';

const statIcons = [
  <svg key="r" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e84949" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>,
  <svg key="o" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </svg>,
  <svg key="b" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>,
  <svg key="s" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
    <polyline points="16 7 22 7 22 13" />
  </svg>,
];

const sparklineData = [
  [20, 45, 30, 60, 40, 80, 100],
  [30, 50, 70, 60, 90, 80, 100],
  [50, 50, 50, 50, 50, 50, 50],
  [90, 70, 60, 40, 30, 20, 100],
];

const statConfig = [
  { label: 'Revenue', tip: 'Total revenue from flash sales (sold × sale price)', iconBg: '#fef2f2', iconColor: '#e84949', sparkIdx: 0 },
  { label: 'Orders', tip: 'Total products sold in flash sales', iconBg: '#eff6ff', iconColor: '#2563eb', sparkIdx: 1 },
  { label: 'Buyers', tip: 'Estimated buyers (based on sold quantity)', iconBg: '#ecfdf5', iconColor: '#059669', sparkIdx: 2 },
  { label: 'Sell Rate', tip: 'Avg sell rate: sold / total flash sale qty', iconBg: '#fffbeb', iconColor: '#d97706', sparkIdx: 3 },
];

const OverviewStats = ({ overviewRange, setOverviewRange, overviewStats }) => (
    <div className={styles.overviewCard}>
      <div className={styles.overviewHead}>
        <div className={styles.overviewHeadLeft}>
          <BarChartOutlined className={styles.overviewIcon} />
          <span className={styles.overviewTitle}>Performance Overview</span>
          <span className={styles.overviewSub}>
            {overviewRange[0].format('DD/MM/YYYY')} – {overviewRange[1].format('DD/MM/YYYY')}
          </span>
        </div>
        <DatePicker.RangePicker
          size="small"
          value={overviewRange}
          onChange={(vals) => vals && setOverviewRange(vals)}
          format="DD/MM/YYYY"
          allowClear={false}
          presets={[
            { label: 'Last 7 days', value: [dayjs().subtract(6, 'day').startOf('day'), dayjs().endOf('day')] },
            { label: 'Last 30 days', value: [dayjs().subtract(29, 'day').startOf('day'), dayjs().endOf('day')] },
            { label: 'This month', value: [dayjs().startOf('month'), dayjs().endOf('day')] },
          ]}
        />
      </div>
      <div className={styles.overviewStatsRow}>
        {statConfig.map((item, idx) => {
          const valueMap = { Revenue: overviewStats.revenue, Orders: overviewStats.orders, Buyers: overviewStats.buyers, 'Sell Rate': overviewStats.sellRate };
          const pctMap = { Revenue: overviewStats.revenuePct, Orders: overviewStats.ordersPct, Buyers: overviewStats.buyersPct, 'Sell Rate': overviewStats.sellRatePct };
          const displayValue = item.label === 'Sell Rate' ? `${valueMap[item.label]}%` : item.label === 'Revenue' ? `${valueMap[item.label].toLocaleString('vi-VN')} ₫` : valueMap[item.label].toLocaleString('vi-VN');
          const pct = pctMap[item.label];
          return (
            <div key={idx} className={styles.statCell}>
              <div className={styles.statCellTop}>
                <div className={styles.statCellLabel}>
                  <span className={styles.statCellIcon} style={{ background: item.iconBg }}>
                    {statIcons[idx]}
                  </span>
                  {item.label}
                </div>
                <span className={`${styles.statCellChange} ${pct > 0 ? styles.changeUp : pct < 0 ? styles.changeDown : styles.changeFlat}`}>
                  {pct > 0 ? `+${pct}%` : `${pct}%`}
                </span>
              </div>
              <div className={styles.statCellValue}>{displayValue}</div>
              <div className={styles.statCellSparkline}>
                {sparklineData[item.sparkIdx].map((h, i) => (
                  <span
                    key={i}
                    className={styles.sparklineBar}
                    style={{
                      height: `${h}%`,
                      background: i === sparklineData[item.sparkIdx].length - 1 ? item.iconColor : `${item.iconColor}30`,
                    }}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

OverviewStats.propTypes = {
  overviewRange: PropTypes.object,
  setOverviewRange: PropTypes.func.isRequired,
  overviewStats: PropTypes.object,
};

export default OverviewStats;
