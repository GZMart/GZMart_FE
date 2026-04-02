import PropTypes from 'prop-types';
import { Card, Timeline, Tag, Empty } from 'antd';
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  ShoppingOutlined,
  TruckOutlined,
  HomeOutlined,
  CloseCircleOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import './OrderTracking.css';

const OrderTracking = ({ order }) => {
  if (!order) {
    return <Empty description="Không tìm thấy thông tin đơn hàng" />;
  }

  // Define tracking steps based on order lifecycle
  const getTrackingSteps = () => {
    const steps = [
      {
        status: 'pending',
        label: 'Chờ xác nhận',
        icon: ClockCircleOutlined,
        color: '#faad14',
      },
      {
        status: 'processing',
        label: 'Đang đóng gói',
        icon: ShoppingOutlined,
        color: '#1890ff',
      },
      {
        status: 'shipped',
        label: 'Đang giao hàng',
        icon: TruckOutlined,
        color: '#1890ff',
      },
      {
        status: 'delivered',
        label: 'Đã giao hàng',
        icon: HomeOutlined,
        color: '#52c41a',
      },
    ];

    // Handle special statuses
    if (order.status === 'completed') {
      steps.push({
        status: 'completed',
        label: 'Hoàn thành',
        icon: CheckCircleOutlined,
        color: '#52c41a',
      });
    } else if (order.status === 'cancelled') {
      return [
        {
          status: 'pending',
          label: 'Chờ xác nhận',
          icon: ClockCircleOutlined,
          color: '#faad14',
        },
        {
          status: 'cancelled',
          label: 'Đã hủy',
          icon: CloseCircleOutlined,
          color: '#ff4d4f',
        },
      ];
    } else if (order.status === 'refunded') {
      steps.push({
        status: 'refunded',
        label: 'Đã hoàn tiền',
        icon: DollarOutlined,
        color: '#722ed1',
      });
    }

    return steps;
  };

  const trackingSteps = getTrackingSteps();
  const currentStepIndex = trackingSteps.findIndex((s) => s.status === order.status);

  // Map status to display text
  const getStatusDisplay = (status) => {
    const statusMap = {
      pending: { text: 'Chờ xác nhận', color: 'warning' },
      processing: { text: 'Đang đóng gói', color: 'processing' },
      shipped: { text: 'Đang giao hàng', color: 'processing' },
      delivered: { text: 'Đã giao hàng', color: 'success' },
      delivered_pending_confirmation: { text: 'Chờ xác nhận giao hàng', color: 'success' },
      completed: { text: 'Hoàn thành', color: 'success' },
      cancelled: { text: 'Đã hủy', color: 'error' },
      refunded: { text: 'Đã hoàn tiền', color: 'purple' },
      refund_pending: { text: 'Chờ hoàn tiền', color: 'warning' },
      under_investigation: { text: 'Đang điều tra', color: 'default' },
    };
    return statusMap[status] || { text: status, color: 'default' };
  };

  const currentStatus = getStatusDisplay(order.status);

  // Format date
  const formatDate = (date) => {
    if (!date) {
      return '';
    }
    return new Date(date).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="order-tracking">
      {/* Current Status Banner */}
      <Card className="status-banner">
        <div className="status-info">
          <h3>Trạng thái hiện tại</h3>
          <Tag color={currentStatus.color} style={{ fontSize: '16px', padding: '8px 16px' }}>
            {currentStatus.text}
          </Tag>
        </div>
        {order.trackingNumber && (
          <div className="tracking-number">
            <strong>Mã vận đơn:</strong> {order.trackingNumber}
          </div>
        )}
        {order.estimatedDelivery && (
          <div className="estimated-delivery">
            <strong>Dự kiến giao:</strong> {formatDate(order.estimatedDelivery)}
          </div>
        )}
      </Card>

      {/* Progress Timeline */}
      <Card className="progress-timeline" title="Tiến trình đơn hàng">
        <div className="timeline-wrapper">
          <div className="timeline-track">
            {trackingSteps.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;

              return (
                <div
                  key={step.status}
                  className={`timeline-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}
                  style={{ left: `${(index / (trackingSteps.length - 1)) * 100}%` }}
                >
                  <div
                    className="step-icon"
                    style={{
                      backgroundColor: isCompleted ? step.color : '#d9d9d9',
                      borderColor: isCompleted ? step.color : '#d9d9d9',
                    }}
                  >
                    <Icon style={{ color: '#fff', fontSize: '20px' }} />
                  </div>
                  <div className="step-label">{step.label}</div>
                </div>
              );
            })}
            <div
              className="timeline-progress"
              style={{
                width: `${(currentStepIndex / (trackingSteps.length - 1)) * 100}%`,
                backgroundColor: trackingSteps[currentStepIndex]?.color || '#d9d9d9',
              }}
            />
          </div>
        </div>
      </Card>

      {/* Status History */}
      <Card className="status-history" title="Lịch sử đơn hàng">
        {order.statusHistory && order.statusHistory.length > 0 ? (
          <Timeline mode="left">
            {[...order.statusHistory].reverse().map((history, index) => {
              const statusInfo = getStatusDisplay(history.status);
              return (
                <Timeline.Item
                  key={index}
                  color={
                    statusInfo.color === 'error'
                      ? 'red'
                      : statusInfo.color === 'success'
                        ? 'green'
                        : statusInfo.color === 'processing'
                          ? 'blue'
                          : 'gray'
                  }
                  label={formatDate(history.changedAt)}
                >
                  <div className="history-item">
                    <div className="history-status">
                      <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
                    </div>
                    {history.reason && (
                      <div className="history-reason">
                        <strong>Lý do:</strong> {history.reason}
                      </div>
                    )}
                    {history.notes && (
                      <div className="history-notes">
                        <strong>Ghi chú:</strong> {history.notes}
                      </div>
                    )}
                    {history.changedByRole && (
                      <div className="history-actor">
                        <em>Bởi: {history.changedByRole}</em>
                      </div>
                    )}
                  </div>
                </Timeline.Item>
              );
            })}
          </Timeline>
        ) : (
          <Empty description="Chưa có lịch sử cập nhật" />
        )}
      </Card>

      {/* GHN Tracking Logs */}
      {order.ghnLogs && order.ghnLogs.length > 0 && (
        <Card className="ghn-tracking-logs" title="📦 Lịch trình vận chuyển (GHN)">
          <Timeline mode="left">
            {[...order.ghnLogs].reverse().map((log, index) => (
              <Timeline.Item
                key={index}
                color="blue"
                label={formatDate(log.updatedAt)}
                dot={<TruckOutlined style={{ fontSize: '16px' }} />}
              >
                <div className="ghn-log-item">
                  <div className="ghn-log-description">
                    <Tag color="blue">{log.status}</Tag>
                    <span>{log.description}</span>
                  </div>
                  {log.location && (
                    <div className="ghn-log-location">
                      <HomeOutlined /> {log.location}
                    </div>
                  )}
                  {log.reason && (
                    <div className="ghn-log-reason">
                      <em>{log.reason}</em>
                    </div>
                  )}
                </div>
              </Timeline.Item>
            ))}
          </Timeline>

          {order.ghnOrderCode && (
            <div className="ghn-info-footer">
              <p>
                <strong>Mã đơn GHN:</strong> {order.ghnOrderCode}
              </p>
              {order.ghnExpectedDeliveryTime && (
                <p>
                  <strong>Dự kiến giao:</strong> {formatDate(order.ghnExpectedDeliveryTime)}
                </p>
              )}
              {order.ghnShippingFee && (
                <p>
                  <strong>Phí vận chuyển:</strong> {order.ghnShippingFee.toLocaleString('vi-VN')} đ
                </p>
              )}
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

OrderTracking.propTypes = {
  order: PropTypes.shape({
    _id: PropTypes.string,
    orderNumber: PropTypes.string,
    status: PropTypes.string.isRequired,
    trackingNumber: PropTypes.string,
    estimatedDelivery: PropTypes.string,
    statusHistory: PropTypes.arrayOf(
      PropTypes.shape({
        status: PropTypes.string,
        changedAt: PropTypes.string,
        changedBy: PropTypes.string,
        changedByRole: PropTypes.string,
        reason: PropTypes.string,
        notes: PropTypes.string,
      })
    ),
    ghnLogs: PropTypes.arrayOf(
      PropTypes.shape({
        status: PropTypes.string,
        description: PropTypes.string,
        updatedAt: PropTypes.string,
        location: PropTypes.string,
        reason: PropTypes.string,
      })
    ),
    ghnOrderCode: PropTypes.string,
    ghnStatus: PropTypes.string,
    ghnExpectedDeliveryTime: PropTypes.string,
    ghnShippingFee: PropTypes.number,
  }),
};

export default OrderTracking;
