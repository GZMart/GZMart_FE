import { useState, useEffect } from 'react';
import { Table, Button, Select, Tag, message, Modal, Input, Avatar, ConfigProvider, Tooltip } from 'antd';
import {
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  UserOutlined,
  EnvironmentOutlined,
  IdcardOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import * as sellerApplicationService from '@services/api/sellerApplicationService';
import styles from '@assets/styles/admin/SellerApplicationsPage.module.css';

// const { Option } = Select;
const { TextArea } = Input;

const STATUS_CONFIG = {
  pending: { color: 'processing', icon: <ClockCircleOutlined />, label: 'PENDING', className: 'pending' },
  approved: { color: 'success', icon: <CheckCircleOutlined />, label: 'APPROVED', className: 'approved' },
  rejected: { color: 'error', icon: <CloseCircleOutlined />, label: 'REJECTED', className: 'rejected' },
};

const SellerApplicationsPage = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState(undefined);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [detailModal, setDetailModal] = useState({ open: false, record: null });

  useEffect(() => {
    fetchApplications();
  }, [pagination.current, pagination.pageSize, statusFilter]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
      };
      if (statusFilter) params.status = statusFilter;

      const data = await sellerApplicationService.listSellerApplications(params);
      setApplications(data.applications || []);
      setPagination((prev) => ({
        ...prev,
        total: data.pagination?.totalItems || 0,
      }));
    } catch (error) {
      console.error('Error fetching applications:', error);
      message.error('Failed to load seller applications');
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (newPagination) => {
    setPagination({
      ...pagination,
      current: newPagination.current,
      pageSize: newPagination.pageSize,
    });
  };

  const handleAction = (applicationId, action) => {
    let noteValue = '';

    Modal.confirm({
      title: (
        <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>
          {action === 'approve' ? 'Approve Application' : 'Reject Application'}
        </div>
      ),
      icon: action === 'approve' ?
        <CheckCircleOutlined style={{ color: '#10b981', fontSize: 24 }} /> :
        <CloseCircleOutlined style={{ color: '#ef4444', fontSize: 24 }} />,
      content: (
        <div style={{ marginTop: 12 }}>
          <p style={{ color: '#475569', marginBottom: 16 }}>
            {action === 'approve'
              ? 'This will upgrade the user to the seller role and allow them to manage a shop.'
              : 'This will reject the application. The user will be notified and can re-apply later.'}
          </p>
          <div style={{ fontWeight: 500, marginBottom: 8, color: '#0f172a' }}>Add a note (optional):</div>
          <TextArea
            placeholder="Type your feedback or internal note here..."
            rows={4}
            onChange={(e) => {
              noteValue = e.target.value;
            }}
            style={{ borderRadius: 8 }}
          />
        </div>
      ),
      okText: action === 'approve' ? 'Confirm Approval' : 'Confirm Rejection',
      okButtonProps: {
        danger: action === 'reject',
        style: action === 'approve' ? { background: '#10b981', borderColor: '#10b981', borderRadius: 8 } : { borderRadius: 8 }
      },
      cancelButtonProps: { style: { borderRadius: 8 } },
      width: 480,
      centered: true,
      onOk: async () => {
        try {
          if (action === 'approve') {
            await sellerApplicationService.approveSellerApplication(applicationId, noteValue);
            message.success('Application approved — user is now a seller');
          } else {
            await sellerApplicationService.rejectSellerApplication(applicationId, noteValue);
            message.success('Application rejected');
          }
          setDetailModal({ open: false, record: null });
          fetchApplications();
        } catch (error) {
          message.error(error.message || `Failed to ${action} application`);
        }
      },
    });
  };

  const columns = [
    {
      title: 'Applicant',
      key: 'user',
      render: (_, record) => {
        const user = record.user || {};
        return (
          <div className={styles.userInfo}>
            {user.avatar ? (
              <img src={user.avatar} alt={user.fullName} className={styles.userAvatar} />
            ) : (
              <Avatar size={44} icon={<UserOutlined />} className={styles.userAvatar} />
            )}
            <div>
              <div className={styles.userName}>{user.fullName}</div>
              <div className={styles.userEmail}>{user.email}</div>
            </div>
          </div>
        );
      },
    },
    {
      title: 'Phone',
      key: 'phone',
      responsive: ['md'],
      render: (_, record) => (
        <span style={{ fontWeight: 500, color: '#334155' }}>
          {record.user?.phone || 'N/A'}
        </span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status) => {
        const c = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
        return (
          <Tag icon={c.icon} color={c.color}>
            {c.label}
          </Tag>
        );
      },
    },
    {
      title: 'Submitted',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 140,
      responsive: ['md'],
      render: (date) => (
        <span style={{ color: '#475569' }}>
          {new Date(date).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })}
        </span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <Tooltip title="Review Application">
            <Button
              className={`${styles.actionBtn} ${styles.actionBtnReview}`}
              icon={<EyeOutlined style={{ fontSize: 18 }} />}
              onClick={() => setDetailModal({ open: true, record })}
            />
          </Tooltip>
          {record.status === 'pending' && (
            <>
              <Tooltip title="Approve">
                <Button
                  className={`${styles.actionBtn} ${styles.actionBtnApprove}`}
                  icon={<CheckCircleOutlined style={{ fontSize: 18 }} />}
                  onClick={() => handleAction(record._id, 'approve')}
                />
              </Tooltip>
              <Tooltip title="Reject">
                <Button
                  className={`${styles.actionBtn} ${styles.actionBtnReject}`}
                  icon={<CloseCircleOutlined style={{ fontSize: 18 }} />}
                  onClick={() => handleAction(record._id, 'reject')}
                />
              </Tooltip>
            </>
          )}
        </div>
      ),
    },
  ];

  const renderDetailModal = () => {
    const record = detailModal.record;
    if (!record) return null;
    const user = record.user || {};
    const statusCfg = STATUS_CONFIG[record.status] || STATUS_CONFIG.pending;
    const addressParts = [user.address, user.wardName, user.provinceName].filter(Boolean);

    return (
      <Modal
        title="Seller Application Details"
        open={detailModal.open}
        onCancel={() => setDetailModal({ open: false, record: null })}
        width={700}
        wrapClassName={styles.customModal}
        centered
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <Button size="large" onClick={() => setDetailModal({ open: false, record: null })} className={`${styles.modalActionBtn} ${styles.modalActionBtnClose}`}>
              Close
            </Button>
            {record.status === 'pending' && (
              <>
                <Button size="large" onClick={() => handleAction(record._id, 'reject')} className={`${styles.modalActionBtn} ${styles.modalActionBtnReject}`}>
                  Reject
                </Button>
                <Button size="large" onClick={() => handleAction(record._id, 'approve')} className={`${styles.modalActionBtn} ${styles.modalActionBtnApprove}`}>
                  Approve
                </Button>
              </>
            )}
          </div>
        }
      >
        <div className={styles.modalApplicantProfile}>
          {user.avatar ? (
            <img src={user.avatar} alt={user.fullName} className={styles.modalApplicantAvatar} />
          ) : (
            <Avatar size={72} icon={<UserOutlined />} className={styles.modalApplicantAvatar} />
          )}
          <div className={styles.modalApplicantInfo}>
            <h3>{user.fullName}</h3>
            <p className={styles.flexp}><UserOutlined style={{ marginRight: 6 }} />{user.email}</p>
            {user.aboutMe && (
              <div className={styles.aboutMe}>
                &quot;{user.aboutMe}&quot;
              </div>
            )}
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <div className={`${styles.statusTag} ${styles[statusCfg.className]}`}>
              {statusCfg.icon} {statusCfg.label}
            </div>
          </div>
        </div>

        <div className={styles.sectionTitle}>
          <IdcardOutlined style={{ color: '#4f46e5' }} /> Business Identity
        </div>
        <div className={styles.infoCard}>
          <div className={styles.infoCardRow}>
            <div className={styles.infoCardLabel}>Phone Number</div>
            <div className={styles.infoCardValue}>{user.phone || 'N/A'}</div>
          </div>
          <div className={styles.infoCardRow}>
            <div className={styles.infoCardLabel}>Citizen ID (CCCD)</div>
            <div className={styles.infoCardValue}>{user.citizenId || 'N/A'}</div>
          </div>
          <div className={styles.infoCardRow}>
            <div className={styles.infoCardLabel}>Tax ID (MST)</div>
            <div className={styles.infoCardValue}>{user.taxId || 'N/A'}</div>
          </div>
        </div>

        <div className={styles.sectionTitle}>
          <EnvironmentOutlined style={{ color: '#4f46e5' }} /> Location Details
        </div>
        <div className={styles.infoCard}>
          <div className={styles.infoCardRow}>
            <div className={styles.infoCardLabel}>Province / City</div>
            <div className={styles.infoCardValue}>{user.provinceName || 'N/A'}</div>
          </div>
          <div className={styles.infoCardRow}>
            <div className={styles.infoCardLabel}>Ward / Commune</div>
            <div className={styles.infoCardValue}>{user.wardName || 'N/A'}</div>
          </div>
          <div className={styles.infoCardRow}>
            <div className={styles.infoCardLabel}>Specific Address</div>
            <div className={styles.infoCardValue}>{user.address || 'N/A'}</div>
          </div>
          <div className={styles.infoCardRow}>
            <div className={styles.infoCardLabel}>Full Address</div>
            <div className={styles.infoCardValue}>
              {addressParts.length > 0 ? addressParts.join(', ') : 'N/A'}
            </div>
          </div>
        </div>

        <div className={styles.sectionTitle}>
          <FileTextOutlined style={{ color: '#4f46e5' }} /> Application Record
        </div>
        <div className={styles.infoCard}>
          <div className={styles.infoCardRow}>
            <div className={styles.infoCardLabel}>Submitted On</div>
            <div className={styles.infoCardValue}>
              {new Date(record.createdAt).toLocaleString(undefined, {
                year: 'numeric', month: 'long', day: 'numeric',
                hour: '2-digit', minute: '2-digit'
              })}
            </div>
          </div>
          {record.adminReviewer && (
            <div className={styles.infoCardRow}>
              <div className={styles.infoCardLabel}>Reviewed By</div>
              <div className={styles.infoCardValue}>
                {record.adminReviewer.fullName || record.adminReviewer.email || 'Admin'}
              </div>
            </div>
          )}
          {record.reviewNote && (
            <div className={styles.infoCardRow}>
              <div className={styles.infoCardLabel}>Review Note</div>
              <div className={styles.infoCardValue} style={{ fontStyle: 'italic', color: '#475569' }}>
                {record.reviewNote}
              </div>
            </div>
          )}
        </div>
      </Modal>
    );
  };

  return (
    <ConfigProvider theme={{
      token: {
        colorPrimary: '#4f46e5',
        borderRadius: 8,
      }
    }}>
      <div className={styles.sellerApplicationsPage}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <i className="bi bi-shop" />
            </div>
            <div>
              <h1>Seller Applications</h1>
              <p className={styles.subtitle}>Review and manage requests from users wanting to become sellers</p>
            </div>
          </div>
          <Button
            type="primary"
            size="large"
            icon={<ReloadOutlined />}
            onClick={fetchApplications}
            loading={loading}
            style={{ background: '#4f46e5', borderColor: '#4f46e5', boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.3)' }}
          >
            Refresh Data
          </Button>
        </div>

        <div className={styles.tableWrap}>
          <div className={styles.filterBar}>
            <Select
              placeholder="Filter by application status"
              allowClear
              size="large"
              style={{ width: 240 }}
              value={statusFilter}
              onChange={(value) => {
                setStatusFilter(value);
                setPagination((prev) => ({ ...prev, current: 1 }));
              }}
              options={[
                { value: 'pending', label: 'Pending Review' },
                { value: 'approved', label: 'Approved' },
                { value: 'rejected', label: 'Rejected' },
              ]}
            />
          </div>

          <Table
            columns={columns}
            dataSource={applications}
            loading={loading}
            pagination={{
              ...pagination,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} applications`
            }}
            onChange={handleTableChange}
            rowKey="_id"
            scroll={{ x: 800 }}
          />
        </div>

        {renderDetailModal()}
      </div>
    </ConfigProvider>
  );
};

export default SellerApplicationsPage;
