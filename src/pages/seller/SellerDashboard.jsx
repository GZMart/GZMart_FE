import { useState, useEffect } from 'react';
import { CreditCard, ShoppingCart, RefreshCw, TrendingUp, DollarSign, Package, Truck, Wallet, Calendar, ChevronDown } from 'lucide-react';
import dashboardService from '../../services/api/dashboardService';
import { formatCurrency } from '../../utils/formatters';
import styles from '../../assets/styles/seller/Dashboard.module.css';
import { OverallSalesCard } from '../../components/seller/dashboard/OverallSalesCard';
import { ProductsTable } from '../../components/seller/dashboard/ProductsTable';

// Period mapping: filter label → API period + chart grouping
const PERIOD_OPTIONS = [
  { label: 'This Week', value: 'week', apiPeriod: 'week', chartPeriod: 'week', xAxisFormat: 'day' },
  { label: 'This Month', value: 'month', apiPeriod: 'month', chartPeriod: 'month', xAxisFormat: 'day' },
  { label: 'This Year', value: 'year', apiPeriod: 'year', chartPeriod: 'monthly', xAxisFormat: 'month' },
  { label: 'Custom Range', value: 'custom', apiPeriod: null, chartPeriod: 'daily', xAxisFormat: 'auto' },
];

const SellerDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState('month');
  const [chartPeriod, setChartPeriod] = useState('month');
  const [xAxisFormat, setXAxisFormat] = useState('day');
  const [customRange, setCustomRange] = useState({ startDate: '', endDate: '' });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [profitLossData, setProfitLossData] = useState([]);
  const [expenseData, setExpenseData] = useState(null);
  const [growthData, setGrowthData] = useState({
    revenueGrowth: 0,
    profitGrowth: 0,
    ordersGrowth: 0,
  });

  // Sample data for chart fallback
  const sampleRevenueTrendData = [
    { _id: '1', revenue: 132450000 },
    { _id: '2', revenue: 128900000 },
    { _id: '3', revenue: 145230000 },
    { _id: '4', revenue: 152680000 },
    { _id: '5', revenue: 138450000 },
    { _id: '6', revenue: 149250000 },
    { _id: '7', revenue: 155890000 },
    { _id: '8', revenue: 142100000 },
    { _id: '9', revenue: 158340000 },
    { _id: '10', revenue: 165120000 },
    { _id: '11', revenue: 172450000 },
    { _id: '12', revenue: 348253650 },
  ];

  // Map period value to API period and chart period
  const getPeriodConfig = (p, custom = null) => {
    if (p === 'custom' && custom) {
      return { apiPeriod: 'week', chartPeriod: 'daily', xAxisFormat: 'auto' };
    }
    const config = PERIOD_OPTIONS.find(opt => opt.value === p) || PERIOD_OPTIONS[1];
    return {
      apiPeriod: config.apiPeriod || 'week',
      chartPeriod: config.chartPeriod,
      xAxisFormat: config.xAxisFormat,
    };
  };

  // Fetch all dashboard data
  const fetchDashboard = async (selectedPeriod = 'month', customDateRange = null) => {
    try {
      setLoading(true);
      const config = getPeriodConfig(selectedPeriod, customDateRange);
      setChartPeriod(config.chartPeriod);
      setXAxisFormat(config.xAxisFormat);

      // Build params for API calls
      const trendParams = { period: config.chartPeriod };
      const profitLossParams = { period: config.chartPeriod };
      const expenseParams = { period: config.chartPeriod };

      // Build growth comparison params
      const growthParams = { period: config.apiPeriod };
      if (customDateRange) {
        growthParams.startDate = customDateRange.startDate;
        growthParams.endDate = customDateRange.endDate;
      }

      const [dashResponse, trendResponse, profitLossResponse, expenseResponse, growthResponse] = await Promise.all([
        dashboardService.getComplete(),
        dashboardService.getRevenueTrend(trendParams),
        dashboardService.getProfitLossAnalysis(profitLossParams),
        dashboardService.getExpenseAnalysis(expenseParams),
        dashboardService.getGrowthComparison(growthParams),
      ]);

      setDashboardData(dashResponse.data);
      setRevenueTrend(trendResponse.data && trendResponse.data.length > 0 ? trendResponse.data : sampleRevenueTrendData);
      setProfitLossData(profitLossResponse.data || []);
      setExpenseData(expenseResponse.data || null);

      if (growthResponse.data) {
        setGrowthData({
          revenueGrowth: growthResponse.data.revenueGrowth || 0,
          profitGrowth: growthResponse.data.profitGrowth || 0,
          ordersGrowth: growthResponse.data.ordersGrowth || 0,
        });
      }
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      setRevenueTrend(sampleRevenueTrendData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard(period, period === 'custom' ? customRange : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle period change
  const handlePeriodChange = (newPeriod) => {
    if (newPeriod === 'custom') {
      setShowDatePicker(true);
      return;
    }
    setPeriod(newPeriod);
    setShowDatePicker(false);
    fetchDashboard(newPeriod);
  };

  // Handle custom range apply
  const handleApplyCustomRange = () => {
    if (customRange.startDate && customRange.endDate) {
      setPeriod('custom');
      setShowDatePicker(false);
      fetchDashboard('custom', customRange);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchDashboard(period, period === 'custom' ? customRange : null);
  };

  if (loading && !dashboardData) {
    return (
      <div className={styles.loadingContainer}>
        <div>Loading...</div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h1>Dashboard</h1>
            <p>You can add your credit and debit card details here for future purchases.</p>
          </div>
        </div>
        <div className={styles.noDataContainer}>No data available</div>
      </div>
    );
  }

  const { bestSellers, orderStats, customerStats } = dashboardData;

  // Calculate totals from profit-loss data
  const totalProfit = profitLossData.reduce((sum, item) => sum + (item.profit || 0), 0);
  const totalCost = profitLossData.reduce((sum, item) => sum + (item.cost || 0), 0);
  const totalRevenue = profitLossData.reduce((sum, item) => sum + (item.revenue || 0), 0);
  const profitMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(2) : 0;

  const totalOrders = profitLossData.reduce((sum, item) => sum + (item.orders || 0), 0);

  // Format growth percentage for display
  const formatGrowth = (value) => {
    const num = Number(value) || 0;
    const prefix = num > 0 ? '+' : '';
    return `${prefix}${num}%`;
  };

  // Determine growth color class
  const getGrowthClass = (value) => {
    if (value > 0) return styles.growthPositive;
    if (value < 0) return styles.growthNegative;
    return '';
  };

  // Get current period label
  const currentPeriodLabel = PERIOD_OPTIONS.find(p => p.value === period)?.label || 'This Month';
  const displayPeriodLabel = period === 'custom' && customRange.startDate
    ? `${new Date(customRange.startDate).toLocaleDateString()} - ${new Date(customRange.endDate).toLocaleDateString()}`
    : currentPeriodLabel;

  return (
    <div className={styles.container}>
      {/* Header with Period Filter Buttons */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>Dashboard</h1>
          <p>You can add your credit and debit card details here for future purchases.</p>
        </div>
        <div className={styles.periodFilterContainer}>
          {/* Period Filter Buttons */}
          <div className={styles.periodFilterButtons}>
            {PERIOD_OPTIONS.map((p) => (
              <button
                key={p.value}
                onClick={() => handlePeriodChange(p.value)}
                className={`${styles.periodButton} ${period === p.value ? styles.active : ''}`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Custom Range Date Picker */}
          {showDatePicker && (
            <div className={styles.customRangePicker}>
              <input
                type="date"
                className={styles.dateInput}
                value={customRange.startDate}
                onChange={(e) => setCustomRange({ ...customRange, startDate: e.target.value })}
                placeholder="Start date"
              />
              <span style={{ color: '#666' }}>→</span>
              <input
                type="date"
                className={styles.dateInput}
                value={customRange.endDate}
                onChange={(e) => setCustomRange({ ...customRange, endDate: e.target.value })}
                placeholder="End date"
              />
              <button
                className={styles.applyBtn}
                onClick={handleApplyCustomRange}
                disabled={!customRange.startDate || !customRange.endDate}
              >
                Apply
              </button>
            </div>
          )}

          <button
            onClick={handleRefresh}
            disabled={loading}
            className={styles.refreshBtn}
          >
            <RefreshCw size={18} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>
      </div>

      {/* ROW 1: KEY METRICS - 4 Main KPIs (Prominent) */}
      <div className={styles.kpiGrid}>
        {/* Total Revenue - KPI 1 */}
        <div className={`${styles.kpiCard} ${styles.kpiCardRevenue}`}>
          <div className={styles.kpiCardHeader}>
            <DollarSign size={24} style={{ color: '#1890ff' }} className={styles.kpiCardIcon} />
            <span className={styles.kpiCardLabel}>TOTAL REVENUE</span>
          </div>
          <div className={`${styles.kpiCardValue} ${styles.kpiCardValueRevenue}`}>
            {formatCurrency(totalRevenue)}
          </div>
          <div className={styles.kpiCardSubtitle}>
            <span className={`${styles.growthBadge} ${getGrowthClass(growthData.revenueGrowth)}`}>
              {formatGrowth(growthData.revenueGrowth)} vs last period
            </span>
          </div>
        </div>

        {/* Total Profit - KPI 2 */}
        <div className={`${styles.kpiCard} ${totalProfit >= 0 ? styles.kpiCardProfit : styles.kpiCardProfitNegative}`}>
          <div className={styles.kpiCardHeader}>
            <TrendingUp size={24} style={{ color: totalProfit >= 0 ? '#10b981' : '#ef4444' }} className={styles.kpiCardIcon} />
            <span className={styles.kpiCardLabel}>TOTAL PROFIT</span>
          </div>
          <div className={`${styles.kpiCardValue} ${totalProfit >= 0 ? styles.kpiCardValueProfit : styles.kpiCardValueProfitNegative}`}>
            {formatCurrency(totalProfit)}
          </div>
          <div className={styles.kpiCardSubtitle}>
            Margin: <strong>{profitMargin}%</strong>
            <span className={`${styles.growthBadgeSmall} ${getGrowthClass(growthData.profitGrowth)}`} style={{ marginLeft: '8px' }}>
              {formatGrowth(growthData.profitGrowth)}
            </span>
          </div>
        </div>

        {/* Total Orders - KPI 3 */}
        <div className={`${styles.kpiCard} ${styles.kpiCardOrders}`}>
          <div className={styles.kpiCardHeader}>
            <ShoppingCart size={24} style={{ color: '#722ed1' }} className={styles.kpiCardIcon} />
            <span className={styles.kpiCardLabel}>TOTAL ORDERS</span>
          </div>
          <div className={`${styles.kpiCardValue} ${styles.kpiCardValueOrders}`}>
            {totalOrders}
          </div>
          <div className={styles.kpiCardSubtitle}>
            <span className={`${styles.growthBadge} ${getGrowthClass(growthData.ordersGrowth)}`}>
              {formatGrowth(growthData.ordersGrowth)} vs last period
            </span>
          </div>
        </div>

        {/* Avg Order Value - KPI 4 */}
        <div className={`${styles.kpiCard} ${styles.kpiCardAOV}`}>
          <div className={styles.kpiCardHeader}>
            <CreditCard size={24} style={{ color: '#faad14' }} className={styles.kpiCardIcon} />
            <span className={styles.kpiCardLabel}>AVG ORDER VALUE</span>
          </div>
          <div className={`${styles.kpiCardValue} ${styles.kpiCardValueAOV}`}>
            {formatCurrency(totalOrders > 0 ? totalRevenue / totalOrders : 0)}
          </div>
          <div className={styles.kpiCardSubtitle}>
            per order (Conversion: {(customerStats?.repeatedPurchaseRate || 0).toFixed(2)}%)
          </div>
        </div>
      </div>

      {/* ROW 2: Revenue Trend Chart */}
      <div className={styles.chartContainer}>
        <OverallSalesCard
          chartData={revenueTrend}
          loading={loading}
          period={displayPeriodLabel}
          growth={growthData.revenueGrowth}
        />
      </div>

      {/* ROW 3: Cost Summary (Aligned with KPI design) */}
      <div className={styles.costSummaryGrid}>
        {/* Total Cost */}
        <div className={`${styles.kpiCard} ${styles.kpiCardCost}`}>
          <div className={styles.kpiCardHeader}>
            <ShoppingCart size={24} style={{ color: '#3b82f6' }} className={styles.kpiCardIcon} />
            <span className={styles.kpiCardLabel}>TOTAL COST</span>
          </div>
          <div className={`${styles.kpiCardValue} ${styles.kpiCardValueCost}`}>
            {formatCurrency(totalCost)}
          </div>
          <div className={styles.kpiCardSubtitle}>
            COGS + Shipping combined
          </div>
        </div>

        {/* Profit Margin */}
        <div className={`${styles.kpiCard} ${styles.kpiCardMargin}`}>
          <div className={styles.kpiCardHeader}>
            <TrendingUp size={24} style={{ color: '#f59e0b' }} className={styles.kpiCardIcon} />
            <span className={styles.kpiCardLabel}>PROFIT MARGIN</span>
          </div>
          <div className={`${styles.kpiCardValue} ${styles.kpiCardValueMargin}`}>
            {profitMargin}%
          </div>
          <div className={styles.kpiCardSubtitle}>
            of total revenue
          </div>
        </div>
      </div>

      {/* ROW 4: Expense Breakdown */}
      {expenseData && (
        <div className={styles.expenseBreakdownContainer}>
          <h3 className={styles.expenseTitle}>
            <Wallet size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Expense Breakdown
          </h3>
          <div className={styles.expenseGrid}>
            <div className={styles.expenseItem}>
              <span className={styles.expenseItemLabel}>
                <Package size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                PRODUCT COST (COGS)
              </span>
              <div className={`${styles.expenseItemValue} ${styles.expenseItemValueCOGS}`}>
                {formatCurrency(expenseData.totalProductCost || 0)}
              </div>
            </div>
            <div className={styles.expenseItem}>
              <span className={styles.expenseItemLabel}>
                <Truck size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                SHIPPING COST
              </span>
              <div className={`${styles.expenseItemValue} ${styles.expenseItemValueShipping}`}>
                {formatCurrency(expenseData.totalShippingCost || 0)}
              </div>
            </div>
            <div className={styles.expenseItem}>
              <span className={styles.expenseItemLabel}>
                <Wallet size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                TOTAL EXPENSE
              </span>
              <div className={`${styles.expenseItemValue} ${styles.expenseItemValueTotal}`}>
                {formatCurrency(expenseData.totalExpense || 0)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Selling Products Table */}
      <ProductsTable products={bestSellers} loading={loading} />
    </div>
  );
};

export default SellerDashboard;
