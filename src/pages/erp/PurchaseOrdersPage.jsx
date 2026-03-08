import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  fetchPurchaseOrders,
  completePurchaseOrder,
  cancelPurchaseOrder,
} from '../../store/slices/erpSlice';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EditPODrawer from '../../components/erp/EditPODrawer';
import styles from '@assets/styles/erp/PurchaseOrdersPage.module.css';

// ── SVG Icons ────────────────────────────────────────────────────────────────
const IconPlus   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>;
const IconChevL  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 18-6-6 6-6"/></svg>;
const IconChevR  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m9 18 6-6-6-6"/></svg>;
const IconEye    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const IconEdit   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IconCheck  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5"/></svg>;
const IconX      = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>;
const IconBox    = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>;
const IconClock  = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const IconOk     = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
const IconBan    = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>;
const IconWarn   = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;

const PurchaseOrdersPage = () => {
  const dispatch = useDispatch();
  const { purchaseOrders, purchaseOrdersPagination, loading, error } = useSelector(
    (state) => state.erp
  );

  const [filters, setFilters] = useState({
    status: '',
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const [cancelModal, setCancelModal] = useState({ show: false, id: null });
  const [cancelReason, setCancelReason] = useState('');
  const [editingPoId, setEditingPoId] = useState(null);

  useEffect(() => {
    dispatch(fetchPurchaseOrders(filters));
  }, [dispatch, filters]);

  // Stat counts derived from current list
  const stats = useMemo(() => {
    const all = purchaseOrders;
    return {
      total:     all.length,
      pending:   all.filter(p => p.status === 'Pending').length,
      completed: all.filter(p => p.status === 'Completed').length,
      cancelled: all.filter(p => p.status === 'Cancelled').length,
    };
  }, [purchaseOrders]);

  const handleComplete = async (id) => {
    if (window.confirm('Confirm order completion? This will update inventory and cannot be undone.')) {
      try {
        await dispatch(completePurchaseOrder(id)).unwrap();
        dispatch(fetchPurchaseOrders(filters));
      } catch (err) {
        alert('Cannot complete purchase order: ' + (err.error || err));
      }
    }
  };

  const handleCancelSubmit = async () => {
    if (!cancelReason.trim()) { alert('Please enter a cancellation reason'); return; }
    try {
      await dispatch(cancelPurchaseOrder({ id: cancelModal.id, cancelReason })).unwrap();
      setCancelModal({ show: false, id: null });
      setCancelReason('');
      dispatch(fetchPurchaseOrders(filters));
    } catch (err) {
      alert('Cannot cancel purchase order: ' + (err.error || err));
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      Draft:     { label: 'Draft',     cls: styles.badgeDraft,     dot: '#94a3b8' },
      Pending:   { label: 'Pending',   cls: styles.badgePending,   dot: '#d97706' },
      Completed: { label: 'Completed', cls: styles.badgeCompleted, dot: '#10b981' },
      Cancelled: { label: 'Cancelled', cls: styles.badgeCancelled, dot: '#ef4444' },
    };
    const cfg = map[status] || map.Draft;
    return (
      <span className={`${styles.badge} ${cfg.cls}`}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.dot, display: 'inline-block' }} />
        {cfg.label}
      </span>
    );
  };

  const fmtVnd = (n) => new Intl.NumberFormat('vi-VN', { minimumFractionDigits: 0 }).format(n || 0) + ' ₫';
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

  if (loading && !purchaseOrders.length) return <LoadingSpinner />;

  return (
    <div className={styles.container}>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>Purchase Orders</h1>
          <p className={styles.headerSub}>Manage Guangzhou Imports · Landed Cost</p>
        </div>
        <Link to="/erp/purchase-orders/create" className={styles.btnPrimary}>
          <IconPlus /> Create Order
        </Link>
      </div>

      {error && <div className={styles.alert}>{error.error || error}</div>}

      {/* Stat Cards */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#eef2ff', color: '#6366f1' }}><IconBox /></div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{purchaseOrdersPagination?.total ?? stats.total}</div>
            <div className={styles.statLabel}>Total Orders</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#fffbeb', color: '#d97706' }}><IconClock /></div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{stats.pending}</div>
            <div className={styles.statLabel}>Pending</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#ecfdf5', color: '#10b981' }}><IconOk /></div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{stats.completed}</div>
            <div className={styles.statLabel}>Completed</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#fef2f2', color: '#ef4444' }}><IconBan /></div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{stats.cancelled}</div>
            <div className={styles.statLabel}>Cancelled</div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <span className={styles.filterLabel}>Filter:</span>
        <div className={styles.filterGroup}>
          <select className={styles.select} value={filters.status}
            onChange={(e) => setFilters(p => ({ ...p, status: e.target.value, page: 1 }))}>
            <option value="">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Pending">Pending</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <select className={styles.select} value={filters.sortBy}
            onChange={(e) => setFilters(p => ({ ...p, sortBy: e.target.value }))}>
            <option value="createdAt">Sort: Created Date</option>
            <option value="expectedDeliveryDate">Sort: Delivery Date</option>
            <option value="finalAmount">Sort: Total Amount</option>
          </select>
          <select className={styles.select} value={filters.sortOrder}
            onChange={(e) => setFilters(p => ({ ...p, sortOrder: e.target.value }))}>
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Order Number</th>
              <th>Supplier</th>
              <th>Created At</th>
              <th>Expected Delivery</th>
              <th>Products</th>
              <th style={{ textAlign: 'right' }}>Total</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {purchaseOrders.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <div className={styles.emptyState}>
                    <svg className={styles.emptyIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0ll7-4A2 2 0 0021 16z"/>
                    </svg>
                    <p>No purchase orders yet</p>
                    <Link to="/erp/purchase-orders/create" className={styles.btnPrimary}>
                      <IconPlus /> Create first order
                    </Link>
                  </div>
                </td>
              </tr>
            ) : (
              purchaseOrders.map((po) => (
                <tr key={po._id}>
                  <td>
                    <Link to={`/erp/purchase-orders/${po._id}`} className={styles.codeLink}>
                      {po.code}
                    </Link>
                  </td>
                  <td><span className={styles.supplierName}>{po.supplierId?.name || '—'}</span></td>
                  <td><span className={styles.dateText}>{fmtDate(po.createdAt)}</span></td>
                  <td><span className={styles.dateText}>{fmtDate(po.expectedDeliveryDate)}</span></td>
                  <td>
                    <span className={styles.itemCount}>
                      {po.items?.length || 0} SKU
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <span className={styles.amount}>{fmtVnd(po.finalAmount)}</span>
                  </td>
                  <td>{getStatusBadge(po.status)}</td>
                  <td>
                    <div className={styles.rowActions}>
                      <Link to={`/erp/purchase-orders/${po._id}`} className={`${styles.actionBtn} ${styles.btnView}`}>
                        <IconEye /> View
                      </Link>
                      {po.status === 'Draft' && (
                        <button
                          className={`${styles.actionBtn} ${styles.btnEdit}`}
                          onClick={() => setEditingPoId(po._id)}
                        >
                          <IconEdit /> Edit
                        </button>
                      )}
                      {po.status === 'Pending' && (
                        <>
                          <button className={`${styles.actionBtn} ${styles.btnComplete}`} onClick={() => handleComplete(po._id)}>
                            <IconCheck /> Complete
                          </button>
                          <button className={`${styles.actionBtn} ${styles.btnCancel}`} onClick={() => setCancelModal({ show: true, id: po._id })}>
                            <IconX /> Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {purchaseOrdersPagination && purchaseOrdersPagination.totalPages > 1 && (
        <div className={styles.pagination}>
          <button className={styles.pageBtn}
            disabled={filters.page === 1}
            onClick={() => setFilters(p => ({ ...p, page: p.page - 1 }))}>
            <IconChevL /> Prev
          </button>
          <span className={styles.pageInfo}>
            Page {filters.page} of {purchaseOrdersPagination.totalPages}
          </span>
          <button className={styles.pageBtn}
            disabled={filters.page === purchaseOrdersPagination.totalPages}
            onClick={() => setFilters(p => ({ ...p, page: p.page + 1 }))}>
            Next <IconChevR />
          </button>
        </div>
      )}

      {/* Cancel Modal */}
      {cancelModal.show && (
        <div className={styles.modal} onClick={(e) => e.target === e.currentTarget && setCancelModal({ show: false, id: null })}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <span style={{ color: '#ef4444' }}><IconWarn /></span>
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
              <button className={styles.btnSecondary}
                onClick={() => { setCancelModal({ show: false, id: null }); setCancelReason(''); }}>
                Close
              </button>
              <button className={styles.btnDanger} onClick={handleCancelSubmit}>
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit PO Drawer ── */}
      {editingPoId && (
        <EditPODrawer
          poId={editingPoId}
          onClose={() => setEditingPoId(null)}
          onSaved={() => dispatch(fetchPurchaseOrders(filters))}
        />
      )}
    </div>
  );
};

export default PurchaseOrdersPage;
