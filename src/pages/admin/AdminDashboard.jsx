import React, { useState, useEffect, useCallback } from 'react';
import { Offcanvas, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import dashboardService from '@services/api/dashboardService';
import { orderService } from '@services/api/orderService';
import cache, { CACHE_KEYS, CACHE_TTL } from '@utils/cache';
import styles from '@assets/styles/admin/AdminDashboard.module.css';

const FALLBACK_PRODUCT_IMAGE =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="88" height="88" viewBox="0 0 88 88"%3E%3Crect width="88" height="88" rx="12" fill="%23EEF2FF"/%3E%3Cpath d="M24 58V30a2 2 0 0 1 2-2h36a2 2 0 0 1 2 2v28" fill="none" stroke="%234F46E5" stroke-width="4" stroke-linecap="round"/%3E%3Ccircle cx="34" cy="38" r="4" fill="%234F46E5"/%3E%3Cpath d="m30 58 14-14 14 14" fill="none" stroke="%234F46E5" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/%3E%3C/svg%3E';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [revenueView, setRevenueView] = useState('week');
  const [userGrowthView, setUserGrowthView] = useState('week');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [apiError, setApiError] = useState('');

  const [overviewStats, setOverviewStats] = useState([]);
  const [quickStats, setQuickStats] = useState({
    pendingOrders: 0,
    lowStockItems: 0,
    newUsersToday: 0,
    customerSatisfaction: '0%',
  });
  const [topProducts, setTopProducts] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [categorySales, setCategorySales] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [showLowStockDrawer, setShowLowStockDrawer] = useState(false);
  const [lowStockLoading, setLowStockLoading] = useState(false);
  const [showOrderDrawer, setShowOrderDrawer] = useState(false);
  const [orderDetailLoading, setOrderDetailLoading] = useState(false);
  const [orderDetailError, setOrderDetailError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [revenueDataByView, setRevenueDataByView] = useState({
    week: [],
    month: [],
    quarter: [],
    year: [],
  });
  const [userGrowthDataByView, setUserGrowthDataByView] = useState({
    week: [],
    month: [],
    quarter: [],
    year: [],
  });

  const populateDashboardData = useCallback((rawData = {}) => {
    const data = {
      overviewStats: Array.isArray(rawData?.overviewStats) ? rawData.overviewStats : [],
      topProducts: Array.isArray(rawData?.topProducts) ? rawData.topProducts : [],
      recentOrders: Array.isArray(rawData?.recentOrders) ? rawData.recentOrders : [],
      categorySales: Array.isArray(rawData?.categorySales) ? rawData.categorySales : [],
      revenueData: {
        weekly: Array.isArray(rawData?.revenueData?.weekly) ? rawData.revenueData.weekly : [],
        monthly: Array.isArray(rawData?.revenueData?.monthly) ? rawData.revenueData.monthly : [],
        quarterly: Array.isArray(rawData?.revenueData?.quarterly)
          ? rawData.revenueData.quarterly
          : [],
        yearly: Array.isArray(rawData?.revenueData?.yearly) ? rawData.revenueData.yearly : [],
      },
      userGrowth: {
        weekly: Array.isArray(rawData?.userGrowth?.weekly) ? rawData.userGrowth.weekly : [],
        monthly: Array.isArray(rawData?.userGrowth?.monthly) ? rawData.userGrowth.monthly : [],
        quarterly: Array.isArray(rawData?.userGrowth?.quarterly)
          ? rawData.userGrowth.quarterly
          : [],
        yearly: Array.isArray(rawData?.userGrowth?.yearly) ? rawData.userGrowth.yearly : [],
      },
      quickStats: {
        pendingOrders: rawData?.quickStats?.pendingOrders || 0,
        lowStockItems: rawData?.quickStats?.lowStockItems || 0,
        newUsersToday: rawData?.quickStats?.newUsersToday || 0,
        customerSatisfaction: rawData?.quickStats?.customerSatisfaction || '0%',
      },
    };

    const icons = [
      { icon: 'payments', label: 'Total Revenue' },
      { icon: 'shopping_cart', label: 'Total Orders' },
      { icon: 'group', label: 'Platform Users' },
      { icon: 'inventory_2', label: 'Total Products' },
    ];

    const statsWithIcons = data.overviewStats.map((stat, index) => ({
      ...stat,
      ...icons[index],
    }));

    setOverviewStats(statsWithIcons);
    setTopProducts(data.topProducts.map((item, index) => ({ ...item, key: String(index + 1) })));
    setRecentOrders(
      data.recentOrders.map((item, index) => ({
        ...item,
        key: String(index + 1),
        customer: item.customer || item.userName || item.user || 'Unknown',
        status: item.status || item.orderStatus || 'unknown',
        total: item.total ?? item.totalPrice ?? item.totalAmount ?? 0,
      }))
    );
    setCategorySales(data.categorySales);
    setRevenueDataByView({
      week: data.revenueData.weekly,
      month: data.revenueData.monthly,
      quarter: data.revenueData.quarterly,
      year: data.revenueData.yearly,
    });
    setUserGrowthDataByView({
      week: data.userGrowth.weekly,
      month: data.userGrowth.monthly,
      quarter: data.userGrowth.quarterly,
      year: data.userGrowth.yearly,
    });
    setQuickStats(data.quickStats);
  }, []);

  const fetchAllDashboardData = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setApiError('');

      if (!forceRefresh) {
        const cachedData = cache.get(CACHE_KEYS.DASHBOARD_ALL);
        if (cachedData) {
          populateDashboardData(cachedData);
          setLoading(false);
          return;
        }
      }

      const response = await dashboardService.getAllDashboardData({
        topProductsLimit: 5,
        recentOrdersLimit: 5,
      });

      if (response.success) {
        cache.set(CACHE_KEYS.DASHBOARD_ALL, response.data, CACHE_TTL.MEDIUM);
        populateDashboardData(response.data);
      } else {
        throw new Error('Batch endpoint returned unsuccessful response');
      }
    } catch (error) {
      try {
        const [
          overviewStatsRes,
          topProductsRes,
          recentOrdersRes,
          categorySalesRes,
          revenueWeeklyRes,
          revenueMonthlyRes,
          revenueQuarterlyRes,
          revenueYearlyRes,
          userGrowthWeeklyRes,
          userGrowthMonthlyRes,
          userGrowthQuarterlyRes,
          userGrowthYearlyRes,
          quickStatsRes,
        ] = await Promise.allSettled([
          dashboardService.getOverviewStats(),
          dashboardService.getTopProducts({ limit: 5 }),
          dashboardService.getRecentOrders({ limit: 5 }),
          dashboardService.getCategorySales(),
          dashboardService.getRevenueData({ period: 'weekly' }),
          dashboardService.getRevenueData({ period: 'monthly' }),
          dashboardService.getRevenueData({ period: 'quarterly' }),
          dashboardService.getRevenueData({ period: 'yearly' }),
          dashboardService.getUserGrowth({ period: 'weekly' }),
          dashboardService.getUserGrowth({ period: 'monthly' }),
          dashboardService.getUserGrowth({ period: 'quarterly' }),
          dashboardService.getUserGrowth({ period: 'yearly' }),
          dashboardService.getQuickStats(),
        ]);

        const fallbackData = {
          overviewStats:
            overviewStatsRes.status === 'fulfilled' && overviewStatsRes.value?.success
              ? overviewStatsRes.value.data
              : [],
          topProducts:
            topProductsRes.status === 'fulfilled' && topProductsRes.value?.success
              ? topProductsRes.value.data
              : [],
          recentOrders:
            recentOrdersRes.status === 'fulfilled' && recentOrdersRes.value?.success
              ? recentOrdersRes.value.data
              : [],
          categorySales:
            categorySalesRes.status === 'fulfilled' && categorySalesRes.value?.success
              ? categorySalesRes.value.data
              : [],
          revenueData: {
            weekly:
              revenueWeeklyRes.status === 'fulfilled' && revenueWeeklyRes.value?.success
                ? revenueWeeklyRes.value.data
                : [],
            monthly:
              revenueMonthlyRes.status === 'fulfilled' && revenueMonthlyRes.value?.success
                ? revenueMonthlyRes.value.data
                : [],
            quarterly:
              revenueQuarterlyRes.status === 'fulfilled' && revenueQuarterlyRes.value?.success
                ? revenueQuarterlyRes.value.data
                : [],
            yearly:
              revenueYearlyRes.status === 'fulfilled' && revenueYearlyRes.value?.success
                ? revenueYearlyRes.value.data
                : [],
          },
          userGrowth: {
            weekly:
              userGrowthWeeklyRes.status === 'fulfilled' && userGrowthWeeklyRes.value?.success
                ? userGrowthWeeklyRes.value.data
                : [],
            monthly:
              userGrowthMonthlyRes.status === 'fulfilled' && userGrowthMonthlyRes.value?.success
                ? userGrowthMonthlyRes.value.data
                : [],
            quarterly:
              userGrowthQuarterlyRes.status === 'fulfilled' && userGrowthQuarterlyRes.value?.success
                ? userGrowthQuarterlyRes.value.data
                : [],
            yearly:
              userGrowthYearlyRes.status === 'fulfilled' && userGrowthYearlyRes.value?.success
                ? userGrowthYearlyRes.value.data
                : [],
          },
          quickStats:
            quickStatsRes.status === 'fulfilled' && quickStatsRes.value?.success
              ? quickStatsRes.value.data
              : {
                  pendingOrders: 0,
                  lowStockItems: 0,
                  newUsersToday: 0,
                  customerSatisfaction: '0%',
                },
        };

        const fulfilledCount = [
          overviewStatsRes,
          topProductsRes,
          recentOrdersRes,
          categorySalesRes,
          revenueWeeklyRes,
          revenueMonthlyRes,
          revenueQuarterlyRes,
          revenueYearlyRes,
          userGrowthWeeklyRes,
          userGrowthMonthlyRes,
          userGrowthQuarterlyRes,
          userGrowthYearlyRes,
          quickStatsRes,
        ].filter((result) => result.status === 'fulfilled').length;

        if (fulfilledCount === 0) {
          throw error;
        }

        cache.set(CACHE_KEYS.DASHBOARD_ALL, fallbackData, CACHE_TTL.SHORT);
        populateDashboardData(fallbackData);
        setApiError('Some dashboard APIs failed. The current data may be incomplete.');
      } catch (fallbackError) {
        console.error('Dashboard error:', fallbackError);
        setApiError('Unable to load dashboard data. Please try again later.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    cache.remove(CACHE_KEYS.DASHBOARD_ALL);
    fetchAllDashboardData(true);
  };

  const handleOpenLowStockDrawer = async () => {
    setShowLowStockDrawer(true);
    setLowStockLoading(true);

    try {
      const res = await dashboardService.getAdminLowStockItems({ threshold: 20, limit: 50 });
      if (res?.success) {
        setLowStockItems(Array.isArray(res.data) ? res.data : []);
      } else {
        setLowStockItems([]);
      }
    } catch (error) {
      console.error('Low stock fetch error:', error);
      setLowStockItems([]);
    } finally {
      setLowStockLoading(false);
    }
  };

  const handleOpenOrderDrawer = async (order) => {
    setShowOrderDrawer(true);
    setOrderDetailLoading(true);
    setOrderDetailError('');
    setSelectedOrder({
      ...order,
      details: null,
    });

    if (!order?._id) {
      setOrderDetailError('The internal order ID is missing, so details cannot be loaded.');
      setOrderDetailLoading(false);
      return;
    }

    try {
      const res = await orderService.getOrderById(order._id);
      if (res?.success) {
        setSelectedOrder((prev) => ({ ...prev, details: res.data }));
      } else {
        setOrderDetailError('Unable to load order details.');
      }
    } catch (error) {
      console.error('Order detail fetch error:', error);
      setOrderDetailError('Unable to load order details.');
    } finally {
      setOrderDetailLoading(false);
    }
  };

  useEffect(() => {
    fetchAllDashboardData();
  }, [fetchAllDashboardData]);

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
      case 'success':
        return 'bg-success bg-opacity-10 text-success';
      case 'processing':
      case 'shipping':
        return 'bg-primary bg-opacity-10 text-primary';
      case 'cancelled':
        return 'bg-danger bg-opacity-10 text-danger';
      default:
        return 'bg-secondary bg-opacity-10 text-secondary';
    }
  };

  const getProductImageSrc = (primaryImage, secondaryImage) =>
    primaryImage || secondaryImage || FALLBACK_PRODUCT_IMAGE;

  const handleOpenProductDetails = (productId) => {
    if (!productId) return;
    navigate(`/product/${productId}`);
  };

  const HoverInfoCard = ({ hint, className, children }) => (
    <div className={styles.hoverInfoWrap}>
      <div className={className}>{children}</div>
      <div className={styles.hoverInfoBubble}>{hint}</div>
    </div>
  );

  return (
    <div
      className="container-fluid"
      style={{
        maxWidth: '1600px',
        fontFamily: "'Inter', sans-serif",
        minHeight: '100vh',
      }}
    >
      {/* Header & Refresh Action */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-end gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1">Dashboard</h2>
          <p className="text-muted mb-0">Welcome back! Here's what's happening today.</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading || refreshing}
          className="btn text-white d-flex align-items-center gap-2 shadow-sm"
          style={{ backgroundColor: '#4f46e5', padding: '0.5rem 1.2rem', height: 'fit-content' }}
        >
          <span
            className={`material-symbols-outlined fs-6 ${refreshing ? styles.spinAnimation : ''}`}
          >
            refresh
          </span>
          Refresh Data
        </button>
      </div>

      {apiError && (
        <div className="alert alert-warning border-0 shadow-sm mb-4" role="alert">
          {apiError}
        </div>
      )}

      {/* Overview Stats Row */}
      <div className="row g-4 mb-4">
        {loading
          ? [...Array(4)].map((_, i) => (
              <div key={i} className="col-12 col-sm-6 col-xl-3">
                <div className="card border-0 shadow-sm rounded-4 h-100 p-4 placeholder-glow">
                  <span className="placeholder col-6 mb-3"></span>
                  <span className="placeholder col-8 placeholder-lg"></span>
                </div>
              </div>
            ))
          : overviewStats.map((stat, index) => (
              <div key={index} className="col-12 col-sm-6 col-xl-3">
                <HoverInfoCard
                  hint={`${stat.label || stat.title}: the percentage badge is calculated from the change between the latest full month and the month before it.`}
                  className={`card border-0 shadow-sm rounded-4 h-100 p-4 ${styles.statCard}`}
                >
                  <div className={styles.statIconBg}>
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: '6rem', fontVariationSettings: "'FILL' 1" }}
                    >
                      {stat.icon}
                    </span>
                  </div>
                  <div className="position-relative z-1">
                    <h6
                      className="text-muted text-uppercase fw-bold mb-3"
                      style={{ fontSize: '0.75rem', letterSpacing: '1px' }}
                    >
                      {stat.label || stat.title}
                    </h6>
                    <div className="d-flex align-items-end gap-2">
                      <h3 className="fw-bolder mb-0">
                        {stat.prefix}
                        {stat.value?.toLocaleString()}
                      </h3>
                      <span
                        className={`badge rounded-pill ${stat.isPositive ? 'bg-success bg-opacity-10 text-success' : 'bg-danger bg-opacity-10 text-danger'} d-flex align-items-center gap-1`}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>
                          {stat.isPositive ? 'trending_up' : 'trending_down'}
                        </span>
                        {stat.trend}%
                      </span>
                    </div>
                  </div>
                </HoverInfoCard>
              </div>
            ))}
      </div>

      {/* Charts Row */}
      <div className="row g-4 mb-4">
        {/* Left Column: Line Chart */}
        <div className="col-12 col-lg-8 d-flex flex-column gap-4">
          {/* Quick Stats Banner */}
          <HoverInfoCard
            hint="Quick Stats: a quick summary of pending orders, new users today, and low stock items."
            className="card border-0 shadow-sm rounded-4 bg-white"
          >
            <div className="card-body row text-center g-0 py-3">
              <div className="col border-end">
                <h3 className="fw-bold mb-0">{quickStats.pendingOrders}</h3>
                <small
                  className="text-muted text-uppercase fw-semibold"
                  style={{ fontSize: '0.7rem' }}
                >
                  Pending Orders
                </small>
              </div>
              <div className="col border-end">
                <h3 className="fw-bold mb-0">{quickStats.newUsersToday}</h3>
                <small
                  className="text-muted text-uppercase fw-semibold"
                  style={{ fontSize: '0.7rem' }}
                >
                  New Users Today
                </small>
              </div>
              <div className={`col ${styles.clickableStat}`} onClick={handleOpenLowStockDrawer}>
                <h3 className="fw-bold mb-0">{quickStats.lowStockItems}</h3>
                <small
                  className="text-muted text-uppercase fw-semibold"
                  style={{ fontSize: '0.7rem' }}
                >
                  Low Stock Items
                </small>
              </div>
            </div>
          </HoverInfoCard>

          {/* Revenue Area Chart */}
          <HoverInfoCard
            hint="Revenue & Orders: revenue and order volume for the selected time range (week, month, quarter, or year)."
            className="card border-0 shadow-sm rounded-4 flex-grow-1 p-4"
          >
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="fw-bold mb-0">Revenue & Orders</h5>
              <div className="btn-group btn-group-sm">
                <button
                  onClick={() => setRevenueView('week')}
                  className={`btn ${revenueView === 'week' ? 'btn-primary' : 'btn-outline-secondary'}`}
                >
                  Week
                </button>
                <button
                  onClick={() => setRevenueView('month')}
                  className={`btn ${revenueView === 'month' ? 'btn-primary' : 'btn-outline-secondary'}`}
                >
                  Month
                </button>
                <button
                  onClick={() => setRevenueView('quarter')}
                  className={`btn ${revenueView === 'quarter' ? 'btn-primary' : 'btn-outline-secondary'}`}
                >
                  Quarter
                </button>
                <button
                  onClick={() => setRevenueView('year')}
                  className={`btn ${revenueView === 'year' ? 'btn-primary' : 'btn-outline-secondary'}`}
                >
                  Year
                </button>
              </div>
            </div>
            <div style={{ height: '380px', width: '100%' }}>
              {!loading && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueDataByView[revenueView] || []}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e1e2e6" />
                    <XAxis
                      dataKey="period"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#777587', fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#777587', fontSize: 12 }}
                      dx={-10}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '8px',
                        border: 'none',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#4f46e5"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </HoverInfoCard>
        </div>

        {/* Right Column: Category Progress & Bar Chart */}
        <div className="col-12 col-lg-4 d-flex flex-column gap-4">
          {/* Category Sales */}
          <HoverInfoCard
            hint="Sales by Category: revenue split across categories to show which product groups contribute the most."
            className="card border-0 shadow-sm rounded-4 p-4"
          >
            <h5 className="fw-bold mb-4">Sales by Category</h5>
            <div className="d-flex flex-column gap-3">
              {loading ? (
                <div className="placeholder-glow">
                  <span className="placeholder col-12 h-50"></span>
                </div>
              ) : (
                categorySales.map((category, index) => (
                  <div key={index}>
                    <div
                      className="d-flex justify-content-between mb-1"
                      style={{ fontSize: '0.85rem' }}
                    >
                      <span className="fw-semibold text-secondary">{category.name}</span>
                      <span className="fw-bold">₫{category.sales?.toLocaleString()}</span>
                    </div>
                    <div className="progress" style={{ height: '6px' }}>
                      <div
                        className="progress-bar"
                        style={{ width: `${category.percentage}%`, backgroundColor: '#4f46e5' }}
                      ></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </HoverInfoCard>

          {/* User Growth Bar Chart */}
          <HoverInfoCard
            hint="User Growth: cumulative user growth for the selected time range."
            className="card border-0 shadow-sm rounded-4 p-4 flex-grow-1"
          >
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="fw-bold mb-0">User Growth</h5>
              <div className="btn-group btn-group-sm">
                <button
                  onClick={() => setUserGrowthView('week')}
                  className={`btn ${userGrowthView === 'week' ? 'btn-primary' : 'btn-outline-secondary'}`}
                >
                  Week
                </button>
                <button
                  onClick={() => setUserGrowthView('month')}
                  className={`btn ${userGrowthView === 'month' ? 'btn-primary' : 'btn-outline-secondary'}`}
                >
                  Month
                </button>
                <button
                  onClick={() => setUserGrowthView('quarter')}
                  className={`btn ${userGrowthView === 'quarter' ? 'btn-primary' : 'btn-outline-secondary'}`}
                >
                  Quarter
                </button>
                <button
                  onClick={() => setUserGrowthView('year')}
                  className={`btn ${userGrowthView === 'year' ? 'btn-primary' : 'btn-outline-secondary'}`}
                >
                  Year
                </button>
              </div>
            </div>
            <div style={{ height: '150px', width: '100%' }}>
              {!loading && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={userGrowthDataByView[userGrowthView] || []}>
                    <Tooltip
                      cursor={{ fill: '#f2f3f7' }}
                      contentStyle={{ borderRadius: '8px', border: 'none' }}
                    />
                    <Bar dataKey="users" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </HoverInfoCard>
        </div>
      </div>

      {/* Data Tables Row */}
      <div className="row g-4 mt-2 mb-4">
        {/* Top Products */}
        <div className="col-12 col-lg-6">
          <HoverInfoCard
            hint="Top Products: the best-selling products by units sold and revenue."
            className="card border-0 shadow-sm rounded-4 p-4 h-100"
          >
            <h5 className="fw-bold mb-4">Top Products</h5>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th className="text-muted text-uppercase" style={{ fontSize: '0.75rem' }}>
                      Product
                    </th>
                    <th className="text-muted text-uppercase" style={{ fontSize: '0.75rem' }}>
                      Category
                    </th>
                    <th
                      className="text-muted text-uppercase text-end"
                      style={{ fontSize: '0.75rem' }}
                    >
                      Revenue
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {!loading &&
                    topProducts.map((product) => (
                      <tr key={product.key}>
                        <td>
                          <div className={styles.productIdentity}>
                            <div className={styles.productInitial}>{product.name?.charAt(0)}</div>
                            <button
                              type="button"
                              className={`btn btn-link p-0 fw-semibold text-decoration-none ${styles.productNameBtn}`}
                              onClick={() =>
                                handleOpenProductDetails(product.productId || product._id)
                              }
                            >
                              {product.name}
                            </button>
                          </div>
                        </td>
                        <td>
                          <span
                            className={`badge bg-primary bg-opacity-10 text-primary py-2 px-2 ${styles.productCategoryBadge}`}
                          >
                            {product.category || 'N/A'}
                          </span>
                        </td>
                        <td className="text-end fw-bold">
                          ₫{product.revenue?.toLocaleString() || 0}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </HoverInfoCard>
        </div>

        {/* Recent Orders */}
        <div className="col-12 col-lg-6">
          <HoverInfoCard
            hint="Recent Orders: the latest orders with their status and payment value."
            className="card border-0 shadow-sm rounded-4 p-4 h-100"
          >
            <h5 className="fw-bold mb-4">Recent Orders</h5>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th className="text-muted text-uppercase" style={{ fontSize: '0.75rem' }}>
                      Order ID
                    </th>
                    <th className="text-muted text-uppercase" style={{ fontSize: '0.75rem' }}>
                      Customer
                    </th>
                    <th className="text-muted text-uppercase" style={{ fontSize: '0.75rem' }}>
                      Status
                    </th>
                    <th
                      className="text-muted text-uppercase text-end"
                      style={{ fontSize: '0.75rem' }}
                    >
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {!loading &&
                    recentOrders.map((order) => {
                      const badgeClass = getStatusBadgeClass(order.status);
                      return (
                        <tr key={order.key}>
                          <td className="fw-semibold text-primary">
                            <button
                              type="button"
                              className={`btn btn-link p-0 fw-semibold text-decoration-none ${styles.orderIdBtn}`}
                              onClick={() => handleOpenOrderDrawer(order)}
                            >
                              {order.orderId}
                            </button>
                          </td>
                          <td>{order.customer}</td>
                          <td>
                            <span className={`badge ${badgeClass} py-2 px-2`}>
                              {(order.status || 'Unknown').toUpperCase()}
                            </span>
                          </td>
                          <td className="text-end fw-bold">
                            ₫{order.total?.toLocaleString() || 0}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </HoverInfoCard>
        </div>
      </div>

      <Offcanvas
        show={showLowStockDrawer}
        onHide={() => setShowLowStockDrawer(false)}
        placement="end"
        className={styles.dashboardDrawer}
      >
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Low Stock Items</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          {lowStockLoading ? (
            <div className="d-flex align-items-center gap-2 text-muted">
              <Spinner animation="border" size="sm" />
              <span>Loading low stock items...</span>
            </div>
          ) : lowStockItems.length === 0 ? (
            <div className="text-muted">No low stock items found.</div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {lowStockItems.map((item) => (
                <div key={`${item.productId}-${item.modelId}`} className={styles.drawerListItem}>
                  <div className={styles.drawerProductRow}>
                    <img
                      src={getProductImageSrc(item.imageUrl)}
                      alt={item.productName || 'Product'}
                      className={styles.drawerProductImage}
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = FALLBACK_PRODUCT_IMAGE;
                      }}
                    />
                    <div className="flex-grow-1">
                      <div className="fw-semibold">{item.productName}</div>
                      <div className="small text-muted">SKU: {item.modelSku || 'N/A'}</div>
                      <div className="small text-muted">
                        Seller: {item.sellerName || 'Unknown seller'}
                      </div>
                    </div>
                  </div>
                  <div className="d-flex justify-content-between mt-1">
                    <span className="badge bg-danger-subtle text-danger-emphasis">
                      Stock: {item.stock}
                    </span>
                    <span className="small text-muted">Threshold: {item.threshold}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Offcanvas.Body>
      </Offcanvas>

      <Offcanvas
        show={showOrderDrawer}
        onHide={() => setShowOrderDrawer(false)}
        placement="end"
        className={styles.dashboardDrawer}
      >
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Order Details</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          {orderDetailLoading ? (
            <div className="d-flex align-items-center gap-2 text-muted">
              <Spinner animation="border" size="sm" />
              <span>Loading order details...</span>
            </div>
          ) : orderDetailError ? (
            <div className="alert alert-warning mb-0">{orderDetailError}</div>
          ) : (
            <div className="d-flex flex-column gap-3">
              <div className={styles.drawerListItem}>
                <div className="fw-semibold">
                  {selectedOrder?.details?.orderNumber || selectedOrder?.orderId}
                </div>
                <div className="small text-muted">
                  Customer:{' '}
                  {selectedOrder?.details?.userId?.fullName ||
                    selectedOrder?.details?.userId?.name ||
                    selectedOrder?.customer ||
                    'Unknown'}
                </div>
                <div className="small text-muted">
                  Status:{' '}
                  {(
                    selectedOrder?.details?.status ||
                    selectedOrder?.status ||
                    'unknown'
                  ).toUpperCase()}
                </div>
                <div className="small text-muted">
                  Total: ₫
                  {(
                    selectedOrder?.details?.totalPrice ||
                    selectedOrder?.details?.totalAmount ||
                    selectedOrder?.total ||
                    0
                  ).toLocaleString()}
                </div>
                <div className="small text-muted">
                  Payment: {(selectedOrder?.details?.paymentStatus || 'unknown').toUpperCase()}
                </div>
              </div>

              <div>
                <h6 className="fw-semibold mb-2">Items</h6>
                {selectedOrder?.details?.items?.length ? (
                  <div className="d-flex flex-column gap-2">
                    {selectedOrder.details.items.map((item) => (
                      <div key={item._id} className={styles.drawerListItem}>
                        <div className={styles.drawerProductRow}>
                          <img
                            src={getProductImageSrc(
                              item.productId?.images?.[0],
                              item.productId?.image
                            )}
                            alt={item.productId?.name || 'Product'}
                            className={styles.drawerProductImage}
                            loading="lazy"
                            onError={(e) => {
                              e.currentTarget.src = FALLBACK_PRODUCT_IMAGE;
                            }}
                          />
                          <div className="flex-grow-1">
                            <div className="fw-semibold">{item.productId?.name || 'Product'}</div>
                            <div className="small text-muted">Qty: {item.quantity || 0}</div>
                            <div className="small text-muted">
                              Subtotal: ₫{(item.subtotal || 0).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="small text-muted">No item details available.</div>
                )}
              </div>
            </div>
          )}
        </Offcanvas.Body>
      </Offcanvas>
    </div>
  );
};

export default AdminDashboard;
