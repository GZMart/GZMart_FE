import React, { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
} from 'react-bootstrap';
import { motion } from 'framer-motion';
import { Megaphone, Bell, CheckCircle, Users, Send, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import notificationAPI from '@services/api/notificationAPI';
import axiosClient from '@services/axiosClient';
import toast from 'react-hot-toast';
import PageTransition from '@components/common/PageTransition';
import styles from '@assets/styles/seller/ShopNotificationsPage.module.css';

const SP_PRIMARY = 'var(--sp-primary, #1a56db)';
const SP_BG = 'var(--sp-blue-bg, #dbeafe)';

const ShopNotificationsPage = () => {
  const { t } = useTranslation();

  const ANNOUNCEMENT_TYPES = [
    {
      value: 'ANNOUNCEMENT',
      label: t('shopNotifications.typeAnnouncement'),
      icon: '📢',
      description: t('shopNotifications.descAnnouncement'),
    },
    {
      value: 'PROMOTION',
      label: t('shopNotifications.typePromotion'),
      icon: '🎉',
      description: t('shopNotifications.descPromotion'),
    },
    {
      value: 'VOUCHER',
      label: t('shopNotifications.typeVoucher'),
      icon: '🎟️',
      description: t('shopNotifications.descVoucher'),
    },
    {
      value: 'FLASH_SALE',
      label: t('shopNotifications.typeFlashSale'),
      icon: '⚡',
      description: t('shopNotifications.descFlashSale'),
    },
  ];

  const TIPS = [
    { icon: '🎯', iconBg: SP_BG, text: t('shopNotifications.tip1') },
    { icon: '⏰', iconBg: SP_BG, text: t('shopNotifications.tip2') },
    { icon: '🔔', iconBg: SP_BG, text: t('shopNotifications.tip3') },
    { icon: '🚫', iconBg: SP_BG, text: t('shopNotifications.tip4') },
  ];

  const STATS = [
    {
      label: t('shopNotifications.statTotalSent'),
      value: '—',
      icon: <Send size={20} />,
      iconBg: SP_BG,
      iconColor: SP_PRIMARY,
    },
    {
      label: t('shopNotifications.statOpenRate'),
      value: '—',
      icon: <Bell size={20} />,
      iconBg: SP_BG,
      iconColor: SP_PRIMARY,
    },
  ];

  const [form, setForm] = useState({ title: '', message: '', type: 'ANNOUNCEMENT' });
  const [sending, setSending] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [followerCount, setFollowerCount] = useState(null);

  useEffect(() => {
    const fetchFollowerCount = async () => {
      try {
        const res = await axiosClient.get('/api/users/profile');
        const count = res?.data?.followersCount ?? res?.data?.followerCount ?? null;
        setFollowerCount(count);
      } catch {
        // Not critical
      }
    };
    fetchFollowerCount();
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) {
      toast.error(t('shopNotifications.errorRequired'));
      return;
    }
    setSending(true);
    setLastResult(null);
    try {
      const resp = await notificationAPI.sendAnnouncement(form);
      const count = resp?.data?.count ?? 0;
      setLastResult({ count, success: true });
      toast.success(
        count > 0
          ? t('shopNotifications.successAlert', { count })
          : t('notifications.empty')
      );
      setForm((prev) => ({ ...prev, title: '', message: '' }));
    } catch (err) {
      const msg = err?.response?.data?.message || t('shopNotifications.errorSendFailed');
      toast.error(msg);
    } finally {
      setSending(false);
    }
  };

  const selectedType = ANNOUNCEMENT_TYPES.find((tp) => tp.value === form.type) || ANNOUNCEMENT_TYPES[0];

  return (
    <PageTransition>
      <Container fluid className={`p-4 ${styles.container}`}>

        {/* ── Page Header ── */}
        <div className={styles.titleSection}>
          <div>
            <h2 className={styles.pageTitle}>{t('shopNotifications.pageTitle')}</h2>
            <p className={styles.pageSubtitle}>{t('shopNotifications.pageSubtitle')}</p>
          </div>
        </div>

        {/* ── Banner Card ── */}
        <Card className={styles.bannerCard}>
          <div className={styles.bannerBackground}>
            <div className={styles.bannerAccent} />
            <Card.Body className="d-flex align-items-center justify-content-between p-4 px-5">
              <div className="d-flex align-items-center gap-4 position-relative" style={{ zIndex: 1 }}>
                <div className={`d-none d-md-flex ${styles.bannerIconCircle}`}>
                  <Megaphone size={28} className={styles.bannerIcon} />
                </div>
                <div>
                  <h5 className="fw-bold text-dark mb-1">{t('shopNotifications.bannerTitle')}</h5>
                  <p className="mb-0 text-secondary" style={{ fontSize: '0.9rem' }}>
                    {t('shopNotifications.bannerSubtitle')}{' '}
                    <span className="fw-bold text-primary bg-primary-subtle px-1 rounded">
                      {followerCount !== null ? followerCount.toLocaleString('vi-VN') : '...'}
                    </span>{' '}
                    {t('shopNotifications.bannerFollowersLabel')}
                  </p>
                </div>
              </div>
              <div className="d-none d-sm-flex align-items-center gap-3">
                <div className="text-center">
                  <div className="fw-bold text-dark" style={{ fontSize: '1.5rem' }}>
                    {followerCount !== null ? followerCount.toLocaleString('vi-VN') : '—'}
                  </div>
                  <div className="text-muted" style={{ fontSize: '11px' }}>
                    {t('shopNotifications.bannerFollowersUnit')}
                  </div>
                </div>
              </div>
            </Card.Body>
          </div>
        </Card>

        <Row className="g-4">
          {/* ── Left: Compose Form ── */}
          <Col lg={7}>

            {/* Type Selector */}
            <div className="mb-4">
              <h5 className={styles.sectionTitle}>{t('shopNotifications.sectionSelectType')}</h5>
              <div className={styles.typeGrid}>
                {ANNOUNCEMENT_TYPES.map((type) => (
                  <motion.button
                    key={type.value}
                    type="button"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className={`${styles.typePill} ${form.type === type.value ? styles.typePillActive : ''}`}
                    onClick={() => setForm((prev) => ({ ...prev, type: type.value }))}
                  >
                    <span className={styles.typePillIcon}>{type.icon}</span>
                    <span>{type.label}</span>
                  </motion.button>
                ))}
              </div>
              {selectedType && (
                <p className="text-muted mt-2 mb-0 d-flex align-items-center gap-1" style={{ fontSize: '12px' }}>
                  <Info size={12} />
                  {t('shopNotifications.infoTypeHint', { description: selectedType.description })}
                </p>
              )}
            </div>

            {/* Compose Card */}
            <Card className={styles.formCard}>
              <Card.Body className="p-4">
                <h5 className={styles.sectionTitle}>{t('shopNotifications.sectionCompose')}</h5>
                <form onSubmit={handleSend}>

                  {/* Title */}
                  <div className="mb-3">
                    <label htmlFor="notif-title" className="form-label fw-semibold text-dark" style={{ fontSize: '14px' }}>
                      {t('shopNotifications.labelTitleRequired')} <span className="text-danger">*</span>
                    </label>
                    <input
                      id="notif-title"
                      type="text"
                      name="title"
                      className="form-control"
                      placeholder={t('shopNotifications.placeholderTitle')}
                      value={form.title}
                      onChange={handleChange}
                      maxLength={100}
                      required
                    />
                    <div className={styles.charCount}>{form.title.length}/100</div>
                  </div>

                  {/* Message */}
                  <div className="mb-4">
                    <label htmlFor="notif-message" className="form-label fw-semibold text-dark" style={{ fontSize: '14px' }}>
                      {t('shopNotifications.labelMessageRequired')} <span className="text-danger">*</span>
                    </label>
                    <textarea
                      id="notif-message"
                      name="message"
                      className="form-control"
                      rows={5}
                      placeholder={t('shopNotifications.placeholderMessage')}
                      value={form.message}
                      onChange={handleChange}
                      maxLength={500}
                      required
                      style={{ resize: 'vertical' }}
                    />
                    <div className={styles.charCount}>{form.message.length}/500</div>
                  </div>

                  {/* Success alert */}
                  {lastResult && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`${styles.successAlert} mb-4`}
                    >
                      <CheckCircle size={18} color="#059669" />
                      <span className="small fw-medium text-success">
                        {t('shopNotifications.successAlert', { count: lastResult.count })}
                      </span>
                    </motion.div>
                  )}

                  {/* Send Button */}
                  <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                    <Button
                      type="submit"
                      className={`${styles.btnPrimary} w-100`}
                      disabled={sending}
                    >
                      {sending ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" />
                          {t('shopNotifications.btnSending')}
                        </>
                      ) : (
                        <>
                          <Send size={16} className="me-2" />
                          {t('shopNotifications.btnSend')}
                          {followerCount !== null && followerCount > 0 && (
                            <span
                              className="ms-2 badge rounded-pill"
                              style={{ backgroundColor: 'rgba(255,255,255,0.25)', fontSize: '11px' }}
                            >
                              {t('shopNotifications.btnSendFollowersBadge', {
                                count: followerCount.toLocaleString('vi-VN'),
                              })}
                            </span>
                          )}
                        </>
                      )}
                    </Button>
                  </motion.div>
                </form>
              </Card.Body>
            </Card>
          </Col>

          {/* ── Right: Sidebar ── */}
          <Col lg={5}>
            {/* Follower Card */}
            <Card className={`${styles.followerCard} mb-4`}>
              <Card.Body className="p-4 d-flex align-items-center gap-3">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center"
                  style={{ width: 56, height: 56, backgroundColor: 'rgba(255,255,255,0.2)', flexShrink: 0 }}
                >
                  <Users size={26} color="white" />
                </div>
                <div>
                  <div className={styles.followerCount}>
                    {followerCount !== null ? followerCount.toLocaleString('vi-VN') : '—'}
                  </div>
                  <div className={styles.followerLabel}>{t('shopNotifications.followerCardLabel')}</div>
                </div>
              </Card.Body>
            </Card>

            {/* Stats Cards */}
            <Row className="g-3 mb-4">
              {STATS.map((stat, i) => (
                <Col xs={6} key={i}>
                  <Card className={styles.statCard}>
                    <Card.Body className="p-3 d-flex align-items-center gap-3">
                      <div
                        className={styles.statIconCircle}
                        style={{ backgroundColor: stat.iconBg, color: stat.iconColor }}
                      >
                        {stat.icon}
                      </div>
                      <div>
                        <div className={styles.statValue}>{stat.value}</div>
                        <div className={styles.statLabel}>{stat.label}</div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>

            {/* Tips Card */}
            <Card className={styles.tipsCard}>
              <Card.Body className="p-4">
                <h5 className={styles.sectionTitle}>{t('shopNotifications.tipsTitle')}</h5>
                <div>
                  {TIPS.map((tip, i) => (
                    <div key={i} className={styles.tipItem}>
                      <div className={styles.tipIcon} style={{ backgroundColor: tip.iconBg }}>
                        {tip.icon}
                      </div>
                      <p className={`${styles.tipText} mb-0`}>{tip.text}</p>
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

      </Container>
    </PageTransition>
  );
};

export default ShopNotificationsPage;
