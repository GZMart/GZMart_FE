import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  fetchPurchaseOrders,
  completePurchaseOrder,
  cancelPurchaseOrder,
} from '../../store/slices/erpSlice';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import styles from '@assets/styles/erp/PurchaseOrdersPage.module.css';

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

  useEffect(() => {
    dispatch(fetchPurchaseOrders(filters));
  }, [dispatch, filters]);

  const handleComplete = async (id) => {
    if (
      window.confirm(
        'Xác nhận hoàn tất đơn mua hàng? Hành động này sẽ cập nhật tồn kho và không thể hoàn tác.'
      )
    ) {
      try {
        await dispatch(completePurchaseOrder(id)).unwrap();
        dispatch(fetchPurchaseOrders(filters));
      } catch (err) {
        console.error('Failed to complete purchase order:', err);
        alert('Không thể hoàn tất đơn mua hàng: ' + (err.error || err));
      }
    }
  };

  const handleCancelSubmit = async () => {
    if (!cancelReason.trim()) {
      alert('Vui lòng nhập lý do hủy đơn');
      return;
    }

    try {
      await dispatch(cancelPurchaseOrder({ id: cancelModal.id, cancelReason })).unwrap();
      setCancelModal({ show: false, id: null });
      setCancelReason('');
      dispatch(fetchPurchaseOrders(filters));
    } catch (err) {
      console.error('Failed to cancel purchase order:', err);
      alert('Không thể hủy đơn mua hàng: ' + (err.error || err));
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      Draft: { label: 'Nháp', class: styles.badgeDraft },
      Pending: { label: 'Chờ xử lý', class: styles.badgePending },
      Completed: { label: 'Hoàn tất', class: styles.badgeCompleted },
      Cancelled: { label: 'Đã hủy', class: styles.badgeCancelled },
    };
    const config = statusMap[status] || statusMap.Draft;
    return <span className={config.class}>{config.label}</span>;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  if (loading && !purchaseOrders.length) {
    return <LoadingSpinner />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Quản lý Đơn Mua Hàng</h1>
        <Link to="/erp/purchase-orders/create" className={styles.btnPrimary}>
          + Tạo Đơn Mua Hàng
        </Link>
      </div>

      {error && <div className={styles.alert}>{error.error || error}</div>}

      <div className={styles.filters}>
        <select
          value={filters.status}
          onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value, page: 1 }))}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="Draft">Nháp</option>
          <option value="Pending">Chờ xử lý</option>
          <option value="Completed">Hoàn tất</option>
          <option value="Cancelled">Đã hủy</option>
        </select>

        <select
          value={filters.sortBy}
          onChange={(e) => setFilters((prev) => ({ ...prev, sortBy: e.target.value }))}
        >
          <option value="createdAt">Ngày tạo</option>
          <option value="expectedDeliveryDate">Ngày giao dự kiến</option>
          <option value="finalAmount">Tổng tiền</option>
        </select>

        <select
          value={filters.sortOrder}
          onChange={(e) => setFilters((prev) => ({ ...prev, sortOrder: e.target.value }))}
        >
          <option value="desc">Giảm dần</option>
          <option value="asc">Tăng dần</option>
        </select>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Mã đơn</th>
              <th>Nhà cung cấp</th>
              <th>Ngày tạo</th>
              <th>Ngày giao dự kiến</th>
              <th>Tổng tiền</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {purchaseOrders.map((po) => (
              <tr key={po._id}>
                <td>
                  <Link to={`/erp/purchase-orders/${po._id}`} className={styles.link}>
                    {po.code}
                  </Link>
                </td>
                <td>{po.supplierId?.name || '-'}</td>
                <td>{formatDate(po.createdAt)}</td>
                <td>{po.expectedDeliveryDate ? formatDate(po.expectedDeliveryDate) : '-'}</td>
                <td className={styles.amount}>{formatCurrency(po.finalAmount)}</td>
                <td>{getStatusBadge(po.status)}</td>
                <td>
                  <div className={styles.actions}>
                    {po.status === 'Pending' && (
                      <>
                        <button
                          className={styles.btnComplete}
                          onClick={() => handleComplete(po._id)}
                        >
                          Hoàn tất
                        </button>
                        <button
                          className={styles.btnCancel}
                          onClick={() => setCancelModal({ show: true, id: po._id })}
                        >
                          Hủy
                        </button>
                      </>
                    )}
                    {po.status === 'Draft' && (
                      <Link to={`/erp/purchase-orders/${po._id}/edit`} className={styles.btnEdit}>
                        Sửa
                      </Link>
                    )}
                    <Link to={`/erp/purchase-orders/${po._id}`} className={styles.btnView}>
                      Xem
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {purchaseOrdersPagination && (
        <div className={styles.pagination}>
          <button
            disabled={filters.page === 1}
            onClick={() => setFilters((prev) => ({ ...prev, page: prev.page - 1 }))}
          >
            ← Trước
          </button>
          <span>
            Trang {filters.page} / {purchaseOrdersPagination.totalPages}
          </span>
          <button
            disabled={filters.page === purchaseOrdersPagination.totalPages}
            onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}
          >
            Sau →
          </button>
        </div>
      )}

      {/* Cancel Modal */}
      {cancelModal.show && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h2>Hủy Đơn Mua Hàng</h2>
            <div className={styles.formGroup}>
              <label>Lý do hủy đơn</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={4}
                placeholder="Nhập lý do hủy đơn..."
                required
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
                Đóng
              </button>
              <button className={styles.btnDanger} onClick={handleCancelSubmit}>
                Xác nhận hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrdersPage;
