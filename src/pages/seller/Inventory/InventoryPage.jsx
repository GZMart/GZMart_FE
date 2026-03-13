import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Package,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  SlidersHorizontal,
  PlusCircle,
  ArrowDownCircle,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  RefreshCw,
  X,
  Save,
} from 'lucide-react';
import { productService } from '../../../services/api/productService';
import {
  adjustStockItem,
  selectInventoryAdjusting,
  selectInventoryError,
  clearError,
} from '../../../store/slices/inventorySlice';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import styles from '../../../assets/styles/seller/InventoryPage.module.css';

// ─── Constants ────────────────────────────────────────────────────
const STOCK_TABS = [
  { value: 'all', label: 'All SKUs' },
  { value: 'low', label: 'Low Stock' },
  { value: 'out', label: 'Out of Stock' },
  { value: 'ok', label: 'In Stock' },
];

// Default = 10 — matches backend InventoryItem.lowStockThreshold default
const LOW_STOCK_THRESHOLD = 10;
const ITEMS_PER_PAGE = 15;
const THRESHOLD_KEY = 'gzmart_inv_thresholds'; // localStorage key

// ─── Helpers ──────────────────────────────────────────────────────
// Uses per-row threshold instead of global constant
// Uses <= to match ERP Dashboard's backend query ($lte)
const getStockStatus = (stock, threshold) => {
  if (stock === 0) {
    return 'out';
  }
  if (stock <= threshold) {
    return 'low';
  }
  return 'ok';
};

const loadStoredThresholds = () => {
  try {
    return JSON.parse(localStorage.getItem(THRESHOLD_KEY) || '{}');
  } catch {
    return {};
  }
};

const persistThresholds = (map) => {
  try {
    localStorage.setItem(THRESHOLD_KEY, JSON.stringify(map));
  } catch {}
};

const formatVariantLabel = (model) => {
  // Try to compose a readable variant name from model tier/option values
  const parts = [];
  if (model.color) {
    parts.push(model.color);
  }
  if (model.size) {
    parts.push(model.size);
  }
  if (model.option) {
    parts.push(model.option);
  }
  // Fallback to tier values array
  if (parts.length === 0 && Array.isArray(model.tierValues)) {
    parts.push(...model.tierValues.filter(Boolean));
  }
  return parts.length > 0 ? parts.join(' / ') : null;
};

// ─── Sortable Column Header ───────────────────────────────────────
const SortableHeader = ({ label, colKey, sortKey, sortDir, onSort, align = 'left' }) => {
  const active = sortKey === colKey;
  return (
    <th
      className={`${styles.sortableTh} ${active ? styles.sortableThActive : ''}`}
      style={{ textAlign: align }}
      onClick={() => onSort(colKey)}
    >
      <span
        className={styles.sortableInner}
        style={{
          justifyContent:
            align === 'right' ? 'flex-end' : align === 'center' ? 'center' : 'flex-start',
        }}
      >
        {label}
        <span className={styles.sortIcon}>
          {active ? (
            sortDir === 'asc' ? (
              <ChevronUp size={11} />
            ) : (
              <ChevronDown size={11} />
            )
          ) : (
            <ChevronsUpDown size={11} />
          )}
        </span>
      </span>
    </th>
  );
};

// ─── Adjust Modal ─────────────────────────────────────────────────
const AdjustModal = ({ item, onClose, onSave, saving }) => {
  const [newStock, setNewStock] = useState(String(item.stock));
  const [newThreshold, setNewThreshold] = useState(String(item.threshold));
  const [newCostPrice, setNewCostPrice] = useState(
    String(item.costPrice > 0 ? item.costPrice : '')
  );
  const [note, setNote] = useState('');

  const delta = Number(newStock) - item.stock;
  const stockChanged = newStock !== String(item.stock);
  const thresholdChanged = newThreshold !== String(item.threshold);
  const costPriceChanged = newCostPrice !== '' && Number(newCostPrice) !== item.costPrice;
  const hasChanges = stockChanged || thresholdChanged || costPriceChanged;

  const handleSubmit = (e) => {
    e.preventDefault();
    const parsedStock = parseInt(newStock, 10);
    const parsedThreshold = parseInt(newThreshold, 10);
    if (isNaN(parsedStock) || parsedStock < 0) {
      return;
    }
    if (isNaN(parsedThreshold) || parsedThreshold < 1) {
      return;
    }
    const parsedCostPrice = newCostPrice !== '' ? parseFloat(newCostPrice) : undefined;
    onSave({
      newStock: parsedStock,
      note: note.trim(),
      newThreshold: parsedThreshold,
      newCostPrice: parsedCostPrice,
    });
  };

  // Trap focus on mount
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <>
      <div className={styles.modalOverlay} onClick={onClose} />
      <div className={styles.modal} role="dialog" aria-modal="true">
        <div className={styles.modalHeader}>
          <div>
            <p className={styles.modalTitle}>Adjust Stock</p>
            <p className={styles.modalSub}>
              {item.productName}
              {item.variantLabel ? ` · ${item.variantLabel}` : ''}
            </p>
          </div>
          <button className={styles.modalClose} onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            <div className={styles.skuRow}>
              <span className={styles.skuLabel}>SKU</span>
              <span className={styles.skuValue}>{item.sku}</span>
              <span className={styles.currentStock}>
                Current: <strong>{item.stock}</strong>
              </span>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                New Stock Quantity <span className={styles.required}>*</span>
              </label>
              <input
                type="number"
                min="0"
                className={styles.formInput}
                value={newStock}
                onChange={(e) => setNewStock(e.target.value)}
                autoFocus
                required
              />
              {newStock !== '' && !isNaN(Number(newStock)) && Number(newStock) !== item.stock && (
                <p
                  className={`${styles.deltaHint} ${delta > 0 ? styles.deltaPos : styles.deltaNeg}`}
                >
                  {delta > 0 ? `+${delta}` : delta} units from current stock
                </p>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                Cost Price (₫)
                <span className={styles.thresholdHint}>Import / purchase cost per unit</span>
                {item.costSource === 'po' ? (
                  <span className={styles.costSourceBadgePo}>via PO</span>
                ) : (
                  <span className={styles.costSourceBadgeManual}>Manual</span>
                )}
              </label>
              <div className={styles.inputAddonWrap}>
                <span className={styles.inputAddonPrefix}>₫</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  className={`${styles.formInput} ${styles.formInputWithPrefix}`}
                  value={newCostPrice}
                  onChange={(e) => setNewCostPrice(e.target.value)}
                  placeholder={
                    item.costPrice > 0 ? item.costPrice.toLocaleString('vi-VN') : 'Enter cost price'
                  }
                />
              </div>
              {item.costSource === 'po' && !costPriceChanged && (
                <p className={styles.costSourceHint}>
                  Auto-set by a completed PO — editing will override to Manual.{' '}
                  <a href="/seller/erp/purchase-orders" target="_blank" rel="noopener noreferrer">
                    View POs ↗
                  </a>
                </p>
              )}
              {costPriceChanged && (
                <p className={styles.deltaHint} style={{ color: '#d97706' }}>
                  {item.costPrice > 0 ? item.costPrice.toLocaleString('vi-VN') : '—'} →{' '}
                  {Number(newCostPrice).toLocaleString('vi-VN')} ₫
                </p>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                Low Stock Threshold
                <span className={styles.thresholdHint}>Alert when stock falls below this</span>
              </label>
              <input
                type="number"
                min="1"
                className={styles.formInput}
                value={newThreshold}
                onChange={(e) => setNewThreshold(e.target.value)}
              />
              {thresholdChanged && (
                <p className={`${styles.deltaHint}`} style={{ color: '#6366f1' }}>
                  {item.threshold} → {newThreshold || '?'}
                </p>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Note (optional)</label>
              <textarea
                className={styles.formTextarea}
                rows={2}
                placeholder="Reason for adjustment, e.g. stock count, damaged goods…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={500}
              />
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button type="submit" className={styles.btnPrimary} disabled={saving || !hasChanges}>
              {saving ? (
                <>
                  <RefreshCw size={14} className={styles.spin} /> Saving…
                </>
              ) : (
                <>
                  <Save size={14} /> Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

// ─── Main Page ────────────────────────────────────────────────────
const InventoryPage = () => {
  const dispatch = useDispatch();
  const adjusting = useSelector(selectInventoryAdjusting);
  const adjustError = useSelector(selectInventoryError);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [stockTab, setStockTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [adjustTarget, setAdjustTarget] = useState(null);
  const [toast, setToast] = useState(null);
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [alertDismissed, setAlertDismissed] = useState(false);
  // Per-SKU thresholds — persisted in localStorage, merged with backend defaults
  const [customThresholds, setCustomThresholds] = useState(loadStoredThresholds);

  // ── Load products ──────────────────────────────────────────────
  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    setAlertDismissed(false);
    try {
      const res = await productService.getMyProducts({ limit: 1000 });
      if (res.success) {
        setProducts(res.data);
      } else {
        setError('Failed to load inventory');
      }
    } catch (err) {
      setError(err.message || 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) {
      return;
    }
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  // ── Flatten to per-SKU rows ────────────────────────────────────
  const inventoryRows = useMemo(
    () =>
      products.flatMap((product) => {
        const models = product.models || [];

        // Simple products or products with no models → create a single fallback row
        if (models.length === 0) {
          const sku = product.sku || `SIMPLE-${product._id}`;
          const stock = product.stock ?? 0;
          const threshold = customThresholds[sku] ?? LOW_STOCK_THRESHOLD;
          return [
            {
              _key: `${product._id}-simple`,
              productId: product._id,
              modelId: null,
              productName: product.name,
              productImage: product.images?.[0] ?? null,
              variantLabel: null,
              sku,
              stock,
              threshold,
              costPrice: product.originalPrice ?? 0,
              costSource: 'manual',
              costSourcePoId: null,
              stockStatus: getStockStatus(stock, threshold),
            },
          ];
        }

        return models.map((model) => {
          const sku = model.sku || '—';
          const stock = model.stock ?? 0;
          // Priority: seller's custom threshold → backend model value → global default
          const threshold = customThresholds[sku] ?? model.lowStockThreshold ?? LOW_STOCK_THRESHOLD;
          return {
            _key: `${product._id}-${model._id}`,
            productId: product._id,
            modelId: model._id,
            productName: product.name,
            productImage: product.images?.[0] ?? null,
            variantLabel: formatVariantLabel(model),
            sku,
            stock,
            threshold,
            costPrice: model.costPrice ?? model.price ?? product.originalPrice ?? 0,
            costSource: model.costSource ?? 'manual',
            costSourcePoId: model.costSourcePoId ?? null,
            stockStatus: getStockStatus(stock, threshold),
          };
        });
      }),
    [products, customThresholds]
  );

  // ── Stats derived from rows ────────────────────────────────────
  const stats = useMemo(
    () => ({
      total: inventoryRows.length,
      inStock: inventoryRows.filter((r) => r.stockStatus === 'ok').length,
      low: inventoryRows.filter((r) => r.stockStatus === 'low').length,
      out: inventoryRows.filter((r) => r.stockStatus === 'out').length,
    }),
    [inventoryRows]
  );

  // ── Filter + search + sort ─────────────────────────────────────
  const filtered = useMemo(() => {
    let rows = inventoryRows;

    if (stockTab !== 'all') {
      rows = rows.filter((r) => r.stockStatus === stockTab);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.productName.toLowerCase().includes(q) ||
          r.sku.toLowerCase().includes(q) ||
          (r.variantLabel && r.variantLabel.toLowerCase().includes(q))
      );
    }

    if (sortKey) {
      const STATUS_ORDER = { out: 0, low: 1, ok: 2 };
      rows = [...rows].sort((a, b) => {
        let aVal = a[sortKey];
        let bVal = b[sortKey];

        if (sortKey === 'productName') {
          aVal = `${a.productName}${a.variantLabel ? ` ${a.variantLabel}` : ''}`.toLowerCase();
          bVal = `${b.productName}${b.variantLabel ? ` ${b.variantLabel}` : ''}`.toLowerCase();
        } else if (sortKey === 'stockStatus') {
          aVal = STATUS_ORDER[a.stockStatus] ?? 3;
          bVal = STATUS_ORDER[b.stockStatus] ?? 3;
        }

        if (typeof aVal === 'string') {
          const cmp = aVal.localeCompare(bVal);
          return sortDir === 'asc' ? cmp : -cmp;
        }
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      });
    }

    return rows;
  }, [inventoryRows, stockTab, search, sortKey, sortDir]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleTabChange = (val) => {
    setStockTab(val);
    setCurrentPage(1);
  };
  const handleSearch = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };
  const handleSort = useCallback(
    (key) => {
      setSortDir((prev) => (sortKey === key && prev === 'asc' ? 'desc' : 'asc'));
      setSortKey(key);
      setCurrentPage(1);
    },
    [sortKey]
  );

  // ── Adjust stock + threshold + costPrice ──────────────────────
  const handleAdjustSave = async ({ newStock, note, newThreshold, newCostPrice }) => {
    if (!adjustTarget) {
      return;
    }

    // ① Save threshold change immediately (localStorage, no API needed)
    if (newThreshold !== adjustTarget.threshold) {
      const updated = { ...customThresholds, [adjustTarget.sku]: newThreshold };
      setCustomThresholds(updated);
      persistThresholds(updated);
    }

    const stockChanged = newStock !== adjustTarget.stock;
    const costPriceChanged = newCostPrice !== undefined && newCostPrice !== adjustTarget.costPrice;

    // ② If stock or costPrice changed, call API
    if (stockChanged || costPriceChanged) {
      dispatch(clearError());
      const result = await dispatch(
        adjustStockItem({
          productId: adjustTarget.productId,
          modelId: adjustTarget.modelId,
          sku: adjustTarget.sku,
          newStock,
          ...(costPriceChanged && { costPrice: newCostPrice }),
          note,
        })
      );

      if (adjustStockItem.fulfilled.match(result)) {
        const parts = [];
        if (stockChanged) {
          parts.push(`stock → ${newStock}`);
        }
        if (costPriceChanged) {
          parts.push(`cost → ${newCostPrice?.toLocaleString('vi-VN')} ₫`);
        }
        if (newThreshold !== adjustTarget.threshold) {
          parts.push(`threshold → ${newThreshold}`);
        }
        setToast({ type: 'success', msg: `${adjustTarget.sku}: ${parts.join(', ')}` });
        setAdjustTarget(null);
        await loadProducts();
      } else {
        setToast({ type: 'error', msg: result.payload || 'Failed to adjust' });
      }
    } else {
      // Only threshold changed
      setToast({
        type: 'success',
        msg: `Threshold for ${adjustTarget.sku} updated to ${newThreshold}`,
      });
      setAdjustTarget(null);
    }
  };

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className={styles.page}>
      {/* Toast notification */}
      {toast && (
        <div
          className={`${styles.toast} ${toast.type === 'error' ? styles.toastError : styles.toastSuccess}`}
        >
          {toast.type === 'error' ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
          {toast.msg}
          <button className={styles.toastClose} onClick={() => setToast(null)}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Inventory</h1>
          <p className={styles.subtitle}>Track stock levels &amp; adjust quantities per SKU</p>
        </div>
        <div className={styles.headerActions}>
          <button
            className={styles.btnRefresh}
            onClick={loadProducts}
            disabled={loading}
            title="Refresh"
          >
            <RefreshCw size={14} className={loading ? styles.spin : ''} />
            Refresh
          </button>
          <Link to="/seller/erp/purchase-orders/create" className={styles.btnPrimary}>
            <ArrowDownCircle size={15} />
            Stock In via PO
          </Link>
        </div>
      </div>

      {/* ── Stat cards ──────────────────────────────────────────── */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard} style={{ '--accent': '#1a56db', '--bg': '#eff6ff' }}>
          <div className={styles.statIcon}>
            <Package size={20} color="#1a56db" />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statLabel}>Total SKUs</span>
            <span className={styles.statValue}>{loading ? '—' : stats.total}</span>
          </div>
        </div>
        <div className={styles.statCard} style={{ '--accent': '#059669', '--bg': '#f0fdf4' }}>
          <div className={styles.statIcon}>
            <CheckCircle2 size={20} color="#059669" />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statLabel}>In Stock</span>
            <span className={styles.statValue}>{loading ? '—' : stats.inStock}</span>
          </div>
        </div>
        <div className={styles.statCard} style={{ '--accent': '#d97706', '--bg': '#fffbeb' }}>
          <div className={styles.statIcon}>
            <AlertTriangle size={20} color="#d97706" />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statLabel}>Low Stock</span>
            <span className={styles.statValue}>{loading ? '—' : stats.low}</span>
            <span className={styles.statDetail}>≤ {LOW_STOCK_THRESHOLD} units</span>
          </div>
        </div>
        <div className={styles.statCard} style={{ '--accent': '#dc2626', '--bg': '#fef2f2' }}>
          <div className={styles.statIcon}>
            <XCircle size={20} color="#dc2626" />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statLabel}>Out of Stock</span>
            <span className={styles.statValue}>{loading ? '—' : stats.out}</span>
          </div>
        </div>
      </div>

      {/* ── Restock alert bar ───────────────────────────────────── */}
      {!loading && !alertDismissed && (stats.out > 0 || stats.low > 0) && (
        <div
          className={`${styles.alertBar} ${stats.out > 0 ? styles.alertBarDanger : styles.alertBarWarn}`}
        >
          <div className={styles.alertBarLeft}>
            <div className={styles.alertBarIcon}>
              {stats.out > 0 ? <XCircle size={18} /> : <AlertTriangle size={18} />}
            </div>
            <div className={styles.alertBarContent}>
              <span className={styles.alertBarTitle}>
                {stats.out > 0 ? 'Stock critical' : 'Low stock warning'}
              </span>
              <span className={styles.alertBarDesc}>
                {stats.out > 0 && (
                  <span className={styles.alertChip} data-type="out">
                    <XCircle size={11} />
                    {stats.out} out of stock
                  </span>
                )}
                {stats.low > 0 && (
                  <span className={styles.alertChip} data-type="low">
                    <AlertTriangle size={11} />
                    {stats.low} running low
                  </span>
                )}
                <span className={styles.alertBarSep}>—</span>
                Restock soon to avoid lost sales
              </span>
            </div>
          </div>
          <div className={styles.alertBarActions}>
            <button
              className={styles.alertBarFilter}
              onClick={() => {
                handleTabChange(stats.out > 0 ? 'out' : 'low');
              }}
            >
              View affected SKUs
            </button>
            <Link to="/seller/erp/purchase-orders/create" className={styles.alertBarCta}>
              <PlusCircle size={13} />
              Create PO
            </Link>
            <button
              className={styles.alertBarClose}
              onClick={() => setAlertDismissed(true)}
              aria-label="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── Toolbar ─────────────────────────────────────────────── */}
      <div className={styles.toolbar}>
        {/* Stock status tabs */}
        <div className={styles.tabs}>
          {STOCK_TABS.map((tab) => {
            const count =
              tab.value === 'all'
                ? stats.total
                : tab.value === 'low'
                  ? stats.low
                  : tab.value === 'out'
                    ? stats.out
                    : stats.inStock;
            return (
              <button
                key={tab.value}
                className={`${styles.tab} ${stockTab === tab.value ? styles.tabActive : ''} ${tab.value === 'low' && stats.low > 0 ? styles.tabWarn : ''} ${tab.value === 'out' && stats.out > 0 ? styles.tabDanger : ''}`}
                onClick={() => handleTabChange(tab.value)}
              >
                {tab.label}
                <span className={styles.tabCount}>{loading ? '—' : count}</span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className={styles.searchWrap}>
          <Search size={14} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search product name or SKU…"
            value={search}
            onChange={handleSearch}
          />
          {search && (
            <button
              className={styles.searchClear}
              onClick={() => {
                setSearch('');
                setCurrentPage(1);
              }}
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────────────── */}
      <div className={styles.tableCard}>
        {loading ? (
          <div className={styles.centered}>
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className={styles.errorState}>
            <p>{error}</p>
            <button className={styles.btnPrimary} onClick={loadProducts}>
              Retry
            </button>
          </div>
        ) : paginated.length === 0 ? (
          <div className={styles.emptyState}>
            <Package size={44} strokeWidth={1.2} color="#d1d5db" />
            <p>
              {search
                ? `No results for "${search}"`
                : stockTab === 'out'
                  ? 'No out-of-stock items.'
                  : stockTab === 'low'
                    ? 'No low-stock items.'
                    : 'No inventory items found.'}
            </p>
            {stockTab === 'out' || stockTab === 'low' ? (
              <button className={styles.btnSecondary} onClick={() => handleTabChange('all')}>
                View all SKUs
              </button>
            ) : null}
          </div>
        ) : (
          <>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.sortableTh}></th>
                    <SortableHeader
                      label="Product / Variant"
                      colKey="productName"
                      sortKey={sortKey}
                      sortDir={sortDir}
                      onSort={handleSort}
                    />
                    <SortableHeader
                      label="SKU"
                      colKey="sku"
                      sortKey={sortKey}
                      sortDir={sortDir}
                      onSort={handleSort}
                    />
                    <SortableHeader
                      label="Stock"
                      colKey="stock"
                      sortKey={sortKey}
                      sortDir={sortDir}
                      onSort={handleSort}
                      align="center"
                    />
                    <SortableHeader
                      label="Threshold"
                      colKey="threshold"
                      sortKey={sortKey}
                      sortDir={sortDir}
                      onSort={handleSort}
                      align="center"
                    />
                    <SortableHeader
                      label="Status"
                      colKey="stockStatus"
                      sortKey={sortKey}
                      sortDir={sortDir}
                      onSort={handleSort}
                      align="center"
                    />
                    <SortableHeader
                      label="Cost Price"
                      colKey="costPrice"
                      sortKey={sortKey}
                      sortDir={sortDir}
                      onSort={handleSort}
                      align="right"
                    />
                    <th className={styles.sortableTh} style={{ textAlign: 'center' }}>
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((row) => (
                    <tr
                      key={row._key}
                      className={`${styles.tr} ${row.stockStatus === 'out' ? styles.trOut : row.stockStatus === 'low' ? styles.trLow : ''}`}
                    >
                      {/* Thumbnail */}
                      <td className={styles.tdImg}>
                        {row.productImage ? (
                          <img
                            src={row.productImage}
                            alt={row.productName}
                            className={styles.thumb}
                          />
                        ) : (
                          <div className={styles.thumbPlaceholder}>
                            <Package size={14} color="#d1d5db" />
                          </div>
                        )}
                      </td>

                      {/* Product + variant */}
                      <td>
                        <div className={styles.productCell}>
                          <span className={styles.productName}>{row.productName}</span>
                          {row.variantLabel && (
                            <span className={styles.variantLabel}>{row.variantLabel}</span>
                          )}
                        </div>
                      </td>

                      {/* SKU */}
                      <td>
                        <span className={styles.sku}>{row.sku}</span>
                      </td>

                      {/* Stock */}
                      <td style={{ textAlign: 'center' }}>
                        <span
                          className={
                            row.stockStatus === 'out'
                              ? styles.stockOut
                              : row.stockStatus === 'low'
                                ? styles.stockLow
                                : styles.stockOk
                          }
                        >
                          {row.stock}
                        </span>
                      </td>

                      {/* Threshold */}
                      <td style={{ textAlign: 'center' }}>
                        <span className={styles.threshold}>{row.threshold}</span>
                      </td>

                      {/* Status badge */}
                      <td style={{ textAlign: 'center' }}>
                        {row.stockStatus === 'out' ? (
                          <span className={styles.badgeOut}>Out of Stock</span>
                        ) : row.stockStatus === 'low' ? (
                          <span className={styles.badgeLow}>Low Stock</span>
                        ) : (
                          <span className={styles.badgeOk}>In Stock</span>
                        )}
                      </td>

                      {/* Cost */}
                      <td style={{ textAlign: 'right' }}>
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-end',
                            gap: '3px',
                          }}
                        >
                          <span className={styles.costPrice}>
                            {row.costPrice > 0
                              ? new Intl.NumberFormat('vi-VN', {
                                  style: 'currency',
                                  currency: 'VND',
                                }).format(row.costPrice)
                              : '—'}
                          </span>
                          {row.costSource === 'po' ? (
                            <a
                              href="/seller/erp/purchase-orders"
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.costSourcePo}
                              title="Cost price set from a completed Purchase Order"
                            >
                              via PO ↗
                            </a>
                          ) : (
                            <span className={styles.costSourceManual}>Manual</span>
                          )}
                        </div>
                      </td>

                      {/* Adjust button */}
                      <td style={{ textAlign: 'center' }}>
                        {row.modelId ? (
                          <button
                            className={styles.btnAdjust}
                            onClick={() => setAdjustTarget(row)}
                            title="Adjust stock quantity"
                          >
                            <SlidersHorizontal size={13} />
                            Adjust
                          </button>
                        ) : (
                          <span
                            className={styles.btnAdjustDisabled}
                            title="This product has no SKU variants. Edit the product to add models before adjusting stock."
                          >
                            <SlidersHorizontal size={13} />
                            No SKU
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button
                  className={styles.pageBtn}
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                >
                  <ChevronLeft size={14} /> Prev
                </button>
                <span className={styles.pageInfo}>
                  Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
                  &nbsp;·&nbsp;{filtered.length} SKUs
                </span>
                <button
                  className={styles.pageBtn}
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Adjust Modal */}
      {adjustTarget && (
        <AdjustModal
          item={adjustTarget}
          onClose={() => {
            setAdjustTarget(null);
            dispatch(clearError());
          }}
          onSave={handleAdjustSave}
          saving={adjusting}
        />
      )}
    </div>
  );
};

export default InventoryPage;
