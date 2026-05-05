import { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Drawer,
  Empty,
  Form,
  Input,
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
import QuickReportButton from '@components/seller/dashboard/QuickReportButton';
import disputeService from '@services/api/disputeService';
import { orderService } from '@services/api/orderService';
import { productService } from '@services/api';
import uploadService from '@services/api/uploadService';
import styles from '@assets/styles/buyer/ProfilePage/ProfilePage.module.css';
import {
  REPORT_TYPES,
  REPORT_TYPE_OPTIONS,
  REPORT_CATEGORIES_BY_TYPE,
  validateReportForm,
} from '@constants/common/disputes/reportForm.schema';
import {
  ADMIN_STATUS_OPTIONS,
  MAX_IMAGE_SIZE,
  MAX_MEDIA_FILES,
  MAX_VIDEO_SIZE,
  REPORT_STATUS_TABS,
  STATUS_META,
  TYPE_META,
} from './dispute.constants';
import {
  buildDisplayLabel,
  buildOrderLabelText,
  buildPreviewItem,
  extractInteractedSellers,
  formatDate,
  getActorName,
  getOrderItems,
  stripHtml,
} from './dispute.utils';
import MediaUploader from './MediaUploader';

const { TextArea } = Input;
const { Option } = Select;
const { Text } = Typography;

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

const statusTag = (status) => {
  const meta = STATUS_META[status] || { label: status, color: 'default' };
  return <Tag color={meta.color}>{meta.label}</Tag>;
};

const typeTag = (type) => {
  const meta = TYPE_META[type] || { label: type, color: 'default' };
  return <Tag color={meta.color}>{meta.label}</Tag>;
};

const DisputeCenter = ({ mode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

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
  const [contextLoading, setContextLoading] = useState(false);
  const [reportOrders, setReportOrders] = useState([]);
  const [reportSellers, setReportSellers] = useState([]);
  const [selectedProductSubject, setSelectedProductSubject] = useState(null);
  const [actionFiles, setActionFiles] = useState([]);
  const [actionPreviews, setActionPreviews] = useState([]);
  const [actionUploading, setActionUploading] = useState(false);
  const createFileInputRef = useRef(null);
  const actionFileInputRef = useRef(null);
  const prevCreateReportTypeRef = useRef(null);

  const endpoint = ROLE_ENDPOINTS[mode];

  const reportType = Form.useWatch('type', createForm);

  const orderOptions = useMemo(
    () =>
      reportOrders.map((order) => ({
        value: order._id,
        labelText: buildOrderLabelText(order),
        searchText: `${order.orderNumber || ''} ${buildOrderLabelText(order)} ${getOrderItems(order)
          .map((item) => item?.productId?.name || '')
          .join(' ')}`.toLowerCase(),
        order,
      })),
    [reportOrders]
  );

  const sellerOptions = useMemo(
    () =>
      reportSellers.map((seller) => {
        const labelText = `${seller.fullName || seller.email || seller._id} - ${seller.interactedOrderCount} interactions`;
        return {
          value: seller._id,
          labelText,
          searchText:
            `${seller.fullName || ''} ${seller.email || ''} ${seller._id || ''}`.toLowerCase(),
          seller,
        };
      }),
    [reportSellers]
  );

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
    prevCreateReportTypeRef.current = null;
    createForm.resetFields();
    setSelectedProductSubject(null);
    clearCreateMedia();
  };

  const closeActionDrawer = () => {
    setActionOpen(false);
    setActionTarget(null);
    actionForm.resetFields();
    clearActionMedia();
  };

  const loadReportContext = async () => {
    if (mode !== 'buyer') {
      return;
    }

    setContextLoading(true);
    try {
      const orders = [];
      let pageIndex = 1;
      const limit = 50;
      let totalPages = 1;

      while (pageIndex <= totalPages && pageIndex <= 20) {
        const response = await orderService.getMyOrders(pageIndex, limit);
        const payload = response || {};
        const data = Array.isArray(payload.data) ? payload.data : [];
        orders.push(...data);

        const pages = Number(payload?.pagination?.pages || 1);
        totalPages = Number.isFinite(pages) && pages > 0 ? pages : 1;
        pageIndex += 1;
      }

      setReportOrders(orders);
      setReportSellers(extractInteractedSellers(orders));
    } catch (error) {
      console.error('[DisputeCenter] Failed to load report context:', error);
      message.error(error?.message || 'Failed to load orders/sellers for reporting');
      setReportOrders([]);
      setReportSellers([]);
    } finally {
      setContextLoading(false);
    }
  };

  const openCreateDrawer = (prefill = {}) => {
    const initialType = prefill.type || REPORT_TYPES.ORDER;

    createForm.resetFields();
    clearCreateMedia();
    setSelectedProductSubject(prefill.productSubject || null);
    createForm.setFieldsValue({
      type: initialType,
      title: prefill.title || '',
      category: prefill.category || undefined,
      description: prefill.description || '',
      orderId: prefill.orderId || undefined,
      productId: prefill.productId || undefined,
      sellerId: prefill.sellerId || undefined,
    });
    prevCreateReportTypeRef.current = initialType;
    setCreateOpen(true);
  };

  useEffect(() => {
    if (mode !== 'buyer') {
      return;
    }
    loadReportContext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useEffect(() => {
    if (!createOpen) {
      return;
    }

    if (!reportType) {
      return;
    }

    const previousType = prevCreateReportTypeRef.current;
    if (!previousType) {
      prevCreateReportTypeRef.current = reportType;
      return;
    }

    if (previousType === reportType) {
      return;
    }

    if (reportType !== REPORT_TYPES.ORDER) {
      createForm.setFieldValue('orderId', undefined);
    }
    if (reportType !== REPORT_TYPES.PRODUCT) {
      createForm.setFieldValue('productId', undefined);
      setSelectedProductSubject(null);
    }
    if (reportType !== REPORT_TYPES.SELLER) {
      createForm.setFieldValue('sellerId', undefined);
    }
    createForm.setFieldValue('category', undefined);

    prevCreateReportTypeRef.current = reportType;
  }, [createForm, createOpen, reportType]);

  useEffect(() => {
    if (mode !== 'buyer') {
      return;
    }

    const openReport = searchParams.get('openReport') === '1';
    const reportTypeFromUrl = searchParams.get('reportType');
    const subjectProductId = searchParams.get('subjectProductId');
    const navPrefill = location.state?.reportPrefill || null;

    if (!openReport && !navPrefill?.openForm) {
      return;
    }

    const openFromIntent = async () => {
      const intentType = navPrefill?.type || reportTypeFromUrl || REPORT_TYPES.PRODUCT;
      const productId = navPrefill?.product?._id || subjectProductId;

      openCreateDrawer({
        type: intentType,
        productId: intentType === REPORT_TYPES.PRODUCT ? productId : undefined,
        productSubject: navPrefill?.product || null,
      });

      if (intentType === REPORT_TYPES.PRODUCT && productId) {
        if (navPrefill?.product?._id === productId) {
          setSelectedProductSubject(navPrefill.product);
        } else {
          try {
            const response = await productService.getById(productId);
            const data = response?.data?.data || response?.data || response;
            if (data?._id) {
              setSelectedProductSubject(data);
            }
          } catch (error) {
            console.error('[DisputeCenter] Failed to preload product subject:', error);
          }
        }
      }

      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('openReport');
      nextParams.delete('reportType');
      nextParams.delete('subjectProductId');
      navigate(location.pathname + (nextParams.toString() ? `?${nextParams.toString()}` : ''), {
        replace: true,
        state: {},
      });
    };

    openFromIntent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, location.key]);

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

  const appendLocalReport = (report) => {
    setReports((prev) => [report, ...prev]);
    setPagination((p) => ({ ...p, total: (p.total || 0) + 1 }));
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
    if (!q) {
      return reports;
    }

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

  const reportStatusCounts = useMemo(() => {
    const counts = {
      all: reports.length,
    };

    REPORT_STATUS_TABS.forEach((tab) => {
      if (tab.key === 'all') {
        return;
      }
      counts[tab.key] = reports.filter((report) => report.status === tab.key).length;
    });

    return counts;
  }, [reports]);

  const submitCreateReport = async () => {
    setCreateUploading(true);
    try {
      const values = await createForm.validateFields();
      await validateReportForm(values);
      const uploadedEvidenceUrls = await getMediaUrls(createFiles);
      const payload = {
        ...values,
        evidenceUrls: uploadedEvidenceUrls,
      };

      await endpoint.create(payload);
      message.success('Report created successfully');
      closeCreateDrawer();
      await loadReports(1, pageSize);
    } catch (error) {
      if (error?.errorFields) {
        return;
      }
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
        evidenceUrls: uploadedEvidenceUrls,
      });

      message.success('Counter-report submitted');
      closeActionDrawer();
      await loadReports(page, pageSize);

      if (detailOpen && detailReport?._id === actionTarget._id) {
        await openDetail(actionTarget);
      }
    } catch (error) {
      if (error?.errorFields) {
        return;
      }
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
      const response = await endpoint.updateStatus(actionTarget._id, {
        status: values.status,
        note: values.note,
        resolutionNote: values.resolutionNote,
        appealNote: values.appealNote,
      });

      // Use server response to update the single report in-place so the table reflects the change
      const updated = response?.data?.data || response?.data || response;
      setReports((prev) => prev.map((r) => (r._id === updated._id ? updated : r)));

      message.success('Report status updated');
      closeActionDrawer();
    } catch (error) {
      if (error?.errorFields) {
        return;
      }
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
        width: mode === 'admin' ? 300 : 220,
        render: (_, report) => (
          <Space wrap={mode !== 'admin'} size={6} onClick={(event) => event.stopPropagation()}>
            <Button
              size="small"
              onClick={(event) => {
                event.stopPropagation();
                openDetail(report);
              }}
              icon={<FileText size={14} />}
            >
              View
            </Button>

            {mode === 'buyer' &&
              ['resolved_refunded', 'resolved_rejected'].includes(report.status) && (
                <Button
                  size="small"
                  type="primary"
                  onClick={(event) => {
                    event.stopPropagation();
                    openDetail(report);
                  }}
                  icon={<Scale size={14} />}
                >
                  Appeal
                </Button>
              )}

            {mode === 'seller' && ['pending', 'waiting_for_seller'].includes(report.status) && (
              <Button
                size="small"
                type="primary"
                onClick={(event) => {
                  event.stopPropagation();
                  setActionTarget(report);
                  clearActionMedia();
                  setActionOpen(true);
                  actionForm.setFieldsValue({ counterNote: '' });
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
                  onClick={(event) => {
                    event.stopPropagation();
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
                <Button
                  size="small"
                  danger
                  onClick={(event) => {
                    event.stopPropagation();
                    handleAcceptComplaint(report);
                  }}
                >
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
  const createCategoryOptions = REPORT_CATEGORIES_BY_TYPE[reportType] || [];

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div>
        <div className={styles.orderFilterTabs} style={{ marginBottom: 16 }}>
          {REPORT_STATUS_TABS.map((tab) => {
            const count = reportStatusCounts[tab.key] || 0;
            return (
              <button
                key={tab.key}
                className={`${styles.orderFilterTab} ${statusFilter === tab.key ? styles.orderFilterTabActive : ''}`}
                onClick={() => setStatusFilter(tab.key)}
              >
                <span>{tab.label}</span>
                <span
                  style={{
                    marginLeft: 8,
                    minWidth: 20,
                    height: 20,
                    borderRadius: 999,
                    padding: '0 6px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 700,
                    background: statusFilter === tab.key ? 'rgba(255,255,255,0.25)' : '#e5e7eb',
                    color: statusFilter === tab.key ? '#fff' : '#334155',
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <Space
          wrap
          align="center"
          style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }}
        >
          <Space wrap align="center">
            <div className={styles.orderSearchBar} style={{ minWidth: 320, marginBottom: 0 }}>
              <Filter size={16} color="#6b7280" />
              <input
                type="text"
                placeholder="Search report number, title, product or order"
                className={styles.orderSearchInput}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>

            <div className={styles.reportsToolbarSelectWrap}>
              <Select
                value={typeFilter}
                onChange={setTypeFilter}
                className={styles.reportsToolbarSelect}
                style={{ width: 180 }}
              >
                <Option value="all">All types</Option>
                {REPORT_TYPE_OPTIONS.map((type) => (
                  <Option key={type.value} value={type.value}>
                    {type.label}
                  </Option>
                ))}
              </Select>
            </div>
          </Space>

          <Space align="center">
            <Button
              className={styles.reportsToolbarButton}
              icon={<RefreshCcw size={14} />}
              onClick={() => loadReports(page, pageSize)}
            >
              Refresh
            </Button>
            {mode === 'seller' ? <QuickReportButton onReportCreated={appendLocalReport} /> : null}
            {mode === 'buyer' ? (
              <Button
                className={styles.reportsToolbarButton}
                type="primary"
                icon={<Plus size={16} />}
                onClick={openCreateDrawer}
              >
                New Report
              </Button>
            ) : null}
          </Space>
        </Space>

        <div className={styles.ordersListContainer}>
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
              scroll={mode === 'admin' ? { x: 1100 } : undefined}
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
        </div>
      </div>

      <Drawer
        width={760}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title={detailReport ? buildDisplayLabel(detailReport) : 'Dispute Detail'}
        destroyOnHidden
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
                      actionForm.setFieldsValue({ counterNote: '' });
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
        zIndex={3000}
        destroyOnHidden
      >
        <Form form={createForm} layout="vertical" initialValues={{ type: REPORT_TYPES.ORDER }}>
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Form.Item
              name="type"
              label="Report Type"
              rules={[{ required: true, message: 'Select a type' }]}
            >
              <Select>
                {REPORT_TYPE_OPTIONS.map((option) => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item shouldUpdate noStyle>
              {({ getFieldValue }) => {
                const selectedType = getFieldValue('type');
                const selectedOrder = orderOptions.find(
                  (option) => option.value === getFieldValue('orderId')
                )?.order;
                const selectedSeller = sellerOptions.find(
                  (option) => option.value === getFieldValue('sellerId')
                )?.seller;

                if (selectedType === REPORT_TYPES.SYSTEM_BUG) {
                  return (
                    <Alert
                      type="info"
                      showIcon
                      message="SYSTEM_BUG report"
                      description="This report goes directly to technical triage. Product/Order/Seller selection is not required."
                    />
                  );
                }

                if (selectedType === REPORT_TYPES.PRODUCT) {
                  return (
                    <Space direction="vertical" style={{ width: '100%' }} size={10}>
                      <Form.Item
                        name="productId"
                        label="Reported Product"
                        rules={[{ required: true, message: 'Select a product to report' }]}
                      >
                        <Input placeholder="Product is auto-filled from Product Details" disabled />
                      </Form.Item>

                      {selectedProductSubject ? (
                        <Card
                          size="small"
                          style={{
                            borderRadius: 14,
                            border: '1px solid #e2e8f0',
                            background: '#f8fafc',
                          }}
                        >
                          <Space align="start">
                            <img
                              src={
                                selectedProductSubject?.images?.[0] ||
                                selectedProductSubject?.image ||
                                'https://via.placeholder.com/80x80?text=Product'
                              }
                              alt={selectedProductSubject?.name || 'Product'}
                              style={{
                                width: 80,
                                height: 80,
                                borderRadius: 10,
                                objectFit: 'cover',
                                border: '1px solid #e2e8f0',
                              }}
                            />
                            <Space direction="vertical" size={2}>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                Subject Product
                              </Text>
                              <Text strong>
                                {selectedProductSubject?.name || 'Unknown product'}
                              </Text>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                ID: {selectedProductSubject?._id}
                              </Text>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                {stripHtml(selectedProductSubject?.description || '').slice(
                                  0,
                                  100
                                ) || 'No brief details available'}
                              </Text>
                            </Space>
                          </Space>
                        </Card>
                      ) : (
                        <Alert
                          type="warning"
                          showIcon
                          message="Product not pre-filled"
                          description="Open report directly from a product details page to auto-capture the product subject."
                        />
                      )}
                    </Space>
                  );
                }

                if (selectedType === REPORT_TYPES.ORDER) {
                  return (
                    <Form.Item
                      name="orderId"
                      label="Related Order"
                      rules={[{ required: true, message: 'Select an order' }]}
                    >
                      <Select
                        showSearch
                        loading={contextLoading}
                        placeholder="Search order number, date, amount, item"
                        optionFilterProp="searchText"
                        filterOption={(input, option) =>
                          (option?.searchText || '').includes(input.trim().toLowerCase())
                        }
                        optionLabelProp="labelText"
                      >
                        {orderOptions.map((option) => (
                          <Option
                            key={option.value}
                            value={option.value}
                            labelText={option.labelText}
                            searchText={option.searchText}
                          >
                            <Space direction="vertical" size={0} style={{ lineHeight: 1.2 }}>
                              <Text strong>{option.order.orderNumber || option.order._id}</Text>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                {option.labelText}
                              </Text>
                            </Space>
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  );
                }

                if (selectedType === REPORT_TYPES.SELLER) {
                  return (
                    <Space direction="vertical" style={{ width: '100%' }} size={10}>
                      <Form.Item
                        name="sellerId"
                        label="Related Seller"
                        rules={[{ required: true, message: 'Select a seller' }]}
                      >
                        <Select
                          showSearch
                          loading={contextLoading}
                          placeholder="Search seller by name or email"
                          optionFilterProp="searchText"
                          filterOption={(input, option) =>
                            (option?.searchText || '').includes(input.trim().toLowerCase())
                          }
                          optionLabelProp="labelText"
                        >
                          {sellerOptions.map((option) => (
                            <Option
                              key={option.value}
                              value={option.value}
                              labelText={option.labelText}
                              searchText={option.searchText}
                            >
                              <Space direction="vertical" size={0} style={{ lineHeight: 1.2 }}>
                                <Text strong>
                                  {option.seller.fullName ||
                                    option.seller.email ||
                                    option.seller._id}
                                </Text>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                  {option.seller.email || 'No email'} -{' '}
                                  {option.seller.interactedOrderCount} interactions
                                </Text>
                              </Space>
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>

                      {selectedSeller ? (
                        <Alert
                          type="info"
                          showIcon
                          message={`Reporting seller: ${selectedSeller.fullName || selectedSeller.email}`}
                          description={`You have interacted with this seller ${selectedSeller.interactedOrderCount} times through your order history.`}
                        />
                      ) : null}
                    </Space>
                  );
                }

                return null;
              }}
            </Form.Item>

            <Form.Item
              name="title"
              label="Title"
              rules={[{ required: true, message: 'Enter a title' }]}
            >
              <Input placeholder="Short summary of the issue" />
            </Form.Item>

            <Form.Item
              name="category"
              label="Category"
              rules={[{ required: true, message: 'Select a category' }]}
            >
              <Select
                placeholder={
                  reportType ? 'Select a predefined category' : 'Select report type first'
                }
                disabled={!reportType}
              >
                {createCategoryOptions.map((category) => (
                  <Option key={category.value} value={category.value}>
                    {category.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="description"
              label="Description"
              rules={[{ required: true, message: 'Describe the issue' }]}
            >
              <TextArea rows={4} placeholder="Provide a clear explanation of what happened" />
            </Form.Item>

            <MediaUploader
              title="Attach evidence"
              hint="Upload up to 5 files. Supported: images (.jpg/.png/...) and videos (.mp4/.webm). Max 10MB/image and 50MB/video."
              files={createFiles}
              previews={createPreviews}
              maxFiles={MAX_MEDIA_FILES}
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
        destroyOnHidden
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
                  maxFiles={MAX_MEDIA_FILES}
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
};

export default DisputeCenter;
