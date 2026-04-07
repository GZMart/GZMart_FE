import { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Drawer,
  Empty,
  Form,
  Input,
  Row,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Timeline,
  Typography,
  message,
} from 'antd';
import { FileText, Filter, Plus, RefreshCcw, Scale, Send, ShieldCheck } from 'lucide-react';
import disputeService from '@services/api/disputeService';
import uploadService from '@services/api/uploadService';

const { TextArea } = Input;
const { Option } = Select;
const { Title, Text } = Typography;

const STATUS_META = {
  pending: { label: 'Pending', color: 'gold' },
  waiting_for_seller: { label: 'Waiting for Seller', color: 'geekblue' },
  investigating: { label: 'Investigating', color: 'blue' },
  resolved_refunded: { label: 'Resolved / Refunded', color: 'green' },
  resolved_rejected: { label: 'Resolved / Rejected', color: 'red' },
  appealed: { label: 'Appealed', color: 'purple' },
};

const TYPE_META = {
  order: { label: 'Order', color: 'cyan' },
  product: { label: 'Product', color: 'volcano' },
};

const ROLE_LABEL = {
  buyer: 'Buyer Disputes',
  seller: 'Seller Disputes',
  admin: 'Dispute Queue',
};

const ROLE_DESCRIPTION = {
  buyer: 'Track the disputes you created, submit evidence, and appeal outcomes when needed.',
  seller: 'Review cases tied to your products or orders and submit a counter-report with evidence.',
  admin: 'Triage all disputes, update the state machine, and process buyer-friendly resolutions.',
};

const ROLE_ENDPOINTS = {
  buyer: {
    list: disputeService.getMyReports,
    detail: disputeService.getReportById,
    create: disputeService.createReport,
    appeal: disputeService.appealReport,
  },
  seller: {
    list: disputeService.getSellerReports,
    detail: disputeService.getSellerReportById,
    counter: disputeService.submitCounterReport,
  },
  admin: {
    list: disputeService.getAdminReports,
    detail: disputeService.getAdminReportById,
    updateStatus: disputeService.updateReportStatus,
    acceptComplaint: disputeService.acceptComplaint,
  },
};

const ADMIN_STATUS_OPTIONS = [
  'pending',
  'waiting_for_seller',
  'investigating',
  'resolved_refunded',
  'resolved_rejected',
  'appealed',
];

const formatDate = (value) => {
  if (!value) return 'N/A';
  return new Date(value).toLocaleString('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

const parseEvidenceUrls = (value) =>
  String(value || '')
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);

const buildDisplayLabel = (report) => {
  if (!report) return 'Report';
  return report.reportNumber || report.title || report._id;
};

const statusTag = (status) => {
  const meta = STATUS_META[status] || { label: status, color: 'default' };
  return <Tag color={meta.color}>{meta.label}</Tag>;
};

const typeTag = (type) => {
  const meta = TYPE_META[type] || { label: type, color: 'default' };
  return <Tag color={meta.color}>{meta.label}</Tag>;
};

const stripHtml = (value) => String(value || '').replace(/<[^>]+>/g, '');

const MAX_MEDIA_FILES = 5;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;

const isVideoFile = (file) => file?.type?.startsWith('video/');

const buildPreviewItem = (file) => ({
  url: URL.createObjectURL(file),
  type: isVideoFile(file) ? 'video' : 'image',
  name: file.name,
});

const MediaUploader = ({ title, hint, files, previews, inputRef, disabled, onPick, onRemove }) => (
  <div style={{ display: 'grid', gap: 10 }}>
    <div>
      <Text strong>{title}</Text>
      {hint ? (
        <div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {hint}
          </Text>
        </div>
      ) : null}
    </div>

    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 12,
        alignItems: 'stretch',
      }}
    >
      {previews.map((media, index) => (
        <div
          key={`${media.url}-${index}`}
          style={{ position: 'relative', width: 92, height: 92, flexShrink: 0 }}
        >
          {media.type === 'video' ? (
            <video
              src={media.url}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: 12,
                background: '#0f172a',
              }}
            />
          ) : (
            <img
              src={media.url}
              alt={media.name || 'evidence'}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: 12,
              }}
            />
          )}
          <button
            type="button"
            onClick={() => onRemove(index)}
            disabled={disabled}
            style={{
              position: 'absolute',
              top: -6,
              right: -6,
              width: 22,
              height: 22,
              borderRadius: '50%',
              border: 'none',
              background: '#ef4444',
              color: '#fff',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(15, 23, 42, 0.18)',
            }}
          >
            ×
          </button>
        </div>
      ))}

      {files.length < MAX_MEDIA_FILES ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          style={{
            width: 92,
            height: 92,
            borderRadius: 12,
            border: '1px dashed #cbd5e1',
            background: '#f8fafc',
            color: '#475569',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 28,
            flexShrink: 0,
          }}
        >
          +
        </button>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*,video/*"
        onChange={onPick}
        style={{ display: 'none' }}
      />
    </div>
  </div>
);

MediaUploader.propTypes = {
  title: PropTypes.string.isRequired,
  hint: PropTypes.string,
  files: PropTypes.arrayOf(PropTypes.any).isRequired,
  previews: PropTypes.arrayOf(PropTypes.any).isRequired,
  inputRef: PropTypes.shape({ current: PropTypes.any }).isRequired,
  disabled: PropTypes.bool,
  onPick: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
};

const getActorName = (actor) => {
  if (!actor) return 'System';
  if (typeof actor === 'string') return actor;
  return actor.fullName || actor.email || actor._id || 'System';
};

const DisputeCenter = ({ mode, embedded = false }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pagination, setPagination] = useState({ total: 0, pages: 0 });
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailReport, setDetailReport] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [actionOpen, setActionOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionTarget, setActionTarget] = useState(null);
  const [createForm] = Form.useForm();
  const [actionForm] = Form.useForm();
  const [createFiles, setCreateFiles] = useState([]);
  const [createPreviews, setCreatePreviews] = useState([]);
  const [createUploading, setCreateUploading] = useState(false);
  const [actionFiles, setActionFiles] = useState([]);
  const [actionPreviews, setActionPreviews] = useState([]);
  const [actionUploading, setActionUploading] = useState(false);
  const createFileInputRef = useRef(null);
  const actionFileInputRef = useRef(null);

  const endpoint = ROLE_ENDPOINTS[mode];

  const statusOptions = useMemo(() => {
    if (mode === 'admin') {
      return ['all', ...ADMIN_STATUS_OPTIONS];
    }

    return [
      'all',
      'pending',
      'waiting_for_seller',
      'investigating',
      'resolved_refunded',
      'resolved_rejected',
      'appealed',
    ];
  }, [mode]);

  const revokePreviewUrls = (previews) => {
    previews.forEach((media) => {
      if (media?.url?.startsWith('blob:')) {
        URL.revokeObjectURL(media.url);
      }
    });
  };

  const clearCreateMedia = () => {
    revokePreviewUrls(createPreviews);
    setCreateFiles([]);
    setCreatePreviews([]);
    setCreateUploading(false);
    if (createFileInputRef.current) {
      createFileInputRef.current.value = '';
    }
  };

  const clearActionMedia = () => {
    revokePreviewUrls(actionPreviews);
    setActionFiles([]);
    setActionPreviews([]);
    setActionUploading(false);
    if (actionFileInputRef.current) {
      actionFileInputRef.current.value = '';
    }
  };

  const closeCreateDrawer = () => {
    setCreateOpen(false);
    createForm.resetFields();
    clearCreateMedia();
  };

  const closeActionDrawer = () => {
    setActionOpen(false);
    setActionTarget(null);
    actionForm.resetFields();
    clearActionMedia();
  };

  const getMediaUrls = async (files) => {
    if (!files.length) {
      return [];
    }

    const uploadResults = await uploadService.uploadMultipleMedia(files);
    return uploadResults
      .map((result) => result?.url || result?.data?.url || result?.secure_url)
      .filter(Boolean);
  };

  const handleCreateFileChange = (event) => {
    const incomingFiles = Array.from(event.target.files || []);
    if (!incomingFiles.length) {
      return;
    }

    const remainingSlots = MAX_MEDIA_FILES - createFiles.length;
    if (remainingSlots <= 0) {
      message.warning(`You can upload up to ${MAX_MEDIA_FILES} files.`);
      event.target.value = '';
      return;
    }

    const acceptedFiles = [];
    const acceptedPreviews = [];

    incomingFiles.slice(0, remainingSlots).forEach((file) => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');

      if (!isImage && !isVideo) {
        message.error(`${file.name} is not a supported image/video file.`);
        return;
      }

      const sizeLimit = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
      if (file.size > sizeLimit) {
        message.error(
          `${file.name} is too large. Max size is ${isVideo ? '50MB for video' : '10MB for image'}.`
        );
        return;
      }

      acceptedFiles.push(file);
      acceptedPreviews.push(buildPreviewItem(file));
    });

    if (acceptedFiles.length > 0) {
      setCreateFiles((prev) => [...prev, ...acceptedFiles]);
      setCreatePreviews((prev) => [...prev, ...acceptedPreviews]);
    }

    event.target.value = '';
  };

  const handleActionFileChange = (event) => {
    const incomingFiles = Array.from(event.target.files || []);
    if (!incomingFiles.length) {
      return;
    }

    const remainingSlots = MAX_MEDIA_FILES - actionFiles.length;
    if (remainingSlots <= 0) {
      message.warning(`You can upload up to ${MAX_MEDIA_FILES} files.`);
      event.target.value = '';
      return;
    }

    const acceptedFiles = [];
    const acceptedPreviews = [];

    incomingFiles.slice(0, remainingSlots).forEach((file) => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');

      if (!isImage && !isVideo) {
        message.error(`${file.name} is not a supported image/video file.`);
        return;
      }

      const sizeLimit = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
      if (file.size > sizeLimit) {
        message.error(
          `${file.name} is too large. Max size is ${isVideo ? '50MB for video' : '10MB for image'}.`
        );
        return;
      }

      acceptedFiles.push(file);
      acceptedPreviews.push(buildPreviewItem(file));
    });

    if (acceptedFiles.length > 0) {
      setActionFiles((prev) => [...prev, ...acceptedFiles]);
      setActionPreviews((prev) => [...prev, ...acceptedPreviews]);
    }

    event.target.value = '';
  };

  const loadReports = async (nextPage = page, nextPageSize = pageSize) => {
    setLoading(true);
    try {
      const params = {
        page: nextPage,
        limit: nextPageSize,
      };

      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      if (typeFilter !== 'all') {
        params.type = typeFilter;
      }

      const response = await endpoint.list(params);
      const payload = response || {};

      setReports(Array.isArray(payload.data) ? payload.data : payload.reports || []);
      setPagination(payload.pagination || { total: 0, pages: 0 });
      setPage(nextPage);
      setPageSize(nextPageSize);
    } catch (error) {
      console.error('[DisputeCenter] Failed to load reports:', error);
      message.error(error?.message || 'Failed to load disputes');
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const openDetail = async (report) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailReport(report);

    try {
      const response = await endpoint.detail(report._id);
      const payload = response || {};
      setDetailReport(payload.data || payload);
    } catch (error) {
      console.error('[DisputeCenter] Failed to load detail:', error);
      message.error(error?.message || 'Failed to load dispute detail');
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    loadReports(1, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, statusFilter, typeFilter]);

  const filteredReports = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return reports;

    return reports.filter((report) => {
      const haystack = [
        report.reportNumber,
        report.title,
        report.description,
        report.category,
        report.productId?.name,
        report.orderId?.orderNumber,
      ]
        .map((value) => String(value || '').toLowerCase())
        .join(' ');
      return haystack.includes(q);
    });
  }, [reports, searchText]);

  const stats = useMemo(() => {
    const counter = (status) => reports.filter((report) => report.status === status).length;
    return [
      { label: 'Total', value: pagination.total || reports.length, tone: 'blue' },
      { label: 'Pending', value: counter('pending'), tone: 'gold' },
      { label: 'Investigating', value: counter('investigating'), tone: 'cyan' },
      {
        label: 'Resolved',
        value: counter('resolved_refunded') + counter('resolved_rejected'),
        tone: 'green',
      },
    ];
  }, [pagination.total, reports]);

  const submitCreateReport = async () => {
    setCreateUploading(true);
    try {
      const values = await createForm.validateFields();
      const uploadedEvidenceUrls = await getMediaUrls(createFiles);
      const payload = {
        ...values,
        evidenceUrls: [...parseEvidenceUrls(values.evidenceUrls), ...uploadedEvidenceUrls],
      };

      await endpoint.create(payload);
      message.success('Report created successfully');
      closeCreateDrawer();
      await loadReports(1, pageSize);
    } catch (error) {
      if (error?.errorFields) return;
      console.error('[DisputeCenter] Create report failed:', error);
      message.error(error?.message || 'Failed to create report');
    } finally {
      setCreateUploading(false);
    }
  };

  const submitCounterReport = async () => {
    setActionLoading(true);
    setActionUploading(true);
    try {
      const values = await actionForm.validateFields();
      const uploadedEvidenceUrls = await getMediaUrls(actionFiles);
      await endpoint.counter(actionTarget._id, {
        counterNote: values.counterNote,
        evidenceUrls: [...parseEvidenceUrls(values.evidenceUrls), ...uploadedEvidenceUrls],
      });

      message.success('Counter-report submitted');
      closeActionDrawer();
      await loadReports(page, pageSize);

      if (detailOpen && detailReport?._id === actionTarget._id) {
        await openDetail(actionTarget);
      }
    } catch (error) {
      if (error?.errorFields) return;
      console.error('[DisputeCenter] Counter-report failed:', error);
      message.error(error?.message || 'Failed to submit counter-report');
    } finally {
      setActionLoading(false);
      setActionUploading(false);
    }
  };

  const submitUpdateStatus = async () => {
    setActionLoading(true);
    try {
      const values = await actionForm.validateFields();
      await endpoint.updateStatus(actionTarget._id, {
        status: values.status,
        note: values.note,
        resolutionNote: values.resolutionNote,
        appealNote: values.appealNote,
      });

      message.success('Report status updated');
      closeActionDrawer();
      await loadReports(page, pageSize);
      if (detailOpen && detailReport?._id === actionTarget._id) {
        await openDetail(actionTarget);
      }
    } catch (error) {
      if (error?.errorFields) return;
      console.error('[DisputeCenter] Status update failed:', error);
      message.error(error?.message || 'Failed to update report');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptComplaint = async (report) => {
    try {
      await endpoint.acceptComplaint(report._id, {
        resolutionNote: 'Complaint accepted from admin panel',
      });
      message.success('Complaint accepted and refund simulated');
      await loadReports(page, pageSize);
      if (detailOpen && detailReport?._id === report._id) {
        await openDetail(report);
      }
    } catch (error) {
      console.error('[DisputeCenter] Accept complaint failed:', error);
      message.error(error?.message || 'Failed to accept complaint');
    }
  };

  const handleAppeal = async () => {
    try {
      await endpoint.appeal(detailReport._id, {
        appealNote: detailReport?.appealNote || 'Please review my evidence again.',
      });
      message.success('Appeal submitted');
      await loadReports(page, pageSize);
      await openDetail(detailReport);
    } catch (error) {
      console.error('[DisputeCenter] Appeal failed:', error);
      message.error(error?.message || 'Failed to appeal report');
    }
  };

  const columns = useMemo(
    () => [
      {
        title: 'Report',
        key: 'report',
        render: (_, report) => (
          <Space direction="vertical" size={0}>
            <Text strong>{buildDisplayLabel(report)}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {stripHtml(report.title)}
            </Text>
          </Space>
        ),
      },
      {
        title: 'Type',
        dataIndex: 'type',
        width: 100,
        render: (value) => typeTag(value),
      },
      {
        title: 'Status',
        dataIndex: 'status',
        width: 180,
        render: (value) => statusTag(value),
      },
      {
        title: mode === 'buyer' ? 'Seller' : 'Buyer',
        key: 'party',
        render: (_, report) => {
          if (mode === 'buyer') {
            return report.sellerIds?.[0]?.fullName || report.sellerIds?.[0]?.email || 'N/A';
          }
          return report.buyerId?.fullName || report.buyerId?.email || 'N/A';
        },
      },
      {
        title: 'Created',
        dataIndex: 'createdAt',
        width: 180,
        render: (value) => formatDate(value),
      },
      {
        title: 'Actions',
        key: 'actions',
        width: 220,
        render: (_, report) => (
          <Space wrap>
            <Button size="small" onClick={() => openDetail(report)} icon={<FileText size={14} />}>
              View
            </Button>

            {mode === 'buyer' &&
              ['resolved_refunded', 'resolved_rejected'].includes(report.status) && (
                <Button
                  size="small"
                  type="primary"
                  onClick={() => openDetail(report)}
                  icon={<Scale size={14} />}
                >
                  Appeal
                </Button>
              )}

            {mode === 'seller' && ['pending', 'waiting_for_seller'].includes(report.status) && (
              <Button
                size="small"
                type="primary"
                onClick={() => {
                  setActionTarget(report);
                  clearActionMedia();
                  setActionOpen(true);
                  actionForm.setFieldsValue({ counterNote: '', evidenceUrls: '' });
                }}
              >
                Counter
              </Button>
            )}

            {mode === 'admin' && (
              <>
                <Button
                  size="small"
                  type="primary"
                  onClick={() => {
                    setActionTarget(report);
                    clearActionMedia();
                    setActionOpen(true);
                    actionForm.setFieldsValue({
                      status: report.status,
                      note: '',
                      resolutionNote: '',
                      appealNote: '',
                    });
                  }}
                >
                  Update
                </Button>
                <Button size="small" danger onClick={() => handleAcceptComplaint(report)}>
                  Accept
                </Button>
              </>
            )}
          </Space>
        ),
      },
    ],
    [actionForm, mode]
  );

  const detailHistory = detailReport?.histories || detailReport?.history || [];
  const detailEvidences = detailReport?.evidences || [];

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <Card
        bordered={false}
        style={{
          borderRadius: 20,
          background: 'linear-gradient(135deg, #0f172a 0%, #1d4ed8 60%, #2563eb 100%)',
          color: '#fff',
          boxShadow: '0 18px 40px rgba(15, 23, 42, 0.22)',
        }}
      >
        <Row gutter={[16, 16]} align="middle" justify="space-between">
          <Col xs={24} lg={16}>
            <Space direction="vertical" size={8}>
              <Tag color="geekblue" style={{ width: 'fit-content' }}>
                Dispute Resolution
              </Tag>
              <Title level={2} style={{ color: '#fff', margin: 0 }}>
                {ROLE_LABEL[mode]}
              </Title>
              <Text style={{ color: 'rgba(255,255,255,0.85)', maxWidth: 720 }}>
                {ROLE_DESCRIPTION[mode]}
              </Text>
            </Space>
          </Col>
          <Col xs={24} lg={8} style={{ textAlign: 'right' }}>
            {mode === 'buyer' ? (
              <Button
                type="primary"
                icon={<Plus size={16} />}
                onClick={() => {
                  createForm.resetFields();
                  clearCreateMedia();
                  setCreateOpen(true);
                }}
                style={{
                  background: '#fff',
                  borderColor: '#fff',
                  color: '#1d4ed8',
                  fontWeight: 600,
                }}
              >
                New Report
              </Button>
            ) : null}
          </Col>
        </Row>

        <Row gutter={12} style={{ marginTop: 20 }}>
          {stats.map((stat) => (
            <Col key={stat.label} xs={12} md={6}>
              <div
                style={{
                  background: 'rgba(255,255,255,0.11)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 16,
                  padding: 16,
                  backdropFilter: 'blur(10px)',
                }}
              >
                <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>{stat.label}</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#fff' }}>{stat.value}</div>
              </div>
            </Col>
          ))}
        </Row>
      </Card>

      <Card
        bordered={false}
        style={{ borderRadius: 18, boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)' }}
      >
        <Space wrap style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }}>
          <Space wrap>
            <Input
              placeholder="Search report number, title, product or order"
              prefix={<Filter size={14} />}
              allowClear
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 320 }}
            />

            <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 220 }}>
              <Option value="all">All statuses</Option>
              {statusOptions
                .filter((value) => value !== 'all')
                .map((status) => (
                  <Option key={status} value={status}>
                    {STATUS_META[status]?.label || status}
                  </Option>
                ))}
            </Select>

            <Select value={typeFilter} onChange={setTypeFilter} style={{ width: 160 }}>
              <Option value="all">All types</Option>
              <Option value="order">Order</Option>
              <Option value="product">Product</Option>
            </Select>
          </Space>

          <Button icon={<RefreshCcw size={14} />} onClick={() => loadReports(page, pageSize)}>
            Refresh
          </Button>
        </Space>

        {loading ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <Spin size="large" />
          </div>
        ) : filteredReports.length === 0 ? (
          <Empty
            description="No disputes found"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ padding: '36px 0' }}
          />
        ) : (
          <Table
            rowKey="_id"
            columns={columns}
            dataSource={filteredReports}
            pagination={{
              current: page,
              pageSize,
              total: pagination.total || reports.length,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50'],
            }}
            onChange={(nextPagination) => {
              const nextPage = nextPagination.current || 1;
              const nextSize = nextPagination.pageSize || pageSize;
              loadReports(nextPage, nextSize);
            }}
            onRow={(record) => ({
              onClick: () => openDetail(record),
              style: { cursor: 'pointer' },
            })}
          />
        )}
      </Card>

      <Drawer
        width={760}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title={detailReport ? buildDisplayLabel(detailReport) : 'Dispute Detail'}
        destroyOnClose
      >
        {detailLoading ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <Spin size="large" />
          </div>
        ) : detailReport ? (
          <Space direction="vertical" size={18} style={{ width: '100%' }}>
            <Alert
              type={mode === 'admin' ? 'info' : 'success'}
              showIcon
              message={detailReport.title}
              description={stripHtml(detailReport.description)}
            />

            <Card size="small" title="Overview" style={{ borderRadius: 16 }}>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Report Number">
                  {detailReport.reportNumber}
                </Descriptions.Item>
                <Descriptions.Item label="Type">{typeTag(detailReport.type)}</Descriptions.Item>
                <Descriptions.Item label="Status">
                  {statusTag(detailReport.status)}
                </Descriptions.Item>
                <Descriptions.Item label="Category">
                  {detailReport.category || 'General'}
                </Descriptions.Item>
                <Descriptions.Item label="Created At">
                  {formatDate(detailReport.createdAt)}
                </Descriptions.Item>
                <Descriptions.Item label="Buyer">
                  {getActorName(detailReport.buyerId)}
                </Descriptions.Item>
                <Descriptions.Item label={mode === 'buyer' ? 'Seller' : 'Related Seller'}>
                  {(detailReport.sellerIds || [])
                    .map((seller) => getActorName(seller))
                    .join(', ') || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Related Order">
                  {detailReport.orderId?.orderNumber || detailReport.orderId || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Related Product">
                  {detailReport.productId?.name || detailReport.productId?.title || 'N/A'}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card size="small" title="Evidence" style={{ borderRadius: 16 }}>
              {detailEvidences.length === 0 ? (
                <Empty description="No evidence attached" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              ) : (
                <Space direction="vertical" style={{ width: '100%' }}>
                  {detailEvidences.map((item) => (
                    <Card key={item._id || item.fileUrl} size="small" style={{ borderRadius: 14 }}>
                      <Space direction="vertical" size={2}>
                        <a href={item.fileUrl} target="_blank" rel="noreferrer">
                          {item.fileName || item.fileUrl}
                        </a>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Uploaded by {getActorName(item.uploadedBy)} on{' '}
                          {formatDate(item.createdAt)}
                        </Text>
                      </Space>
                    </Card>
                  ))}
                </Space>
              )}
            </Card>

            <Card size="small" title="Timeline" style={{ borderRadius: 16 }}>
              {detailHistory.length === 0 ? (
                <Empty description="No history available" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              ) : (
                <Timeline
                  items={detailHistory.map((entry) => ({
                    color: entry.action === 'refund_triggered' ? 'green' : 'blue',
                    children: (
                      <Space direction="vertical" size={0}>
                        <Text strong>{entry.action.replace(/_/g, ' ').toUpperCase()}</Text>
                        <Text type="secondary">{entry.note || 'No note provided'}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {getActorName(entry.actorId)} • {formatDate(entry.createdAt)}
                        </Text>
                      </Space>
                    ),
                  }))}
                />
              )}
            </Card>

            <Space wrap>
              {mode === 'buyer' &&
                ['resolved_refunded', 'resolved_rejected'].includes(detailReport.status) && (
                  <Button type="primary" icon={<Scale size={14} />} onClick={handleAppeal}>
                    Appeal Resolution
                  </Button>
                )}

              {mode === 'seller' &&
                ['pending', 'waiting_for_seller'].includes(detailReport.status) && (
                  <Button
                    type="primary"
                    icon={<Send size={14} />}
                    onClick={() => {
                      setActionTarget(detailReport);
                      clearActionMedia();
                      setActionOpen(true);
                      actionForm.setFieldsValue({ counterNote: '', evidenceUrls: '' });
                    }}
                  >
                    Send Counter-Report
                  </Button>
                )}

              {mode === 'admin' && (
                <>
                  <Button
                    icon={<ShieldCheck size={14} />}
                    onClick={() => {
                      setActionTarget(detailReport);
                      clearActionMedia();
                      setActionOpen(true);
                      actionForm.setFieldsValue({
                        status: detailReport.status,
                        note: '',
                        resolutionNote: '',
                        appealNote: '',
                      });
                    }}
                  >
                    Update Status
                  </Button>
                  <Button danger onClick={() => handleAcceptComplaint(detailReport)}>
                    Accept Complaint
                  </Button>
                </>
              )}
            </Space>
          </Space>
        ) : null}
      </Drawer>

      <Drawer
        width={760}
        open={createOpen}
        onClose={closeCreateDrawer}
        title="Create Dispute Report"
        destroyOnClose
      >
        <Form form={createForm} layout="vertical" initialValues={{ type: 'order' }}>
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Form.Item
              name="type"
              label="Report Type"
              rules={[{ required: true, message: 'Select a type' }]}
            >
              <Select>
                <Option value="order">Order</Option>
                <Option value="product">Product</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="title"
              label="Title"
              rules={[{ required: true, message: 'Enter a title' }]}
            >
              <Input placeholder="Short summary of the issue" />
            </Form.Item>

            <Form.Item name="category" label="Category">
              <Input placeholder="Damage, fraud, missing item, wrong product..." />
            </Form.Item>

            <Form.Item
              name="description"
              label="Description"
              rules={[{ required: true, message: 'Describe the issue' }]}
            >
              <TextArea rows={4} placeholder="Provide a clear explanation of what happened" />
            </Form.Item>

            <Form.Item shouldUpdate noStyle>
              {({ getFieldValue }) => (
                <>
                  {getFieldValue('type') === 'order' ? (
                    <Form.Item
                      name="orderId"
                      label="Order ID"
                      rules={[{ required: true, message: 'Enter the order ID' }]}
                    >
                      <Input placeholder="Paste the order ID" />
                    </Form.Item>
                  ) : (
                    <Form.Item
                      name="productId"
                      label="Product ID"
                      rules={[{ required: true, message: 'Enter the product ID' }]}
                    >
                      <Input placeholder="Paste the product ID" />
                    </Form.Item>
                  )}
                </>
              )}
            </Form.Item>

            <MediaUploader
              title="Attach evidence"
              hint="Upload up to 5 images/videos. Supported: image/*, mp4, mov. Max 10MB/image and 50MB/video."
              files={createFiles}
              previews={createPreviews}
              inputRef={createFileInputRef}
              disabled={createUploading}
              onPick={handleCreateFileChange}
              onRemove={(index) => {
                setCreateFiles((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
                setCreatePreviews((prev) => {
                  const next = [...prev];
                  const removed = next.splice(index, 1)[0];
                  if (removed?.url?.startsWith('blob:')) {
                    URL.revokeObjectURL(removed.url);
                  }
                  return next;
                });
              }}
            />

            <Form.Item
              name="evidenceUrls"
              label="Evidence URLs"
              tooltip="Paste one URL per line or separate by comma"
            >
              <TextArea rows={4} placeholder="https://...\nhttps://..." />
            </Form.Item>

            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={closeCreateDrawer} disabled={createUploading}>
                Cancel
              </Button>
              <Button type="primary" onClick={submitCreateReport} loading={createUploading}>
                Submit Report
              </Button>
            </Space>
          </Space>
        </Form>
      </Drawer>

      <Drawer
        width={720}
        open={actionOpen}
        onClose={closeActionDrawer}
        title={mode === 'seller' ? 'Submit Counter-Report' : 'Update Report Status'}
        destroyOnClose
      >
        <Form form={actionForm} layout="vertical">
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            {mode === 'seller' && (
              <>
                <Form.Item
                  name="counterNote"
                  label="Counter Note"
                  rules={[{ required: true, message: 'Add your explanation' }]}
                >
                  <TextArea rows={4} placeholder="Explain your side of the dispute" />
                </Form.Item>

                <MediaUploader
                  title="Attach evidence"
                  hint="Upload up to 5 images/videos to support your counter-report."
                  files={actionFiles}
                  previews={actionPreviews}
                  inputRef={actionFileInputRef}
                  disabled={actionUploading}
                  onPick={handleActionFileChange}
                  onRemove={(index) => {
                    setActionFiles((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
                    setActionPreviews((prev) => {
                      const next = [...prev];
                      const removed = next.splice(index, 1)[0];
                      if (removed?.url?.startsWith('blob:')) {
                        URL.revokeObjectURL(removed.url);
                      }
                      return next;
                    });
                  }}
                />

                <Form.Item name="evidenceUrls" label="Evidence URLs">
                  <TextArea rows={4} placeholder="https://...\nhttps://..." />
                </Form.Item>
              </>
            )}

            {mode === 'admin' && (
              <>
                <Form.Item
                  name="status"
                  label="Next Status"
                  rules={[{ required: true, message: 'Select a status' }]}
                >
                  <Select>
                    {ADMIN_STATUS_OPTIONS.map((status) => (
                      <Option key={status} value={status}>
                        {STATUS_META[status]?.label || status}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item name="note" label="Investigation Note">
                  <TextArea rows={3} placeholder="Internal note for audit log" />
                </Form.Item>
                <Form.Item name="resolutionNote" label="Resolution Note">
                  <TextArea rows={3} placeholder="Optional resolution note" />
                </Form.Item>
                <Form.Item name="appealNote" label="Appeal Note">
                  <TextArea rows={3} placeholder="Optional appeal note" />
                </Form.Item>
              </>
            )}

            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={closeActionDrawer} disabled={actionLoading}>
                Cancel
              </Button>
              <Button
                type="primary"
                onClick={mode === 'seller' ? submitCounterReport : submitUpdateStatus}
                loading={actionLoading}
              >
                {mode === 'seller' ? 'Submit Counter-Report' : 'Save Changes'}
              </Button>
            </Space>
          </Space>
        </Form>
      </Drawer>
    </div>
  );
};

DisputeCenter.propTypes = {
  mode: PropTypes.oneOf(['buyer', 'seller', 'admin']).isRequired,
  embedded: PropTypes.bool,
};

export default DisputeCenter;
