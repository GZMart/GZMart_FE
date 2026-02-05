import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  fetchLowStockItems,
  fetchInventoryValuation,
  fetchPurchaseOrders,
} from '../../store/slices/erpSlice';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import styles from '@assets/styles/erp/ERPDashboard.module.css';

const ERPDashboard = () => {
  const dispatch = useDispatch();
  const { lowStockItems, inventoryValuation, purchaseOrders, loading } = useSelector(
    (state) => state.erp
  );

  useEffect(() => {
    dispatch(fetchLowStockItems({ limit: 10 }));
    dispatch(fetchInventoryValuation());
    dispatch(fetchPurchaseOrders({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' }));
  }, [dispatch]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount || 0);
  };

  const getStatusCounts = () => {
    const counts = {
      pending: 0,
      completed: 0,
      cancelled: 0,
    };

    purchaseOrders.forEach((po) => {
      if (po.status === 'Pending') counts.pending++;
      else if (po.status === 'Completed') counts.completed++;
      else if (po.status === 'Cancelled') counts.cancelled++;
    });

    return counts;
  };

  const statusCounts = getStatusCounts();

  if (loading && !inventoryValuation) {
    return <LoadingSpinner />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Tổng Quan ERP / Sourcing</h1>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#dbeafe' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <div className={styles.statContent}>
            <h3>Đơn mua hàng</h3>
            <p className={styles.statValue}>{purchaseOrders.length}</p>
            <p className={styles.statDetail}>{statusCounts.pending} đang chờ xử lý</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#dcfce7' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          </div>
          <div className={styles.statContent}>
            <h3>Giá trị tồn kho</h3>
            <p className={styles.statValue}>{formatCurrency(inventoryValuation?.totalValue)}</p>
            <p className={styles.statDetail}>{inventoryValuation?.totalItems || 0} sản phẩm</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#fef3c7' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div className={styles.statContent}>
            <h3>Cảnh báo hàng thấp</h3>
            <p className={styles.statValue}>{lowStockItems.length}</p>
            <p className={styles.statDetail}>Cần đặt hàng bổ sung</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#e0e7ff' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6366f1">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <div className={styles.statContent}>
            <h3>Tổng số lượng</h3>
            <p className={styles.statValue}>{inventoryValuation?.totalUnits || 0}</p>
            <p className={styles.statDetail}>Đơn vị sản phẩm</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className={styles.quickActions}>
        <h2>Thao tác nhanh</h2>
        <div className={styles.actionGrid}>
          <Link to="/erp/purchase-orders/create" className={styles.actionCard}>
            <div className={styles.actionIcon} style={{ background: '#3b82f6' }}>
              +
            </div>
            <p>Tạo đơn mua hàng</p>
          </Link>

          <Link to="/erp/suppliers/create" className={styles.actionCard}>
            <div className={styles.actionIcon} style={{ background: '#10b981' }}>
              +
            </div>
            <p>Thêm nhà cung cấp</p>
          </Link>

          <Link to="/erp/inventory" className={styles.actionCard}>
            <div className={styles.actionIcon} style={{ background: '#f59e0b' }}>
              📊
            </div>
            <p>Xem tồn kho</p>
          </Link>

          <Link to="/erp/reports" className={styles.actionCard}>
            <div className={styles.actionIcon} style={{ background: '#6366f1' }}>
              📈
            </div>
            <p>Báo cáo P&L</p>
          </Link>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>⚠️ Cảnh báo hàng sắp hết</h2>
            <Link to="/erp/inventory" className={styles.linkButton}>
              Xem tất cả →
            </Link>
          </div>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Tên sản phẩm</th>
                  <th>Tồn kho hiện tại</th>
                  <th>Ngưỡng cảnh báo</th>
                  <th>Giá vốn</th>
                </tr>
              </thead>
              <tbody>
                {lowStockItems.slice(0, 5).map((item) => (
                  <tr key={item._id}>
                    <td className={styles.sku}>{item.sku}</td>
                    <td>{item.productName}</td>
                    <td>
                      <span className={styles.stockLow}>{item.currentStock}</span>
                    </td>
                    <td>{item.threshold}</td>
                    <td>{formatCurrency(item.costPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Purchase Orders */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Đơn mua hàng gần đây</h2>
          <Link to="/erp/purchase-orders" className={styles.linkButton}>
            Xem tất cả →
          </Link>
        </div>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Nhà cung cấp</th>
                <th>Ngày tạo</th>
                <th>Tổng tiền</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {purchaseOrders.slice(0, 5).map((po) => (
                <tr key={po._id}>
                  <td>
                    <Link to={`/erp/purchase-orders/${po._id}`} className={styles.link}>
                      {po.code}
                    </Link>
                  </td>
                  <td>{po.supplierId?.name || '-'}</td>
                  <td>{new Date(po.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td className={styles.amount}>{formatCurrency(po.finalAmount)}</td>
                  <td>
                    <span className={styles[`badge${po.status}`]}>{po.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ERPDashboard;
