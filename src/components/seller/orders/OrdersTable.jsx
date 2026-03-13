import React from 'react';
import PropTypes from 'prop-types';
import { Badge } from 'react-bootstrap';
import styles from '../../../assets/styles/seller/ListingsPage.module.css';

const OrdersTable = ({
  orders,
  currentPage,
  itemsPerPage,
  onViewDetails,
  onUpdateStatus,
  onCancelOrder,
}) => {
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

  // Get payment status badge color
  const getPaymentStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      completed: 'success',
      failed: 'danger',
      refunding: 'info',
      refunded: 'success',
    };
    return colors[status] || 'secondary';
  };

  return (
    <div className="table-responsive">
      <table className="table table-hover">
        <thead className="bg-light">
          <tr>
            <th>Order #</th>
            <th>Customer</th>
            <th>Items</th>
            <th>Total</th>
            <th>Status</th>
            <th>Payment</th>
            <th>Shipping</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders && orders.length > 0 ? (
            orders.map((order) => (
              <tr key={order.id}>
                <td>
                  <strong>{order.orderNumber}</strong>
                </td>
                <td>
                  <div>
                    <p className="mb-0">{order.buyer}</p>
                    <small className="text-muted">{order.buyerEmail}</small>
                  </div>
                </td>
                <td>{order.totalItems}</td>
                <td>
                  <strong>{order.totalPrice}</strong>
                </td>
                <td>
                  <Badge bg={getStatusColor(order.status)}>
                    {order.status.replace(/_/g, ' ').toUpperCase()}
                  </Badge>
                </td>
                <td>
                  <Badge bg={getPaymentStatusColor(order.paymentStatus)}>
                    {order.paymentStatus?.toUpperCase() || 'PENDING'}
                  </Badge>
                </td>
                <td>{order.shippingMethod?.toUpperCase()}</td>
                <td>
                  <small>{order.createdAt}</small>
                </td>
                <td>
                  <div className="btn-group btn-group-sm" role="group">
                    <button
                      type="button"
                      className="btn btn-outline-primary"
                      title="View Details"
                      onClick={() => onViewDetails(order._originalData)}
                    >
                      <i className="bi bi-eye"></i>
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-info"
                      title="Update Status"
                      onClick={() => onUpdateStatus(order._originalData)}
                      disabled={order.status === 'completed' || order.status === 'cancelled'}
                    >
                      <i className="bi bi-pencil"></i>
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-danger"
                      title="Cancel Order"
                      onClick={() => onCancelOrder(order.id)}
                      disabled={
                        order.status === 'completed' ||
                        order.status === 'cancelled' ||
                        order.status === 'shipped' ||
                        order.status === 'delivered'
                      }
                    >
                      <i className="bi bi-x"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="9" className="text-center py-4 text-muted">
                No orders found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

OrdersTable.propTypes = {
  orders: PropTypes.array.isRequired,
  currentPage: PropTypes.number.isRequired,
  itemsPerPage: PropTypes.number.isRequired,
  onViewDetails: PropTypes.func.isRequired,
  onUpdateStatus: PropTypes.func.isRequired,
  onCancelOrder: PropTypes.func.isRequired,
};

export default OrdersTable;
