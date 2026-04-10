import styles from '@assets/styles/seller/FlashSales.module.css';

const EmptyState = ({ hasActiveFilters, onCreateClick }) => (
    <div className={styles.emptyState}>
      <div className={styles.emptyIconWrapper}>
        <svg
          width="36"
          height="36"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      </div>
      <p className={styles.emptyTitle}>
        {hasActiveFilters ? 'No campaigns match your filter' : 'No flash sales yet'}
      </p>
      <p className={styles.emptyDesc}>
        {hasActiveFilters
          ? 'Try adjusting your search or filter criteria'
          : 'Create your first flash sale campaign to start selling'}
      </p>
      {!hasActiveFilters && (
        <button className={styles.emptyBtn} onClick={onCreateClick}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Create your first flash sale
        </button>
      )}
    </div>
  );

export default EmptyState;
