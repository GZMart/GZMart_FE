import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  Spin,
  Table,
  Tag,
  Space,
  Typography,
  Divider,
  Empty,
  Row,
  Col,
} from 'antd';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, Package, BarChart2, ChevronUp, ChevronDown } from 'lucide-react';
import { formatCurrency } from '../../../../utils/formatters';
import dashboardService from '../../../../services/api/dashboardService';

const { Text } = Typography;

const CHART_COLORS = {
  primary: '#3B82F6',
  secondary: '#60A5FA',
  positive: '#10B981',
  negative: '#EF4444',
  muted: '#94A3B8',
};

const periodBtnStyle = (active) => ({
  padding: '5px 14px',
  fontSize: 12,
  fontWeight: active ? 600 : 500,
  border: '1px solid',
  borderColor: active ? CHART_COLORS.primary : '#E2E8F0',
  borderRadius: 8,
  background: active ? '#EFF6FF' : '#FFFFFF',
  color: active ? CHART_COLORS.primary : '#64748B',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
});

function SummaryCard({ label, value, sub, icon: Icon, iconBg, iconColor, valueColor }) {
  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 12,
        padding: '14px 16px',
        transition: 'all 0.2s ease',
        cursor: 'default',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
        <div>
          <Text style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {label}
          </Text>
        </div>
        {Icon && (
          <div style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: iconBg || '#EFF6FF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Icon size={14} color={iconColor || CHART_COLORS.primary} />
          </div>
        )}
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, color: valueColor || '#1E293B', lineHeight: 1.2, marginBottom: 4 }}>
        {value}
      </div>
      {sub && (
        <Text style={{ fontSize: 11, color: '#94A3B8' }}>
          {sub}
        </Text>
      )}
    </div>
  );
}

export function RevenueDetailModal({ open, onClose, period, comparison }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [trendData, setTrendData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState(period || 'monthly');

  useEffect(() => {
    if (open) {
      setSelectedPeriod(period || 'monthly');
    }
  }, [open, period]);

  useEffect(() => {
    if (!open) {
      return;
    }
    let cancelled = false;
    setLoading(true);

    Promise.all([
      dashboardService.getRevenueTrend({ period: selectedPeriod }),
      dashboardService.getTopSellingProductsWithProfit({ limit: 10, period: selectedPeriod }),
    ])
      .then(([trendRes, productsRes]) => {
        if (cancelled) {
 return; 
}
        setTrendData(Array.isArray(trendRes?.data) ? trendRes.data : []);
        setTopProducts(Array.isArray(productsRes?.data) ? productsRes.data : []);
      })
      .catch(() => {
        if (!cancelled) {
 setTrendData([]); setTopProducts([]); 
}
      })
      .finally(() => {
        if (!cancelled) {
 setLoading(false); 
}
      });

    return () => {
 cancelled = true; 
};
  }, [open, selectedPeriod]);

  const growthVal = comparison?.growth?.revenue ?? 0;
  const isPositive = growthVal >= 0;

  const periodShortLabels = {
    daily: t('sellerDashboard.periodShort.daily', '30 Ngày'),
    weekly: t('sellerDashboard.periodShort.weekly', '13 Tuần'),
    monthly: t('sellerDashboard.periodShort.monthly', '12 Tháng'),
    quarterly: t('sellerDashboard.periodShort.quarterly', '4 Quý'),
    yearly: t('sellerDashboard.periodShort.yearly', '5 Năm'),
  };

  const productColumns = [
    {
      title: t('sellerDashboard.topProducts.product', 'Sản phẩm'),
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
      render: (v) => <Text strong style={{ fontSize: 13 }}>{v || '—'}</Text>,
    },
    {
      title: t('sellerDashboard.topProducts.sold', 'Đã bán'),
      dataIndex: 'totalQuantity',
      key: 'totalQuantity',
      width: 90,
      align: 'right',
      render: (v) => <Text style={{ color: '#64748B' }}>{Number(v || 0).toLocaleString('vi-VN')}</Text>,
    },
    {
      title: t('sellerDashboard.topProducts.revenue', 'Doanh thu'),
      dataIndex: 'totalRevenue',
      key: 'totalRevenue',
      width: 130,
      align: 'right',
      render: (v) => <Text strong style={{ color: CHART_COLORS.primary }}>{formatCurrency(v || 0)}</Text>,
    },
    {
      title: t('sellerDashboard.topProducts.profit', 'Lợi nhuận'),
      dataIndex: 'profit',
      key: 'profit',
      width: 130,
      align: 'right',
      render: (v) => {
        const val = Number(v) || 0;
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
            <Text style={{ color: val >= 0 ? CHART_COLORS.positive : CHART_COLORS.negative, fontWeight: 600, fontSize: 13 }}>
              {formatCurrency(val)}
            </Text>
          </div>
        );
      },
    },
    {
      title: t('sellerDashboard.topProducts.margin', 'Margin'),
      dataIndex: 'profitMargin',
      key: 'profitMargin',
      width: 80,
      align: 'center',
      render: (v) =>
        typeof v === 'number' ? (
          <Tag
            color={(v || 0) >= 20 ? 'success' : (v || 0) >= 10 ? 'warning' : 'error'}
            style={{ borderRadius: 4, fontWeight: 600, fontSize: 11 }}
          >
            {v.toFixed(1)}%
          </Tag>
        ) : '—',
    },
  ];

  return (
    <Modal
      title={
        <Space style={{ fontSize: 15 }}>
          <div style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: '#EFF6FF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <TrendingUp size={15} color={CHART_COLORS.primary} />
          </div>
          <span style={{ fontWeight: 600 }}>{t('sellerDashboard.revenueDetail.title', 'Chi tiết doanh thu')}</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={960}
      destroyOnHidden
    >
      <Spin spinning={loading} tip={t('sellerDashboard.revenueDetail.loading', 'Đang tải dữ liệu...')}>
        {/* Period selector */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
          {['daily', 'weekly', 'monthly', 'quarterly', 'yearly'].map((p) => (
            <button
              key={p}
              onClick={() => setSelectedPeriod(p)}
              style={periodBtnStyle(selectedPeriod === p)}
              onMouseEnter={(e) => {
                if (selectedPeriod !== p) {
                  e.currentTarget.style.borderColor = CHART_COLORS.secondary;
                  e.currentTarget.style.background = '#F8FAFC';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedPeriod !== p) {
                  e.currentTarget.style.borderColor = '#E2E8F0';
                  e.currentTarget.style.background = '#FFFFFF';
                }
              }}
            >
              {periodShortLabels[p]}
            </button>
          ))}
        </div>

        {/* Comparison summary — 3 cards */}
        {comparison ? (
          <Row gutter={12} style={{ marginBottom: 20 }}>
            <Col span={8}>
              <SummaryCard
                label={t('sellerDashboard.revenueDetail.thisPeriod', 'Kỳ này')}
                value={formatCurrency(comparison.currentPeriod?.revenue || 0)}
                sub={`${comparison.currentPeriod?.orders || 0} ${t('sellerDashboard.revenueDetail.ordersUnit', 'đơn')} · ${Number(comparison.currentPeriod?.quantity || 0).toLocaleString('vi-VN')} ${t('sellerDashboard.revenueDetail.itemsUnit', 'sản phẩm')}`}
                icon={ChevronUp}
                iconBg="#DCFCE7"
                iconColor={CHART_COLORS.positive}
                valueColor={CHART_COLORS.positive}
              />
            </Col>
            <Col span={8}>
              <SummaryCard
                label={t('sellerDashboard.revenueDetail.prevPeriod', 'Kỳ trước')}
                value={formatCurrency(comparison.previousPeriod?.revenue || 0)}
                sub={`${comparison.previousPeriod?.orders || 0} ${t('sellerDashboard.revenueDetail.ordersUnit', 'đơn')}`}
                icon={ChevronDown}
                iconBg="#FEE2E2"
                iconColor={CHART_COLORS.negative}
                valueColor={CHART_COLORS.muted}
              />
            </Col>
            <Col span={8}>
              <SummaryCard
                label={t('sellerDashboard.revenueDetail.growth', 'Tăng trưởng')}
                value={`${isPositive ? '+' : ''}${growthVal}%`}
                sub={`${isPositive ? '+' : ''}${comparison.growth?.orders || 0}% ${t('sellerDashboard.revenueDetail.ordersGrowth', '% đơn hàng')}`}
                icon={isPositive ? TrendingUp : TrendingUp}
                iconBg="#EFF6FF"
                iconColor={CHART_COLORS.primary}
                valueColor={CHART_COLORS.primary}
              />
            </Col>
          </Row>
        ) : (
          <div style={{ height: 88, marginBottom: 20 }} />
        )}

        <Divider style={{ margin: '0 0 16px', borderColor: '#F1F5F9' }} />

        {/* Revenue trend chart */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart2 size={14} color={CHART_COLORS.primary} />
            <Text strong style={{ fontSize: 13, color: '#334155' }}>{t('sellerDashboard.revenueDetail.chartTitle', 'Doanh thu theo thời gian')}</Text>
          </div>
          <Text style={{ fontSize: 11, color: '#94A3B8' }}>
            {t('sellerDashboard.revenueDetail.dataPoints', '{{count}} điểm dữ liệu', { count: trendData.length })}
          </Text>
        </div>
        <div style={{ height: 220, marginBottom: 24 }}>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="_id" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#94A3B8' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => {
                    if (v >= 1_000_000) {
 return `${(v / 1_000_000).toFixed(1)}M`; 
}
                    if (v >= 1_000) {
 return `${(v / 1_000).toFixed(0)}K`; 
}
                    return v;
                  }}
                />
                <Tooltip
                  formatter={(value) => [formatCurrency(value), t('sellerDashboard.topProducts.revenue', 'Doanh thu')]}
                  contentStyle={{
                    borderRadius: 10,
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    fontSize: 12,
                    background: '#FFFFFF',
                  }}
                  labelStyle={{ color: '#334155', fontWeight: 600 }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke={CHART_COLORS.primary}
                  strokeWidth={2.5}
                  dot={{ fill: CHART_COLORS.primary, r: 3, strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: CHART_COLORS.primary, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <Empty description={t('sellerDashboard.revenueDetail.noRevenueData', 'Không có dữ liệu doanh thu')} style={{ paddingTop: 60 }} />
          )}
        </div>

        <Divider style={{ margin: '0 0 16px', borderColor: '#F1F5F9' }} />

        {/* Top products */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Package size={14} color={CHART_COLORS.primary} />
          <Text strong style={{ fontSize: 13, color: '#334155' }}>{t('sellerDashboard.revenueDetail.topRevenueProducts', 'Top sản phẩm doanh thu cao')}</Text>
        </div>
        <Table
          columns={productColumns}
          dataSource={topProducts.map((p) => ({ ...p, key: p._id }))}
          pagination={{ pageSize: 6, size: 'small' }}
          size="small"
          scroll={{ x: 560 }}
          locale={{ emptyText: t('sellerDashboard.revenueDetail.noProductData', 'Không có dữ liệu sản phẩm') }}
          style={{ borderRadius: 10, overflow: 'hidden' }}
        />
      </Spin>
    </Modal>
  );
}
