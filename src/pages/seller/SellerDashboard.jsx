import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  AlertTriangle,
  ArrowRightLeft,
  Calendar,
  ChevronRight,
  DollarSign,
  PackageOpen,
  Percent,
  Repeat,
  ShoppingBag,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { Button, Card, DatePicker, Progress, Segmented, Spin, Table } from 'antd';
import dayjs from 'dayjs';
const { RangePicker } = DatePicker;

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';
import { formatCurrency } from '../../utils/formatters';
import { SELLER_ROUTES } from '../../constants/routes';
import dashboardService from '../../services/api/dashboardService';
import { chatService } from '../../services/api/chatService';
import { OverallSalesCard } from '../../components/seller/dashboard/OverallSalesCard';
import SellerBalanceSection from '../../components/seller/dashboard/SellerBalanceSection';
import { RevenueDetailModal } from '../../components/seller/dashboard/modals/RevenueDetailModal';
import { OrdersDetailModal } from '../../components/seller/dashboard/modals/OrdersDetailModal';
import { AOVDetailModal } from '../../components/seller/dashboard/modals/AOVDetailModal';
import { ProfitDetailModal } from '../../components/seller/dashboard/modals/ProfitDetailModal';
import { TopProfitProductsModal } from '../../components/seller/dashboard/modals/TopProfitProductsModal';
import { CustomerAgeAnalyticsModal } from '../../components/seller/dashboard/modals/CustomerAgeAnalyticsModal';
import styles from '../../assets/styles/seller/Dashboard.module.css';
import BannerHotspotWidget from '../../components/seller/dashboard/BannerHotspotWidget';

const EXPENSE_TYPE_TO_I18N = {
  'Goods Value (PO)': 'goodsValuePo',
  'Buying Service Fee': 'buyingServiceFee',
  'Intl Freight (CN→VN)': 'intlFreightCnVn',
  'Import Tax': 'importTax',
  'CN Domestic Shipping': 'cnDomesticShipping',
  'Packaging / Insurance': 'packagingInsurance',
  'VN Last-Mile (PO→Warehouse)': 'vnLastMilePoWarehouse',
  'Other Costs': 'otherCosts',
  'Last-Mile Delivery (Order)': 'lastMileDeliveryOrder',
};

const AGE_GROUP_COLORS = {
  'Under 18': '#8b5cf6',
  '18-24': '#3b82f6',
  '25-34': '#10b981',
  '35-44': '#f59e0b',
  '45-54': '#ef4444',
  '55-64': '#ec4899',
  '65+': '#6b7280',
  Unknown: '#d1d5db',
};

const getAgeColor = (label) => AGE_GROUP_COLORS[label] || '#94a3b8';

const formatAgeGroup = (label) => {
  const map = {
    'Under 18': '< 18',
    '18-24': '18-24',
    '25-34': '25-34',
    '35-44': '35-44',
    '45-54': '45-54',
    '55-64': '55-64',
    '65+': '65+',
    Unknown: 'Không rõ',
  };
  return map[label] || label;
};

const translateExpenseType = (type, t) => {
  const subKey = EXPENSE_TYPE_TO_I18N[type];
  if (!subKey) {
    return type;
  }
  return t(`sellerDashboard.expense.types.${subKey}`, type);
};

// ── Period helpers for ERP section filters ──
const getErpPeriodOptions = (t) => [
  { label: t('sellerDashboard.periodShort.7days', '7 Ngày'), value: '7days' },
  { label: t('sellerDashboard.periodShort.30days', '30 Ngày'), value: '30days' },
  { label: t('sellerDashboard.periodShort.90days', '90 Ngày'), value: '90days' },
  { label: t('sellerDashboard.periodShort.12months', '12 Tháng'), value: '12months' },
  { label: t('sellerDashboard.periodShort.yearly', 'Năm trước'), value: 'yearly' },
  { label: t('sellerDashboard.period.custom', 'Tùy chỉnh'), value: 'custom' },
];

const handleErpPeriodChange = (val, setter, customSetter, setPickerOpen) => {
  if (val === 'custom') {
    setter('custom');
    if (setPickerOpen) {
      setPickerOpen(true);
    }
  } else {
    setter(val);
    customSetter(null);
    if (setPickerOpen) {
      setPickerOpen(false);
    }
  }
};

const ACTION_ITEMS = (t) => [
  {
    key: 'pending',
    label: t('sellerDashboard.actionCenter.pending', 'Đơn chờ xác nhận'),
    sub: t('sellerDashboard.actionCenter.pendingSub', 'Cần xác nhận trước khi xử lý'),
    icon: ShoppingBag,
    color: '#1677ff',
    bg: '#eff6ff',
    nav: '/seller/orders?status=pending',
    countKey: 'pending',
  },
  {
    key: 'toShip',
    label: t('sellerDashboard.actionCenter.toShip', 'Chờ đóng gói / giao ĐVVC'),
    sub: t('sellerDashboard.actionCenter.toShipSub', 'Cần đóng gói và bàn giao'),
    icon: PackageOpen,
    color: '#fa8c16',
    bg: '#fff7e6',
    nav: '/seller/orders?status=processing',
    countKey: 'toShip',
  },
  {
    key: 'cancelOrReturn',
    label: t('sellerDashboard.actionCenter.cancelOrReturn', 'Yêu cầu hủy / hoàn trả'),
    sub: t('sellerDashboard.actionCenter.cancelOrReturnSub', 'Cần phản hồi trong 24h'),
    icon: Repeat,
    color: '#f5222d',
    bg: '#fff1f0',
    nav: '/seller/returns',
    countKey: 'cancelOrReturn',
  },
  {
    key: 'unreadMessages',
    label: t('sellerDashboard.actionCenter.unreadMessages', 'Tin nhắn chưa đọc'),
    sub: t('sellerDashboard.actionCenter.unreadMessagesSub', 'Phản hồi khách hàng'),
    icon: AlertTriangle,
    color: '#722ed1',
    bg: '#f9f0ff',
    nav: '/seller/messages',
    countKey: 'unreadMessages',
  },
];

const EXPENSE_COLORS = {
  'Goods Value (PO)': '#1677ff',
  'Buying Service Fee': '#52c41a',
  'Intl Freight (CN→VN)': '#fa8c16',
  'Import Tax': '#f5222d',
  'CN Domestic Shipping': '#722ed1',
  'Packaging / Insurance': '#13c2c2',
  'VN Last-Mile (PO→Warehouse)': '#faad14',
  'Other Costs': '#8c8c8c',
  'Last-Mile Delivery (Order)': '#eb2f96',
};

const CATEGORY_CHART_COLORS = [
  '#1677ff',
  '#52c41a',
  '#fa8c16',
  '#f5222d',
  '#722ed1',
  '#13c2c2',
  '#faad14',
  '#eb2f96',
];

const getCategoryPeriodLabels = (t) => ({
  '7days': t('sellerDashboard.period.7days', '7 ngày gần nhất'),
  '30days': t('sellerDashboard.period.30days', '30 ngày gần nhất'),
  '90days': t('sellerDashboard.period.90days', '90 ngày gần nhất'),
  '12months': t('sellerDashboard.period.12months', '12 tháng qua'),
  yearly: t('sellerDashboard.period.yearly', 'Năm trước'),
  custom: t('sellerDashboard.period.custom', 'Tùy chỉnh'),
});

// ─── Enhanced Expense Tooltip ─────────────────────────────────────────────────
const ExpenseTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) {
    return null;
  }
  return (
    <div
      style={{
        background: '#1e293b',
        border: '1px solid #334155',
        borderRadius: 8,
        padding: '10px 14px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        minWidth: 180,
      }}
    >
      <p style={{ margin: 0, fontWeight: 700, color: '#f8fafc', fontSize: 13, marginBottom: 6 }}>
        {payload[0].name}
      </p>
      {payload.map((entry, idx) => (
        <p key={idx} style={{ margin: 0, fontSize: 12, color: '#94a3b8', lineHeight: 1.9 }}>
          <span style={{ color: entry.payload.color, fontWeight: 600 }}>{entry.name}: </span>
          {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  );
};

// ─── Skeleton: Action Card ──────────────────────────────────────────────────
const SkeletonActionCard = () => (
  <div className={styles.skeletonActionCard}>
    <div className={`${styles.skeleton} ${styles.skeletonIcon}`} />
    <div className={styles.skeletonTextBlock}>
      <div
        className={`${styles.skeleton} ${styles.skeletonLine}`}
        style={{ width: '75%', height: 14 }}
      />
      <div
        className={`${styles.skeleton} ${styles.skeletonLine}`}
        style={{ width: '55%', height: 11 }}
      />
    </div>
  </div>
);

// ─── Skeleton: Stat Card ────────────────────────────────────────────────────
const SkeletonStatCard = () => (
  <div className={styles.skeletonCard}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div
        className={`${styles.skeleton} ${styles.skeletonIcon}`}
        style={{ width: 40, height: 40 }}
      />
    </div>
    <div
      className={`${styles.skeleton} ${styles.skeletonLine}`}
      style={{ width: '45%', height: 10, marginTop: 4 }}
    />
    <div className={`${styles.skeleton} ${styles.skeletonStatValue}`} />
    <div className={`${styles.skeleton} ${styles.skeletonStatTrend}`} />
  </div>
);

// ─── Action Card ─────────────────────────────────────────────────────────────
const ActionCard = ({ item, count, onClick }) => {
  const Icon = item.icon;

  return (
    <div
      className={styles.actionCard}
      style={{
        '--accent': item.color,
        '--bg': item.bg,
      }}
      onClick={onClick}
    >
      <div className={styles.actionCardIconWrap}>
        <Icon size={22} color={item.color} />
      </div>
      <div className={styles.actionCardContent}>
        <div className={styles.actionCardLabelRow}>
          <span className={styles.actionCardLabel}>{item.label}</span>
          {count > 0 && (
            <span className={styles.actionCountBadge}>{count > 99 ? '99+' : count}</span>
          )}
        </div>
        <span className={styles.actionCardSub}>{item.sub}</span>
      </div>
      <ChevronRight size={16} className={styles.actionArrow} />
    </div>
  );
};

ActionCard.propTypes = {
  item: PropTypes.shape({
    icon: PropTypes.any,
    color: PropTypes.string,
    bg: PropTypes.string,
    label: PropTypes.string,
    sub: PropTypes.string,
  }).isRequired,
  count: PropTypes.number,
  onClick: PropTypes.func,
};

// ─── Stat Card ──────────────────────────────────────────────────────────────
const StatCard = ({
  icon: IconComponent,
  label,
  value,
  trend,
  trendUp,
  fromLabel,
  cardColor,
  onClick,
}) => {
  const accentColor = cardColor || '#0d6efd';
  const bgColor = `${accentColor}14`;

  return (
    <div
      className={styles.statCard}
      style={{ '--accent': accentColor, '--bg': bgColor }}
      onClick={onClick}
    >
      <div className={styles.statHeader}>
        <div className={styles.statIconWrap}>
          <IconComponent size={20} color={accentColor} />
        </div>
      </div>
      <p className={styles.statLabel}>{label}</p>
      <p className={styles.statValue}>{value}</p>
      {trend && (
        <div className={styles.statTrend}>
          <span
            className={`${styles.statTrendPill} ${trendUp ? styles.statTrendPillUp : styles.statTrendPillDown}`}
          >
            {trendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {trend}
          </span>
          {fromLabel && <span className={styles.statTrendLabel}>{fromLabel}</span>}
        </div>
      )}
    </div>
  );
};

StatCard.propTypes = {
  icon: PropTypes.any,
  label: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  trend: PropTypes.string,
  trendUp: PropTypes.bool,
  fromLabel: PropTypes.string,
  cardColor: PropTypes.string,
  onClick: PropTypes.func,
};

// ─── Greeting Helper ────────────────────────────────────────────────────────
const getGreeting = (t) => {
  const hour = new Date().getHours();
  if (hour < 12) {
    return t('sellerDashboard.greeting.morning', 'Chào buổi sáng');
  }
  if (hour < 18) {
    return t('sellerDashboard.greeting.afternoon', 'Chào buổi chiều');
  }
  return t('sellerDashboard.greeting.evening', 'Chào buổi tối');
};

const getFormattedDate = () => {
  const lang = i18n.language;
  const localeMap = { vi: 'vi-VN', en: 'en-US' };
  const locale = localeMap[lang] || 'vi-VN';
  const options =
    lang === 'vi'
      ? { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
      : { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
  return new Date().toLocaleDateString(locale, options);
};

// ─── Main Component ─────────────────────────────────────────────────────────
const SellerDashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // ── Loading states ──
  const [loading, setLoading] = useState(true);
  const [trendLoading, setTrendLoading] = useState(false);
  const [expenseLoading, setExpenseLoading] = useState(true);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [ageAnalyticsLoading, setAgeAnalyticsLoading] = useState(true);

  // ── Period selectors ──
  const [trendPeriod, setTrendPeriod] = useState('30days');
  const [expensePeriod, setExpensePeriod] = useState('12months');
  const [categoryPeriod, setCategoryPeriod] = useState('12months');
  const [agePeriod, setAgePeriod] = useState('12months');
  const [customDateRange, setCustomDateRange] = useState(null); // { startDate, endDate }
  const [expenseCustomRange, setExpenseCustomRange] = useState(null);
  const [categoryCustomRange, setCategoryCustomRange] = useState(null);
  const [ageCustomRange, setAgeCustomRange] = useState(null);
  const [expensePickerOpen, setExpensePickerOpen] = useState(false);
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);
  const [agePickerOpen, setAgePickerOpen] = useState(false);

  // ── External data ──
  const [exchangeRate, setExchangeRate] = useState(null);

  // ── Action center ──
  const [todoCounts, setTodoCounts] = useState({});

  // ── Financial & KPI ──
  const [financial, setFinancial] = useState({
    netSales: null,
    profit: null,
    totalOrders: null,
    cogs: null,
  });

  // ── Revenue trend & comparison ──
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [comparison, setComparison] = useState(null);

  // ── Product analytics ──
  const [lowStock, setLowStock] = useState([]);
  const [expense, setExpense] = useState(null);
  const [topProfitProducts, setTopProfitProducts] = useState([]);
  const [categoryAnalytics, setCategoryAnalytics] = useState(null);
  const [ageAnalytics, setAgeAnalytics] = useState(null);

  // ── Detail modals ──
  const [revenueModalOpen, setRevenueModalOpen] = useState(false);
  const [ordersModalOpen, setOrdersModalOpen] = useState(false);
  const [aovModalOpen, setAOVModalOpen] = useState(false);
  const [profitModalOpen, setProfitModalOpen] = useState(false);
  const [topProfitProductsModalOpen, setTopProfitProductsModalOpen] = useState(false);
  const [ageAnalyticsModalOpen, setAgeAnalyticsModalOpen] = useState(false);

  // ── Fetch tỷ giá CNY/VND ──
  useEffect(() => {
    let mounted = true;

    const fetchExchangeRate = async () => {
      try {
        const resp = await fetch('https://open.er-api.com/v6/latest/CNY');
        const json = await resp.json();
        const rate = json?.rates?.VND;
        if (!mounted) {
          return;
        }
        if (typeof rate === 'number') {
          setExchangeRate({
            cnyToVnd: rate,
            updatedAt: new Date(),
          });
        } else {
          setExchangeRate(null);
        }
      } catch {
        if (mounted) {
          setExchangeRate(null);
        }
      }
    };

    fetchExchangeRate();
    return () => {
      mounted = false;
    };
  }, []);

  // ── Fetch KPI & action center data ──
  useEffect(() => {
    let mounted = true;

    const fetchAll = async () => {
      setLoading(true);
      try {
        const [
          orderCountsRes,
          unreadNotifRes,
          lowStockRes,
          profitLossRes,
          topProfitRes,
          revenueRes,
        ] = await Promise.all([
          dashboardService.getSellerOrderCounts(),
          chatService.getUnreadCount(),
          dashboardService.getLowStock({ threshold: 20, limit: 6 }),
          dashboardService.getProfitLossAnalysis({ period: '12months' }),
          dashboardService.getTopSellingProductsWithProfit({ limit: 5, period: '12months' }),
          dashboardService.getRevenue(),
        ]);

        if (!mounted) {
          return;
        }

        const counts = orderCountsRes?.data ?? {};
        const rmaCount = typeof counts.rmaCount === 'number' ? counts.rmaCount : 0;
        const cancellationCount =
          typeof counts.cancellationCount === 'number' ? counts.cancellationCount : 0;

        const unread =
          typeof unreadNotifRes?.count === 'number'
            ? unreadNotifRes.count
            : typeof unreadNotifRes?.data?.count === 'number'
              ? unreadNotifRes.data.count
              : null;

        const revenueData = revenueRes?.data ?? {};

        setTodoCounts({
          pending: typeof counts.pending === 'number' ? counts.pending : null,
          toShip: typeof counts.toShip === 'number' ? counts.toShip : null,
          cancelOrReturn: rmaCount + cancellationCount,
          unreadMessages: unread,
        });

        setLowStock(Array.isArray(lowStockRes?.data) ? lowStockRes.data : []);

        const plArr = Array.isArray(profitLossRes?.data) ? profitLossRes.data : [];
        const netSales = plArr.reduce((sum, it) => sum + (it?.revenue || 0), 0);
        const profit = plArr.reduce((sum, it) => sum + (it?.profit || 0), 0);
        const expenseCost = plArr.reduce((sum, it) => sum + (it?.cost || 0), 0);

        setFinancial({
          netSales: netSales || revenueData.thisMonth || null,
          profit,
          totalOrders: typeof counts.pending === 'number' ? counts.pending : null,
          cogs: expenseCost,
        });

        const topArr = Array.isArray(topProfitRes?.data) ? topProfitRes.data : [];
        setTopProfitProducts(
          topArr.map((p) => ({
            key: p?._id,
            productName: p?.name ?? '—',
            soldQty: p?.totalQuantity ?? p?.quantitySold ?? 0,
            netSales: p?.totalRevenue ?? p?.revenue ?? 0,
            profit: p?.profit ?? 0,
            margin: typeof p?.profitMargin === 'number' ? `${p.profitMargin.toFixed(1)}%` : '—',
          }))
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchAll();
    return () => {
      mounted = false;
    };
  }, []);

  // ── Fetch revenue trend & comparison ──
  useEffect(() => {
    let cancelled = false;

    const fetchTrendData = async () => {
      setTrendLoading(true);
      try {
        const [trendRes, comparisonRes] = await Promise.all([
          dashboardService.getRevenueTrend({ period: trendPeriod, ...customDateRange }),
          dashboardService.getComparison({ period: trendPeriod, ...customDateRange }),
        ]);

        if (cancelled) {
          return;
        }

        setRevenueTrend(Array.isArray(trendRes?.data) ? trendRes.data : []);
        setComparison(comparisonRes?.data ?? null);
      } catch {
        if (!cancelled) {
          setRevenueTrend([]);
          setComparison(null);
        }
      } finally {
        if (!cancelled) {
          setTrendLoading(false);
        }
      }
    };

    fetchTrendData();
    return () => {
      cancelled = true;
    };
  }, [trendPeriod, customDateRange]);

  // ── Refetch expense when period changes ──
  useEffect(() => {
    let cancelled = false;
    setExpenseLoading(true);
    const params = expenseCustomRange
      ? {
          period: 'custom',
          startDate: expenseCustomRange.startDate,
          endDate: expenseCustomRange.endDate,
        }
      : {
          period:
            expensePeriod === 'months12'
              ? '12months'
              : expensePeriod === 'days90'
                ? '90days'
                : expensePeriod,
        };
    dashboardService
      .getExpenseAnalysis(params)
      .then((res) => {
        if (cancelled) {
          return;
        }
        const payload = res?.data;
        setExpense(
          payload && typeof payload === 'object' && !Array.isArray(payload) ? payload : null
        );
      })
      .finally(() => {
        if (!cancelled) {
          setExpenseLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [expensePeriod, expenseCustomRange]);

  // ── Refetch category analytics when period changes ──
  useEffect(() => {
    let cancelled = false;
    setCategoryLoading(true);
    const params = categoryCustomRange
      ? {
          period: 'custom',
          startDate: categoryCustomRange.startDate,
          endDate: categoryCustomRange.endDate,
        }
      : {
          period:
            categoryPeriod === 'months12'
              ? '12months'
              : categoryPeriod === 'days90'
                ? '90days'
                : categoryPeriod,
        };
    dashboardService
      .getProductAnalyticsByCategory(params)
      .then((res) => {
        if (cancelled) {
          return;
        }
        const payload = res?.data;
        setCategoryAnalytics(
          payload && typeof payload === 'object' && !Array.isArray(payload) ? payload : null
        );
      })
      .finally(() => {
        if (!cancelled) {
          setCategoryLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [categoryPeriod, categoryCustomRange]);

  // ── Fetch age analytics ──
  useEffect(() => {
    let cancelled = false;
    setAgeAnalyticsLoading(true);
    const params = ageCustomRange
      ? { period: 'custom', startDate: ageCustomRange.startDate, endDate: ageCustomRange.endDate }
      : {
          period:
            agePeriod === 'months12' ? '12months' : agePeriod === 'days90' ? '90days' : agePeriod,
        };
    dashboardService
      .getCustomerAgeAnalytics(params)
      .then((res) => {
        if (cancelled) {
          return;
        }
        setAgeAnalytics(res?.data || null);
      })
      .catch(() => {
        if (!cancelled) {
          setAgeAnalytics(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setAgeAnalyticsLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [agePeriod, ageCustomRange]);

  // ── Derived: revenue trend KPI ──
  const trendRevenue = useMemo(() => {
    if (!revenueTrend.length) {
      return 0;
    }
    return revenueTrend.reduce((sum, it) => sum + (it?.revenue || 0), 0);
  }, [revenueTrend]);

  const trendGrowth = useMemo(() => {
    const v = comparison?.growth?.revenue;
    return typeof v === 'number' && !Number.isNaN(v) ? v : 0;
  }, [comparison]);

  const periodFromLabel = useMemo(() => {
    if (customDateRange) {
      const fmt = i18n.language?.startsWith('en') ? 'MM/DD/YYYY' : 'DD/MM/YYYY';
      const sd = dayjs(customDateRange.startDate).format(fmt);
      const ed = dayjs(customDateRange.endDate).format(fmt);
      return t('sellerDashboard.periodCompare.custom', '{{start}} → {{end}}', {
        start: sd,
        end: ed,
      });
    }
    const map = {
      '7days': t('sellerDashboard.periodCompare.7days', 'so với 7 ngày trước'),
      '30days': t('sellerDashboard.periodCompare.30days', 'so với 30 ngày trước'),
      '90days': t('sellerDashboard.periodCompare.90days', 'so với 90 ngày trước'),
      '12months': t('sellerDashboard.periodCompare.12months', 'so với 12 tháng trước'),
      yearly: t('sellerDashboard.periodCompare.yearly', 'so với năm trước'),
    };
    return map[trendPeriod] ?? t('sellerDashboard.stats.vsPeriod', 'so với kỳ trước');
  }, [trendPeriod, customDateRange, t]);

  // ── Derived: expense pie ──
  const expensePieSlices = useMemo(() => {
    if (!Array.isArray(expense?.breakdownByType)) {
      return [];
    }
    return expense.breakdownByType.map((x) => ({
      name: translateExpenseType(x.type, t),
      value: Number(x.amount) || 0,
      type: x.type,
      color: EXPENSE_COLORS[x.type] ?? '#d9d9d9',
    }));
  }, [expense, t]);

  // ── Derived: comparison KPIs ──
  const comparisonKpis = useMemo(() => {
    if (!comparison) {
      return { ordersGrowth: 0, avgOrderValue: null, aovGrowth: 0, profitGrowth: 0 };
    }

    const current = comparison.currentPeriod ?? {};
    const prev = comparison.previousPeriod ?? {};
    const growth = comparison.growth ?? {};

    const ordersGrowth =
      typeof growth.orders === 'number' && !Number.isNaN(growth.orders) ? growth.orders : 0;
    const avgOrderValue =
      current.orders > 0 ? Math.round((current.revenue || 0) / current.orders) : null;

    const currAov = current.orders > 0 ? (current.revenue || 0) / current.orders : null;
    const prevAov = prev.orders > 0 ? (prev.revenue || 0) / prev.orders : null;
    let aovGrowth = 0;
    if (prevAov != null && prevAov > 0 && currAov != null) {
      aovGrowth = Math.round(((currAov - prevAov) / prevAov) * 100);
    } else if (
      (prev.orders ?? 0) <= 0 &&
      (current.orders ?? 0) > 0 &&
      currAov != null &&
      currAov > 0
    ) {
      aovGrowth = 100;
    }

    const profitGrowth =
      typeof growth.profit === 'number' && !Number.isNaN(growth.profit) ? growth.profit : 0;

    return { ordersGrowth, avgOrderValue, aovGrowth, profitGrowth };
  }, [comparison]);

  const chartPeriodRevenue = useMemo(() => {
    if (comparison?.currentPeriod && typeof comparison.currentPeriod.revenue === 'number') {
      return comparison.currentPeriod.revenue;
    }
    if (trendRevenue > 0) {
      return trendRevenue;
    }
    if (typeof financial.netSales === 'number') {
      return financial.netSales;
    }
    return 0;
  }, [comparison, trendRevenue, financial.netSales]);

  // ── Active tasks count ──
  const activeTasksCount = useMemo(
    () => Object.values(todoCounts).filter((v) => typeof v === 'number' && v > 0).length,
    [todoCounts]
  );

  // ── Action items with i18n ──
  const actionItems = useMemo(() => ACTION_ITEMS(t), [t]);

  // ── Category period labels with i18n ──
  const categoryPeriodLabels = useMemo(() => getCategoryPeriodLabels(t), [t]);

  const numberLocale = i18n.language?.startsWith('en') ? 'en-US' : 'vi-VN';

  // ─── Top profit products columns ──
  const topProfitColumns = useMemo(
    () => [
      {
        title: t('sellerDashboard.topProducts.product', 'Sản phẩm'),
        dataIndex: 'productName',
        key: 'productName',
        render: (text) => <span className={styles.productNameCell}>{text}</span>,
      },
      {
        title: t('sellerDashboard.topProducts.sold', 'Đã bán'),
        dataIndex: 'soldQty',
        key: 'soldQty',
        width: 90,
        render: (v) => Number(v).toLocaleString(numberLocale),
      },
      {
        title: t('sellerDashboard.topProducts.revenue', 'Doanh thu'),
        dataIndex: 'netSales',
        key: 'netSales',
        render: (value) => formatCurrency(value),
        width: 140,
      },
      {
        title: t('sellerDashboard.topProducts.profit', 'Lợi nhuận'),
        dataIndex: 'profit',
        key: 'profit',
        render: (value) => {
          const num = Number(value) || 0;
          return (
            <span
              className={`${styles.profitCell} ${num >= 0 ? styles.profitPositive : styles.profitNegative}`}
            >
              {formatCurrency(value)}
            </span>
          );
        },
        width: 140,
      },
      {
        title: t('sellerDashboard.topProducts.margin', 'Margin'),
        dataIndex: 'margin',
        key: 'margin',
        width: 80,
        render: (v) => <span className={styles.marginCell}>{v}</span>,
      },
    ],
    [t, numberLocale]
  );

  // ─── Expense legend items ──
  const renderExpenseLegend = () => (
    <div className={styles.pieLegend}>
      {expensePieSlices.map((s) => (
        <div key={s.type} className={styles.pieLegendItem} style={{ background: `${s.color}14` }}>
          <span className={styles.pieLegendDot} style={{ background: s.color }} />
          <span style={{ color: '#334155' }}>{s.name}:</span>
          <strong style={{ color: s.color }}>{formatCurrency(s.value)}</strong>
        </div>
      ))}
    </div>
  );

  // ── Derived: category chart data (pie slices + stable keys for a11y) ──
  const categoryChartData = useMemo(() => {
    if (!Array.isArray(categoryAnalytics?.categories)) {
      return [];
    }
    return categoryAnalytics.categories.map((cat, idx) => ({
      rowKey: cat._id != null ? String(cat._id) : `cat-${idx}`,
      categoryName:
        cat.categoryName || t('sellerDashboard.lowStock.uncategorized', 'Không phân loại'),
      totalRevenue: Number(cat.totalRevenue) || 0,
      revenuePercent: typeof cat.revenuePercent === 'number' ? cat.revenuePercent : 0,
      color: CATEGORY_CHART_COLORS[idx % CATEGORY_CHART_COLORS.length],
    }));
  }, [categoryAnalytics, t]);

  const renderCategoryLegend = () => (
    <div className={styles.categoryLegendGrid}>
      {categoryChartData.map((s) => (
        <div
          key={s.rowKey}
          className={styles.categoryLegendItem}
          style={{ borderColor: `${s.color}30` }}
          title={t(
            'sellerDashboard.category.legendTooltip',
            '{{name}} — {{percent}}% period revenue',
            { name: s.categoryName, percent: s.revenuePercent }
          )}
        >
          <span className={styles.categoryLegendDot} style={{ background: s.color }} />
          <div className={styles.categoryLegendContent}>
            <span className={styles.categoryLegendName}>{s.categoryName}</span>
            <span className={styles.categoryLegendRevenue}>{formatCurrency(s.totalRevenue)}</span>
          </div>
          <span
            className={styles.categoryLegendPercent}
            style={{ background: `${s.color}18`, color: s.color }}
          >
            {s.revenuePercent}%
          </span>
        </div>
      ))}
    </div>
  );

  return (
    <div className={styles.container}>
      <div className={styles.pageContent}>
        {/* ── Header ── */}
        <Card className={styles.headerCard} styles={{ body: { padding: '14px 20px' } }}>
          <div className={styles.headerInner}>
            <div className={styles.headerLeft}>
              <span className={styles.headerGreeting}>{getGreeting(t)}</span>
              <h1 className={styles.headerTitle}>{t('sellerDashboard.title', 'Dashboard')}</h1>
            </div>
            <div className={styles.headerRight}>
              {exchangeRate && (
                <div className={styles.xrBanner}>
                  <div className={styles.xrBannerIcon}>
                    <ArrowRightLeft size={16} color="#d97706" />
                  </div>
                  <div className={styles.xrBannerInfo}>
                    <span className={styles.xrBannerLabel}>
                      {t('sellerDashboard.exchangeRate.label', 'Tỷ giá CNY / VND')}
                    </span>
                    <span className={styles.xrBannerRate}>
                      <strong>
                        1 CNY = {Math.round(exchangeRate.cnyToVnd).toLocaleString(numberLocale)}
                      </strong>{' '}
                      {t('sellerDashboard.exchangeRate.vndUnit', 'VND')}
                    </span>
                    <span className={styles.xrBannerUpdated}>
                      {t('sellerDashboard.exchangeRate.updated', 'Cập nhật: {{time}}', {
                        time: (exchangeRate.updatedAt instanceof Date
                          ? exchangeRate.updatedAt
                          : new Date()
                        ).toLocaleTimeString(numberLocale, { hour: '2-digit', minute: '2-digit' }),
                      })}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* ── 1) Action Center ── */}
        <Card className={styles.sectionCard} styles={{ body: { padding: 0 } }}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleRow}>
              <AlertTriangle size={16} color="#fa8c16" />
              <span className={styles.sectionTitle}>
                {t('sellerDashboard.actionCenter.title', 'Việc cần làm hôm nay')}
              </span>
              {activeTasksCount > 0 && (
                <span className={styles.sectionBadge}>{activeTasksCount}</span>
              )}
            </div>
            <span className={styles.sectionMeta}>{getFormattedDate()}</span>
          </div>
          <div className={styles.sectionBody}>
            {loading ? (
              <div className={styles.actionCardsGrid}>
                {[0, 1, 2, 3].map((i) => (
                  <SkeletonActionCard key={i} />
                ))}
              </div>
            ) : (
              <div className={styles.actionCardsGrid}>
                {actionItems.map((item) => (
                  <ActionCard
                    key={item.key}
                    item={item}
                    count={todoCounts[item.countKey] ?? 0}
                    onClick={() => navigate(item.nav)}
                  />
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* ── Balance Section ── */}
        <SellerBalanceSection />
        {/* ── 1.5) Banner Hotspot Ads Widget ── */}
        <BannerHotspotWidget />

        {/* ── 2) Revenue Trend Chart + Comparison KPIs ── */}
        <div className={styles.chartAndStats}>
          {/* Left: Line Chart */}
          <OverallSalesCard
            chartData={revenueTrend}
            period={trendPeriod}
            onPeriodChange={(p) => {
              setTrendPeriod(p);
              setCustomDateRange(null);
            }}
            customDateRange={customDateRange}
            onCustomDateRangeChange={(range) => {
              if (range) {
                setTrendPeriod('30days');
                setCustomDateRange({
                  startDate: range[0].format('YYYY-MM-DD'),
                  endDate: range[1].format('YYYY-MM-DD'),
                });
              } else {
                setCustomDateRange(null);
              }
            }}
            loading={trendLoading}
            revenueCurrent={trendRevenue}
            trend={trendGrowth}
          />

          {/* Right: 4 Stat Cards */}
          {loading ? (
            <div className={styles.statCardsGrid}>
              {[0, 1, 2, 3].map((i) => (
                <SkeletonStatCard key={i} />
              ))}
            </div>
          ) : (
            <div className={styles.statCardsGrid}>
              <StatCard
                icon={TrendingUp}
                label={t('sellerDashboard.stats.revenue', 'Doanh thu kỳ này')}
                value={formatCurrency(chartPeriodRevenue)}
                trend={`${trendGrowth >= 0 ? '+' : ''}${trendGrowth}%`}
                trendUp={trendGrowth >= 0}
                fromLabel={periodFromLabel}
                cardColor="#1677ff"
                onClick={() => setRevenueModalOpen(true)}
              />
              <StatCard
                icon={ShoppingCart}
                label={t('sellerDashboard.stats.orders', 'Đơn hàng kỳ này')}
                value={
                  comparison?.currentPeriod?.orders != null
                    ? Number(comparison.currentPeriod.orders).toLocaleString(numberLocale)
                    : '—'
                }
                trend={`${comparisonKpis.ordersGrowth >= 0 ? '+' : ''}${comparisonKpis.ordersGrowth}%`}
                trendUp={comparisonKpis.ordersGrowth >= 0}
                fromLabel={periodFromLabel}
                cardColor="#722ed1"
                onClick={() => setOrdersModalOpen(true)}
              />
              <StatCard
                icon={DollarSign}
                label={t('sellerDashboard.stats.aov', 'Giá trị TB / đơn')}
                value={
                  comparisonKpis.avgOrderValue != null
                    ? formatCurrency(comparisonKpis.avgOrderValue)
                    : '—'
                }
                trend={`${comparisonKpis.aovGrowth >= 0 ? '+' : ''}${comparisonKpis.aovGrowth}%`}
                trendUp={comparisonKpis.aovGrowth >= 0}
                fromLabel={periodFromLabel}
                cardColor="#fa8c16"
                onClick={() => setAOVModalOpen(true)}
              />
              <StatCard
                icon={Percent}
                label={t('sellerDashboard.stats.profit', 'Tổng lợi nhuận')}
                value={
                  comparison?.currentPeriod && typeof comparison.currentPeriod.profit === 'number'
                    ? formatCurrency(comparison.currentPeriod.profit)
                    : financial.profit != null
                      ? formatCurrency(financial.profit)
                      : '—'
                }
                trend={`${comparisonKpis.profitGrowth >= 0 ? '+' : ''}${comparisonKpis.profitGrowth}%`}
                trendUp={comparisonKpis.profitGrowth >= 0}
                fromLabel={periodFromLabel}
                cardColor="#52c41a"
                onClick={() => setProfitModalOpen(true)}
              />
            </div>
          )}
        </div>

        {/* ── 3) Low Stock Alerts ── */}
        <Card className={styles.sectionCard} styles={{ body: { padding: 0 } }}>
          <div className={`${styles.sectionHeader} ${styles.lowStockSectionHeader}`}>
            <div className={styles.sectionTitleRow}>
              <AlertTriangle size={16} color="#fa8c16" />
              <span className={styles.sectionTitle}>
                {t('sellerDashboard.lowStock.title', 'Cảnh báo sắp hết hàng')}
              </span>
              {lowStock.length > 0 && (
                <span className={styles.sectionBadge}>{lowStock.length}</span>
              )}
            </div>
            <Button
              type="primary"
              className={styles.poCreateHeaderBtn}
              onClick={() => {
                if (lowStock.length > 0) {
                  navigate(
                    `/seller/erp/purchase-orders/create?products=${encodeURIComponent(JSON.stringify(lowStock))}`
                  );
                } else {
                  navigate('/seller/erp/purchase-orders/create');
                }
              }}
            >
              {t('sellerDashboard.lowStock.createPO', 'Tạo PO mới')}
            </Button>
          </div>
          <div className={styles.sectionBody}>
            {loading ? (
              <div className={styles.lowStockGrid}>
                {[0, 1, 2].map((i) => (
                  <div key={i} className={`${styles.skeletonCard} ${styles.lowStockCard}`}>
                    <div
                      className={`${styles.skeleton}`}
                      style={{ width: 20, height: 20, borderRadius: '50%' }}
                    />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div
                        className={`${styles.skeleton} ${styles.skeletonLine}`}
                        style={{ width: '60%', height: 13 }}
                      />
                      <div
                        className={`${styles.skeleton} ${styles.skeletonLine}`}
                        style={{ width: '40%', height: 10 }}
                      />
                      <div
                        className={`${styles.skeleton}`}
                        style={{ height: 6, borderRadius: 3, marginTop: 4 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : lowStock.length > 0 ? (
              <div className={styles.lowStockGrid}>
                {lowStock.map((p) => {
                  const safetyStock = 20;
                  const currentStock = p?.stock ?? 0;
                  const stockPercent = Math.min(
                    100,
                    Math.round((currentStock / safetyStock) * 100)
                  );
                  const sku = p?.lowestStockModel?.sku ?? p?._id;
                  const isCritical = currentStock <= 5;

                  return (
                    <div
                      key={p?._id}
                      className={`${styles.lowStockCard} ${isCritical ? styles.lowStockCritical : styles.lowStockWarning}`}
                      onClick={() => navigate('/seller/inventory')}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className={styles.lowStockIcon}>
                        <AlertTriangle size={16} color={isCritical ? '#cf1322' : '#d46b08'} />
                      </div>
                      <div className={styles.lowStockContent}>
                        <div className={styles.lowStockNameRow}>
                          <span className={styles.lowStockName}>{p?.name ?? '—'}</span>
                          {isCritical && (
                            <span className={styles.lowStockCriticalTag}>
                              {t('sellerDashboard.lowStock.danger', 'Nguy hiểm')}
                            </span>
                          )}
                        </div>
                        <div className={styles.lowStockSku}>SKU: {sku ?? '—'}</div>
                        <Progress
                          className={styles.lowStockProgress}
                          percent={stockPercent}
                          strokeColor={isCritical ? '#ff4d4f' : '#fa8c16'}
                          showInfo={false}
                          size="small"
                        />
                        <div className={styles.lowStockFooter}>
                          <span className={styles.lowStockStock}>
                            {t(
                              'sellerDashboard.lowStock.stockLeft',
                              '{{current}} / {{safety}} sản phẩm',
                              { current: currentStock, safety: safetyStock }
                            )}
                          </span>
                          <Button
                            type="primary"
                            size="small"
                            className={styles.lowStockBtn}
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(
                                `/seller/erp/purchase-orders/create?products=${encodeURIComponent(JSON.stringify(p))}`
                              );
                            }}
                          >
                            {t('sellerDashboard.lowStock.createPOBtn', 'Lên PO')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="1.5"
                >
                  <path
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <p>
                  {t(
                    'sellerDashboard.lowStock.allStockOk',
                    'Tất cả sản phẩm đều có đủ hàng trong kho'
                  )}
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* ── 4) ERP Report ── */}
        <div className={styles.erpReportGrid}>
          {/* Left: Cost Breakdown Pie */}
          <Card className={styles.erpSectionCard} styles={{ body: { padding: 0 } }}>
            <div className={styles.erpSectionHeader}>
              <div className={styles.erpSectionTitleRow}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#fa8c16"
                  strokeWidth="2"
                >
                  <path
                    d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M20.488 15H12a9 9 9 0 010 18h8.488a9 9 9 0 000-18z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className={styles.erpSectionTitle}>
                  {t('sellerDashboard.expense.title', 'Phân tích chi phí')}
                </span>
                {expense?.period && (
                  <span className={styles.erpSectionSub}>— {expense.period}</span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Segmented
                  size="small"
                  value={expensePeriod}
                  onChange={(val) =>
                    handleErpPeriodChange(
                      val,
                      setExpensePeriod,
                      setExpenseCustomRange,
                      setExpensePickerOpen
                    )
                  }
                  options={getErpPeriodOptions(t)}
                />
                {expensePeriod === 'custom' && (
                  <>
                    <RangePicker
                      open={expensePickerOpen}
                      value={[
                        expenseCustomRange ? dayjs(expenseCustomRange.startDate) : null,
                        expenseCustomRange ? dayjs(expenseCustomRange.endDate) : null,
                      ]}
                      onChange={(dates) => {
                        if (dates && dates[0] && dates[1]) {
                          setExpenseCustomRange({
                            startDate: dates[0].format('YYYY-MM-DD'),
                            endDate: dates[1].format('YYYY-MM-DD'),
                          });
                        }
                        setExpensePickerOpen(false);
                      }}
                      onOpenChange={setExpensePickerOpen}
                      disabledDate={(current) => current && current > dayjs().endOf('day')}
                      size="small"
                      style={{
                        width: 0,
                        padding: 0,
                        opacity: 0,
                        position: 'absolute',
                        pointerEvents: 'none',
                      }}
                    />
                    <button
                      onClick={() => setExpensePickerOpen(true)}
                      className={styles.periodBtn}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <Calendar size={13} />
                      {expenseCustomRange
                        ? `${dayjs(expenseCustomRange.startDate).format('DD/MM/YYYY')} – ${dayjs(expenseCustomRange.endDate).format('DD/MM/YYYY')}`
                        : t('sellerDashboard.period.custom', 'Tùy chỉnh')}
                    </button>
                  </>
                )}
              </div>
            </div>
            <div className={styles.erpSectionBody}>
              {/* KPI Strip */}
              {expensePieSlices.length > 0 && (
                <div className={styles.expenseKpiStrip}>
                  <div
                    className={styles.expenseKpiCard}
                    style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}
                  >
                    <div className={styles.expenseKpiLabel}>
                      {t('sellerDashboard.expense.kpi.total', 'Tổng chi phí')}
                    </div>
                    <div className={styles.expenseKpiValue} style={{ color: '#1d4ed8' }}>
                      {(() => {
                        const total = expensePieSlices.reduce((s, x) => s + x.value, 0);
                        return formatCurrency(total);
                      })()}
                    </div>
                    <div className={styles.expenseKpiMeta}>
                      {expense?.poDetail?.poCount ?? 0}{' '}
                      {t('sellerDashboard.expense.kpi.poCount', 'PO đã hoàn thành')}
                    </div>
                  </div>
                  {expensePieSlices.slice(0, 1).map((s) => (
                    <div
                      key={s.type}
                      className={styles.expenseKpiCard}
                      style={{ background: `${s.color}14`, border: `1px solid ${s.color}30` }}
                    >
                      <div className={styles.expenseKpiLabel}>
                        {t('sellerDashboard.expense.kpi.largest', 'Chi phí lớn nhất')}
                      </div>
                      <div className={styles.expenseKpiValue} style={{ color: s.color }}>
                        {formatCurrency(s.value)}
                      </div>
                      <div className={styles.expenseKpiMeta} style={{ color: s.color }}>
                        {s.name}
                      </div>
                    </div>
                  ))}
                  {(() => {
                    const total = expensePieSlices.reduce((s, x) => s + x.value, 0);
                    const top = expensePieSlices[0];
                    if (!top || total === 0) {
                      return null;
                    }
                    return (
                      <div
                        className={styles.expenseKpiCard}
                        style={{ background: '#fefce8', border: '1px solid #fef08a' }}
                      >
                        <div className={styles.expenseKpiLabel}>
                          {t('sellerDashboard.expense.kpi.topShare', 'Tỷ trọng cao nhất')}
                        </div>
                        <div className={styles.expenseKpiValue} style={{ color: '#b45309' }}>
                          {total > 0 ? ((top.value / total) * 100).toFixed(1) : 0}%
                        </div>
                        <div className={styles.expenseKpiMeta} style={{ color: '#b45309' }}>
                          {top.name}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
              {/* Donut Chart */}
              <div className={styles.expenseChartContainer}>
                {loading || expenseLoading ? (
                  <div className={styles.loadingCenter}>
                    <Spin />
                  </div>
                ) : expensePieSlices.length > 0 ? (
                  <div className={styles.expenseDonutWrapper}>
                    <div className={styles.expenseDonutCenter}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={expensePieSlices}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={65}
                            outerRadius={105}
                            paddingAngle={2}
                          >
                            {expensePieSlices.map((entry) => (
                              <Cell key={entry.type} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip content={<ExpenseTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className={styles.expenseDonutLabel}>
                        <div className={styles.expenseDonutLabelSub}>Tổng chi phí</div>
                        <div className={styles.expenseDonutLabelTotal}>
                          {formatCurrency(expensePieSlices.reduce((s, x) => s + x.value, 0))}
                        </div>
                      </div>
                    </div>
                    {renderExpenseLegend()}
                  </div>
                ) : (
                  <div className={styles.emptyState}>
                    <p>{t('sellerDashboard.expense.noData', 'Không có dữ liệu chi phí')}</p>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Right: Top Profitable Products */}
          <Card className={styles.erpSectionCard} styles={{ body: { padding: 0 } }}>
            <div className={styles.erpSectionHeader}>
              <div className={styles.erpSectionTitleRow}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#52c41a"
                  strokeWidth="2"
                >
                  <path
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className={styles.erpSectionTitle}>
                  {t('sellerDashboard.topProducts.title', 'Top sản phẩm lợi nhuận cao')}
                </span>
              </div>
              <Button
                type="link"
                onClick={() => setTopProfitProductsModalOpen(true)}
                style={{ padding: 0, height: 'auto', fontSize: '0.8125rem' }}
              >
                {t('sellerDashboard.topProducts.viewAll', 'Xem tất cả')}
              </Button>
            </div>
            <div className={styles.erpSectionBody}>
              <Table
                columns={topProfitColumns}
                dataSource={topProfitProducts}
                pagination={false}
                size="middle"
                loading={loading}
                scroll={{ x: 560 }}
              />
            </div>
          </Card>
        </div>

        {/* ── 5) Product Analytics by Category (aligned with Phân tích chi phí) ── */}
        <div className={styles.erpCategoryBlock}>
          <Card className={styles.erpSectionCard} styles={{ body: { padding: 0 } }}>
            <div className={styles.erpSectionHeader}>
              <div className={styles.erpSectionTitleRow}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#52c41a"
                  strokeWidth="2"
                >
                  <path
                    d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M20.488 15H12a9 9 9 0 010 18h8.488a9 9 9 0 000-18z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className={styles.erpSectionTitle}>
                  {t('sellerDashboard.category.title', 'Phân tích sản phẩm theo danh mục')}
                </span>
                <span className={styles.erpSectionSub}>
                  — {categoryPeriodLabels[categoryPeriod] ?? categoryPeriod}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Segmented
                  size="small"
                  value={categoryPeriod}
                  onChange={(val) =>
                    handleErpPeriodChange(
                      val,
                      setCategoryPeriod,
                      setCategoryCustomRange,
                      setCategoryPickerOpen
                    )
                  }
                  options={getErpPeriodOptions(t)}
                />
                {categoryPeriod === 'custom' && (
                  <>
                    <RangePicker
                      open={categoryPickerOpen}
                      value={[
                        categoryCustomRange ? dayjs(categoryCustomRange.startDate) : null,
                        categoryCustomRange ? dayjs(categoryCustomRange.endDate) : null,
                      ]}
                      onChange={(dates) => {
                        if (dates && dates[0] && dates[1]) {
                          setCategoryCustomRange({
                            startDate: dates[0].format('YYYY-MM-DD'),
                            endDate: dates[1].format('YYYY-MM-DD'),
                          });
                        }
                        setCategoryPickerOpen(false);
                      }}
                      onOpenChange={setCategoryPickerOpen}
                      disabledDate={(current) => current && current > dayjs().endOf('day')}
                      size="small"
                      style={{
                        width: 0,
                        padding: 0,
                        opacity: 0,
                        position: 'absolute',
                        pointerEvents: 'none',
                      }}
                    />
                    <button
                      onClick={() => setCategoryPickerOpen(true)}
                      className={styles.periodBtn}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <Calendar size={13} />
                      {categoryCustomRange
                        ? `${dayjs(categoryCustomRange.startDate).format('DD/MM/YYYY')} – ${dayjs(categoryCustomRange.endDate).format('DD/MM/YYYY')}`
                        : t('sellerDashboard.period.custom', 'Tùy chỉnh')}
                    </button>
                  </>
                )}
              </div>
            </div>
            <div className={styles.erpSectionBody}>
              {categoryLoading ? (
                <div className={styles.loadingCenter}>
                  <Spin />
                </div>
              ) : categoryChartData.length > 0 ? (
                <>
                  {/* KPI Strip */}
                  <div className={styles.categoryKpiStrip}>
                    <div
                      className={styles.categoryKpiCard}
                      style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}
                    >
                      <div className={styles.categoryKpiLabel}>
                        {t('sellerDashboard.category.kpi.totalRevenue', 'Tổng doanh thu')}
                      </div>
                      <div className={styles.categoryKpiValue} style={{ color: '#15803d' }}>
                        {(() => {
                          const total = categoryChartData.reduce((s, x) => s + x.totalRevenue, 0);
                          return formatCurrency(total);
                        })()}
                      </div>
                      <div className={styles.categoryKpiMeta}>
                        {categoryChartData.length}{' '}
                        {t('sellerDashboard.category.kpi.categories', 'danh mục')}
                      </div>
                    </div>
                    {categoryChartData[0] && (
                      <div
                        className={styles.categoryKpiCard}
                        style={{
                          background: `${categoryChartData[0].color}14`,
                          border: `1px solid ${categoryChartData[0].color}30`,
                        }}
                      >
                        <div className={styles.categoryKpiLabel}>
                          {t('sellerDashboard.category.kpi.topCategory', 'Danh mục dẫn đầu')}
                        </div>
                        <div
                          className={styles.categoryKpiValue}
                          style={{ color: categoryChartData[0].color }}
                        >
                          {formatCurrency(categoryChartData[0].totalRevenue)}
                        </div>
                        <div
                          className={styles.categoryKpiMeta}
                          style={{ color: categoryChartData[0].color }}
                        >
                          {categoryChartData[0].categoryName}
                        </div>
                      </div>
                    )}
                    {(() => {
                      const total = categoryChartData.reduce((s, x) => s + x.totalRevenue, 0);
                      const top = categoryChartData[0];
                      if (!top || total === 0) {
                        return null;
                      }
                      return (
                        <div
                          className={styles.categoryKpiCard}
                          style={{ background: '#fefce8', border: '1px solid #fef08a' }}
                        >
                          <div className={styles.categoryKpiLabel}>
                            {t('sellerDashboard.category.kpi.topShare', 'Tỷ trọng cao nhất')}
                          </div>
                          <div className={styles.categoryKpiValue} style={{ color: '#b45309' }}>
                            {top.revenuePercent}%
                          </div>
                          <div className={styles.categoryKpiMeta} style={{ color: '#b45309' }}>
                            {top.categoryName}
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Chart + Legend layout */}
                  <div className={styles.categoryChartSection}>
                    {/* Donut */}
                    <div className={styles.categoryDonutWrapper}>
                      <div className={styles.categoryDonutCenter}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={categoryChartData}
                              dataKey="totalRevenue"
                              nameKey="categoryName"
                              innerRadius={65}
                              outerRadius={105}
                              paddingAngle={2}
                            >
                              {categoryChartData.map((entry) => (
                                <Cell key={entry.rowKey} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => formatCurrency(value)} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className={styles.categoryDonutLabel}>
                          <div className={styles.categoryDonutLabelSub}>
                            {t('sellerDashboard.category.topCategoryLabel', 'Top Danh mục')}
                          </div>
                          <div
                            className={styles.categoryDonutLabelTop}
                            style={{ color: categoryChartData[0]?.color }}
                          >
                            #{categoryChartData[0]?.categoryName}
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Legend */}
                    <div className={styles.categoryLegendSection}>
                      <div
                        style={{
                          fontSize: 10,
                          color: '#94a3b8',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          marginBottom: 10,
                        }}
                      >
                        {t('sellerDashboard.category.distribution', 'Phân bố theo doanh thu')}
                      </div>
                      {renderCategoryLegend()}
                    </div>
                  </div>

                  {/* Featured Top Category Card */}
                  {categoryChartData[0] && (
                    <div
                      className={styles.categoryFeaturedCard}
                      style={{
                        borderColor: `${categoryChartData[0].color}30`,
                        background: `linear-gradient(135deg, ${categoryChartData[0].color}08 0%, ${categoryChartData[0].color}03 100%)`,
                      }}
                    >
                      <div className={styles.categoryFeaturedLeft}>
                        <div className={styles.categoryFeaturedBadge}>
                          <TrendingUp size={14} color={categoryChartData[0].color} />
                          <span>
                            {t('sellerDashboard.category.topCategoryBadge', 'Top Category')}
                          </span>
                        </div>
                        <div className={styles.categoryFeaturedName}>
                          {categoryChartData[0].categoryName}
                        </div>
                        <div
                          className={styles.categoryFeaturedRevenue}
                          style={{ color: categoryChartData[0].color }}
                        >
                          {formatCurrency(categoryChartData[0].totalRevenue)}
                        </div>
                      </div>
                      <div className={styles.categoryFeaturedRight}>
                        <div className={styles.categoryFeaturedStat}>
                          <span className={styles.categoryFeaturedStatValue}>
                            {categoryChartData[0].revenuePercent}%
                          </span>
                          <span className={styles.categoryFeaturedStatLabel}>
                            {t('sellerDashboard.category.shareLabel', 'Tỷ trọng')}
                          </span>
                        </div>
                        <div className={styles.categoryFeaturedStat}>
                          <span className={styles.categoryFeaturedStatValue}>#1</span>
                          <span className={styles.categoryFeaturedStatLabel}>
                            {t('sellerDashboard.category.rankLabel', 'Hạng')}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <span className={styles.pieSourceNote}>
                    {t(
                      'sellerDashboard.category.source',
                      'Nguồn: doanh thu theo danh mục — {{count}} danh mục trong kỳ',
                      { count: categoryChartData.length }
                    )}
                  </span>
                </>
              ) : (
                <div className={styles.emptyState}>
                  <svg
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#94a3b8"
                    strokeWidth="1.5"
                  >
                    <path
                      d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M20.488 15H12a9 9 9 0 010 18h8.488a9 9 9 0 000-18z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <p>
                    {t(
                      'sellerDashboard.category.noData',
                      'Không có dữ liệu phân tích theo danh mục'
                    )}
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* ── 6) Customer Age Analytics ── */}
        <div className={styles.ageAnalyticsBlock}>
          <Card className={styles.erpSectionCard} styles={{ body: { padding: 0 } }}>
            <div className={styles.erpSectionHeader}>
              <div className={styles.erpSectionTitleRow}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2"
                >
                  <path
                    d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="9" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round" />
                  <path
                    d="M23 21v-2a4 4 0 00-3-3.87"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path d="M16 3.13a4 4 0 010 7.75" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className={styles.erpSectionTitle}>
                  {t('sellerDashboard.ageAnalytics.cardTitle', 'Phân tích độ tuổi khách hàng')}
                </span>
                <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 4 }}>
                  {ageAnalytics?.periodLabel || ''}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Segmented
                  size="small"
                  value={agePeriod}
                  onChange={(val) =>
                    handleErpPeriodChange(val, setAgePeriod, setAgeCustomRange, setAgePickerOpen)
                  }
                  options={getErpPeriodOptions(t)}
                />
                {agePeriod === 'custom' && (
                  <>
                    <RangePicker
                      open={agePickerOpen}
                      value={[
                        ageCustomRange ? dayjs(ageCustomRange.startDate) : null,
                        ageCustomRange ? dayjs(ageCustomRange.endDate) : null,
                      ]}
                      onChange={(dates) => {
                        if (dates && dates[0] && dates[1]) {
                          setAgeCustomRange({
                            startDate: dates[0].format('YYYY-MM-DD'),
                            endDate: dates[1].format('YYYY-MM-DD'),
                          });
                        }
                        setAgePickerOpen(false);
                      }}
                      onOpenChange={setAgePickerOpen}
                      disabledDate={(current) => current && current > dayjs().endOf('day')}
                      size="small"
                      style={{
                        width: 0,
                        padding: 0,
                        opacity: 0,
                        position: 'absolute',
                        pointerEvents: 'none',
                      }}
                    />
                    <button
                      onClick={() => setAgePickerOpen(true)}
                      className={styles.periodBtn}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <Calendar size={13} />
                      {ageCustomRange
                        ? `${dayjs(ageCustomRange.startDate).format('DD/MM/YYYY')} – ${dayjs(ageCustomRange.endDate).format('DD/MM/YYYY')}`
                        : t('sellerDashboard.period.custom', 'Tùy chỉnh')}
                    </button>
                  </>
                )}
                <Button
                  type="primary"
                  size="small"
                  icon={<TrendingUp size={13} />}
                  onClick={() => setAgeAnalyticsModalOpen(true)}
                  style={{ background: '#3b82f6', borderColor: '#3b82f6', flexShrink: 0 }}
                >
                  {t('sellerDashboard.ageAnalytics.viewDetail', 'Chi tiết')}
                </Button>
              </div>
            </div>

            <div className={styles.erpSectionBody}>
              {ageAnalyticsLoading ? (
                <div className={styles.loadingCenter}>
                  <Spin />
                </div>
              ) : ageAnalytics &&
                ageAnalytics.ageGroups &&
                ageAnalytics.ageGroups.some((g) => g.customers > 0) ? (
                (() => {
                  const validGroups = ageAnalytics.ageGroups
                    .filter((g) => g.label !== 'Unknown' && g.customers > 0)
                    .sort((a, b) => {
                      const order = [
                        'Under 18',
                        '18-24',
                        '25-34',
                        '35-44',
                        '45-54',
                        '55-64',
                        '65+',
                      ];
                      return order.indexOf(a.label) - order.indexOf(b.label);
                    });

                  const donutData = validGroups.map((g) => ({
                    name: formatAgeGroup(g.label),
                    value: g.revenue || 0,
                    label: g.label,
                  }));

                  const barData = validGroups.map((g) => ({
                    name: formatAgeGroup(g.label),
                    label: g.label,
                    'Khách hàng': g.customers,
                    'Doanh thu': g.revenue,
                  }));

                  const topGroup = validGroups[0] || null;

                  return (
                    <>
                      {/* KPI Strip */}
                      <div className={styles.ageKpiStrip}>
                        <div
                          className={styles.ageKpiCard}
                          style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}
                        >
                          <div className={styles.ageKpiLabel}>
                            {t('sellerDashboard.ageAnalytics.totalCustomers', 'Tổng khách hàng')}
                          </div>
                          <div className={styles.ageKpiValue} style={{ color: '#1d4ed8' }}>
                            {(ageAnalytics.totalCustomers || 0).toLocaleString()}
                          </div>
                          <div className={styles.ageKpiMeta}>
                            {ageAnalytics.totalOrders?.toLocaleString()}{' '}
                            {t('sellerDashboard.ageAnalytics.ordersUnit', 'đơn')}
                          </div>
                        </div>
                        <div
                          className={styles.ageKpiCard}
                          style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}
                        >
                          <div className={styles.ageKpiLabel}>
                            {t('sellerDashboard.ageAnalytics.totalRevenue', 'Tổng doanh thu')}
                          </div>
                          <div className={styles.ageKpiValue} style={{ color: '#15803d' }}>
                            {formatCurrency(ageAnalytics.totalRevenue || 0)}
                          </div>
                          <div className={styles.ageKpiMeta}>
                            TB {formatCurrency(ageAnalytics.avgOrderValue || 0)}/
                            {t('sellerDashboard.ageAnalytics.ordersUnit', 'đơn')}
                          </div>
                        </div>
                        {topGroup && (
                          <div
                            className={styles.ageKpiCard}
                            style={{
                              background: `${getAgeColor(topGroup.label)}14`,
                              border: `1px solid ${getAgeColor(topGroup.label)}30`,
                            }}
                          >
                            <div className={styles.ageKpiLabel}>
                              {t('sellerDashboard.ageAnalytics.primaryAgeGroup', 'Nhóm tuổi chính')}
                            </div>
                            <div
                              className={styles.ageKpiValue}
                              style={{ color: getAgeColor(topGroup.label) }}
                            >
                              {formatAgeGroup(topGroup.label)}
                            </div>
                            <div
                              className={styles.ageKpiMeta}
                              style={{ color: getAgeColor(topGroup.label) }}
                            >
                              {topGroup.percent}% DT · {topGroup.customers.toLocaleString()} KH
                            </div>
                          </div>
                        )}
                        <div
                          className={styles.ageKpiCard}
                          style={{ background: '#faf5ff', border: '1px solid #e9d5ff' }}
                        >
                          <div className={styles.ageKpiLabel}>
                            {t('sellerDashboard.ageAnalytics.activeGroups', 'Nhóm hoạt động')}
                          </div>
                          <div className={styles.ageKpiValue} style={{ color: '#7c3aed' }}>
                            {validGroups.length}
                          </div>
                          <div className={styles.ageKpiMeta}>
                            {t('sellerDashboard.ageAnalytics.groupUnit', 'nhóm tuổi')}
                          </div>
                        </div>
                      </div>

                      {/* Chart + Legend Layout */}
                      <div className={styles.ageChartSection}>
                        {/* Donut */}
                        <div className={styles.ageDonutWrapper}>
                          <div className={styles.ageDonutCenter}>
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={donutData}
                                  dataKey="value"
                                  nameKey="name"
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={62}
                                  outerRadius={100}
                                  paddingAngle={2}
                                  strokeWidth={0}
                                >
                                  {donutData.map((entry) => (
                                    <Cell key={entry.label} fill={getAgeColor(entry.label)} />
                                  ))}
                                </Pie>
                                <Tooltip
                                  contentStyle={{
                                    background: '#1e293b',
                                    border: '1px solid #334155',
                                    borderRadius: 8,
                                    fontSize: 12,
                                    color: '#f8fafc',
                                  }}
                                  formatter={(value, name) => [formatCurrency(value), name]}
                                />
                              </PieChart>
                            </ResponsiveContainer>
                            <div className={styles.ageDonutLabel}>
                              <div className={styles.ageDonutLabelSub}>Top nhóm</div>
                              <div
                                className={styles.ageDonutLabelAge}
                                style={{ color: getAgeColor(topGroup?.label) }}
                              >
                                {formatAgeGroup(topGroup?.label)}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Legend bars */}
                        <div className={styles.ageLegendSection}>
                          <div className={styles.ageLegendTitle}>
                            {t('sellerDashboard.ageAnalytics.distribution', 'Phân bố khách hàng')}
                          </div>
                          {validGroups.map((g) => (
                            <div key={g.label} className={styles.ageLegendRow}>
                              <div className={styles.ageLegendRowHeader}>
                                <div className={styles.ageLegendLabelGroup}>
                                  <span
                                    className={styles.ageLegendDot}
                                    style={{ background: getAgeColor(g.label) }}
                                  />
                                  <span className={styles.ageLegendName}>
                                    {formatAgeGroup(g.label)}
                                  </span>
                                </div>
                                <div className={styles.ageLegendStats}>
                                  <span className={styles.ageLegendCustomers}>
                                    {g.customers.toLocaleString()} KH
                                  </span>
                                  <span
                                    className={styles.ageLegendPercent}
                                    style={{ color: getAgeColor(g.label) }}
                                  >
                                    {g.percent}%
                                  </span>
                                </div>
                              </div>
                              <Progress
                                percent={g.percent}
                                size="small"
                                strokeColor={getAgeColor(g.label)}
                                showInfo={false}
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Dual-series bar chart */}
                      <div className={styles.ageBarChartSection}>
                        <div className={styles.ageBarChartTitle}>
                          {t(
                            'sellerDashboard.ageAnalytics.customerCompare',
                            'So sánh khách hàng & doanh thu theo nhóm tuổi'
                          )}
                        </div>
                        <div className={styles.ageBarChartLegend}>
                          <div className={styles.ageBarChartLegendItem}>
                            <div
                              className={styles.ageBarChartLegendDot}
                              style={{ background: '#3b82f6' }}
                            />
                            <span>Khách hàng</span>
                          </div>
                          <div className={styles.ageBarChartLegendItem}>
                            <div
                              className={styles.ageBarChartLegendDot}
                              style={{ background: '#dbeafe' }}
                            />
                            <span>Doanh thu</span>
                          </div>
                        </div>
                        <ResponsiveContainer width="100%" height={180}>
                          <BarChart
                            data={barData}
                            margin={{ top: 8, right: 16, left: -10, bottom: 0 }}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#f1f5f9"
                              vertical={false}
                            />
                            <XAxis
                              dataKey="name"
                              tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }}
                            />
                            <YAxis
                              yAxisId="left"
                              tick={{ fontSize: 10, fill: '#94a3b8' }}
                              tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v)}
                            />
                            <YAxis
                              yAxisId="right"
                              orientation="right"
                              tick={{ fontSize: 10, fill: '#94a3b8' }}
                              tickFormatter={(v) =>
                                v >= 1000000
                                  ? `${(v / 1000000).toFixed(1)}M`
                                  : v >= 1000
                                    ? `${(v / 1000).toFixed(0)}K`
                                    : v
                              }
                            />
                            <Tooltip
                              contentStyle={{
                                background: '#1e293b',
                                border: '1px solid #334155',
                                borderRadius: 8,
                                fontSize: 12,
                                color: '#f8fafc',
                              }}
                              formatter={(value, name) => {
                                if (name === 'Doanh thu') {
                                  return [formatCurrency(value), name];
                                }
                                return [value.toLocaleString(), name];
                              }}
                            />
                            <Bar
                              yAxisId="left"
                              dataKey="Khách hàng"
                              radius={[4, 4, 0, 0]}
                              maxBarSize={32}
                            >
                              {barData.map((entry) => (
                                <Cell key={entry.label} fill="#3b82f6" />
                              ))}
                            </Bar>
                            <Bar
                              yAxisId="right"
                              dataKey="Doanh thu"
                              radius={[4, 4, 0, 0]}
                              maxBarSize={32}
                              fill="#dbeafe"
                            >
                              {barData.map((entry) => (
                                <Cell
                                  key={entry.label}
                                  fill="#dbeafe"
                                  stroke="#3b82f6"
                                  strokeWidth={1}
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </>
                  );
                })()
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '32px 16px',
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      background: '#f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <svg
                      width="26"
                      height="26"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#94a3b8"
                      strokeWidth="1.5"
                    >
                      <path
                        d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <circle cx="9" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round" />
                      <path
                        d="M23 21v-2a4 4 0 00-3-3.87"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M16 3.13a4 4 0 010 7.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div
                      style={{ fontWeight: 500, color: '#64748b', fontSize: 13, marginBottom: 4 }}
                    >
                      {t('sellerDashboard.ageAnalytics.noDataTitle', 'Chưa có dữ liệu độ tuổi')}
                    </div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>
                      {t(
                        'sellerDashboard.ageAnalytics.noDataHint',
                        'Dữ liệu sẽ hiển thị khi khách hàng có cập nhật ngày sinh'
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* ── Detail Modals ── */}
        <RevenueDetailModal
          open={revenueModalOpen}
          onClose={() => setRevenueModalOpen(false)}
          period={trendPeriod}
          customDateRange={customDateRange}
          comparison={comparison}
        />
        <OrdersDetailModal
          open={ordersModalOpen}
          onClose={() => setOrdersModalOpen(false)}
          period={trendPeriod}
          customDateRange={customDateRange}
          comparison={comparison}
        />
        <AOVDetailModal
          open={aovModalOpen}
          onClose={() => setAOVModalOpen(false)}
          period={trendPeriod}
          customDateRange={customDateRange}
          comparison={comparison}
        />
        <ProfitDetailModal
          open={profitModalOpen}
          onClose={() => setProfitModalOpen(false)}
          period={trendPeriod}
          customDateRange={customDateRange}
          comparison={comparison}
        />
        <TopProfitProductsModal
          open={topProfitProductsModalOpen}
          onClose={() => setTopProfitProductsModalOpen(false)}
        />

        <CustomerAgeAnalyticsModal
          open={ageAnalyticsModalOpen}
          onClose={() => setAgeAnalyticsModalOpen(false)}
        />
      </div>
    </div>
  );
};

export default SellerDashboard;
