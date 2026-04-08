/**
 * BannerHotspotWidget — Seller Dashboard teaser card
 *
 * Hiển thị trạng thái slot banner hôm nay và link nhanh đến trang Banner Ads.
 * Widget nhỏ gọn, đồng bộ phong cách Dashboard (no complex modal).
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tag, Tooltip } from 'antd';
import { ThunderboltOutlined, RightOutlined, DollarOutlined } from '@ant-design/icons';
import bannerAdsService from '@services/api/bannerAdsService';
import { useSelector } from 'react-redux';
import styles from './BannerHotspotWidget.module.css';

const SLOT_COLORS = ['#52c41a', '#52c41a', '#fa8c16', '#fa8c16', '#f5222d'];

const BannerHotspotWidget = () => {
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth?.user);
  const walletBalance = user?.reward_point || 0;

  const [calendar, setCalendar] = useState({});
  const [myBanners, setMyBanners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [calRes, myRes] = await Promise.all([
          bannerAdsService.getCalendar(),
          bannerAdsService.getMyRequests({ limit: 50 }),
        ]);
        const calData = calRes?.data || calRes;
        setCalendar(calData?.calendar || {});
        setMyBanners(myRes?.banners || []);
      } catch { /* silent */ }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const todayKey = new Date().toISOString().split('T')[0];
  const todayInfo = calendar[todayKey] || { bookedSlots: 0, availableSlots: 1, isFull: false };
  const MAX_SLOTS = 1;

  const runningBanners = myBanners.filter((b) => b.status === 'RUNNING');
  const pendingBanners = myBanners.filter((b) => ['PENDING_REVIEW', 'APPROVED'].includes(b.status));

  // Build slot display
  const slots = Array.from({ length: MAX_SLOTS }).map((_, i) => {
    if (i < runningBanners.length) return 'mine_running';
    if (i - runningBanners.length < pendingBanners.length) return 'mine_pending';
    const occupied = todayInfo.bookedSlots - runningBanners.length - pendingBanners.length;
    const myTotal = runningBanners.length + pendingBanners.length;
    if (i - myTotal < Math.max(0, occupied)) return 'other';
    return 'free';
  });

  const freeSlotsCount = slots.filter((s) => s === 'free').length;

  const slotColor = (s) => ({
    free: '#22c55e',
    other: '#94a3b8',
    mine_running: '#3b82f6',
    mine_pending: '#a855f7',
  })[s] || '#94a3b8';

  const slotLabel = (s) => ({
    free: 'Slot trống',
    other: 'Đã có người đặt',
    mine_running: 'Banner đang chạy của bạn',
    mine_pending: 'Banner chờ duyệt của bạn',
  })[s] || '';

  return (
    <div className={styles.widget} onClick={() => navigate('/seller/banner-ads')}>
      {/* Header row */}
      <div className={styles.widgetHeader}>
        <div className={styles.widgetLeft}>
          <div className={styles.widgetIcon}>
            <ThunderboltOutlined />
          </div>
          <div>
            <div className={styles.widgetTitle}>Quảng Cáo Banner</div>
            <div className={styles.widgetSub}>
              {loading ? 'Đang tải...' : freeSlotsCount > 0
                ? `${freeSlotsCount} slot trống hôm nay`
                : 'Hết slot hôm nay'}
            </div>
          </div>
        </div>
        <div className={styles.widgetRight}>
          <div className={styles.walletBadge}>
            <DollarOutlined />
            <span>{walletBalance.toLocaleString()} xu</span>
          </div>
          <RightOutlined className={styles.arrowIcon} />
        </div>
      </div>

      {/* Slots visual */}
      {!loading && (
        <div className={styles.slotsRow}>
          {slots.map((s, i) => (
            <Tooltip key={i} title={`Slot ${i + 1}: ${slotLabel(s)}`}>
              <div
                className={`${styles.slotPill} ${s === 'free' ? styles.slotFree : ''}`}
                style={{ background: slotColor(s) }}
              />
            </Tooltip>
          ))}
          <span className={styles.slotsLabel}>
            {MAX_SLOTS} slot · 200.000 xu/ngày
          </span>
        </div>
      )}

      {/* Active campaigns */}
      {(runningBanners.length > 0 || pendingBanners.length > 0) && (
        <div className={styles.activeTags}>
          {runningBanners.map((b) => (
            <Tag key={b._id} color="blue" icon={<ThunderboltOutlined />} style={{ fontSize: 11 }}>
              Đang chạy
            </Tag>
          ))}
          {pendingBanners.map((b) => (
            <Tag key={b._id} color="purple" style={{ fontSize: 11 }}>
              Chờ duyệt
            </Tag>
          ))}
        </div>
      )}
    </div>
  );
};

export default BannerHotspotWidget;
