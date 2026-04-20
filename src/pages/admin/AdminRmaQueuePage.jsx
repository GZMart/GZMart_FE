import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Table,
  Button,
  Select,
  message,
  Modal,
  Input,
  DatePicker,
  Tooltip,
  Empty,
  Spin,
} from 'antd';
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import rmaService from '@services/api/rmaService';
import styles from '@assets/styles/admin/AdminRmaQueuePage.module.css';

const { Option } = Select;
const { RangePicker } = DatePicker;

const RMA_STATUS_OPTIONS = [
  { value: 'pending', label: 'Chờ seller' },
  { value: 'approved', label: 'Đã duyệt' },
  { value: 'rejected', label: 'Từ chối' },
  { value: 'items_returned', label: 'Đã gửi trả' },
  { value: 'processing', label: 'Đang xử lý' },
  { value: 'completed', label: 'Hoàn tất' },
  { value: 'cancelled', label: 'Đã hủy' },
];

const RMA_TYPE_OPTIONS = [
  { value: 'undetermined', label: 'Chưa xác định' },
  { value: 'refund', label: 'Hoàn tiền' },
  { value: 'exchange', label: 'Đổi hàng' },
];

function labelOf(value, options) {
  return options.find((o) => o.value === value)?.label || value || '—';
}

function statusClass(status) {
  const m = {
    pending: styles.statusPending,
    approved: styles.statusApproved,
    rejected: styles.statusRejected,
    items_returned: styles.statusItemsReturned,
    processing: styles.statusProcessing,
    completed: styles.statusCompleted,
    cancelled: styles.statusCancelled,
  };
  return m[status] || styles.statusCancelled;
}

function typeClass(type) {
  if (type === 'refund') {
    return styles.typeRefund;
  }
  if (type === 'exchange') {
    return styles.typeExchange;
  }
  return styles.typeUndetermined;
}

/** Backend: processRefund/processExchange yêu cầu status === 'processing' và type khớp */
function canAdminOverride(r) {
  if (!r || r.status !== 'processing') {
    return false;
  }
  if (r.type === 'refund' || r.type === 'exchange') {
    return true;
  }
  return false;
}

function overrideReason(r) {
  if (!r) {
    return '';
  }
  if (r.status !== 'processing') {
    return 'Can thiệp chỉ khi trạng thái là «Đang xử lý» (seller đã nhận hàng trả).';
  }
  if (r.type !== 'refund' && r.type !== 'exchange') {
    return 'Cần loại yêu cầu xác định (hoàn tiền hoặc đổi hàng).';
  }
  return '';
}

function buyerInitials(row) {
  const u = row.userId;
  if (u && typeof u === 'object') {
    const name = u.fullName || u.email || u.phone || '';
    const ch = name.trim().charAt(0);
    return ch ? ch.toUpperCase() : '?';
  }
  return '?';
}

function buyerDisplayLine(row) {
  const u = row.userId;
  if (u && typeof u === 'object') {
    return [u.fullName, u.email, u.phone].filter(Boolean).join(' · ') || '—';
  }
  return '—';
}

const AdminRmaQueuePage = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [statusFilter, setStatusFilter] = useState(undefined);
  const [typeFilter, setTypeFilter] = useState(undefined);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState(null);
  const [datePreset, setDatePreset] = useState('all');
  const [processOpen, setProcessOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statPending, setStatPending] = useState(0);
  const [statNew24h, setStatNew24h] = useState(0);
  const [statCompleted7d, setStatCompleted7d] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 450);
    return () => {
      clearTimeout(t);
    };
  }, [searchInput]);

  const loadStats = useCallback(async () => {
    const today = dayjs().format('YYYY-MM-DD');
    const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
    const d6 = dayjs().subtract(6, 'day').format('YYYY-MM-DD');
    try {
      setStatsLoading(true);
      const [pendingRes, new24hRes, done7dRes] = await Promise.all([
        rmaService.getAllReturnRequests({ page: 1, limit: 1, status: 'pending' }),
        rmaService.getAllReturnRequests({
          page: 1,
          limit: 1,
          dateFrom: yesterday,
          dateTo: today,
        }),
        rmaService.getAllReturnRequests({
          page: 1,
          limit: 1,
          status: 'completed',
          dateFrom: d6,
          dateTo: today,
        }),
      ]);
      setStatPending(pendingRes.total ?? 0);
      setStatNew24h(new24hRes.total ?? 0);
      setStatCompleted7d(done7dRes.total ?? 0);
    } catch (e) {
      console.error(e);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page, limit };
      if (statusFilter) {
        params.status = statusFilter;
      }
      if (typeFilter) {
        params.type = typeFilter;
      }
      if (search.length >= 2) {
        params.search = search;
      }
      if (dateRange?.[0] && dateRange?.[1]) {
        params.dateFrom = dateRange[0].format('YYYY-MM-DD');
        params.dateTo = dateRange[1].format('YYYY-MM-DD');
      }
      const res = await rmaService.getAllReturnRequests(params);
      setRows(res.data || []);
      setTotal(res.total ?? 0);
    } catch (e) {
      console.error(e);
      message.error('Không tải được RMA');
    } finally {
      setLoading(false);
    }
  }, [page, limit, statusFilter, typeFilter, search, dateRange]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const refreshAll = useCallback(() => {
    loadStats();
    load();
  }, [loadStats, load]);

  useEffect(() => {
    if (!processOpen || !selected?._id) {
      setDetail(null);
      return undefined;
    }
    let cancelled = false;
    (async () => {
      try {
        setDetailLoading(true);
        const res = await rmaService.getReturnRequestById(selected._id);
        if (!cancelled) {
          setDetail(res.data || null);
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setDetail(null);
          message.warning('Không tải thêm chi tiết — dùng dữ liệu từ dòng bảng.');
        }
      } finally {
        if (!cancelled) {
          setDetailLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [processOpen, selected?._id]);

  const submitProcess = async () => {
    if (!selected) {
      return;
    }
    const action = selected.type === 'exchange' ? 'exchange' : 'refund';
    try {
      setSubmitting(true);
      await rmaService.adminProcessRequest(selected._id, { action });
      message.success('Đã xử lý');
      setProcessOpen(false);
      setSelected(null);
      setDetail(null);
      refreshAll();
    } catch (e) {
      console.error(e);
      message.error(e.response?.data?.message || 'Xử lý thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const copyText = async (text) => {
    if (!text) {
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      message.success('Đã sao chép');
    } catch {
      message.error('Không sao chép được');
    }
  };

  const hasActiveFilters = useMemo(
    () =>
      !!(
        statusFilter ||
        typeFilter ||
        (dateRange?.[0] && dateRange?.[1]) ||
        searchInput.trim().length > 0
      ),
    [statusFilter, typeFilter, dateRange, searchInput],
  );

  const resetFilters = () => {
    setStatusFilter(undefined);
    setTypeFilter(undefined);
    setDateRange(null);
    setDatePreset('all');
    setSearchInput('');
    setSearch('');
    setPage(1);
  };

  const applyDatePreset = (key) => {
    setDatePreset(key);
    setPage(1);
    if (key === 'all') {
      setDateRange(null);
      return;
    }
    const days = key === '7' ? 6 : 29;
    setDateRange([dayjs().subtract(days, 'day'), dayjs()]);
  };

  const effectiveRow = useMemo(() => {
    if (detail && selected && String(detail._id) === String(selected._id)) {
      return detail;
    }
    return selected;
  }, [detail, selected]);

  const columns = [
    {
      title: 'Mã yêu cầu',
      dataIndex: 'requestNumber',
      key: 'requestNumber',
      width: 168,
      render: (text) => (
        <div className={styles.idRow}>
          <span className={styles.tableMono}>{text || '—'}</span>
          {text ? (
            <button
              type="button"
              className={styles.copyBtn}
              aria-label="Sao chép mã RMA"
              onClick={() => copyText(text)}
            >
              <i className="bi bi-clipboard" />
            </button>
          ) : null}
        </div>
      ),
    },
    {
      title: 'Đơn',
      key: 'order',
      width: 130,
      render: (_, r) => {
        const num = r.orderId?.orderNumber;
        if (!num) {
          return <span className={styles.tableMono}>—</span>;
        }
        return (
          <button
            type="button"
            className={`${styles.orderLink} ${styles.tableMono}`}
            onClick={() => copyText(num)}
          >
            {num}
          </button>
        );
      },
    },
    {
      title: 'Người mua',
      key: 'user',
      ellipsis: true,
      render: (_, r) => {
        const line = buyerDisplayLine(r);
        return (
          <Tooltip title={line}>
            <div className={styles.buyerCell}>
              <div className={styles.buyerAvatar}>{buyerInitials(r)}</div>
              <span className={styles.buyerName}>{line}</span>
            </div>
          </Tooltip>
        );
      },
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      key: 'type',
      width: 118,
      render: (t) => (
        <span className={`${styles.typePill} ${typeClass(t)}`}>{labelOf(t, RMA_TYPE_OPTIONS)}</span>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 148,
      render: (s) => (
        <span className={`${styles.statusPill} ${statusClass(s)}`}>
          {labelOf(s, RMA_STATUS_OPTIONS)}
        </span>
      ),
    },
    {
      title: 'Tạo lúc',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 118,
      render: (d) => (
        <span className={styles.dateCell}>{d ? dayjs(d).format('DD/MM/YYYY') : '—'}</span>
      ),
    },
    {
      title: 'Thao tác',
      key: 'act',
      fixed: 'right',
      width: 112,
      render: (_, r) => {
        if (canAdminOverride(r)) {
          return (
            <Button
              type="text"
              size="small"
              className={styles.processBtn}
              onClick={() => {
                setSelected(r);
                setProcessOpen(true);
              }}
            >
              Xử lý
            </Button>
          );
        }
        return (
          <Tooltip title={overrideReason(r)}>
            <span className={styles.processBtnMuted}>—</span>
          </Tooltip>
        );
      },
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}>
            <i className="bi bi-hammer" />
          </div>
          <div>
            <h1>Hàng chờ RMA (Admin override)</h1>
            <p className={styles.subtitle}>
              Kiểm duyệt và can thiệp thủ công hoàn tiền / đổi hàng toàn sàn. Tìm theo mã RMA, mã
              đơn, hoặc khách (≥ 2 ký tự).
            </p>
            <p className={styles.metaLine}>
              Đang hiển thị <strong>{total}</strong> kết quả theo bộ lọc hiện tại.
            </p>
          </div>
        </div>
        <Button className={styles.refreshBtn} icon={<ReloadOutlined />} onClick={refreshAll}>
          Làm mới
        </Button>
      </div>

      <div className={styles.metrics}>
        <div className={styles.metricCard}>
          <div className={`${styles.metricAccent} ${styles.metricAccentAction}`} />
          <h3 className={styles.metricLabel}>Ưu tiên xử lý</h3>
          <div className={styles.metricRow}>
            <Spin spinning={statsLoading} size="small">
              <span className={styles.metricValue}>{statPending}</span>
            </Spin>
            <span className={`${styles.metricBadge} ${styles.metricBadgeWarn}`}>
              <i className="bi bi-exclamation-triangle" style={{ fontSize: 12 }} />
              Chờ seller
            </span>
          </div>
        </div>
        <div className={styles.metricCard}>
          <div className={`${styles.metricAccent} ${styles.metricAccentPending}`} />
          <h3 className={styles.metricLabel}>Yêu cầu mới</h3>
          <div className={styles.metricRow}>
            <Spin spinning={statsLoading} size="small">
              <span className={styles.metricValue}>{statNew24h}</span>
            </Spin>
            <span className={styles.metricBadgeMuted}>24 giờ qua</span>
          </div>
        </div>
        <div className={styles.metricCard}>
          <div className={`${styles.metricAccent} ${styles.metricAccentDone}`} />
          <h3 className={styles.metricLabel}>Hoàn tất gần đây</h3>
          <div className={styles.metricRow}>
            <Spin spinning={statsLoading} size="small">
              <span className={styles.metricValue}>{statCompleted7d}</span>
            </Spin>
            <span className={`${styles.metricBadge} ${styles.metricBadgeTrend}`}>
              <i className="bi bi-graph-up-arrow" style={{ fontSize: 12 }} />
              7 ngày
            </span>
          </div>
        </div>
      </div>

      <div className={styles.filterStrip}>
        <Input
          allowClear
          placeholder="Mã RMA, mã đơn, khách…"
          prefix={<SearchOutlined style={{ color: '#777587' }} />}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className={styles.filterField}
          style={{ flex: '1 1 200px', minWidth: 200, maxWidth: 320 }}
        />
        <Select
          allowClear
          showSearch
          optionFilterProp="children"
          placeholder="Trạng thái"
          value={statusFilter}
          onChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}
          className={styles.filterField}
          style={{ width: '100%', minWidth: 160, maxWidth: 200 }}
        >
          {RMA_STATUS_OPTIONS.map((o) => (
            <Option key={o.value} value={o.value}>
              {o.label}
            </Option>
          ))}
        </Select>
        <Select
          allowClear
          showSearch
          optionFilterProp="children"
          placeholder="Loại"
          value={typeFilter}
          onChange={(v) => {
            setTypeFilter(v);
            setPage(1);
          }}
          className={styles.filterField}
          style={{ width: '100%', minWidth: 140, maxWidth: 180 }}
        >
          {RMA_TYPE_OPTIONS.map((o) => (
            <Option key={o.value} value={o.value}>
              {o.label}
            </Option>
          ))}
        </Select>
        <RangePicker
          value={dateRange}
          onChange={(v) => {
            setDateRange(v);
            if (!v) {
              setDatePreset('all');
            } else {
              setDatePreset('custom');
            }
            setPage(1);
          }}
          format="DD/MM/YYYY"
          presets={[
            { label: '7 ngày', value: [dayjs().subtract(6, 'day'), dayjs()] },
            { label: '30 ngày', value: [dayjs().subtract(29, 'day'), dayjs()] },
          ]}
          allowClear
          className={styles.filterField}
          style={{ flex: '1 1 240px', minWidth: 240 }}
        />
        <div className={styles.datePresetWrap}>
          <button
            type="button"
            className={`${styles.datePresetBtn} ${datePreset === 'all' ? styles.datePresetBtnActive : ''}`}
            onClick={() => applyDatePreset('all')}
          >
            Tất cả
          </button>
          <button
            type="button"
            className={`${styles.datePresetBtn} ${datePreset === '7' ? styles.datePresetBtnActive : ''}`}
            onClick={() => applyDatePreset('7')}
          >
            7 ngày
          </button>
          <button
            type="button"
            className={`${styles.datePresetBtn} ${datePreset === '30' ? styles.datePresetBtnActive : ''}`}
            onClick={() => applyDatePreset('30')}
          >
            30 ngày
          </button>
        </div>
        {hasActiveFilters ? (
          <button type="button" className={styles.filterReset} onClick={resetFilters}>
            Xóa bộ lọc
          </button>
        ) : null}
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
                className={styles.emptyWrap}
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <span>
                    Không có yêu cầu RMA phù hợp.
                    <br />
                    <span style={{ color: '#9ca3af', fontSize: 13 }}>
                      Thử bỏ bớt bộ lọc hoặc đổi khoảng ngày.
                    </span>
                  </span>
                }
              />
            ),
          }}
          pagination={{
            current: page,
            pageSize: limit,
            total,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50],
            showTotal: (t, range) => `${range[0]}-${range[1]} / ${t} yêu cầu`,
            onChange: (p, ps) => {
              const nextSize = ps ?? limit;
              if (nextSize !== limit) {
                setLimit(nextSize);
                setPage(1);
              } else {
                setPage(p);
              }
            },
          }}
          scroll={{ x: 1080 }}
        />
      </div>

      <Modal
        title={selected ? `Can thiệp — ${selected.requestNumber}` : 'Can thiệp RMA'}
        open={processOpen}
        onCancel={() => {
          setProcessOpen(false);
          setSelected(null);
          setDetail(null);
        }}
        width={520}
        footer={null}
        destroyOnClose
      >
        <Spin spinning={detailLoading}>
          <div className={styles.warnBox}>
            <strong>Ghi nhớ:</strong> đây là thao tác override trên nền tảng — chỉ dùng khi luồng
            thông thường bị kẹt. API sẽ gọi xử lý giống seller (cần trạng thái «Đang xử lý»).
          </div>

          <div className={styles.modalSummary}>
            <dl>
              <dt>Mã</dt>
              <dd>{effectiveRow?.requestNumber || '—'}</dd>
              <dt>Đơn</dt>
              <dd className={styles.tableMono}>
                {effectiveRow?.orderId?.orderNumber ||
                  selected?.orderId?.orderNumber ||
                  '—'}
              </dd>
              <dt>Người mua</dt>
              <dd>{effectiveRow ? buyerDisplayLine({ userId: effectiveRow.userId }) : '—'}</dd>
              <dt>Loại / Trạng thái</dt>
              <dd>
                {effectiveRow
                  ? `${labelOf(effectiveRow.type, RMA_TYPE_OPTIONS)} · ${labelOf(
                      effectiveRow.status,
                      RMA_STATUS_OPTIONS,
                    )}`
                  : '—'}
              </dd>
            </dl>
          </div>

          {effectiveRow?.description ? (
            <p style={{ fontSize: 13, color: '#374151', marginBottom: 12 }}>
              <strong>Ghi chú khách:</strong> {effectiveRow.description}
            </p>
          ) : null}

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Hành động API</div>
            <p style={{ margin: 0, fontSize: 14, color: '#374151' }}>
              {selected?.type === 'exchange'
                ? 'Đổi hàng — gọi processExchange (admin).'
                : 'Hoàn tiền — gọi processRefund (admin).'}
            </p>
            <p style={{ fontSize: 12, color: '#6b7280', marginTop: 8, marginBottom: 0 }}>
              Loại yêu cầu đã khớp với API; không đổi được từ bước này.
            </p>
          </div>

          <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button
              onClick={() => {
                setProcessOpen(false);
                setSelected(null);
                setDetail(null);
              }}
            >
              Đóng
            </Button>
            <Button
              type="primary"
              loading={submitting}
              disabled={detailLoading || !canAdminOverride(selected)}
              onClick={() => {
                Modal.confirm({
                  title: 'Xác nhận override?',
                  content: (
                    <div>
                      <p style={{ marginBottom: 8 }}>
                        Thực hiện{' '}
                        <strong>
                          {selected?.type === 'exchange' ? 'đổi hàng' : 'hoàn tiền'}
                        </strong>{' '}
                        cho <strong>{selected?.requestNumber}</strong>?
                      </p>
                      <p style={{ margin: 0, color: '#6b7280', fontSize: 13 }}>
                        Hành động gọi API admin và không thể hoàn tác từ giao diện này.
                      </p>
                    </div>
                  ),
                  okText: 'Xác nhận',
                  cancelText: 'Hủy',
                  onOk: () => submitProcess(),
                });
              }}
            >
              Xác nhận can thiệp
            </Button>
          </div>
        </Spin>
      </Modal>
    </div>
  );
};

export default AdminRmaQueuePage;
