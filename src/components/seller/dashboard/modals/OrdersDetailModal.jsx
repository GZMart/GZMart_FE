import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { Modal, Spin, Table, Tag, Space, Typography } from 'antd';
import { ShoppingCart, Package, Clock, ArrowRight } from 'lucide-react';
import { formatCurrency } from '../../../../utils/formatters';
import dashboardService from '../../../../services/api/dashboardService';
import { useNavigate } from 'react-router-dom';

const { Text } = Typography;

const STATUS_COLORS = {
  pending: 'default',
  confirmed: 'processing',
  packing: 'warning',
  shipping: 'warning',
  shipped: 'warning',
  delivered: 'success',
  delivered_pending_confirmation: 'success',
  completed: 'success',
  processing: 'processing',
  cancelled: 'error',
  refunded: 'error',
  refund_pending: 'warning',
  under_investigation: 'warning',
};

const STATUS_ICONS = {
  pending: { bg: '#FEF3C7', color: '#D97706' },
  confirmed: { bg: '#DBEAFE', color: '#2563EB' },
  packing: { bg: '#FED7AA', color: '#EA580C' },
  shipping: { bg: '#FED7AA', color: '#EA580C' },
  shipped: { bg: '#FED7AA', color: '#EA580C' },
  delivered: { bg: '#D1FAE5', color: '#059669' },
  delivered_pending_confirmation: { bg: '#D1FAE5', color: '#059669' },
  completed: { bg: '#D1FAE5', color: '#059669' },
  processing: { bg: '#DBEAFE', color: '#2563EB' },
  cancelled: { bg: '#FEE2E2', color: '#DC2626' },
  refunded: { bg: '#FEE2E2', color: '#DC2626' },
  refund_pending: { bg: '#FEF3C7', color: '#D97706' },
  under_investigation: { bg: '#FED7AA', color: '#EA580C' },
};

export function OrdersDetailModal({ open, onClose, _period, comparison }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!open) {
 return; 
}
    let cancelled = false;
    setLoading(true);
    setPage(1);

    dashboardService
      .getSellerRecentOrders({ limit: 20 })
      .then((res) => {
        if (cancelled) {
 return; 
}
        setOrders(Array.isArray(res?.data) ? res.data : []);
      })
      .catch(() => {
        if (!cancelled) {
 setOrders([]); 
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

  const ordersGrowth = comparison?.growth?.orders ?? 0;
  const isPositive = ordersGrowth >= 0;

  const columns = [
    {
      title: t('sellerDashboard.ordersDetail.orderCode', 'Mã đơn'),
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      width: 150,
      render: (v, record) => (
        <div
          onClick={() => {
            onClose();
            navigate(`/seller/orders/${record._id}`);
          }}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              background: '#EFF6FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ShoppingCart size={12} color="#3B82F6" />
          </div>
          <Text strong style={{ fontSize: 13, color: '#3B82F6' }}>
            {v}
          </Text>
        </div>
      ),
    },
    {
      title: t('sellerDashboard.ordersDetail.customer', 'Khách hàng'),
      dataIndex: 'customer',
      key: 'customer',
      width: 150,
      render: (v, record) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Text strong style={{ fontSize: 13 }}>
            {v}
          </Text>
          <Text style={{ fontSize: 11, color: '#94A3B8' }}>
            {record.phone || record.email || '—'}
          </Text>
        </div>
      ),
    },
    {
      title: t('sellerDashboard.ordersDetail.value', 'Giá trị'),
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      width: 130,
      align: 'right',
      render: (v) => (
        <Text strong style={{ fontSize: 13, color: '#1E293B' }}>
          {formatCurrency(v || 0)}
        </Text>
      ),
    },
    {
      title: t('sellerDashboard.ordersDetail.items', 'Sản phẩm'),
      dataIndex: 'itemsCount',
      key: 'itemsCount',
      width: 80,
      align: 'center',
      render: (v) => (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: 6,
            padding: '2px 8px',
            fontSize: 12,
            color: '#64748B',
          }}
        >
          <Package size={10} />
          {v} {t('sellerDashboard.ordersDetail.itemsUnit', 'sp')}
        </div>
      ),
    },
    {
      title: t('sellerDashboard.ordersDetail.status', 'Trạng thái'),
      dataIndex: 'status',
      key: 'status',
      width: 150,
      render: (_, record) => {
        const cfg = STATUS_ICONS[record.status] || { bg: '#F8FAFC', color: '#64748B' };
        return (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: cfg.bg,
              borderRadius: 8,
              padding: '4px 10px',
            }}
          >
            <Tag
              color={STATUS_COLORS[record.status] || 'default'}
              style={{ margin: 0, borderRadius: 4, fontSize: 11, fontWeight: 600 }}
            >
              {record.statusLabel || record.status}
            </Tag>
          </div>
        );
      },
    },
    {
      title: t('sellerDashboard.ordersDetail.createdAt', 'Ngày tạo'),
      dataIndex: 'createdAtStr',
      key: 'createdAtStr',
      width: 140,
      render: (v) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Clock size={11} color="#94A3B8" />
          <Text style={{ fontSize: 12, color: '#94A3B8' }}>{v}</Text>
        </div>
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
              background: '#EFF6FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ShoppingCart size={15} color="#3B82F6" />
          </div>
          <span style={{ fontWeight: 600 }}>{t('sellerDashboard.ordersDetail.title', 'Chi tiết đơn hàng')}</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          <Text style={{ fontSize: 12, color: '#94A3B8' }}>{orders.length} {t('sellerDashboard.ordersDetail.recentOrders', 'đơn gần nhất')}</Text>
          <div
            onClick={() => {
              onClose();
              navigate('/seller/orders');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              color: '#3B82F6',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.gap = '8px')}
            onMouseLeave={(e) => (e.currentTarget.style.gap = '4px')}
          >
            {t('sellerDashboard.ordersDetail.viewAllOrders', 'Xem tất cả đơn hàng')} <ArrowRight size={13} />
          </div>
        </div>
      }
      width={1000}
      destroyOnClose
    >
      <Spin spinning={loading} tip={t('sellerDashboard.ordersDetail.loading', 'Đang tải đơn hàng...')}>
        {/* Comparison summary */}
        {comparison && (
          <div
            style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: 12,
              padding: '14px 20px',
              marginBottom: 16,
              display: 'flex',
              gap: 32,
            }}
          >
            <div>
              <Text
                style={{
                  fontSize: 11,
                  color: '#94A3B8',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  fontWeight: 500,
                }}
              >
                {t('sellerDashboard.ordersDetail.thisPeriod', 'Kỳ này')}
              </Text>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#10B981', marginTop: 4 }}>
                {Number(comparison.currentPeriod?.orders || 0).toLocaleString('vi-VN')}
                <Text style={{ fontSize: 13, fontWeight: 400, color: '#94A3B8', marginLeft: 4 }}>
                  {t('sellerDashboard.ordersDetail.ordersUnit', 'đơn')}
                </Text>
              </div>
            </div>
            <div>
              <Text
                style={{
                  fontSize: 11,
                  color: '#94A3B8',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  fontWeight: 500,
                }}
              >
                {t('sellerDashboard.ordersDetail.prevPeriod', 'Kỳ trước')}
              </Text>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#94A3B8', marginTop: 4 }}>
                {Number(comparison.previousPeriod?.orders || 0).toLocaleString('vi-VN')}
                <Text style={{ fontSize: 13, fontWeight: 400, color: '#CBD5E1', marginLeft: 4 }}>
                  {t('sellerDashboard.ordersDetail.ordersUnit', 'đơn')}
                </Text>
              </div>
            </div>
            <div>
              <Text
                style={{
                  fontSize: 11,
                  color: '#94A3B8',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  fontWeight: 500,
                }}
              >
                {t('sellerDashboard.ordersDetail.growth', 'Tăng trưởng')}
              </Text>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: isPositive ? '#10B981' : '#ef4444',
                  marginTop: 4,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                {isPositive ? '+' : ''}
                {ordersGrowth}%
              </div>
            </div>
          </div>
        )}

        <Table
          columns={columns}
          dataSource={orders.map((o) => ({ ...o, key: o._id }))}
          pagination={{
            pageSize: 8,
            current: page,
            onChange: setPage,
            showSizeChanger: false,
            size: 'small',
          }}
          size="small"
          scroll={{ x: 800 }}
          locale={{ emptyText: t('sellerDashboard.ordersDetail.noOrders', 'Không có đơn hàng nào') }}
        />
      </Spin>
    </Modal>
  );
}

OrdersDetailModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  _period: PropTypes.string,
  comparison: PropTypes.shape({
    growth: PropTypes.shape({
      orders: PropTypes.number,
    }),
    currentPeriod: PropTypes.shape({
      orders: PropTypes.number,
    }),
    previousPeriod: PropTypes.shape({
      orders: PropTypes.number,
    }),
  }),
};
