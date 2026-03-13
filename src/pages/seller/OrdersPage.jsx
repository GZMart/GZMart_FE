import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Clock, Cog, Truck, CheckCircle, AlertCircle, XCircle, RefreshCw, CreditCard, Wallet } from 'lucide-react';
import OrderStatusModal from '../../components/seller/orders/OrderStatusModal';
import { orderSellerService } from '../../services/api/orderSellerService';
import { formatCurrency } from '../../utils/formatters';
import styles from '../../assets/styles/seller/OrdersPage.module.css';

const OrdersPage = () => {
  const [searchParams] = useSearchParams();

  // State management
  const [orders, setOrders] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || 'all',
    paymentMethod: 'all',
    shippingMethod: 'all',
    sortBy: 'newest-first',
  });

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);

  const itemsPerPage = 10;

  // Order status options with labels
  const orderStatuses = [
    { value: 'all', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'processing', label: 'Processing' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'delivered_pending_confirmation', label: 'Pending Confirmation' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'refunded', label: 'Refunded' },
    { value: 'refund_pending', label: 'Refund Pending' },
    { value: 'under_investigation', label: 'Under Investigation' },
  ];

  // Status tag styling
  const statusTagColors = {
    pending: { bg: '#FFF3CD', color: '#856404', label: 'Pending', icon: Clock },
    processing: { bg: '#D1ECF1', color: '#0C5460', label: 'Processing', icon: Cog },
    shipped: { bg: '#D4EDDA', color: '#155724', label: 'Shipped', icon: Truck },
    delivered: { bg: '#D4EDDA', color: '#155724', label: 'Delivered', icon: CheckCircle },
    delivered_pending_confirmation: { bg: '#FFF3CD', color: '#856404', label: 'Pending Confirmation', icon: AlertCircle },
    completed: { bg: '#D4EDDA', color: '#155724', label: 'Completed', icon: CheckCircle },
    cancelled: { bg: '#F8D7DA', color: '#721C24', label: 'Cancelled', icon: XCircle },
    refunded: { bg: '#F8D7DA', color: '#721C24', label: 'Refunded', icon: XCircle },
    refund_pending: { bg: '#FFF3CD', color: '#856404', label: 'Refund Pending', icon: RefreshCw },
    under_investigation: { bg: '#E2E3E5', color: '#383D41', label: 'Under Investigation', icon: AlertCircle },
  };

  // Payment status tag styling
  const paymentStatusColors = {
    pending: { bg: '#FFF3CD', color: '#856404', label: 'Pending', icon: Clock },
    paid: { bg: '#D4EDDA', color: '#155724', label: 'Paid', icon: CheckCircle },
    completed: { bg: '#D4EDDA', color: '#155724', label: 'Paid', icon: CheckCircle },
    failed: { bg: '#F8D7DA', color: '#721C24', label: 'Failed', icon: XCircle },
    refunded: { bg: '#F8D7DA', color: '#721C24', label: 'Refunded', icon: XCircle },
    refund_pending: { bg: '#FFF3CD', color: '#856404', label: 'Refund Pending', icon: RefreshCw },
  };

  // Payment method icons
  const paymentMethodIcons = {
    cash_on_delivery: '💵 COD',
    credit_card: '💳 Thẻ tín dụng',
    debit_card: '💳 Thẻ ghi nợ',
    bank_transfer: '🏦 Bank',
    wallet: '👛 E-Wallet',
    paypal: '🅿️ PayPal',
  };

  // Fetch orders
  useEffect(() => {
    fetchOrders(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, currentPage]);

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPage]);

  const fetchOrders = async (page) => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page,
        limit: itemsPerPage,
        sortBy: filters.sortBy,
      };

      // Add status filter if not 'all'
      if (filters.status !== 'all') {
        params.status = filters.status;
      }

      // Add payment method filter if not 'all'
      if (filters.paymentMethod !== 'all') {
        params.paymentMethod = filters.paymentMethod;
      }

      // Add shipping method filter if not 'all'
      if (filters.shippingMethod !== 'all') {
        params.shippingMethod = filters.shippingMethod;
      }

      const response = await orderSellerService.getAll(params);

      if (response.success) {
        setOrders(response.data || []);
        setTotalPages(response.pages || 1);
      } else {
        setError('Failed to load orders');
        setOrders([]);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setError(err.message || 'Failed to load orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]: value,
    }));
    setCurrentPage(1); // Reset to first page
  };

  // eslint-disable-next-line no-unused-vars
  const handleViewDetails = (order) => {
    // Navigate to order details page
    window.location.href = `/seller/orders/${order._id}`;
  };

  // eslint-disable-next-line no-unused-vars
  const handleUpdateStatus = (order) => {
    setSelectedOrder(order);
    setShowStatusModal(true);
  };

  const handleStatusModalClose = () => {
    setShowStatusModal(false);
    setSelectedOrder(null);
  };

  const handleStatusUpdateSuccess = () => {
    handleStatusModalClose();
    fetchOrders(currentPage); // Refresh orders
  };

  // eslint-disable-next-line no-unused-vars
  const handleCancelOrder = async (orderId) => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      try {
        const response = await orderSellerService.cancel(orderId, {
          cancellationReason: 'Cancelled by seller',
        });

        if (response.success) {
          alert('Order cancelled successfully');
          fetchOrders(currentPage);
        } else {
          alert('Failed to cancel order');
        }
      } catch (err) {
        console.error('Error cancelling order:', err);
        alert('Error cancelling order');
      }
    }
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Format order data for display
  const formattedOrders = orders.map((order) => ({
    key: order._id,
    _id: order._id,
    orderNumber: order.orderNumber,
    buyer: order.userId?.fullName || 'Unknown',
    buyerEmail: order.userId?.email || '',
    buyerPhone: order.userId?.phone || '',
    totalItems: order.items?.length || 0,
    totalPrice: order.totalPrice,
    status: order.status,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    shippingAddress: order.shippingAddress,
    createdAt: new Date(order.createdAt).toLocaleDateString('vi-VN'),
    items: (order.items || []).map((item) => ({
      _id: item._id,
      productName: item.productId?.name || 'Unknown Product',
      productImage: item.productId?.images?.[0] || null,
      price: item.price || 0,
      quantity: item.quantity || 1,
      sku: item.sku || '',
      tierDetails: item.tierDetails || {},
      model: item.tierSelections || {},
    })),
    _originalData: order,
  }));

  // Show loading state
  if (loading && orders.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h1>Orders</h1>
            <p>Returned orders by customers.</p>
          </div>
        </div>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h1>Orders</h1>
            <p>Returned orders by customers.</p>
          </div>
        </div>
        <div className={styles.errorState}>
          <div className={styles.errorTitle}>⚠️ Error Loading Orders</div>
          <div className={styles.errorMessage}>{error}</div>
          <button className={styles.retryButton} onClick={() => fetchOrders(currentPage)}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>Orders</h1>
          <p>Returned orders by customers.</p>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filtersCard}>
        <div className={styles.filtersGrid}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Type</label>
            <select
              className={styles.filterSelect}
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              {orderStatuses.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Month</label>
            <select className={styles.filterSelect} defaultValue="all">
              <option value="all">All Months</option>
              <option value="january">January</option>
              <option value="february">February</option>
              <option value="march">March</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Urgency</label>
            <select className={styles.filterSelect} defaultValue="all">
              <option value="all">All Urgency</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders List */}
      {formattedOrders.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyStateIcon}>📦</div>
          <div className={styles.emptyStateTitle}>No Orders Found</div>
          <div className={styles.emptyStateText}>Try adjusting your filters or check back later</div>
        </div>
      ) : (
        <div className={styles.ordersContainer}>
          {formattedOrders.map((order) => (
            <div
              key={order._id}
              className={styles.orderCard}
              onClick={() => handleViewDetails(order._originalData)}
              role="button"
              tabIndex={0}
            >
              {/* Order Header with Meta Information */}
              <div className={styles.orderHeaderRow}>
                <div className={styles.orderMeta}>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Order ID</span>
                    <span className={styles.metaValue}>{order.orderNumber}</span>
                  </div>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Purchased</span>
                    <span className={styles.metaValue}>{order.createdAt}</span>
                  </div>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Customer</span>
                    <span className={styles.metaValue}>{order.buyer}</span>
                  </div>

                  {/* Status - Same format as other items */}
                  {(() => {
                    const statusConfig = statusTagColors[order.status];
                    const StatusIcon = statusConfig?.icon || AlertCircle;
                    return (
                      <div className={styles.metaItem}>
                        <span className={styles.metaLabel}>Status</span>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 10px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '600',
                            backgroundColor: statusConfig?.bg || '#E2E3E5',
                            color: statusConfig?.color || '#383D41',
                            whiteSpace: 'nowrap',
                            width: 'fit-content',
                          }}
                        >
                          <StatusIcon size={12} />
                          {statusConfig?.label || order.status}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Total and Payment Status - Right aligned */}
                <div className={`${styles.metaItem} ${styles.totalPriceItem}`}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', justifyContent: 'flex-start' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
                      <span className={styles.metaLabel} style={{ fontSize: '11px' }}>Total</span>
                      <span className={`${styles.metaValue} ${styles.totalPriceValue}`} style={{ fontSize: '14px', fontWeight: '700' }}>{formatCurrency(order.totalPrice)}</span>
                    </div>
                    {(() => {
                      const paymentConfig = paymentStatusColors[order.paymentStatus];
                      const PaymentIcon = paymentConfig?.icon || AlertCircle;
                      return (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                            padding: '3px 8px',
                            borderRadius: '3px',
                            fontSize: '10px',
                            fontWeight: '600',
                            backgroundColor: paymentConfig?.bg || '#E2E3E5',
                            color: paymentConfig?.color || '#383D41',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <PaymentIcon size={10} />
                          {paymentConfig?.label || order.paymentStatus}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>

              <hr className={styles.headerDivider} />

              {/* Order Items */}
              <div className={styles.orderItemsWrapper}>
                {order.items.map((item, index) => (
                  <div key={`${order._id}-${index}`} className={styles.orderItem}>
                    {/* Product Image */}
                    <div className={styles.productImage}>
                      {item.productImage ? (
                        <img src={item.productImage} alt={item.productName} />
                      ) : (
                        <div className={styles.productImagePlaceholder}>📷</div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className={styles.productDetails}>
                      <h3 className={styles.productName}>{item.productName}</h3>
                      <div className={styles.productAttributesList} style={{ display: 'flex', gap: '40px', flexWrap: 'wrap', justifyContent: 'space-between', maxWidth: '400px' }}>
                        <div className={styles.attributeItem}>
                          <span className={styles.attributeLabel}>Quantity:</span>
                          <span className={styles.attributeValue}>{item.quantity}</span>
                        </div>
                        {Object.entries(item.tierDetails || {}).map(([key, value]) => (
                          <div key={key} className={styles.attributeItem}>
                            <span className={styles.attributeLabel}>{key}:</span>
                            <span className={styles.attributeValue}>{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Status, Payment, and Actions - Only show on first item */}
                    {index === 0 && (
                      <div className={styles.orderActions}>
                        <button
                          className={`${styles.actionButton} ${styles.actionButtonOutline}`}
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                          title="Message Buyer"
                        >
                          MESSAGE BUYER
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.paginationContainer}>
          <button
            className={styles.paginationButton}
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span className={styles.paginationInfo}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            className={styles.paginationButton}
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}

      {/* Status Modal */}
      {selectedOrder && (
        <OrderStatusModal
          show={showStatusModal}
          order={selectedOrder}
          onHide={handleStatusModalClose}
          onSuccess={handleStatusUpdateSuccess}
        />
      )}
    </div>
  );
};

export default OrdersPage;
