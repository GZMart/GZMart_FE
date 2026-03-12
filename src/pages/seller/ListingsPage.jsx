import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Dropdown } from 'react-bootstrap';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AddProductModal from '../../components/seller/listings/AddProductModal';
import ListingsPagination from '../../components/seller/listings/ListingsPagination';
import { productService } from '../../services/api/productService';
import { useSearchParams } from 'react-router-dom';
import { formatCurrency } from '../../utils/formatters';
import styles from '../../assets/styles/seller/ListingsPage.module.css';

/* ── Status config ─────────────────────────────────────────────────── */
const STATUS_TABS = [
  { value: 'all',      label: 'All' },
  { value: 'active',   label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'draft',    label: 'Draft' },
];

const STATUS_MAP = {
  active:   { label: 'Active',   cls: styles.badgeActive },
  inactive: { label: 'Inactive', cls: styles.badgeInactive },
  draft:    { label: 'Draft',    cls: styles.badgeDraft },
};

const SORT_OPTIONS = [
  { value: 'newest',     label: 'Newest first' },
  { value: 'oldest',     label: 'Oldest first' },
  { value: 'price-low',  label: 'Price: Low → High' },
  { value: 'price-high', label: 'Price: High → Low' },
  { value: 'name-asc',   label: 'Name: A → Z' },
  { value: 'name-desc',  label: 'Name: Z → A' },
];

const ITEMS_PER_PAGE = 8;

/* ── Helpers ──────────────────────────────────────────────────────── */
const totalStock = (product) =>
  product.models?.reduce((s, m) => s + (m.stock || 0), 0) ?? 0;

/* ─────────────────────────────────────────────────────────────────── */
const ListingsPage = () => {
  const [searchParams] = useSearchParams();

  const [allListings, setAllListings] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [showAddModal, setShowAddModal]   = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState(searchParams.get('status') || 'all');
  const [sort, setSort]   = useState('newest');

  /* ── Fetch ──────────────────────────────────────────────────────── */
  useEffect(() => { fetchListings(); }, []);

  const fetchListings = async () => {
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
  };

  const mapProduct = (p) => {
    const categoryName =
      typeof p.categoryId === 'object' ? p.categoryId?.name : p.category?.name ?? 'Uncategorized';
    return {
      id:        p._id,
      image:     p.images?.[0] || p.tiers?.[0]?.images?.[0] || null,
      name:      p.name,
      category:  categoryName || 'Uncategorized',
      price:     p.originalPrice,
      status:    p.status,
      sku:       p.models?.[0]?.sku || '—',
      brand:     p.brand || '—',
      stock:     p.models?.reduce((s, m) => s + (m.stock || 0), 0) ?? 0,
      _createdAt: p.createdAt,
      _raw: p,
    };
  };

  /* ── Filter + sort ──────────────────────────────────────────────── */
  const filtered = useMemo(() => {
    let list = [...allListings];

    if (statusTab !== 'all') list = list.filter((p) => p.status === statusTab);

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
      );
    }

    switch (sort) {
      case 'oldest':     list.sort((a, b) => new Date(a._createdAt) - new Date(b._createdAt)); break;
      case 'price-low':  list.sort((a, b) => a.price - b.price); break;
      case 'price-high': list.sort((a, b) => b.price - a.price); break;
      case 'name-asc':   list.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'name-desc':  list.sort((a, b) => b.name.localeCompare(a.name)); break;
      default:           list.sort((a, b) => new Date(b._createdAt) - new Date(a._createdAt));
    }
    return list;
  }, [allListings, statusTab, search, sort]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated  = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleStatusTab = (val) => { setStatusTab(val); setCurrentPage(1); };
  const handleSearch    = (e)   => { setSearch(e.target.value); setCurrentPage(1); };

  /* ── Actions ───────────────────────────────────────────────────── */
  const handleAddItem = () => { setEditingProduct(null); setShowAddModal(true); };

  const handleEditItem = async (product) => {
    try {
      setLoading(true);
      const response = await productService.getById(product.id);
      if (response.success) { setEditingProduct(response.data); setShowAddModal(true); }
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  /* ── Render ─────────────────────────────────────────────────────── */
  return (
    <div className={styles.listingsPage}>

      {/* ── Page Header ─────────────────────────────────────── */}
      <div className={styles.listingsHeader}>
        <div className={styles.headerContent}>
          <div className={styles.titleSection}>
            <h1 className={styles.pageTitle}>Listings</h1>
            <p className={styles.pageSubtitle}>Manage your product catalogue</p>
          </div>
          <button className={styles.addButton} onClick={handleAddItem}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Add Product
          </button>
        </div>

        {/* ── Stats row ─────────────────────────────────────── */}
        <div className={styles.statsRow}>
          {[
            { label: 'Total',    val: allListings.length },
            { label: 'Active',   val: allListings.filter((p) => p.status === 'active').length,   cls: styles.statActive },
            { label: 'Draft',    val: allListings.filter((p) => p.status === 'draft').length,    cls: styles.statDraft },
            { label: 'Inactive', val: allListings.filter((p) => p.status === 'inactive').length, cls: styles.statInactive },
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
            <svg className={styles.searchIcon} width="14" height="14" viewBox="0 0 20 20" fill="none">
              <circle cx="8.5" cy="8.5" r="6.5" stroke="currentColor" strokeWidth="1.8"/>
              <path d="M14 14l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search name or SKU…"
              value={search}
              onChange={handleSearch}
            />
          </div>

          {/* Sort */}
          <select
            className={styles.sortSelect}
            value={sort}
            onChange={(e) => { setSort(e.target.value); setCurrentPage(1); }}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
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
            <button className={styles.addButton} onClick={fetchListings}>Retry</button>
          </div>
        ) : paginated.length === 0 ? (
          <div className={styles.emptyState}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.3">
              <rect x="2" y="7" width="20" height="14" rx="2"/>
              <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
              <line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/>
            </svg>
            <p>{search ? `No results for "${search}"` : 'No products found. Add your first product!'}</p>
            {!search && (
              <button className={styles.addButton} onClick={handleAddItem}>Add Product</button>
            )}
          </div>
        ) : (
          <>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr className={styles.thead}>
                    <th className={styles.th} style={{ width: 40 }}>#</th>
                    <th className={styles.th} style={{ width: 52 }}></th>
                    <th className={styles.th}>Product</th>
                    <th className={styles.th}>Category</th>
                    <th className={styles.th}>SKU</th>
                    <th className={styles.th} style={{ textAlign: 'right' }}>Price</th>
                    <th className={styles.th} style={{ textAlign: 'center' }}>Stock</th>
                    <th className={styles.th} style={{ textAlign: 'center' }}>Status</th>
                    <th className={styles.th} style={{ width: 52 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((product, idx) => {
                    const st = STATUS_MAP[product.status] || { label: product.status, cls: '' };
                    const rowNum = (currentPage - 1) * ITEMS_PER_PAGE + idx + 1;
                    const lowStock = product.stock > 0 && product.stock < 5;
                    const outOfStock = product.stock === 0;
                    return (
                      <tr key={product.id} className={styles.tr}>
                        <td className={styles.td}>
                          <span className={styles.rowNum}>{rowNum}</span>
                        </td>
                        <td className={styles.td}>
                          <div className={styles.thumbWrap}>
                            {product.image ? (
                              <img src={product.image} alt={product.name} className={styles.thumb} />
                            ) : (
                              <div className={styles.thumbPlaceholder}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5">
                                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                                  <circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>
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
                          <span className={styles.price}>{formatCurrency(product.price)}</span>
                        </td>
                        <td className={styles.td} style={{ textAlign: 'center' }}>
                          <span className={
                            outOfStock ? styles.stockOut
                            : lowStock ? styles.stockLow
                            : styles.stockOk
                          }>
                            {outOfStock ? 'Out' : `${product.stock}`}
                          </span>
                        </td>
                        <td className={styles.td} style={{ textAlign: 'center' }}>
                          <span className={`${styles.badge} ${st.cls}`}>{st.label}</span>
                        </td>
                        <td className={styles.td}>
                          <Dropdown align="end">
                            <Dropdown.Toggle as="button" className={styles.menuBtn} bsPrefix="x">
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <circle cx="8" cy="3"  r="1.3" fill="currentColor"/>
                                <circle cx="8" cy="8"  r="1.3" fill="currentColor"/>
                                <circle cx="8" cy="13" r="1.3" fill="currentColor"/>
                              </svg>
                            </Dropdown.Toggle>
                            <Dropdown.Menu>
                              <Dropdown.Item onClick={() => handleEditItem(product)}>
                                <i className="bi bi-pencil me-2" />Edit
                              </Dropdown.Item>
                              <Dropdown.Item>
                                <i className="bi bi-eye-slash me-2" />Hide
                              </Dropdown.Item>
                              <Dropdown.Divider />
                              <Dropdown.Item className="text-danger">
                                <i className="bi bi-trash me-2" />Delete
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
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} products
              </span>
              <ListingsPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(p) => { if (p >= 1 && p <= totalPages) setCurrentPage(p); }}
              />
            </div>
          </>
        )}
      </div>

      <AddProductModal
        show={showAddModal}
        onHide={() => { setShowAddModal(false); setEditingProduct(null); }}
        onSuccess={fetchListings}
        editingProduct={editingProduct}
      />
    </div>
  );
};

export default ListingsPage;
