import styles from '@assets/styles/seller/FlashSales.module.css';

const FlashSalesHeader = ({ groupedFlashSales, onCreateClick }) => (
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
          <h1 className={styles.title}>Flash Sale Management</h1>
        </div>
        <div className={styles.titleDesc}>
          <span className={styles.activeDot} />
          {groupedFlashSales.length > 0
            ? `${groupedFlashSales.length} campaign${groupedFlashSales.length > 1 ? 's' : ''} running right now`
            : 'Manage and track your flash sale campaigns'}
        </div>
      </div>
      <button className={styles.btnCreate} onClick={onCreateClick}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Create Flash Sale
      </button>
    </div>
  );

export default FlashSalesHeader;
