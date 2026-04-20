import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Select,
  Tag,
  message,
  Modal,
  Input,
  Avatar,
  ConfigProvider,
  Tooltip,
  Typography,
  Alert,
  Progress,
  Spin,
} from 'antd';
import {
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  UserOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  FileSearchOutlined,
  PrinterOutlined,
  ShareAltOutlined,
  SafetyCertificateOutlined,
  HomeOutlined,
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

const { Text, Paragraph } = Typography;

/** Cột phải modal Luminous: đánh giá sơ bộ + kiểm tra định dạng */
function LuminousScreeningColumn({ ai, styles: css }) {
  const riskFromRec = (rec) => {
    if (rec === 'likely_approve') {
      return { label: 'Low risk', tone: 'low' };
    }
    if (rec === 'likely_reject') {
      return { label: 'Elevated risk', tone: 'high' };
    }
    return { label: 'Review suggested', tone: 'mid' };
  };

  const mainCard = (() => {
    if (!ai || ai.status === 'pending') {
      return (
        <div className={css.lumScreenCard}>
          <div className={css.lumScreenCardHead}>
            <div>
              <div className={css.lumScreenTitleRow}>
                <FileSearchOutlined className={css.lumScreenIcon} />
                <span className={css.lumScreenTitle}>Screening assessment</span>
              </div>
              <p className={css.lumScreenSubtitle}>GZMart automated pre-check</p>
            </div>
          </div>
          <div className={css.lumPendingInner}>
            <Spin tip="Running checks…" size="large" />
            <Text type="secondary" className={css.lumPendingHint}>
              Runs shortly after submit. Refresh the list if this stays on screen.
            </Text>
          </div>
        </div>
      );
    }
    if (ai.status === 'skipped') {
      return (
        <div className={css.lumScreenCard}>
          <Alert
            type="info"
            showIcon
            message="Pre-screening unavailable"
            description={ai.summary || 'Automated screening was not run for this application.'}
          />
        </div>
      );
    }
    if (ai.status === 'failed') {
      return (
        <div className={css.lumScreenCard}>
          <Alert
            type="error"
            showIcon
            message={ai.error || 'Screening could not be completed'}
            description={ai.summary}
          />
        </div>
      );
    }

    const rec = ai.recommendation;
    const recLabel =
      rec === 'likely_approve'
        ? 'Likely approve'
        : rec === 'likely_reject'
          ? 'Likely reject'
          : 'Needs human review';
    const risk = riskFromRec(rec);
    const pct = typeof ai.confidence === 'number' ? Math.round(ai.confidence * 100) : null;

    return (
      <div className={css.lumScreenCard}>
        <div className={css.lumScreenCardHead}>
          <div>
            <div className={css.lumScreenTitleRow}>
              <SafetyCertificateOutlined className={css.lumScreenIcon} />
              <span className={css.lumScreenTitle}>Screening assessment</span>
            </div>
            <p className={css.lumScreenSubtitle}>GZMart automated pre-check</p>
          </div>
          {pct != null && (
            <div className={css.lumConfBlock}>
              <div className={css.lumConfNum}>{pct}%</div>
              <div className={css.lumConfLbl}>Confidence</div>
            </div>
          )}
        </div>

        <div className={css.lumRiskRow}>
          <div className={css.lumRiskLeft}>
            <SafetyCertificateOutlined className={css.lumRiskIcon} />
            <span className={css.lumRiskName}>Risk profile</span>
          </div>
          <span className={`${css.lumRiskBadge} ${css[`lumRiskTone_${risk.tone}`]}`}>{risk.label}</span>
        </div>

        <div className={css.lumTagBlock}>
          <Text className={css.lumMiniCap}>Assessment</Text>
          <div className={css.lumTagRow}>
            <Tag color={rec === 'likely_approve' ? 'success' : rec === 'likely_reject' ? 'error' : 'warning'} icon={<FileSearchOutlined />}>
              {recLabel}
            </Tag>
          </div>
        </div>

        {Array.isArray(ai.flags) && ai.flags.length > 0 && (
          <div className={css.lumTagBlock}>
            <Text className={css.lumMiniCap}>Review points</Text>
            <div className={css.lumFlagPills}>
              {ai.flags.map((f) => (
                <span key={f} className={css.lumPill}>
                  <span className={css.lumPillDot} />
                  {f}
                </span>
              ))}
            </div>
          </div>
        )}

        {typeof ai.confidence === 'number' && (
          <div className={css.lumProgWrap}>
            <Text type="secondary" className={css.lumMiniCap}>
              Confidence score
            </Text>
            <Progress
              percent={Math.round(ai.confidence * 100)}
              size="small"
              status={rec === 'likely_reject' ? 'exception' : 'active'}
              strokeColor={rec === 'likely_approve' ? '#16a34a' : rec === 'likely_reject' ? '#dc2626' : '#ca8a04'}
            />
          </div>
        )}

        {ai.summary && (
          <div className={css.lumSummaryBox}>
            <div className={css.lumSummaryCap}>Summary</div>
            <Paragraph className={css.lumSummaryText}>{ai.summary}</Paragraph>
          </div>
        )}
      </div>
    );
  })();

  const localChecks = Array.isArray(ai?.localChecks) ? ai.localChecks : [];
  const allLocalPass = localChecks.length > 0 && localChecks.every((c) => c.passed);

  return (
    <div className={css.lumScreenCol}>
      {mainCard}
      <div className={css.lumLocalCard}>
        <div className={css.lumLocalHead}>
          <HomeOutlined className={css.lumLocalHeadIcon} />
          <span className={css.lumLocalTitle}>Local format checks</span>
        </div>
        {localChecks.length > 0 ? (
          <ul className={css.lumLocalList}>
            {localChecks.map((c) => (
              <li key={c.code} className={css.lumLocalItem}>
                <Tag color={c.passed ? 'success' : 'error'}>{c.code}</Tag>
                <Text type="secondary">{c.detail}</Text>
              </li>
            ))}
          </ul>
        ) : (
          <Text type="secondary">No field checks recorded.</Text>
        )}
        {allLocalPass && (
          <div className={css.lumLocalOk}>
            <CheckCircleOutlined className={css.lumLocalOkIcon} />
            <span>All format rules passed</span>
          </div>
        )}
      </div>
    </div>
  );
}

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
  const [detailDecisionNote, setDetailDecisionNote] = useState('');

  useEffect(() => {
    fetchApplications();
  }, [pagination.current, pagination.pageSize, statusFilter]);

  useEffect(() => {
    if (detailModal.open) {
      setDetailDecisionNote('');
    }
  }, [detailModal.open, detailModal.record?._id]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
      };
      if (statusFilter) {
params.status = statusFilter;
}

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

  const submitDetailDecision = async (action) => {
    const id = detailModal.record?._id;
    if (!id) {
      return;
    }
    try {
      if (action === 'approve') {
        await sellerApplicationService.approveSellerApplication(id, detailDecisionNote);
        message.success('Application approved — user is now a seller');
      } else {
        await sellerApplicationService.rejectSellerApplication(id, detailDecisionNote);
        message.success('Application rejected');
      }
      setDetailModal({ open: false, record: null });
      setDetailDecisionNote('');
      fetchApplications();
    } catch (error) {
      message.error(error.message || `Failed to ${action} application`);
    }
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
      title: 'Screening',
      key: 'aiScreening',
      width: 168,
      responsive: ['lg'],
      render: (_, record) => {
        const ai = record.aiScreening;
        if (!ai || ai.status === 'pending') {
          return (
            <Tag icon={<FileSearchOutlined />} color="default">
              Checking…
            </Tag>
          );
        }
        if (ai.status === 'failed') {
          const tip = [ai.summary, ai.error].filter(Boolean).join(' — ');
          return (
            <Tag color="red" title={tip || ai.error || ''}>
              Check failed
            </Tag>
          );
        }
        if (ai.status === 'skipped') {
          return (
            <Tag color="default" title={ai.summary || ''}>
              Unavailable
            </Tag>
          );
        }
        const rec = ai.recommendation;
        const color =
          rec === 'likely_approve' ? 'success' : rec === 'likely_reject' ? 'error' : 'warning';
        const label =
          rec === 'likely_approve'
            ? 'Likely OK'
            : rec === 'likely_reject'
              ? 'Likely reject'
              : 'Review';
        return (
          <Tag icon={<FileSearchOutlined />} color={color} title={ai.summary || ''}>
            {label}
          </Tag>
        );
      },
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
    if (!record) {
      return null;
    }
    const user = record.user || {};
    const statusCfg = STATUS_CONFIG[record.status] || STATUS_CONFIG.pending;
    const addressParts = [user.address, user.wardName, user.provinceName].filter(Boolean);
    const fullAddressLine = addressParts.length > 0 ? addressParts.join(', ') : null;
    const ai = record.aiScreening;

    const copyMono = (val) =>
      val ? (
        <span className={styles.lumValMono}>
          <Text copyable={{ text: String(val) }}>{val}</Text>
        </span>
      ) : (
        <Text type="secondary">—</Text>
      );

    const shareApplication = async () => {
      try {
        if (navigator.share) {
          await navigator.share({
            title: 'Seller application',
            text: user.fullName || 'Application',
            url: window.location.href,
          });
        } else {
          await navigator.clipboard.writeText(window.location.href);
          message.success('Link copied to clipboard');
        }
      } catch {
        /* user cancelled share */
      }
    };

    const timelineItems = [];
    timelineItems.push({
      key: 'submitted',
      icon: <FileTextOutlined />,
      tone: 'violet',
      title: 'Application submitted',
      time: new Date(record.createdAt).toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      body: 'Recorded via GZMart seller registration.',
    });
    if (ai?.evaluatedAt && ai.status === 'complete') {
      timelineItems.push({
        key: 'screening',
        icon: <SafetyCertificateOutlined />,
        tone: 'green',
        title: 'Automated screening completed',
        time: new Date(ai.evaluatedAt).toLocaleString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        body: ai.summary ? `"${ai.summary.slice(0, 220)}${ai.summary.length > 220 ? '…' : ''}"` : 'Pre-screening finished.',
      });
    }
    if (record.status !== 'pending' && record.adminReviewer) {
      const decided = record.status === 'approved';
      timelineItems.push({
        key: 'decision',
        icon: decided ? <CheckCircleOutlined /> : <CloseCircleOutlined />,
        tone: 'slate',
        title: decided ? 'Application approved' : 'Application rejected',
        time: record.updatedAt
          ? new Date(record.updatedAt).toLocaleString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
          : '',
        body: record.reviewNote || 'No internal note.',
      });
    }

    const showVbadge = ai?.status === 'complete' && ai?.recommendation === 'likely_approve';

    return (
      <Modal
        title={null}
        open={detailModal.open}
        onCancel={() => {
          setDetailModal({ open: false, record: null });
          setDetailDecisionNote('');
        }}
        footer={null}
        width={1040}
        centered
        destroyOnClose
        closable
        wrapClassName={`${styles.customModal} ${styles.luminousModalShell}`}
        styles={{
          content: {
            padding: 0,
            overflow: 'hidden',
            borderRadius: 16,
            boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.18), 0 0 0 1px rgba(15, 23, 42, 0.05)',
          },
          body: {
            padding: 0,
            maxHeight: 'min(920px, 92vh)',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
        aria-labelledby="seller-app-detail-title"
      >
        <div className={styles.lumRoot}>
          <div className={styles.lumScroll}>
            <header className={styles.lumHero}>
              <div className={styles.lumHeroMain}>
                <div className={styles.lumAvatarWrap}>
                  {user.avatar ? (
                    <img src={user.avatar} alt="" className={styles.lumAvatarImg} />
                  ) : (
                    <Avatar size={96} icon={<UserOutlined />} className={styles.lumAvatarImg} />
                  )}
                  {showVbadge && (
                    <span className={styles.lumVbadge} title="Screening favorable">
                      V-Check
                    </span>
                  )}
                </div>
                <div className={styles.lumHeroText}>
                  <div className={styles.lumHeroTitleRow}>
                    <h2 className={styles.lumHeroTitle} id="seller-app-detail-title">
                      Application details
                    </h2>
                    <span className={`${styles.lumHeroPill} ${styles[`lumPill_${statusCfg.className}`]}`}>
                      {statusCfg.label}
                    </span>
                  </div>
                  <p className={styles.lumHeroHint}>Verify identity, address, and screening before approving.</p>
                  <p className={styles.lumHeroSub}>
                    Application ID:{' '}
                    <Text copyable={{ text: String(record._id) }} className={styles.lumHeroId}>
                      {String(record._id).length > 18 ? `${String(record._id).slice(0, 10)}…${String(record._id).slice(-6)}` : String(record._id)}
                    </Text>
                  </p>
                </div>
              </div>
              <div className={styles.lumHeroTools}>
                <Tooltip title="Print">
                  <button
                    type="button"
                    className={styles.lumIconBtn}
                    aria-label="Print application"
                    onClick={() => window.print()}
                  >
                    <PrinterOutlined />
                  </button>
                </Tooltip>
                <Tooltip title="Share link">
                  <button
                    type="button"
                    className={styles.lumIconBtn}
                    aria-label="Share or copy link"
                    onClick={shareApplication}
                  >
                    <ShareAltOutlined />
                  </button>
                </Tooltip>
              </div>
            </header>

            <div className={styles.lumBento}>
              <div className={`${styles.lumBentoMain} ${styles.lumMainStack}`}>
                <section className={styles.lumSection}>
                  <div className={styles.lumSectionHead}>
                    <span className={styles.lumSectionBar} />
                    <h3 className={styles.lumSectionTitle}>Identity &amp; business</h3>
                  </div>
                  <div className={styles.lumFieldGrid}>
                    <div className={styles.lumField}>
                      <span className={styles.lumLbl}>Full legal name</span>
                      <p className={styles.lumVal}>{user.fullName || '—'}</p>
                    </div>
                    <div className={styles.lumField}>
                      <span className={styles.lumLbl}>Email</span>
                      <p className={styles.lumVal}>
                        {user.email ? <Text copyable={{ text: user.email }}>{user.email}</Text> : '—'}
                      </p>
                    </div>
                    <div className={styles.lumField}>
                      <span className={styles.lumLbl}>Phone</span>
                      <p className={styles.lumVal}>{copyMono(user.phone)}</p>
                    </div>
                    <div className={styles.lumField}>
                      <span className={styles.lumLbl}>National ID (CCCD)</span>
                      <p className={styles.lumVal}>{copyMono(user.citizenId)}</p>
                    </div>
                    <div className={`${styles.lumField} ${styles.lumFieldWide}`}>
                      <span className={styles.lumLbl}>Tax code (MST)</span>
                      <p className={styles.lumVal}>{copyMono(user.taxId)}</p>
                    </div>
                  </div>
                  {user.aboutMe && (
                    <div className={styles.lumAbout}>
                      <Text type="secondary">&quot;{user.aboutMe}&quot;</Text>
                    </div>
                  )}
                </section>

                <section className={styles.lumSection}>
                  <div className={styles.lumSectionHead}>
                    <span className={styles.lumSectionBar} />
                    <h3 className={styles.lumSectionTitle}>Registered location</h3>
                  </div>
                  <div className={styles.lumLocationCard}>
                    <div className={styles.lumLocationText}>
                      <p className={styles.lumAddrLine}>{user.address || '—'}</p>
                      <p className={styles.lumAddrMeta}>
                        {[user.wardName, user.provinceName].filter(Boolean).join(', ') || '—'}
                      </p>
                      {fullAddressLine && (
                        <p className={styles.lumAddrFull}>
                          <Text copyable={{ text: fullAddressLine }}>{fullAddressLine}</Text>
                        </p>
                      )}
                    </div>
                    <div className={styles.lumMapPh} aria-hidden>
                      <EnvironmentOutlined className={styles.lumMapPhIcon} />
                    </div>
                  </div>
                </section>

                <section className={styles.lumSection}>
                  <div className={styles.lumSectionHead}>
                    <span className={styles.lumSectionBar} />
                    <h3 className={styles.lumSectionTitle}>Review history</h3>
                  </div>
                  <div className={styles.lumTimeline}>
                    {timelineItems.map((ev, idx) => (
                      <div key={ev.key} className={styles.lumTimelineRow}>
                        <div className={styles.lumTimelineRail}>
                          <div className={`${styles.lumTimelineIcon} ${styles[`lumTl_${ev.tone}`]}`}>{ev.icon}</div>
                          {idx < timelineItems.length - 1 ? <span className={styles.lumTimelineLine} aria-hidden /> : null}
                        </div>
                        <div className={styles.lumTimelineContent}>
                          <p className={styles.lumTimelineTitle}>{ev.title}</p>
                          <p className={styles.lumTimelineTime}>{ev.time}</p>
                          <p className={styles.lumTimelineBody}>{ev.body}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <aside className={styles.lumBentoSide}>
                <div className={styles.lumSideSticky}>
                  <LuminousScreeningColumn ai={ai} styles={styles} />
                </div>
              </aside>
            </div>
          </div>

          <footer className={styles.lumFooter}>
            <div className={styles.lumFooterGrid}>
              <div className={styles.lumFooterNote}>
                <label className={styles.lumFooterLbl}>Decision reasoning / internal note</label>
                <TextArea
                  value={detailDecisionNote}
                  onChange={(e) => setDetailDecisionNote(e.target.value)}
                  placeholder="Provide specific reasons for approval or rejection…"
                  rows={4}
                  className={styles.lumFooterTextarea}
                />
              </div>
              <div className={styles.lumFooterActions}>
                <Button size="large" className={styles.lumBtnClose} onClick={() => setDetailModal({ open: false, record: null })}>
                  Close
                </Button>
                {record.status === 'pending' && (
                  <>
                    <Button size="large" danger className={styles.lumBtnReject} onClick={() => submitDetailDecision('reject')}>
                      Reject application
                    </Button>
                    <Button size="large" type="primary" className={styles.lumBtnApprove} onClick={() => submitDetailDecision('approve')}>
                      Approve seller
                    </Button>
                  </>
                )}
              </div>
            </div>
          </footer>
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
