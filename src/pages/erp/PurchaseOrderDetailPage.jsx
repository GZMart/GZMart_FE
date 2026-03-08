import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  fetchPurchaseOrderById,
  completePurchaseOrder,
  clearCurrentPurchaseOrder,
} from '../../store/slices/erpSlice';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import styles from '@assets/styles/erp/PurchaseOrderDetailPage.module.css';

/* ── SVG Icons ──────────────────────────────────────────────────── */
const ArrowLeftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
    <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" width="12" height="12">
    <path fillRule="evenodd" d="M6.22 4.22a.75.75 0 0 1 1.06 0l3.25 3.25a.75.75 0 0 1 0 1.06l-3.25 3.25a.75.75 0 0 1-1.06-1.06L9.19 8 6.22 5.03a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
  </svg>
);

const CheckCircleIcon = ({ size = 16 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width={size} height={size}>
    <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
  </svg>
);

const BuildingStorefrontIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
    <path d="M2.879 7.121A3 3 0 0 0 7.5 6.66a2.997 2.997 0 0 0 2.5 1.34 2.997 2.997 0 0 0 2.5-1.34 3 3 0 0 0 4.621.461l-2-4.5A.75.75 0 0 0 16.436 2H3.564a.75.75 0 0 0-.693.461l-2 4.5a.999.999 0 0 0 .008.16Z" />
    <path fillRule="evenodd" d="M10 10.5a4.478 4.478 0 0 1-1.988-.464 4.482 4.482 0 0 1-4.012.979V18a.75.75 0 0 0 .75.75h10.5a.75.75 0 0 0 .75-.75v-6.985a4.482 4.482 0 0 1-4.012-.979A4.478 4.478 0 0 1 10 10.5Zm-2 3.25a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
  </svg>
);

const DocumentTextIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
    <path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 0 0 3 3.5v13A1.5 1.5 0 0 0 4.5 18h11a1.5 1.5 0 0 0 1.5-1.5V7.621a1.5 1.5 0 0 0-.44-1.06l-4.12-4.122A1.5 1.5 0 0 0 11.378 2H4.5Zm2.25 8.5a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-6.5Zm0 3a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-6.5Zm0-6a.75.75 0 0 0 0 1.5h3a.75.75 0 0 0 0-1.5h-3Z" clipRule="evenodd" />
  </svg>
);

const CubeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
    <path d="M10.362 1.093a.75.75 0 0 0-.724 0L2.523 5.018 10 9.143l7.477-4.125-7.115-3.925Z" />
    <path d="M18 6.443l-7.25 3.997v7.06l6.5-3.983a.75.75 0 0 0 .25-.56V6.443ZM9.25 17.5v-7.06L2 6.443V12.917a.75.75 0 0 0 .25.56l7 4.29v-.266Z" />
  </svg>
);

const CurrencyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
    <path d="M10.75 10.818v2.614A3.13 3.13 0 0 0 11.888 13c.482-.315.612-.648.612-.875 0-.227-.13-.56-.612-.875a3.13 3.13 0 0 0-1.138-.432ZM8.33 8.62c.053.055.115.11.184.164.208.16.46.284.736.363V6.603a2.45 2.45 0 0 0-.35.13c-.14.065-.27.143-.386.233-.377.292-.514.627-.514.909 0 .184.058.39.33.566v-.001Z" />
    <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-6a.75.75 0 0 1 .75.75v.316a3.78 3.78 0 0 1 1.653.713c.426.33.744.74.925 1.2a.75.75 0 0 1-1.395.55 1.35 1.35 0 0 0-.447-.563 2.187 2.187 0 0 0-.736-.363V9.3c.698.093 1.383.32 1.959.762.556.428.85 1.023.85 1.7 0 .63-.283 1.213-.815 1.677-.53.463-1.24.733-1.994.826V14.25a.75.75 0 0 1-1.5 0v-.232a4.125 4.125 0 0 1-1.853-.801 2.25 2.25 0 0 1-.83-1.566.75.75 0 1 1 1.496-.103c.051.37.267.645.595.849a2.62 2.62 0 0 0 .592.24V10.08a3.8 3.8 0 0 1-1.517-.59C8.18 9.144 7.75 8.568 7.75 7.75c0-.63.28-1.22.81-1.686A3.752 3.752 0 0 1 9.75 5.416V4.75A.75.75 0 0 1 10 4Z" clipRule="evenodd" />
  </svg>
);

const ArchiveBoxIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
    <path d="M2 3a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H2Z" />
    <path fillRule="evenodd" d="M2 7.5h16l-.811 7.71a2 2 0 0 1-1.99 1.79H4.802a2 2 0 0 1-1.99-1.79L2 7.5ZM7 11a1 1 0 0 1 1-1h4a1 1 0 1 1 0 2H8a1 1 0 0 1-1-1Z" clipRule="evenodd" />
  </svg>
);

const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
    <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-13a.75.75 0 0 0-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 0 0 0-1.5h-3.25V5Z" clipRule="evenodd" />
  </svg>
);

const ExclamationTriangleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="22" height="22">
    <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
  </svg>
);

const ArrowUpIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" width="12" height="12">
    <path fillRule="evenodd" d="M8 14a.75.75 0 0 1-.75-.75V4.56L4.03 7.78a.75.75 0 0 1-1.06-1.06l4.5-4.5a.75.75 0 0 1 1.06 0l4.5 4.5a.75.75 0 0 1-1.06 1.06L8.75 4.56v8.69A.75.75 0 0 1 8 14Z" clipRule="evenodd" />
  </svg>
);

const ExternalLinkIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" width="12" height="12">
    <path d="M6.22 8.72a.75.75 0 0 0 1.06 1.06l5.22-5.22v1.69a.75.75 0 0 0 1.5 0v-3.5a.75.75 0 0 0-.75-.75h-3.5a.75.75 0 0 0 0 1.5h1.69L6.22 8.72Z" />
    <path d="M3.5 6.75c0-.69.56-1.25 1.25-1.25H7A.75.75 0 0 0 7 4H4.75A2.75 2.75 0 0 0 2 6.75v4.5A2.75 2.75 0 0 0 4.75 14h4.5A2.75 2.75 0 0 0 12 11.25V9a.75.75 0 0 0-1.5 0v2.25c0 .69-.56 1.25-1.25 1.25h-4.5c-.69 0-1.25-.56-1.25-1.25v-4.5Z" />
  </svg>
);

/* ── Helper: Toast ──────────────────────────────────────────────── */
const Toast = ({ toasts }) => (
  <div className={styles.toastContainer}>
    {toasts.map((t) => (
      <div key={t.id} className={`${styles.toast} ${t.type === 'error' ? styles.toastError : styles.toastSuccess}`}>
        <span className={styles.toastIcon}>
          {t.type === 'error'
            ? <ExclamationTriangleIcon />
            : <CheckCircleIcon size={18} />}
        </span>
        {t.message}
      </div>
    ))}
  </div>
);

/* ── Helper: Confirm Modal ──────────────────────────────────────── */
const ConfirmModal = ({ isOpen, onClose, onConfirm, isLoading }) => {
  if (!isOpen) return null;
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalIcon}>
          <ExclamationTriangleIcon />
        </div>
        <div className={styles.modalTitle}>Confirm Order Completion</div>
        <div className={styles.modalDesc}>
          This action will <strong>update inventory</strong> and cannot be undone.
          Are you sure you want to complete this purchase order?
        </div>
        <div className={styles.modalActions}>
          <button className={styles.btnModalCancel} onClick={onClose} disabled={isLoading}>
            Cancel
          </button>
          <button className={styles.btnModalConfirm} onClick={onConfirm} disabled={isLoading}>
            <CheckCircleIcon size={15} />
            {isLoading ? 'Processing...' : 'Confirm Completion'}
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

  const [showConfirm, setShowConfirm] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    dispatch(fetchPurchaseOrderById(id));
    return () => { dispatch(clearCurrentPurchaseOrder()); };
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
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const getStatusConfig = (status) => {
    const map = {
      Draft:     { label: 'Draft',        heroClass: styles.badgeHero, lightClass: styles.badgeDraft },
      Pending:   { label: 'Pending',  heroClass: styles.badgeHero, lightClass: styles.badgePending },
      Completed: { label: 'Completed',   heroClass: styles.badgeHero, lightClass: styles.badgeCompleted },
      Cancelled: { label: 'Cancelled',     heroClass: styles.badgeHero, lightClass: styles.badgeCancelled },
    };
    return map[status] || map.Draft;
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

  const handleComplete = async () => {
    setCompleting(true);
    try {
      await dispatch(completePurchaseOrder(id)).unwrap();
      setShowConfirm(false);
      addToast('Purchase order completed and inventory updated!', 'success');
      dispatch(fetchPurchaseOrderById(id));
    } catch (err) {
      setShowConfirm(false);
      addToast('Cannot complete: ' + (err.error || err.message || 'Unknown Error'), 'error');
    } finally {
      setCompleting(false);
    }
  };

  if (loading || !po) return <LoadingSpinner />;

  const totalItems = po.items?.reduce((s, i) => s + (i.quantity || 0), 0) ?? 0;

  return (
    <div className={styles.container}>
      <Toast toasts={toasts} />

      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleComplete}
        isLoading={completing}
      />

      {/* ── Breadcrumb ── */}
      <nav className={styles.breadcrumb} aria-label="breadcrumb">
        <button onClick={() => navigate('/erp')}>ERP</button>
        <ChevronRightIcon />
        <button onClick={() => navigate('/erp/purchase-orders')}>Purchase Orders</button>
        <ChevronRightIcon />
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
              <div className={styles.heroAmountValue}>{formatCurrency(po.finalAmount || po.totalAmount)}</div>
            </div>
            {po.status === 'Pending' && (
              <button className={styles.btnComplete} onClick={() => setShowConfirm(true)}>
                <CheckCircleIcon size={16} />
                Complete Order
              </button>
            )}
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
              <BuildingStorefrontIcon />
              Supplier Information
            </h2>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Supplier Name</span>
                {po.supplierId?._id ? (
                  <Link to={`/erp/suppliers/${po.supplierId._id}`} className={styles.infoLink}>
                    {po.supplierId?.name || '-'}
                    <ExternalLinkIcon />
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
              <DocumentTextIcon />
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
                  {po.receivedDate ? formatDate(po.receivedDate) : <span className={styles.infoValueMuted}>Not received</span>}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Number of Items</span>
                <span className={styles.infoValue}>{po.items?.length ?? 0} lines · {totalItems} units</span>
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
              <CubeIcon />
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
                <ArchiveBoxIcon />
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
                        <td><span className={styles.skuChip}>{upd.sku}</span></td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={styles.diffPositive}>
                            <ArrowUpIcon />
                            +{upd.quantityAdded}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={styles.diffNeutral}>{upd.oldStock}</span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={styles.diffPositive}>{upd.newStock}</span>
                        </td>
                        <td><span className={styles.costOld}>{formatCurrency(upd.oldCostPrice)}</span></td>
                        <td><span className={styles.costNew}>{formatCurrency(upd.newCostPrice)}</span></td>
                        <td><span className={styles.amountCell}>{formatCurrency(upd.landedCost)}</span></td>
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
              <CurrencyIcon />
              Financial Summary
            </div>
            <div className={styles.summaryBody}>
              <div className={styles.summaryRow}>
                <span className={styles.summaryRowLabel}>Subtotal</span>
                <span className={styles.summaryRowValue}>{formatCurrency(po.totalAmount)}</span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryRowLabel}>Shipping Cost</span>
                <span className={po.shippingCost ? styles.summaryRowValue : styles.summaryRowValueMuted}>
                  {formatCurrency(po.shippingCost)}
                </span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryRowLabel}>Tax</span>
                <span className={po.taxAmount ? styles.summaryRowValue : styles.summaryRowValueMuted}>
                  {formatCurrency(po.taxAmount)}
                </span>
              </div>
              {po.otherCost !== undefined && (
                <div className={styles.summaryRow}>
                  <span className={styles.summaryRowLabel}>Other Costs</span>
                  <span className={po.otherCost ? styles.summaryRowValue : styles.summaryRowValueMuted}>
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
              <ClockIcon />
              Timeline History
            </h2>
            <div className={styles.timeline}>
              <div className={styles.timelineItem}>
                <div className={`${styles.timelineDot} ${po.status === 'Draft' ? styles.active : styles.completed}`} />
                <div className={styles.timelineContent}>
                  <div className={styles.timelineTitle}>Order Created</div>
                  <div className={styles.timelineDate}>{formatDate(po.createdAt)}</div>
                </div>
              </div>

              {(po.status === 'Pending' || po.status === 'Completed' || po.status === 'Cancelled') && (
                <div className={styles.timelineItem}>
                  <div className={`${styles.timelineDot} ${
                    po.status === 'Pending' ? styles.active
                    : po.status === 'Completed' || po.status === 'Cancelled' ? styles.completed
                    : ''
                  }`} />
                  <div className={styles.timelineContent}>
                    <div className={styles.timelineTitle}>Pending</div>
                    <div className={styles.timelineDate}>{po.updatedAt ? formatDate(po.updatedAt) : '-'}</div>
                  </div>
                </div>
              )}

              {po.receivedDate && (
                <div className={styles.timelineItem}>
                  <div className={`${styles.timelineDot} ${styles.completed}`} />
                  <div className={styles.timelineContent}>
                    <div className={styles.timelineTitle}>Order Completed</div>
                    <div className={styles.timelineDate}>{formatDate(po.receivedDate)}</div>
                  </div>
                </div>
              )}

              {po.cancelledAt && (
                <div className={styles.timelineItem}>
                  <div className={`${styles.timelineDot} ${styles.cancelled}`} />
                  <div className={styles.timelineContent}>
                    <div className={styles.timelineTitle}>Order Cancelled</div>
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
