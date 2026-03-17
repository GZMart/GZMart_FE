import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  ClipboardList,
  BarChart3,
  AlertTriangle,
  Package,
  PlusCircle,
  Users,
  Layers,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  DollarSign,
  Clock,
  CheckCircle,
  Edit2,
  X,
  Save,
} from 'lucide-react';
import {
  fetchLowStockItems,
  fetchInventoryValuation,
  fetchPurchaseOrders,
  fetchExchangeRate,
  syncExchangeRate,
  updateExchangeRate,
} from '../../store/slices/erpSlice';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import styles from '@assets/styles/erp/ERPDashboard.module.css';

const ERPDashboard = () => {
  const dispatch = useDispatch();
  const {
    lowStockItems,
    inventoryValuation,
    purchaseOrders,
    purchaseOrdersPagination,
    loading,
    exchangeRate,
    exchangeRateSyncing,
  } = useSelector((state) => state.erp);

  // Manual rate edit state
  const [editingRate, setEditingRate] = useState(false);
  const [rateInput, setRateInput] = useState('');
  const [rateNote, setRateNote] = useState('');
  const [rateSaving, setRateSaving] = useState(false);
  const [rateMsg, setRateMsg] = useState(null);

  useEffect(() => {
    dispatch(fetchLowStockItems({ limit: 10 }));
    dispatch(fetchInventoryValuation());
    dispatch(fetchPurchaseOrders({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' }));
    dispatch(fetchExchangeRate());
  }, [dispatch]);

  const handleSyncRate = async () => {
    const result = await dispatch(syncExchangeRate());
    if (syncExchangeRate.fulfilled.match(result)) {
      setRateMsg({
        type: 'success',
        text: `Synced: 1 ¥ = ${result.payload.rate?.toLocaleString('vi-VN')} ₫`,
      });
    } else {
      setRateMsg({ type: 'error', text: 'Sync failed — all external APIs unavailable' });
    }
    setTimeout(() => setRateMsg(null), 4000);
  };

  const handleSaveManualRate = async () => {
    const parsed = parseFloat(rateInput);
    if (!parsed || parsed <= 0) {
      return;
    }
    setRateSaving(true);
    const result = await dispatch(
      updateExchangeRate({ rate: parsed, note: rateNote.trim() || undefined })
    );
    setRateSaving(false);
    if (updateExchangeRate.fulfilled.match(result)) {
      setEditingRate(false);
      setRateInput('');
      setRateNote('');
      setRateMsg({ type: 'success', text: `Rate set to ${parsed.toLocaleString('vi-VN')} ₫/¥` });
    } else {
      setRateMsg({ type: 'error', text: 'Failed to update rate' });
    }
    setTimeout(() => setRateMsg(null), 4000);
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount || 0);

  const formatDate = (dateString) => {
    if (!dateString) {
      return '—';
    }
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getStatusCounts = () => {
    const sc = purchaseOrdersPagination?.statusCounts;
    if (sc) {
      return {
        pending: sc.Pending ?? 0,
        completed: sc.Completed ?? 0,
        cancelled: sc.Cancelled ?? 0,
        draft: sc.Draft ?? 0,
      };
    }
    // Fallback: count from loaded items (may be inaccurate if paginated)
    const counts = { pending: 0, completed: 0, cancelled: 0, draft: 0 };
    purchaseOrders.forEach((po) => {
      const key = po.status?.toLowerCase();
      if (key in counts) {
        counts[key]++;
      }
    });
    return counts;
  };

  const getPOStatusClass = (status) => {
    const map = {
      Draft: styles.badgeDraft,
      Pending: styles.badgePending,
      Completed: styles.badgeCompleted,
      Cancelled: styles.badgeCancelled,
    };
    return map[status] || styles.badgeDraft;
  };

  const statusCounts = getStatusCounts();
  const todayLabel = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  if (loading && !inventoryValuation) {
    return <LoadingSpinner />;
  }

  const statCards = [
    {
      icon: ClipboardList,
      label: 'Purchase Orders',
      value:
        purchaseOrdersPagination?.statusCounts?.total ??
        purchaseOrdersPagination?.total ??
        purchaseOrders.length,
      detail: `${statusCounts.pending} ordering`,
      accentColor: '#1a56db',
      bgColor: '#eff6ff',
    },
    {
      icon: BarChart3,
      label: 'Inventory Value',
      value: formatCurrency(inventoryValuation?.totalValue),
      detail: `${inventoryValuation?.totalItems || 0} products`,
      accentColor: '#059669',
      bgColor: '#f0fdf4',
    },
    {
      icon: AlertTriangle,
      label: 'Low Stock Alerts',
      value: lowStockItems.length,
      detail: lowStockItems.length > 0 ? 'Restock needed' : 'All stocked',
      accentColor: lowStockItems.length > 0 ? '#dc2626' : '#6b7280',
      bgColor: lowStockItems.length > 0 ? '#fef2f2' : '#f9fafb',
    },
    {
      icon: Package,
      label: 'Total Units',
      value: inventoryValuation?.totalUnits || 0,
      detail: 'In stock',
      accentColor: '#7c3aed',
      bgColor: '#f5f3ff',
    },
  ];

  const quickActions = [
    {
      icon: PlusCircle,
      label: 'Create Order',
      desc: 'New purchase order',
      to: '/seller/erp/purchase-orders/create',
      accentColor: '#1a56db',
      bgColor: '#eff6ff',
    },
    {
      icon: Users,
      label: 'Suppliers',
      desc: 'Manage suppliers',
      to: '/seller/erp/suppliers',
      accentColor: '#059669',
      bgColor: '#f0fdf4',
    },
    {
      icon: Layers,
      label: 'Inventory',
      desc: 'View stock levels',
      to: '/seller/inventory',
      accentColor: '#d97706',
      bgColor: '#fffbeb',
    },
    {
      icon: TrendingUp,
      label: 'Purchase Orders',
      desc: 'View all orders',
      to: '/seller/erp/purchase-orders',
      accentColor: '#7c3aed',
      bgColor: '#f5f3ff',
    },
  ];

  return (
    <div className={styles.container}>
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Sourcing Dashboard</h1>
          <p className={styles.subtitle}>Supply chain overview — {todayLabel}</p>
        </div>
        <Link to="/seller/erp/purchase-orders/create" className={styles.btnPrimary}>
          <PlusCircle size={15} />
          New Order
        </Link>
      </div>

      {/* ── Exchange Rate Banner ────────────────────────────────── */}
      <div className={styles.xrBanner}>
        <div className={styles.xrLeft}>
          <div className={styles.xrIconWrap}>
            <DollarSign size={18} strokeWidth={2} color="#d97706" />
          </div>
          <div className={styles.xrInfo}>
            <span className={styles.xrLabel}>CNY / VND Exchange Rate</span>
            {editingRate ? (
              <div className={styles.xrEditRow}>
                <input
                  type="number"
                  className={styles.xrInput}
                  value={rateInput}
                  onChange={(e) => setRateInput(e.target.value)}
                  placeholder={exchangeRate?.rate || 3500}
                  min="1"
                  autoFocus
                />
                <input
                  type="text"
                  className={styles.xrInputNote}
                  value={rateNote}
                  onChange={(e) => setRateNote(e.target.value)}
                  placeholder="Note (optional)"
                  maxLength={200}
                />
              </div>
            ) : (
              <span className={styles.xrRate}>
                1 ¥ =&nbsp;
                <strong>{(exchangeRate?.rate ?? 3500).toLocaleString('vi-VN')}</strong>
                &nbsp;₫
                <span
                  className={`${styles.xrSourceBadge} ${exchangeRate?.source === 'manual' ? styles.xrManual : styles.xrAuto}`}
                >
                  {exchangeRate?.source === 'manual' ? 'Manual' : 'Auto'}
                </span>
              </span>
            )}
            {exchangeRate?.fetchedAt && !editingRate && (
              <span className={styles.xrUpdated}>
                <Clock size={11} />
                Updated {new Date(exchangeRate.fetchedAt).toLocaleString('vi-VN')}
                {exchangeRate.apiSource && ` · ${exchangeRate.apiSource}`}
              </span>
            )}
          </div>
        </div>

        <div className={styles.xrActions}>
          {rateMsg && (
            <span
              className={`${styles.xrMsg} ${rateMsg.type === 'error' ? styles.xrMsgError : styles.xrMsgSuccess}`}
            >
              <CheckCircle size={13} />
              {rateMsg.text}
            </span>
          )}

          {editingRate ? (
            <>
              <button
                className={styles.xrBtnSave}
                onClick={handleSaveManualRate}
                disabled={rateSaving || !rateInput}
              >
                <Save size={13} />
                {rateSaving ? 'Saving…' : 'Save'}
              </button>
              <button
                className={styles.xrBtnCancel}
                onClick={() => {
                  setEditingRate(false);
                  setRateInput('');
                  setRateNote('');
                }}
              >
                <X size={13} />
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                className={styles.xrBtnSync}
                onClick={handleSyncRate}
                disabled={exchangeRateSyncing}
                title="Fetch latest rate from external APIs"
              >
                <RefreshCw size={13} className={exchangeRateSyncing ? styles.spinning : ''} />
                {exchangeRateSyncing ? 'Syncing…' : 'Sync'}
              </button>
              <button
                className={styles.xrBtnEdit}
                onClick={() => {
                  setEditingRate(true);
                  setRateInput(String(exchangeRate?.rate ?? 3500));
                }}
                title="Manually set exchange rate"
              >
                <Edit2 size={13} />
                Override
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Stat Cards ──────────────────────────────────────────── */}
      <div className={styles.statsGrid}>
        {statCards.map(({ icon: Icon, label, value, detail, accentColor, bgColor }) => (
          <div
            key={label}
            className={styles.statCard}
            style={{ '--accent': accentColor, '--bg': bgColor }}
          >
            <div className={styles.statIconWrap}>
              <Icon size={20} strokeWidth={2} color={accentColor} />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statLabel}>{label}</span>
              <span className={styles.statValue}>{value}</span>
              <span className={styles.statDetail}>{detail}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Quick Actions ────────────────────────────────────────── */}
      <div className={styles.actionsRow}>
        {quickActions.map(({ icon: Icon, label, desc, to, accentColor, bgColor }) => (
          <Link
            key={to}
            to={to}
            className={styles.actionCard}
            style={{ '--accent': accentColor, '--bg': bgColor }}
          >
            <div className={styles.actionIconWrap}>
              <Icon size={18} strokeWidth={2} color={accentColor} />
            </div>
            <div className={styles.actionText}>
              <span className={styles.actionLabel}>{label}</span>
              <span className={styles.actionDesc}>{desc}</span>
            </div>
            <ArrowRight size={14} className={styles.actionArrow} color="#94a3b8" />
          </Link>
        ))}
      </div>

      {/* ── Two-column tables ────────────────────────────────────── */}
      <div className={styles.tablesGrid}>
        {/* Low Stock Warning */}
        {lowStockItems.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitleRow}>
                <AlertTriangle size={16} strokeWidth={2} color="#dc2626" />
                <h2 className={styles.sectionTitle}>Low Stock Warning</h2>
                <span className={styles.sectionBadge}>{lowStockItems.length}</span>
              </div>
              <Link to="/seller/inventory" className={styles.linkButton}>
                View all <ArrowRight size={13} />
              </Link>
            </div>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Product</th>
                    <th>Stock</th>
                    <th>Threshold</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockItems.slice(0, 5).map((item) => (
                    <tr key={item._id}>
                      <td className={styles.sku}>{item.sku}</td>
                      <td className={styles.productName}>{item.productName}</td>
                      <td>
                        <span className={styles.stockLowBadge}>{item.currentStock}</span>
                      </td>
                      <td className={styles.muted}>{item.threshold}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Recent Purchase Orders */}
        <div
          className={`${styles.section} ${lowStockItems.length === 0 ? styles.sectionFull : ''}`}
        >
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleRow}>
              <ClipboardList size={16} strokeWidth={2} color="#1a56db" />
              <h2 className={styles.sectionTitle}>Recent Purchase Orders</h2>
            </div>
            <Link to="/seller/erp/purchase-orders" className={styles.linkButton}>
              View all <ArrowRight size={13} />
            </Link>
          </div>

          {purchaseOrders.length === 0 ? (
            <div className={styles.emptyState}>
              <ClipboardList size={36} strokeWidth={1.2} color="#d1d5db" />
              <p>No purchase orders yet</p>
              <Link to="/seller/erp/purchase-orders/create" className={styles.emptyLink}>
                Create your first order
              </Link>
            </div>
          ) : (
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Order Code</th>
                    <th>Supplier</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseOrders.slice(0, 5).map((po) => (
                    <tr key={po._id} className={styles.clickableRow}>
                      <td>
                        <Link
                          to={`/seller/erp/purchase-orders/${po._id}`}
                          className={styles.codeLink}
                        >
                          {po.code}
                        </Link>
                      </td>
                      <td className={styles.supplierName}>{po.supplierId?.name || '—'}</td>
                      <td className={styles.muted}>{formatDate(po.createdAt)}</td>
                      <td className={styles.amount}>{formatCurrency(po.finalAmount)}</td>
                      <td>
                        <span className={getPOStatusClass(po.status)}>
                          {{
                            Draft: 'Draft',
                            Pending: 'Ordering',
                            Completed: 'Received',
                            Cancelled: 'Cancelled',
                          }[po.status] ?? po.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ERPDashboard;
