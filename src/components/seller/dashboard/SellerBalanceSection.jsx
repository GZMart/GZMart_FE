import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Button, Spin, Tooltip } from 'antd';
import {
  Wallet,
  TrendingUp,
  Clock,
  ShoppingBag,
  ArrowDownToLine,
  RefreshCw,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../../../utils/formatters';
import dashboardService from '../../../services/api/dashboardService';
import styles from '../../../assets/styles/seller/Dashboard.module.css';

// ─── Skeleton ────────────────────────────────────────────────────────────────
const SkeletonBalanceSection = () => (
  <div className={styles.balanceSectionGrid}>
    <div className={`${styles.skeleton} ${styles.skeletonBalanceCard}`} />
    <div className={styles.balanceSubCardsGrid}>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className={`${styles.skeleton} ${styles.skeletonSubCard}`} />
      ))}
    </div>
  </div>
);

// ─── Sub-card ───────────────────────────────────────────────────────────────
const BalanceSubCard = ({ icon: Icon, label, value, sub, accentColor, tooltipText }) => {
  const bgColor = `${accentColor}14`;

  const card = (
    <div
      className={styles.balanceSubCard}
      style={{ '--accent': accentColor, '--bg': bgColor }}
    >
      <div className={styles.balanceSubCardIcon}>
        <Icon size={18} color={accentColor} />
      </div>
      <div className={styles.balanceSubCardContent}>
        <span className={styles.balanceSubCardLabel}>{label}</span>
        <span className={styles.balanceSubCardValue}>{value}</span>
        {sub && <span className={styles.balanceSubCardSub}>{sub}</span>}
      </div>
    </div>
  );

  if (tooltipText) {
    return (
      <Tooltip title={tooltipText} placement="top">
        {card}
      </Tooltip>
    );
  }

  return card;
};

BalanceSubCard.propTypes = {
  icon: PropTypes.any,
  label: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  sub: PropTypes.string,
  accentColor: PropTypes.string,
  tooltipText: PropTypes.string,
};

// ─── Main Component ─────────────────────────────────────────────────────────
const SellerBalanceSection = ({ onBalanceLoaded }) => {
  const { t } = useTranslation();
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBalance = async () => {
    try {
      const resp = await dashboardService.getSellerBalance();
      if (resp?.data) {
        setBalance(resp.data);
        if (onBalanceLoaded) {
          onBalanceLoaded(resp.data);
        }
      }
    } catch (err) {
      console.warn('[SellerBalanceSection] Failed to fetch balance:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, []);

  if (loading) {
    return (
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitleRow}>
            <Wallet size={16} color="#1677ff" />
            <span className={styles.sectionTitle}>
              {t('sellerDashboard.balance.title', 'Số dư tài khoản')}
            </span>
          </div>
        </div>
        <div className={styles.sectionBody}>
          <SkeletonBalanceSection />
        </div>
      </div>
    );
  }

  if (error || !balance) {
    return (
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitleRow}>
            <Wallet size={16} color="#1677ff" />
            <span className={styles.sectionTitle}>
              {t('sellerDashboard.balance.title', 'Số dư tài khoản')}
            </span>
          </div>
        </div>
        <div className={styles.sectionBody}>
          <div className={styles.emptyState}>
            <p>{t('sellerDashboard.balance.error', 'Không thể tải thông tin số dư')}</p>
            <Button
              size="small"
              icon={<RefreshCw size={14} />}
              onClick={fetchBalance}
            >
              {t('sellerDashboard.balance.retry', 'Thử lại')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.sectionCard}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitleRow}>
          <Wallet size={16} color="#1677ff" />
          <span className={styles.sectionTitle}>
            {t('sellerDashboard.balance.title', 'Số dư tài khoản')}
          </span>
        </div>
        <Button
          type="text"
          size="small"
          icon={<RefreshCw size={14} />}
          onClick={fetchBalance}
          className={styles.balanceRefreshBtn}
        >
          {t('sellerDashboard.balance.refresh', 'Làm mới')}
        </Button>
      </div>

      <div className={styles.sectionBody}>
        <div className={styles.balanceSectionGrid}>
          {/* ── Main Balance Card ── */}
          <div className={styles.balanceMainCard}>
            <div className={styles.balanceMainCardHeader}>
              <div className={styles.balanceMainCardIcon}>
                <Wallet size={24} color="#ffffff" />
              </div>
              <div className={styles.balanceMainCardMeta}>
                <span className={styles.balanceMainCardLabel}>
                  {t('sellerDashboard.balance.available', 'Số dư khả dụng')}
                </span>
                <Tooltip
                  title={t(
                    'sellerDashboard.balance.availableTooltip',
                    'Số tiền từ các đơn hàng đã hoàn thành, có thể rút hoặc sử dụng'
                  )}
                >
                  <span className={styles.balanceMainCardHint}>?</span>
                </Tooltip>
              </div>
            </div>

            <div className={styles.balanceMainCardAmount}>
              <span className={styles.balanceMainCardCurrency}>VND</span>
              <span className={styles.balanceMainCardValue}>
                {balance.availableBalance != null
                  ? Math.round(balance.availableBalance).toLocaleString('vi-VN')
                  : '0'}
              </span>
            </div>

            <div className={styles.balanceMainCardFooter}>
              <div className={styles.balanceMainCardFooterItem}>
                <Clock size={12} />
                <span>
                  {t('sellerDashboard.balance.pending', 'Chờ xử lý')}:{' '}
                  <strong>
                    {balance.pendingBalance != null
                      ? Math.round(balance.pendingBalance).toLocaleString('vi-VN')
                      : 0}
                    VND
                  </strong>
                </span>
              </div>
            </div>

            {/* Progress bar: available vs pending */}
            {balance.totalBalance > 0 && (
              <div className={styles.balanceProgressWrap}>
                <div className={styles.balanceProgressLabels}>
                  <span>{t('sellerDashboard.balance.available', 'Khả dụng')}</span>
                  <span>{t('sellerDashboard.balance.pending', 'Chờ xử lý')}</span>
                </div>
                <div className={styles.balanceProgressBar}>
                  <div
                    className={styles.balanceProgressFill}
                    style={{
                      width: `${Math.round((balance.availableBalance / balance.totalBalance) * 100)}%`,
                    }}
                  />
                </div>
                <div className={styles.balanceProgressPercents}>
                  <span className={styles.balanceProgressPercentAvailable}>
                    {Math.round((balance.availableBalance / balance.totalBalance) * 100)}%
                  </span>
                  <span className={styles.balanceProgressPercentPending}>
                    {Math.round((balance.pendingBalance / balance.totalBalance) * 100)}%
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* ── Sub-cards Grid ── */}
          <div className={styles.balanceSubCardsGrid}>
            <BalanceSubCard
              icon={TrendingUp}
              label={t('sellerDashboard.balance.totalEarning', 'Tổng thu nhập')}
              value={
                balance.totalEarning != null
                  ? formatCurrency(balance.totalEarning)
                  : '—'
              }
              sub={t('sellerDashboard.balance.totalEarningSub', 'Từ đơn hoàn thành')}
              accentColor="#52c41a"
              tooltipText={t(
                'sellerDashboard.balance.totalEarningTooltip',
                'Tổng doanh thu từ các đơn hàng đã hoàn thành'
              )}
            />

            <BalanceSubCard
              icon={ArrowDownToLine}
              label={t('sellerDashboard.balance.totalRefund', 'Tổng hoàn tiền')}
              value={
                balance.totalRefund != null
                  ? formatCurrency(balance.totalRefund)
                  : '—'
              }
              sub={t('sellerDashboard.balance.totalRefundSub', 'Từ đơn hủy/trả')}
              accentColor="#f5222d"
              tooltipText={t(
                'sellerDashboard.balance.totalRefundTooltip',
                'Tổng số tiền đã hoàn cho khách hàng'
              )}
            />

            <BalanceSubCard
              icon={ShoppingBag}
              label={t('sellerDashboard.balance.completedOrders', 'Đơn hoàn thành')}
              value={
                balance.completedOrders != null
                  ? Number(balance.completedOrders).toLocaleString('vi-VN')
                  : '—'
              }
              sub={t(
                'sellerDashboard.balance.totalOrders',
                '{{count}} đơn hàng',
                { count: balance.totalOrders ?? 0 }
              )}
              accentColor="#1677ff"
            />

            <BalanceSubCard
              icon={Clock}
              label={t('sellerDashboard.balance.pendingOrders', 'Đơn đang xử lý')}
              value={
                balance.pendingOrders != null
                  ? Number(balance.pendingOrders).toLocaleString('vi-VN')
                  : '—'
              }
              sub={t(
                'sellerDashboard.balance.pendingOrdersSub',
                'Chưa thanh toán / đang giao'
              )}
              accentColor="#fa8c16"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

SellerBalanceSection.propTypes = {
  onBalanceLoaded: PropTypes.func,
};

export default SellerBalanceSection;
