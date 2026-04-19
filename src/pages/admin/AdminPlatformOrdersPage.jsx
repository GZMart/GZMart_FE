import { useCallback, useEffect, useState } from 'react';
import {
  Table,
  Button,
  Input,
  Select,
  Tag,
  message,
  Modal,
  Descriptions,
  Space,
  DatePicker,
  ConfigProvider,
  Tooltip,
  Empty,
  Skeleton,
  Dropdown,
} from 'antd';
import {
  ReloadOutlined,
  SearchOutlined,
  CopyOutlined,
  MoreOutlined,
  CheckCircleOutlined,
  ShopOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { orderSellerService } from '@services/api/orderSellerService';
import styles from '@assets/styles/admin/AdminPlatformOrdersPage.module.css';

const { Option } = Select;
const { RangePicker } = DatePicker;

const formatVnd = (n) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);

/** Order status labels */
const ORDER_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending confirmation' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'packed', label: 'Packed' },
  { value: 'shipped', label: 'In transit' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'refunded', label: 'Refunded' },
  { value: 'refund_pending', label: 'Refund pending' },
  { value: 'under_investigation', label: 'Under review / dispute' },
];

const PAYMENT_STATUS_OPTIONS = [
  { value: 'pending', label: 'Unpaid' },
  { value: 'paid', label: 'Paid' },
  { value: 'failed', label: 'Payment failed' },
  { value: 'refunded', label: 'Refunded' },
  { value: 'refund_pending', label: 'Refund pending' },
];

const PAYMENT_METHOD_OPTIONS = [
  { value: 'vnpay', label: 'VNPay' },
  { value: 'payos', label: 'PayOS' },
  { value: 'cash_on_delivery', label: 'COD' },
];

/** Order status tag colors */
const ORDER_STATUS_TAG = {
  pending: { color: 'warning' },
  confirmed: { color: 'processing' },
  packed: { color: 'cyan' },
  shipped: { color: 'blue' },
  delivered: { color: 'geekblue' },
  completed: { color: 'success' },
  cancelled: { color: 'error' },
  refunded: { color: 'magenta' },
  refund_pending: { color: 'volcano' },
  under_investigation: { color: 'purple' },
};

/** Payment status tag colors */
const PAYMENT_STATUS_TAG = {
  pending: { color: 'default' },
  paid: { color: 'success' },
  failed: { color: 'error' },
  refunded: { color: 'warning' },
  refund_pending: { color: 'volcano' },
};

function statusLabel(value, options) {
  return options.find((o) => o.value === value)?.label || value || '—';
}

function sellersInfoFromOrder(order) {
  const items = order.items || [];
  const seen = new Set();
  const names = [];
  for (const line of items) {
    const p = line.productId;
    if (p && typeof p === 'object' && p.sellerId) {
      const s = p.sellerId;
      let key;
      if (typeof s === 'object') {
        key =
          s._id != null
            ? String(s._id)
            : s.id != null
              ? String(s.id)
              : [s.email, s.fullName].filter(Boolean).join('|') || JSON.stringify(s);
      } else {
        key = String(s);
      }
      if (!seen.has(key)) {
        seen.add(key);
        const name = typeof s === 'object' ? s.fullName || s.email || '—' : String(s);
        names.push(name);
      }
    }
  }
  if (seen.size === 0) {
    return { type: 'none', label: '—', names: [] };
  }
  if (seen.size === 1) {
    return { type: 'single', label: names[0], names };
  }
  return { type: 'multi', count: seen.size, names };
}

function buyerLines(order) {
  const u = order.userId;
  if (!u) {
    return { title: '—', sub: null };
  }
  if (typeof u === 'object') {
    const title = u.fullName || u.email || u.phone || '—';
    const sub = [u.phone, u.email].filter(Boolean).join(' · ') || null;
    return { title, sub };
  }
  return { title: String(u), sub: null };
}

const AdminPlatformOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [orderNumber, setOrderNumber] = useState('');
  const [status, setStatus] = useState(undefined);
  const [paymentStatus, setPaymentStatus] = useState(undefined);
  const [paymentMethod, setPaymentMethod] = useState(undefined);
  const [dateRange, setDateRange] = useState(null);
  const [datePreset, setDatePreset] = useState(null);

  const [buyerInput, setBuyerInput] = useState('');
  const [sellerInput, setSellerInput] = useState('');
  const [buyerSearch, setBuyerSearch] = useState('');
  const [sellerSearch, setSellerSearch] = useState('');

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setBuyerSearch(buyerInput.trim());
      setPagination((p) => ({ ...p, current: 1 }));
    }, 450);
    return () => clearTimeout(t);
  }, [buyerInput]);

  useEffect(() => {
    const t = setTimeout(() => {
      setSellerSearch(sellerInput.trim());
      setPagination((p) => ({ ...p, current: 1 }));
    }, 450);
    return () => clearTimeout(t);
  }, [sellerInput]);

  const page = pagination.current;
  const pageSize = pagination.pageSize;

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: pageSize,
        sortBy: 'newest-first',
      };
      if (orderNumber.trim()) {
        params.orderNumber = orderNumber.trim();
      }
      if (status) {
        params.status = status;
      }
      if (paymentStatus) {
        params.paymentStatus = paymentStatus;
      }
      if (paymentMethod) {
        params.paymentMethod = paymentMethod;
      }
      if (buyerSearch.length >= 2) {
        params.buyerSearch = buyerSearch;
      }
      if (sellerSearch.length >= 2) {
        params.sellerSearch = sellerSearch;
      }
      if (dateRange?.[0] && dateRange?.[1]) {
        params.dateFrom = dateRange[0].format('YYYY-MM-DD');
        params.dateTo = dateRange[1].format('YYYY-MM-DD');
      }

      const res = await orderSellerService.getAdminPlatformOrders(params);
      setOrders(res.data || []);
      setPagination((p) => ({ ...p, total: res.total ?? 0 }));
    } catch (e) {
      console.error(e);
      message.error('Could not load orders');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, orderNumber, status, paymentStatus, paymentMethod, buyerSearch, sellerSearch, dateRange]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const openDetail = async (orderId) => {
    setDetailOpen(true);
    setDetail(null);
    try {
      setDetailLoading(true);
      const res = await orderSellerService.getById(orderId);
      setDetail(res.data);
    } catch (e) {
      console.error(e);
      message.error('Could not load order details');
    } finally {
      setDetailLoading(false);
    }
  };

  const copyText = async (text, msg = 'Copied') => {
    try {
      await navigator.clipboard.writeText(text);
      message.success(msg);
    } catch {
      message.error('Could not copy');
    }
  };

  const applyDatePreset = (preset) => {
    if (preset === '7') {
      setDateRange([dayjs().subtract(6, 'day').startOf('day'), dayjs().endOf('day')]);
      setDatePreset('7');
    } else if (preset === '30') {
      setDateRange([dayjs().subtract(29, 'day').startOf('day'), dayjs().endOf('day')]);
      setDatePreset('30');
    }
    setPagination((p) => ({ ...p, current: 1 }));
  };

  const clearAllFilters = () => {
    setOrderNumber('');
    setBuyerInput('');
    setSellerInput('');
    setStatus(undefined);
    setPaymentStatus(undefined);
    setPaymentMethod(undefined);
    setDateRange(null);
    setDatePreset(null);
    setPagination((p) => ({ ...p, current: 1 }));
  };

  const onRangeChange = (v) => {
    setDateRange(v);
    setDatePreset(v ? 'custom' : null);
    setPagination((p) => ({ ...p, current: 1 }));
  };

  const paymentTagContent = (s) => {
    const label = statusLabel(s, PAYMENT_STATUS_OPTIONS);
    const tagProps = PAYMENT_STATUS_TAG[s] || { color: 'default' };
    if (s === 'paid') {
      return (
        <Tag {...tagProps} icon={<CheckCircleOutlined />} style={{ marginInlineEnd: 0 }}>
          Paid
        </Tag>
      );
    }
    if (s === 'pending') {
      return (
        <Tag {...tagProps} style={{ marginInlineEnd: 0 }}>
          Unpaid
        </Tag>
      );
    }
    return (
      <Tag {...tagProps} style={{ marginInlineEnd: 0 }}>
        {label}
      </Tag>
    );
  };

  const columns = [
    {
      title: 'Order # / Created',
      key: 'order',
      width: 200,
      render: (_, r) => {
        const created = r.createdAt ? new Date(r.createdAt).toLocaleString('en-US') : '—';
        return (
          <div>
            <div className={styles.orderIdRow}>
              <Button type="link" className={styles.orderNumberLink} onClick={() => openDetail(r._id)}>
                {r.orderNumber}
              </Button>
              <Tooltip title="Copy order number">
                <button
                  type="button"
                  className={styles.copyOrderBtn}
                  onClick={() => copyText(r.orderNumber)}
                  aria-label="Copy order number"
                >
                  <CopyOutlined style={{ fontSize: 14 }} />
                </button>
              </Tooltip>
            </div>
            <div className={styles.orderDateMuted}>{created}</div>
          </div>
        );
      },
    },
    {
      title: 'Customer',
      key: 'buyer',
      ellipsis: true,
      render: (_, r) => {
        const { title, sub } = buyerLines(r);
        const full = [title, sub].filter(Boolean).join(' — ');
        return (
          <Tooltip title={full.length > 40 ? full : undefined}>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#111827' }}>{title}</div>
              {sub ? (
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 2 }}>{sub}</div>
              ) : null}
            </div>
          </Tooltip>
        );
      },
    },
    {
      title: 'Shop',
      key: 'seller',
      ellipsis: true,
      render: (_, r) => {
        const info = sellersInfoFromOrder(r);
        if (info.type === 'multi') {
          const tip = info.names.slice(0, 8).join(', ') + (info.names.length > 8 ? '…' : '');
          return (
            <Tooltip title={tip}>
              <span className={styles.shopMulti}>
                <ShopOutlined style={{ color: '#777587' }} />
                Multiple shops ({info.count})
              </span>
            </Tooltip>
          );
        }
        if (info.type === 'single') {
          return (
            <Tooltip title={info.label}>
              <span className={styles.shopPill}>{info.label}</span>
            </Tooltip>
          );
        }
        return <span className={styles.shopPill}>—</span>;
      },
    },
    {
      title: 'Total',
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      width: 130,
      align: 'right',
      render: (v) => <span className={styles.amountCell}>{formatVnd(v)}</span>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      align: 'center',
      render: (s) => {
        const tagProps = ORDER_STATUS_TAG[s] || { color: 'default' };
        return (
          <Tag {...tagProps} style={{ marginInlineEnd: 0, fontWeight: 600, fontSize: 12 }}>
            {statusLabel(s, ORDER_STATUS_OPTIONS)}
          </Tag>
        );
      },
    },
    {
      title: 'Payment',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      width: 130,
      align: 'center',
      render: (s) => paymentTagContent(s),
    },
    {
      title: '',
      key: 'actions',
      width: 48,
      align: 'right',
      render: (_, r) => (
        <Dropdown
          menu={{
            items: [{ key: 'detail', label: 'View details' }],
            onClick: ({ key }) => {
              if (key === 'detail') {
                openDetail(r._id);
              }
            },
          }}
          trigger={['click']}
        >
          <Button
            type="text"
            icon={<MoreOutlined />}
            style={{ color: '#777587' }}
            aria-label="Actions"
          />
        </Dropdown>
      ),
    },
  ];

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#4f46e5',
          borderRadius: 8,
        },
      }}
    >
      <div className={styles.page}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <i className="bi bi-receipt" />
            </div>
            <div>
              <h1>Platform orders</h1>
              <p className={styles.subtitle}>
                Search by order number, customer, or shop (≥2 characters for customer/shop). No internal IDs
                required.
              </p>
              <p className={styles.metaLine}>
                Rows matching current filters: <strong>{pagination.total.toLocaleString('en-US')}</strong> orders
              </p>
            </div>
          </div>
          <Button
            className={styles.refreshBtn}
            icon={<ReloadOutlined />}
            onClick={fetchOrders}
            loading={loading}
            size="large"
          >
            Refresh
          </Button>
        </div>

        <div className={styles.filterCard}>
          <div className={styles.filterGridTop}>
            <Input
              allowClear
              size="large"
              placeholder="Search order number…"
              prefix={<SearchOutlined className="text-gray-400" />}
              value={orderNumber}
              onChange={(e) => {
                setOrderNumber(e.target.value);
                setPagination((p) => ({ ...p, current: 1 }));
              }}
            />
            <Input
              allowClear
              size="large"
              placeholder="Customer: name / email / phone (≥2 chars)"
              value={buyerInput}
              onChange={(e) => setBuyerInput(e.target.value)}
            />
          </div>
          <div className={styles.filterSellerRow}>
            <Input
              allowClear
              size="large"
              placeholder="Shop: email / phone / seller name (≥2 chars)"
              value={sellerInput}
              onChange={(e) => setSellerInput(e.target.value)}
            />
          </div>

          <div className={styles.filterRowBottom}>
            <Select
              allowClear
              placeholder="All order statuses"
              style={{ minWidth: 200, flex: '1 1 200px' }}
              size="large"
              value={status}
              onChange={(v) => {
                setStatus(v);
                setPagination((p) => ({ ...p, current: 1 }));
              }}
              optionFilterProp="label"
              showSearch
            >
              {ORDER_STATUS_OPTIONS.map((o) => (
                <Option key={o.value} value={o.value} label={o.label}>
                  {o.label}
                </Option>
              ))}
            </Select>
            <Select
              allowClear
              placeholder="Payment status"
              style={{ minWidth: 200, flex: '1 1 200px' }}
              size="large"
              value={paymentStatus}
              onChange={(v) => {
                setPaymentStatus(v);
                setPagination((p) => ({ ...p, current: 1 }));
              }}
            >
              {PAYMENT_STATUS_OPTIONS.map((o) => (
                <Option key={o.value} value={o.value}>
                  {o.label}
                </Option>
              ))}
            </Select>
            <Select
              allowClear
              placeholder="Payment method"
              style={{ minWidth: 160, flex: '0 1 160px' }}
              size="large"
              value={paymentMethod}
              onChange={(v) => {
                setPaymentMethod(v);
                setPagination((p) => ({ ...p, current: 1 }));
              }}
            >
              {PAYMENT_METHOD_OPTIONS.map((o) => (
                <Option key={o.value} value={o.value}>
                  {o.label}
                </Option>
              ))}
            </Select>

            <div className={styles.datePresetWrap}>
              <button
                type="button"
                className={`${styles.datePresetBtn} ${datePreset === '7' ? styles.datePresetBtnActive : ''}`}
                onClick={() => applyDatePreset('7')}
              >
                7 days
              </button>
              <button
                type="button"
                className={`${styles.datePresetBtn} ${datePreset === '30' ? styles.datePresetBtnActive : ''}`}
                onClick={() => applyDatePreset('30')}
              >
                30 days
              </button>
              <button
                type="button"
                className={`${styles.datePresetBtn} ${datePreset === 'custom' ? styles.datePresetBtnActive : ''}`}
                onClick={() => {
                  if (!dateRange) {
                    setDateRange([dayjs().subtract(6, 'day').startOf('day'), dayjs().endOf('day')]);
                  }
                  setDatePreset('custom');
                  setPagination((p) => ({ ...p, current: 1 }));
                }}
              >
                Custom
              </button>
            </div>

            <RangePicker
              value={dateRange}
              onChange={onRangeChange}
              format="DD/MM/YYYY"
              allowClear
              size="large"
              style={{ flex: '1 1 260px', minWidth: 240 }}
            />

            <div className={styles.filterGrow} />
            <button type="button" className={styles.clearLink} onClick={clearAllFilters}>
              Clear filters
            </button>
          </div>
        </div>

        <div className={styles.tableCard}>
          <Table
            rowKey="_id"
            loading={loading}
            columns={columns}
            dataSource={orders}
            sticky={{ offsetHeader: 0 }}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <span>
                      No orders match these filters.
                      <br />
                      <span style={{ fontSize: 13, color: '#9ca3af' }}>
                        Try loosening filters or widening the date range.
                      </span>
                    </span>
                  }
                />
              ),
            }}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,
              showTotal: (total, range) =>
                `Showing ${range[0]}–${range[1]} of ${total.toLocaleString('en-US')} orders`,
            }}
            onChange={(pag) => {
              setPagination({
                current: pag.current,
                pageSize: pag.pageSize,
                total: pagination.total,
              });
            }}
            scroll={{ x: 1100 }}
          />
        </div>

        <Modal
          title={
            detail ? (
              <Space>
                <span>Order {detail.orderNumber}</span>
                <Button
                  type="link"
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={() => copyText(detail.orderNumber, 'Order number copied')}
                >
                  Copy number
                </Button>
              </Space>
            ) : (
              'Order details'
            )
          }
          open={detailOpen}
          onCancel={() => setDetailOpen(false)}
          footer={null}
          width={720}
          destroyOnClose
        >
          {detailLoading ? (
            <Skeleton active paragraph={{ rows: 6 }} />
          ) : detail ? (
            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label="Order #">{detail.orderNumber}</Descriptions.Item>
              <Descriptions.Item label="Status">
                {statusLabel(detail.status, ORDER_STATUS_OPTIONS)}
              </Descriptions.Item>
              <Descriptions.Item label="Payment">
                {statusLabel(detail.paymentStatus, PAYMENT_STATUS_OPTIONS)} ·{' '}
                {statusLabel(detail.paymentMethod, PAYMENT_METHOD_OPTIONS)}
              </Descriptions.Item>
              <Descriptions.Item label="Total">{formatVnd(detail.totalPrice)}</Descriptions.Item>
              <Descriptions.Item label="Shipping address">{detail.shippingAddress}</Descriptions.Item>
              <Descriptions.Item label="Line items">
                <Space direction="vertical" size={4}>
                  {(detail.items || []).map((line, i) => {
                    const name =
                      line.productId?.name ||
                      line.productId?.title ||
                      line.sku ||
                      `Line ${i + 1}`;
                    const shop =
                      line.productId?.sellerId && typeof line.productId.sellerId === 'object'
                        ? line.productId.sellerId.fullName || line.productId.sellerId.email
                        : '';
                    return (
                      <span key={line._id || i}>
                        {name} × {line.quantity}
                        {shop ? ` — Shop: ${shop}` : ''}
                      </span>
                    );
                  })}
                </Space>
              </Descriptions.Item>
            </Descriptions>
          ) : null}
        </Modal>
      </div>
    </ConfigProvider>
  );
};

export default AdminPlatformOrdersPage;
