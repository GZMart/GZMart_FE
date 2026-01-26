import { useState } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Progress, Segmented } from 'antd';
import {
  DollarOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  AppstoreOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
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
import styles from '@assets/styles/admin/AdminDashboard.module.css';

const AdminDashboard = () => {
  const [revenueView, setRevenueView] = useState('month');
  const [userGrowthView, setUserGrowthView] = useState('month');
  // Fake data for overview statistics
  const overviewStats = [
    {
      title: 'Total Revenue',
      value: 125000000,
      prefix: '₫',
      trend: 12.5,
      isPositive: true,
      icon: <DollarOutlined />,
      color: '#3f8600',
    },
    {
      title: 'Total Orders',
      value: 1234,
      trend: 8.2,
      isPositive: true,
      icon: <ShoppingCartOutlined />,
      color: '#1890ff',
    },
    {
      title: 'Total Users',
      value: 5678,
      trend: 15.3,
      isPositive: true,
      icon: <UserOutlined />,
      color: '#722ed1',
    },
    {
      title: 'Total Products',
      value: 456,
      trend: -2.4,
      isPositive: false,
      icon: <AppstoreOutlined />,
      color: '#eb2f96',
    },
  ];

  // Fake data for top selling products
  const topProducts = [
    {
      key: '1',
      name: 'iPhone 15 Pro Max',
      category: 'Electronics',
      sold: 234,
      revenue: 23400000,
      stock: 45,
    },
    {
      key: '2',
      name: 'Samsung Galaxy S24 Ultra',
      category: 'Electronics',
      sold: 187,
      revenue: 18700000,
      stock: 32,
    },
    {
      key: '3',
      name: 'MacBook Pro M3',
      category: 'Electronics',
      sold: 156,
      revenue: 31200000,
      stock: 21,
    },
    {
      key: '4',
      name: 'AirPods Pro 2',
      category: 'Electronics',
      sold: 143,
      revenue: 7150000,
      stock: 67,
    },
    {
      key: '5',
      name: 'Nike Air Max',
      category: 'Fashion',
      sold: 128,
      revenue: 6400000,
      stock: 89,
    },
  ];

  // Fake data for recent orders
  const recentOrders = [
    {
      key: '1',
      orderId: '#ORD-2026-0123',
      customer: 'Nguyễn Văn A',
      total: 1500000,
      status: 'delivered',
      date: '2026-01-23',
    },
    {
      key: '2',
      orderId: '#ORD-2026-0122',
      customer: 'Trần Thị B',
      total: 2300000,
      status: 'shipping',
      date: '2026-01-23',
    },
    {
      key: '3',
      orderId: '#ORD-2026-0121',
      customer: 'Lê Văn C',
      total: 890000,
      status: 'processing',
      date: '2026-01-22',
    },
    {
      key: '4',
      orderId: '#ORD-2026-0120',
      customer: 'Phạm Thị D',
      total: 3500000,
      status: 'delivered',
      date: '2026-01-22',
    },
    {
      key: '5',
      orderId: '#ORD-2026-0119',
      customer: 'Hoàng Văn E',
      total: 1200000,
      status: 'cancelled',
      date: '2026-01-21',
    },
  ];

  // Fake data for category sales distribution
  const categorySales = [
    { name: 'Electronics', percentage: 45, sales: 56250000 },
    { name: 'Fashion', percentage: 25, sales: 31250000 },
    { name: 'Home & Living', percentage: 15, sales: 18750000 },
    { name: 'Beauty', percentage: 10, sales: 12500000 },
    { name: 'Sports', percentage: 5, sales: 6250000 },
  ];

  // Fake data for revenue chart (by month - last 12 months)
  const revenueDataMonthly = [
    { period: 'Jan', revenue: 8500000, orders: 89 },
    { period: 'Feb', revenue: 9200000, orders: 95 },
    { period: 'Mar', revenue: 10100000, orders: 108 },
    { period: 'Apr', revenue: 9800000, orders: 102 },
    { period: 'May', revenue: 11500000, orders: 121 },
    { period: 'Jun', revenue: 12300000, orders: 134 },
    { period: 'Jul', revenue: 11800000, orders: 128 },
    { period: 'Aug', revenue: 13200000, orders: 145 },
    { period: 'Sep', revenue: 12600000, orders: 138 },
    { period: 'Oct', revenue: 14100000, orders: 156 },
    { period: 'Nov', revenue: 13800000, orders: 149 },
    { period: 'Dec', revenue: 15500000, orders: 172 },
  ];

  // Fake data for revenue chart (by year - last 5 years)
  const revenueDataYearly = [
    { period: '2021', revenue: 85000000, orders: 920 },
    { period: '2022', revenue: 102000000, orders: 1145 },
    { period: '2023', revenue: 118000000, orders: 1320 },
    { period: '2024', revenue: 134000000, orders: 1498 },
    { period: '2025', revenue: 152000000, orders: 1685 },
  ];

  // Fake data for user growth (by month - last 12 months)
  const userGrowthDataMonthly = [
    { period: 'Jan', users: 320 },
    { period: 'Feb', users: 385 },
    { period: 'Mar', users: 442 },
    { period: 'Apr', users: 501 },
    { period: 'May', users: 578 },
    { period: 'Jun', users: 645 },
    { period: 'Jul', users: 712 },
    { period: 'Aug', users: 798 },
    { period: 'Sep', users: 856 },
    { period: 'Oct', users: 923 },
    { period: 'Nov', users: 1012 },
    { period: 'Dec', users: 1098 },
  ];

  // Fake data for user growth (by year - last 5 years)
  const userGrowthDataYearly = [
    { period: '2021', users: 4250 },
    { period: '2022', users: 5680 },
    { period: '2023', users: 7120 },
    { period: '2024', users: 8890 },
    { period: '2025', users: 10560 },
  ];

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
      render: (category) => <Tag color="blue">{category}</Tag>,
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
      render: (revenue) => `₫${revenue.toLocaleString()}`,
      sorter: (a, b) => a.revenue - b.revenue,
    },
    {
      title: 'Stock',
      dataIndex: 'stock',
      key: 'stock',
      render: (stock) => (
        <Tag color={stock > 50 ? 'green' : stock > 20 ? 'orange' : 'red'}>{stock}</Tag>
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
      render: (total) => `₫${total.toLocaleString()}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colors = {
          delivered: 'green',
          shipping: 'blue',
          processing: 'orange',
          cancelled: 'red',
        };
        return <Tag color={colors[status]}>{status.toUpperCase()}</Tag>;
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
        <h1>Admin Dashboard</h1>
        <p>Welcome back! Here's what's happening with your store today.</p>
      </div>

      {/* Overview Statistics */}
      <Row gutter={[16, 16]} className={styles.statsRow}>
        {overviewStats.map((stat, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card className={styles.statCard}>
              <div className={styles.statIcon} style={{ color: stat.color }}>
                {stat.icon}
              </div>
              <Statistic
                title={stat.title}
                value={stat.value}
                prefix={stat.prefix}
                valueStyle={{ fontSize: '24px', fontWeight: 600 }}
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

      {/* Category Sales Distribution */}
      <Row gutter={[16, 16]} className={styles.contentRow}>
        <Col xs={24} lg={12}>
          <Card title="Sales by Category" className={styles.card}>
            {categorySales.map((category, index) => (
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
            ))}
          </Card>
        </Col>

        {/* Quick Stats */}
        <Col xs={24} lg={12}>
          <Card title="Quick Statistics" className={styles.card}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <div className={styles.quickStat}>
                  <div className={styles.quickStatValue}>234</div>
                  <div className={styles.quickStatLabel}>Pending Orders</div>
                </div>
              </Col>
              <Col span={12}>
                <div className={styles.quickStat}>
                  <div className={styles.quickStatValue}>45</div>
                  <div className={styles.quickStatLabel}>Low Stock Items</div>
                </div>
              </Col>
              <Col span={12}>
                <div className={styles.quickStat}>
                  <div className={styles.quickStatValue}>12</div>
                  <div className={styles.quickStatLabel}>New Users Today</div>
                </div>
              </Col>
              <Col span={12}>
                <div className={styles.quickStat}>
                  <div className={styles.quickStatValue}>98.5%</div>
                  <div className={styles.quickStatLabel}>Customer Satisfaction</div>
                </div>
              </Col>
            </Row>
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
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdminDashboard;
