import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Progress,
  Segmented,
  Spin,
  message,
  Skeleton,
  Button,
} from 'antd';
import {
  DollarOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  AppstoreOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import dashboardService from '@services/api/dashboardService';
import cache, { CACHE_KEYS, CACHE_TTL } from '@utils/cache';
import styles from '@assets/styles/admin/AdminDashboard.module.css';

const AdminDashboard = () => {
  const [revenueView, setRevenueView] = useState('month');
  const [userGrowthView, setUserGrowthView] = useState('month');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data states
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
  const [revenueDataMonthly, setRevenueDataMonthly] = useState([]);
  const [revenueDataYearly, setRevenueDataYearly] = useState([]);
  const [userGrowthDataMonthly, setUserGrowthDataMonthly] = useState([]);
  const [userGrowthDataYearly, setUserGrowthDataYearly] = useState([]);

  // Fetch all dashboard data in one request with caching
  const fetchAllDashboardData = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);

      // Check cache first (unless force refresh)
      if (!forceRefresh) {
        const cachedData = cache.get(CACHE_KEYS.DASHBOARD_ALL);
        if (cachedData) {
          console.log('✅ Using cached dashboard data');
          populateDashboardData(cachedData);
          setLoading(false);
          return;
        }
      }

      console.log('🔄 Fetching fresh dashboard data...');
      const response = await dashboardService.getAllDashboardData({
        topProductsLimit: 5,
        recentOrdersLimit: 5,
      });

      if (response.success) {
        // Cache the data for 5 minutes
        cache.set(CACHE_KEYS.DASHBOARD_ALL, response.data, CACHE_TTL.MEDIUM);
        populateDashboardData(response.data);
        if (forceRefresh) {
          message.success('Dashboard refreshed successfully');
        }
      }
    } catch (error) {
      message.error('Failed to fetch dashboard data');
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Populate dashboard state from API response
  const populateDashboardData = (data) => {
    // Map overview stats with icons
    const statsWithIcons = data.overviewStats.map((stat, index) => {
      const icons = [
        { icon: <DollarOutlined />, color: '#4f46e5', prefix: '₫' },
        { icon: <ShoppingCartOutlined />, color: '#0891b2', prefix: '' },
        { icon: <UserOutlined />, color: '#16a34a', prefix: '' },
        { icon: <AppstoreOutlined />, color: '#d97706', prefix: '' },
      ];
      return {
        ...stat,
        ...icons[index],
      };
    });

    setOverviewStats(statsWithIcons);
    setTopProducts(data.topProducts.map((item, index) => ({ ...item, key: String(index + 1) })));
    setRecentOrders(data.recentOrders.map((item, index) => ({ ...item, key: String(index + 1) })));
    setCategorySales(data.categorySales);
    setRevenueDataMonthly(data.revenueData.monthly);
    setRevenueDataYearly(data.revenueData.yearly);
    setUserGrowthDataMonthly(data.userGrowth.monthly);
    setUserGrowthDataYearly(data.userGrowth.yearly);
    setQuickStats(data.quickStats);
  };

  // Handle manual refresh
  const handleRefresh = () => {
    setRefreshing(true);
    cache.remove(CACHE_KEYS.DASHBOARD_ALL);
    fetchAllDashboardData(true);
  };

  // Fetch data on mount
  useEffect(() => {
    fetchAllDashboardData();
  }, [fetchAllDashboardData]);

  const topProductsColumns = [
    {
      title: 'Product Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (category) => (category ? <Tag color="blue">{category}</Tag> : '-'),
    },
    {
      title: 'Sold',
      dataIndex: 'sold',
      key: 'sold',
      sorter: (a, b) => a.sold - b.sold,
    },
    {
      title: 'Revenue',
      dataIndex: 'revenue',
      key: 'revenue',
      render: (revenue) => (revenue != null ? `₫${revenue.toLocaleString()}` : '₫0'),
      sorter: (a, b) => a.revenue - b.revenue,
    },
    {
      title: 'Stock',
      dataIndex: 'stock',
      key: 'stock',
      render: (stock) =>
        stock != null ? (
          <Tag color={stock > 50 ? 'green' : stock > 20 ? 'orange' : 'red'}>{stock}</Tag>
        ) : (
          <Tag>N/A</Tag>
        ),
    },
  ];

  const recentOrdersColumns = [
    {
      title: 'Order ID',
      dataIndex: 'orderId',
      key: 'orderId',
    },
    {
      title: 'Customer',
      dataIndex: 'customer',
      key: 'customer',
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      render: (total) => (total != null ? `₫${total.toLocaleString()}` : '₫0'),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        if (!status) {
          return <Tag>Unknown</Tag>;
        }
        const colors = {
          delivered: 'green',
          shipping: 'blue',
          processing: 'orange',
          cancelled: 'red',
        };
        return <Tag color={colors[status] || 'default'}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
    },
  ];

  return (
    <div className={styles.adminDashboard}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}>
            <i className="bi bi-speedometer2" />
          </div>
          <div>
            <h1>Admin Dashboard</h1>
            <p>Welcome back! Here&apos;s what&apos;s happening with your store today.</p>
          </div>
        </div>
        <Button
          type="primary"
          icon={<ReloadOutlined spin={refreshing} />}
          onClick={handleRefresh}
          loading={refreshing}
          style={{ background: '#4f46e5', borderColor: '#4f46e5' }}
        >
          Refresh
        </Button>
      </div>

      {/* Overview Statistics */}
      <Row gutter={[16, 16]} className={styles.statsRow}>
        {loading
          ? // Skeleton loading for overview cards
            Array.from({ length: 4 }).map((_, index) => (
              <Col xs={24} sm={12} lg={6} key={index}>
                <Card className={styles.statCard}>
                  <Skeleton active paragraph={{ rows: 2 }} />
                </Card>
              </Col>
            ))
          : overviewStats.map((stat, index) => (
              <Col xs={24} sm={12} lg={6} key={index}>
                <Card className={styles.statCard}>
                  <div className={styles.statIcon} style={{ color: stat.color }}>
                    {stat.icon}
                  </div>
                  <Statistic
                    title={stat.title}
                    value={stat.value}
                    prefix={stat.prefix}
                    styles={{ value: { fontSize: '24px', fontWeight: 600 } }}
                  />
                  <div className={styles.statTrend}>
                    {stat.isPositive ? (
                      <span className={styles.trendUp}>
                        <ArrowUpOutlined /> {stat.trend}%
                      </span>
                    ) : (
                      <span className={styles.trendDown}>
                        <ArrowDownOutlined /> {Math.abs(stat.trend)}%
                      </span>
                    )}
                    <span className={styles.trendText}>vs last month</span>
                  </div>
                </Card>
              </Col>
            ))}
      </Row>

      {/* Category Sales Distribution & Quick Stats */}
      <Row gutter={[16, 16]} className={styles.contentRow}>
        <Col xs={24} lg={12}>
          <Card title="Sales by Category" className={styles.card}>
            {loading ? (
              <Skeleton active paragraph={{ rows: 5 }} />
            ) : (
              categorySales.map((category, index) => (
                <div key={index} className={styles.categoryItem}>
                  <div className={styles.categoryInfo}>
                    <span className={styles.categoryName}>{category.name}</span>
                    <span className={styles.categorySales}>₫{category.sales.toLocaleString()}</span>
                  </div>
                  <Progress
                    percent={category.percentage}
                    strokeColor={{
                      '0%': '#108ee9',
                      '100%': '#87d068',
                    }}
                    format={(percent) => `${percent}%`}
                  />
                </div>
              ))
            )}
          </Card>
        </Col>

        {/* Quick Stats */}
        <Col xs={24} lg={12}>
          <Card title="Quick Statistics" className={styles.card}>
            {loading ? (
              <Skeleton active paragraph={{ rows: 4 }} />
            ) : (
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <div className={styles.quickStat}>
                    <div className={styles.quickStatValue}>{quickStats.pendingOrders}</div>
                    <div className={styles.quickStatLabel}>Pending Orders</div>
                  </div>
                </Col>
                <Col span={12}>
                  <div className={styles.quickStat}>
                    <div className={styles.quickStatValue}>{quickStats.lowStockItems}</div>
                    <div className={styles.quickStatLabel}>Low Stock Items</div>
                  </div>
                </Col>
                <Col span={12}>
                  <div className={styles.quickStat}>
                    <div className={styles.quickStatValue}>{quickStats.newUsersToday}</div>
                    <div className={styles.quickStatLabel}>New Users Today</div>
                  </div>
                </Col>
                <Col span={12}>
                  <div className={styles.quickStat}>
                    <div className={styles.quickStatValue}>{quickStats.customerSatisfaction}</div>
                    <div className={styles.quickStatLabel}>Customer Satisfaction</div>
                  </div>
                </Col>
              </Row>
            )}
          </Card>
        </Col>
      </Row>

      {/* Revenue & Orders Chart */}
      <Row gutter={[16, 16]} className={styles.contentRow}>
        <Col xs={24} lg={16}>
          <Card
            title="Revenue & Orders Trend"
            extra={
              <Segmented
                options={[
                  { label: 'By Month', value: 'month' },
                  { label: 'By Year', value: 'year' },
                ]}
                value={revenueView}
                onChange={setRevenueView}
              />
            }
            className={styles.card}
          >
            {loading ? (
              <Skeleton active paragraph={{ rows: 8 }} />
            ) : (
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={revenueView === 'month' ? revenueDataMonthly : revenueDataYearly}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1890ff" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#1890ff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip
                    formatter={(value, name) => {
                      if (name === 'revenue') {
                        return [`₫${value.toLocaleString()}`, 'Revenue'];
                      }
                      return [value, 'Orders'];
                    }}
                  />
                  <Legend />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="revenue"
                    stroke="#1890ff"
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                    name="revenue"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="orders"
                    stroke="#52c41a"
                    strokeWidth={2}
                    name="orders"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </Card>
        </Col>

        {/* User Growth Chart */}
        <Col xs={24} lg={8}>
          <Card
            title="User Growth"
            extra={
              <Segmented
                options={[
                  { label: 'By Month', value: 'month' },
                  { label: 'By Year', value: 'year' },
                ]}
                value={userGrowthView}
                onChange={setUserGrowthView}
              />
            }
            className={styles.card}
          >
            {loading ? (
              <Skeleton active paragraph={{ rows: 8 }} />
            ) : (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart
                  data={userGrowthView === 'month' ? userGrowthDataMonthly : userGrowthDataYearly}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="users" fill="#722ed1" name="New Users" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
        </Col>
      </Row>

      {/* Top Selling Products */}
      <Row gutter={[16, 16]} className={styles.contentRow}>
        <Col xs={24}>
          <Card title="Top Selling Products" className={styles.card}>
            <Table
              columns={topProductsColumns}
              dataSource={topProducts}
              pagination={false}
              scroll={{ x: 800 }}
              loading={loading}
            />
          </Card>
        </Col>
      </Row>

      {/* Recent Orders */}
      <Row gutter={[16, 16]} className={styles.contentRow}>
        <Col xs={24}>
          <Card title="Recent Orders" className={styles.card}>
            <Table
              columns={recentOrdersColumns}
              dataSource={recentOrders}
              pagination={false}
              scroll={{ x: 800 }}
              loading={loading}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdminDashboard;
