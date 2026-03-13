import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  fetchPurchaseOrderById,
  completePurchaseOrder,
  updatePurchaseOrder,
  clearCurrentPurchaseOrder,
} from '../../store/slices/erpSlice';
import {
  ArrowLeft,
  ChevronRight,
  CheckCircle2,
  Store,
  FileText,
  Box,
  DollarSign,
  Archive,
  Clock,
  AlertTriangle,
  ArrowUp,
  ExternalLink,
  Send,
  RotateCcw,
  Loader2,
} from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import styles from '@assets/styles/erp/PurchaseOrderDetailPage.module.css';

/* ── Helper: Toast ──────────────────────────────────────────────── */
const Toast = ({ toasts }) => (
  <div className={styles.toastContainer}>
    {toasts.map((t) => (
      <div
        key={t.id}
        className={`${styles.toast} ${t.type === 'error' ? styles.toastError : styles.toastSuccess}`}
      >
        <span className={styles.toastIcon}>
          {t.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
        </span>
        {t.message}
      </div>
    ))}
  </div>
);

/* ── Helper: Generic Confirm Modal ──────────────────────────────── */
const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  title,
  desc,
  confirmLabel,
  confirmVariant = 'green',
}) => {
  if (!isOpen) {
    return null;
  }
  const variantCls =
    {
      green: styles.btnModalConfirmGreen,
      amber: styles.btnModalConfirmAmber,
    }[confirmVariant] || styles.btnModalConfirmGreen;
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalIcon}>
          <AlertTriangle size={22} />
        </div>
        <div className={styles.modalTitle}>{title}</div>
        <div className={styles.modalDesc}>{desc}</div>
        <div className={styles.modalActions}>
          <button className={styles.btnModalCancel} onClick={onClose} disabled={isLoading}>
            Cancel
          </button>
          <button className={variantCls} onClick={onConfirm} disabled={isLoading}>
            {isLoading ? <Loader2 size={14} className={styles.spinIcon} /> : null}
            {isLoading ? 'Processing…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Main Component ─────────────────────────────────────────────── */
const PurchaseOrderDetailPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentPurchaseOrder: po, loading } = useSelector((state) => state.erp);

  const [confirmAction, setConfirmAction] = useState(null); // null | 'receive' | 'submit' | 'setDraft'
  const [actionLoading, setActionLoading] = useState(false);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    dispatch(fetchPurchaseOrderById(id));
    return () => {
      dispatch(clearCurrentPurchaseOrder());
    };
  }, [dispatch, id]);

  const addToast = useCallback((message, type = 'success') => {
    const toastId = Date.now();
    setToasts((prev) => [...prev, { id: toastId, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== toastId));
    }, 4000);
  }, []);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);

  const formatDate = (dateString) => {
    if (!dateString) {
      return '-';
    }
    return new Date(dateString).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusConfig = (status) => {
    const map = {
      Draft: { label: 'Nháp', heroClass: styles.badgeHero, lightClass: styles.badgeDraft },
      Pending: {
        label: 'Đang đặt hàng',
        heroClass: styles.badgeHero,
        lightClass: styles.badgePending,
      },
      Completed: {
        label: 'Đã nhận hàng',
        heroClass: styles.badgeHero,
        lightClass: styles.badgeCompleted,
      },
      Cancelled: {
        label: 'Đã hủy',
        heroClass: styles.badgeHero,
        lightClass: styles.badgeCancelled,
      },
    };
    return map[status] || map.Pending;
  };

  const StatusBadge = ({ status, variant = 'light' }) => {
    const cfg = getStatusConfig(status);
    const cls = variant === 'hero' ? cfg.heroClass : cfg.lightClass;
    return (
      <span className={`${styles.badge} ${cls}`}>
        <span className={styles.badgeDot} />
        {cfg.label}
      </span>
    );
  };

  const handleConfirm = async () => {
    setActionLoading(true);
    try {
      if (confirmAction === 'receive') {
        await dispatch(completePurchaseOrder(id)).unwrap();
        addToast('Goods received — inventory updated successfully!', 'success');
      } else if (confirmAction === 'submit') {
        await dispatch(updatePurchaseOrder({ id, updateData: { status: 'Pending' } })).unwrap();
        addToast('Order submitted — status changed to Ordering.', 'success');
      } else if (confirmAction === 'setDraft') {
        await dispatch(updatePurchaseOrder({ id, updateData: { status: 'Draft' } })).unwrap();
        addToast('Order reverted to Draft.', 'success');
      }
      setConfirmAction(null);
      dispatch(fetchPurchaseOrderById(id));
    } catch (err) {
      setConfirmAction(null);
      addToast(`Error: ${err.error || err.message || 'Unknown error'}`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !po) {
    return <LoadingSpinner />;
  }

  const totalItems = po.items?.reduce((s, i) => s + (i.quantity || 0), 0) ?? 0;

  return (
    <div className={styles.container}>
      <Toast toasts={toasts} />

      <ConfirmModal
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirm}
        isLoading={actionLoading}
        title={
          confirmAction === 'receive'
            ? 'Confirm goods received?'
            : confirmAction === 'submit'
              ? 'Submit this order?'
              : confirmAction === 'setDraft'
                ? 'Revert to Draft?'
                : ''
        }
        desc={
          confirmAction === 'receive' ? (
            <span>
              This will <strong>update inventory stock</strong> and cannot be undone. Make sure all
              goods have been received.
            </span>
          ) : confirmAction === 'submit' ? (
            <span>
              Status will change to <strong>Ordering</strong>. You can still cancel or revert to
              Draft later.
            </span>
          ) : confirmAction === 'setDraft' ? (
            <span>
              The order will be moved back to <strong>Draft</strong> status. No inventory changes
              will occur.
            </span>
          ) : (
            ''
          )
        }
        confirmLabel={
          confirmAction === 'receive'
            ? 'Yes, Receive Goods'
            : confirmAction === 'submit'
              ? 'Yes, Submit Order'
              : confirmAction === 'setDraft'
                ? 'Yes, Set as Draft'
                : 'Confirm'
        }
        confirmVariant={
          confirmAction === 'receive' ? 'green' : confirmAction === 'submit' ? 'amber' : 'amber'
        }
      />

      {/* ── Breadcrumb ── */}
      <nav className={styles.breadcrumb} aria-label="breadcrumb">
        <button onClick={() => navigate('/erp')}>ERP</button>
        <ChevronRight size={12} />
        <button onClick={() => navigate('/seller/erp/purchase-orders')}>Purchase Orders</button>
        <ChevronRight size={12} />
        <span className={styles.breadcrumbCurrent}>{po.code}</span>
      </nav>

      {/* ── Hero Card ── */}
      <div className={styles.heroCard}>
        <div className={styles.heroBody}>
          <div className={styles.heroLeft}>
            <StatusBadge status={po.status} variant="hero" />
            <div className={styles.heroCode}>{po.code}</div>
            <div className={styles.heroMeta}>
              <span>Created at {formatDate(po.createdAt)}</span>
              <span className={styles.heroMetaDot} />
              <span>by {po.createdBy?.name || 'Admin'}</span>
              {po.supplierId?.name && (
                <>
                  <span className={styles.heroMetaDot} />
                  <span>{po.supplierId.name}</span>
                </>
              )}
            </div>
          </div>
          <div className={styles.heroRight}>
            <div className={styles.heroAmount}>
              <div className={styles.heroAmountLabel}>Total</div>
              <div className={styles.heroAmountValue}>
                {formatCurrency(po.finalAmount || po.totalAmount)}
              </div>
            </div>
            <div className={styles.heroActions}>
              {po.status === 'Draft' && (
                <button
                  className={`${styles.btnComplete} ${styles.btnHeroAmber}`}
                  onClick={() => setConfirmAction('submit')}
                  disabled={actionLoading}
                >
                  <Send size={15} />
                  Submit Order
                </button>
              )}
              {po.status === 'Pending' && (
                <>
                  <button
                    className={`${styles.btnComplete} ${styles.btnHeroGhost}`}
                    onClick={() => setConfirmAction('setDraft')}
                    disabled={actionLoading}
                  >
                    <RotateCcw size={14} />
                    Set as Draft
                  </button>
                  <button
                    className={styles.btnComplete}
                    onClick={() => setConfirmAction('receive')}
                    disabled={actionLoading}
                  >
                    <CheckCircle2 size={15} />
                    Receive Goods
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Main content grid ── */}
      <div className={styles.mainGrid}>
        {/* Left column */}
        <div className={styles.mainCol}>
          {/* Supplier + Order Info in 2 cards */}
          <div className={styles.section}>
            <h2>
              <Store size={16} />
              Supplier Information
            </h2>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Supplier Name</span>
                {po.supplierId?._id ? (
                  <Link
                    to={`/seller/erp/suppliers/${po.supplierId._id}`}
                    className={styles.infoLink}
                  >
                    {po.supplierId?.name || '-'}
                    <ExternalLink size={12} />
                  </Link>
                ) : (
                  <span className={styles.infoValue}>{po.supplierId?.name || '-'}</span>
                )}
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Contact Person</span>
                <span className={styles.infoValue}>{po.supplierId?.contactPerson || '-'}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Phone</span>
                <span className={styles.infoValue}>{po.supplierId?.phone || '-'}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Email</span>
                <span className={styles.infoValue}>{po.supplierId?.email || '-'}</span>
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <h2>
              <FileText size={16} />
              Order Information
            </h2>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Status</span>
                <StatusBadge status={po.status} variant="light" />
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Expected Delivery Date</span>
                <span className={styles.infoValue}>
                  {po.expectedDeliveryDate ? formatDate(po.expectedDeliveryDate) : '-'}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Received Date</span>
                <span className={styles.infoValue}>
                  {po.receivedDate ? (
                    formatDate(po.receivedDate)
                  ) : (
                    <span className={styles.infoValueMuted}>Not received</span>
                  )}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Number of Items</span>
                <span className={styles.infoValue}>
                  {po.items?.length ?? 0} lines · {totalItems} units
                </span>
              </div>
              {po.notes && (
                <div className={styles.infoItem} style={{ gridColumn: '1 / -1' }}>
                  <span className={styles.infoLabel}>Notes</span>
                  <div className={styles.notesBox}>{po.notes}</div>
                </div>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div className={styles.section}>
            <h2>
              <Box size={16} />
              Products List
            </h2>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>#</th>
                    <th>SKU / Product</th>
                    <th style={{ textAlign: 'center' }}>Quantity</th>
                    <th style={{ textAlign: 'right' }}>Unit Price</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {po.items?.map((item, index) => (
                    <tr key={index}>
                      <td className={styles.rowIndex}>{index + 1}</td>
                      <td>
                        <span className={styles.skuChip}>{item.sku || 'N/A'}</span>
                        {item.productName && (
                          <div className={styles.productName} style={{ marginTop: '0.25rem' }}>
                            {item.productName}
                          </div>
                        )}
                        {item.modelId && (
                          <div className={styles.productSub}>
                            Model: <span className={styles.monoId}>{item.modelId}</span>
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={styles.qtyCell}>{item.quantity}</span>
                      </td>
                      <td>
                        <span className={styles.unitPrice}>{formatCurrency(item.unitPrice)}</span>
                      </td>
                      <td>
                        <span className={styles.amountCell}>
                          {formatCurrency(item.totalPrice ?? item.quantity * item.unitPrice)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Inventory Updates (Completed only) */}
          {po.status === 'Completed' && po.inventoryUpdates?.length > 0 && (
            <div className={styles.section}>
              <h2>
                <Archive size={16} />
                Inventory History
              </h2>
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>SKU</th>
                      <th style={{ textAlign: 'center' }}>Stock In</th>
                      <th style={{ textAlign: 'center' }}>Previous Stock</th>
                      <th style={{ textAlign: 'center' }}>New Stock</th>
                      <th>Old Cost Price</th>
                      <th>New Cost Price</th>
                      <th>Landed Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {po.inventoryUpdates.map((upd, index) => (
                      <tr key={index}>
                        <td>
                          <span className={styles.skuChip}>{upd.sku}</span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={styles.diffPositive}>
                            <ArrowUp size={12} />+{upd.quantityAdded}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={styles.diffNeutral}>{upd.oldStock}</span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={styles.diffPositive}>{upd.newStock}</span>
                        </td>
                        <td>
                          <span className={styles.costOld}>{formatCurrency(upd.oldCostPrice)}</span>
                        </td>
                        <td>
                          <span className={styles.costNew}>{formatCurrency(upd.newCostPrice)}</span>
                        </td>
                        <td>
                          <span className={styles.amountCell}>
                            {formatCurrency(upd.landedCost)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className={styles.sideCol}>
          {/* Financial Summary Card */}
          <div className={styles.summaryCard}>
            <div className={styles.summaryHeader}>
              <DollarSign size={16} />
              Financial Summary
            </div>
            <div className={styles.summaryBody}>
              <div className={styles.summaryRow}>
                <span className={styles.summaryRowLabel}>Subtotal</span>
                <span className={styles.summaryRowValue}>{formatCurrency(po.totalAmount)}</span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryRowLabel}>Shipping Cost</span>
                <span
                  className={po.shippingCost ? styles.summaryRowValue : styles.summaryRowValueMuted}
                >
                  {formatCurrency(po.shippingCost)}
                </span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryRowLabel}>Tax</span>
                <span
                  className={po.taxAmount ? styles.summaryRowValue : styles.summaryRowValueMuted}
                >
                  {formatCurrency(po.taxAmount)}
                </span>
              </div>
              {po.otherCost !== undefined && (
                <div className={styles.summaryRow}>
                  <span className={styles.summaryRowLabel}>Other Costs</span>
                  <span
                    className={po.otherCost ? styles.summaryRowValue : styles.summaryRowValueMuted}
                  >
                    {formatCurrency(po.otherCost)}
                  </span>
                </div>
              )}
            </div>
            <div className={styles.summaryTotal}>
              <span className={styles.summaryTotalLabel}>Total</span>
              <span className={styles.summaryTotalValue}>
                {formatCurrency(po.finalAmount || po.totalAmount)}
              </span>
            </div>
          </div>

          {/* Timeline Card */}
          <div className={styles.section}>
            <h2>
              <Clock size={16} />
              Timeline History
            </h2>
            <div className={styles.timeline}>
              <div className={styles.timelineItem}>
                <div
                  className={`${styles.timelineDot} ${po.status === 'Draft' ? styles.active : styles.completed}`}
                />
                <div className={styles.timelineContent}>
                  <div className={styles.timelineTitle}>Đơn hàng được tạo</div>
                  <div className={styles.timelineDate}>{formatDate(po.createdAt)}</div>
                </div>
              </div>

              {(po.status === 'Pending' ||
                po.status === 'Completed' ||
                po.status === 'Cancelled') && (
                <div className={styles.timelineItem}>
                  <div
                    className={`${styles.timelineDot} ${
                      po.status === 'Pending'
                        ? styles.active
                        : po.status === 'Completed' || po.status === 'Cancelled'
                          ? styles.completed
                          : ''
                    }`}
                  />
                  <div className={styles.timelineContent}>
                    <div className={styles.timelineTitle}>Đang đặt hàng</div>
                    <div className={styles.timelineDate}>
                      {po.updatedAt ? formatDate(po.updatedAt) : '-'}
                    </div>
                  </div>
                </div>
              )}

              {po.receivedDate && (
                <div className={styles.timelineItem}>
                  <div className={`${styles.timelineDot} ${styles.completed}`} />
                  <div className={styles.timelineContent}>
                    <div className={styles.timelineTitle}>Đã nhận hàng &amp; nhập kho</div>
                    <div className={styles.timelineDate}>{formatDate(po.receivedDate)}</div>
                  </div>
                </div>
              )}

              {po.cancelledAt && (
                <div className={styles.timelineItem}>
                  <div className={`${styles.timelineDot} ${styles.cancelled}`} />
                  <div className={styles.timelineContent}>
                    <div className={styles.timelineTitle}>Đơn hàng đã hủy</div>
                    <div className={styles.timelineDate}>{formatDate(po.cancelledAt)}</div>
                    {po.cancelReason && (
                      <div className={styles.timelineReason}>{po.cancelReason}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrderDetailPage;
