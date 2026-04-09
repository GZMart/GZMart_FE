import { useEffect, useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  Spin,
  Table,
  Space,
  Typography,
  Divider,
  Empty,
  Row,
  Col,
} from 'antd';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { DollarSign, TrendingUp, TrendingDown, BarChart2, ShoppingCart } from 'lucide-react';
import { formatCurrency } from '../../../../utils/formatters';
import dashboardService from '../../../../services/api/dashboardService';

const { Text } = Typography;

const BUCKET_COLORS = ['#EF4444', '#F97316', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'];

export function AOVDetailModal({ open, onClose, _period, comparison }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    if (!open) {
 return; 
}
    let cancelled = false;
    setLoading(true);

    dashboardService
      .getSellerRecentOrders({ limit: 100 })
      .then((res) => {
        if (cancelled) {
 return; 
}
        setRecentOrders(Array.isArray(res?.data) ? res.data : []);
      })
      .catch(() => {
        if (!cancelled) {
 setRecentOrders([]); 
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
  }, [open]);

  const aovBuckets = useMemo(() => {
    if (!recentOrders.length) {
 return []; 
}
    const buckets = [
      { range: '< 100K', min: 0, max: 100_000, count: 0 },
      { range: '100K–250K', min: 100_000, max: 250_000, count: 0 },
      { range: '250K–500K', min: 250_000, max: 500_000, count: 0 },
      { range: '500K–1M', min: 500_000, max: 1_000_000, count: 0 },
      { range: '1M–2M', min: 1_000_000, max: 2_000_000, count: 0 },
      { range: '> 2M', min: 2_000_000, max: Infinity, count: 0 },
    ];
    recentOrders.forEach((o) => {
      const v = o.totalPrice || 0;
      const bucket = buckets.find((b) => v >= b.min && v < b.max);
      if (bucket) {
 bucket.count++; 
}
    });
    return buckets.map((b, i) => ({ ...b, color: BUCKET_COLORS[i] }));
  }, [recentOrders]);

  const topOrders = useMemo(() => [...recentOrders]
    .sort((a, b) => (b.totalPrice || 0) - (a.totalPrice || 0))
    .slice(0, 5), [recentOrders]);

  const currAov =
    comparison?.currentPeriod?.orders > 0
      ? (comparison.currentPeriod.revenue || 0) / comparison.currentPeriod.orders
      : null;
  const prevAov =
    comparison?.previousPeriod?.orders > 0
      ? (comparison.previousPeriod.revenue || 0) / comparison.previousPeriod.orders
      : null;
  const aovGrowth = prevAov && prevAov > 0 && currAov
    ? Math.round(((currAov - prevAov) / prevAov) * 100)
    : 0;
  const isPositiveAov = aovGrowth >= 0;

  const topOrderColumns = [
    {
      title: t('sellerDashboard.aovDetail.orderCode', 'Mã đơn'),
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      width: 140,
      render: (v) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            background: '#F0FDF4',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <ShoppingCart size={11} color="#10B981" />
          </div>
          <Text strong style={{ fontSize: 13 }}>{v}</Text>
        </div>
      ),
    },
    {
      title: t('sellerDashboard.aovDetail.customer', 'Khách hàng'),
      dataIndex: 'customer',
      key: 'customer',
      ellipsis: true,
      render: (v) => <Text style={{ fontSize: 13 }}>{v}</Text>,
    },
    {
      title: t('sellerDashboard.aovDetail.orderValue', 'Giá trị đơn'),
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      align: 'right',
      width: 130,
      render: (v) => (
        <Text strong style={{ color: '#3B82F6', fontSize: 13 }}>
          {formatCurrency(v || 0)}
        </Text>
      ),
    },
    {
      title: t('sellerDashboard.aovDetail.date', 'Ngày'),
      dataIndex: 'createdAtStr',
      key: 'createdAtStr',
      width: 130,
      render: (v) => <Text style={{ fontSize: 12, color: '#94A3B8' }}>{v}</Text>,
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
            background: '#FFF7ED',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <DollarSign size={15} color="#F97316" />
          </div>
          <span style={{ fontWeight: 600 }}>{t('sellerDashboard.aovDetail.title', 'Chi tiết giá trị trung bình / đơn')}</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={860}
      destroyOnHidden
    >
      <Spin spinning={loading} tip={t('sellerDashboard.aovDetail.loading', 'Đang tải dữ liệu...')}>
        {/* AOV summary */}
        <Row gutter={12} style={{ marginBottom: 20 }}>
          <Col span={8}>
            <div style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: 12,
              padding: '14px 16px',
            }}>
              <Text style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {t('sellerDashboard.aovDetail.aovThisPeriod', 'AOV kỳ này')}
              </Text>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#3B82F6', marginTop: 6, lineHeight: 1.2 }}>
                {currAov != null ? formatCurrency(currAov) : '—'}
              </div>
            </div>
          </Col>
          <Col span={8}>
            <div style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: 12,
              padding: '14px 16px',
            }}>
              <Text style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {t('sellerDashboard.aovDetail.aovPrevPeriod', 'AOV kỳ trước')}
              </Text>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#94A3B8', marginTop: 6, lineHeight: 1.2 }}>
                {prevAov != null ? formatCurrency(prevAov) : '—'}
              </div>
            </div>
          </Col>
          <Col span={8}>
            <div style={{
              background: isPositiveAov ? '#F0FDF4' : '#FEF2F2',
              border: `1px solid ${isPositiveAov ? '#BBF7D0' : '#FECACA'}`,
              borderRadius: 12,
              padding: '14px 16px',
            }}>
              <Text style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {t('sellerDashboard.aovDetail.aovGrowth', 'Tăng trưởng AOV')}
              </Text>
              <div style={{
                fontSize: 20,
                fontWeight: 700,
                color: isPositiveAov ? '#10B981' : '#EF4444',
                marginTop: 6,
                lineHeight: 1.2,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}>
                {isPositiveAov ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                {isPositiveAov ? '+' : ''}{aovGrowth}%
              </div>
            </div>
          </Col>
        </Row>

        <Divider style={{ margin: '0 0 16px', borderColor: '#F1F5F9' }} />

        {/* Distribution chart */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart2 size={14} color="#F97316" />
            <Text strong style={{ fontSize: 13, color: '#334155' }}>
              {t('sellerDashboard.aovDetail.distributionTitle', 'Phân bố giá trị đơn hàng')}
            </Text>
          </div>
          <Text style={{ fontSize: 11, color: '#94A3B8' }}>
            {recentOrders.length} {t('sellerDashboard.aovDetail.recentOrders', 'đơn gần nhất')}
          </Text>
        </div>
        <div style={{ height: 200, marginBottom: 24 }}>
          {aovBuckets.some((b) => b.count > 0) ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={aovBuckets} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  formatter={(value) => [`${value} ${t('sellerDashboard.ordersDetail.ordersUnit', 'đơn')}`, t('sellerDashboard.ordersDetail.items', 'Sản phẩm')]}
                  cursor={{ fill: '#F8FAFC' }}
                  contentStyle={{
                    borderRadius: 10,
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    fontSize: 12,
                    background: '#FFFFFF',
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={56}>
                  {aovBuckets.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Empty description={t('sellerDashboard.aovDetail.noDistribution', 'Không có dữ liệu phân bố')} style={{ paddingTop: 40 }} />
          )}
        </div>

        <Divider style={{ margin: '0 0 16px', borderColor: '#F1F5F9' }} />

        {/* Top 5 highest-value orders */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <ShoppingCart size={14} color="#10B981" />
          <Text strong style={{ fontSize: 13, color: '#334155' }}>{t('sellerDashboard.aovDetail.topHighestValue', 'Đơn giá trị cao nhất')}</Text>
        </div>
        <Table
          columns={topOrderColumns}
          dataSource={topOrders.map((o) => ({ ...o, key: o._id }))}
          pagination={false}
          size="small"
          scroll={{ x: 560 }}
          locale={{ emptyText: t('sellerDashboard.aovDetail.noOrders', 'Không có đơn hàng') }}
        />
      </Spin>
    </Modal>
  );
}

AOVDetailModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  _period: PropTypes.string,
  comparison: PropTypes.shape({
    currentPeriod: PropTypes.shape({
      orders: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      revenue: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    }),
    previousPeriod: PropTypes.shape({
      orders: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      revenue: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    }),
  }),
};
