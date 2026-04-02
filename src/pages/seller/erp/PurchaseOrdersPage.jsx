import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import SortableHeader from '../../../components/common/SortableHeader';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  fetchPurchaseOrders,
  cancelPurchaseOrder,
  fetchSuppliers,
} from '../../../store/slices/erpSlice';
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  Check,
  X,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  MoreHorizontal,
  Search,
  FilterX,
} from 'lucide-react';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import EditPODrawer from '@components/seller/erp/EditPODrawer';
import ReceivePOModal from '@components/seller/erp/ReceivePOModal';
import styles from '@assets/styles/seller/erp/PurchaseOrdersPage.module.css';

// ── Kebab Dropdown ────────────────────────────────────────────────────────────
const KebabMenu = ({ items }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className={styles.kebabWrap} ref={ref}>
      <button
        className={styles.kebabTrigger}
        onClick={() => setOpen((o) => !o)}
        aria-label="More actions"
        title="More actions"
      >
        <MoreHorizontal size={15} />
      </button>
      {open && (
        <div className={styles.kebabMenu}>
          {items.map((item) => (
            <button
              key={item.label}
              className={`${styles.kebabItem} ${item.danger ? styles.kebabItemDanger : ''}`}
              onClick={() => {
                item.onClick();
                setOpen(false);
              }}
              disabled={item.disabled}
            >
              {item.icon && <span className={styles.kebabItemIcon}>{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

KebabMenu.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      icon: PropTypes.node,
      danger: PropTypes.bool,
      onClick: PropTypes.func.isRequired,
      disabled: PropTypes.bool,
    })
  ).isRequired,
};

// ── Main Component ────────────────────────────────────────────────────────────
const PurchaseOrdersPage = () => {
  const dispatch = useDispatch();
  const { purchaseOrders, purchaseOrdersPagination, loading, error, suppliers } = useSelector(
    (state) => state.erp
  );

  const [filters, setFilters] = useState({
    status: '',
    supplierId: '',
    search: '',
    dateFrom: '',
    dateTo: '',
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  // debounced search value that actually triggers API call
  const [searchInput, setSearchInput] = useState('');
  const searchTimer = useRef(null);

  const [cancelModal, setCancelModal] = useState({ show: false, id: null });
  const [cancelReason, setCancelReason] = useState('');
  const [editingPoId, setEditingPoId] = useState(null);
  const [receiveModalPoId, setReceiveModalPoId] = useState(null);

  const COL_TO_SORT = {
    orderNumber: 'orderNumber',
    supplierName: 'supplier',
    createdAt: 'createdAt',
    expectedDeliveryDate: 'expectedDeliveryDate',
    finalAmount: 'finalAmount',
    status: 'status',
  };

  const handleSort = useCallback((colKey) => {
    const backendField = COL_TO_SORT[colKey];
    if (!backendField) {
      return;
    }
    setFilters((prev) => ({
      ...prev,
      sortBy: backendField,
      sortOrder: prev.sortBy === backendField && prev.sortOrder === 'asc' ? 'desc' : 'asc',
      page: 1,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const apiFilters = useMemo(() => {
    const { dateFrom, dateTo, ...rest } = filters;
    return {
      ...rest,
      ...(dateFrom && { startDate: dateFrom }),
      ...(dateTo && { endDate: dateTo }),
    };
  }, [filters]);

  useEffect(() => {
    dispatch(fetchPurchaseOrders(apiFilters));
  }, [dispatch, apiFilters]);

  useEffect(() => {
    if (!suppliers?.length) {
      dispatch(fetchSuppliers({ limit: 200 }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  const handleSearchChange = (val) => {
    setSearchInput(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setFilters((p) => ({ ...p, search: val, page: 1 }));
    }, 400);
  };

  const activeFilterCount = [
    filters.supplierId,
    filters.dateFrom,
    filters.dateTo,
    filters.status,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSearchInput('');
    setFilters((p) => ({
      ...p,
      status: '',
      supplierId: '',
      search: '',
      dateFrom: '',
      dateTo: '',
      page: 1,
    }));
  };

  const stats = useMemo(() => {
    const sc = purchaseOrdersPagination?.statusCounts;
    return {
      total: sc?.total ?? purchaseOrdersPagination?.total ?? 0,
      pending: sc?.Pending ?? 0,
      completed: sc?.Completed ?? 0,
      cancelled: sc?.Cancelled ?? 0,
    };
  }, [purchaseOrdersPagination]);

  // Open Receive modal (Stage 2 — enter costs when goods arrive)
  const handleOpenReceive = (id) => setReceiveModalPoId(id);

  const handleCancelSubmit = async () => {
    if (!cancelReason.trim()) {
      alert('Please enter a cancellation reason.');
      return;
    }
    try {
      await dispatch(cancelPurchaseOrder({ id: cancelModal.id, cancelReason })).unwrap();
      setCancelModal({ show: false, id: null });
      setCancelReason('');
      dispatch(fetchPurchaseOrders(apiFilters));
    } catch (err) {
      alert(`Cannot cancel: ${err.error || err.message || err}`);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      Draft: { label: 'Draft', cls: styles.badgeDraft, dot: '#94a3b8' },
      PENDING_APPROVAL: { label: 'Pending Approval', cls: styles.badgePending, dot: '#6366f1' },
      ORDERED: { label: 'Ordered', cls: styles.badgePending, dot: '#d97706' },
      ARRIVED_VN: { label: 'Arrived VN', cls: styles.badgePending, dot: '#0ea5e9' },
      Pending: { label: 'Ordering', cls: styles.badgePending, dot: '#d97706' },
      Completed: { label: 'Received', cls: styles.badgeCompleted, dot: '#10b981' },
      COMPLETED: { label: 'Received', cls: styles.badgeCompleted, dot: '#10b981' },
      Cancelled: { label: 'Cancelled', cls: styles.badgeCancelled, dot: '#ef4444' },
    };
    const cfg = map[status] || map.PENDING_APPROVAL;
    return (
      <span className={`${styles.badge} ${cfg.cls}`}>
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: '50%',
            background: cfg.dot,
            display: 'inline-block',
          }}
        />
        {cfg.label}
      </span>
    );
  };

  const fmtVnd = (n) =>
    `${new Intl.NumberFormat('vi-VN', { minimumFractionDigits: 0 }).format(n || 0)} ₫`;
  const fmtDate = (d) =>
    d
      ? new Date(d).toLocaleDateString('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
      : '—';

  const RECEIVABLE_STATUSES = ['ORDERED', 'ARRIVED_VN'];

  // Build action set per PO status
  const renderActions = (po) => {
    const canReceive = RECEIVABLE_STATUSES.includes(po.status);

    return (
      <div className={styles.rowActions}>
        {/* View — always visible (ghost) */}
        <Link
          to={`/seller/erp/purchase-orders/${po._id}`}
          className={`${styles.actionBtn} ${styles.btnView}`}
          title="View details"
        >
          <Eye size={14} /> View
        </Link>

        {/* ── Draft: Full edit | ORDERED/ARRIVED_VN: Limited edit (Notes, Expected Date only) ── */}
        {['Draft', 'ORDERED', 'ARRIVED_VN'].includes(po.status) && (
          <button
            className={`${styles.actionBtn} ${styles.btnIconOnly}`}
            onClick={() => setEditingPoId(po._id)}
            title="Edit order"
            aria-label="Edit"
          >
            <Pencil size={14} />
          </button>
        )}

        {/* ── Receivable: Receive goods (opens cost input modal) + kebab(Cancel) ── */}
        {canReceive && (
          <>
            <button
              className={`${styles.actionBtn} ${styles.btnPrimaryAction} ${styles.btnGreen}`}
              onClick={() => handleOpenReceive(po._id)}
              title="Receive goods — enter costs"
            >
              <Check size={13} />
              Receive Goods
            </button>

            <KebabMenu
              items={[
                {
                  label: 'Cancel Order',
                  icon: <X size={13} />,
                  danger: true,
                  onClick: () => setCancelModal({ show: true, id: po._id }),
                },
              ]}
            />
          </>
        )}
      </div>
    );
  };

  if (loading && !purchaseOrders.length) {
    return <LoadingSpinner />;
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>Purchase Orders</h1>
          <p className={styles.headerSub}>Manage Guangzhou Imports · Landed Cost</p>
        </div>
        <Link to="/seller/erp/purchase-orders/create" className={styles.btnPrimary}>
          <Plus size={14} /> Create Order
        </Link>
      </div>

      {error && <div className={styles.alert}>{error.error || error}</div>}

      {/* Stat Cards */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#eef2ff', color: '#6366f1' }}>
            <Package size={20} strokeWidth={1.8} />
          </div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{stats.total}</div>
            <div className={styles.statLabel}>Total Orders</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#fffbeb', color: '#d97706' }}>
            <Clock size={20} strokeWidth={1.8} />
          </div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{stats.pending}</div>
            <div className={styles.statLabel}>Ordering</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#ecfdf5', color: '#10b981' }}>
            <CheckCircle2 size={20} strokeWidth={1.8} />
          </div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{stats.completed}</div>
            <div className={styles.statLabel}>Received</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#fef2f2', color: '#ef4444' }}>
            <XCircle size={20} strokeWidth={1.8} />
          </div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{stats.cancelled}</div>
            <div className={styles.statLabel}>Cancelled</div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className={styles.filterBar}>
        {/* Search */}
        <div className={styles.filterSearch}>
          <Search size={14} className={styles.filterSearchIcon} />
          <input
            type="text"
            className={styles.filterSearchInput}
            placeholder="Search by order number…"
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>

        {/* Status */}
        <select
          className={styles.filterSelect}
          value={filters.status}
          onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value, page: 1 }))}
        >
          <option value="">All Statuses</option>
          <option value="Draft">Draft</option>
          <option value="PENDING_APPROVAL">Pending Approval</option>
          <option value="ORDERED">Ordered</option>
          <option value="ARRIVED_VN">Arrived VN</option>
          <option value="Pending">Ordering</option>
          <option value="Completed">Received</option>
          <option value="Cancelled">Cancelled</option>
        </select>

        {/* Supplier */}
        <select
          className={styles.filterSelect}
          value={filters.supplierId}
          onChange={(e) => setFilters((p) => ({ ...p, supplierId: e.target.value, page: 1 }))}
        >
          <option value="">All Suppliers</option>
          {(suppliers || []).map((s) => (
            <option key={s._id} value={s._id}>
              {s.name}
            </option>
          ))}
        </select>

        {/* Date range */}
        <div className={styles.filterDateRange}>
          <input
            type="date"
            className={styles.filterDate}
            value={filters.dateFrom}
            onChange={(e) => setFilters((p) => ({ ...p, dateFrom: e.target.value, page: 1 }))}
            title="Created from"
          />
          <span className={styles.filterDateSep}>–</span>
          <input
            type="date"
            className={styles.filterDate}
            value={filters.dateTo}
            onChange={(e) => setFilters((p) => ({ ...p, dateTo: e.target.value, page: 1 }))}
            title="Created to"
          />
        </div>

        {/* Clear */}
        {(activeFilterCount > 0 || searchInput) && (
          <button
            className={styles.filterClearBtn}
            onClick={clearFilters}
            title="Clear all filters"
          >
            <FilterX size={14} />
            Clear
            {activeFilterCount > 0 && (
              <span className={styles.filterBadge}>{activeFilterCount}</span>
            )}
          </button>
        )}
      </div>

      {/* Table */}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <SortableHeader
                label="Order Number"
                colKey="orderNumber"
                sortKey={filters.sortBy === 'orderNumber' ? 'orderNumber' : null}
                sortDir={filters.sortOrder}
                onSort={handleSort}
              />
              <SortableHeader
                label="Supplier"
                colKey="supplierName"
                sortKey={filters.sortBy === 'supplier' ? 'supplierName' : null}
                sortDir={filters.sortOrder}
                onSort={handleSort}
              />
              <SortableHeader
                label="Created At"
                colKey="createdAt"
                sortKey={filters.sortBy === 'createdAt' ? 'createdAt' : null}
                sortDir={filters.sortOrder}
                onSort={handleSort}
              />
              <SortableHeader
                label="Expected Delivery"
                colKey="expectedDeliveryDate"
                sortKey={filters.sortBy === 'expectedDeliveryDate' ? 'expectedDeliveryDate' : null}
                sortDir={filters.sortOrder}
                onSort={handleSort}
              />
              <th>Products</th>
              <SortableHeader
                label="Total"
                colKey="finalAmount"
                sortKey={filters.sortBy === 'finalAmount' ? 'finalAmount' : null}
                sortDir={filters.sortOrder}
                onSort={handleSort}
                align="right"
              />
              <SortableHeader
                label="Status"
                colKey="status"
                sortKey={filters.sortBy === 'status' ? 'status' : null}
                sortDir={filters.sortOrder}
                onSort={handleSort}
              />
              <th className={styles.thActions}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {purchaseOrders.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <div className={styles.emptyState}>
                    <Package size={40} strokeWidth={1.2} color="#d1d5db" />
                    <p>No purchase orders yet</p>
                    <Link to="/seller/erp/purchase-orders/create" className={styles.btnPrimary}>
                      <Plus size={14} /> Create first order
                    </Link>
                  </div>
                </td>
              </tr>
            ) : (
              purchaseOrders.map((po) => (
                <tr key={po._id} className={styles.tableRow}>
                  <td>
                    <Link to={`/seller/erp/purchase-orders/${po._id}`} className={styles.codeLink}>
                      {po.code}
                    </Link>
                  </td>
                  <td>
                    <span className={styles.supplierName}>{po.supplierId?.name || '—'}</span>
                  </td>
                  <td>
                    <span className={styles.dateText}>{fmtDate(po.createdAt)}</span>
                  </td>
                  <td>
                    <span className={styles.dateText}>{fmtDate(po.expectedDeliveryDate)}</span>
                  </td>
                  <td>
                    <span className={styles.itemCount}>{po.items?.length || 0} SKU</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <span className={styles.amount}>{fmtVnd(po.finalAmount)}</span>
                  </td>
                  <td>{getStatusBadge(po.status)}</td>
                  <td className={styles.tdActions}>{renderActions(po)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {purchaseOrdersPagination && purchaseOrdersPagination.totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            className={styles.pageBtn}
            disabled={filters.page === 1}
            onClick={() => setFilters((p) => ({ ...p, page: p.page - 1 }))}
          >
            <ChevronLeft size={14} /> Prev
          </button>
          <span className={styles.pageInfo}>
            Page {filters.page} of {purchaseOrdersPagination.totalPages}
          </span>
          <button
            className={styles.pageBtn}
            disabled={filters.page === purchaseOrdersPagination.totalPages}
            onClick={() => setFilters((p) => ({ ...p, page: p.page + 1 }))}
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* Cancel Modal */}
      {cancelModal.show && (
        <div
          className={styles.modal}
          onClick={(e) => e.target === e.currentTarget && setCancelModal({ show: false, id: null })}
        >
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <AlertTriangle size={18} color="#ef4444" />
              <h2 className={styles.modalTitle}>Cancel Purchase Order</h2>
            </div>
            <div className={styles.formGroup}>
              <label>Cancellation Reason *</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={4}
                placeholder="Enter reason for cancellation..."
              />
            </div>
            <div className={styles.modalActions}>
              <button
                className={styles.btnSecondary}
                onClick={() => {
                  setCancelModal({ show: false, id: null });
                  setCancelReason('');
                }}
              >
                Close
              </button>
              <button className={styles.btnDanger} onClick={handleCancelSubmit}>
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit PO Drawer */}
      {editingPoId && (
        <EditPODrawer
          poId={editingPoId}
          onClose={() => setEditingPoId(null)}
          onSaved={() => dispatch(fetchPurchaseOrders(apiFilters))}
          onSubmitted={() => dispatch(fetchPurchaseOrders(apiFilters))}
          onCancelled={() => dispatch(fetchPurchaseOrders(apiFilters))}
        />
      )}

      {/* Receive PO Modal (Stage 2 — enter costs when goods arrive) */}
      <ReceivePOModal
        isOpen={!!receiveModalPoId}
        onClose={() => setReceiveModalPoId(null)}
        poId={receiveModalPoId}
        onSuccess={() => dispatch(fetchPurchaseOrders(apiFilters))}
      />
    </div>
  );
};

export default PurchaseOrdersPage;
