import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
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
  Segmented,
} from 'antd';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { TrendingUp, Package } from 'lucide-react';
import { formatCurrency } from '../../../../utils/formatters';
import dashboardService from '../../../../services/api/dashboardService';

const { Text } = Typography;

const PERIOD_LABELS = {
  daily: '30 Ngày',
  weekly: '13 Tuần',
  monthly: '12 Tháng',
  quarterly: '4 Quý',
  yearly: '5 Năm',
};

const CHART_COLORS = {
  profit: '#10B981',
  revenue: '#3B82F6',
  cost: '#EF4444',
  positive: '#10B981',
  negative: '#EF4444',
};

const periodBtnStyle = (active) => ({
  padding: '5px 14px',
  fontSize: 12,
  fontWeight: active ? 600 : 500,
  border: '1px solid',
  borderColor: active ? CHART_COLORS.positive : '#E2E8F0',
  borderRadius: 8,
  background: active ? '#F0FDF4' : '#FFFFFF',
  color: active ? CHART_COLORS.positive : '#64748B',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
});

export function TopProfitProductsModal({ open, onClose }) {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');

  useEffect(() => {
    if (open) {
      setSelectedPeriod('monthly');
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;
    setLoading(true);

    dashboardService
      .getTopSellingProductsWithProfit({ limit: 20, period: selectedPeriod })
      .then((res) => {
        if (cancelled) {
          return;
        }
        const arr = Array.isArray(res?.data) ? res.data : [];
        setProducts(arr);

        const top10 = arr.slice(0, 10);
        setChartData(
          top10.map((p) => ({
            name: (p?.name || '—').length > 20 ? `${p.name.slice(0, 18)}…` : p?.name || '—',
            revenue: p?.totalRevenue ?? p?.revenue ?? 0,
            profit: p?.profit ?? 0,
          })),
        );
      })
      .catch(() => {
        if (!cancelled) {
          setProducts([]);
          setChartData([]);
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

  const columns = [
    {
      title: 'Sản phẩm',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
      render: (v) => <Text strong style={{ fontSize: 13 }}>{v || '—'}</Text>,
    },
    {
      title: 'Đã bán',
      dataIndex: 'totalQuantity',
      key: 'totalQuantity',
      width: 90,
      align: 'right',
      render: (v) => (
        <Text style={{ color: '#64748B' }}>
          {Number(v || 0).toLocaleString('vi-VN')}
        </Text>
      ),
    },
    {
      title: 'Doanh thu',
      dataIndex: 'totalRevenue',
      key: 'totalRevenue',
      width: 130,
      align: 'right',
      render: (v) => (
        <Text style={{ color: CHART_COLORS.revenue, fontWeight: 600, fontSize: 13 }}>
          {formatCurrency(v || 0)}
        </Text>
      ),
    },
    {
      title: 'Chi phí',
      dataIndex: 'cost',
      key: 'cost',
      width: 130,
      align: 'right',
      render: (v) => (
        <Text style={{ color: CHART_COLORS.negative, fontSize: 13 }}>
          {formatCurrency(v || 0)}
        </Text>
      ),
    },
    {
      title: 'Lợi nhuận',
      dataIndex: 'profit',
      key: 'profit',
      width: 130,
      align: 'right',
      render: (v) => {
        const val = Number(v) || 0;
        return (
          <Text
            style={{
              color: val >= 0 ? CHART_COLORS.positive : CHART_COLORS.negative,
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            {formatCurrency(val)}
          </Text>
        );
      },
    },
    {
      title: 'Margin',
      dataIndex: 'profitMargin',
      key: 'profitMargin',
      width: 90,
      align: 'center',
      render: (v) =>
        typeof v === 'number' ? (
          <Tag
            color={v >= 20 ? 'success' : v >= 10 ? 'warning' : 'error'}
            style={{ borderRadius: 4, fontWeight: 600, fontSize: 11 }}
          >
            {v.toFixed(1)}%
          </Tag>
        ) : (
          '—'
        ),
    },
  ];

  return (
    <Modal
      title={
        <Space style={{ fontSize: 15 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: '#F0FDF4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <TrendingUp size={15} color="#10B981" />
          </div>
          <span style={{ fontWeight: 600 }}>Top sản phẩm lợi nhuận cao</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={900}
      destroyOnClose
    >
      <Spin spinning={loading} tip="Đang tải dữ liệu…">
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
          {['daily', 'weekly', 'monthly', 'quarterly', 'yearly'].map((p) => (
            <button
              key={p}
              onClick={() => setSelectedPeriod(p)}
              style={periodBtnStyle(selectedPeriod === p)}
              onMouseEnter={(e) => {
                if (selectedPeriod !== p) {
                  e.currentTarget.style.borderColor = '#86EFAC';
                  e.currentTarget.style.background = '#F0FDF4';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedPeriod !== p) {
                  e.currentTarget.style.borderColor = '#E2E8F0';
                  e.currentTarget.style.background = '#FFFFFF';
                }
              }}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>

        <Divider style={{ margin: '0 0 16px', borderColor: '#F1F5F9' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <BarChart size={14} color={CHART_COLORS.profit} />
          <Text strong style={{ fontSize: 13, color: '#334155' }}>
            Biểu đồ doanh thu & lợi nhuận — Top 10
          </Text>
        </div>
        <div style={{ height: 220, marginBottom: 24 }}>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#94A3B8' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => {
                    if (Math.abs(v) >= 1_000_000) {
                      return `${(Math.abs(v) / 1_000_000).toFixed(1)}M`;
                    }
                    if (Math.abs(v) >= 1_000) {
                      return `${(Math.abs(v) / 1_000).toFixed(0)}K`;
                    }
                    return v;
                  }}
                />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === 'revenue') {
                      return [formatCurrency(value), 'Doanh thu'];
                    }
                    return [formatCurrency(value), 'Lợi nhuận'];
                  }}
                  contentStyle={{
                    borderRadius: 10,
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    fontSize: 12,
                    background: '#FFFFFF',
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: 12, color: '#94A3B8' }}
                  formatter={(value) => (value === 'revenue' ? 'Doanh thu' : 'Lợi nhuận')}
                />
                <Bar dataKey="revenue" fill={CHART_COLORS.revenue} radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="profit" fill={CHART_COLORS.profit} radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Empty description="Không có dữ liệu sản phẩm" style={{ paddingTop: 40 }} />
          )}
        </div>

        <Divider style={{ margin: '0 0 16px', borderColor: '#F1F5F9' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Package size={14} color={CHART_COLORS.profit} />
          <Text strong style={{ fontSize: 13, color: '#334155' }}>
            Danh sách sản phẩm lợi nhuận cao
          </Text>
          <Text style={{ fontSize: 12, color: '#94A3B8', marginLeft: 4 }}>
            ({products.length} sản phẩm)
          </Text>
        </div>

        <Row gutter={12} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: 12,
                padding: '12px 16px',
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  color: '#94A3B8',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                Tổng doanh thu
              </Text>
              <div style={{ fontSize: 16, fontWeight: 700, color: CHART_COLORS.revenue, lineHeight: 1.3, marginTop: 4 }}>
                {formatCurrency(
                  products.reduce((s, p) => s + (p?.totalRevenue ?? p?.revenue ?? 0), 0),
                )}
              </div>
            </div>
          </Col>
          <Col span={8}>
            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: 12,
                padding: '12px 16px',
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  color: '#94A3B8',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                Tổng lợi nhuận
              </Text>
              <div style={{ fontSize: 16, fontWeight: 700, color: CHART_COLORS.profit, lineHeight: 1.3, marginTop: 4 }}>
                {formatCurrency(products.reduce((s, p) => s + (p?.profit ?? 0), 0))}
              </div>
            </div>
          </Col>
          <Col span={8}>
            <div
              style={{
                background: '#F0FDF4',
                border: '1px solid #BBF7D0',
                borderRadius: 12,
                padding: '12px 16px',
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  color: '#94A3B8',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                Margin TB
              </Text>
              <div style={{ fontSize: 16, fontWeight: 700, color: CHART_COLORS.profit, lineHeight: 1.3, marginTop: 4 }}>
                {(() => {
                  const totalRevenue = products.reduce((s, p) => s + (p?.totalRevenue ?? p?.revenue ?? 0), 0);
                  const totalProfit = products.reduce((s, p) => s + (p?.profit ?? 0), 0);
                  return totalRevenue > 0 ? `${((totalProfit / totalRevenue) * 100).toFixed(1)}%` : '—';
                })()}
              </div>
            </div>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={products.map((p) => ({ ...p, key: p._id }))}
          pagination={{ pageSize: 8, size: 'small' }}
          size="small"
          scroll={{ x: 720 }}
          locale={{ emptyText: 'Không có dữ liệu sản phẩm' }}
        />
      </Spin>
    </Modal>
  );
}

TopProfitProductsModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
