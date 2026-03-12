import React, { useState } from 'react';
import { Dropdown } from 'react-bootstrap';
import ListingsPagination from '../../components/seller/listings/ListingsPagination';
import styles from '../../assets/styles/seller/ListingsPage.module.css';

/* ── Config ──────────────────────────────────────────────────────── */
const STATUS_TABS = [
  { value: 'all',            label: 'All' },
  { value: 'pending_review', label: 'Pending' },
  { value: 'approved',       label: 'Approved' },
  { value: 'rejected',       label: 'Rejected' },
  { value: 'refunded',       label: 'Refunded' },
  { value: 'replaced',       label: 'Replaced' },
];

const BADGE_MAP = {
  pending_review: { label: 'Pending Review', cls: styles.badgePending },
  approved:       { label: 'Approved',       cls: styles.badgeApproved },
  rejected:       { label: 'Rejected',       cls: styles.badgeRejected },
  refunded:       { label: 'Refunded',       cls: styles.badgeRefunded },
  replaced:       { label: 'Replaced',       cls: styles.badgeReplaced },
};

const SAMPLE_RETURNS = [
  { id: 'R-20240310-001', orderId: 'ORD-8842', customer: 'Nguyen Van A', image: null, product: 'Retrospac Toy Bicycle for Children', category: 'Children Toys', price: 220000, status: 'pending_review', reason: 'Defective product', date: '2024-03-10' },
  { id: 'R-20240309-002', orderId: 'ORD-8790', customer: 'Tran Thi B',   image: null, product: 'Halnalca Call Receiver Set of Two',  category: 'Mobile & Accessories', price: 150000, status: 'approved',   reason: 'Wrong item shipped', date: '2024-03-09' },
  { id: 'R-20240308-003', orderId: 'ORD-8711', customer: 'Le Minh C',    image: null, product: 'Bell Bottom Jeans for Women',         category: 'Apparel',           price: 50000,  status: 'refunded',   reason: 'Changed mind',       date: '2024-03-08' },
  { id: 'R-20240307-004', orderId: 'ORD-8650', customer: 'Pham Thi D',   image: null, product: 'High Quality Condenser Mic',          category: 'Music Accessories', price: 180000, status: 'replaced',   reason: 'Not as described',   date: '2024-03-07' },
  { id: 'R-20240306-005', orderId: 'ORD-8601', customer: 'Hoang Van E',  image: null, product: 'Tilt-Tok Mini Toy Gun 3D STL File',  category: 'Music Accessories', price: 230000, status: 'rejected',   reason: 'Not as described',   date: '2024-03-06' },
];

const ITEMS_PER_PAGE = 8;

/* ─────────────────────────────────────────────────────────────────── */
const ReturnsPage = () => {
  const [statusTab, setStatusTab] = useState('all');
  const [search, setSearch]       = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filtered = SAMPLE_RETURNS
    .filter((r) => statusTab === 'all' || r.status === statusTab)
    .filter((r) => {
      const q = search.toLowerCase();
      return !q || r.product.toLowerCase().includes(q) || r.id.toLowerCase().includes(q) || r.customer.toLowerCase().includes(q);
    });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated  = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const counts = (status) => status === 'all'
    ? SAMPLE_RETURNS.length
    : SAMPLE_RETURNS.filter((r) => r.status === status).length;

  const formatVND = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

  return (
    <div className={styles.listingsPage}>

      {/* ── Header ────────────────────────────────────────── */}
      <div className={styles.listingsHeader}>
        <div className={styles.headerContent}>
          <div className={styles.titleSection}>
            <h1 className={styles.pageTitle}>Returns</h1>
            <p className={styles.pageSubtitle}>Manage customer return and refund requests</p>
          </div>
        </div>

        {/* Stats */}
        <div className={styles.statsRow}>
          {[
            { label: 'Total',    val: SAMPLE_RETURNS.length },
            { label: 'Pending',  val: SAMPLE_RETURNS.filter(r => r.status === 'pending_review').length, cls: styles.statInactive },
            { label: 'Approved', val: SAMPLE_RETURNS.filter(r => r.status === 'approved').length,       cls: styles.statActive },
            { label: 'Refunded', val: SAMPLE_RETURNS.filter(r => r.status === 'refunded').length,       cls: styles.statDraft },
          ].map(({ label, val, cls }) => (
            <div key={label} className={styles.statPill}>
              <span className={`${styles.statNum} ${cls || ''}`}>{val}</span>
              <span className={styles.statLabel}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Toolbar ───────────────────────────────────────── */}
      <div className={styles.toolbar}>
        <div className={styles.tabsGroup}>
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              className={`${styles.tab} ${statusTab === tab.value ? styles.tabActive : ''}`}
              onClick={() => { setStatusTab(tab.value); setCurrentPage(1); }}
            >
              {tab.label}
              <span className={styles.tabCount}>{counts(tab.value)}</span>
            </button>
          ))}
        </div>

        <div className={styles.toolbarRight}>
          <div className={styles.searchBox}>
            <svg className={styles.searchIcon} width="14" height="14" viewBox="0 0 20 20" fill="none">
              <circle cx="8.5" cy="8.5" r="6.5" stroke="currentColor" strokeWidth="1.8"/>
              <path d="M14 14l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search return ID, customer, product…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            />
          </div>
        </div>
      </div>

      {/* ── Table Card ────────────────────────────────────── */}
      <div className={styles.tableCard}>
        {paginated.length === 0 ? (
          <div className={styles.emptyState}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.3">
              <path d="M9 14l-4-4 4-4"/><path d="M5 10h11a4 4 0 000-8H4"/><path d="M3 21h18"/>
            </svg>
            <p>{search ? `No results for "${search}"` : 'No return requests'}</p>
          </div>
        ) : (
          <>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr className={styles.thead}>
                    <th className={styles.th}>Return ID</th>
                    <th className={styles.th}>Order</th>
                    <th className={styles.th}>Product</th>
                    <th className={styles.th}>Customer</th>
                    <th className={styles.th}>Reason</th>
                    <th className={styles.th} style={{ textAlign: 'right' }}>Refund</th>
                    <th className={styles.th}>Date</th>
                    <th className={styles.th} style={{ textAlign: 'center' }}>Status</th>
                    <th className={styles.th} style={{ width: 52 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((ret) => {
                    const st = BADGE_MAP[ret.status] || { label: ret.status, cls: '' };
                    return (
                      <tr key={ret.id} className={styles.tr}>
                        <td className={styles.td}>
                          <span className={styles.returnId}>{ret.id}</span>
                        </td>
                        <td className={styles.td}>
                          <span className={styles.sku}>{ret.orderId}</span>
                        </td>
                        <td className={styles.td}>
                          <div className={styles.productCell}>
                            <span className={styles.productName} style={{ fontSize: 13 }}>{ret.product}</span>
                            <span className={styles.categoryChip} style={{ marginTop: 2 }}>{ret.category}</span>
                          </div>
                        </td>
                        <td className={styles.td}>
                          <span style={{ fontSize: 13, color: '#334155', fontWeight: 500 }}>{ret.customer}</span>
                        </td>
                        <td className={styles.td}>
                          <span className={styles.reasonChip}>{ret.reason}</span>
                        </td>
                        <td className={styles.td} style={{ textAlign: 'right' }}>
                          <span className={styles.refundAmount}>{formatVND(ret.price)}</span>
                        </td>
                        <td className={styles.td}>
                          <span className={styles.dateText}>{ret.date}</span>
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
                              <Dropdown.Item><i className="bi bi-eye me-2" />View Details</Dropdown.Item>
                              {ret.status === 'pending_review' && (
                                <>
                                  <Dropdown.Item className="text-success"><i className="bi bi-check-circle me-2" />Approve</Dropdown.Item>
                                  <Dropdown.Item className="text-danger"><i className="bi bi-x-circle me-2" />Reject</Dropdown.Item>
                                </>
                              )}
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
                {filtered.length} return{filtered.length !== 1 ? 's' : ''} found
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
    </div>
  );
};

export default ReturnsPage;
