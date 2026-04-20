import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Clock,
  Truck,
  CheckCircle,
  AlertCircle,
  XCircle,
  RefreshCw,
  MessageSquare,
  Package,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import OrderStatusModal from '../../../components/seller/orders/OrderStatusModal';
import { orderSellerService } from '../../../services/api/orderSellerService';
import { chatService } from '../../../services/api/chatService';
import socketService from '@services/socket/socketService';
import { formatCurrency } from '../../../utils/formatters';
import styles from '@assets/styles/seller/OrdersPage.module.css';

/* ─── Configs ─────────────────────────────────────────────────── */
const normalizeLegacyStatus = (s) => {
  const n = String(s || '').trim();
  if (!n) {
    return n;
  }
  if (n === 'processing') {
    return 'confirmed';
  }
  if (n === 'packing') {
    return 'packed';
  }
  if (n === 'shipping') {
    return 'shipped';
  }
  if (n === 'delivered_pending_confirmation') {
    return 'delivered';
  }
  return n;
};

const STATUS_CONFIG = {
  pending: { labelKey: 'sellerOrders.status.pending', Icon: Clock, cls: 'statusPending' },
  confirmed: { labelKey: 'sellerOrders.status.confirmed', Icon: CheckCircle, cls: 'statusProcessing' },
  packed: { labelKey: 'sellerOrders.status.packed', Icon: Package, cls: 'statusProcessing' },
  shipped: { labelKey: 'sellerOrders.status.shipped', Icon: Truck, cls: 'statusShipped' },
  delivered: { labelKey: 'sellerOrders.status.delivered', Icon: CheckCircle, cls: 'statusDelivered' },
  completed: { labelKey: 'sellerOrders.status.completed', Icon: CheckCircle, cls: 'statusCompleted' },
  cancelled: { labelKey: 'sellerOrders.status.cancelled', Icon: XCircle, cls: 'statusCancelled' },
  refunded: { labelKey: 'sellerOrders.status.refunded', Icon: XCircle, cls: 'statusRefunded' },
  refund_pending: { labelKey: 'sellerOrders.status.refund_pending', Icon: RefreshCw, cls: 'statusRefundPending' },
  under_investigation: {
    labelKey: 'sellerOrders.status.under_investigation',
    Icon: AlertCircle,
    cls: 'statusUnderInvestigation',
  },
};

const PAYMENT_CONFIG = {
  pending: { labelKey: 'sellerOrders.paymentStatus.pending', Icon: Clock, cls: 'paymentPending' },
  paid: { labelKey: 'sellerOrders.paymentStatus.paid', Icon: CheckCircle, cls: 'paymentPaid' },
  completed: { labelKey: 'sellerOrders.paymentStatus.paid', Icon: CheckCircle, cls: 'paymentPaid' },
  failed: { labelKey: 'sellerOrders.paymentStatus.failed', Icon: XCircle, cls: 'paymentFailed' },
  refunded: { labelKey: 'sellerOrders.paymentStatus.refunded', Icon: XCircle, cls: 'paymentRefunded' },
  refund_pending: { labelKey: 'sellerOrders.paymentStatus.refund_pending', Icon: RefreshCw, cls: 'paymentPending' },
};

const STATUS_TABS = [
  { value: 'all', labelKey: 'sellerOrders.status.all' },
  { value: 'pending', labelKey: 'sellerOrders.status.pending' },
  { value: 'confirmed', labelKey: 'sellerOrders.status.confirmed' },
  { value: 'packed', labelKey: 'sellerOrders.status.packed' },
  { value: 'shipped', labelKey: 'sellerOrders.status.shipped' },
  { value: 'delivered', labelKey: 'sellerOrders.status.delivered' },
  { value: 'completed', labelKey: 'sellerOrders.status.completed' },
  { value: 'cancelled', labelKey: 'sellerOrders.status.cancelled' },
  { value: 'refund_pending', labelKey: 'sellerOrders.status.refund_pending' },
];

const ITEMS_PER_PAGE = 10;

/* ─── Helper Components ───────────────────────────────────────── */
const StatusBadge = ({ status, t }) => {
  const key = normalizeLegacyStatus(status);
  const config = STATUS_CONFIG[key] || {
    labelKey: null,
    label: status,
    Icon: AlertCircle,
    cls: 'statusDefault',
  };
  const { labelKey, label, Icon, cls } = config;
  return (
    <span className={`${styles.statusBadge} ${styles[cls]}`}>
      <Icon size={11} strokeWidth={2.5} />
      {labelKey ? t(labelKey) : label}
    </span>
  );
};
StatusBadge.propTypes = { status: PropTypes.string, t: PropTypes.func.isRequired };

const PaymentBadge = ({ status, t }) => {
  const config = PAYMENT_CONFIG[status] || {
    labelKey: null,
    label: status,
    Icon: AlertCircle,
    cls: 'paymentPending',
  };
  const { labelKey, label, Icon, cls } = config;
  return (
    <span className={`${styles.paymentBadge} ${styles[cls]}`}>
      <Icon size={10} strokeWidth={2.5} />
      {labelKey ? t(labelKey) : label}
    </span>
  );
};
PaymentBadge.propTypes = { status: PropTypes.string, t: PropTypes.func.isRequired };

/* ─── Main Component ──────────────────────────────────────────── */
const OrdersPage = () => {
  const { t, i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isRefetching, setIsRefetching] = useState(false);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [messagingBuyer, setMessagingBuyer] = useState(null);

  const [filters, setFilters] = useState({
    status: searchParams.get('status') || 'all',
    paymentMethod: 'all',
    shippingMethod: 'all',
    sortBy: 'newest-first',
    preOrderScope: 'all',
  });

  /* ─── Fetch Data ────────────────────────────────────────────── */
  const fetchOrders = useCallback(
    async (page, backgroundUpdate = false) => {
      try {
        if (!backgroundUpdate) {
          setLoading(true);
        } else {
          setIsRefetching(true);
        }

        setError(null);

        const params = { page, limit: ITEMS_PER_PAGE, sortBy: filters.sortBy };
        if (filters.status !== 'all') {
          params.status = filters.status;
        }
        if (filters.paymentMethod !== 'all') {
          params.paymentMethod = filters.paymentMethod;
        }
        if (filters.shippingMethod !== 'all') {
          params.shippingMethod = filters.shippingMethod;
        }
        if (filters.preOrderScope === 'has_preorder') {
          params.hasPreOrder = true;
        } else if (filters.preOrderScope === 'sla_breached') {
          params.preOrderSlaBreached = true;
        }

        const response = await orderSellerService.getAll(params);

        if (response.success) {
          setOrders(response.data || []);
          setTotalPages(response.pages || 1);
        } else {
          setError(t('sellerOrders.errorLoading'));
          setOrders([]);
        }
      } catch (err) {
        setError(err.message || t('sellerOrders.errorLoading'));
        setOrders([]);
      } finally {
        setLoading(false);
        setIsRefetching(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    fetchOrders(currentPage);
  }, [fetchOrders, currentPage]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  /* ─── Auto-Update (Socket.io) ───────────────────────────────── */
  useEffect(() => {
    const handleOrderChange = () => {
      fetchOrders(currentPage, true);
    };

    socketService.on('order_updated', handleOrderChange);
    socketService.on('new_order', handleOrderChange);
    socketService.on('seller:new-order', handleOrderChange);
    socketService.on('order_status_updated', handleOrderChange);

    return () => {
      socketService.off('order_updated', handleOrderChange);
      socketService.off('new_order', handleOrderChange);
      socketService.off('seller:new-order', handleOrderChange);
      socketService.off('order_status_updated', handleOrderChange);
    };
  }, [fetchOrders, currentPage]);

  /* ─── Handlers ──────────────────────────────────────────────── */
  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  const handleStatusTabClick = (value) => handleFilterChange('status', value);

  const handleCardClick = (orderId) => navigate(`/seller/orders/${orderId}`);

  const handleMessageBuyer = async (e, order) => {
    e.stopPropagation();
    const buyerId = order._originalData?.userId?._id || order._originalData?.userId;
    if (!buyerId) {
      return;
    }

    setMessagingBuyer(order._id);
    try {
      const res = await chatService.findOrCreateConversation(buyerId);
      const conversationId = res?._id || res?.data?._id;
      navigate('/seller/messages', { state: { conversationId } });
    } catch (err) {
      // Failed to open chat
    } finally {
      setMessagingBuyer(null);
    }
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleStatusModalClose = () => {
    setShowStatusModal(false);
    setSelectedOrder(null);
  };

  const handleStatusUpdateSuccess = () => {
    handleStatusModalClose();
    fetchOrders(currentPage, true);
  };

  /* ─── Derived Data ──────────────────────────────────────────── */
  const formattedOrders = orders.map((order) => ({
    key: order._id,
    _id: order._id,
    orderNumber: order.orderNumber,
    buyer: order.userId?.fullName || t('sellerOrders.order.customer'),
    buyerEmail: order.userId?.email || '',
    totalItems: order.items?.length || 0,
    totalPrice: order.totalPrice,
    status: order.status,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    shippingAddress: order.shippingAddress,
    createdAt: new Date(order.createdAt).toLocaleDateString('vi-VN'),
    preOrderSlaBreached: !!order.preOrderSlaBreached,
    items: (order.items || []).map((item) => ({
      _id: item._id,
      productName: item.productId?.name || t('sellerOrders.order.product', 'Unknown Product'),
      productImage: item.productId?.images?.[0] || null,
      price: item.price || 0,
      quantity: item.quantity || 1,
      sku: item.sku || '',
      tierDetails: item.tierDetails || {},
      model: item.tierSelections || {},
      isPreOrder: !!item.isPreOrder,
      preOrderDaysSnapshot: item.preOrderDaysSnapshot ?? 0,
      estimatedShipBy: item.estimatedShipBy || null,
    })),
    _originalData: order,
  }));

  const getPaginationPages = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages = [1];
    if (currentPage > 3) {
      pages.push('...');
    }
    for (
      let p = Math.max(2, currentPage - 1);
      p <= Math.min(totalPages - 1, currentPage + 1);
      p++
    ) {
      pages.push(p);
    }
    if (currentPage < totalPages - 2) {
      pages.push('...');
    }
    pages.push(totalPages);
    return pages;
  };

  /* ─── Render ────────────────────────────────────────────────── */
  const renderHeader = () => (
    <div className={styles.header}>
      <div className={styles.headerLeft}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h1>{t('sellerOrders.header.title')}</h1>
          {isRefetching && (
            <RefreshCw size={18} className={styles.spinAnimation} style={{ color: '#888' }} />
          )}
        </div>
        <p>{t('sellerOrders.header.subtitle')}</p>
      </div>
    </div>
  );

  if (loading && orders.length === 0) {
    return (
      <div className={styles.container}>
        {renderHeader()}
        <div className={styles.loadingContainer}>
          <div className={styles.spinner} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        {renderHeader()}
        <div className={styles.errorState}>
          <div className={styles.errorIconWrapper}>
            <AlertCircle size={20} />
          </div>
          <div className={styles.errorContent}>
            <div className={styles.errorTitle}>{t('sellerOrders.errorLoading')}</div>
            <div className={styles.errorMessage}>{error}</div>
          </div>
          <button className={styles.retryButton} onClick={() => fetchOrders(currentPage)}>
            {t('sellerOrders.retryButton')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {renderHeader()}

      <div className={styles.statusTabs}>
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            className={`${styles.statusTab} ${filters.status === tab.value ? styles.statusTabActive : ''}`}
            onClick={() => handleStatusTabClick(tab.value)}
          >
            {t(tab.labelKey)}
          </button>
        ))}
      </div>

      <div className={styles.filtersCard}>
        <div className={styles.filtersGrid}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>{t('sellerOrders.filters.payment')}</label>
            <select
              className={styles.filterSelect}
              value={filters.paymentMethod}
              onChange={(e) => handleFilterChange('paymentMethod', e.target.value)}
            >
              <option value="all">{t('sellerOrders.filters.paymentOptions.all')}</option>
              <option value="cash_on_delivery">{t('sellerOrders.filters.paymentOptions.cash_on_delivery')}</option>
              <option value="credit_card">{t('sellerOrders.filters.paymentOptions.credit_card')}</option>
              <option value="bank_transfer">{t('sellerOrders.filters.paymentOptions.bank_transfer')}</option>
              <option value="wallet">{t('sellerOrders.filters.paymentOptions.wallet')}</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>{t('sellerOrders.filters.sortBy')}</label>
            <select
              className={styles.filterSelect}
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            >
              <option value="newest-first">{t('sellerOrders.filters.sortOptions.newest_first')}</option>
              <option value="oldest-first">{t('sellerOrders.filters.sortOptions.oldest_first')}</option>
              <option value="highest-total">{t('sellerOrders.filters.sortOptions.highest_total')}</option>
              <option value="lowest-total">{t('sellerOrders.filters.sortOptions.lowest_total')}</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>{t('sellerOrders.filters.shipping')}</label>
            <select
              className={styles.filterSelect}
              value={filters.shippingMethod}
              onChange={(e) => handleFilterChange('shippingMethod', e.target.value)}
            >
              <option value="all">{t('sellerOrders.filters.shippingOptions.all')}</option>
              <option value="standard">{t('sellerOrders.filters.shippingOptions.standard')}</option>
              <option value="express">{t('sellerOrders.filters.shippingOptions.express')}</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>{t('sellerOrders.filters.preOrder.label')}</label>
            <select
              className={styles.filterSelect}
              value={filters.preOrderScope}
              onChange={(e) => handleFilterChange('preOrderScope', e.target.value)}
            >
              <option value="all">{t('sellerOrders.filters.preOrder.all')}</option>
              <option value="has_preorder">{t('sellerOrders.filters.preOrder.has_preorder')}</option>
              <option value="sla_breached">{t('sellerOrders.filters.preOrder.sla_breached')}</option>
            </select>
          </div>
        </div>
      </div>

      {formattedOrders.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyStateIconWrapper}>
            <Package size={28} strokeWidth={1.5} />
          </div>
          <div className={styles.emptyStateTitle}>{t('sellerOrders.empty.title')}</div>
          <div className={styles.emptyStateText}>
            {filters.status !== 'all'
              ? t('sellerOrders.empty.byStatus', STATUS_CONFIG[filters.status]?.labelKey ? t(STATUS_CONFIG[filters.status].labelKey) : filters.status)
              : filters.preOrderScope !== 'all'
                ? t('sellerOrders.empty.byPreOrderFilter')
                : t('sellerOrders.empty.default')}
          </div>
        </div>
      ) : (
        <div className={styles.ordersContainer}>
          {formattedOrders.map((order, cardIdx) => (
            <div
              key={order._id}
              className={styles.orderCard}
              style={{ animationDelay: `${cardIdx * 0.04}s` }}
              onClick={() => handleCardClick(order._id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleCardClick(order._id);
                }
              }}
            >
              {order.preOrderSlaBreached && (
                <div
                  className={styles.preorderSlaBanner}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                  role="alert"
                >
                  <AlertCircle size={16} strokeWidth={2} style={{ flexShrink: 0 }} />
                  <span>{t('sellerOrders.preorder.sla_breach_banner')}</span>
                </div>
              )}
              <div className={styles.orderHeaderRow}>
                <div className={styles.orderMeta}>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>{t('sellerOrders.order.orderId')}</span>
                    <span className={styles.metaValue}>{order.orderNumber}</span>
                  </div>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>{t('sellerOrders.order.date')}</span>
                    <span className={styles.metaValue}>{order.createdAt}</span>
                  </div>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>{t('sellerOrders.order.customer')}</span>
                    <span className={styles.metaValue}>{order.buyer}</span>
                  </div>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>{t('sellerOrders.order.status')}</span>
                    <span className={styles.metaValue}>
                      <StatusBadge status={order.status} t={t} />
                    </span>
                  </div>
                </div>

                <div className={styles.totalPriceItem}>
                  <span className={styles.metaLabel}>{t('sellerOrders.order.total')}</span>
                  <span className={`${styles.metaValue} ${styles.totalPriceValue}`}>
                    {formatCurrency(order.totalPrice)}
                  </span>
                  <PaymentBadge status={order.paymentStatus} t={t} />
                </div>
              </div>

              <hr className={styles.headerDivider} />

              <div className={styles.orderItemsWrapper}>
                {order.items.map((item, index) => (
                  <div key={`${order._id}-${index}`} className={styles.orderItem}>
                    <div className={styles.productImage}>
                      {item.productImage ? (
                        <img src={item.productImage} alt={item.productName} loading="lazy" />
                      ) : (
                        <div className={styles.productImagePlaceholder}>
                          <Package size={24} strokeWidth={1.5} />
                        </div>
                      )}
                    </div>

                    <div className={styles.productDetails}>
                      <h3 className={styles.productName}>{item.productName}</h3>
                      {item.isPreOrder && (
                        <>
                          <span className={styles.preorderLineBadge}>
                            {t('sellerOrders.preorder.badge')}
                          </span>
                          {item.estimatedShipBy && (
                            <p className={styles.preorderLineHint}>
                              {t('sellerOrders.preorder.ship_by', {
                                date: new Date(item.estimatedShipBy).toLocaleDateString(
                                  i18n.language?.startsWith('en') ? 'en-US' : 'vi-VN',
                                ),
                              })}
                            </p>
                          )}
                        </>
                      )}
                      <div className={styles.productAttributesList}>
                        <div className={styles.attributeItem}>
                          <span className={styles.attributeLabel}>{t('sellerOrders.order.qty')}</span>
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

                    {index === 0 && (
                      <div className={styles.orderActions}>
                        <button
                          className={`${styles.actionButton} ${styles.actionButtonOutline}`}
                          onClick={(e) => handleMessageBuyer(e, order)}
                          title={t('sellerOrders.order.message')}
                          disabled={messagingBuyer === order._id}
                        >
                          <MessageSquare size={13} />
                          {messagingBuyer === order._id ? t('sellerOrders.order.opening') : t('sellerOrders.order.message')}
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

      {totalPages > 1 && (
        <div className={styles.paginationContainer}>
          <button
            className={styles.paginationButton}
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label={t('sellerOrders.pagination.previous')}
          >
            <ChevronLeft size={16} />
          </button>

          {getPaginationPages().map((page, idx) =>
            page === '...' ? (
              <span key={`ellipsis-${idx}`} className={styles.paginationInfo}>
                …
              </span>
            ) : (
              <button
                key={page}
                className={`${styles.paginationButton} ${currentPage === page ? styles.paginationButtonActive : ''}`}
                onClick={() => handlePageChange(page)}
                aria-current={currentPage === page ? 'page' : undefined}
              >
                {page}
              </button>
            )
          )}

          <button
            className={styles.paginationButton}
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            aria-label={t('sellerOrders.pagination.next')}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

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
