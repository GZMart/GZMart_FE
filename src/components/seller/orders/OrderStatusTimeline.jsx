import PropTypes from 'prop-types';
import { Check, Clock, AlertTriangle, RefreshCw } from 'lucide-react';
import styles from '../../../assets/styles/seller/OrderStatusTimeline.module.css';

const STATUS_CONFIG = {
  pending:                       { dotClass: 'dotPending',                      labelClass: 'labelPending',                      Icon: Clock },
  processing:                    { dotClass: 'dotProcessing',                   labelClass: 'labelProcessing',                   Icon: RefreshCw },
  shipped:                       { dotClass: 'dotShipped',                      labelClass: 'labelShipped',                      Icon: Check },
  delivered:                     { dotClass: 'dotDelivered',                    labelClass: 'labelDelivered',                    Icon: Check },
  delivered_pending_confirmation:{ dotClass: 'dotDeliveredPendingConfirmation', labelClass: 'labelDeliveredPendingConfirmation', Icon: Clock },
  completed:                     { dotClass: 'dotCompleted',                    labelClass: 'labelCompleted',                    Icon: Check },
  cancelled:                     { dotClass: 'dotCancelled',                    labelClass: 'labelCancelled',                    Icon: AlertTriangle },
  refunded:                      { dotClass: 'dotRefunded',                     labelClass: 'labelRefunded',                     Icon: AlertTriangle },
  refund_pending:                { dotClass: 'dotRefundPending',                labelClass: 'labelRefundPending',                Icon: Clock },
  under_investigation:           { dotClass: 'dotUnderInvestigation',           labelClass: 'labelUnderInvestigation',           Icon: AlertTriangle },
};

const formatStatus = (status) =>
  (status || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const OrderStatusTimeline = ({ history }) => {
  if (!history || history.length === 0) {
    return <p className={styles.emptyText}>No status history available</p>;
  }

  return (
    <div className={styles.timeline}>
      {history.map((entry, index) => {
        const config = STATUS_CONFIG[entry.status] || { dotClass: 'dotDefault', labelClass: 'labelDefault', Icon: Clock };
        const { Icon } = config;

        return (
          <div key={index} className={styles.timelineItem}>
            {/* Dot */}
            <div className={`${styles.dot} ${styles[config.dotClass]}`}>
              <Icon strokeWidth={2.5} />
            </div>

            {/* Content */}
            <div className={styles.content}>
              <span className={`${styles.statusLabel} ${styles[config.labelClass]}`}>
                {formatStatus(entry.status)}
              </span>

              {entry.reason && (
                <p className={styles.reason}>{entry.reason}</p>
              )}

              {entry.notes && (
                <p className={styles.notes}>{entry.notes}</p>
              )}

              <div className={styles.meta}>
                <span>
                  <strong>By:</strong>{' '}
                  {entry.changedBy?.name || 'System'}
                  {entry.changedByRole ? ` (${entry.changedByRole.toUpperCase()})` : ''}
                </span>
                <span>
                  <strong>On:</strong>{' '}
                  {new Date(entry.changedAt).toLocaleString('vi-VN')}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

OrderStatusTimeline.propTypes = {
  history: PropTypes.array.isRequired,
};

export default OrderStatusTimeline;
