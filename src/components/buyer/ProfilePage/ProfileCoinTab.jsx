import PropTypes from 'prop-types';
import { Coins } from 'lucide-react';
import { Spinner } from 'react-bootstrap';
import styles from '@assets/styles/buyer/ProfilePage/ProfilePage.module.css';

const ProfileCoinTab = ({
  coinBalance,
  coinTransactions,
  coinLoading,
  coinHistoryFilter,
  onFilterChange,
}) => {
  const expiringCoins = coinBalance?.breakdown?.expiringSoon?.details || [];
  const nextExpiringCoin = expiringCoins.length > 0 ? expiringCoins[0] : null;
  const totalBalance = coinBalance?.totalBalance || 0;

  const getFilteredTransactions = () => {
    if (!coinTransactions || coinTransactions.length === 0) {
      return [];
    }

    if (coinHistoryFilter === 'received') {
      return coinTransactions.filter((tx) => tx.type === 'add' || tx.amount > 0);
    }
    if (coinHistoryFilter === 'used') {
      return coinTransactions.filter((tx) => tx.type === 'deduct' || tx.amount < 0);
    }
    return coinTransactions;
  };

  const filteredTransactions = getFilteredTransactions();

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${hours}:${minutes} ${day}-${month}-${year}`;
  };

  const formatExpirationDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  return (
    <div className={styles.coinTab}>
      <div className={styles.coinHeader}>
        <div className={styles.coinBalanceSection}>
          <div className={styles.coinIcon}>
            <Coins size={32} color="#F59E0B" strokeWidth={2} />
          </div>
          <div className={styles.coinBalanceInfo}>
            <div className={styles.coinBalanceLabel}>GZCoin balance</div>
            <div className={styles.coinBalanceAmount}>{totalBalance.toLocaleString()}</div>
            {nextExpiringCoin && (
              <div className={styles.coinExpirationInfo}>
                {nextExpiringCoin.amount.toLocaleString()} GZCoin will expire on{' '}
                {formatExpirationDate(nextExpiringCoin.expiresAt)}
              </div>
            )}
          </div>
        </div>
        <button className={styles.coinEarnMoreBtn}>Get more!</button>
      </div>

      <div className={styles.coinHistoryTabs}>
        <button
          className={`${styles.coinHistoryTab} ${coinHistoryFilter === 'all' ? styles.active : ''}`}
          onClick={() => onFilterChange('all')}
        >
          ALL HISTORY
        </button>
        <button
          className={`${styles.coinHistoryTab} ${coinHistoryFilter === 'received' ? styles.active : ''}`}
          onClick={() => onFilterChange('received')}
        >
          RECEIVED
        </button>
        <button
          className={`${styles.coinHistoryTab} ${coinHistoryFilter === 'used' ? styles.active : ''}`}
          onClick={() => onFilterChange('used')}
        >
          USED
        </button>
      </div>

      <div className={styles.coinTransactionList}>
        {coinLoading ? (
          <div className={styles.coinLoadingContainer}>
            <Spinner animation="border" size="sm" />
            <span>Loading transactions...</span>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className={styles.coinEmptyState}>
            <Coins size={64} color="#D1D5DB" strokeWidth={1.5} />
            <p>No transaction history</p>
          </div>
        ) : (
          filteredTransactions.map((transaction) => {
            const isPositive = transaction.amount > 0;
            const amount = Math.abs(transaction.amount);

            return (
              <div key={transaction._id} className={styles.coinTransactionItem}>
                <div className={styles.coinTransactionIcon}>
                  <div
                    className={`${styles.coinIconCircle} ${isPositive ? styles.positive : styles.negative}`}
                  >
                    <span>S</span>
                  </div>
                </div>
                <div className={styles.coinTransactionDetails}>
                  <div className={styles.coinTransactionTitle}>
                    {transaction.description || (isPositive ? 'Received GZCoin' : 'Used GZCoin')}
                  </div>
                  {transaction.metadata?.source && (
                    <div className={styles.coinTransactionSource}>
                      {transaction.metadata.source}
                    </div>
                  )}
                  <div className={styles.coinTransactionDate}>
                    {formatDate(transaction.createdAt || transaction.date)}
                  </div>
                </div>
                <div
                  className={`${styles.coinTransactionAmount} ${isPositive ? styles.positive : styles.negative}`}
                >
                  {isPositive ? '+' : '-'}
                  {amount.toLocaleString()}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

// Khai báo PropTypes để sửa lỗi ESLint
ProfileCoinTab.propTypes = {
  coinBalance: PropTypes.shape({
    totalBalance: PropTypes.number,
    breakdown: PropTypes.shape({
      expiringSoon: PropTypes.shape({
        details: PropTypes.arrayOf(
          PropTypes.shape({
            amount: PropTypes.number.isRequired,
            expiresAt: PropTypes.string.isRequired,
          })
        ),
      }),
    }),
  }),
  coinTransactions: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      type: PropTypes.string,
      amount: PropTypes.number.isRequired,
      description: PropTypes.string,
      createdAt: PropTypes.string,
      date: PropTypes.string,
      metadata: PropTypes.shape({
        source: PropTypes.string,
      }),
    })
  ),
  coinLoading: PropTypes.bool.isRequired,
  coinHistoryFilter: PropTypes.string.isRequired,
  onFilterChange: PropTypes.func.isRequired,
};

export default ProfileCoinTab;
