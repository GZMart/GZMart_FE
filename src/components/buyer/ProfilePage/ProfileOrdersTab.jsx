import { useState } from 'react';
import PropTypes from 'prop-types';
import {
  AlertCircle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  FileText,
  MessageCircle,
  Package,
  Search,
  Store,
} from 'lucide-react';
import { Spinner } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import OrderTrackingEnhanced from '@components/buyer/OrderTrackingEnhanced';
import InvoiceModal from '@components/buyer/ProfilePage/InvoiceModal';
import styles from '@assets/styles/buyer/ProfilePage/ProfilePage.module.css';

function formatPreorderShipDate(iso, language) {
  if (!iso) {
    return '';
  }
  const loc = language?.startsWith('en') ? 'en-US' : 'vi-VN';
  return new Date(iso).toLocaleDateString(loc, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

const getStatusBadge = (status) => {
  const statusConfig = {
    pending: { class: styles.badgeWarning, text: 'Pending' },
    processing: { class: styles.badgeInfo, text: 'Processing' },
    confirmed: { class: styles.badgeInfo, text: 'Confirmed' },
    packing: { class: styles.badgeInfo, text: 'Packing' },
    shipping: { class: styles.badgeInfo, text: 'Shipping' },
    shipped: { class: styles.badgeInfo, text: 'Shipping' },
    delivered: { class: styles.badgeSuccess, text: 'Delivered' },
    delivered_pending_confirmation: { class: styles.badgeSuccess, text: 'Delivered' },
    completed: { class: styles.badgeSuccess, text: 'Completed' },
    cancelled: { class: styles.badgeDanger, text: 'Cancelled' },
    refunded: { class: styles.badgeWarning, text: 'Refunded' },
  };

  const config = statusConfig[status] || { class: styles.badgeInfo, text: status };
  return <span className={`${styles.badge} ${config.class}`}>{config.text}</span>;
};

const ProfileOrdersTab = ({
  t,
  orders,
  orderLoading,
  orderStatusFilter,
  setOrderStatusFilter,
  orderSearchQuery,
  setOrderSearchQuery,
  selectedOrder,
  setSelectedOrder,
  selectedOrderDetails,
  setSelectedOrderDetails,
  detailsLoading,
  pagination,
  handlePageChange,
  handleOrderClick,
  handleContactSeller,
  handleReorder,
  reorderLoadingId,
  handleOpenReviewModal,
  activeReturnRequest,
  setShowReturnModal,
  navigate,
  searchParams,
  setSearchParams,
  user,
  formatCurrency,
  setOrders,
  onViewReturnStatus,
}) => {
  const { i18n } = useTranslation();
  const [showInvoice, setShowInvoice] = useState(false);

  const orderStatusTabs = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending Payment' },
    { key: 'processing', label: 'Processing' },
    { key: 'shipping', label: 'Shipping' },
    { key: 'delivered', label: 'Delivered' },
    { key: 'completed', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled' },
    { key: 'return', label: 'Return/Refund' },
  ];

  const resolveEntityId = (entity) => {
    if (!entity) {
      return null;
    }
    if (typeof entity === 'string') {
      return entity;
    }
    if (typeof entity === 'object') {
      return entity._id || entity.id || null;
    }
    return null;
  };

  const handleViewShop = (seller) => {
    const sellerId = resolveEntityId(seller);
    if (!sellerId) {
      return;
    }
    navigate(`/shop/${sellerId}`);
  };

  const handleOpenProductDetails = (product, event) => {
    if (event?.stopPropagation) {
      event.stopPropagation();
    }
    const productId = resolveEntityId(product);
    if (!productId) {
      return;
    }
    navigate(`/product/${productId}`);
  };

  return (
    <div>
      {!selectedOrder ? (
        <>
          <div className={styles.orderFilterTabs}>
            {orderStatusTabs.map((tab) => (
              <button
                key={tab.key}
                className={`${styles.orderFilterTab} ${
                  orderStatusFilter === tab.key ? styles.orderFilterTabActive : ''
                }`}
                onClick={() => setOrderStatusFilter(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className={styles.orderSearchBar}>
            <Search size={20} color="#6b7280" />
            <input
              type="text"
              placeholder="Search by Shop name, Order ID or Product name"
              className={styles.orderSearchInput}
              value={orderSearchQuery}
              onChange={(e) => setOrderSearchQuery(e.target.value)}
            />
          </div>

          <div className={styles.ordersListContainer}>
            {orderLoading ? (
              <div style={{ textAlign: 'center', padding: '4rem', color: '#6B7280' }}>
                <Spinner animation="border" variant="primary" />
                <p className="mt-3 font-weight-bold">{t('profile_page.orders.loading')}</p>
              </div>
            ) : orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem', color: '#6B7280' }}>
                <Package size={64} color="#D1D5DB" strokeWidth={1.5} />
                <h4 style={{ marginTop: '1rem' }}>
                  {orderSearchQuery || orderStatusFilter !== 'all'
                    ? 'No orders found'
                    : t('profile_page.orders.empty_title')}
                </h4>
                <p>
                  {orderSearchQuery || orderStatusFilter !== 'all'
                    ? 'Try changing the filter or search keyword'
                    : t('profile_page.orders.empty_msg')}
                </p>
              </div>
            ) : (
              orders.map((order) => (
                <div key={order._id} className={styles.orderCard}>
                  <div className={styles.orderCardHeader}>
                    <div className={styles.orderCardHeaderLeft}>
                      <Store size={16} color="#B13C36" strokeWidth={2} />
                      <span className={styles.shopName}>
                        {order.items?.[0]?.productId?.sellerId?.fullName || 'GZMart Shop'}
                      </span>
                      <button
                        className={styles.shopChatBtn}
                        onClick={() =>
                          handleContactSeller(
                            order,
                            order.items?.[0]?.productId?.sellerId?._id ||
                              order.items?.[0]?.productId?.sellerId
                          )
                        }
                      >
                        <MessageCircle size={16} strokeWidth={2} />
                        Chat
                      </button>
                      <button
                        className={styles.shopViewBtn}
                        onClick={() => handleViewShop(order.items?.[0]?.productId?.sellerId)}
                      >
                        <Store size={16} strokeWidth={2} />
                        View Shop
                      </button>
                    </div>
                    <div className={styles.orderCardHeaderRight}>
                      <div className={styles.orderCardStatus}>{getStatusBadge(order.status)}</div>
                    </div>
                  </div>

                  <div className={styles.orderCardBody}>
                    {order.items?.slice(0, 3).map((item, idx) => (
                      <div
                        key={idx}
                        className={styles.orderCardItem}
                        onClick={() => handleOrderClick(order._id)}
                      >
                        <img
                          src={item.productId?.images?.[0] || 'https://via.placeholder.com/80'}
                          alt={item.productId?.name}
                          className={styles.orderCardItemImage}
                        />
                        <div className={styles.orderCardItemInfo}>
                          <h4
                            className={styles.orderCardItemName}
                            onClick={(event) => handleOpenProductDetails(item.productId, event)}
                            style={{ cursor: 'pointer' }}
                          >
                            {item.productId?.name || 'Product'}
                          </h4>
                          <p className={styles.orderCardItemVariant}>
                            Classification:{' '}
                            {item.tierSelections
                              ? Object.values(item.tierSelections).join(', ')
                              : 'Default'}
                          </p>
                          <p className={styles.orderCardItemQuantity}>x{item.quantity}</p>
                          {item.isPreOrder && (
                            <div className={styles.orderItemPreorderRow}>
                              <span className={styles.orderItemPreorderBadge}>
                                {t('profile_page.orders.preorder_badge')}
                              </span>
                              <p className={styles.orderItemPreorderText}>
                                {item.estimatedShipBy
                                  ? t('profile_page.orders.preorder_ship_by', {
                                      date: formatPreorderShipDate(
                                        item.estimatedShipBy,
                                        i18n.language
                                      ),
                                    })
                                  : t('profile_page.orders.preorder_within_days', {
                                      count: item.preOrderDaysSnapshot ?? 0,
                                    })}
                              </p>
                            </div>
                          )}
                        </div>
                        <div className={styles.orderCardItemPrice}>
                          <span className={styles.orderCardItemOldPrice}>
                            {formatCurrency(item.price * 1.2)}
                          </span>
                          <span className={styles.orderCardItemCurrentPrice}>
                            {formatCurrency(item.price)}
                          </span>
                        </div>
                      </div>
                    ))}
                    {order.items?.length > 3 && (
                      <div className={styles.orderCardMoreItems}>
                        And {order.items.length - 3} more product(s)...
                      </div>
                    )}
                  </div>

                  <div className={styles.orderCardFooter}>
                    <div className={styles.orderCardTotal}>
                      <span className={styles.orderCardTotalLabel}>Total Amount:</span>
                      <span className={styles.orderCardTotalAmount}>
                        {formatCurrency(order.totalPrice)}
                      </span>
                    </div>
                    <div className={styles.orderCardActions}>
                      <button
                        className={styles.orderCardActionSecondary}
                        onClick={() => handleReorder(order)}
                        disabled={reorderLoadingId === order._id}
                      >
                        {reorderLoadingId === order._id ? 'Reordering...' : 'Reorder'}
                      </button>
                      {order.status === 'completed' && (
                        <button
                          className={styles.orderCardActionSecondary}
                          onClick={() => handleOpenReviewModal(order)}
                        >
                          Review
                        </button>
                      )}
                      <button
                        className={styles.orderCardActionSecondary}
                        onClick={() =>
                          handleContactSeller(
                            order,
                            order.items?.[0]?.productId?.sellerId?._id ||
                              order.items?.[0]?.productId?.sellerId
                          )
                        }
                      >
                        Contact Seller
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {pagination.pages > 1 && (
            <div className={styles.paginationContainer}>
              <button
                className={styles.paginationBtn}
                disabled={pagination.page === 1}
                onClick={() => handlePageChange(pagination.page - 1)}
              >
                <ChevronLeft size={16} strokeWidth={2} />
                Previous
              </button>
              <span className={styles.paginationInfo}>
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                className={styles.paginationBtn}
                disabled={pagination.page === pagination.pages}
                onClick={() => handlePageChange(pagination.page + 1)}
              >
                Next
                <ChevronRight size={16} strokeWidth={2} />
              </button>
            </div>
          )}
        </>
      ) : (
        <div>
          {detailsLoading || !selectedOrderDetails ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#6B7280' }}>
              Loading details...
            </div>
          ) : (
            <>
              <div className={styles.orderDetailsHeader}>
                <button
                  className={styles.orderDetailsBackBtn}
                  onClick={() => {
                    setSelectedOrder(null);
                    setSelectedOrderDetails(null);
                    const nextParams = new URLSearchParams(searchParams);
                    nextParams.set('tab', 'orders');
                    nextParams.delete('orderId');
                    setSearchParams(nextParams);
                  }}
                >
                  <ArrowLeft size={18} strokeWidth={2} />
                  <span>BACK</span>
                </button>
                <div className={styles.orderDetailsHeaderInfo}>
                  <span className={styles.orderDetailsOrderNumber}>
                    ORDER ID: {selectedOrderDetails.orderNumber}
                  </span>
                  <span className={styles.orderDetailsHeaderDivider}>|</span>
                  {getStatusBadge(selectedOrderDetails.status)}
                </div>
              </div>

              {selectedOrderDetails.preOrderSlaBreached && (
                <div className={styles.buyerPreorderSlaBanner} role="alert">
                  <AlertCircle size={18} strokeWidth={2} />
                  <span>{t('profile_page.orders.preorder_sla_buyer_notice')}</span>
                </div>
              )}

              <div className={styles.orderDetailsSection}>
                <OrderTrackingEnhanced
                  order={selectedOrderDetails}
                  onOrderUpdate={(updatedData) => {
                    setSelectedOrderDetails(updatedData);
                    setOrders((prevOrders) =>
                      prevOrders.map((order) =>
                        order._id === updatedData._id ? { ...order, ...updatedData } : order
                      )
                    );
                    handleOrderClick(selectedOrderDetails._id);
                  }}
                />
              </div>

              <div className={styles.orderDetailsSection}>
                <h3 className={styles.orderDetailsSectionTitle}>Delivery Address</h3>
                <div className={styles.orderDetailsAddressBox}>
                  <div className={styles.orderDetailsAddressHeader}>
                    <div>
                      <p className={styles.orderDetailsAddressName}>
                        {selectedOrderDetails.userId?.fullName || user.fullName}
                      </p>
                      <p className={styles.orderDetailsAddressPhone}>
                        {selectedOrderDetails.userId?.phone || user.phone || '(+84) XXX XXX XXX'}
                      </p>
                    </div>
                  </div>
                  <p className={styles.orderDetailsAddressText}>
                    {selectedOrderDetails.shippingAddress}
                  </p>
                </div>
              </div>

              <div className={styles.orderDetailsSection}>
                <div className={styles.orderDetailsShopHeader}>
                  <div className={styles.orderDetailsShopHeaderLeft}>
                    <Store size={18} color="#B13C36" strokeWidth={2} />
                    <span className={styles.orderDetailsShopName}>
                      {selectedOrderDetails.items?.[0]?.productId?.sellerId?.fullName ||
                        'GZMart Shop'}
                    </span>
                    <button
                      className={styles.orderDetailsShopBtn}
                      onClick={() =>
                        handleContactSeller(
                          selectedOrderDetails,
                          selectedOrderDetails.items?.[0]?.productId?.sellerId?._id ||
                            selectedOrderDetails.items?.[0]?.productId?.sellerId
                        )
                      }
                    >
                      <MessageCircle size={16} strokeWidth={2} />
                      Chat
                    </button>
                    <button
                      className={styles.orderDetailsShopBtn}
                      onClick={() =>
                        handleViewShop(selectedOrderDetails.items?.[0]?.productId?.sellerId)
                      }
                    >
                      View Shop
                    </button>
                  </div>
                </div>

                <div className={styles.orderDetailsItemsList}>
                  {selectedOrderDetails.items?.map((item, idx) => (
                    <div key={idx} className={styles.orderDetailsItem}>
                      <img
                        src={item.productId?.images?.[0] || 'https://via.placeholder.com/80'}
                        alt={item.productId?.name}
                        className={styles.orderDetailsItemImage}
                      />
                      <div className={styles.orderDetailsItemInfo}>
                        <h4
                          className={styles.orderDetailsItemName}
                          onClick={(event) => handleOpenProductDetails(item.productId, event)}
                          style={{ cursor: 'pointer' }}
                        >
                          {item.productId?.name || 'Product'}
                        </h4>
                        <p className={styles.orderDetailsItemVariant}>
                          Classification:{' '}
                          {item.tierSelections
                            ? Object.values(item.tierSelections).join(', ')
                            : 'Default'}
                        </p>
                        <p className={styles.orderDetailsItemQuantity}>x{item.quantity}</p>
                        {item.isPreOrder && (
                          <div className={styles.orderDetailsPreorderRow}>
                            <span className={styles.orderItemPreorderBadge}>
                              {t('profile_page.orders.preorder_badge')}
                            </span>
                            <p className={styles.orderItemPreorderText}>
                              {item.estimatedShipBy
                                ? t('profile_page.orders.preorder_ship_by', {
                                    date: formatPreorderShipDate(
                                      item.estimatedShipBy,
                                      i18n.language
                                    ),
                                  })
                                : t('profile_page.orders.preorder_within_days', {
                                    count: item.preOrderDaysSnapshot ?? 0,
                                  })}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className={styles.orderDetailsItemPriceContainer}>
                        {item.originalPrice && item.originalPrice > item.price && (
                          <span className={styles.orderDetailsItemOldPrice}>
                            {formatCurrency(item.originalPrice)}
                          </span>
                        )}
                        <span className={styles.orderDetailsItemCurrentPrice}>
                          {formatCurrency(item.price)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className={styles.orderDetailsPricingBox}>
                  <div className={styles.orderDetailsPricingRow}>
                    <span className={styles.orderDetailsPricingLabel}>Merchandise Subtotal</span>
                    <span className={styles.orderDetailsPricingValue}>
                      {formatCurrency(selectedOrderDetails.subtotal)}
                    </span>
                  </div>
                  <div className={styles.orderDetailsPricingRow}>
                    <span className={styles.orderDetailsPricingLabel}>Shipping Fee</span>
                    <span className={styles.orderDetailsPricingValue}>
                      {formatCurrency(selectedOrderDetails.shippingCost)}
                    </span>
                  </div>
                  {selectedOrderDetails.discount > 0 && (
                    <div className={styles.orderDetailsPricingRow}>
                      <span className={styles.orderDetailsPricingLabel}>Discount</span>
                      <span
                        className={styles.orderDetailsPricingValue}
                        style={{ color: '#059669' }}
                      >
                        -{formatCurrency(selectedOrderDetails.discount)}
                      </span>
                    </div>
                  )}
                  <div className={styles.orderDetailsPricingRowTotal}>
                    <span className={styles.orderDetailsPricingLabelTotal}>Order Total</span>
                    <span className={styles.orderDetailsPricingValueTotal}>
                      {formatCurrency(selectedOrderDetails.totalPrice)}
                    </span>
                  </div>
                </div>

                <div className={styles.orderDetailsPaymentBox}>
                  <span className={styles.orderDetailsPaymentLabel}>Payment Method</span>
                  <span className={styles.orderDetailsPaymentValue}>
                    {selectedOrderDetails.paymentMethod?.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              <div className={styles.orderDetailsActions}>
                <button
                  className={styles.orderDetailsActionPrimary}
                  onClick={() => handleReorder(selectedOrderDetails)}
                  disabled={reorderLoadingId === selectedOrderDetails._id}
                >
                  {reorderLoadingId === selectedOrderDetails._id ? 'Reordering...' : 'Reorder'}
                </button>
                <button
                  className={styles.orderDetailsActionSecondary}
                  onClick={() => setShowInvoice(true)}
                >
                  Export Invoice
                </button>
                {selectedOrderDetails.status === 'completed' && (
                  <button
                    className={styles.orderDetailsActionSecondary}
                    onClick={() => handleOpenReviewModal(selectedOrderDetails)}
                  >
                    Add Rating
                  </button>
                )}
                <button
                  className={styles.orderDetailsActionSecondary}
                  onClick={() =>
                    handleContactSeller(
                      selectedOrderDetails,
                      selectedOrderDetails.items?.[0]?.productId?.sellerId?._id ||
                        selectedOrderDetails.items?.[0]?.productId?.sellerId
                    )
                  }
                >
                  Contact Seller
                </button>
                {(selectedOrderDetails.status === 'delivered' ||
                  selectedOrderDetails.status === 'completed' ||
                  activeReturnRequest?._id) && (
                  <button
                    className={styles.orderDetailsActionSecondary}
                    onClick={() => {
                      if (activeReturnRequest?._id) {
                        if (onViewReturnStatus) {
                          onViewReturnStatus(activeReturnRequest._id);
                        }
                        return;
                      }
                      setShowReturnModal(true);
                    }}
                  >
                    {activeReturnRequest?._id
                      ? 'View Refund/Return Status'
                      : 'Request Return/Refund'}
                  </button>
                )}
              </div>

              {showInvoice && (
                <InvoiceModal
                  order={selectedOrderDetails}
                  user={user}
                  formatCurrency={formatCurrency}
                  onClose={() => setShowInvoice(false)}
                />
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

ProfileOrdersTab.propTypes = {
  t: PropTypes.func.isRequired,
  orders: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string,
      status: PropTypes.string,
      items: PropTypes.arrayOf(
        PropTypes.oneOfType([
          PropTypes.string,
          PropTypes.shape({
            productId: PropTypes.oneOfType([
              PropTypes.string,
              PropTypes.shape({
                name: PropTypes.string,
                images: PropTypes.arrayOf(PropTypes.string),
                sellerId: PropTypes.oneOfType([
                  PropTypes.string,
                  PropTypes.shape({
                    _id: PropTypes.string,
                    fullName: PropTypes.string,
                  }),
                ]),
              }),
            ]),
            tierSelections: PropTypes.object,
            quantity: PropTypes.number,
            price: PropTypes.number,
            originalPrice: PropTypes.number,
            isPreOrder: PropTypes.bool,
          }),
        ])
      ),
      totalPrice: PropTypes.number,
    })
  ).isRequired,
  orderLoading: PropTypes.bool.isRequired,
  orderStatusFilter: PropTypes.string.isRequired,
  setOrderStatusFilter: PropTypes.func.isRequired,
  orderSearchQuery: PropTypes.string.isRequired,
  setOrderSearchQuery: PropTypes.func.isRequired,
  selectedOrder: PropTypes.any,
  setSelectedOrder: PropTypes.func.isRequired,
  selectedOrderDetails: PropTypes.shape({
    _id: PropTypes.string,
    orderNumber: PropTypes.string,
    status: PropTypes.string,
    userId: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        _id: PropTypes.string,
        fullName: PropTypes.string,
        phone: PropTypes.string,
      }),
    ]),
    shippingAddress: PropTypes.string,
    subtotal: PropTypes.number,
    shippingCost: PropTypes.number,
    discount: PropTypes.number,
    totalPrice: PropTypes.number,
    paymentMethod: PropTypes.string,
    items: PropTypes.arrayOf(PropTypes.any),
  }),
  setSelectedOrderDetails: PropTypes.func.isRequired,
  detailsLoading: PropTypes.bool.isRequired,
  pagination: PropTypes.shape({
    page: PropTypes.number.isRequired,
    pages: PropTypes.number.isRequired,
  }).isRequired,
  handlePageChange: PropTypes.func.isRequired,
  handleOrderClick: PropTypes.func.isRequired,
  handleContactSeller: PropTypes.func.isRequired,
  handleReorder: PropTypes.func.isRequired,
  reorderLoadingId: PropTypes.string,
  handleOpenReviewModal: PropTypes.func.isRequired,
  activeReturnRequest: PropTypes.shape({
    _id: PropTypes.string,
  }),
  setShowReturnModal: PropTypes.func.isRequired,
  navigate: PropTypes.func.isRequired,
  searchParams: PropTypes.any.isRequired,
  setSearchParams: PropTypes.func.isRequired,
  user: PropTypes.shape({
    fullName: PropTypes.string,
    phone: PropTypes.string,
  }).isRequired,
  formatCurrency: PropTypes.func.isRequired,
  setOrders: PropTypes.func.isRequired,
  onViewReturnStatus: PropTypes.func,
};

export default ProfileOrdersTab;
