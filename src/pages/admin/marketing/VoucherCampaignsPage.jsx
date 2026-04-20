import { useState, useEffect, useMemo } from 'react';
import { Container, Button, Form, Modal, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import voucherCampaignService from '@services/api/voucherCampaignService';
import { ADMIN_ROUTES } from '@constants/routes';
import styles from './VoucherCampaignsPage.module.css';

const SKELETON_ROWS = 6;
const PAGE_SIZE = 10;

const OCCASION_LABELS = {
  NEW_YEAR: 'New Year',
  LUNAR_NEW_YEAR: 'Lunar New Year',
  BLACK_FRIDAY: 'Black Friday',
  CHRISTMAS: 'Christmas',
  VALENTINE: 'Valentine',
  WOMEN_DAY: "Women's Day",
  CUSTOM: 'Custom Date',
};

const OCCASION_BADGE_STYLE = {
  NEW_YEAR: { text: '🎆' },
  LUNAR_NEW_YEAR: { text: '🧧' },
  BLACK_FRIDAY: { text: '🛒' },
  CHRISTMAS: { text: '🎄' },
  VALENTINE: { text: '💝' },
  WOMEN_DAY: { text: '🌸' },
  CUSTOM: { text: '🎯' },
};

const getOccasionBadge = (campaign) => {
  if (campaign.triggerType === 'birthday') {
    return (
      <span className={`${styles.triggerPill} ${styles.triggerBirthday}`}>
        <span aria-hidden>🎂</span> Birthday
      </span>
    );
  }
  const emoji = OCCASION_BADGE_STYLE[campaign.occasion]?.text || '?';
  const label = OCCASION_LABELS[campaign.occasion] || campaign.occasion;
  return (
    <span className={`${styles.triggerPill} ${styles.triggerOccasion}`}>
      <span aria-hidden>{emoji}</span> {label}
    </span>
  );
};

const VoucherCampaignsPage = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [triggerId, setTriggerId] = useState(null);
  const [triggering, setTriggering] = useState(false);
  const [triggerResult, setTriggerResult] = useState(null);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterType !== 'all') {
        params.triggerType = filterType;
      }
      const res = await voucherCampaignService.getAll(params);
      setCampaigns(res.data || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [filterType]);

  useEffect(() => {
    setPage(1);
  }, [search, filterType, filterStatus]);

  const handleDelete = async () => {
    if (!deleteId) {
      return;
    }
    setDeleting(true);
    try {
      await voucherCampaignService.delete(deleteId);
      toast.success('Campaign deleted');
      setDeleteId(null);
      fetchCampaigns();
    } catch (err) {
      toast.error(err.message || 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  const handleTrigger = async () => {
    if (!triggerId) {
      return;
    }
    setTriggering(true);
    setTriggerResult(null);
    try {
      const res = await voucherCampaignService.trigger(triggerId);
      setTriggerResult(res.data);
      fetchCampaigns();
    } catch (err) {
      toast.error(err.message || 'Trigger failed');
    } finally {
      setTriggering(false);
    }
  };

  const filtered = useMemo(
    () =>
      campaigns.filter((c) => {
        const matchSearch =
          c.name?.toLowerCase().includes(search.toLowerCase()) ||
          c.code?.toLowerCase().includes(search.toLowerCase());
        const matchStatus =
          filterStatus === 'all' ||
          (filterStatus === 'active' && c.isActive) ||
          (filterStatus === 'inactive' && !c.isActive);
        return matchSearch && matchStatus;
      }),
    [campaigns, search, filterStatus]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, safePage]);

  const stats = useMemo(() => {
    const total = campaigns.length;
    const active = campaigns.filter((c) => c.isActive).length;
    const birthday = campaigns.filter((c) => c.triggerType === 'birthday').length;
    const occasion = campaigns.filter((c) => c.triggerType === 'occasion').length;
    return { total, active, birthday, occasion };
  }, [campaigns]);

  return (
    <Container fluid className={`p-0 ${styles.page}`}>
      <section className={`${styles.hero} ${styles.heroCampaign}`} aria-labelledby="vc-hero-title">
        <div className={styles.heroDecor1} aria-hidden />
        <div className={styles.heroDecor2} aria-hidden />
        <div className={styles.heroInner}>
          <h1 id="vc-hero-title" className={styles.heroTitle}>
            Voucher campaigns
          </h1>
          <p className={styles.heroSub}>
            Automated distribution for birthdays and fixed occasions — same voucher engine as system
            vouchers; campaigns control who receives codes and when.
          </p>
          <Link to={ADMIN_ROUTES.SYSTEM_VOUCHERS} className={styles.crossLink}>
            System-wide voucher codes →
          </Link>
        </div>
        <Button as={Link} to={ADMIN_ROUTES.VOUCHER_CAMPAIGN_CREATE} className={styles.btnCreate}>
          <i className="bi bi-plus-circle" />
          New campaign
        </Button>
      </section>

      {!loading && (
        <section className={styles.statGrid} aria-label="Summary">
          <div className={styles.statCard}>
            <div className={styles.statCardHeader}>
              <span className={styles.statKicker}>Campaigns</span>
              <div className={`${styles.statIcon} ${styles.statIconPrimary}`} aria-hidden>
                <i className="bi bi-calendar-heart" />
              </div>
            </div>
            <p className={styles.statValue}>{stats.total.toLocaleString()}</p>
            <p className={styles.statHint}>Total configured</p>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statCardHeader}>
              <span className={styles.statKicker}>Active</span>
              <div className={`${styles.statIcon} ${styles.statIconSecondary}`} aria-hidden>
                <i className="bi bi-toggle-on" />
              </div>
            </div>
            <p className={styles.statValue}>{stats.active.toLocaleString()}</p>
            <p className={styles.statHint}>Currently enabled</p>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statCardHeader}>
              <span className={styles.statKicker}>Birthday</span>
              <div className={`${styles.statIcon} ${styles.statIconTertiary}`} aria-hidden>
                <i className="bi bi-cake2" />
              </div>
            </div>
            <p className={styles.statValue}>{stats.birthday.toLocaleString()}</p>
            <p className={styles.statHint}>Per-user triggers</p>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statCardHeader}>
              <span className={styles.statKicker}>Occasion</span>
              <div className={`${styles.statIcon} ${styles.statIconNeutral}`} aria-hidden>
                <i className="bi bi-stars" />
              </div>
            </div>
            <p className={styles.statValue}>{stats.occasion.toLocaleString()}</p>
            <p className={styles.statHint}>Fixed-date campaigns</p>
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
              placeholder="Search name or campaign code…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search campaigns"
            />
          </div>
          <div className={styles.filtersRight}>
            <select
              className={styles.select}
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              aria-label="Filter by trigger type"
            >
              <option value="all">Trigger: All</option>
              <option value="birthday">Birthday</option>
              <option value="occasion">Occasion</option>
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
            </select>
            <span className={styles.iconBtnGhost} title="Filters" aria-hidden>
              <i className="bi bi-filter" />
            </span>
            <span className={styles.meta}>
              Showing <strong>{filtered.length}</strong> of {campaigns.length}
            </span>
          </div>
        </div>

        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Campaign</th>
                <th>Trigger</th>
                <th>Voucher</th>
                <th>Validity</th>
                <th>Active</th>
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
                      <span className={styles.skeletonBar} style={{ width: 96 }} />
                    </td>
                    <td className={styles.td}>
                      <span className={styles.skeletonBar} style={{ display: 'block', width: 160, marginBottom: 6 }} />
                      <span className={styles.skeletonBar} style={{ width: 80 }} />
                    </td>
                    <td className={styles.td}>
                      <span className={styles.skeletonBar} style={{ display: 'block', width: 56, marginBottom: 6 }} />
                      <span className={styles.skeletonBar} style={{ width: 72 }} />
                    </td>
                    <td className={styles.td}>
                      <span className={styles.skeletonBar} style={{ width: 40 }} />
                    </td>
                    <td className={`${styles.td} ${styles.cellEnd}`}>
                      <span className={`${styles.skeletonBar} ms-auto`} style={{ display: 'block', width: 96 }} />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className={styles.td}>
                    <div className={styles.empty}>
                      <div className={`${styles.emptyOrb} ${styles.emptyOrbRose}`} aria-hidden>
                        <i className="bi bi-calendar-x" />
                      </div>
                      <h2 className={styles.emptyTitle}>No campaigns here</h2>
                      <p className={styles.emptyHint}>
                        {campaigns.length === 0
                          ? 'Set up a campaign to auto-send vouchers on birthdays or seasonal dates.'
                          : 'Adjust search, trigger, or status filters.'}
                      </p>
                      {campaigns.length === 0 ? (
                        <Button as={Link} to={ADMIN_ROUTES.VOUCHER_CAMPAIGN_CREATE} className={styles.btnCreate}>
                          <i className="bi bi-plus-lg me-1" />
                          Create campaign
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map((c) => {
                  const rowInactive = !c.isActive;
                  return (
                    <tr key={c._id} className={rowInactive ? styles.inactiveRow : undefined}>
                      <td className={styles.td}>
                        <span className={styles.cellTitle}>{c.name}</span>
                        <span className={rowInactive ? `${styles.code} ${styles.codeMuted}` : styles.code}>{c.code}</span>
                      </td>
                      <td className={styles.td}>{getOccasionBadge(c)}</td>
                      <td className={styles.td}>
                        <div className={styles.valueMain}>{c.voucherName}</div>
                        <div className={styles.valueSub}>
                          {c.discountType === 'percent'
                            ? `${c.discountValue}%`
                            : `${Number(c.discountValue).toLocaleString('vi-VN')}₫`}
                          {c.maxDiscountAmount
                            ? ` · max ${Number(c.maxDiscountAmount).toLocaleString('vi-VN')}₫`
                            : ''}
                        </div>
                      </td>
                      <td className={styles.td}>
                        <span className={styles.validityStrong}>{c.voucherValidityDays} day(s)</span>
                        <span className={styles.validity} style={{ display: 'block', marginTop: '0.2rem' }}>
                          Offset {c.voucherStartOffset || 0}d
                        </span>
                      </td>
                      <td className={`${styles.td} ${styles.switchCell}`}>
                        <Form.Check
                          type="switch"
                          id={`sw-${c._id}`}
                          checked={c.isActive}
                          onChange={async () => {
                            try {
                              await voucherCampaignService.update(c._id, {
                                isActive: !c.isActive,
                              });
                              fetchCampaigns();
                            } catch {
                              toast.error('Failed to update status');
                            }
                          }}
                          label=""
                          aria-label={`Toggle active for ${c.name}`}
                        />
                      </td>
                      <td className={`${styles.td} ${styles.cellEnd}`}>
                        <div className={styles.rowActions}>
                          <button
                            type="button"
                            className={styles.actionTrigger}
                            onClick={() => {
                              setTriggerId(c._id);
                              setTriggerResult(null);
                            }}
                            title="Trigger manually (test)"
                            aria-label={`Manual trigger ${c.name}`}
                          >
                            <i className="bi bi-lightning-fill" />
                          </button>
                          <Button
                            as={Link}
                            to={ADMIN_ROUTES.VOUCHER_CAMPAIGN_EDIT.replace(':id', c._id)}
                            variant="link"
                            className={styles.actionIcon}
                            title="Edit"
                            aria-label="Edit campaign"
                          >
                            <i className="bi bi-pencil" />
                          </Button>
                          <Button
                            variant="link"
                            className={`${styles.actionIcon} ${styles.actionIconDanger}`}
                            title="Delete"
                            aria-label="Delete campaign"
                            onClick={() => setDeleteId(c._id)}
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

        {!loading && filtered.length > 0 && (
          <div className={styles.paginationBar}>
            <span>
              Showing {(safePage - 1) * PAGE_SIZE + 1} to {Math.min(safePage * PAGE_SIZE, filtered.length)} of{' '}
              {filtered.length} entries
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
                    <span
                      style={{
                        padding: '0.35rem 0.5rem',
                        fontWeight: 600,
                        color: 'var(--sv-on-surface-variant, #464555)',
                      }}
                    >
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

      <Modal show={!!deleteId} onHide={() => setDeleteId(null)} centered contentClassName="rounded-4 border-0 shadow">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className={styles.modalTitle}>Delete campaign</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-secondary pt-2">
          Are you sure you want to delete this campaign? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="light" className="fw-semibold text-secondary border" onClick={() => setDeleteId(null)}>
            Cancel
          </Button>
          <Button variant="danger" className="fw-semibold px-4" onClick={handleDelete} disabled={deleting}>
            {deleting ? <Spinner size="sm" /> : 'Delete'}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={!!triggerId}
        onHide={() => {
          setTriggerId(null);
          setTriggerResult(null);
        }}
        centered
        contentClassName="rounded-4 border-0 shadow"
      >
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className={`${styles.modalTitle} d-flex align-items-center gap-2`}>
            <i className="bi bi-lightning-fill text-warning" aria-hidden />
            Manual trigger
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-2">
          <p className="text-muted small mb-3">
            Creates vouchers for this campaign immediately (testing). Date rules are bypassed.
          </p>
          {triggerResult ? (
            <Alert variant="success" className="mb-0 rounded-3 border-0">
              <Alert.Heading className="fs-6">Done</Alert.Heading>
              {triggerResult.message}
            </Alert>
          ) : (
            <p className="mb-0 text-muted small">
              Ready to trigger “<strong>{campaigns.find((c) => c._id === triggerId)?.name}</strong>”.
            </p>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button
            variant="light"
            className="fw-semibold text-secondary border"
            onClick={() => {
              setTriggerId(null);
              setTriggerResult(null);
            }}
          >
            Close
          </Button>
          {!triggerResult && (
            <Button variant="warning" className="fw-semibold" onClick={handleTrigger} disabled={triggering}>
              {triggering ? (
                <Spinner size="sm" />
              ) : (
                <>
                  <i className="bi bi-lightning-fill me-1" /> Trigger now
                </>
              )}
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default VoucherCampaignsPage;
