import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchSupplierById, clearCurrentSupplier, updateSupplier } from '../../store/slices/erpSlice';
import * as erpService from '../../services/api/erpService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import SupplierDrawer from '../../components/erp/SupplierDrawer';
import styles from '@assets/styles/erp/SupplierDetailPage.module.css';
import {
  ArrowLeft,
  PencilLine,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  Clock,
  Building2,
  CreditCard,
  ShoppingCart,
  Wallet,
  TrendingUp,
  Package,
  CheckCircle2,
  ThumbsUp,
  AlertTriangle,
  XCircle,
  ClipboardList,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  InboxIcon,
} from 'lucide-react';

const SupplierDetailPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentSupplier: supplier, loading } = useSelector((state) => state.erp);

  const [purchaseHistory, setPurchaseHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    status: '',
  });

  useEffect(() => {
    dispatch(fetchSupplierById(id));
    loadPurchaseHistory();

    return () => {
      dispatch(clearCurrentSupplier());
    };
  }, [dispatch, id]);

  useEffect(() => {
    loadPurchaseHistory();
  }, [filters]);

  const loadPurchaseHistory = async () => {
    setHistoryLoading(true);
    try {
      const response = await erpService.getSupplierPurchaseHistory(id, filters);
      setPurchaseHistory(response.data);
    } catch (err) {
      console.error('Failed to load purchase history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleEditSave = async (formData) => {
    await dispatch(updateSupplier({ id, updateData: formData })).unwrap();
    setEditDrawerOpen(false);
    dispatch(fetchSupplierById(id));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getSupplierInitials = (name) => {
    if (!name) return 'S';
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  const getStatusConfig = (status) => {
    const map = {
      Active: { label: 'Active', className: styles.badgeActive },
      Inactive: { label: 'Inactive', className: styles.badgeInactive },
    };
    return map[status] || map.Active;
  };

  const getPOStatusConfig = (status) => {
    const map = {
      Draft: { label: 'Draft', className: styles.badgeDraft },
      Pending: { label: 'Pending', className: styles.badgePending },
      Completed: { label: 'Completed', className: styles.badgeCompleted },
      Cancelled: { label: 'Cancelled', className: styles.badgeCancelled },
    };
    return map[status] || map.Draft;
  };

  const getScoreConfig = (score) => {
    if (score >= 80) return { label: 'Excellent Supplier', Icon: CheckCircle2, className: styles.scoreExcellent };
    if (score >= 60) return { label: 'Good Supplier', Icon: ThumbsUp, className: styles.scoreGood };
    if (score >= 40) return { label: 'Average Supplier', Icon: AlertTriangle, className: styles.scoreAverage };
    return { label: 'Needs Improvement', Icon: XCircle, className: styles.scorePoor };
  };

  const infoFields = supplier
    ? [
        { icon: User, label: 'Contact Person', value: supplier.contactPerson },
        { icon: Phone, label: 'Phone', value: supplier.phone },
        { icon: Mail, label: 'Email', value: supplier.email },
        { icon: MapPin, label: 'Address', value: supplier.address },
        { icon: FileText, label: 'Tax Code', value: supplier.taxCode },
        { icon: Clock, label: 'Payment Terms', value: supplier.paymentTerms },
        { icon: Building2, label: 'Bank Name', value: supplier.bankName },
        { icon: CreditCard, label: 'Account Number', value: supplier.bankAccount },
      ]
    : [];

  if (loading || !supplier) {
    return <LoadingSpinner />;
  }

  const score = supplier.reliabilityScore || 0;
  const scoreConfig = getScoreConfig(score);
  const ScoreIcon = scoreConfig.Icon;
  const statusConfig = getStatusConfig(supplier.status);
  const analytics = purchaseHistory?.analytics;

  const statCards = analytics
    ? [
        {
          icon: ShoppingCart,
          label: 'Total Orders',
          value: analytics.totalPurchaseOrders,
          accentColor: '#1a56db',
          bgColor: '#eff6ff',
        },
        {
          icon: Wallet,
          label: 'Total Spent',
          value: formatCurrency(analytics.totalSpent),
          accentColor: '#059669',
          bgColor: '#f0fdf4',
        },
        {
          icon: TrendingUp,
          label: 'Avg / Order',
          value: formatCurrency(analytics.averageOrderValue),
          accentColor: '#d97706',
          bgColor: '#fffbeb',
        },
        {
          icon: Package,
          label: 'Total Items',
          value: analytics.totalItemsOrdered,
          accentColor: '#7c3aed',
          bgColor: '#f5f3ff',
        },
      ]
    : [];

  return (
    <div className={styles.container}>
      {/* ── Header ─────────────────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button
            className={styles.btnBack}
            onClick={() => navigate('/seller/erp/suppliers')}
            aria-label="Back to suppliers"
          >
            <ArrowLeft size={16} />
            <span>Suppliers</span>
          </button>

          <div className={styles.titleRow}>
            <div className={styles.avatar}>{getSupplierInitials(supplier.name)}</div>
            <div>
              <h1 className={styles.title}>{supplier.name}</h1>
              <p className={styles.subtitle}>ID: {supplier._id}</p>
            </div>
          </div>
        </div>

        <div className={styles.headerRight}>
          <span className={statusConfig.className}>{statusConfig.label}</span>
          <button
            className={styles.btnEdit}
            onClick={() => setEditDrawerOpen(true)}
          >
            <PencilLine size={15} />
            Edit
          </button>
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────── */}
      <div className={styles.mainGrid}>
        {/* Left: Supplier Info */}
        <div className={styles.infoCard}>
          <h2 className={styles.sectionTitle}>Supplier Information</h2>
          <div className={styles.infoGrid}>
            {infoFields.map(({ icon: Icon, label, value }) => (
              <div key={label} className={styles.infoItem}>
                <div className={styles.infoIconWrap}>
                  <Icon size={15} strokeWidth={2} />
                </div>
                <div className={styles.infoContent}>
                  <span className={styles.infoLabel}>{label}</span>
                  <span className={styles.infoValue}>{value || '—'}</span>
                </div>
              </div>
            ))}
          </div>

          {supplier.notes && (
            <div className={styles.notes}>
              <span className={styles.infoLabel}>Notes</span>
              <p>{supplier.notes}</p>
            </div>
          )}
        </div>

        {/* Right: Reliability Score */}
        <div className={styles.scoreCard}>
          <h2 className={styles.sectionTitle}>Reliability Score</h2>

          <div className={styles.scoreDisplay}>
            <div className={styles.scoreRing}>
              <svg viewBox="0 0 120 120" className={styles.scoreRingSvg}>
                <circle
                  cx="60" cy="60" r="50"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="10"
                />
                <circle
                  cx="60" cy="60" r="50"
                  fill="none"
                  stroke={score >= 80 ? '#10b981' : score >= 60 ? '#3b82f6' : score >= 40 ? '#f59e0b' : '#ef4444'}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${(score / 100) * 314} 314`}
                  transform="rotate(-90 60 60)"
                  style={{ transition: 'stroke-dasharray 0.8s ease' }}
                />
              </svg>
              <div className={styles.scoreRingInner}>
                <span className={styles.scoreNumber}>{score}</span>
                <span className={styles.scoreMax}>/100</span>
              </div>
            </div>

            <div className={`${styles.scoreLabel} ${scoreConfig.className}`}>
              <ScoreIcon size={16} strokeWidth={2} />
              {scoreConfig.label}
            </div>
          </div>

          <div className={styles.scoreBar}>
            <div
              className={styles.scoreFill}
              style={{ width: `${score}%` }}
            />
          </div>
          <div className={styles.scoreBarLabels}>
            <span>0</span>
            <span>50</span>
            <span>100</span>
          </div>
        </div>
      </div>

      {/* ── Analytics Stats ──────────────────────────────────── */}
      {analytics && (
        <div className={styles.statsGrid}>
          {statCards.map(({ icon: Icon, label, value, accentColor, bgColor }) => (
            <div key={label} className={styles.statCard} style={{ '--accent': accentColor, '--bg': bgColor }}>
              <div className={styles.statIconWrap}>
                <Icon size={20} strokeWidth={2} color={accentColor} />
              </div>
              <div className={styles.statContent}>
                <span className={styles.statLabel}>{label}</span>
                <span className={styles.statValue}>{value}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Purchase History ─────────────────────────────────── */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitleRow}>
            <ClipboardList size={18} strokeWidth={2} color="#1a56db" />
            <h2 className={styles.sectionTitle} style={{ marginBottom: 0 }}>Purchase History</h2>
          </div>

          <div className={styles.filterWrap}>
            <SlidersHorizontal size={14} color="#6b7280" />
            <select
              value={filters.status}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value, page: 1 }))}
              className={styles.filter}
            >
              <option value="">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {historyLoading ? (
          <LoadingSpinner />
        ) : purchaseHistory?.purchaseOrders?.length > 0 ? (
          <>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Order Code</th>
                    <th>Created Date</th>
                    <th>Received Date</th>
                    <th>Total Items</th>
                    <th>Total Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseHistory.purchaseOrders.map((po) => {
                    const poStatus = getPOStatusConfig(po.status);
                    return (
                      <tr
                        key={po._id}
                        onClick={() => navigate(`/seller/erp/purchase-orders/${po._id}`)}
                        className={styles.clickableRow}
                      >
                        <td className={styles.orderCode}>{po.code}</td>
                        <td>{formatDate(po.createdAt)}</td>
                        <td>{formatDate(po.receivedDate)}</td>
                        <td>{po.items?.length || 0}</td>
                        <td className={styles.amount}>{formatCurrency(po.finalAmount)}</td>
                        <td>
                          <span className={poStatus.className}>{poStatus.label}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {purchaseHistory.pagination && (
              <div className={styles.pagination}>
                <button
                  className={styles.paginationBtn}
                  disabled={filters.page === 1}
                  onClick={() => setFilters((prev) => ({ ...prev, page: prev.page - 1 }))}
                  aria-label="Previous page"
                >
                  <ChevronLeft size={16} />
                  Prev
                </button>
                <span className={styles.paginationInfo}>
                  Page <strong>{filters.page}</strong> of <strong>{purchaseHistory.pagination.totalPages}</strong>
                </span>
                <button
                  className={styles.paginationBtn}
                  disabled={filters.page === purchaseHistory.pagination.totalPages}
                  onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}
                  aria-label="Next page"
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className={styles.emptyState}>
            <InboxIcon size={40} strokeWidth={1.5} color="#d1d5db" />
            <p>No purchase orders found</p>
          </div>
        )}
      </div>
      {/* ── Edit Drawer ─────────────────────────────────────── */}
      {editDrawerOpen && (
        <SupplierDrawer
          supplier={supplier}
          onClose={() => setEditDrawerOpen(false)}
          onSave={handleEditSave}
        />
      )}
    </div>
  );
};

export default SupplierDetailPage;
