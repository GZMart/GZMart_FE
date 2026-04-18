import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Dropdown } from 'react-bootstrap';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ProductDrawer from '../../components/seller/listings/ProductDrawer';
import ListingsPagination from '../../components/seller/listings/ListingsPagination';
import SortableHeader, { useSortState, sortRows } from '../../components/common/SortableHeader';
import AiPriceSuggestModal from '../../components/seller/listings/AiPriceSuggestModal';
import AiPriceDetailModal from '../../components/seller/listings/AiPriceDetailModal';
import { productService } from '../../services/api/productService';
import { formatCurrency } from '../../utils/formatters';
import styles from '../../assets/styles/seller/ListingsPage.module.css';

/* ── Status config ─────────────────────────────────────────────────── */
const STATUS_TABS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'draft', label: 'Draft' },
  { value: 'inactive', label: 'Hidden' },
];

const STATUS_MAP = {
  active: { label: 'Active', cls: styles.badgeActive },
  inactive: { label: 'Hidden', cls: styles.badgeHidden },
  draft: { label: 'Draft', cls: styles.badgeDraft },
  out_of_stock: { label: 'Out of Stock', cls: styles.badgeOutOfStock },
};

const ITEMS_PER_PAGE = 10;

/* ─────────────────────────────────────────────────────────────────── */
const ListingsPage = () => {
  const [searchParams] = useSearchParams();

  const [allListings, setAllListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // productId being toggled
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [aiModalProduct, setAiModalProduct] = useState(null); // product for AI price modal
  /** Competitor detail modal — separate from batch modal so closing batch keeps this open */
  const [aiVariantDetail, setAiVariantDetail] = useState(null);

  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState(searchParams.get('status') || 'all');
  const { sortKey, sortDir, handleSort } = useSortState('_createdAt', 'desc');

  /* ── Fetch ──────────────────────────────────────────────────────── */
  const fetchListings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await productService.getMyProducts({ limit: 1000 });
      if (response.success) {
        setAllListings(response.data.map(mapProduct));
      } else {
        setError('Failed to load listings');
      }
    } catch (err) {
      setError(err.message || 'Failed to load listings');
      setAllListings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const mapProduct = (p) => {
    const categoryName =
      typeof p.categoryId === 'object' ? p.categoryId?.name : (p.category?.name ?? 'Uncategorized');
    const prices = (p.models || []).map((m) => m.price).filter((x) => typeof x === 'number');
    const minPrice = prices.length ? Math.min(...prices) : p.originalPrice || 0;
    const maxPrice = prices.length ? Math.max(...prices) : p.originalPrice || 0;
    return {
      id: p._id,
      image: p.images?.[0] || p.tiers?.[0]?.images?.[0] || null,
      name: p.name,
      category: categoryName || 'Uncategorized',
      minPrice,
      maxPrice,
      status: p.status,
      sku: p.models?.[0]?.sku || '—',
      brand: p.brand || '—',
      stock: p.models?.reduce((s, m) => s + (m.stock || 0), 0) ?? 0,
      _createdAt: p.createdAt,
      _raw: p,
    };
  };

  /* ── Filter + sort ──────────────────────────────────────────────── */
  const filtered = useMemo(() => {
    let list = [...allListings];

    if (statusTab !== 'all') {
      list = list.filter((p) => p.status === statusTab);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
      );
    }

    return sortRows(list, sortKey, sortDir, {
      _createdAt: (r) => new Date(r._createdAt).getTime(),
      status: (r) => ({ active: 0, draft: 1, inactive: 2 })[r.status] ?? 3,
    });
  }, [allListings, statusTab, search, sortKey, sortDir]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleStatusTab = (val) => {
    setStatusTab(val);
    setCurrentPage(1);
  };
  const handleSearch = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  /* ── Actions ───────────────────────────────────────────────────── */
  const handleAddItem = () => {
    setEditingProduct(null);
    setShowAddModal(true);
  };

  const handleEditItem = async (product) => {
    try {
      setLoading(true);
      const response = await productService.getById(product.id);
      if (response.success) {
        setEditingProduct(response.data);
        setShowAddModal(true);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  // [Batch] Called when seller selects variants in AiPriceSuggestModal and clicks Apply.
  // Opens ProductDrawer with pre-filled suggested prices per model.
  const handleAiBatchApply = useCallback(async (product, changes) => {
    try {
      setLoading(true);
      const response = await productService.getById(product.id);
      if (response.success) {
        // Inject suggested prices into the models array
        const priceMap = new Map(changes.map((c) => [c.modelId, c.suggestedPrice]));
        const updatedModels = (response.data.models || []).map((m) => {
          const newPrice = priceMap.get(m._id?.toString());
          return newPrice != null ? { ...m, price: newPrice } : m;
        });
        setEditingProduct({
          ...response.data,
          models: updatedModels,
          _aiPriceChanges: changes, // track what AI suggested for audit
        });
        setShowAddModal(true);
      }
    } catch (error) {
      console.error('Error opening product for AI batch price apply:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleOpenAiModal = useCallback((product) => {
    setAiModalProduct(product);
  }, []);

  const handleToggleVisibility = useCallback(async (product) => {
    const newStatus = product.status === 'inactive' ? 'active' : 'inactive';
    setActionLoading(product.id);
    try {
      const response = await productService.toggleStatus(product.id, newStatus);
      if (response.success) {
        setAllListings((prev) =>
          prev.map((p) => (p.id === product.id ? { ...p, status: newStatus } : p))
        );
      }
    } catch (err) {
      console.error('Error toggling visibility:', err);
    } finally {
      setActionLoading(null);
    }
  }, []);

  /* ── Render ─────────────────────────────────────────────────────── */
  return (
    <div className={styles.listingsPage}>
      {/* ── Page Header ─────────────────────────────────────── */}
      <div className={styles.listingsHeader}>
        <div className={styles.headerContent}>
          <div className={styles.titleSection}>
            <h1 className={styles.pageTitle}>Products</h1>
            <p className={styles.pageSubtitle}>Manage your product catalogue</p>
          </div>
          <button className={styles.addButton} onClick={handleAddItem}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M7 1v12M1 7h12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            Add Product
          </button>
        </div>

        {/* ── Stats row ─────────────────────────────────────── */}
        <div className={styles.statsRow}>
          {[
            { label: 'Total', val: allListings.length },
            {
              label: 'Active',
              val: allListings.filter((p) => p.status === 'active').length,
              cls: styles.statActive,
            },
            {
              label: 'Draft',
              val: allListings.filter((p) => p.status === 'draft').length,
              cls: styles.statDraft,
            },
            {
              label: 'Hidden',
              val: allListings.filter((p) => p.status === 'inactive').length,
              cls: styles.statHidden,
            },
          ].map(({ label, val, cls }) => (
            <div key={label} className={styles.statPill}>
              <span className={`${styles.statNum} ${cls || ''}`}>{loading ? '—' : val}</span>
              <span className={styles.statLabel}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Toolbar ─────────────────────────────────────────── */}
      <div className={styles.toolbar}>
        {/* Status tabs */}
        <div className={styles.tabsGroup}>
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              className={`${styles.tab} ${statusTab === tab.value ? styles.tabActive : ''}`}
              onClick={() => handleStatusTab(tab.value)}
            >
              {tab.label}
              <span className={styles.tabCount}>
                {tab.value === 'all'
                  ? allListings.length
                  : allListings.filter((p) => p.status === tab.value).length}
              </span>
            </button>
          ))}
        </div>

        <div className={styles.toolbarRight}>
          {/* Search */}
          <div className={styles.searchBox}>
            <svg
              className={styles.searchIcon}
              width="14"
              height="14"
              viewBox="0 0 20 20"
              fill="none"
            >
              <circle cx="8.5" cy="8.5" r="6.5" stroke="currentColor" strokeWidth="1.8" />
              <path d="M14 14l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search name or SKU…"
              value={search}
              onChange={handleSearch}
            />
          </div>
        </div>
      </div>

      {/* ── Table Card ──────────────────────────────────────── */}
      <div className={styles.tableCard}>
        {loading ? (
          <div className={styles.centered}>
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className={styles.errorState}>
            <p>{error}</p>
            <button className={styles.addButton} onClick={fetchListings}>
              Retry
            </button>
          </div>
        ) : paginated.length === 0 ? (
          <div className={styles.emptyState}>
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#d1d5db"
              strokeWidth="1.3"
            >
              <rect x="2" y="7" width="20" height="14" rx="2" />
              <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
              <line x1="12" y1="12" x2="12" y2="16" />
              <line x1="10" y1="14" x2="14" y2="14" />
            </svg>
            <p>
              {search
                ? `No results for "${search}"`
                : statusTab === 'inactive'
                  ? 'No hidden products.'
                  : 'No products found. Add your first product!'}
            </p>
            {!search && statusTab !== 'inactive' && (
              <button className={styles.addButton} onClick={handleAddItem}>
                Add Product
              </button>
            )}
          </div>
        ) : (
          <>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead className={styles.thead}>
                  <tr>
                    <th className={styles.th} style={{ width: 40 }}>
                      #
                    </th>
                    <th className={styles.th} style={{ width: 52 }}></th>
                    <SortableHeader
                      label="Product"
                      colKey="name"
                      sortKey={sortKey}
                      sortDir={sortDir}
                      onSort={(k) => {
                        handleSort(k);
                        setCurrentPage(1);
                      }}
                      className={styles.th}
                    />
                    <SortableHeader
                      label="Category"
                      colKey="category"
                      sortKey={sortKey}
                      sortDir={sortDir}
                      onSort={(k) => {
                        handleSort(k);
                        setCurrentPage(1);
                      }}
                      className={styles.th}
                    />
                    <SortableHeader
                      label="SKU"
                      colKey="sku"
                      sortKey={sortKey}
                      sortDir={sortDir}
                      onSort={(k) => {
                        handleSort(k);
                        setCurrentPage(1);
                      }}
                      className={styles.th}
                    />
                    <SortableHeader
                      label="Price"
                      colKey="price"
                      sortKey={sortKey}
                      sortDir={sortDir}
                      onSort={(k) => {
                        handleSort(k);
                        setCurrentPage(1);
                      }}
                      className={styles.th}
                      align="right"
                    />
                    <SortableHeader
                      label="Stock"
                      colKey="stock"
                      sortKey={sortKey}
                      sortDir={sortDir}
                      onSort={(k) => {
                        handleSort(k);
                        setCurrentPage(1);
                      }}
                      className={styles.th}
                      align="center"
                    />
                    <SortableHeader
                      label="Status"
                      colKey="status"
                      sortKey={sortKey}
                      sortDir={sortDir}
                      onSort={(k) => {
                        handleSort(k);
                        setCurrentPage(1);
                      }}
                      className={styles.th}
                      align="center"
                    />
                    <th className={styles.th} style={{ width: 52 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((product, idx) => {
                    const st = STATUS_MAP[product.status] || { label: product.status, cls: '' };
                    const rowNum = (currentPage - 1) * ITEMS_PER_PAGE + idx + 1;
                    const lowStock = product.stock > 0 && product.stock < 5;
                    const outOfStock = product.stock === 0;
                    const isHidden = product.status === 'inactive';
                    const isToggling = actionLoading === product.id;
                    return (
                      <tr
                        key={product.id}
                        className={`${styles.tr} ${isHidden ? styles.rowHidden : ''}`}
                      >
                        <td className={styles.td}>
                          <span className={styles.rowNum}>{rowNum}</span>
                        </td>
                        <td className={styles.td}>
                          <div className={styles.thumbWrap}>
                            {product.image ? (
                              <img
                                src={product.image}
                                alt={product.name}
                                className={styles.thumb}
                              />
                            ) : (
                              <div className={styles.thumbPlaceholder}>
                                <svg
                                  width="18"
                                  height="18"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="#d1d5db"
                                  strokeWidth="1.5"
                                >
                                  <rect x="3" y="3" width="18" height="18" rx="2" />
                                  <circle cx="8.5" cy="8.5" r="1.5" />
                                  <path d="M21 15l-5-5L5 21" />
                                </svg>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className={styles.td}>
                          <div className={styles.productCell}>
                            <span className={styles.productName}>{product.name}</span>
                            <span className={styles.productBrand}>{product.brand}</span>
                          </div>
                        </td>
                        <td className={styles.td}>
                          <span className={styles.categoryChip}>{product.category}</span>
                        </td>
                        <td className={styles.td}>
                          <span className={styles.sku}>{product.sku}</span>
                        </td>
                        <td className={styles.td} style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                            {product.minPrice !== product.maxPrice ? (
                              <span className={styles.price}>
                                {formatCurrency(product.minPrice)} &ndash; {formatCurrency(product.maxPrice)}
                              </span>
                            ) : (
                              <span className={styles.price}>{formatCurrency(product.minPrice)}</span>
                            )}
                            <button
                              className={styles.aiBtn}
                              onClick={() => handleOpenAiModal(product)}
                              title="Gợi ý giá tham khảo cho tất cả variants"
                            >
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2L9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61z" />
                              </svg>
                              Tham khảo giá
                            </button>
                          </div>
                        </td>
                        <td className={styles.td} style={{ textAlign: 'center' }}>
                          <span
                            className={
                              outOfStock
                                ? styles.stockOut
                                : lowStock
                                  ? styles.stockLow
                                  : styles.stockOk
                            }
                          >
                            {outOfStock ? 'Out' : `${product.stock}`}
                          </span>
                        </td>
                        <td className={styles.td} style={{ textAlign: 'center' }}>
                          <span className={`${styles.badge} ${st.cls}`}>{st.label}</span>
                        </td>
                        <td className={styles.td}>
                          <Dropdown align="end">
                            <Dropdown.Toggle as="button" className={styles.menuBtn} bsPrefix="x">
                              {isToggling ? (
                                <svg
                                  width="12"
                                  height="12"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  className={styles.spinIcon}
                                >
                                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                                </svg>
                              ) : (
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                  <circle cx="8" cy="3" r="1.3" fill="currentColor" />
                                  <circle cx="8" cy="8" r="1.3" fill="currentColor" />
                                  <circle cx="8" cy="13" r="1.3" fill="currentColor" />
                                </svg>
                              )}
                            </Dropdown.Toggle>
                            <Dropdown.Menu renderOnMount popperConfig={{ strategy: 'fixed', modifiers: [{ name: 'computeStyles', options: { adaptive: false } }] }}>
                              <Dropdown.Item onClick={() => handleEditItem(product)}>
                                <i className="bi bi-pencil me-2" />
                                Edit
                              </Dropdown.Item>
                              <Dropdown.Item onClick={() => handleToggleVisibility(product)}>
                                {isHidden ? (
                                  <>
                                    <i className="bi bi-eye me-2" />
                                    Unhide
                                  </>
                                ) : (
                                  <>
                                    <i className="bi bi-eye-slash me-2" />
                                    Hide
                                  </>
                                )}
                              </Dropdown.Item>
                            </Dropdown.Menu>
                          </Dropdown>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className={styles.tableFooter}>
              <span className={styles.footerInfo}>
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
                {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}{' '}
                products
              </span>
              <ListingsPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(p) => {
                  if (p >= 1 && p <= totalPages) {
                    setCurrentPage(p);
                  }
                }}
              />
            </div>
          </>
        )}
      </div>

      <ProductDrawer
        show={showAddModal}
        onHide={() => {
          setShowAddModal(false);
          setEditingProduct(null);
        }}
        onSuccess={fetchListings}
        editingProduct={editingProduct}
      />

      <AiPriceSuggestModal
        show={!!aiModalProduct}
        product={aiModalProduct}
        onApply={(changes) => {
          if (aiModalProduct && changes.length > 0) {
            handleAiBatchApply(aiModalProduct, changes);
          }
        }}
        onClose={() => setAiModalProduct(null)}
        onViewDetail={({ detailResult, batchData }) => {
          setAiVariantDetail({
            detailResult,
            batchData,
            productSnapshot: aiModalProduct,
          });
        }}
      />

      {aiVariantDetail && (
        <AiPriceDetailModal
          show
          data={{
            suggestedPrice: aiVariantDetail.detailResult.suggestedPrice,
            reasoning: aiVariantDetail.detailResult.reasoning,
            riskLevel: aiVariantDetail.detailResult.riskLevel,
            warning: aiVariantDetail.detailResult.warning,
            warningMessage: aiVariantDetail.detailResult.warningMessage,
            discountPct: aiVariantDetail.detailResult.discountPct,
            marketData: aiVariantDetail.batchData.marketData,
            competitors: aiVariantDetail.batchData.competitors,
            // PO / landed cost: từng dòng batch hoặc top-level payload (trước đây thiếu → luôn báo "chưa có phiếu nhập")
            costData:
              aiVariantDetail.detailResult.costData ??
              aiVariantDetail.batchData.costData ??
              null,
            product: {
              ...aiVariantDetail.batchData.product,
              currentPrice: aiVariantDetail.detailResult.currentPrice,
              modelId: aiVariantDetail.detailResult.modelId,
              modelSku: aiVariantDetail.detailResult.sku,
            },
          }}
          product={{
            id: aiVariantDetail.productSnapshot?.id,
            name: aiVariantDetail.productSnapshot?.name,
            price: aiVariantDetail.detailResult.currentPrice,
          }}
          onApply={() => setAiVariantDetail(null)}
          onClose={() => setAiVariantDetail(null)}
        />
      )}
    </div>
  );
};

export default ListingsPage;
