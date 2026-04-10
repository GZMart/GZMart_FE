import { Input, DatePicker } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import styles from '@assets/styles/seller/FlashSales.module.css';

const STATUS_TABS_FS = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Upcoming', value: 'pending' },
  { label: 'Ended', value: 'expired' },
  { label: 'Cancelled', value: 'cancelled' },
];

const Toolbar = ({ searchText, setSearchText, statusFilter, setStatusFilter, dateRangeFilter, setDateRangeFilter, flashSales }) => {
  const hasActiveFilters = searchText || statusFilter !== 'all' || dateRangeFilter;

  return (
    <div className={styles.toolbar}>
      {/* Status tabs */}
      <div className={styles.tabsGroup}>
        {STATUS_TABS_FS.map((tab) => {
          const count = tab.value === 'all'
            ? flashSales.length
            : flashSales.filter((s) => s.status === tab.value || (tab.value === 'pending' && s.status === 'upcoming')).length;
          return (
            <button
              key={tab.value}
              className={`${styles.tab} ${statusFilter === tab.value ? styles.tabActive : ''}`}
              onClick={() => setStatusFilter(tab.value)}
            >
              {tab.label}
              <span className={styles.tabCount}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Right: search + date range */}
      <div className={styles.toolbarRight}>
        <Input
          placeholder="Search campaigns, products, SKU…"
          prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
          className={styles.searchInput}
          style={{ width: 240 }}
        />
        <DatePicker.RangePicker
          value={dateRangeFilter}
          onChange={setDateRangeFilter}
          placeholder={['Start date', 'End date']}
          allowClear
          style={{ borderRadius: 8 }}
          size="middle"
        />
        {hasActiveFilters && (
          <button
            onClick={() => {
              setSearchText('');
              setStatusFilter('all');
              setDateRangeFilter(null);
            }}
            className={styles.clearBtn}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            Clear
          </button>
        )}
      </div>
    </div>
  );
};

export { Toolbar, STATUS_TABS_FS };
