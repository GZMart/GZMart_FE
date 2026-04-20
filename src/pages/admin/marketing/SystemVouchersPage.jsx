import { useState, useEffect, useMemo } from 'react';
import { Container, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { ADMIN_ROUTES } from '@constants/routes';
import systemVoucherService from '@services/api/systemVoucherService';
import { toast } from 'react-toastify';
import styles from './SystemVouchersPage.module.css';

const SKELETON_ROWS = 6;
const PAGE_SIZE = 10;

const isExpired = (voucher) => voucher.endTime && new Date(voucher.endTime) < new Date();

const SystemVouchersPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      const data = await systemVoucherService.getAll();
      setVouchers(data || []);
    } catch (error) {
      toast.error(error.message || 'Failed to fetch vouchers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, filterType, filterStatus]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this voucher?')) {
      try {
        await systemVoucherService.delete(id);
        toast.success('Voucher deleted successfully');
        fetchVouchers();
      } catch (error) {
        toast.error(error.message || 'Failed to delete voucher');
      }
    }
  };

  const filteredVouchers = useMemo(() => {
    return vouchers.filter((voucher) => {
      const matchesSearch =
        voucher.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        voucher.code?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType =
        filterType === 'all' ||
        (filterType === 'shipping' && voucher.type === 'system_shipping') ||
        (filterType === 'order' && voucher.type === 'system_order');
      const exp = isExpired(voucher);
      const matchesStatus =
        filterStatus === 'all' ||
        (filterStatus === 'active' && voucher.status === 'active' && !exp) ||
        (filterStatus === 'inactive' && voucher.status !== 'active') ||
        (filterStatus === 'expired' && exp);
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [vouchers, searchTerm, filterType, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filteredVouchers.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredVouchers.slice(start, start + PAGE_SIZE);
  }, [filteredVouchers, safePage]);

  const stats = useMemo(() => {
    const total = vouchers.length;
    const active = vouchers.filter((v) => v.status === 'active' && !isExpired(v)).length;
    const shipping = vouchers.filter((v) => v.type === 'system_shipping').length;
    const orderOnly = vouchers.filter((v) => v.type === 'system_order');
    const avgOrder =
      orderOnly.length > 0
        ? Math.round(orderOnly.reduce((s, v) => s + Number(v.discountValue || 0), 0) / orderOnly.length)
        : 0;
    return { total, active, shipping, avgOrder, orderCount: orderOnly.length };
  }, [vouchers]);

  const formatRange = (from, to) => {
    const a = new Date(from);
    const b = new Date(to);
    return `${a.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} → ${b.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  return (
    <Container fluid className={`p-0 ${styles.page}`}>
      <section className={styles.hero} aria-labelledby="sv-hero-title">
        <div className={styles.heroDecor1} aria-hidden />
        <div className={styles.heroDecor2} aria-hidden />
        <div className={styles.heroInner}>
          <h1 id="sv-hero-title" className={styles.heroTitle}>
            System Vouchers
          </h1>
          <p className={styles.heroSub}>Manage platform-wide vouchers and discounts.</p>
          <Link to={ADMIN_ROUTES.VOUCHER_CAMPAIGNS} className={styles.crossLink}>
            Automated voucher campaigns →
          </Link>
        </div>
        <Button as={Link} to={ADMIN_ROUTES.SYSTEM_VOUCHER_CREATE} className={styles.btnCreate}>
          <i className="bi bi-plus-circle" />
          Create voucher
        </Button>
      </section>

      {!loading && (
        <section className={styles.statGrid} aria-label="Summary">
          <div className={styles.statCard}>
            <div className={styles.statCardHeader}>
              <span className={styles.statKicker}>Total vouchers</span>
              <div className={`${styles.statIcon} ${styles.statIconPrimary}`} aria-hidden>
                <i className="bi bi-inbox-fill" />
              </div>
            </div>
            <p className={styles.statValue}>{stats.total.toLocaleString()}</p>
            <p className={styles.statHint}>
              <i className="bi bi-graph-up-arrow" />
              <span>All system rules</span>
            </p>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statCardHeader}>
              <span className={styles.statKicker}>Active now</span>
              <div className={`${styles.statIcon} ${styles.statIconSecondary}`} aria-hidden>
                <i className="bi bi-lightning-charge-fill" />
              </div>
            </div>
            <p className={styles.statValue}>{stats.active.toLocaleString()}</p>
            <p className={styles.statHint}>Currently valid &amp; active</p>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statCardHeader}>
              <span className={styles.statKicker}>Free shipping</span>
              <div className={`${styles.statIcon} ${styles.statIconTertiary}`} aria-hidden>
                <i className="bi bi-truck" />
              </div>
            </div>
            <p className={styles.statValue}>{stats.shipping.toLocaleString()}</p>
            <p className={styles.statHint}>Shipping-type rules</p>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statCardHeader}>
              <span className={styles.statKicker}>Avg order discount</span>
              <div className={`${styles.statIcon} ${styles.statIconNeutral}`} aria-hidden>
                <i className="bi bi-currency-exchange" />
              </div>
            </div>
            <p className={styles.statValue}>
              {stats.orderCount ? `${stats.avgOrder.toLocaleString()}đ` : '—'}
            </p>
            <p className={styles.statHint}>
              {stats.orderCount ? `Across ${stats.orderCount} order rule(s)` : 'No order vouchers'}
            </p>
          </div>
        </section>
      )}

      <section className={styles.panel}>
        <div className={styles.filterRow}>
          <div className={styles.searchWrap}>
            <i className={`bi bi-search ${styles.searchIcon}`} aria-hidden />
            <input
              type="search"
              className={styles.searchInput}
              placeholder="Search code or name…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search vouchers"
            />
          </div>
          <div className={styles.filtersRight}>
            <select
              className={styles.select}
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              aria-label="Filter by type"
            >
              <option value="all">Type: All</option>
              <option value="shipping">Free shipping</option>
              <option value="order">Order discount</option>
            </select>
            <select
              className={styles.select}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              aria-label="Filter by status"
            >
              <option value="all">Status: All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="expired">Expired</option>
            </select>
            <span className={styles.iconBtnGhost} title="Filters" aria-hidden>
              <i className="bi bi-filter" />
            </span>
            <span className={styles.meta}>
              Showing <strong>{filteredVouchers.length}</strong> of {vouchers.length}
            </span>
          </div>
        </div>

        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Voucher details</th>
                <th>Type</th>
                <th>Value / condition</th>
                <th>Usage</th>
                <th>Status</th>
                <th>Validity</th>
                <th className={styles.cellEnd}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                  <tr key={`sk-${i}`}>
                    <td className={styles.td}>
                      <span className={styles.skeletonBar} style={{ display: 'block', maxWidth: 180, marginBottom: 8 }} />
                      <span className={styles.skeletonBar} style={{ display: 'block', maxWidth: 90 }} />
                    </td>
                    <td className={styles.td}>
                      <span className={styles.skeletonBar} style={{ width: 88 }} />
                    </td>
                    <td className={styles.td}>
                      <span className={styles.skeletonBar} style={{ display: 'block', width: 100, marginBottom: 6 }} />
                      <span className={styles.skeletonBar} style={{ width: 72 }} />
                    </td>
                    <td className={styles.td}>
                      <span className={styles.skeletonBar} style={{ display: 'block', width: 120, marginBottom: 8 }} />
                      <span className={styles.skeletonBar} style={{ width: '100%', maxWidth: 128 }} />
                    </td>
                    <td className={styles.td}>
                      <span className={styles.skeletonBar} style={{ width: 72 }} />
                    </td>
                    <td className={styles.td}>
                      <span className={styles.skeletonBar} style={{ display: 'block', width: 110, marginBottom: 6 }} />
                      <span className={styles.skeletonBar} style={{ width: 110 }} />
                    </td>
                    <td className={`${styles.td} ${styles.cellEnd}`}>
                      <span className={`${styles.skeletonBar} ms-auto`} style={{ display: 'block', width: 72 }} />
                    </td>
                  </tr>
                ))
              ) : filteredVouchers.length === 0 ? (
                <tr>
                  <td colSpan={7} className={styles.td}>
                    <div className={styles.empty}>
                      <div className={styles.emptyOrb} aria-hidden>
                        <i className="bi bi-inbox" />
                      </div>
                      <h2 className={styles.emptyTitle}>No vouchers here</h2>
                      <p className={styles.emptyHint}>
                        {vouchers.length === 0
                          ? 'Create your first system voucher for checkout-wide shipping or order discounts.'
                          : 'Try adjusting search, type, or status filters.'}
                      </p>
                      {vouchers.length === 0 ? (
                        <Button as={Link} to={ADMIN_ROUTES.SYSTEM_VOUCHER_CREATE} className={styles.btnCreate}>
                          <i className="bi bi-plus-lg me-1" />
                          Create voucher
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map((voucher) => {
                  const used = voucher.usageCount || 0;
                  const limit = voucher.usageLimit || 1;
                  const pct = Math.min(100, (used / limit) * 100);
                  const expired = isExpired(voucher);
                  const rowInactive = voucher.status !== 'active' || expired;
                  return (
                    <tr key={voucher._id} className={rowInactive ? styles.inactiveRow : undefined}>
                      <td className={styles.td}>
                        <span className={styles.cellTitle}>{voucher.name}</span>
                        <span className={rowInactive ? `${styles.code} ${styles.codeMuted}` : styles.code}>{voucher.code}</span>
                      </td>
                      <td className={styles.td}>
                        {voucher.type === 'system_shipping' ? (
                          <span className={`${styles.typePill} ${styles.typeShip}`}>
                            <i className="bi bi-truck" /> Shipping
                          </span>
                        ) : (
                          <span className={`${styles.typePill} ${styles.typeOrder}`}>
                            <i className="bi bi-percent" /> Order
                          </span>
                        )}
                      </td>
                      <td className={styles.td}>
                        <div className={styles.valueMain}>{voucher.discountValue?.toLocaleString()}đ</div>
                        <div className={styles.valueSub}>Min. basket {voucher.minBasketPrice?.toLocaleString()}đ</div>
                      </td>
                      <td className={styles.td}>
                        <div className={styles.usage}>
                          <div className="d-flex justify-content-between small">
                            <span className="fw-medium">{used.toLocaleString()}</span>
                            <span className="text-muted">/ {limit.toLocaleString()}</span>
                          </div>
                          <div className={styles.usageBar}>
                            <div
                              className={pct >= 100 ? `${styles.usageFill} ${styles.usageFillMuted}` : styles.usageFill}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className={styles.td}>
                        {voucher.status === 'active' && !expired ? (
                          <span className={`${styles.statusPill} ${styles.statusActive}`}>
                            <span className={styles.dot} /> Active
                          </span>
                        ) : (
                          <span className={`${styles.statusPill} ${styles.statusInactive}`}>
                            <span className={styles.dot} />
                            {expired ? 'Expired' : 'Inactive'}
                          </span>
                        )}
                      </td>
                      <td className={styles.td}>
                        <span className={styles.validityStrong}>{formatRange(voucher.startTime, voucher.endTime)}</span>
                      </td>
                      <td className={`${styles.td} ${styles.cellEnd}`}>
                        <div className={styles.rowActions}>
                          <Button
                            as={Link}
                            to={ADMIN_ROUTES.SYSTEM_VOUCHER_EDIT.replace(':id', voucher._id)}
                            variant="link"
                            className={styles.actionIcon}
                            title="Edit"
                            aria-label="Edit voucher"
                          >
                            <i className="bi bi-pencil" />
                          </Button>
                          <Button
                            variant="link"
                            className={`${styles.actionIcon} ${styles.actionIconDanger}`}
                            title="Delete"
                            aria-label="Delete voucher"
                            onClick={() => handleDelete(voucher._id)}
                          >
                            <i className="bi bi-trash" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && filteredVouchers.length > 0 && (
          <div className={styles.paginationBar}>
            <span>
              Showing {(safePage - 1) * PAGE_SIZE + 1} to {Math.min(safePage * PAGE_SIZE, filteredVouchers.length)} of{' '}
              {filteredVouchers.length} entries
            </span>
            <div className={styles.pageBtns}>
              <button
                type="button"
                className={styles.pageBtn}
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </button>
              {totalPages <= 12
                ? Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      type="button"
                      className={n === safePage ? `${styles.pageBtn} ${styles.pageBtnActive}` : styles.pageBtn}
                      onClick={() => setPage(n)}
                    >
                      {n}
                    </button>
                  ))
                : (
                    <span style={{ padding: '0.35rem 0.5rem', fontWeight: 600, color: 'var(--sv-on-surface-variant, #464555)' }}>
                      Page {safePage} / {totalPages}
                    </span>
                  )}
              <button
                type="button"
                className={styles.pageBtn}
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>
    </Container>
  );
};

export default SystemVouchersPage;
