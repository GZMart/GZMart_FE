import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  AlertTriangle,
  ArrowRightLeft,
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
import {
  Button,
  Card,
  Progress,
  Segmented,
  Spin,
  Table,
} from 'antd';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';
import { formatCurrency } from '../../utils/formatters';
import dashboardService from '../../services/api/dashboardService';
import { chatService } from '../../services/api/chatService';
import { OverallSalesCard } from '../../components/seller/dashboard/OverallSalesCard';
import SellerBalanceSection from '../../components/seller/dashboard/SellerBalanceSection';
import { RevenueDetailModal } from '../../components/seller/dashboard/modals/RevenueDetailModal';
import { OrdersDetailModal } from '../../components/seller/dashboard/modals/OrdersDetailModal';
import { AOVDetailModal } from '../../components/seller/dashboard/modals/AOVDetailModal';
import { ProfitDetailModal } from '../../components/seller/dashboard/modals/ProfitDetailModal';
import { TopProfitProductsModal } from '../../components/seller/dashboard/modals/TopProfitProductsModal';
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

const translateExpenseType = (type, t) => {
  const subKey = EXPENSE_TYPE_TO_I18N[type];
  if (!subKey) {
    return type;
  }
  return t(`sellerDashboard.expense.types.${subKey}`, type);
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
  'Goods Value (PO)':             '#1677ff',
  'Buying Service Fee':           '#52c41a',
  'Intl Freight (CN→VN)':        '#fa8c16',
  'Import Tax':                   '#f5222d',
  'CN Domestic Shipping':         '#722ed1',
  'Packaging / Insurance':        '#13c2c2',
  'VN Last-Mile (PO→Warehouse)': '#faad14',
  'Other Costs':                  '#8c8c8c',
  'Last-Mile Delivery (Order)':   '#eb2f96',
};

const CATEGORY_CHART_COLORS = [
  '#1677ff', '#52c41a', '#fa8c16', '#f5222d',
  '#722ed1', '#13c2c2', '#faad14', '#eb2f96',
];

const getCategoryPeriodLabels = (t) => ({
  daily:     t('sellerDashboard.period.daily', '30 ngày gần nhất'),
  weekly:    t('sellerDashboard.period.weekly', '13 tuần gần nhất'),
  monthly:   t('sellerDashboard.period.monthly', '12 tháng gần nhất'),
  quarterly: t('sellerDashboard.period.quarterly', '4 quý gần nhất'),
  yearly:    t('sellerDashboard.period.yearly', '5 năm gần nhất'),
});

// ─── Skeleton: Action Card ──────────────────────────────────────────────────
const SkeletonActionCard = () => (
  <div className={styles.skeletonActionCard}>
    <div className={`${styles.skeleton} ${styles.skeletonIcon}`} />
    <div className={styles.skeletonTextBlock}>
      <div className={`${styles.skeleton} ${styles.skeletonLine}`} style={{ width: '75%', height: 14 }} />
      <div className={`${styles.skeleton} ${styles.skeletonLine}`} style={{ width: '55%', height: 11 }} />
    </div>
  </div>
);

// ─── Skeleton: Stat Card ────────────────────────────────────────────────────
const SkeletonStatCard = () => (
  <div className={styles.skeletonCard}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div className={`${styles.skeleton} ${styles.skeletonIcon}`} style={{ width: 40, height: 40 }} />
    </div>
    <div className={`${styles.skeleton} ${styles.skeletonLine}`} style={{ width: '45%', height: 10, marginTop: 4 }} />
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
const StatCard = ({ icon: IconComponent, label, value, trend, trendUp, fromLabel, cardColor, onClick }) => {
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
          <span className={`${styles.statTrendPill} ${trendUp ? styles.statTrendPillUp : styles.statTrendPillDown}`}>
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
  const options = lang === 'vi'
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

  // ── Period selectors ──
  const [trendPeriod, setTrendPeriod] = useState('daily');
  const [expensePeriod, setExpensePeriod] = useState('monthly');
  const [categoryPeriod, setCategoryPeriod] = useState('monthly');

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

  // ── Detail modals ──
  const [revenueModalOpen, setRevenueModalOpen] = useState(false);
  const [ordersModalOpen, setOrdersModalOpen] = useState(false);
  const [aovModalOpen, setAOVModalOpen] = useState(false);
  const [profitModalOpen, setProfitModalOpen] = useState(false);
  const [topProfitProductsModalOpen, setTopProfitProductsModalOpen] = useState(false);

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
          dashboardService.getProfitLossAnalysis({ period: 'monthly' }),
          dashboardService.getTopSellingProductsWithProfit({ limit: 5, period: 'monthly' }),
          dashboardService.getRevenue(),
        ]);

        if (!mounted) {
          return;
        }

        const counts = orderCountsRes?.data ?? {};
        const rmaCount = typeof counts.rmaCount === 'number' ? counts.rmaCount : 0;
        const cancellationCount = typeof counts.cancellationCount === 'number' ? counts.cancellationCount : 0;

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
          })),
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
          dashboardService.getRevenueTrend({ period: trendPeriod }),
          dashboardService.getComparison({ period: trendPeriod }),
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
  }, [trendPeriod]);

  // ── Refetch expense when period changes ──
  useEffect(() => {
    let cancelled = false;
    setExpenseLoading(true);
    dashboardService
      .getExpenseAnalysis({ period: expensePeriod })
      .then((res) => {
        if (cancelled) {
          return;
        }
        const payload = res?.data;
        setExpense(
          payload && typeof payload === 'object' && !Array.isArray(payload)
            ? payload
            : null,
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
  }, [expensePeriod]);

  // ── Refetch category analytics when period changes ──
  useEffect(() => {
    let cancelled = false;
    setCategoryLoading(true);
    dashboardService
      .getProductAnalyticsByCategory({ period: categoryPeriod })
      .then((res) => {
        if (cancelled) {
          return;
        }
        const payload = res?.data;
        setCategoryAnalytics(
          payload && typeof payload === 'object' && !Array.isArray(payload)
            ? payload
            : null,
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
  }, [categoryPeriod]);

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
    const map = {
      daily:     t('sellerDashboard.periodCompare.daily', 'so với 30 ngày trước'),
      weekly:    t('sellerDashboard.periodCompare.weekly', 'so với 13 tuần trước'),
      monthly:   t('sellerDashboard.periodCompare.monthly', 'so với 12 tháng trước'),
      quarterly: t('sellerDashboard.periodCompare.quarterly', 'so với 4 quý trước'),
      yearly:    t('sellerDashboard.periodCompare.yearly', 'so với 5 năm trước'),
    };
    return map[trendPeriod] ?? t('sellerDashboard.stats.vsPeriod', 'so với kỳ trước');
  }, [trendPeriod, t]);

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
      typeof growth.orders === 'number' && !Number.isNaN(growth.orders)
        ? growth.orders
        : 0;
    const avgOrderValue = current.orders > 0
      ? Math.round((current.revenue || 0) / current.orders)
      : null;

    const currAov = current.orders > 0 ? (current.revenue || 0) / current.orders : null;
    const prevAov = prev.orders > 0 ? (prev.revenue || 0) / prev.orders : null;
    let aovGrowth = 0;
    if (prevAov != null && prevAov > 0 && currAov != null) {
      aovGrowth = Math.round(((currAov - prevAov) / prevAov) * 100);
    } else if (
      (prev.orders ?? 0) <= 0
      && (current.orders ?? 0) > 0
      && currAov != null
      && currAov > 0
    ) {
      aovGrowth = 100;
    }

    const profitGrowth =
      typeof growth.profit === 'number' && !Number.isNaN(growth.profit)
        ? growth.profit
        : 0;

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
  const activeTasksCount = useMemo(() =>
    Object.values(todoCounts).filter((v) => typeof v === 'number' && v > 0).length,
  [todoCounts]);

  // ── Action items with i18n ──
  const actionItems = useMemo(() => ACTION_ITEMS(t), [t]);

  // ── Category period labels with i18n ──
  const categoryPeriodLabels = useMemo(() => getCategoryPeriodLabels(t), [t]);

  const numberLocale = i18n.language?.startsWith('en') ? 'en-US' : 'vi-VN';

  // ─── Top profit products columns ──
  const topProfitColumns = useMemo(() => [
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
          <span className={`${styles.profitCell} ${num >= 0 ? styles.profitPositive : styles.profitNegative}`}>
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
  ], [t, numberLocale]);

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
      categoryName: cat.categoryName || t('sellerDashboard.lowStock.uncategorized', 'Không phân loại'),
      totalRevenue: Number(cat.totalRevenue) || 0,
      revenuePercent: typeof cat.revenuePercent === 'number' ? cat.revenuePercent : 0,
      color: CATEGORY_CHART_COLORS[idx % CATEGORY_CHART_COLORS.length],
    }));
  }, [categoryAnalytics, t]);

  const renderCategoryLegend = () => (
    <div className={styles.pieLegend}>
      {categoryChartData.map((s) => (
        <div
          key={s.rowKey}
          className={styles.pieLegendItem}
          style={{ background: `${s.color}14` }}
          title={t('sellerDashboard.category.legendTooltip', '{{name}} — {{percent}}% period revenue', { name: s.categoryName, percent: s.revenuePercent })}
        >
          <span className={styles.pieLegendDot} style={{ background: s.color }} />
          <span style={{ color: '#334155' }}>
            {s.categoryName}
            {s.revenuePercent > 0 ? ` (${s.revenuePercent}%)` : ''}
            :
          </span>
          <strong style={{ color: s.color }}>{formatCurrency(s.totalRevenue)}</strong>
        </div>
      ))}
    </div>
  );

  return (
    <div className={styles.container}>
      <div className={styles.pageContent}>

        {/* ── Header ── */}
        <Card
          className={styles.headerCard}
          styles={{ body: { padding: '14px 20px' } }}
        >
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
                    <span className={styles.xrBannerLabel}>{t('sellerDashboard.exchangeRate.label', 'Tỷ giá CNY / VND')}</span>
                    <span className={styles.xrBannerRate}>
                      <strong>1 CNY = {Math.round(exchangeRate.cnyToVnd).toLocaleString(numberLocale)}</strong>
                      {' '}
                      {t('sellerDashboard.exchangeRate.vndUnit', 'VND')}
                    </span>
                    <span className={styles.xrBannerUpdated}>
                      {t('sellerDashboard.exchangeRate.updated', 'Cập nhật: {{time}}', {
                        time: (exchangeRate.updatedAt instanceof Date ? exchangeRate.updatedAt : new Date()).toLocaleTimeString(numberLocale, { hour: '2-digit', minute: '2-digit' }),
                      })}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* ── 1) Action Center ── */}
        <Card
          className={styles.sectionCard}
          styles={{ body: { padding: 0 } }}
        >
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleRow}>
              <AlertTriangle size={16} color="#fa8c16" />
              <span className={styles.sectionTitle}>{t('sellerDashboard.actionCenter.title', 'Việc cần làm hôm nay')}</span>
              {activeTasksCount > 0 && (
                <span className={styles.sectionBadge}>{activeTasksCount}</span>
              )}
            </div>
            <span className={styles.sectionMeta}>{getFormattedDate()}</span>
          </div>
          <div className={styles.sectionBody}>
            {loading ? (
              <div className={styles.actionCardsGrid}>
                {[0, 1, 2, 3].map((i) => <SkeletonActionCard key={i} />)}
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
            onPeriodChange={(p) => setTrendPeriod(p)}
            loading={trendLoading}
            revenueCurrent={trendRevenue}
            trend={trendGrowth}
          />

          {/* Right: 4 Stat Cards */}
          {loading ? (
            <div className={styles.statCardsGrid}>
              {[0, 1, 2, 3].map((i) => <SkeletonStatCard key={i} />)}
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
                value={comparison?.currentPeriod?.orders != null
                  ? Number(comparison.currentPeriod.orders).toLocaleString(numberLocale)
                  : '—'}
                trend={`${comparisonKpis.ordersGrowth >= 0 ? '+' : ''}${comparisonKpis.ordersGrowth}%`}
                trendUp={comparisonKpis.ordersGrowth >= 0}
                fromLabel={periodFromLabel}
                cardColor="#722ed1"
                onClick={() => setOrdersModalOpen(true)}
              />
              <StatCard
                icon={DollarSign}
                label={t('sellerDashboard.stats.aov', 'Giá trị TB / đơn')}
                value={comparisonKpis.avgOrderValue != null
                  ? formatCurrency(comparisonKpis.avgOrderValue)
                  : '—'}
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
        <Card
          className={styles.sectionCard}
          styles={{ body: { padding: 0 } }}
        >
          <div className={`${styles.sectionHeader} ${styles.lowStockSectionHeader}`}>
            <div className={styles.sectionTitleRow}>
              <AlertTriangle size={16} color="#fa8c16" />
              <span className={styles.sectionTitle}>{t('sellerDashboard.lowStock.title', 'Cảnh báo sắp hết hàng')}</span>
              {lowStock.length > 0 && (
                <span className={styles.sectionBadge}>{lowStock.length}</span>
              )}
            </div>
            <Button
              type="primary"
              className={styles.poCreateHeaderBtn}
              onClick={() => {
                if (lowStock.length > 0) {
                  navigate(`/seller/erp/purchase-orders/create?products=${encodeURIComponent(JSON.stringify(lowStock))}`);
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
                    <div className={`${styles.skeleton}`} style={{ width: 20, height: 20, borderRadius: '50%' }} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div className={`${styles.skeleton} ${styles.skeletonLine}`} style={{ width: '60%', height: 13 }} />
                      <div className={`${styles.skeleton} ${styles.skeletonLine}`} style={{ width: '40%', height: 10 }} />
                      <div className={`${styles.skeleton}`} style={{ height: 6, borderRadius: 3, marginTop: 4 }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : lowStock.length > 0 ? (
              <div className={styles.lowStockGrid}>
                {lowStock.map((p) => {
                  const safetyStock = 20;
                  const currentStock = p?.stock ?? 0;
                  const stockPercent = Math.min(100, Math.round((currentStock / safetyStock) * 100));
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
                        <AlertTriangle
                          size={16}
                          color={isCritical ? '#cf1322' : '#d46b08'}
                        />
                      </div>
                      <div className={styles.lowStockContent}>
                        <div className={styles.lowStockNameRow}>
                          <span className={styles.lowStockName}>{p?.name ?? '—'}</span>
                          {isCritical && (
                            <span className={styles.lowStockCriticalTag}>{t('sellerDashboard.lowStock.danger', 'Nguy hiểm')}</span>
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
                            {t('sellerDashboard.lowStock.stockLeft', '{{current}} / {{safety}} sản phẩm', { current: currentStock, safety: safetyStock })}
                          </span>
                          <Button
                            type="primary"
                            size="small"
                            className={styles.lowStockBtn}
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/seller/erp/purchase-orders/create?products=${encodeURIComponent(JSON.stringify(p))}`);
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
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <p>{t('sellerDashboard.lowStock.allStockOk', 'Tất cả sản phẩm đều có đủ hàng trong kho')}</p>
              </div>
            )}
          </div>
        </Card>

        {/* ── 4) ERP Report ── */}
        <div className={styles.erpReportGrid}>
          {/* Left: Cost Breakdown Pie */}
          <Card
            className={styles.erpSectionCard}
            styles={{ body: { padding: 0 } }}
          >
            <div className={styles.erpSectionHeader}>
              <div className={styles.erpSectionTitleRow}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fa8c16" strokeWidth="2">
                  <path d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M20.488 15H12a9 9 9 0 010 18h8.488a9 9 9 0 000-18z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className={styles.erpSectionTitle}>{t('sellerDashboard.expense.title', 'Phân tích chi phí')}</span>
                {expense?.period && (
                  <span className={styles.erpSectionSub}>— {expense.period}</span>
                )}
              </div>
              <Segmented
                size="small"
                value={expensePeriod}
                onChange={(val) => setExpensePeriod(val)}
                options={[
                  { label: t('sellerDashboard.segmented.week', 'Tuần'), value: 'daily' },
                  { label: t('sellerDashboard.segmented.month', 'Tháng'), value: 'monthly' },
                  { label: t('sellerDashboard.segmented.quarter', 'Quý'), value: 'quarterly' },
                  { label: t('sellerDashboard.segmented.year', 'Năm'), value: 'yearly' },
                ]}
              />
            </div>
            <div className={styles.erpSectionBody}>
              <div className={styles.pieChartContainer}>
                {(loading || expenseLoading) ? (
                  <div className={styles.loadingCenter}>
                    <Spin />
                  </div>
                ) : expensePieSlices.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expensePieSlices}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={52}
                        outerRadius={82}
                        paddingAngle={2}
                      >
                        {expensePieSlices.map((entry) => (
                          <Cell key={entry.type} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className={styles.emptyState}>
                    <p>{t('sellerDashboard.expense.noData', 'Không có dữ liệu chi phí')}</p>
                  </div>
                )}
              </div>
              {expensePieSlices.length > 0 && renderExpenseLegend()}
              {expense?.poDetail?.poCount > 0 && (
                <span className={styles.pieSourceNote}>
                  {t('sellerDashboard.expense.source', 'Nguồn: {{count}} PO đã hoàn thành', { count: expense.poDetail.poCount })}
                </span>
              )}
            </div>
          </Card>

          {/* Right: Top Profitable Products */}
          <Card
            className={styles.erpSectionCard}
            styles={{ body: { padding: 0 } }}
          >
            <div className={styles.erpSectionHeader}>
              <div className={styles.erpSectionTitleRow}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#52c41a" strokeWidth="2">
                  <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className={styles.erpSectionTitle}>{t('sellerDashboard.topProducts.title', 'Top sản phẩm lợi nhuận cao')}</span>
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
          <Card
            className={styles.erpSectionCard}
            styles={{ body: { padding: 0 } }}
          >
            <div className={styles.erpSectionHeader}>
              <div className={styles.erpSectionTitleRow}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fa8c16" strokeWidth="2">
                  <path d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M20.488 15H12a9 9 9 0 010 18h8.488a9 9 9 0 000-18z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className={styles.erpSectionTitle}>{t('sellerDashboard.category.title', 'Phân tích sản phẩm theo danh mục')}</span>
                <span className={styles.erpSectionSub}>
                  — {categoryPeriodLabels[categoryPeriod] ?? categoryPeriod}
                </span>
              </div>
              <Segmented
                size="small"
                value={categoryPeriod}
                onChange={(val) => setCategoryPeriod(val)}
                options={[
                  { label: t('sellerDashboard.segmented.week', 'Tuần'), value: 'daily' },
                  { label: t('sellerDashboard.segmented.month', 'Tháng'), value: 'monthly' },
                  { label: t('sellerDashboard.segmented.quarter', 'Quý'), value: 'quarterly' },
                  { label: t('sellerDashboard.segmented.year', 'Năm'), value: 'yearly' },
                ]}
              />
            </div>
            <div className={styles.erpSectionBody}>
              {categoryLoading ? (
                <div className={styles.loadingCenter}>
                  <Spin />
                </div>
              ) : categoryChartData.length > 0 ? (
                <>
                  <div className={styles.pieChartContainer}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryChartData}
                          dataKey="totalRevenue"
                          nameKey="categoryName"
                          innerRadius={52}
                          outerRadius={82}
                          paddingAngle={2}
                        >
                          {categoryChartData.map((entry) => (
                            <Cell key={entry.rowKey} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  {renderCategoryLegend()}
                  <span className={styles.pieSourceNote}>
                    {t('sellerDashboard.category.source', 'Nguồn: doanh thu theo danh mục — {{count}} danh mục trong kỳ', { count: categoryChartData.length })}
                  </span>
                </>
              ) : (
                <div className={styles.emptyState}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
                    <path d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M20.488 15H12a9 9 9 0 010 18h8.488a9 9 9 0 000-18z" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <p>{t('sellerDashboard.category.noData', 'Không có dữ liệu phân tích theo danh mục')}</p>
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
          comparison={comparison}
        />
        <OrdersDetailModal
          open={ordersModalOpen}
          onClose={() => setOrdersModalOpen(false)}
          period={trendPeriod}
          comparison={comparison}
        />
        <AOVDetailModal
          open={aovModalOpen}
          onClose={() => setAOVModalOpen(false)}
          period={trendPeriod}
          comparison={comparison}
        />
        <ProfitDetailModal
          open={profitModalOpen}
          onClose={() => setProfitModalOpen(false)}
          period={trendPeriod}
          comparison={comparison}
        />
        <TopProfitProductsModal
          open={topProfitProductsModalOpen}
          onClose={() => setTopProfitProductsModalOpen(false)}
        />

      </div>
    </div>
  );
};

export default SellerDashboard;
