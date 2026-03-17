import React, { useEffect, useState, useMemo } from 'react';
import SortableHeader, { useSortState, sortRows } from '../../components/common/SortableHeader';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  fetchSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from '../../store/slices/erpSlice';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import SupplierDrawer from '../../components/erp/SupplierDrawer';
import styles from '@assets/styles/erp/SuppliersPage.module.css';

// ── SVG Icons ────────────────────────────────────────────────────────────────
const IconPlus = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
  >
    <path d="M12 5v14M5 12h14" />
  </svg>
);
const IconSearch = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);
const IconEdit = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
const IconTrash = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2" />
  </svg>
);
const IconEye = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const IconChevL = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
  >
    <path d="m15 18-6-6 6-6" />
  </svg>
);
const IconChevR = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
  >
    <path d="m9 18 6-6-6-6" />
  </svg>
);
const IconWarn = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);
const IconUsers = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 00-3-3.87" />
    <path d="M16 3.13a4 4 0 010 7.75" />
  </svg>
);
const IconActive = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);
const IconOrders = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <path d="M16 10a4 4 0 01-8 0" />
  </svg>
);
const IconStar = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

/* ── Avatar initials helper ── */
const getInitials = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

/* ── Score color helper ── */
const getScoreColor = (score) => {
  if (score >= 80) {
    return '#059669';
  }
  if (score >= 50) {
    return '#d97706';
  }
  return '#dc2626';
};

/* ══════════════════════════════════════════════════════════════════
   Delete Confirm Modal
   ══════════════════════════════════════════════════════════════════ */
const DeleteConfirmModal = ({ supplierName, onConfirm, onCancel }) => (
  <div
    className={styles.confirmOverlay}
    onClick={(e) => e.target === e.currentTarget && onCancel()}
  >
    <div className={styles.confirmPanel}>
      <div className={styles.confirmIcon}>
        <IconWarn />
      </div>
      <div className={styles.confirmTitle}>Delete supplier?</div>
      <div className={styles.confirmDesc}>
        You are about to delete <strong>{supplierName}</strong>. This action cannot be undone and
        may affect related purchase orders.
      </div>
      <div className={styles.confirmActions}>
        <button className={styles.btnSecondary} onClick={onCancel}>
          Cancel
        </button>
        <button className={styles.btnDanger} onClick={onConfirm}>
          <IconTrash /> Delete
        </button>
      </div>
    </div>
  </div>
);

/* ══════════════════════════════════════════════════════════════════
   Main Page
   ══════════════════════════════════════════════════════════════════ */
const SuppliersPage = () => {
  const dispatch = useDispatch();
  const { suppliers, suppliersPagination, loading, error } = useSelector((s) => s.erp);

  const [filters, setFilters] = useState({ status: '', page: 1, limit: 20 });
  const [search, setSearch] = useState('');
  const [drawer, setDrawer] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { sortKey, sortDir, handleSort } = useSortState();

  useEffect(() => {
    dispatch(fetchSuppliers(filters));
  }, [dispatch, filters]);

  /* ── Client-side search + sort ── */
  const filtered = useMemo(() => {
    let list = suppliers;
    if (search.trim()) {
      const q = search.toLowerCase();
      const contactPerson = (s) => s.contact?.contactPerson || s.contactPerson;
      const phone = (s) => s.contact?.phone || s.phone;
      const email = (s) => s.contact?.email || s.email;
      list = list.filter(
        (s) =>
          s.name?.toLowerCase().includes(q) ||
          contactPerson(s)?.toLowerCase().includes(q) ||
          phone(s)?.includes(q) ||
          email(s)?.toLowerCase().includes(q)
      );
    }
    return sortRows(list, sortKey, sortDir, {
      status: (r) => (r.status === 'Active' ? 0 : 1),
      contactPerson: (r) => r.contact?.contactPerson || r.contactPerson || '',
    });
  }, [suppliers, search, sortKey, sortDir]);

  /* ── Stats ── */
  const stats = useMemo(
    () => ({
      total: suppliersPagination?.total ?? suppliers.length,
      active: suppliers.filter((s) => s.status === 'Active').length,
      avgScore: suppliers.length
        ? Math.round(
            suppliers.reduce((sum, s) => sum + (s.reliabilityScore || 0), 0) / suppliers.length
          )
        : 0,
      totalOrders: suppliers.reduce((sum, s) => sum + (s.totalOrders || 0), 0),
    }),
    [suppliers, suppliersPagination]
  );

  /* ── Handlers ── */
  const handleSave = async (formData) => {
    if (drawer?.mode === 'edit') {
      await dispatch(updateSupplier({ id: drawer.supplier._id, updateData: formData })).unwrap();
    } else {
      await dispatch(createSupplier(formData)).unwrap();
    }
    setDrawer(null);
    dispatch(fetchSuppliers(filters));
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) {
      return;
    }
    await dispatch(deleteSupplier(deleteTarget._id)).unwrap();
    setDeleteTarget(null);
    dispatch(fetchSuppliers(filters));
  };

  if (loading && !suppliers.length) {
    return <LoadingSpinner />;
  }

  return (
    <div className={styles.container}>
      {/* ── Header ── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>Suppliers</h1>
          <p className={styles.headerSub}>Manage supplier directory · Reliability · Payments</p>
        </div>
        <button className={styles.btnPrimary} onClick={() => setDrawer({ mode: 'create' })}>
          <IconPlus /> Add Supplier
        </button>
      </div>

      {error && <div className={styles.alert}>{error.error || String(error)}</div>}

      {/* ── Stats ── */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#eef2ff', color: '#6366f1' }}>
            <IconUsers />
          </div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{stats.total}</div>
            <div className={styles.statLabel}>Total Suppliers</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#ecfdf5', color: '#059669' }}>
            <IconActive />
          </div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{stats.active}</div>
            <div className={styles.statLabel}>Active</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#fef9ec', color: '#d97706' }}>
            <IconStar />
          </div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>
              {stats.avgScore}
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 400 }}>/100</span>
            </div>
            <div className={styles.statLabel}>Avg Reliability</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#f0f9ff', color: '#0284c7' }}>
            <IconOrders />
          </div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{stats.totalOrders}</div>
            <div className={styles.statLabel}>Total Orders</div>
          </div>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <span className={styles.searchIcon}>
            <IconSearch />
          </span>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Search by name, phone, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className={styles.filterSelect}
          value={filters.status}
          onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value, page: 1 }))}
        >
          <option value="">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      {/* ── Table ── */}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <SortableHeader
                label="Supplier"
                colKey="name"
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
              />
              <SortableHeader
                label="Contact"
                colKey="contactPerson"
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
              />
              <SortableHeader
                label="Reliability"
                colKey="reliabilityScore"
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
                align="center"
              />
              <SortableHeader
                label="Status"
                colKey="status"
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
                align="center"
              />
              <SortableHeader
                label="Orders"
                colKey="totalOrders"
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
                align="center"
              />
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className={styles.emptyState}>
                    <svg
                      className={styles.emptyIcon}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.2"
                    >
                      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 00-3-3.87" />
                      <path d="M16 3.13a4 4 0 010 7.75" />
                    </svg>
                    <p>{search ? 'No suppliers found' : 'No suppliers yet'}</p>
                    {!search && (
                      <button
                        className={styles.btnPrimary}
                        onClick={() => setDrawer({ mode: 'create' })}
                      >
                        <IconPlus /> Add first supplier
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((supplier) => (
                <tr key={supplier._id}>
                  {/* Name + Avatar */}
                  <td>
                    <div className={styles.supplierCell}>
                      <div className={styles.supplierAvatar}>{getInitials(supplier.name)}</div>
                      <div>
                        <Link
                          to={`/seller/erp/suppliers/${supplier._id}`}
                          className={styles.supplierLink}
                        >
                          {supplier.name}
                        </Link>
                        {(supplier.addressInfo?.address || supplier.address) && (
                          <div className={styles.supplierMeta}>
                            {supplier.addressInfo?.address || supplier.address}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Contact */}
                  <td>
                    <div className={styles.contactCell}>
                      <span className={styles.contactName}>
                        {supplier.contact?.contactPerson || supplier.contactPerson || '—'}
                      </span>
                      {(supplier.contact?.phone || supplier.phone) && (
                        <span className={styles.contactSub}>
                          {supplier.contact?.phone || supplier.phone}
                        </span>
                      )}
                      {(supplier.contact?.email || supplier.email) && (
                        <span className={styles.contactSub}>
                          {supplier.contact?.email || supplier.email}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Score */}
                  <td>
                    <div className={styles.scoreContainer}>
                      <div className={styles.scoreTrack}>
                        <div
                          className={styles.scoreFill}
                          style={{
                            width: `${supplier.reliabilityScore || 0}%`,
                            background: getScoreColor(supplier.reliabilityScore || 0),
                          }}
                        />
                      </div>
                      <span className={styles.scoreText}>{supplier.reliabilityScore || 0}/100</span>
                    </div>
                  </td>

                  {/* Status */}
                  <td>
                    <span
                      className={`${styles.badge} ${supplier.status === 'Active' ? styles.badgeActive : styles.badgeInactive}`}
                    >
                      <span
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: '50%',
                          background: supplier.status === 'Active' ? '#059669' : '#94a3b8',
                          display: 'inline-block',
                        }}
                      />
                      {supplier.status === 'Active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>

                  {/* Orders */}
                  <td>
                    <span className={styles.ordersCount}>{supplier.totalOrders || 0} orders</span>
                  </td>

                  {/* Actions */}
                  <td>
                    <div className={styles.rowActions}>
                      <Link
                        to={`/seller/erp/suppliers/${supplier._id}`}
                        className={`${styles.actionBtn} ${styles.btnView}`}
                      >
                        <IconEye /> View
                      </Link>
                      <button
                        className={`${styles.actionBtn} ${styles.btnEdit}`}
                        onClick={() => setDrawer({ mode: 'edit', supplier })}
                      >
                        <IconEdit /> Edit
                      </button>
                      <button
                        className={`${styles.actionBtn} ${styles.btnDelete}`}
                        onClick={() => setDeleteTarget(supplier)}
                      >
                        <IconTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      {suppliersPagination && suppliersPagination.totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            className={styles.pageBtn}
            disabled={filters.page === 1}
            onClick={() => setFilters((p) => ({ ...p, page: p.page - 1 }))}
          >
            <IconChevL /> Prev
          </button>
          <span className={styles.pageInfo}>
            Page {filters.page} of {suppliersPagination.totalPages}
          </span>
          <button
            className={styles.pageBtn}
            disabled={filters.page === suppliersPagination.totalPages}
            onClick={() => setFilters((p) => ({ ...p, page: p.page + 1 }))}
          >
            Next <IconChevR />
          </button>
        </div>
      )}

      {/* ── Drawer ── */}
      {drawer && (
        <SupplierDrawer
          supplier={drawer.mode === 'edit' ? drawer.supplier : null}
          onClose={() => setDrawer(null)}
          onSave={handleSave}
        />
      )}

      {/* ── Delete Confirm ── */}
      {deleteTarget && (
        <DeleteConfirmModal
          supplierName={deleteTarget.name}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
};

export default SuppliersPage;
