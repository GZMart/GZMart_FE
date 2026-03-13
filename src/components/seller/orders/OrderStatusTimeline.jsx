import React from 'react';
import PropTypes from 'prop-types';

const OrderStatusTimeline = ({ history }) => {
  // Get status badge color
  const getStatusColor = (status) => {
    const statusColors = {
      pending: 'warning',
      processing: 'info',
      shipped: 'primary',
      delivered: 'success',
      delivered_pending_confirmation: 'info',
      completed: 'success',
      cancelled: 'danger',
      refunded: 'warning',
      refund_pending: 'warning',
      under_investigation: 'danger',
    };
    return statusColors[status] || 'secondary';
  };

  return (
    <div className="timeline">
      {history && history.length > 0 ? (
        history.map((entry, index) => (
          <div key={index} className="timeline-item mb-3">
            <div className="d-flex">
              {/* Timeline dot */}
              <div className="timeline-dot me-3" style={{ minWidth: '40px' }}>
                <div
                  className={`badge badge-${getStatusColor(entry.status)} p-2`}
                  style={{
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <i className="bi bi-check"></i>
                </div>
              </div>

              {/* Timeline content */}
              <div className="timeline-content flex-grow-1">
                <h6 className="mb-1">
                  <span
                    className="badge"
                    style={{ backgroundColor: getStatusColorCode(entry.status) }}
                  >
                    {entry.status?.replace(/_/g, ' ').toUpperCase()}
                  </span>
                </h6>
                {entry.reason && <p className="mb-1 text-muted">{entry.reason}</p>}
                {entry.notes && <p className="mb-1 text-muted">{entry.notes}</p>}
                <div className="small text-muted">
                  <p className="mb-1">
                    <strong>Changed by:</strong> {entry.changedBy?.name || 'System'} (
                    {entry.changedByRole?.toUpperCase() || 'SYSTEM'})
                  </p>
                  <p className="mb-0">
                    <strong>Date:</strong> {new Date(entry.changedAt).toLocaleString('vi-VN')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))
      ) : (
        <p className="text-muted">No status history available</p>
      )}
    </div>
  );
};

// Helper function to get hex color for status
const getStatusColorCode = (status) => {
  const statusColors = {
    pending: '#ffc107',
    processing: '#17a2b8',
    shipped: '#007bff',
    delivered: '#28a745',
    delivered_pending_confirmation: '#17a2b8',
    completed: '#28a745',
    cancelled: '#dc3545',
    refunded: '#ffc107',
    refund_pending: '#ffc107',
    under_investigation: '#dc3545',
  };
  return statusColors[status] || '#6c757d';
};

OrderStatusTimeline.propTypes = {
  history: PropTypes.array.isRequired,
};

export default OrderStatusTimeline;
