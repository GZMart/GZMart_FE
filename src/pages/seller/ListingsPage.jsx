import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Dropdown } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ProductDrawer from '../../components/seller/listings/ProductDrawer';
import BulkUploadModal from '../../components/seller/listings/BulkUploadModal';
import ListingsPagination from '../../components/seller/listings/ListingsPagination';
import SortableHeader, { useSortState, sortRows } from '../../components/common/SortableHeader';
import AiPriceSuggestModal from '../../components/seller/listings/AiPriceSuggestModal';
import AiPriceDetailModal from '../../components/seller/listings/AiPriceDetailModal';
import { productService } from '../../services/api/productService';
import { formatCurrency } from '../../utils/formatters';
import styles from '../../assets/styles/seller/ListingsPage.module.css';

const ITEMS_PER_PAGE = 10;

const ListingsPage = () => {
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();

  const STATUS_TABS = [
    { value: 'all', label: t('listings.statusAll') },
    { value: 'active', label: t('listings.statusActive') },
    { value: 'draft', label: t('listings.statusDraft') },
    { value: 'inactive', label: t('listings.statusHidden') },
  ];

  const STATUS_MAP = {
    active: { label: t('listings.statusActive'), cls: styles.badgeActive },
    inactive: { label: t('listings.statusHidden'), cls: styles.badgeHidden },
    draft: { label: t('listings.statusDraft'), cls: styles.badgeDraft },
    out_of_stock: { label: t('listings.statusOutOfStock'), cls: styles.badgeOutOfStock },
  };

  const [allListings, setAllListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [aiModalProduct, setAiModalProduct] = useState(null);
  const [aiVariantDetail, setAiVariantDetail] = useState(null);

  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState(searchParams.get('status') || 'all');
  const { sortKey, sortDir, handleSort } = useSortState('_createdAt', 'desc');

  const fetchListings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await productService.getMyProducts({ limit: 1000 });
      if (response.success) {
        setAllListings(response.data.map(mapProduct));
      } else {
        setError(t('listings.errorLoad'));
      }
    } catch (err) {
      setError(err.message || t('listings.errorLoad'));
      setAllListings([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const mapProduct = (p) => {
    const categoryName =
      typeof p.categoryId === 'object'
        ? p.categoryId?.name
        : (p.category?.name ?? t('listings.uncategorized'));
    const prices = (p.models || []).map((m) => m.price).filter((x) => typeof x === 'number');
    const minPrice = prices.length ? Math.min(...prices) : p.originalPrice || 0;
    const maxPrice = prices.length ? Math.max(...prices) : p.originalPrice || 0;
    return {
      id: p._id,
      image: p.images?.[0] || p.tiers?.[0]?.images?.[0] || null,
      name: p.name,
      category: categoryName || t('listings.uncategorized'),
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
      if (error.status === 404 && product.status === 'draft') {
        const fromList = product._raw || { _id: product.id, ...product };
        setEditingProduct(fromList);
        setShowAddModal(true);
      } else {
        console.error('Error fetching product:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAiBatchApply = useCallback(async (product, changes) => {
    try {
      setLoading(true);
      const response = await productService.getById(product.id);
      if (response.success) {
        const priceMap = new Map(changes.map((c) => [c.modelId, c.suggestedPrice]));
        const updatedModels = (response.data.models || []).map((m) => {
          const newPrice = priceMap.get(m._id?.toString());
          return newPrice != null ? { ...m, price: newPrice } : m;
        });
        setEditingProduct({ ...response.data, models: updatedModels, _aiPriceChanges: changes });
        setShowAddModal(true);
      }
    } catch (error) {
      if (error.status === 404 && product.status === 'draft') {
        setEditingProduct(
          product._raw
            ? { ...product._raw, _aiPriceChanges: changes }
            : { _id: product.id, ...product, _aiPriceChanges: changes }
        );
        setShowAddModal(true);
      } else {
        console.error('Error opening product for AI batch price apply:', error);
      }
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

  return (
    <div className={styles.listingsPage}>
      <div className={styles.listingsHeader}>
        <div className={styles.headerContent}>
          <div className={styles.titleSection}>
            <h1 className={styles.pageTitle}>{t('listings.pageTitle')}</h1>
            <p className={styles.pageSubtitle}>{t('listings.pageSubtitle')}</p>
          </div>
          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.bulkOutlineBtn}
              onClick={() => setShowBulkUpload(true)}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {t('listings.btnBulkUpload')}
            </button>
            <button className={styles.addButton} onClick={handleAddItem}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M7 1v12M1 7h12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              {t('listings.btnAddProduct')}
            </button>
          </div>
        </div>

        <div className={styles.statsRow}>
          {[
            { label: t('listings.statTotal'), val: allListings.length },
            {
              label: t('listings.statusActive'),
              val: allListings.filter((p) => p.status === 'active').length,
              cls: styles.statActive,
            },
            {
              label: t('listings.statusDraft'),
              val: allListings.filter((p) => p.status === 'draft').length,
              cls: styles.statDraft,
            },
            {
              label: t('listings.statusHidden'),
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

      <div className={styles.toolbar}>
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
              placeholder={t('listings.searchPlaceholder')}
              value={search}
              onChange={handleSearch}
            />
          </div>
        </div>
      </div>

      <div className={styles.tableCard}>
        {loading ? (
          <div className={styles.centered}>
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className={styles.errorState}>
            <p>{error}</p>
            <button className={styles.addButton} onClick={fetchListings}>
              {t('listings.btnRetry')}
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
                ? t('listings.emptySearch', { q: search })
                : statusTab === 'inactive'
                  ? t('listings.emptyHidden')
                  : t('listings.emptyDefault')}
            </p>
            {!search && statusTab !== 'inactive' && (
              <button className={styles.addButton} onClick={handleAddItem}>
                {t('listings.btnAddProduct')}
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
                      label={t('listings.colProduct')}
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
                      label={t('listings.colCategory')}
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
                      label={t('listings.colSku')}
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
                      label={t('listings.colPrice')}
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
                      label={t('listings.colStock')}
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
                      label={t('listings.colStatus')}
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
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              justifyContent: 'flex-end',
                            }}
                          >
                            {product.minPrice !== product.maxPrice ? (
                              <span className={styles.price}>
                                {formatCurrency(product.minPrice)} &ndash;{' '}
                                {formatCurrency(product.maxPrice)}
                              </span>
                            ) : (
                              <span className={styles.price}>
                                {formatCurrency(product.minPrice)}
                              </span>
                            )}
                            <button
                              className={styles.aiBtn}
                              onClick={() => handleOpenAiModal(product)}
                              title={t('listings.aiPriceHint')}
                            >
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2L9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61z" />
                              </svg>
                              {t('listings.aiPriceBtn')}
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
                            {outOfStock ? t('listings.stockOut') : `${product.stock}`}
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
                            <Dropdown.Menu
                              renderOnMount
                              popperConfig={{
                                strategy: 'fixed',
                                modifiers: [
                                  { name: 'computeStyles', options: { adaptive: false } },
                                ],
                              }}
                            >
                              <Dropdown.Item onClick={() => handleEditItem(product)}>
                                <i className="bi bi-pencil me-2" />
                                {t('listings.menuEdit')}
                              </Dropdown.Item>
                              <Dropdown.Item onClick={() => handleToggleVisibility(product)}>
                                {isHidden ? (
                                  <>
                                    <i className="bi bi-eye me-2" />
                                    {t('listings.menuUnhide')}
                                  </>
                                ) : (
                                  <>
                                    <i className="bi bi-eye-slash me-2" />
                                    {t('listings.menuHide')}
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

            <div className={styles.tableFooter}>
              <span className={styles.footerInfo}>
                {t('listings.showing', {
                  from: (currentPage - 1) * ITEMS_PER_PAGE + 1,
                  to: Math.min(currentPage * ITEMS_PER_PAGE, filtered.length),
                  total: filtered.length,
                })}
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

      <BulkUploadModal
        isOpen={showBulkUpload}
        onClose={() => setShowBulkUpload(false)}
        onCompleted={fetchListings}
      />

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
          setAiVariantDetail({ detailResult, batchData, productSnapshot: aiModalProduct });
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
            costData:
              aiVariantDetail.detailResult.costData ?? aiVariantDetail.batchData.costData ?? null,
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
