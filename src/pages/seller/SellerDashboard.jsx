import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Empty,
  Spin,
  message,
  Tag,
  Button,
  Alert,
  Space,
  Tabs,
} from 'antd';
import {
  DollarOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  AlertOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  ReloadOutlined,
  EyeOutlined,
  LineChartOutlined,
  BarChartOutlined,
  RiseOutlined,
  FileTextOutlined,
  ThunderboltOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import dashboardService from '../../services/api/dashboardService';
import styles from '../../assets/styles/seller/Dashboard.module.css';

const SellerDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [trendsLoading, setTrendsLoading] = useState(false);

  // Fetch all dashboard data
  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const [dashResponse, trendResponse, comparisonResponse] = await Promise.all([
        dashboardService.getComplete(),
        dashboardService.getRevenueTrend({ period: 'daily' }),
        dashboardService.getComparison({ period: 'month' }),
      ]);

      setDashboardData(dashResponse.data);
      setRevenueTrend(trendResponse.data || []);
      setComparison(comparisonResponse.data);
    } catch (error) {
      message.error('Lỗi khi lấy dữ liệu dashboard');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className={styles.spinContainer}>
        <Spin size="large" tip="Đang tải dữ liệu..." />
      </div>
    );
  }

  if (!dashboardData) {
    return <Empty description="Không có dữ liệu" />;
  }

  const { revenue, bestSellers, lowStock, orderStats, customerStats } = dashboardData;

  // Color palette
  const colors = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2'];

  // Best sellers columns
  const bestSellersColumns = [
    {
      title: 'Sản phẩm',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      ellipsis: true,
    },
    {
      title: 'Giá gốc',
      key: 'price',
      width: 120,
      render: (_, record) => `${record.originalPrice?.toLocaleString('vi-VN')} ₫`,
    },
    {
      title: 'Đã bán',
      dataIndex: 'totalSold',
      key: 'totalSold',
      width: 100,
      render: (value) => <span style={{ fontWeight: 500 }}>{value}</span>,
    },
    {
      title: 'Doanh thu',
      key: 'revenue',
      width: 150,
      render: (_, record) => (
        <span style={{ color: '#52c41a', fontWeight: 500 }}>
          {record.totalRevenue?.toLocaleString('vi-VN')} ₫
        </span>
      ),
    },
  ];

  // Low stock columns
  const lowStockColumns = [
    {
      title: 'Sản phẩm',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      ellipsis: true,
    },
    {
      title: 'Tồn kho',
      dataIndex: 'stock',
      key: 'stock',
      width: 100,
      render: (value) => <Tag color={value < 10 ? 'red' : 'orange'}>{value}</Tag>,
    },
    {
      title: 'Models',
      key: 'models',
      width: 100,
      render: (_, record) => `${record.activeModels}/${record.totalModels}`,
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Button type="text" size="small" icon={<EyeOutlined />}>
          Chi tiết
        </Button>
      ),
    },
  ];

  // Order status distribution
  const orderStatusData = orderStats
    ? [
        { name: 'Đang xử lý', value: orderStats.processing },
        { name: 'Đã giao', value: orderStats.delivered },
        { name: 'Chờ xác nhận', value: orderStats.pending },
        { name: 'Đã hủy', value: orderStats.cancelled },
      ]
    : [];

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Dashboard</h1>
        <Button
          icon={<ReloadOutlined />}
          onClick={fetchDashboard}
          loading={loading}
        >
          Làm mới
        </Button>
      </div>

      {/* Revenue KPI Cards */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <DollarOutlined style={{ color: '#1890ff' }} />
          Doanh thu
        </h2>
        <Row gutter={[8, 8]} className={styles.kpiSection}>
          <Col xs={24} sm={12} md={6}>
            <Card className={styles.kpiCard}>
              <Statistic
                title="Hôm nay"
                value={revenue?.today || 0}
                prefix="₫"
                valueStyle={{ color: '#1890ff', fontSize: 14 }}
                formatter={(value) => value.toLocaleString('vi-VN')}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className={styles.kpiCard}>
              <Statistic
                title="Tuần này"
                value={revenue?.thisWeek || 0}
                prefix="₫"
                valueStyle={{ color: '#52c41a', fontSize: 14 }}
                formatter={(value) => value.toLocaleString('vi-VN')}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className={styles.kpiCard}>
              <Statistic
                title="Tháng này"
                value={revenue?.thisMonth || 0}
                prefix="₫"
                valueStyle={{ color: '#faad14', fontSize: 14 }}
                formatter={(value) => value.toLocaleString('vi-VN')}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className={styles.kpiCard}>
              <Statistic
                title="Tổng cộng"
                value={revenue?.total || 0}
                prefix="₫"
                valueStyle={{ color: '#f5222d', fontSize: 14 }}
                formatter={(value) => value.toLocaleString('vi-VN')}
              />
            </Card>
          </Col>
        </Row>
      </div>

      {/* Comparison Cards - Month over Month */}
      {comparison && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <BarChartOutlined style={{ color: '#52c41a' }} />
            So sánh với tháng trước
          </h2>
          <Row gutter={[8, 8]} className={styles.comparisonSection}>
            <Col xs={24} sm={8}>
              <Card className={styles.comparisonCard}>
                <div className={styles.metricName}>Đơn hàng</div>
                <div className={styles.metricsRow}>
                  <div className={styles.metricBox}>
                    <div className={styles.metricLabel}>Tháng này</div>
                    <div className={styles.metricValue}>
                      {comparison.currentPeriod?.orders || 0}
                    </div>
                  </div>
                  <div className={styles.compareArrow}>
                    {comparison.growth?.orders > 0 ? '↑' : '↓'}
                  </div>
                  <div className={styles.metricBox}>
                    <div className={styles.metricLabel}>Thay đổi</div>
                    <div
                      className={styles.growthValue}
                      style={{
                        color: comparison.growth?.orders > 0 ? '#52c41a' : '#f5222d',
                      }}
                    >
                      {comparison.growth?.orders > 0 ? '+' : ''}
                      {comparison.growth?.orders}%
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card className={styles.comparisonCard}>
                <div className={styles.metricName}>Doanh thu</div>
                <div className={styles.metricsRow}>
                  <div className={styles.metricBox}>
                    <div className={styles.metricLabel}>Tháng này</div>
                    <div className={styles.metricValue}>
                      {(comparison.currentPeriod?.revenue / 1000000).toFixed(1)}M ₫
                    </div>
                  </div>
                  <div className={styles.compareArrow}>
                    {comparison.growth?.revenue > 0 ? '↑' : '↓'}
                  </div>
                  <div className={styles.metricBox}>
                    <div className={styles.metricLabel}>Thay đổi</div>
                    <div
                      className={styles.growthValue}
                      style={{
                        color: comparison.growth?.revenue > 0 ? '#52c41a' : '#f5222d',
                      }}
                    >
                      {comparison.growth?.revenue > 0 ? '+' : ''}
                      {comparison.growth?.revenue}%
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card className={styles.comparisonCard}>
                <div className={styles.metricName}>Số lượng</div>
                <div className={styles.metricsRow}>
                  <div className={styles.metricBox}>
                    <div className={styles.metricLabel}>Tháng này</div>
                    <div className={styles.metricValue}>
                      {comparison.currentPeriod?.quantity || 0}
                    </div>
                  </div>
                  <div className={styles.compareArrow}>
                    {comparison.growth?.quantity > 0 ? '↑' : '↓'}
                  </div>
                  <div className={styles.metricBox}>
                    <div className={styles.metricLabel}>Thay đổi</div>
                    <div
                      className={styles.growthValue}
                      style={{
                        color: comparison.growth?.quantity > 0 ? '#52c41a' : '#f5222d',
                      }}
                    >
                      {comparison.growth?.quantity > 0 ? '+' : ''}
                      {comparison.growth?.quantity}%
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </div>
      )}

      {/* Key Metrics */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <RiseOutlined style={{ color: '#faad14' }} />
          Chỉ số chính
        </h2>
        <Row gutter={[8, 8]} className={styles.statsSection}>
          <Col xs={24} sm={12} md={6}>
            <Card className={styles.statBox}>
              <Statistic
                title="Tổng đơn hàng"
                value={orderStats?.total || 0}
                prefix={<ShoppingCartOutlined style={{ color: '#1890ff' }} />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className={styles.statBox}>
              <Statistic
                title="Tổng khách hàng"
                value={customerStats?.totalCustomers || 0}
                prefix={<UserOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className={styles.statBox}>
              <Statistic
                title="Tỷ lệ mua lại"
                value={customerStats?.repeatedPurchaseRate || 0}
                suffix="%"
                prefix={<UserOutlined style={{ color: '#faad14' }} />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className={styles.statBox}>
              <Statistic
                title="Tồn kho thấp"
                value={lowStock?.length || 0}
                prefix={<AlertOutlined style={{ color: '#f5222d' }} />}
                valueStyle={{ color: '#f5222d' }}
              />
            </Card>
          </Col>
        </Row>
      </div>

      {/* Charts Section */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <LineChartOutlined style={{ color: '#f5222d' }} />
          Biểu đồ & Thống kê
        </h2>
        <Row gutter={[8, 8]} className={styles.chartsSection}>
          {/* Revenue Trend Chart */}
          <Col xs={24} md={16}>
            <Card
              title="Xu hướng doanh thu"
              className={styles.chartCard}
            >
              {revenueTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="_id"
                      tick={{ fontSize: 12 }}
                      stroke="#999"
                    />
                    <YAxis stroke="#999" tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value) => `${(value / 1000000).toFixed(1)}M ₫`}
                      labelFormatter={(label) => `Ngày ${label}`}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#1890ff"
                      strokeWidth={2}
                      dot={{ fill: '#1890ff', r: 3 }}
                      name="Doanh thu"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <Empty description="Không có dữ liệu" />
              )}
            </Card>
          </Col>

          {/* Order Status Pie Chart */}
          <Col xs={24} md={8}>
            <Card
              title="Trạng thái đơn hàng"
              className={styles.chartCard}
            >
              {orderStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={orderStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name} (${value})`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {orderStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => value} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Empty description="Không có dữ liệu" />
              )}
            </Card>
          </Col>
        </Row>
      </div>

      {/* Tables Section */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <FileTextOutlined style={{ color: '#1890ff' }} />
          Dữ liệu chi tiết
        </h2>

        {/* Low Stock Alert */}
        {lowStock && lowStock.length > 0 && (
          <Card className={styles.alertCard} style={{ marginBottom: 12 }}>
            <Alert
              message={
                <span>
                  <WarningOutlined style={{ marginRight: 8, color: '#faad14' }} />
                  {lowStock.length} sản phẩm tồn kho thấp - cần nhập thêm hàng
                </span>
              }
              type="warning"
              showIcon={false}
            />
          </Card>
        )}

        {/* Tables Card with Tabs */}
        <Card className={styles.tableCard}>
          <Tabs
            items={[
              {
                key: 'bestsellers',
                label: (
                  <span>
                    <ThunderboltOutlined style={{ marginRight: 6, color: '#faad14' }} />
                    Top bán chạy
                  </span>
                ),
                children: (
                  <Spin spinning={loading}>
                    {bestSellers && bestSellers.length > 0 ? (
                      <Table
                        columns={bestSellersColumns}
                        dataSource={bestSellers}
                        rowKey="productId"
                        pagination={false}
                        size="small"
                        scroll={{ x: 600 }}
                      />
                    ) : (
                      <Empty description="Không có dữ liệu" />
                    )}
                  </Spin>
                ),
              },
              {
                key: 'lowstock',
                label: (
                  <span>
                    <AlertOutlined style={{ marginRight: 6, color: '#f5222d' }} />
                    Tồn kho thấp ({lowStock?.length || 0})
                  </span>
                ),
                children: (
                  <Spin spinning={loading}>
                    {lowStock && lowStock.length > 0 ? (
                      <Table
                        columns={lowStockColumns}
                        dataSource={lowStock}
                        rowKey="_id"
                        pagination={false}
                        size="small"
                        scroll={{ x: 600 }}
                      />
                    ) : (
                      <Empty description="Không có sản phẩm tồn kho thấp" />
                    )}
                  </Spin>
                ),
              },
            ]}
          />
        </Card>
      </div>
    </div>
  );
};

export default SellerDashboard;
