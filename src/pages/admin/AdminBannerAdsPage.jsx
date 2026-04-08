import { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Tag,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Card,
  message,
  Statistic,
  Row,
  Col,
  Drawer,
  Image,
  Divider,
  Tooltip,
  Typography,
  Empty,
  Segmented,
  Select,
  DatePicker,
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  UserOutlined,
  CalendarOutlined,
  BarChartOutlined,
  PlusOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import bannerAdsService from '@services/api/bannerAdsService';
import styles from './AdminBannerAdsPage.module.css';

const { Text, Title } = Typography;

const STATUS_CFG = {
  DRAFT: { color: 'default', label: 'Nháp' },
  PENDING_PAYMENT: { color: 'warning', label: 'Chờ Thanh Toán' },
  PENDING_REVIEW: { color: 'processing', label: 'Chờ Duyệt' },
  APPROVED: { color: 'cyan', label: 'Đã Duyệt' },
  RUNNING: { color: 'success', label: '🔴 Đang Chạy' },
  COMPLETED: { color: 'default', label: 'Đã Kết Thúc' },
  REJECTED: { color: 'error', label: 'Từ Chối' },
  CANCELLED: { color: 'default', label: 'Đã Huỷ' },
};

const AdminBannerAdsPage = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('PENDING_REVIEW');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Reject modal
  const [rejectId, setRejectId] = useState(null);
  const [rejectForm] = Form.useForm();
  const [rejecting, setRejecting] = useState(false);

  // Preview drawer
  const [previewBanner, setPreviewBanner] = useState(null);

  // Create system banner modal
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm] = Form.useForm();
  const [creating, setCreating] = useState(false);

  const [approving, setApproving] = useState({});
  const [deleting, setDeleting] = useState({});

  // ─── Stats ────────────────────────────────────────────────────────────────
  const [allBanners, setAllBanners] = useState([]);

  const fetchBanners = useCallback(async () => {
    setLoading(true);
    try {
      const res = await bannerAdsService.adminGetAll({
        status: statusFilter || undefined,
        page,
        limit: 20,
      });
      setBanners(res.banners || []);
      setTotal(res.pagination?.total || 0);
    } catch {
      message.error('Không tải được dữ liệu banner');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  const fetchAllStats = useCallback(async () => {
    try {
      const res = await bannerAdsService.adminGetAll({ limit: 200 });
      setAllBanners(res.banners || []);
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  useEffect(() => {
    fetchAllStats();
  }, [fetchAllStats]);

  // ─── Approve ───────────────────────────────────────────────────────────────
  const handleApprove = async (id) => {
    setApproving((p) => ({ ...p, [id]: true }));
    try {
      await bannerAdsService.adminApprove(id);
      message.success('✅ Đã duyệt banner. Banner sẽ chạy đúng ngày đã đặt.');
      fetchBanners();
      fetchAllStats();
    } catch (err) {
      message.error(err?.response?.data?.message || 'Duyệt thất bại');
    } finally {
      setApproving((p) => ({ ...p, [id]: false }));
    }
  };

  // ─── Reject ────────────────────────────────────────────────────────────────
  const handleReject = async () => {
    try {
      const { rejectionReason } = await rejectForm.validateFields();
      setRejecting(true);
      await bannerAdsService.adminReject(rejectId, rejectionReason);
      message.success('Đã từ chối & hoàn xu cho Seller.');
      setRejectId(null);
      rejectForm.resetFields();
      fetchBanners();
      fetchAllStats();
    } catch (err) {
      if (err?.response) message.error(err.response.data?.message || 'Từ chối thất bại');
    } finally {
      setRejecting(false);
    }
  };

  // ─── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    setDeleting((p) => ({ ...p, [id]: true }));
    try {
      await bannerAdsService.adminDelete(id);
      message.success('Đã xoá banner');
      fetchBanners();
    } catch (err) {
      message.error(err?.response?.data?.message || 'Xoá thất bại');
    } finally {
      setDeleting((p) => ({ ...p, [id]: false }));
    }
  };

  // ─── Create system banner ─────────────────────────────────────────────────
  const handleCreate = async () => {
    try {
      const values = await createForm.validateFields();
      setCreating(true);
      await bannerAdsService.adminCreate({
        ...values,
        isActive: true,
        ownerType: 'ADMIN',
        status: 'RUNNING',
      });
      message.success('Đã tạo banner hệ thống');
      setCreateOpen(false);
      createForm.resetFields();
      fetchBanners();
    } catch (err) {
      if (err?.response) message.error(err.response.data?.message || 'Tạo thất bại');
    } finally {
      setCreating(false);
    }
  };

  // ─── Stats computed ─────────────────────────────────────────────────────────
  const stats = {
    pending: allBanners.filter((b) => b.status === 'PENDING_REVIEW').length,
    running: allBanners.filter((b) => b.status === 'RUNNING').length,
    totalRevenue: allBanners
      .filter((b) => ['RUNNING', 'COMPLETED', 'APPROVED'].includes(b.status))
      .reduce((s, b) => s + (b.pricing?.totalFee || 0), 0),
    totalViews: allBanners.reduce((s, b) => s + (b.metrics?.views || 0), 0),
  };

  // ─── Table columns ──────────────────────────────────────────────────────────
  const columns = [
    {
      title: 'Banner',
      key: 'banner',
      width: 240,
      render: (_, rec) => (
        <Space>
          <Image
            src={rec.image}
            width={70}
            height={45}
            style={{ objectFit: 'cover', borderRadius: 6, border: '1px solid #e8ecf0' }}
            preview={false}
            fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/OFDPQAIhANkj9xrMwAAAABJRU5ErkJggg=="
          />
          <div>
            <Text strong style={{ fontSize: 13, display: 'block' }}>
              {rec.title}
            </Text>
            <Text type="secondary" style={{ fontSize: 11 }}>
              {rec.subtitle}
            </Text>
            <Tag
              style={{ marginTop: 2, fontSize: 10 }}
              color={rec.ownerType === 'ADMIN' ? 'geekblue' : 'orange'}
            >
              {rec.ownerType === 'ADMIN' ? '🔵 Hệ Thống' : '🟠 Seller'}
            </Tag>
          </div>
        </Space>
      ),
    },
    {
      title: 'Seller',
      key: 'seller',
      render: (_, rec) =>
        rec.sellerId ? (
          <Space>
            <UserOutlined />
            <div>
              <Text style={{ fontSize: 12 }}>{rec.sellerId?.fullName || '—'}</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 11 }}>
                {rec.sellerId?.email}
              </Text>
            </div>
          </Space>
        ) : (
          <Tag color="geekblue">Admin</Tag>
        ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (s) => {
        const cfg = STATUS_CFG[s] || { color: 'default', label: s };
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: 'Ngày chạy',
      key: 'dates',
      render: (_, rec) => (
        <div style={{ fontSize: 12 }}>
          <div>
            <CalendarOutlined /> {rec.startDate ? dayjs(rec.startDate).format('DD/MM/YY') : '—'}
          </div>
          <div style={{ color: '#999' }}>
            → {rec.endDate ? dayjs(rec.endDate).format('DD/MM/YY') : '—'}
          </div>
          {rec.pricing?.totalDays && (
            <Tag style={{ fontSize: 10, marginTop: 2 }}>{rec.pricing.totalDays} ngày</Tag>
          )}
        </div>
      ),
    },
    {
      title: 'Phí (Xu)',
      key: 'fee',
      render: (_, rec) =>
        rec.pricing?.totalFee ? (
          <Statistic
            value={rec.pricing.totalFee}
            suffix="xu"
            valueStyle={{ fontSize: 13, color: '#f5a623' }}
          />
        ) : (
          <Tag>Miễn phí</Tag>
        ),
    },
    {
      title: 'Metrics',
      key: 'metrics',
      render: (_, rec) => (
        <Space direction="vertical" size={0}>
          <Text style={{ fontSize: 11 }}>👁 {(rec.metrics?.views || 0).toLocaleString()}</Text>
          <Text style={{ fontSize: 11 }}>🖱 {(rec.metrics?.clicks || 0).toLocaleString()}</Text>
          <Tag color="blue" style={{ fontSize: 10 }}>
            CTR {rec.ctr || '0.00'}%
          </Tag>
        </Space>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 200,
      render: (_, rec) => (
        <Space wrap size={4}>
          <Tooltip title="Xem chi tiết">
            <Button size="small" icon={<EyeOutlined />} onClick={() => setPreviewBanner(rec)} />
          </Tooltip>
          {rec.status === 'PENDING_REVIEW' && (
            <>
              <Button
                size="small"
                type="primary"
                icon={<CheckCircleOutlined />}
                loading={approving[rec._id]}
                onClick={() => handleApprove(rec._id)}
                style={{ background: '#52c41a', borderColor: '#52c41a' }}
              >
                Duyệt
              </Button>
              <Button
                size="small"
                danger
                icon={<CloseCircleOutlined />}
                onClick={() => setRejectId(rec._id)}
              >
                Từ chối
              </Button>
            </>
          )}
          <Tooltip title="Xoá banner">
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              loading={deleting[rec._id]}
              onClick={() =>
                Modal.confirm({
                  title: 'Xoá banner?',
                  content: 'Nếu đã thu phí, xu sẽ được hoàn lại cho Seller.',
                  onOk: () => handleDelete(rec._id),
                })
              }
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className={styles.page}>
      {/* ── Header ── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <ThunderboltOutlined style={{ fontSize: 24, color: '#fa8c16' }} />
          <div>
            <Title level={4} style={{ margin: 0, color: '#0f172a' }}>
              Quản Lý Banner Quảng Cáo
            </Title>
            <Text type="secondary">Xét duyệt yêu cầu Seller + quản lý Banner hệ thống</Text>
          </div>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setCreateOpen(true)}
          style={{ background: '#0f172a', borderColor: '#0f172a' }}
        >
          Tạo Banner Hệ Thống
        </Button>
      </div>

      {/* ── Stats ── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {[
          {
            label: 'Chờ Duyệt',
            value: stats.pending,
            color: '#fa8c16',
            icon: <ClockCircleOutlined />,
          },
          {
            label: 'Đang Chạy',
            value: stats.running,
            color: '#52c41a',
            icon: <ThunderboltOutlined />,
          },
          {
            label: 'Tổng Xu Thu Được',
            value: stats.totalRevenue,
            color: '#f5a623',
            icon: <DollarOutlined />,
            suffix: ' xu',
          },
          {
            label: 'Tổng Lượt Xem',
            value: stats.totalViews,
            color: '#1677ff',
            icon: <BarChartOutlined />,
          },
        ].map((s) => (
          <Col key={s.label} xs={12} lg={6}>
            <Card size="small" style={{ borderRadius: 12, border: '1px solid #e8ecf0' }}>
              <Space>
                <div style={{ color: s.color, fontSize: 20 }}>{s.icon}</div>
                <Statistic
                  title={<Text style={{ fontSize: 11, color: '#64748b' }}>{s.label}</Text>}
                  value={s.value}
                  suffix={s.suffix}
                  valueStyle={{ fontSize: 18, color: s.color, fontWeight: 800 }}
                />
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      {/* ── Main Table ── */}
      <Card style={{ borderRadius: 14, border: '1px solid #e8ecf0' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <Title level={5} style={{ margin: 0 }}>
            Danh Sách Banner
          </Title>
          <Segmented
            value={statusFilter}
            onChange={(v) => {
              setStatusFilter(v);
              setPage(1);
            }}
            options={[
              { label: '⏳ Chờ Duyệt', value: 'PENDING_REVIEW' },
              { label: '✅ Đã Duyệt', value: 'APPROVED' },
              { label: '🔴 Đang Chạy', value: 'RUNNING' },
              { label: '📋 Tất Cả', value: '' },
            ]}
          />
        </div>
        <Table
          rowKey="_id"
          columns={columns}
          dataSource={banners}
          loading={loading}
          scroll={{ x: 1000 }}
          pagination={{
            current: page,
            total,
            pageSize: 20,
            onChange: setPage,
            showSizeChanger: false,
          }}
          locale={{ emptyText: <Empty description="Không có banner nào phù hợp" /> }}
        />
      </Card>

      {/* ── Reject Modal ── */}
      <Modal
        title="Từ chối Banner"
        open={!!rejectId}
        onOk={handleReject}
        onCancel={() => {
          setRejectId(null);
          rejectForm.resetFields();
        }}
        okText="Xác nhận từ chối & Hoàn xu"
        okButtonProps={{ danger: true, loading: rejecting }}
        cancelText="Huỷ"
      >
        <Form form={rejectForm} layout="vertical">
          <Form.Item
            name="rejectionReason"
            label="Lý do từ chối"
            rules={[{ required: true, min: 5, message: 'Vui lòng nhập lý do (ít nhất 5 ký tự)' }]}
          >
            <Input.TextArea
              rows={4}
              placeholder="VD: Hình ảnh vi phạm nội qui (nudity, hàng cấm...), chất lượng thấp, nội dung sai sự thật..."
            />
          </Form.Item>
        </Form>
        <Text type="secondary" style={{ fontSize: 12 }}>
          ⚠ Xu sẽ được <strong>hoàn lại ngay lập tức</strong> vào ví Seller sau khi bạn từ chối.
        </Text>
      </Modal>

      {/* ── Preview Drawer ── */}
      <Drawer
        title={previewBanner?.title}
        open={!!previewBanner}
        onClose={() => setPreviewBanner(null)}
        width={520}
        extra={
          previewBanner?.status === 'PENDING_REVIEW' && (
            <Space>
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                loading={approving[previewBanner?._id]}
                style={{ background: '#52c41a', borderColor: '#52c41a' }}
                onClick={() => {
                  handleApprove(previewBanner._id);
                  setPreviewBanner(null);
                }}
              >
                Duyệt
              </Button>
              <Button
                danger
                icon={<CloseCircleOutlined />}
                onClick={() => {
                  setRejectId(previewBanner._id);
                  setPreviewBanner(null);
                }}
              >
                Từ Chối
              </Button>
            </Space>
          )
        }
      >
        {previewBanner && (
          <div>
            {/* Banner preview */}
            <div
              style={{
                borderRadius: 12,
                overflow: 'hidden',
                background: 'linear-gradient(135deg, #0f0c29, #302b63)',
                minHeight: 180,
                backgroundImage: previewBanner.image ? `url(${previewBanner.image})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative',
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(0,0,0,0.45)',
                  borderRadius: 12,
                }}
              />
              <div style={{ position: 'relative', padding: '1.25rem', zIndex: 1 }}>
                <div
                  style={{
                    background: 'rgba(250,140,22,0.9)',
                    color: '#fff',
                    fontSize: 10,
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: 4,
                    width: 'fit-content',
                    marginBottom: 8,
                  }}
                >
                  <ThunderboltOutlined /> QUẢNG CÁO
                </div>
                <div style={{ color: '#fff', fontSize: 20, fontWeight: 900, lineHeight: 1.2 }}>
                  {previewBanner.title}
                </div>
                {previewBanner.subtitle && (
                  <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 4 }}>
                    {previewBanner.subtitle}
                  </div>
                )}
              </div>
            </div>

            <Divider />

            {[
              {
                label: 'Trạng thái',
                value: (
                  <Tag color={STATUS_CFG[previewBanner.status]?.color}>
                    {STATUS_CFG[previewBanner.status]?.label}
                  </Tag>
                ),
              },
              {
                label: 'Seller',
                value: previewBanner.sellerId
                  ? `${previewBanner.sellerId.fullName} (${previewBanner.sellerId.email})`
                  : 'Admin',
              },
              {
                label: 'Ngày bắt đầu',
                value: previewBanner.startDate
                  ? dayjs(previewBanner.startDate).format('DD/MM/YYYY HH:mm')
                  : '—',
              },
              {
                label: 'Ngày kết thúc',
                value: previewBanner.endDate
                  ? dayjs(previewBanner.endDate).format('DD/MM/YYYY HH:mm')
                  : '—',
              },
              { label: 'Số ngày', value: `${previewBanner.pricing?.totalDays || 0} ngày` },
              {
                label: 'Phí quảng cáo',
                value: `${(previewBanner.pricing?.totalFee || 0).toLocaleString()} xu`,
              },
              { label: 'Thanh toán', value: previewBanner.paymentStatus },
              { label: 'Lượt xem', value: (previewBanner.metrics?.views || 0).toLocaleString() },
              { label: 'Lượt click', value: (previewBanner.metrics?.clicks || 0).toLocaleString() },
              { label: 'CTR', value: `${previewBanner.ctr || '0.00'}%` },
            ].map(({ label, value }) => (
              <div
                key={label}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 0',
                  borderBottom: '1px solid #f1f5f9',
                  fontSize: 13,
                }}
              >
                <Text type="secondary">{label}</Text>
                <Text strong>{value}</Text>
              </div>
            ))}

            {previewBanner.rejectionReason && (
              <div
                style={{
                  marginTop: 12,
                  padding: 12,
                  background: '#fff1f0',
                  border: '1px solid #ffccc7',
                  borderRadius: 8,
                }}
              >
                <Text type="danger" style={{ fontSize: 12 }}>
                  <strong>Lý do từ chối:</strong> {previewBanner.rejectionReason}
                </Text>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* ── Create System Banner Modal ── */}
      <Modal
        title="Tạo Banner Hệ Thống (Admin)"
        open={createOpen}
        onOk={handleCreate}
        onCancel={() => {
          setCreateOpen(false);
          createForm.resetFields();
        }}
        okText="Tạo Banner"
        confirmLoading={creating}
        width={600}
      >
        <Form form={createForm} layout="vertical">
          <Form.Item name="title" label="Tiêu đề">
            <Input placeholder="Tiêu đề banner" maxLength={60} showCount />
          </Form.Item>
          <Form.Item name="subtitle" label="Phụ đề">
            <Input placeholder="Phụ đề (tuỳ chọn)" maxLength={80} showCount />
          </Form.Item>
          <Form.Item name="image" label="URL ảnh" rules={[{ required: true }]}>
            <Input placeholder="https://..." />
          </Form.Item>
          <Form.Item name="link" label="Đường dẫn">
            <Input placeholder="/products hoặc link nào đó" />
          </Form.Item>
          <Form.Item name="linkType" label="Loại liên kết" initialValue="none">
            <Select
              options={[
                { value: 'product', label: 'Sản phẩm' },
                { value: 'category', label: 'Danh mục' },
                { value: 'deal', label: 'Deal' },
                { value: 'external', label: 'Link ngoài' },
                { value: 'none', label: 'Không có link' },
              ]}
            />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="startDate" label="Ngày bắt đầu">
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="endDate" label="Ngày kết thúc">
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="order" label="Thứ tự hiển thị" initialValue={0}>
            <Input type="number" min={0} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminBannerAdsPage;
