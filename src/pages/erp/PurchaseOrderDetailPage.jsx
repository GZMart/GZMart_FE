import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  fetchPurchaseOrderById,
  completePurchaseOrder,
  clearCurrentPurchaseOrder,
} from '../../store/slices/erpSlice';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import styles from '@assets/styles/erp/PurchaseOrderDetailPage.module.css';

const PurchaseOrderDetailPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentPurchaseOrder: po, loading } = useSelector((state) => state.erp);

  useEffect(() => {
    dispatch(fetchPurchaseOrderById(id));
    return () => {
      dispatch(clearCurrentPurchaseOrder());
    };
  }, [dispatch, id]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('vi-VN');
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

  const handleComplete = async () => {
    if (
      window.confirm(
        'Xác nhận hoàn tất đơn mua hàng? Hành động này sẽ cập nhật tồn kho và không thể hoàn tác.'
      )
    ) {
      try {
        await dispatch(completePurchaseOrder(id)).unwrap();
        alert('Đã hoàn tất đơn mua hàng!');
        dispatch(fetchPurchaseOrderById(id));
      } catch (err) {
        alert('Không thể hoàn tất đơn mua hàng: ' + (err.error || err));
      }
    }
  };

  if (loading || !po) {
    return <LoadingSpinner />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <button className={styles.btnBack} onClick={() => navigate('/erp/purchase-orders')}>
            ← Quay lại
          </button>
          <h1>{po.code}</h1>
          <p className={styles.subtitle}>
            Tạo lúc {formatDate(po.createdAt)} bởi {po.createdBy?.name || 'Admin'}
          </p>
        </div>
        <div className={styles.headerActions}>
          {getStatusBadge(po.status)}
          {po.status === 'Pending' && (
            <button className={styles.btnComplete} onClick={handleComplete}>
              ✓ Hoàn tất
            </button>
          )}
        </div>
      </div>

      {/* Supplier Info */}
      <div className={styles.section}>
        <h2>Thông tin nhà cung cấp</h2>
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <span className={styles.label}>Tên NCC:</span>
            <Link to={`/erp/suppliers/${po.supplierId?._id}`} className={styles.link}>
              {po.supplierId?.name || '-'}
            </Link>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.label}>Người liên hệ:</span>
            <span>{po.supplierId?.contactPerson || '-'}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.label}>Điện thoại:</span>
            <span>{po.supplierId?.phone || '-'}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.label}>Email:</span>
            <span>{po.supplierId?.email || '-'}</span>
          </div>
        </div>
      </div>

      {/* Order Info */}
      <div className={styles.section}>
        <h2>Thông tin đơn hàng</h2>
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <span className={styles.label}>Trạng thái:</span>
            {getStatusBadge(po.status)}
          </div>
          <div className={styles.infoItem}>
            <span className={styles.label}>Ngày giao dự kiến:</span>
            <span>{po.expectedDeliveryDate ? formatDate(po.expectedDeliveryDate) : '-'}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.label}>Ngày nhận hàng:</span>
            <span>{po.receivedDate ? formatDate(po.receivedDate) : '-'}</span>
          </div>
          {po.notes && (
            <div className={styles.infoItem} style={{ gridColumn: '1 / -1' }}>
              <span className={styles.label}>Ghi chú:</span>
              <span>{po.notes}</span>
            </div>
          )}
        </div>
      </div>

      {/* Items Table */}
      <div className={styles.section}>
        <h2>Danh sách sản phẩm</h2>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>SKU</th>
                <th>Product ID</th>
                <th>Model ID</th>
                <th>Số lượng</th>
                <th>Đơn giá</th>
                <th>Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {po.items?.map((item, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td className={styles.sku}>{item.sku}</td>
                  <td className={styles.mono}>{item.productId}</td>
                  <td className={styles.mono}>{item.modelId || '-'}</td>
                  <td>{item.quantity}</td>
                  <td>{formatCurrency(item.unitPrice)}</td>
                  <td className={styles.amount}>
                    {formatCurrency(item.quantity * item.unitPrice)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Financial Summary */}
      <div className={styles.section}>
        <h2>Tổng kết tài chính</h2>
        <div className={styles.summary}>
          <div className={styles.summaryRow}>
            <span>Tổng tiền hàng:</span>
            <strong>{formatCurrency(po.totalAmount)}</strong>
          </div>
          <div className={styles.summaryRow}>
            <span>Phí vận chuyển:</span>
            <span>{formatCurrency(po.shippingCost)}</span>
          </div>
          <div className={styles.summaryRow}>
            <span>Thuế:</span>
            <span>{formatCurrency(po.taxAmount)}</span>
          </div>
          <div className={styles.summaryRow}>
            <span>Chi phí khác:</span>
            <span>{formatCurrency(po.otherCost)}</span>
          </div>
          <div className={styles.summaryRow + ' ' + styles.total}>
            <span>Tổng cộng:</span>
            <strong>{formatCurrency(po.finalAmount)}</strong>
          </div>
        </div>
      </div>

      {/* Inventory Updates (if completed) */}
      {po.status === 'Completed' && po.inventoryUpdates?.length > 0 && (
        <div className={styles.section}>
          <h2>📦 Cập nhật tồn kho</h2>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Nhập kho</th>
                  <th>Tồn trước</th>
                  <th>Tồn sau</th>
                  <th>Giá vốn cũ</th>
                  <th>Giá vốn mới</th>
                  <th>Landed Cost</th>
                </tr>
              </thead>
              <tbody>
                {po.inventoryUpdates.map((update, index) => (
                  <tr key={index}>
                    <td className={styles.sku}>{update.sku}</td>
                    <td className={styles.highlight}>+{update.quantityAdded}</td>
                    <td>{update.oldStock}</td>
                    <td className={styles.highlight}>{update.newStock}</td>
                    <td>{formatCurrency(update.oldCostPrice)}</td>
                    <td className={styles.highlight}>{formatCurrency(update.newCostPrice)}</td>
                    <td>{formatCurrency(update.landedCost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className={styles.section}>
        <h2>Lịch sử thay đổi</h2>
        <div className={styles.timeline}>
          <div className={styles.timelineItem}>
            <div className={styles.timelineDot}></div>
            <div className={styles.timelineContent}>
              <h4>Tạo đơn hàng</h4>
              <p>{formatDate(po.createdAt)}</p>
            </div>
          </div>
          {po.receivedDate && (
            <div className={styles.timelineItem}>
              <div className={styles.timelineDot + ' ' + styles.completed}></div>
              <div className={styles.timelineContent}>
                <h4>Hoàn tất đơn hàng</h4>
                <p>{formatDate(po.receivedDate)}</p>
              </div>
            </div>
          )}
          {po.cancelledAt && (
            <div className={styles.timelineItem}>
              <div className={styles.timelineDot + ' ' + styles.cancelled}></div>
              <div className={styles.timelineContent}>
                <h4>Hủy đơn hàng</h4>
                <p>{formatDate(po.cancelledAt)}</p>
                {po.cancelReason && <p className={styles.reason}>{po.cancelReason}</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrderDetailPage;
