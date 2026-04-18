import { useEffect, useState, useMemo } from 'react';
import PropTypes from 'prop-types';
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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { TrendingUp, Package, BarChart2, ChevronUp, ChevronDown } from 'lucide-react';
import { formatCurrency } from '../../../../utils/formatters';
import dashboardService from '../../../../services/api/dashboardService';

const { Text } = Typography;

const CHART_COLORS = {
  primary: '#3B82F6',
  revenue: '#3B82F6',
  cost: '#EF4444',
  positive: '#10B981',
  negative: '#EF4444',
  muted: '#94A3B8',
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

export function ProfitDetailModal({ open, onClose, period, customDateRange, comparison }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [profitData, setProfitData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState(period || '12months');

  useEffect(() => {
    if (open) {
      setSelectedPeriod(period || '12months');
    }
  }, [open, period]);

  useEffect(() => {
    if (!open) {
 return; 
}
    let cancelled = false;
    setLoading(true);

    Promise.all([
      dashboardService.getProfitLossAnalysis({ period: selectedPeriod, ...customDateRange }),
      dashboardService.getTopSellingProductsWithProfit({ limit: 10, period: selectedPeriod, ...customDateRange }),
    ])
      .then(([profitRes, productsRes]) => {
        if (cancelled) {
 return; 
}
        setProfitData(Array.isArray(profitRes?.data) ? profitRes.data : []);
        setTopProducts(Array.isArray(productsRes?.data) ? productsRes.data : []);
      })
      .catch(() => {
        if (!cancelled) {
 setProfitData([]); setTopProducts([]); 
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
  }, [open, selectedPeriod, customDateRange]);

  const totalRevenue = useMemo(() => profitData.reduce((s, d) => s + (d.revenue || 0), 0), [profitData]);
  const totalCost = useMemo(() => profitData.reduce((s, d) => s + (d.cost || 0), 0), [profitData]);
  const totalProfit = totalRevenue - totalCost;
  const isProfitPositive = totalProfit >= 0;

  const waterfallData = useMemo(() => {
    if (!profitData.length) {
 return []; 
}
    return profitData.slice(-12).map((d) => ({
      _id: d._id,
      revenue: d.revenue || 0,
      cost: -(d.cost || 0),
    }));
  }, [profitData]);

  const periodShortLabels = {
    '7days':    t('sellerDashboard.periodShort.7days', '7 Days'),
    '30days':   t('sellerDashboard.periodShort.30days', '30 Days'),
    '90days':   t('sellerDashboard.periodShort.90days', '90 Days'),
    '12months': t('sellerDashboard.periodShort.12months', '12 Months'),
    yearly:   t('sellerDashboard.periodShort.yearly', 'Last Year'),
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
      width: 80,
      align: 'right',
      render: (v) => <Text style={{ color: '#64748B' }}>{Number(v || 0).toLocaleString('vi-VN')}</Text>,
    },
    {
      title: t('sellerDashboard.topProducts.revenue', 'Doanh thu'),
      dataIndex: 'totalRevenue',
      key: 'totalRevenue',
      width: 120,
      align: 'right',
      render: (v) => <Text style={{ color: CHART_COLORS.primary, fontWeight: 600, fontSize: 13 }}>{formatCurrency(v || 0)}</Text>,
    },
    {
      title: t('sellerDashboard.profitDetail.cost', 'Chi phí'),
      dataIndex: 'cost',
      key: 'cost',
      width: 120,
      align: 'right',
      render: (v) => <Text style={{ color: CHART_COLORS.negative, fontSize: 13 }}>{formatCurrency(v || 0)}</Text>,
    },
    {
      title: t('sellerDashboard.topProducts.profit', 'Lợi nhuận'),
      dataIndex: 'profit',
      key: 'profit',
      width: 120,
      align: 'right',
      render: (v) => {
        const val = Number(v) || 0;
        return (
          <Text style={{ color: val >= 0 ? CHART_COLORS.positive : CHART_COLORS.negative, fontWeight: 700, fontSize: 13 }}>
            {formatCurrency(val)}
          </Text>
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

  const profitGrowth = comparison?.growth?.profit ?? 0;
  const isGrowthPositive = profitGrowth >= 0;

  return (
    <Modal
      title={
        <Space style={{ fontSize: 15 }}>
          <div style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: '#F0FDF4',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <TrendingUp size={15} color="#10B981" />
          </div>
          <span style={{ fontWeight: 600 }}>{t('sellerDashboard.profitDetail.title', 'Chi tiết lợi nhuận')}</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={960}
      destroyOnHidden
    >
      <Spin spinning={loading} tip={t('sellerDashboard.profitDetail.loading', 'Đang tải dữ liệu...')}>
        {/* Period selector */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
          {['7days', '30days', '90days', '12months', 'yearly'].map((p) => (
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
              {periodShortLabels[p]}
            </button>
          ))}
        </div>

        {/* P&L summary */}
        <Row gutter={12} style={{ marginBottom: 20 }}>
          <Col span={8}>
            <div style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: 12,
              padding: '14px 16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Text style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {t('sellerDashboard.profitDetail.totalRevenue', 'Tổng doanh thu')}
                </Text>
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: CHART_COLORS.primary, lineHeight: 1.2 }}>
                {formatCurrency(totalRevenue)}
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
                {t('sellerDashboard.profitDetail.totalCost', 'Tổng chi phí')}
              </Text>
              <div style={{ fontSize: 18, fontWeight: 700, color: CHART_COLORS.negative, lineHeight: 1.2, marginTop: 6 }}>
                {formatCurrency(totalCost)}
              </div>
            </div>
          </Col>
          <Col span={8}>
            <div style={{
              background: isProfitPositive ? '#F0FDF4' : '#FEF2F2',
              border: `1px solid ${isProfitPositive ? '#BBF7D0' : '#FECACA'}`,
              borderRadius: 12,
              padding: '14px 16px',
            }}>
              <Text style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {t('sellerDashboard.profitDetail.netProfit', 'Lợi nhuận ròng')}
              </Text>
              <div style={{
                fontSize: 18,
                fontWeight: 700,
                color: isProfitPositive ? CHART_COLORS.positive : CHART_COLORS.negative,
                lineHeight: 1.2,
                marginTop: 6,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}>
                {isProfitPositive ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                {formatCurrency(totalProfit)}
              </div>
            </div>
          </Col>
        </Row>

        {/* Comparison strip */}
        {comparison && typeof comparison.currentPeriod?.profit === 'number' && (
          <div style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: 10,
            padding: '10px 16px',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 20,
          }}>
            <Text style={{ fontSize: 12, color: '#64748B' }}>
              {t('sellerDashboard.profitDetail.profitThisPeriod', 'Lợi nhuận kỳ này')}:
            </Text>
            <Text strong style={{ fontSize: 13, color: '#1E293B' }}>
              {formatCurrency(comparison.currentPeriod.profit)}
            </Text>
            <div style={{ width: 1, height: 16, background: '#E2E8F0' }} />
            <Text style={{ fontSize: 12, color: '#94A3B8' }}>{t('sellerDashboard.profitDetail.profitPrevPeriod', 'Kỳ trước')}:</Text>
            <Text style={{ fontSize: 13, color: '#94A3B8' }}>
              {formatCurrency(comparison.previousPeriod?.profit || 0)}
            </Text>
            <div style={{ width: 1, height: 16, background: '#E2E8F0' }} />
            <Text strong style={{ fontSize: 13, color: isGrowthPositive ? CHART_COLORS.positive : CHART_COLORS.negative }}>
              {isGrowthPositive ? '+' : ''}{profitGrowth}%
            </Text>
          </div>
        )}

        <Divider style={{ margin: '0 0 16px', borderColor: '#F1F5F9' }} />

        {/* Revenue vs Cost chart */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart2 size={14} color={CHART_COLORS.primary} />
            <Text strong style={{ fontSize: 13, color: '#334155' }}>{t('sellerDashboard.profitDetail.chartTitle', 'Doanh thu & Chi phí theo kỳ')}</Text>
          </div>
          <Space size={16}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: CHART_COLORS.revenue }} />
              <Text style={{ fontSize: 11, color: '#94A3B8' }}>{t('sellerDashboard.profitDetail.revenue', 'Doanh thu')}</Text>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: CHART_COLORS.cost }} />
              <Text style={{ fontSize: 11, color: '#94A3B8' }}>{t('sellerDashboard.profitDetail.cost', 'Chi phí')}</Text>
            </div>
          </Space>
        </div>
        <div style={{ height: 200, marginBottom: 24 }}>
          {waterfallData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={waterfallData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="_id" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
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
                      return [formatCurrency(Math.abs(value)), t('sellerDashboard.profitDetail.revenue', 'Doanh thu')];
                    }
                    return [formatCurrency(Math.abs(value)), t('sellerDashboard.profitDetail.cost', 'Chi phí')];
                  }}
                  contentStyle={{
                    borderRadius: 10,
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    fontSize: 12,
                    background: '#FFFFFF',
                  }}
                />
                <ReferenceLine y={0} stroke="#CBD5E1" strokeWidth={1} />
                <Bar dataKey="revenue" fill={CHART_COLORS.revenue} radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="cost" fill={CHART_COLORS.cost} radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Empty description={t('sellerDashboard.profitDetail.noPLData', 'Không có dữ liệu P&L')} style={{ paddingTop: 40 }} />
          )}
        </div>

        <Divider style={{ margin: '0 0 16px', borderColor: '#F1F5F9' }} />

        {/* Top products by profit */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Package size={14} color={CHART_COLORS.positive} />
          <Text strong style={{ fontSize: 13, color: '#334155' }}>{t('sellerDashboard.profitDetail.topProfitProducts', 'Top sản phẩm lợi nhuận cao nhất')}</Text>
        </div>
        <Table
          columns={productColumns}
          dataSource={topProducts.map((p) => ({ ...p, key: p._id }))}
          pagination={{ pageSize: 6, size: 'small' }}
          size="small"
          scroll={{ x: 640 }}
          locale={{ emptyText: t('sellerDashboard.profitDetail.noProductData', 'Không có dữ liệu sản phẩm') }}
        />
      </Spin>
    </Modal>
  );
}

ProfitDetailModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  period: PropTypes.string,
  comparison: PropTypes.shape({
    growth: PropTypes.shape({
      profit: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    }),
    currentPeriod: PropTypes.shape({
      profit: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    }),
    previousPeriod: PropTypes.shape({
      profit: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    }),
  }),
};
