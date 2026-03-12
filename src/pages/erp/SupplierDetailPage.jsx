import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchSupplierById, clearCurrentSupplier } from '../../store/slices/erpSlice';
import * as erpService from '../../services/api/erpService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import styles from '@assets/styles/erp/SupplierDetailPage.module.css';

const SupplierDetailPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentSupplier: supplier, loading } = useSelector((state) => state.erp);

  const [purchaseHistory, setPurchaseHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    status: '',
  });

  useEffect(() => {
    dispatch(fetchSupplierById(id));
    loadPurchaseHistory();

    return () => {
      dispatch(clearCurrentSupplier());
    };
  }, [dispatch, id]);

  useEffect(() => {
    loadPurchaseHistory();
  }, [filters]);

  const loadPurchaseHistory = async () => {
    setHistoryLoading(true);
    try {
      const response = await erpService.getSupplierPurchaseHistory(id, filters);
      setPurchaseHistory(response.data);
    } catch (err) {
      console.error('Failed to load purchase history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      Active: { label: 'Active', class: styles.badgeActive },
      Inactive: { label: 'Inactive', class: styles.badgeInactive },
    };
    const config = statusMap[status] || statusMap.Active;
    return <span className={config.class}>{config.label}</span>;
  };

  const getPOStatusBadge = (status) => {
    const statusMap = {
      Draft: { label: 'Draft', class: styles.badgeDraft },
      Pending: { label: 'Pending', class: styles.badgePending },
      Completed: { label: 'Completed', class: styles.badgeCompleted },
      Cancelled: { label: 'Cancelled', class: styles.badgeCancelled },
    };
    const config = statusMap[status] || statusMap.Draft;
    return <span className={config.class}>{config.label}</span>;
  };

  if (loading || !supplier) {
    return <LoadingSpinner />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <button className={styles.btnBack} onClick={() => navigate('/erp/suppliers')}>
            ← Back
          </button>
          <h1>{supplier.name}</h1>
          <p className={styles.subtitle}>Supplier ID: {supplier._id}</p>
        </div>
        <div className={styles.headerActions}>
          {getStatusBadge(supplier.status)}
          <button className={styles.btnEdit} onClick={() => navigate(`/erp/suppliers/${id}/edit`)}>
            ✏️ Edit
          </button>
        </div>
      </div>

      {/* Supplier Info */}
      <div className={styles.section}>
        <h2>Supplier Information</h2>
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <span className={styles.label}>Contact Person</span>
            <span>{supplier.contactPerson || '-'}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.label}>Phone</span>
            <span>{supplier.phone || '-'}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.label}>Email</span>
            <span>{supplier.email || '-'}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.label}>Address</span>
            <span>{supplier.address || '-'}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.label}>Tax Code</span>
            <span>{supplier.taxCode || '-'}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.label}>Payment Terms</span>
            <span>{supplier.paymentTerms || '-'}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.label}>Bank Name</span>
            <span>{supplier.bankName || '-'}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.label}>Account Number</span>
            <span>{supplier.bankAccount || '-'}</span>
          </div>
        </div>

        {supplier.notes && (
          <div className={styles.notes}>
            <span className={styles.label}>Notes</span>
            <p>{supplier.notes}</p>
          </div>
        )}
      </div>

      {/* Analytics */}
      {purchaseHistory?.analytics && (
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: '#dbeafe' }}>
              📋
            </div>
            <div>
              <h3>Total Orders</h3>
              <p className={styles.statValue}>{purchaseHistory.analytics.totalPurchaseOrders}</p>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: '#dcfce7' }}>
              💰
            </div>
            <div>
              <h3>Total Spent</h3>
              <p className={styles.statValue}>
                {formatCurrency(purchaseHistory.analytics.totalSpent)}
              </p>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: '#fef3c7' }}>
              📊
            </div>
            <div>
              <h3>Average/Order</h3>
              <p className={styles.statValue}>
                {formatCurrency(purchaseHistory.analytics.averageOrderValue)}
              </p>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: '#e0e7ff' }}>
              📦
            </div>
            <div>
              <h3>Total Items</h3>
              <p className={styles.statValue}>{purchaseHistory.analytics.totalItemsOrdered}</p>
            </div>
          </div>
        </div>
      )}

      {/* Reliability Score */}
      <div className={styles.section}>
        <h2>Reliability Score</h2>
        <div className={styles.scoreContainer}>
          <div className={styles.scoreBar}>
            <div
              className={styles.scoreFill}
              style={{ width: `${supplier.reliabilityScore || 0}%` }}
            />
          </div>
          <span className={styles.scoreValue}>{supplier.reliabilityScore || 0}/100</span>
        </div>
        <p className={styles.scoreDescription}>
          {supplier.reliabilityScore >= 80
            ? '⭐ Excellent Supplier'
            : supplier.reliabilityScore >= 60
              ? '👍 Good Supplier'
              : supplier.reliabilityScore >= 40
                ? '⚠️ Average Supplier'
                : '❌ Needs Improvement'}
        </p>
      </div>

      {/* Purchase History */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Purchase History</h2>
          <select
            value={filters.status}
            onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value, page: 1 }))}
            className={styles.filter}
          >
            <option value="">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Pending">Pending</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        {historyLoading ? (
          <LoadingSpinner />
        ) : purchaseHistory?.purchaseOrders?.length > 0 ? (
          <>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Order Code</th>
                    <th>Created Date</th>
                    <th>Received Date</th>
                    <th>Total Items</th>
                    <th>Total Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseHistory.purchaseOrders.map((po) => (
                    <tr
                      key={po._id}
                      onClick={() => navigate(`/erp/purchase-orders/${po._id}`)}
                      className={styles.clickableRow}
                    >
                      <td className={styles.link}>{po.code}</td>
                      <td>{formatDate(po.createdAt)}</td>
                      <td>{formatDate(po.receivedDate)}</td>
                      <td>{po.items?.length || 0}</td>
                      <td className={styles.amount}>{formatCurrency(po.finalAmount)}</td>
                      <td>{getPOStatusBadge(po.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {purchaseHistory.pagination && (
              <div className={styles.pagination}>
                <button
                  disabled={filters.page === 1}
                  onClick={() => setFilters((prev) => ({ ...prev, page: prev.page - 1 }))}
                >
                  ← Prev
                </button>
                <span>
                  Page {filters.page} / {purchaseHistory.pagination.totalPages}
                </span>
                <button
                  disabled={filters.page === purchaseHistory.pagination.totalPages}
                  onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        ) : (
          <p className={styles.emptyState}>No purchase orders found</p>
        )}
      </div>
    </div>
  );
};

export default SupplierDetailPage;
