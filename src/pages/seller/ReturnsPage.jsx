import { useState, useEffect, useCallback } from 'react';
import { Dropdown, Spinner } from 'react-bootstrap';
import { message } from 'antd';
import { useTranslation } from 'react-i18next';
import ListingsPagination from '../../components/seller/listings/ListingsPagination';
import ReturnDetailsModal from '../../components/seller/returns/ReturnDetailsModal';
import rmaService from '@services/api/rmaService';
import socketService from '@services/socket/socketService';
import { useSelector } from 'react-redux';
import styles from '@assets/styles/seller/ListingsPage.module.css';

/* ── Config ──────────────────────────────────────────────────────── */
const STATUS_TABS = (t) => [
  { value: 'all', labelKey: 'sellerReturns.status.all' },
  { value: 'pending', labelKey: 'sellerReturns.status.pending' },
  { value: 'approved', labelKey: 'sellerReturns.status.approved' },
  { value: 'rejected', labelKey: 'sellerReturns.status.rejected' },
  { value: 'items_returned', labelKey: 'sellerReturns.status.items_returned' },
  { value: 'processing', labelKey: 'sellerReturns.status.processing' },
  { value: 'completed', labelKey: 'sellerReturns.status.completed' },
];

const BADGE_MAP = (t) => ({
  pending: { labelKey: 'sellerReturns.status.pending_review', cls: styles.badgePending },
  approved: { labelKey: 'sellerReturns.status.approved', cls: styles.badgeApproved },
  rejected: { labelKey: 'sellerReturns.status.rejected', cls: styles.badgeRejected },
  items_returned: { labelKey: 'sellerReturns.status.items_returned', cls: styles.badgeApproved },
  processing: { labelKey: 'sellerReturns.status.processing', cls: styles.badgeApproved },
  completed: { labelKey: 'sellerReturns.status.completed', cls: styles.badgeRefunded },
});

const ITEMS_PER_PAGE = 8;

/* ─────────────────────────────────────────────────────────────────── */
const ReturnsPage = () => {
  const { t } = useTranslation();
  const user = useSelector((state) => state.auth?.user);
  const [statusTab, setStatusTab] = useState('all');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const mapRequestToRow = (req) => ({
    id: req.requestNumber || req._id,
    orderId: req.orderId?.orderNumber || t('sellerReturns.table.order'),
    customer: req.userId?.fullName || req.userId?.email || t('sellerReturns.table.customer'),
    image: req.images?.[0] || null,
    product: req.items?.[0]?.productId?.name || t('sellerReturns.table.product'),
    category: req.items?.[0]?.productId?.categoryId?.name || 'General',
    price:
      req?.refund?.amount ||
      req?.totalRefundAmount ||
      (req?.items || []).reduce(
        (sum, item) => sum + Number(item?.price || 0) * Number(item?.quantity || 0),
        0
      ),
    status: req.status,
    reason: req.reason?.replace(/_/g, ' ') || t('sellerReturns.table.reason'),
    exchangeEligibility: req.exchangeEligibility || { canExchange: false, checks: [] },
    resolution: req.type,
    date: new Date(req.createdAt).toLocaleDateString('vi-VN'),
    rawDate: req.createdAt,
    _original: req,
  });

  const fetchReturnRequests = useCallback(async (options = {}) => {
    const { silent = false } = options;
    try {
      if (!silent) {
        setLoading(true);
      }
      setError(null);
      const response = await rmaService.getSellerReturnRequests();

      if (response.success && response.data) {
        const transformedData = response.data.map(mapRequestToRow);

        setReturns(transformedData);
      } else {
        setReturns([]);
      }
    } catch (err) {
      console.error('[ReturnsPage] Error fetching return requests:', err);
      setError(t('sellerReturns.errorLoading'));
      message.error(t('sellerReturns.errorLoading'));
      setReturns([]);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchReturnRequests();
  }, [fetchReturnRequests]);

  // Realtime refresh for status updates
  useEffect(() => {
    socketService.connect(user?._id);
    socketService.setUserId(user?._id);

    const handleRmaUpdated = () => {
      fetchReturnRequests({ silent: true });
    };

    socketService.on('rma:request-updated', handleRmaUpdated);

    return () => {
      socketService.off('rma:request-updated', handleRmaUpdated);
    };
  }, [fetchReturnRequests, user?._id]);

  const filtered = returns
    .filter((r) => statusTab === 'all' || r.status === statusTab)
    .filter((r) => {
      const q = search.toLowerCase();
      return (
        !q ||
        r.product.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q) ||
        r.customer.toLowerCase().includes(q)
      );
    });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const counts = (status) =>
    status === 'all' ? returns.length : returns.filter((r) => r.status === status).length;

  const handleViewDetails = (returnRequest) => {
    setSelectedReturn(returnRequest);
    setShowDetailsModal(true);
  };

  const handleCloseModal = () => {
    setShowDetailsModal(false);
    setSelectedReturn(null);
  };

  const handleModalSuccess = (updatedRequest, options = {}) => {
    const { keepOpen = false } = options;

    fetchReturnRequests();

    if (keepOpen && updatedRequest) {
      setSelectedReturn(mapRequestToRow(updatedRequest));
      return;
    }

    handleCloseModal();
  };

  const handleQuickAction = async (returnRequest, action) => {
    try {
      setLoading(true);

      if (action === 'approve' || action === 'reject') {
        await rmaService.respondToReturnRequest(returnRequest._original._id, {
          decision: action,
          notes: '',
        });
        message.success(action === 'approve'
          ? t('sellerReturns.quickAction.successApprove')
          : t('sellerReturns.quickAction.successReject'));
        fetchReturnRequests();
      }
    } catch (err) {
      console.error(`Error ${action}ing return:`, err);
      message.error(action === 'approve'
        ? t('sellerReturns.quickAction.errorApprove')
        : t('sellerReturns.quickAction.errorReject'));
    } finally {
      setLoading(false);
    }
  };

  const formatVND = (n) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

  return (
    <div className={styles.listingsPage}>
      {/* ── Header ────────────────────────────────────────── */}
      <div className={styles.listingsHeader}>
        <div className={styles.headerContent}>
          <div className={styles.titleSection}>
            <h1 className={styles.pageTitle}>{t('sellerReturns.title')}</h1>
            <p className={styles.pageSubtitle}>{t('sellerReturns.subtitle')}</p>
          </div>
        </div>

        {/* Stats */}
        <div className={styles.statsRow}>
          {[
            { label: t('sellerReturns.stats.total'), val: returns.length },
            {
              label: t('sellerReturns.stats.pending'),
              val: returns.filter((r) => r.status === 'pending').length,
              cls: styles.statInactive,
            },
            {
              label: t('sellerReturns.stats.approved'),
              val: returns.filter((r) => r.status === 'approved').length,
              cls: styles.statActive,
            },
            {
              label: t('sellerReturns.stats.refunded'),
              val: returns.filter((r) => r.status === 'completed').length,
              cls: styles.statDraft,
            },
          ].map(({ label, val, cls }) => (
            <div key={label} className={styles.statPill}>
              <span className={`${styles.statNum} ${cls || ''}`}>{val}</span>
              <span className={styles.statLabel}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Toolbar ───────────────────────────────────────── */}
      <div className={styles.toolbar}>
        <div className={styles.tabsGroup}>
          {STATUS_TABS(t).map((tab) => (
            <button
              key={tab.value}
              className={`${styles.tab} ${statusTab === tab.value ? styles.tabActive : ''}`}
              onClick={() => {
                setStatusTab(tab.value);
                setCurrentPage(1);
              }}
            >
              {t(tab.labelKey)}
              <span className={styles.tabCount}>{counts(tab.value)}</span>
            </button>
          ))}
        </div>

        <div className={styles.toolbarRight}>
          <div className={styles.searchBox}>
            <svg
              className={styles.searchIcon}
              width="14"
              height="14"
              viewBox="0 0 20 20"
              fill="none"
            >
              <circle cx="8.5" cy="8.5" r="6.5" stroke="currentColor" strokeWidth="1.8" />
              <path d="M14 14l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              className={styles.searchInput}
              placeholder={t('sellerReturns.searchPlaceholder')}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Table Card ────────────────────────────────────── */}
      <div className={styles.tableCard}>
        {loading ? (
          <div className={styles.emptyState}>
            <Spinner animation="border" variant="primary" />
            <p style={{ marginTop: 16 }}>{t('sellerReturns.loading')}</p>
          </div>
        ) : error ? (
          <div className={styles.emptyState}>
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#dc3545"
              strokeWidth="1.3"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <circle cx="12" cy="16" r="0.5" fill="#dc3545" />
            </svg>
            <p style={{ color: '#dc3545', marginTop: 8 }}>{error}</p>
            <button className="btn btn-primary btn-sm mt-3" onClick={fetchReturnRequests}>
              {t('sellerReturns.retry')}
            </button>
          </div>
        ) : paginated.length === 0 ? (
          <div className={styles.emptyState}>
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#d1d5db"
              strokeWidth="1.3"
            >
              <path d="M9 14l-4-4 4-4" />
              <path d="M5 10h11a4 4 0 000-8H4" />
              <path d="M3 21h18" />
            </svg>
            <p>{search ? t('sellerReturns.empty.noResults', { search }) : t('sellerReturns.empty.noRequests')}</p>
          </div>
        ) : (
          <>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr className={styles.thead}>
                    <th className={styles.th}>{t('sellerReturns.table.returnId')}</th>
                    <th className={styles.th}>{t('sellerReturns.table.order')}</th>
                    <th className={styles.th}>{t('sellerReturns.table.product')}</th>
                    <th className={styles.th}>{t('sellerReturns.table.customer')}</th>
                    <th className={styles.th}>{t('sellerReturns.table.reason')}</th>
                    <th className={styles.th} style={{ textAlign: 'right' }}>
                      {t('sellerReturns.table.refund')}
                    </th>
                    <th className={styles.th}>{t('sellerReturns.table.date')}</th>
                    <th className={styles.th} style={{ textAlign: 'center' }}>
                      {t('sellerReturns.table.status')}
                    </th>
                    <th className={styles.th} style={{ width: 52 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((ret) => {
                    const st = BADGE_MAP(t)[ret.status] || { label: ret.status, cls: '', labelKey: null };
                    return (
                      <tr key={ret.id} className={styles.tr}>
                        <td className={styles.td}>
                          <span className={styles.returnId}>{ret.id}</span>
                        </td>
                        <td className={styles.td}>
                          <span className={styles.sku}>{ret.orderId}</span>
                        </td>
                        <td className={styles.td}>
                          <div className={styles.productCell}>
                            <span className={styles.productName} style={{ fontSize: 13 }}>
                              {ret.product}
                            </span>
                            <span className={styles.categoryChip} style={{ marginTop: 2 }}>
                              {ret.category}
                            </span>
                          </div>
                        </td>
                        <td className={styles.td}>
                          <span style={{ fontSize: 13, color: '#334155', fontWeight: 500 }}>
                            {ret.customer}
                          </span>
                        </td>
                        <td className={styles.td}>
                          <span className={styles.reasonChip}>{ret.reason}</span>
                        </td>
                        <td className={styles.td} style={{ textAlign: 'right' }}>
                          <span className={styles.refundAmount}>{formatVND(ret.price)}</span>
                        </td>
                        <td className={styles.td}>
                          <span className={styles.dateText}>{ret.date}</span>
                        </td>
                        <td className={styles.td} style={{ textAlign: 'center' }}>
                          <span className={`${styles.badge} ${st.cls}`}>{st.labelKey ? t(st.labelKey) : st.label}</span>
                        </td>
                        <td className={styles.td}>
                          <Dropdown align="end">
                            <Dropdown.Toggle as="button" className={styles.menuBtn} bsPrefix="x">
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <circle cx="8" cy="3" r="1.3" fill="currentColor" />
                                <circle cx="8" cy="8" r="1.3" fill="currentColor" />
                                <circle cx="8" cy="13" r="1.3" fill="currentColor" />
                              </svg>
                            </Dropdown.Toggle>
                            <Dropdown.Menu>
                              <Dropdown.Item onClick={() => handleViewDetails(ret)}>
                                <i className="bi bi-eye me-2" />
                                {t('sellerReturns.actions.viewDetails')}
                              </Dropdown.Item>
                              {ret.status === 'pending' && (
                                <>
                                  <Dropdown.Item
                                    className="text-danger"
                                    onClick={() => handleQuickAction(ret, 'reject')}
                                  >
                                    <i className="bi bi-x-circle me-2" />
                                    {t('sellerReturns.actions.reject')}
                                  </Dropdown.Item>
                                </>
                              )}
                            </Dropdown.Menu>
                          </Dropdown>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className={styles.tableFooter}>
              <span className={styles.footerInfo}>
                {t('sellerReturns.tableFooter.returnsFound', { count: filtered.length })}
              </span>
              <ListingsPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(p) => {
                  if (p >= 1 && p <= totalPages) {
                    setCurrentPage(p);
                  }
                }}
              />
            </div>
          </>
        )}
      </div>

      {/* Return Details Modal */}
      <ReturnDetailsModal
        visible={showDetailsModal}
        returnRequest={selectedReturn}
        onClose={handleCloseModal}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
};

export default ReturnsPage;
