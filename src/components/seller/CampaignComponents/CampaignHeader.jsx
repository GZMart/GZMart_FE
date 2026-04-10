import styles from '@assets/styles/seller/Campaigns.module.css';

const CampaignHeader = ({ groupedCampaigns, onCreateClick }) => {
  // Count campaigns by type
  const flashSaleCount = groupedCampaigns.filter(g => g.type === 'flash_sale').length;
  const dailyDealCount = groupedCampaigns.filter(g => g.type === 'daily_deal').length;
  const weeklyDealCount = groupedCampaigns.filter(g => g.type === 'weekly_deal').length;
  const otherCount = groupedCampaigns.length - flashSaleCount - dailyDealCount - weeklyDealCount;

  const activeCount = groupedCampaigns.filter(g => g.status === 'active').length;

  return (
    <div className={styles.header}>
      <div className={styles.headerLeft}>
        <div className={styles.titleRow}>
          <div className={styles.titleIcon}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <h1 className={styles.title}>Campaign Management</h1>
        </div>
        <div className={styles.titleDesc}>
          <span className={styles.activeDot} />
          {groupedCampaigns.length > 0
            ? `${activeCount > 0 ? `${activeCount} active · ` : ''}${flashSaleCount > 0 ? `⚡${flashSaleCount} ` : ''}${dailyDealCount > 0 ? `📅${dailyDealCount} ` : ''}${weeklyDealCount > 0 ? `📆${weeklyDealCount} ` : ''}${otherCount > 0 ? `+${otherCount}` : ''}campaigns`
            : 'Create and manage your promotional campaigns'}
        </div>
      </div>
      <button className={styles.btnCreate} onClick={onCreateClick}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Create Campaign
      </button>
    </div>
  );
};

export default CampaignHeader;
