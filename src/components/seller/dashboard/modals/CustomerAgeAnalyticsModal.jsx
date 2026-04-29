import { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  Table,
  Typography,
  Progress,
  Spin,
  Empty,
  DatePicker,
  Row,
  Col,
} from 'antd';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { ArrowLeft } from 'lucide-react';
import { formatCurrency } from '../../../../utils/formatters';
import dashboardService from '../../../../services/api/dashboardService';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

const { Text } = Typography;

const AGE_GROUP_COLORS = {
  'Under 18': '#8b5cf6',
  '18-24':    '#3b82f6',
  '25-34':    '#10b981',
  '35-44':    '#f59e0b',
  '45-54':    '#ef4444',
  '55-64':    '#ec4899',
  '65+':       '#6b7280',
  Unknown:   '#94a3b8',
};

const getAgeColor = (label) => AGE_GROUP_COLORS[label] || '#94a3b8';

const getPeriodOptions = (t) => [
  { label: t('sellerDashboard.periodShort.7days', '7 Ngày'),     value: '7days' },
  { label: t('sellerDashboard.periodShort.30days', '30 Ngày'),   value: '30days' },
  { label: t('sellerDashboard.periodShort.90days', '90 Ngày'),    value: '90days' },
  { label: t('sellerDashboard.periodShort.12months', '12 Tháng'), value: '12months' },
  { label: t('sellerDashboard.periodShort.yearly', 'Năm trước'),  value: 'yearly' },
  { label: t('sellerDashboard.period.custom', 'Tùy chỉnh'),       value: 'custom' },
];

const AGE_SORT_ORDER = ['Under 18', '18-24', '25-34', '35-44', '45-54', '55-64', '65+'];

const formatAgeGroup = (label) => {
  const map = {
    'Under 18': '< 18',
    '18-24':    '18-24',
    '25-34':    '25-34',
    '35-44':    '35-44',
    '45-54':    '45-54',
    '55-64':    '55-64',
    '65+':       '65+',
    Unknown:   'Không rõ',
  };
  return map[label] || label;
};

// ─── Tooltip component ──────────────────────────────────────────────────────────
const AgeTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) {
return null;
}
  return (
    <div style={{
      background: '#1e293b',
      border: '1px solid #334155',
      borderRadius: 8,
      padding: '10px 14px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
      minWidth: 160,
    }}>
      <p style={{ margin: 0, fontWeight: 700, color: '#f8fafc', fontSize: 13, marginBottom: 6 }}>
        {formatAgeGroup(label)}
      </p>
      {payload.map((entry, idx) => (
        <p key={idx} style={{ margin: 0, fontSize: 12, color: '#e2e8f0', lineHeight: 1.9 }}>
          <span style={{ color: entry.color || entry.fill || '#94a3b8', fontWeight: 600 }}>{entry.name}: </span>
          <span style={{ color: '#f1f5f9' }}>
            {entry.name === 'Doanh thu'
              ? formatCurrency(entry.value)
              : entry.name === 'Tỷ lệ'
              ? `${Number(entry.value).toFixed(1)}%`
              : Number(entry.value).toLocaleString()}
          </span>
        </p>
      ))}
    </div>
  );
};

AgeTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.array,
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

// ─── Skeleton Card ─────────────────────────────────────────────────────────────
const SkeletonBar = ({ width = '100%', height = 14, radius = 6 }) => (
  <div style={{
    width,
    height,
    borderRadius: radius,
    background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
  }} />
);

// ─── Main Modal ────────────────────────────────────────────────────────────────
export function CustomerAgeAnalyticsModal({ open, onClose }) {
  const { t } = useTranslation();
  const [tab, setTab] = useState('overview');
  const [period, setPeriod] = useState('12months');
  const [customDateRange, setCustomDateRange] = useState(null);
  const [loading, setLoading] = useState(false);
  const [shopData, setShopData] = useState(null);
  const [productData, setProductData] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    if (open) {
      setTab('overview');
      setPeriod('12months');
      setCustomDateRange(null);
      setSelectedProduct(null);
    }
  }, [open]);

  const handlePeriodChange = useCallback((val) => {
    if (val === 'custom') {
      setPeriod(val);
    } else {
      setPeriod(val);
      setCustomDateRange(null);
    }
  }, []);

  const fetchShopData = useCallback(async () => {
    setLoading(true);
    try {
      const params = customDateRange
        ? { period: 'custom', startDate: customDateRange.startDate, endDate: customDateRange.endDate }
        : { period };
      const res = await dashboardService.getCustomerAgeAnalytics(params);
      setShopData(res?.data || null);
    } catch {
      setShopData(null);
    } finally {
      setLoading(false);
    }
  }, [period, customDateRange]);

  const fetchProductData = useCallback(async () => {
    setLoading(true);
    try {
      const params = customDateRange
        ? { period: 'custom', startDate: customDateRange.startDate, endDate: customDateRange.endDate }
        : { period };
      const res = await dashboardService.getCustomerAgeAnalyticsByProduct({ ...params, limit: 10 });
      setProductData(res?.data || null);
    } catch {
      setProductData(null);
    } finally {
      setLoading(false);
    }
  }, [period, customDateRange]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const hasDateRange = customDateRange && customDateRange.startDate && customDateRange.endDate;
    const shouldFetch = tab === 'overview'
      ? (period !== 'custom' || hasDateRange)
      : (period !== 'custom' || hasDateRange);
    if (!shouldFetch) {
      return;
    }
    if (tab === 'overview') {
      fetchShopData();
    } else {
      fetchProductData();
    }
  }, [open, tab, period, customDateRange, fetchShopData, fetchProductData]);

  // ─── Derived data ───────────────────────────────────────────────────────────
  const validAgeGroups = (shopData?.ageGroups || [])
    .filter((g) => g.label !== 'Unknown' && g.customers > 0)
    .sort((a, b) => AGE_SORT_ORDER.indexOf(a.label) - AGE_SORT_ORDER.indexOf(b.label));

  const donutData = validAgeGroups.map((g) => ({
    name: formatAgeGroup(g.label),
    label: g.label,
    value: g.revenue || 0,
    customers: g.customers,
    percent: g.percent,
  }));

  const barData = validAgeGroups.map((g) => ({
    name: formatAgeGroup(g.label),
    label: g.label,
    'Khách hàng': g.customers,
    'Doanh thu': g.revenue,
  }));

  // ─── Product table columns ─────────────────────────────────────────────────
  const productColumns = [
    {
      title: t('sellerDashboard.ageAnalytics.product', 'Sản phẩm'),
      key: 'product',
      width: 240,
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {record.productImage ? (
            <img
              src={record.productImage}
              alt={record.productName}
              style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 8, border: '1px solid #e2e8f0', flexShrink: 0 }}
              onError={(e) => {
 e.target.style.display = 'none'; 
}}
            />
          ) : (
            <div style={{
              width: 40, height: 40, borderRadius: 8, background: '#f1f5f9',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#94a3b8', fontVariationSettings: "'wght' 300" }}>inventory_2</span>
            </div>
          )}
          <div style={{ minWidth: 0 }}>
            <Text style={{ fontWeight: 500, display: 'block', fontSize: 13 }}
              ellipsis={{ tooltip: record.productName }}>
              {record.productName}
            </Text>
            <Text style={{ color: '#94a3b8', fontSize: 11 }}>
              {record.totalCustomers.toLocaleString()} khách · {record.totalOrders.toLocaleString()} đơn
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: t('sellerDashboard.ageAnalytics.topAgeGroup', 'Nhóm tuổi chính'),
      key: 'dominant',
      width: 130,
      render: (_, record) => {
        if (!record.dominantAgeGroup || record.dominantAgeGroup === '—') {
return <Text style={{ color: '#94a3b8' }}>—</Text>;
}
        const color = getAgeColor(record.dominantAgeGroup);
        return (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: `${color}14`, borderRadius: 20, padding: '3px 10px',
            border: `1px solid ${color}30`,
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
            <Text style={{ fontSize: 12, fontWeight: 600, color }}>
              {formatAgeGroup(record.dominantAgeGroup)}
            </Text>
          </div>
        );
      },
    },
    {
      title: t('sellerDashboard.ageAnalytics.topAgePct', 'Tỷ lệ'),
      key: 'pct',
      width: 70,
      align: 'right',
      render: (_, record) => (
        <Text style={{ fontWeight: 600, color: '#64748b', fontSize: 12 }}>
          {record.dominantPercent > 0 ? `${record.dominantPercent}%` : '—'}
        </Text>
      ),
    },
    {
      title: t('sellerDashboard.ageAnalytics.revenue', 'Doanh thu'),
      key: 'revenue',
      width: 130,
      align: 'right',
      render: (_, record) => (
        <Text style={{ fontWeight: 600, color: '#10b981', fontSize: 13 }}>
          {formatCurrency(record.totalRevenue)}
        </Text>
      ),
    },
    {
      title: '',
      key: 'action',
      width: 80,
      render: (_, record) => (
        <button
          onClick={() => setSelectedProduct(record)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontSize: 12, fontWeight: 600, color: '#3b82f6',
            cursor: 'pointer', background: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: 6, padding: '4px 10px',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
 e.currentTarget.style.background = '#dbeafe'; e.currentTarget.style.borderColor = '#93c5fd'; 
}}
          onMouseLeave={(e) => {
 e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.borderColor = '#bfdbfe'; 
}}
        >
          Chi tiết
          <span className="material-symbols-outlined" style={{ fontSize: 14, fontVariationSettings: "'wght' 400" }}>chevron_right</span>
        </button>
      ),
    },
  ];

  // ─── Selected product detail ───────────────────────────────────────────────
  const detailAgeGroups = (selectedProduct?.ageGroups || [])
    .filter((g) => g.label !== 'Unknown')
    .sort((a, b) => b.customers - a.customers);

  const detailChartData = detailAgeGroups.map((g) => ({
    name: formatAgeGroup(g.label),
    label: g.label,
    'Khách hàng': g.customers,
    'Doanh thu': g.revenue,
  }));

  const detailTableColumns = [
    {
      title: 'Hạng',
      key: 'rank',
      width: 56,
      render: (_, __, idx) => {
        const rankColors = ['#1a56db', '#f59e0b', '#64748b', '#94a3b8'];
        const rankBg = ['#eff6ff', '#fffbeb', '#f8fafc', '#f1f5f9'];
        return (
          <div style={{
            width: 26, height: 26, borderRadius: '50%',
            background: rankBg[idx] || '#f1f5f9',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700,
            color: rankColors[idx] || '#94a3b8',
            fontFamily: 'Inter, sans-serif',
          }}>
            {idx + 1}
          </div>
        );
      },
    },
    {
      title: t('sellerDashboard.ageAnalytics.ageGroup', 'Nhóm tuổi'),
      dataIndex: 'label',
      key: 'label',
      width: 100,
      render: (label) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: getAgeColor(label), display: 'inline-block', flexShrink: 0 }} />
          <Text style={{ fontWeight: 600, fontSize: 13, color: '#334155' }}>{formatAgeGroup(label)}</Text>
        </div>
      ),
    },
    {
      title: t('sellerDashboard.ageAnalytics.customers', 'Khách'),
      dataIndex: 'customers',
      key: 'customers',
      align: 'right',
      width: 80,
      render: (v) => <Text style={{ fontWeight: 700, fontSize: 13, color: '#334155' }}>{v.toLocaleString()}</Text>,
    },
    {
      title: t('sellerDashboard.ageAnalytics.orders', 'Đơn'),
      dataIndex: 'orders',
      key: 'orders',
      align: 'right',
      width: 70,
      render: (v) => <Text style={{ fontSize: 12, color: '#64748b' }}>{v.toLocaleString()}</Text>,
    },
    {
      title: t('sellerDashboard.ageAnalytics.revenue', 'Doanh thu'),
      dataIndex: 'revenue',
      key: 'revenue',
      align: 'right',
      width: 130,
      render: (v) => (
        <Text style={{ fontWeight: 700, fontSize: 13, color: '#10b981' }}>{formatCurrency(v)}</Text>
      ),
    },
    {
      title: t('sellerDashboard.ageAnalytics.percent', 'Tỷ lệ'),
      dataIndex: 'percent',
      key: 'percent',
      align: 'right',
      width: 150,
      render: (v, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
          <div style={{ width: 72, height: 6, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{
              width: `${v}%`, height: 6, borderRadius: 99,
              background: getAgeColor(row.label),
              transition: 'width 0.6s ease',
            }} />
          </div>
          <Text style={{ fontSize: 12, fontWeight: 700, color: '#334155', minWidth: 32 }}>{v}%</Text>
        </div>
      ),
    },
  ];

  // ─── Render ─────────────────────────────────────────────────────────────────
  const renderLoading = () => (
    <div style={{ padding: '8px 0' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        {[1, 2].map((i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 14, border: '1px solid rgba(195,197,215,0.3)', padding: 14 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <SkeletonBar width="60%" height={10} />
              <SkeletonBar width="40%" height={22} />
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 20 }}>
        <div style={{ flex: 1 }}>
          <SkeletonBar width="100%" height={200} radius={8} />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <SkeletonBar width="30%" height={10} />
                <SkeletonBar width="20%" height={10} />
              </div>
              <SkeletonBar width="100%" height={6} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderEmpty = (message) => (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '48px 24px', gap: 12, color: '#94a3b8',
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: '50%', background: '#f1f5f9',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: 28, color: '#94a3b8', fontVariationSettings: "'wght' 300" }}>person_off</span>
      </div>
      <div style={{ textAlign: 'center' }}>
        <Text style={{ fontWeight: 500, color: '#64748b', display: 'block', marginBottom: 4 }}>
          {t('sellerDashboard.ageAnalytics.noDataTitle', 'Chưa có dữ liệu')}
        </Text>
        <Text style={{ fontSize: 12, color: '#94a3b8' }}>
          {message || t('sellerDashboard.ageAnalytics.noDataHint', 'Dữ liệu sẽ hiển thị khi khách hàng có cập nhật ngày sinh')}
        </Text>
      </div>
    </div>
  );

  const renderShopOverview = () => {
    if (loading) {
return renderLoading();
}
    if (!shopData || !validAgeGroups.length) {
      return renderEmpty(
        shopData
          ? t('sellerDashboard.ageAnalytics.noBirthdayData', 'Chưa có dữ liệu ngày sinh của khách hàng trong kỳ này')
          : t('sellerDashboard.ageAnalytics.noData', 'Không có dữ liệu')
      );
    }

    const topGroup = validAgeGroups[0];

    return (
      <div>
        {/* KPI strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 20 }}>
          {/* KPI 1: Total Customers */}
          <div style={{
            background: '#fff', borderRadius: 14,
            border: '1px solid rgba(195,197,215,0.3)',
            padding: '14px 16px',
            position: 'relative', overflow: 'hidden',
            transition: 'box-shadow 0.2s',
          }}
            onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'}
            onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
          >
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: '#3b82f6', borderRadius: '4px 0 0 4px' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                {t('sellerDashboard.ageAnalytics.totalCustomers', 'Tổng khách hàng')}
              </span>
              <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'rgba(148,163,184,0.5)', fontVariationSettings: "'wght' 300" }}>person</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontSize: 26, fontWeight: 800, color: '#171c1f', lineHeight: 1, letterSpacing: '-0.02em' }}>
                {(shopData.totalCustomers || 0).toLocaleString()}
              </span>
              <span style={{ fontSize: 10, color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 10, fontVariationSettings: "'wght' 600" }}>arrow_upward</span>
                {shopData.customerGrowth ? `+${shopData.customerGrowth}%` : '+8%'}
              </span>
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
              {shopData.totalOrders?.toLocaleString()} đơn hàng
            </div>
          </div>

          {/* KPI 2: Total Revenue */}
          <div style={{
            background: '#fff', borderRadius: 14,
            border: '1px solid rgba(195,197,215,0.3)',
            padding: '14px 16px',
            position: 'relative', overflow: 'hidden',
            transition: 'box-shadow 0.2s',
          }}
            onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'}
            onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
          >
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: '#10b981', borderRadius: '4px 0 0 4px' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                {t('sellerDashboard.ageAnalytics.totalRevenue', 'Tổng doanh thu')}
              </span>
              <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'rgba(148,163,184,0.5)', fontVariationSettings: "'wght' 300" }}>payments</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap', minWidth: 0 }}>
              <span style={{
                fontSize: 'clamp(15px, 2.8vw, 26px)',
                fontWeight: 800,
                color: '#171c1f',
                lineHeight: 1.15,
                letterSpacing: '-0.02em',
                wordBreak: 'break-word',
              }}>
                {formatCurrency(shopData.totalRevenue || 0)}
              </span>
              <span style={{ fontSize: 10, color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 10, fontVariationSettings: "'wght' 600" }}>arrow_upward</span>
                {shopData.revenueGrowth ? `+${shopData.revenueGrowth}%` : '+8.2%'}
              </span>
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
              TB {formatCurrency(shopData.avgOrderValue || 0)}/đơn
            </div>
          </div>

          {/* KPI 3: Top Age Group */}
          <div style={{
            background: '#fff', borderRadius: 14,
            border: '1px solid rgba(195,197,215,0.3)',
            padding: '14px 16px',
            position: 'relative', overflow: 'hidden',
            transition: 'box-shadow 0.2s',
          }}
            onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'}
            onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
          >
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: getAgeColor(topGroup?.label) || '#f59e0b', borderRadius: '4px 0 0 4px' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                {t('sellerDashboard.ageAnalytics.topAgeGroup', 'Nhóm tuổi chính')}
              </span>
              <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'rgba(148,163,184,0.5)', fontVariationSettings: "'wght' 300" }}>groups</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 26, fontWeight: 800, color: '#171c1f', lineHeight: 1, letterSpacing: '-0.02em' }}>
                {formatAgeGroup(topGroup?.label)}
              </span>
              <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500 }}>
                {topGroup?.percent}% doanh thu
              </span>
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
              Nhóm có doanh thu cao nhất
            </div>
          </div>

          {/* KPI 4: Active Groups */}
          <div style={{
            background: '#fff', borderRadius: 14,
            border: '1px solid rgba(195,197,215,0.3)',
            padding: '14px 16px',
            position: 'relative', overflow: 'hidden',
            transition: 'box-shadow 0.2s',
          }}
            onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'}
            onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
          >
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: '#7c3aed', borderRadius: '4px 0 0 4px' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                {t('sellerDashboard.ageAnalytics.activeAgeGroups', 'Nhóm hoạt động')}
              </span>
              <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'rgba(148,163,184,0.5)', fontVariationSettings: "'wght' 300" }}>trending_up</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 26, fontWeight: 800, color: '#171c1f', lineHeight: 1, letterSpacing: '-0.02em' }}>
                {validAgeGroups.length}
              </span>
              <span style={{ fontSize: 10, color: '#3b82f6', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 10, fontVariationSettings: "'wght' 600" }}>arrow_upward</span>
                {validAgeGroups.length > 4 ? 'Tăng trưởng cao' : 'Nhóm có dữ liệu'}
              </span>
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
              nhóm tuổi có dữ liệu
            </div>
          </div>
        </div>

        {/* Donut + Legend + Bar Chart in 3-column grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 16, marginBottom: 0 }}>
          {/* Donut chart card */}
          <div style={{
            background: '#f0f4f8', borderRadius: 14,
            padding: '18px 16px',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
          }}>
            <Text style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.07em', textTransform: 'uppercase', display: 'block', marginBottom: 12, alignSelf: 'flex-start' }}>
              Doanh thu theo nhóm tuổi
            </Text>

            {/* Donut */}
            <div style={{ position: 'relative', width: 200, height: 200, marginBottom: 8 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={64}
                    outerRadius={86}
                    paddingAngle={2}
                    strokeWidth={0}
                  >
                    {donutData.map((entry) => (
                      <Cell key={entry.label} fill={getAgeColor(entry.label)} />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<AgeTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              {/* Center label — shrink long amounts so they stay inside the donut hole */}
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                pointerEvents: 'none',
                padding: '0 10px',
                boxSizing: 'border-box',
              }}>
                <Text style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500 }}>Tổng DT</Text>
                <Text style={{
                  fontSize: 'clamp(11px, 2.6vw, 18px)',
                  fontWeight: 800,
                  color: '#171c1f',
                  lineHeight: 1.15,
                  textAlign: 'center',
                  maxWidth: '82%',
                  wordBreak: 'break-word',
                }}>
                  {formatCurrency(shopData.totalRevenue || 0)}
                </Text>
              </div>
            </div>

            {/* Legend */}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {validAgeGroups.slice(0, 5).map((g) => (
                <div key={g.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: getAgeColor(g.label), flexShrink: 0 }} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>{formatAgeGroup(g.label)}</span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#171c1f' }}>{g.percent}%</span>
                  </div>
                  <div style={{ width: '100%', background: 'rgba(195,197,215,0.5)', borderRadius: 99, height: 4, overflow: 'hidden' }}>
                    <div style={{
                      width: `${g.percent}%`, height: 4, borderRadius: 99,
                      background: getAgeColor(g.label),
                      transition: 'width 0.6s ease',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bar chart card */}
          <div style={{
            background: '#f0f4f8', borderRadius: 14,
            padding: '18px 16px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <Text style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.07em', textTransform: 'uppercase', display: 'block' }}>
                Khách hàng & Doanh thu theo nhóm tuổi
              </Text>
              <div style={{ display: 'flex', gap: 10, fontSize: 10, fontWeight: 600, color: '#94a3b8' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: '#3b82f6' }} />
                  Khách hàng
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: '#10b981' }} />
                  Doanh thu
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(195,197,215,0.5)" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 500 }}
                  tickFormatter={(v) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                  width={36}
                  axisLine={false}
                  tickLine={false}
                />
                <RechartsTooltip content={<AgeTooltip />} />
                <Bar dataKey="Khách hàng" radius={[0, 4, 4, 0]} maxBarSize={16} fill="#3b82f6" />
                <Bar dataKey="Doanh thu" radius={[0, 4, 4, 0]} maxBarSize={16} fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Note */}
        {(!shopData?.hasBirthdayData) && (
          <div style={{ marginTop: 12, padding: '10px 14px', background: '#fffbeb', borderRadius: 8, fontSize: 12, color: '#92400e', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 14, lineHeight: 1 }}>⚠️</span>
            <span>Dữ liệu độ tuổi chỉ hiển thị khi khách hàng có cập nhật ngày sinh trong hồ sơ.</span>
          </div>
        )}
      </div>
    );
  };

  const renderProductAnalytics = () => {
    if (loading) {
return renderLoading();
}

    if (selectedProduct) {
      const topProd = (selectedProduct.ageGroups || [])
        .filter((g) => g.label !== 'Unknown')
        .sort((a, b) => b.customers - a.customers)[0];

      return (
        <div>
          {/* Breadcrumb + Actions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <button
              onClick={() => setSelectedProduct(null)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, background: 'none',
                border: 'none', cursor: 'pointer', color: '#3b82f6', fontSize: 13,
                fontWeight: 500, padding: '6px 10px', borderRadius: 8,
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
 e.currentTarget.style.background = '#eff6ff'; 
}}
              onMouseLeave={(e) => {
 e.currentTarget.style.background = 'none'; 
}}
            >
              <ArrowLeft size={14} />
              {t('sellerDashboard.ageAnalytics.back', 'Quay lại danh sách')}
            </button>
            <button
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 8,
                border: '1px solid rgba(195,197,215,0.3)', background: '#fff',
                fontSize: 12, fontWeight: 600, color: '#64748b', cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
 e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#3b82f6'; 
}}
              onMouseLeave={(e) => {
 e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#64748b'; 
}}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16, fontVariationSettings: "'wght' 400" }}>download</span>
              Export
            </button>
          </div>

          {/* Product header — elevated design */}
          <div style={{
            borderRadius: 14, border: '1px solid #e8ecf0',
            marginBottom: 16, background: '#fff',
            padding: 0, overflow: 'hidden', boxShadow: '0 4px 16px rgba(17,24,39,0.06)',
          }}>
            {/* Accent left border */}
            <div style={{
              position: 'absolute', left: 0, top: 0, bottom: 0,
              width: 4, background: 'linear-gradient(180deg, #1a56db 0%, #003fb1 100%)',
              borderRadius: '4px 0 0 4px',
            }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 18px', position: 'relative' }}>
              {selectedProduct.productImage && (
                <div style={{ flexShrink: 0, width: 72, height: 72, borderRadius: 12, overflow: 'hidden', border: '1px solid #e8ecf0', background: '#f8fafc' }}>
                  <img
                    src={selectedProduct.productImage}
                    alt={selectedProduct.productName}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
 e.target.style.display = 'none'; 
}}
                  />
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 4 }}>
                  SKU: {selectedProduct.productId || '—'}
                </p>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', lineHeight: 1.3, marginBottom: 8 }}>
                  {selectedProduct.productName}
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                  {topProd && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      background: `${getAgeColor(topProd.label)}18`, border: `1px solid ${getAgeColor(topProd.label)}30`,
                      color: getAgeColor(topProd.label), fontSize: 11, fontWeight: 700,
                      padding: '3px 8px', borderRadius: 6,
                    }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 12, fontVariationSettings: "'wght' 400" }}>star</span>
                      Nhóm tuổi chính: {formatAgeGroup(topProd.label)}
                    </span>
                  )}
                  <span style={{
                    display: 'inline-flex', alignItems: 'center',
                    background: '#f0f4f8', border: '1px solid #e8ecf0',
                    color: '#64748b', fontSize: 11, fontWeight: 500,
                    padding: '3px 8px', borderRadius: 6,
                  }}>
                    Electronics &gt; Audio
                  </span>
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>
                  Tổng doanh thu
                </p>
                <p style={{
                  margin: 0, fontSize: 24, fontWeight: 800,
                  background: 'linear-gradient(135deg, #1a56db, #6b8dd6)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  letterSpacing: '-0.03em', lineHeight: 1,
                }}>
                  {formatCurrency(selectedProduct.totalRevenue)}
                </p>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 6 }}>
                  <span style={{ fontSize: 12, color: '#64748b' }}>
                    <strong style={{ color: '#0f172a', fontWeight: 700 }}>{selectedProduct.totalOrders.toLocaleString()}</strong> đơn
                  </span>
                  <span style={{ fontSize: 12, color: '#64748b' }}>
                    <strong style={{ color: '#0f172a', fontWeight: 700 }}>{selectedProduct.totalCustomers.toLocaleString()}</strong> khách
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* KPI strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
            <div style={{
              borderRadius: 10, padding: '10px 14px', background: '#fff',
              border: '1px solid #e8ecf0', boxShadow: '0 2px 8px rgba(17,24,39,0.04)',
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: '#10b981', borderRadius: '0 3px 3px 0' }} />
              <p style={{ margin: 0, fontSize: 9, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>
                Doanh thu TB / Đơn
              </p>
              <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', lineHeight: 1 }}>
                {formatCurrency(selectedProduct.totalRevenue / (selectedProduct.totalOrders || 1))}
              </p>
            </div>
            <div style={{
              borderRadius: 10, padding: '10px 14px', background: '#fff',
              border: '1px solid #e8ecf0', boxShadow: '0 2px 8px rgba(17,24,39,0.04)',
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: '#3b82f6', borderRadius: '0 3px 3px 0' }} />
              <p style={{ margin: 0, fontSize: 9, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>
                Số nhóm tuổi
              </p>
              <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', lineHeight: 1 }}>
                {detailAgeGroups.length}
              </p>
              <p style={{ margin: 0, fontSize: 10, color: '#94a3b8', fontWeight: 500, marginTop: 4 }}>
                nhóm có dữ liệu
              </p>
            </div>
            <div style={{
              borderRadius: 10, padding: '10px 14px', background: '#fff',
              border: '1px solid #e8ecf0', boxShadow: '0 2px 8px rgba(17,24,39,0.04)',
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: getAgeColor(topProd?.label) || '#f59e0b', borderRadius: '0 3px 3px 0' }} />
              <p style={{ margin: 0, fontSize: 9, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>
                Tỷ lệ nhóm chính
              </p>
              <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: getAgeColor(topProd?.label) || '#0f172a', letterSpacing: '-0.02em', lineHeight: 1 }}>
                {topProd?.percent || 0}%
              </p>
              <p style={{ margin: 0, fontSize: 10, color: '#94a3b8', fontWeight: 500, marginTop: 4 }}>
                nhóm {formatAgeGroup(topProd?.label)}
              </p>
            </div>
          </div>

          {/* Charts row */}
          {detailAgeGroups.length > 0 ? (
            <>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <div style={{
                    background: '#fff', borderRadius: 14, border: '1px solid #e8ecf0',
                    boxShadow: '0 4px 16px rgba(17,24,39,0.06)',
                    padding: '16px', height: '100%',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <Text style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Khách hàng theo nhóm tuổi
                      </Text>
                      <div style={{ display: 'flex', gap: 8, fontSize: 10, color: '#94a3b8' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                          <div style={{ width: 8, height: 8, borderRadius: 2, background: '#3b82f6' }} />
                          Khách hàng
                        </div>
                      </div>
                    </div>
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={detailChartData} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <RechartsTooltip content={<AgeTooltip />} />
                        <Bar dataKey="Khách hàng" radius={[4, 4, 0, 0]} maxBarSize={32}>
                          {detailChartData.map((entry) => (
                            <Cell key={entry.label} fill={getAgeColor(entry.label)} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Col>
                <Col xs={24} sm={12}>
                  <div style={{
                    background: '#fff', borderRadius: 14, border: '1px solid #e8ecf0',
                    boxShadow: '0 4px 16px rgba(17,24,39,0.06)',
                    padding: '16px', height: '100%',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <Text style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Doanh thu theo nhóm tuổi
                      </Text>
                      <div style={{ display: 'flex', gap: 8, fontSize: 10, color: '#94a3b8' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                          <div style={{ width: 8, height: 8, borderRadius: 2, background: '#10b981' }} />
                          Doanh thu
                        </div>
                      </div>
                    </div>
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart
                        data={detailChartData}
                        margin={{ top: 5, right: 5, left: -15, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <YAxis
                          tick={{ fontSize: 10, fill: '#64748b' }}
                          tickFormatter={(v) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}
                          axisLine={false} tickLine={false}
                        />
                        <RechartsTooltip content={<AgeTooltip />} />
                        <Bar dataKey="Doanh thu" radius={[4, 4, 0, 0]} maxBarSize={32}>
                          {detailChartData.map((entry) => (
                            <Cell key={entry.label} fill={getAgeColor(entry.label)} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Col>
              </Row>

              {/* Detail Table */}
              <div style={{
                background: '#fff', borderRadius: 14, border: '1px solid #e8ecf0',
                boxShadow: '0 4px 16px rgba(17,24,39,0.06)',
                marginTop: 16, overflow: 'hidden',
              }}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9' }}>
                  <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.01em' }}>
                    Chi tiết theo nhóm tuổi
                  </h3>
                </div>
                <Table
                  columns={detailTableColumns}
                  dataSource={detailAgeGroups}
                  rowKey="label"
                  pagination={false}
                  size="middle"
                />
              </div>
            </>
          ) : (
            renderEmpty(t('sellerDashboard.ageAnalytics.noBirthdayData', 'Chưa có dữ liệu ngày sinh'))
          )}
        </div>
      );
    }

    // Product list
    if (!productData || !productData.products?.length) {
      return renderEmpty(
        productData
          ? t('sellerDashboard.ageAnalytics.noProductData', 'Chưa có dữ liệu mua hàng theo sản phẩm')
          : t('sellerDashboard.ageAnalytics.noData', 'Không có dữ liệu')
      );
    }

    return (
      <div>
        <Table
          columns={productColumns}
          dataSource={productData.products}
          rowKey="productId"
          pagination={{ pageSize: 8, size: 'small' }}
          size="middle"
        />
      </div>
    );
  };

  return (
      <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={1000}
      title={null}
      closable={false}
      styles={{ body: { padding: 0 }, wrapper: { paddingTop: 0 } }}
    >
      {/* ── Custom Header ── */}
      <div style={{
        padding: '20px 24px 16px',
        borderBottom: '1px solid rgba(227,231,237,0.7)',
        position: 'relative',
      }}>
        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 16, right: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 32, height: 32, borderRadius: '50%',
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: '#94a3b8', transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
 e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#64748b'; 
}}
          onMouseLeave={(e) => {
 e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8'; 
}}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: "'wght' 300" }}>close</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
          {/* Gradient icon box */}
          <div style={{
            width: 44, height: 44, borderRadius: 10,
            background: 'linear-gradient(135deg, #1a56db, #6b8dd6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(26,86,219,0.3)',
            flexShrink: 0,
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 22, color: '#fff', fontVariationSettings: "'wght' 400" }}>group</span>
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#171c1f', lineHeight: 1.2, letterSpacing: '-0.01em' }}>
              {t('sellerDashboard.ageAnalytics.title', 'Phân tích độ tuổi khách hàng')}
            </h2>
            <p style={{ margin: 0, marginTop: 2, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>
                {t('sellerDashboard.ageAnalytics.subtitle', 'Phân tích nhân khẩu học khách hàng')}
              </span>
              <span style={{
                fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 99,
                background: '#dbe1ff', color: '#003fb1', letterSpacing: '0.03em',
              }}>
                {shopData?.periodLabel || productData?.periodLabel || t('sellerDashboard.ageAnalytics.last30Days', '30 Ngày')}
              </span>
            </p>
          </div>
        </div>

        {/* Controls */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: 10,
        }}>
          {/* Tab pills */}
          <div style={{
            display: 'flex', padding: '3px', background: '#f0f4f8',
            borderRadius: 8, gap: 2,
          }}>
            {[
              { key: 'overview', label: t('sellerDashboard.ageAnalytics.tabOverview', 'Tổng quan'), icon: 'pie_chart' },
              { key: 'byProduct', label: t('sellerDashboard.ageAnalytics.tabByProduct', 'Theo sản phẩm'), icon: 'inventory_2' },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => {
 setTab(item.key); setSelectedProduct(null); 
}}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: 600,
                  transition: 'all 0.15s',
                  background: tab === item.key ? '#fff' : 'transparent',
                  color: tab === item.key ? '#1e293b' : '#94a3b8',
                  boxShadow: tab === item.key ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14, fontVariationSettings: "'wght' 400" }}>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Period pills */}
            <div style={{
              display: 'flex', padding: '3px', background: '#f0f4f8',
              borderRadius: 8, gap: 2,
            }}>
              {getPeriodOptions(t).filter(o => o.value !== 'custom').slice(0, 4).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handlePeriodChange(opt.value)}
                  style={{
                    padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
                    fontSize: 11, fontWeight: 600,
                    transition: 'all 0.15s',
                    background: period === opt.value ? '#fff' : 'transparent',
                    color: period === opt.value ? '#1e293b' : '#94a3b8',
                    boxShadow: period === opt.value ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* RangePicker always rendered when custom period is active */}
            {period === 'custom' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <RangePicker
                  value={[
                    customDateRange ? dayjs(customDateRange.startDate) : null,
                    customDateRange ? dayjs(customDateRange.endDate) : null,
                  ]}
                  onChange={(dates) => {
                    if (dates && dates[0] && dates[1]) {
                      setCustomDateRange({
                        startDate: dates[0].format('YYYY-MM-DD'),
                        endDate: dates[1].format('YYYY-MM-DD'),
                      });
                    }
                  }}
                  disabledDate={(current) => current && current > dayjs().endOf('day')}
                  size="small"
                  style={{ width: 200 }}
                  placeholder={['Từ ngày', 'Đến ngày']}
                  getPopupContainer={(triggerNode) => triggerNode.parentNode}
                />
                {!customDateRange && (
                  <span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 500, whiteSpace: 'nowrap' }}>
                    Vui lòng chọn khoảng ngày
                  </span>
                )}
              </div>
            )}

            {/* Calendar button — only shown when NOT in custom mode */}
            {period !== 'custom' && (
              <button
                onClick={() => handlePeriodChange('custom')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  fontSize: 11, fontWeight: 500, background: '#f0f4f8', color: '#64748b',
                  transition: 'all 0.15s',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14, fontVariationSettings: "'wght' 400" }}>calendar_month</span>
                {t('sellerDashboard.ageAnalytics.selectDate', 'Tùy chỉnh')}
              </button>
            )}

            {/* Show selected range label */}
            {period === 'custom' && customDateRange && (
              <span style={{ fontSize: 11, color: '#3b82f6', fontWeight: 600, whiteSpace: 'nowrap' }}>
                {dayjs(customDateRange.startDate).format('MMM D')} - {dayjs(customDateRange.endDate).format('MMM D, YYYY')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ padding: '20px 24px 20px', maxHeight: 'calc(100vh - 260px)', overflowY: 'auto', paddingRight: 6 }}>
        {tab === 'overview' ? renderShopOverview() : renderProductAnalytics()}
      </div>
    </Modal>
  );
}

CustomerAgeAnalyticsModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
