import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft, Printer, Trash2, Edit, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import OrderStatusModal from '../../components/seller/orders/OrderStatusModal';
import OrderStatusTimeline from '../../components/seller/orders/OrderStatusTimeline';
import { orderSellerService } from '../../services/api/orderSellerService';
import { formatCurrency } from '../../utils/formatters';
import styles from '../../assets/styles/seller/OrderDetailsPage.module.css';

const OrderDetailsPage = () => {
  const { id: orderId } = useParams();

  const [order, setOrder] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch order details
  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const [orderResponse, historyResponse] = await Promise.all([
          orderSellerService.getById(orderId),
          orderSellerService.getHistory(orderId),
        ]);

        if (orderResponse.success) {
          setOrder(orderResponse.data);
        } else {
          setError('Failed to load order details');
        }

        if (historyResponse.success) {
          setHistory(historyResponse.data?.history || []);
        }
      } catch (err) {
        console.error('Failed to fetch order details:', err);
        setError(err.message || 'Failed to load order details');
      } finally {
        setLoading(false);
      }
    };
    fetchOrderDetails();
  }, [orderId]);

  const refetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const [orderResponse, historyResponse] = await Promise.all([
        orderSellerService.getById(orderId),
        orderSellerService.getHistory(orderId),
      ]);

      if (orderResponse.success) {
        setOrder(orderResponse.data);
      } else {
        setError('Failed to load order details');
      }

      if (historyResponse.success) {
        setHistory(historyResponse.data?.history || []);
      }
    } catch (err) {
      console.error('Failed to fetch order details:', err);
      setError(err.message || 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusModalClose = () => {
    setShowStatusModal(false);
  };

  const handleStatusUpdateSuccess = () => {
    handleStatusModalClose();
    refetchOrderDetails();
  };

  const handleCancelOrder = async () => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      try {
        setActionLoading(true);
        const response = await orderSellerService.cancel(orderId, {
          cancellationReason: 'Cancelled by seller',
        });

        if (response.success) {
          alert('Order cancelled successfully');
          refetchOrderDetails();
        } else {
          alert('Failed to cancel order');
        }
      } catch (err) {
        console.error('Error cancelling order:', err);
        alert('Error cancelling order');
      } finally {
        setActionLoading(false);
      }
    }
  };

  const handlePrintDeliveryNote = async () => {
    try {
      setActionLoading(true);
      const response = await orderSellerService.getDeliveryNote(orderId);

      if (response.success) {
        // Create a new window with the HTML content
        const printWindow = window.open('', '', 'height=600,width=800');
        printWindow.document.write(response.html || response.data?.html);
        printWindow.document.close();
        printWindow.print();
      } else {
        alert('Failed to generate delivery note');
      }
    } catch (err) {
      console.error('Error generating delivery note:', err);
      alert('Error generating delivery note');
    } finally {
      setActionLoading(false);
    }
  };

  // Get status badge info
  const getStatusBadgeInfo = (status) => {
    const statusInfo = {
      pending: { bg: styles.statusPending, label: 'Pending', icon: Clock },
      processing: { bg: styles.statusProcessing, label: 'Processing', icon: Clock },
      shipped: { bg: styles.statusShipped, label: 'Shipped', icon: CheckCircle },
      delivered: { bg: styles.statusDelivered, label: 'Delivered', icon: CheckCircle },
      delivered_pending_confirmation: {
        bg: styles.statusPendingConfirmation,
        label: 'Pending Confirmation',
        icon: AlertCircle,
      },
      completed: { bg: styles.statusCompleted, label: 'Completed', icon: CheckCircle },
      cancelled: { bg: styles.statusCancelled, label: 'Cancelled', icon: AlertCircle },
      refunded: { bg: styles.statusRefunded, label: 'Refunded', icon: AlertCircle },
      refund_pending: { bg: styles.statusPending, label: 'Refund Pending', icon: Clock },
      under_investigation: {
        bg: styles.statusUnderInvestigation,
        label: 'Under Investigation',
        icon: AlertCircle,
      },
    };
    return statusInfo[status] || statusInfo.pending;
  };

  // Get payment status badge info
  const getPaymentStatusBadgeInfo = (status) => {
    const paymentStatusInfo = {
      pending: { bg: styles.paymentPending, label: 'Pending', icon: Clock },
      paid: { bg: styles.paymentPaid, label: 'Paid', icon: CheckCircle },
      completed: { bg: styles.paymentCompleted, label: 'Paid', icon: CheckCircle },
      failed: { bg: styles.paymentFailed, label: 'Failed', icon: AlertCircle },
      refunded: { bg: styles.paymentRefunded, label: 'Refunded', icon: AlertCircle },
      refund_pending: { bg: styles.paymentPending, label: 'Refund Pending', icon: Clock },
    };
    return paymentStatusInfo[status] || paymentStatusInfo.pending;
  };

  // Prepare items table data
  const itemsTableData =
    order?.items?.map((item, idx) => ({
      key: idx,
      productName: item.productId?.name || 'Unknown Product',
      sku: item.sku || 'N/A',
      quantity: item.quantity,
      price: item.price,
      subtotal: item.subtotal,
      tierSelections: item.tierSelections,
    })) || [];

  // Show loading state
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !order) {
    return (
      <div className={styles.container}>
        <button
          className={styles.backButton}
          onClick={() => (window.location.href = '/seller/orders')}
          title="Back to Orders"
        >
          <ArrowLeft size={18} />
        </button>
        <div className={styles.errorState}>
          <div className={styles.errorIcon}>⚠️</div>
          <div className={styles.errorTitle}>Error Loading Order</div>
          <div className={styles.errorMessage}>{error || 'Order not found'}</div>
          <button
            className={styles.actionButtonPrimary}
            style={{ margin: '0 auto' }}
            onClick={() => (window.location.href = '/seller/orders')}
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Back Button */}
      <button
        className={styles.backButton}
        onClick={() => (window.location.href = '/seller/orders')}
        title="Back to Orders"
      >
        <ArrowLeft size={18} />
      </button>

      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1>Order #{order.orderNumber}</h1>
          <p>Created on {new Date(order.createdAt).toLocaleDateString('vi-VN')}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.content}>
        {/* Left Column */}
        <div>
          {/* Order Summary Card */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Order Summary</h3>
              <div className={styles.statusBadges}>
                {(() => {
                  const orderStatus = getStatusBadgeInfo(order.status);
                  const OrderStatusIcon = orderStatus.icon;
                  return (
                    <div className={`${styles.badge} ${orderStatus.bg}`}>
                      <OrderStatusIcon size={14} />
                      Order: {orderStatus.label}
                    </div>
                  );
                })()}
                {(() => {
                  const paymentStatus = getPaymentStatusBadgeInfo(order.paymentStatus);
                  const PaymentStatusIcon = paymentStatus.icon;
                  return (
                    <div className={`${styles.badge} ${paymentStatus.bg}`}>
                      <PaymentStatusIcon size={14} />
                      Payment: {paymentStatus.label}
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className={styles.infoGrid}>
              <div className={styles.infoGroup}>
                <span className={styles.infoLabel}>Customer</span>
                <span className={styles.infoValue}>
                  {order.userId?.fullName || order.userId?.name || 'Unknown'}
                </span>
              </div>
              <div className={styles.infoGroup}>
                <span className={styles.infoLabel}>Email</span>
                <span className={styles.infoValue}>{order.userId?.email || 'N/A'}</span>
              </div>
            </div>

            <div className={styles.infoGrid}>
              <div className={styles.infoGroup}>
                <span className={styles.infoLabel}>Order Date</span>
                <span className={styles.infoValue}>
                  {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                </span>
              </div>
              <div className={styles.infoGroup}>
                <span className={styles.infoLabel}>Order Time</span>
                <span className={styles.infoValue}>
                  {new Date(order.createdAt).toLocaleTimeString('vi-VN')}
                </span>
              </div>
            </div>

            <div className={styles.infoDivider}></div>

            <div className={styles.infoGrid}>
              <div className={styles.infoGroup}>
                <span className={styles.infoLabel}>Shipping Address</span>
                <span className={styles.infoValue}>{order.shippingAddress}</span>
              </div>
              <div className={styles.infoGroup}>
                <span className={styles.infoLabel}>Shipping Method</span>
                <span className={styles.infoValue}>
                  {order.shippingMethod?.toUpperCase() || 'N/A'}
                </span>
              </div>
            </div>

            <div className={styles.infoGrid}>
              <div className={styles.infoGroup}>
                <span className={styles.infoLabel}>Payment Method</span>
                <span className={styles.infoValue}>
                  {order.paymentMethod?.toUpperCase().replace(/_/g, ' ') || 'N/A'}
                </span>
              </div>
              <div className={styles.infoGroup}>
                <span className={styles.infoLabel}>Notes</span>
                <span className={styles.infoValue}>{order.notes || 'No notes'}</span>
              </div>
            </div>
          </div>

          {/* Order Items Card */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Order Items ({order.items?.length || 0})</h3>
            </div>

            <table className={styles.itemsTable}>
              <thead className={styles.tableHeader}>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th style={{ textAlign: 'center' }}>Qty</th>
                  <th style={{ textAlign: 'right' }}>Price</th>
                  <th style={{ textAlign: 'right' }}>Subtotal</th>
                </tr>
              </thead>
              <tbody className={styles.tableBody}>
                {itemsTableData.map((item) => (
                  <tr key={item.key}>
                    <td>
                      <div className={styles.productCell}>
                        <span className={styles.productName}>{item.productName}</span>
                        {item.tierSelections && Object.keys(item.tierSelections).length > 0 && (
                          <span className={styles.productTier}>
                            {Object.entries(item.tierSelections)
                              .map(([key, value]) => `${key}: ${value}`)
                              .join(', ')}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>{item.sku}</td>
                    <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(item.price)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <strong>{formatCurrency(item.subtotal)}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Status Timeline Card */}
          {history.length > 0 && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Status History</h3>
              </div>
              <OrderStatusTimeline history={history} />
            </div>
          )}
        </div>

        {/* Right Column */}
        <div>
          {/* Order Total Card */}
          <div className={styles.totalCard}>
            <h3 className={styles.cardTitle} style={{ marginBottom: '16px' }}>
              Order Total
            </h3>

            <div className={styles.totalRow}>
              <span className={styles.totalLabel}>Subtotal:</span>
              <span className={styles.totalValue}>{formatCurrency(order.subtotal || 0)}</span>
            </div>

            <div className={styles.totalRow}>
              <span className={styles.totalLabel}>Shipping:</span>
              <span className={styles.totalValue}>{formatCurrency(order.shippingCost || 0)}</span>
            </div>

            {order.tax > 0 && (
              <div className={styles.totalRow}>
                <span className={styles.totalLabel}>Tax:</span>
                <span className={styles.totalValue}>{formatCurrency(order.tax)}</span>
              </div>
            )}

            {order.discount > 0 && (
              <div className={styles.totalRow}>
                <span className={styles.totalLabel}>Discount:</span>
                <span className={`${styles.totalValue} ${styles.discountValue}`}>
                  -{formatCurrency(order.discount)}
                </span>
              </div>
            )}

            <div className={styles.totalDivider}></div>

            <div className={styles.totalFinal}>
              <span className={styles.totalFinalLabel}>Total:</span>
              <span className={styles.totalFinalValue}>{formatCurrency(order.totalPrice)}</span>
            </div>
          </div>

          {/* Actions Card */}
          <div className={styles.actionsCard}>
            <div className={styles.actionsList}>
              <button
                className={`${styles.actionButton} ${styles.actionButtonPrimary}`}
                onClick={() => setShowStatusModal(true)}
                disabled={order.status === 'completed' || order.status === 'cancelled'}
              >
                <Edit size={16} />
                Update Status
              </button>

              <button
                className={`${styles.actionButton} ${styles.actionButtonSecondary}`}
                onClick={handlePrintDeliveryNote}
                disabled={actionLoading}
              >
                <Printer size={16} />
                Print Delivery
              </button>

              <button
                className={`${styles.actionButton} ${styles.actionButtonDanger}`}
                onClick={handleCancelOrder}
                disabled={
                  order.status === 'completed' || order.status === 'cancelled' || actionLoading
                }
              >
                <Trash2 size={16} />
                Cancel Order
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Status Update Modal */}
      {order && (
        <OrderStatusModal
          show={showStatusModal}
          order={order}
          onHide={handleStatusModalClose}
          onSuccess={handleStatusUpdateSuccess}
        />
      )}
    </div>
  );
};

export default OrderDetailsPage;
