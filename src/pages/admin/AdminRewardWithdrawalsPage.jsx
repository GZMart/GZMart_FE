import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Table,
  Button,
  Select,
  Tag,
  message,
  Modal,
  Input,
  Form,
  DatePicker,
  ConfigProvider,
  Tooltip,
  Empty,
  Avatar,
} from 'antd';
import {
  ReloadOutlined,
  SearchOutlined,
  CheckOutlined,
  CloseOutlined,
  ClearOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import dashboardService from '@services/api/dashboardService';
import styles from '@assets/styles/admin/AdminRewardWithdrawalsPage.module.css';

const { Option } = Select;
const { RangePicker } = DatePicker;

const formatVnd = (n) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Math.abs(Number(n) || 0));

const formatRp = (n) => {
  if (n == null || n === '') {
    return '—';
  }
  return new Intl.NumberFormat('en-US').format(Number(n));
};

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
  { value: 'cancelled', label: 'Cancelled' },
];

/** Status tag colors */
const STATUS_TAG_PROPS = {
  pending: { color: 'warning' },
  completed: { color: 'success' },
  failed: { color: 'error' },
  cancelled: {
    style: {
      color: '#4b5563',
      background: '#f3f4f6',
      borderColor: '#e5e7eb',
    },
  },
};

function sellerFromRow(r) {
  const s = r.sellerId;
  if (s && typeof s === 'object') {
    const name = s.fullName || s.email || '—';
    const email = s.email || '';
    const fullText = [s.fullName, s.phone, s.email].filter(Boolean).join(' · ') || '—';
    return { name, email, fullText };
  }
  const raw = s != null ? String(s) : '—';
  return { name: raw, email: '', fullText: raw };
}

function avatarLetters(name) {
  if (!name || name === '—') {
    return '?';
  }
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

const AdminRewardWithdrawalsPage = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [limit, setLimit] = useState(20);
  const [statusFilter, setStatusFilter] = useState(undefined);
  const [sellerInput, setSellerInput] = useState('');
  const [sellerSearch, setSellerSearch] = useState('');
  const [dateRange, setDateRange] = useState(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectRecord, setRejectRecord] = useState(null);
  const [approveRecord, setApproveRecord] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    const t = setTimeout(() => {
      setSellerSearch(sellerInput.trim());
      setSkip(0);
    }, 450);
    return () => clearTimeout(t);
  }, [sellerInput]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const params = { skip, limit };
      if (statusFilter) {
        params.status = statusFilter;
      }
      if (sellerSearch.length >= 2) {
        params.sellerSearch = sellerSearch;
      }
      if (dateRange?.[0] && dateRange?.[1]) {
        params.startDate = dateRange[0].format('YYYY-MM-DD');
        params.endDate = dateRange[1].format('YYYY-MM-DD');
      }
      const res = await dashboardService.getAdminRewardPointWithdrawals(params);
      setRows(res.data || []);
      setTotal(res.total ?? 0);
    } catch (e) {
      console.error(e);
      message.error('Could not load withdrawal requests');
    } finally {
      setLoading(false);
    }
  }, [skip, limit, statusFilter, sellerSearch, dateRange]);

  useEffect(() => {
    load();
  }, [load]);

  const runProcess = async (transactionId, action, rejectedReason) => {
    try {
      setProcessing(true);
      await dashboardService.processAdminRewardPointWithdrawal(transactionId, {
        action,
        ...(action === 'reject' ? { rejectedReason } : {}),
      });
      message.success(action === 'approve' ? 'Request approved' : 'Request rejected');
      setRejectOpen(false);
      setRejectRecord(null);
      setApproveRecord(null);
      form.resetFields();
      await load();
    } catch (e) {
      console.error(e);
      message.error(e.response?.data?.message || 'Action failed');
    } finally {
      setProcessing(false);
    }
  };

  const hasActiveFilters = useMemo(
    () =>
      Boolean(
        sellerInput.trim() ||
          statusFilter ||
          (dateRange?.[0] && dateRange?.[1]),
      ),
    [sellerInput, statusFilter, dateRange],
  );

  const clearFilters = () => {
    setSellerInput('');
    setStatusFilter(undefined);
    setDateRange(null);
    setSkip(0);
  };

  const columns = [
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 168,
      render: (d) => (
        <span className={styles.dateCell}>{d ? new Date(d).toLocaleString('en-US') : '—'}</span>
      ),
    },
    {
      title: 'Seller',
      key: 'seller',
      ellipsis: true,
      render: (_, r) => {
        const { name, email, fullText } = sellerFromRow(r);
        return (
          <Tooltip title={fullText}>
            <div className={styles.sellerBlock}>
              <Avatar
                size={36}
                style={{
                  background: 'linear-gradient(135deg, #b6b4ff 0%, #a5b4fc 100%)',
                  color: '#312e81',
                  fontWeight: 700,
                  fontSize: 13,
                  flexShrink: 0,
                }}
              >
                {avatarLetters(name)}
              </Avatar>
              <div className={styles.sellerText}>
                <div className={styles.sellerName}>{name}</div>
                {email ? <div className={styles.sellerEmail}>{email}</div> : null}
              </div>
            </div>
          </Tooltip>
        );
      },
    },
    {
      title: 'Amount (VND)',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right',
      render: (a) => <span className={styles.amountCell}>{formatVnd(a)}</span>,
    },
    {
      title: 'RP points',
      key: 'rp',
      align: 'right',
      render: (_, r) => (
        <Tooltip
          title={
            r.metadata?.rewardPointAmount != null
              ? 'Reward points for this withdrawal'
              : 'Not present in metadata'
          }
        >
          <span className={styles.rpCell}>{formatRp(r.metadata?.rewardPointAmount)}</span>
        </Tooltip>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (s) => {
        const label = STATUS_OPTIONS.find((o) => o.value === s)?.label || s;
        const tagProps = STATUS_TAG_PROPS[s] || { color: 'default' };
        return (
          <Tag {...tagProps} style={{ margin: 0, ...tagProps.style }}>
            {label}
          </Tag>
        );
      },
    },
    {
      title: 'Actions',
      key: 'act',
      fixed: 'right',
      width: 140,
      align: 'center',
      render: (_, r) =>
        r.status === 'pending' ? (
          <div className={styles.actionWrap}>
            <Tooltip title="Approve">
              <Button
                className={styles.actionOk}
                icon={<CheckOutlined />}
                disabled={processing}
                onClick={() => setApproveRecord(r)}
                aria-label="Approve"
              />
            </Tooltip>
            <Tooltip title="Reject">
              <Button
                className={styles.actionReject}
                icon={<CloseOutlined />}
                disabled={processing}
                onClick={() => {
                  setRejectRecord(r);
                  setRejectOpen(true);
                }}
                aria-label="Reject"
              />
            </Tooltip>
          </div>
        ) : (
          <span style={{ color: '#9ca3af' }}>—</span>
        ),
    },
  ];

  const summarySeller = approveRecord || rejectRecord;
  const summarySellerInfo = summarySeller ? sellerFromRow(summarySeller) : null;
  const summaryRp = summarySeller?.metadata?.rewardPointAmount;

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
              <i className="bi bi-wallet2" />
            </div>
            <div>
              <h1>Reward point withdrawals</h1>
              <p className={styles.subtitle}>
                Review and approve seller requests to cash out reward points.
              </p>
            </div>
          </div>
          <div className={styles.headerMeta}>
            <div className={styles.totalPill}>
              <span className={styles.pulseDot} aria-hidden />
              <span>{total.toLocaleString('en-US')} requests</span>
            </div>
            <Button
              className={styles.refreshBtn}
              type="primary"
              icon={<ReloadOutlined />}
              onClick={load}
              loading={loading}
              size="large"
            >
              Refresh
            </Button>
          </div>
        </div>

        <div className={styles.filterCard}>
          <div className={styles.filterRow}>
            <div className={styles.filterGrow}>
              <Input
                allowClear
                size="large"
                placeholder="Search seller (≥2 characters)"
                prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
                value={sellerInput}
                onChange={(e) => setSellerInput(e.target.value)}
              />
            </div>
            <div className={styles.filterGrow} style={{ minWidth: 200, maxWidth: 280 }}>
              <Select
                allowClear
                size="large"
                placeholder="All statuses"
                style={{ width: '100%' }}
                value={statusFilter}
                onChange={(v) => {
                  setStatusFilter(v);
                  setSkip(0);
                }}
                showSearch
                optionFilterProp="label"
              >
                {STATUS_OPTIONS.map((o) => (
                  <Option key={o.value} value={o.value} label={o.label}>
                    {o.label}
                  </Option>
                ))}
              </Select>
            </div>
            <div className={styles.filterGrow} style={{ minWidth: 260, maxWidth: 340 }}>
              <RangePicker
                size="large"
                style={{ width: '100%' }}
                value={dateRange}
                onChange={(v) => {
                  setDateRange(v);
                  setSkip(0);
                }}
                format="DD/MM/YYYY"
                presets={[
                  { label: '7 days', value: [dayjs().subtract(6, 'day'), dayjs()] },
                  { label: '30 days', value: [dayjs().subtract(29, 'day'), dayjs()] },
                ]}
                allowClear
                placeholder={['From', 'To']}
              />
            </div>
            {hasActiveFilters ? (
              <Button
                className={styles.clearBtn}
                type="text"
                size="large"
                icon={<ClearOutlined />}
                onClick={clearFilters}
              >
                Clear filters
              </Button>
            ) : null}
          </div>
        </div>

        <div className={styles.tableCard}>
          <Table
            rowKey="_id"
            loading={loading}
            columns={columns}
            dataSource={rows}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="No requests — try changing filters or refresh"
                />
              ),
            }}
            pagination={{
              current: Math.floor(skip / limit) + 1,
              pageSize: limit,
              total,
              showSizeChanger: true,
              pageSizeOptions: [10, 20, 50],
              showTotal: (t, range) =>
                t === 0
                  ? ''
                  : `Showing ${range[0].toLocaleString('en-US')}-${range[1].toLocaleString('en-US')} of ${t.toLocaleString('en-US')} requests`,
              onChange: (page, pageSize) => {
                setLimit(pageSize);
                setSkip((page - 1) * pageSize);
              },
            }}
            scroll={{ x: 960 }}
          />
        </div>

        <Modal
          title={
            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: '#e0e7ff',
                  color: '#4f46e5',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <CheckOutlined />
              </span>
              <span>
                <div style={{ fontWeight: 700, fontSize: 18 }}>Approve this request?</div>
                <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 400, marginTop: 2 }}>
                  You are about to approve this reward-point cash-out.
                </div>
              </span>
            </span>
          }
          open={Boolean(approveRecord)}
          onCancel={() => setApproveRecord(null)}
          okText="Approve"
          cancelText="Cancel"
          confirmLoading={processing}
          okButtonProps={{ type: 'primary' }}
          onOk={() => approveRecord && runProcess(approveRecord._id, 'approve')}
          destroyOnClose
        >
          {summarySellerInfo && (
            <div className={styles.modalSummary}>
              <div className={styles.modalSummaryRow}>
                <span className={styles.modalSummaryLabel}>Seller</span>
                <span className={styles.modalSummaryValue}>{summarySellerInfo.name}</span>
              </div>
              <div className={styles.modalSummaryRow}>
                <span className={styles.modalSummaryLabel}>Amount (VND)</span>
                <span className={styles.modalSummaryValue}>
                  {formatVnd(approveRecord?.amount)}
                </span>
              </div>
              <div className={styles.modalSummaryRow}>
                <span className={styles.modalSummaryLabel}>RP points</span>
                <span
                  className={styles.modalSummaryValue}
                  style={{ color: '#4f46e5', fontWeight: 700 }}
                >
                  {summaryRp != null && summaryRp !== ''
                    ? `-${new Intl.NumberFormat('en-US').format(Number(summaryRp))}`
                    : '—'}
                </span>
              </div>
            </div>
          )}
        </Modal>

        <Modal
          title={
            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: '#ffdad6',
                  color: '#ba1a1a',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <CloseOutlined />
              </span>
              <span>
                <div style={{ fontWeight: 700, fontSize: 18 }}>Reject request</div>
                <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 400, marginTop: 2 }}>
                  {summarySellerInfo
                    ? `${summarySellerInfo.name}'s request will be rejected.`
                    : 'Enter a reason to notify the seller.'}
                </div>
              </span>
            </span>
          }
          open={rejectOpen}
          onCancel={() => {
            setRejectOpen(false);
            setRejectRecord(null);
            form.resetFields();
          }}
          footer={null}
          destroyOnClose
        >
          {summarySellerInfo && rejectRecord && (
            <div className={styles.modalSummary} style={{ marginBottom: 20 }}>
              <div className={styles.modalSummaryRow}>
                <span className={styles.modalSummaryLabel}>Seller</span>
                <span className={styles.modalSummaryValue}>{summarySellerInfo.name}</span>
              </div>
              <div className={styles.modalSummaryRow}>
                <span className={styles.modalSummaryLabel}>Amount (VND)</span>
                <span className={styles.modalSummaryValue}>{formatVnd(rejectRecord.amount)}</span>
              </div>
            </div>
          )}
          <Form
            form={form}
            layout="vertical"
            onFinish={(v) => rejectRecord && runProcess(rejectRecord._id, 'reject', v.rejectedReason)}
          >
            <Form.Item
              name="rejectedReason"
              label={
                <span>
                  Rejection reason <span style={{ color: '#ef4444' }}>*</span>
                </span>
              }
              rules={[{ required: true, message: 'Enter a detailed reason' }]}
            >
              <Input.TextArea
                rows={3}
                placeholder="Detailed reason shown to the seller…"
                disabled={processing}
              />
            </Form.Item>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button
                onClick={() => {
                  setRejectOpen(false);
                  setRejectRecord(null);
                  form.resetFields();
                }}
              >
                Cancel
              </Button>
              <Button type="primary" danger htmlType="submit" loading={processing}>
                Reject request
              </Button>
            </div>
          </Form>
        </Modal>
      </div>
    </ConfigProvider>
  );
};

export default AdminRewardWithdrawalsPage;
