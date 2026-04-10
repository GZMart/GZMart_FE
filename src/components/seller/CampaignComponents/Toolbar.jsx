import { Input, DatePicker } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import styles from '@assets/styles/seller/Campaigns.module.css';

const STATUS_TABS_FS = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Upcoming', value: 'pending' },
  { label: 'Ended', value: 'expired' },
  { label: 'Cancelled', value: 'cancelled' },
];

// Campaign type filter tabs - display order matches deal creation flow
const CAMPAIGN_TYPE_TABS = [
  { label: 'Tất cả', value: 'all' },
  { label: '⚡ Flash Sale', value: 'flash_sale' },
  { label: '📅 Deal Trong Ngày', value: 'daily_deal' },
  { label: '📆 Deal Tuần', value: 'weekly_deal' },
  { label: '⏳ Giới Hạn Thời Gian', value: 'limited_time' },
  { label: '🏷️ Clearance', value: 'clearance' },
  { label: '🎯 Special', value: 'special' },
];

const Toolbar = ({ searchText, setSearchText, statusFilter, setStatusFilter, typeFilter, setTypeFilter, dateRangeFilter, setDateRangeFilter, campaigns }) => {
  // Type filter is active when not "all"
  const hasActiveFilters = searchText || statusFilter !== 'all' || typeFilter !== 'all' || dateRangeFilter;

  return (
    <div className={styles.toolbar}>
      {/* Status tabs */}
      <div className={styles.tabsGroup}>
        {STATUS_TABS_FS.map((tab) => {
          const count = tab.value === 'all'
            ? campaigns.length
            : campaigns.filter((s) => s.status === tab.value || (tab.value === 'pending' && s.status === 'upcoming')).length;
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

      {/* Campaign type filter tabs */}
      <div className={styles.typeTabsGroup}>
        {CAMPAIGN_TYPE_TABS.map((tab) => {
          const count = tab.value === 'all'
            ? campaigns.length
            : campaigns.filter((s) => s.type === tab.value).length;
          return (
            <button
              key={tab.value}
              className={`${styles.typeTab} ${typeFilter === tab.value ? styles.typeTabActive : ''}`}
              onClick={() => setTypeFilter(tab.value)}
              title={tab.label}
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
              setTypeFilter('all');
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

export { Toolbar, STATUS_TABS_FS, CAMPAIGN_TYPE_TABS };
