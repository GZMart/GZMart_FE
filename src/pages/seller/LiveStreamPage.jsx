import { useState, useCallback, useEffect } from 'react';
import livestreamService from '@services/api/livestreamService';
import VideoPreview from '@components/seller/VideoPreview';
import StreamSettingsForm from '@components/seller/StreamSettingsForm';
import LiveChatPanel from '@components/seller/LiveChatPanel';
import LiveActionBar from '@components/seller/LiveActionBar';
import LiveProductSelector from '@components/seller/LiveProductSelector';
import LiveVoucherSelector from '@components/seller/LiveVoucherSelector';
import styles from './LiveStreamPage.module.css';

const DEFAULT_FORM = {
  title: 'Live Stream: Giới thiệu sản phẩm mới',
  category: 'Fashion & Accessories',
  platforms: ['tiktok'],
};

export default function LiveStreamPage() {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [session, setSession] = useState(null);
  const [token, setToken] = useState(null);
  const [room, setRoom] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [liveProducts, setLiveProducts] = useState([]);
  const [pinnedProductId, setPinnedProductId] = useState(null);
  const [addingProducts, setAddingProducts] = useState(false);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [liveVouchers, setLiveVouchers] = useState([]);
  const [addingVouchers, setAddingVouchers] = useState(false);
  const [showVoucherSelector, setShowVoucherSelector] = useState(false);

  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [micLevel, setMicLevel] = useState(66);

  const handleGoLive = useCallback(async () => {
    if (!form.title.trim()) {
      setError('Please enter a broadcast title.');
      return;
    }
    try {
      setIsLoading(true);
      setError(null);

      const newSession = await livestreamService.createSession({
        title: form.title,
        category: form.category,
        platforms: form.platforms,
      });

      const startRes = await livestreamService.startSession(newSession._id);

      setSession(startRes.session);
      setToken(startRes.token);
      setIsLive(true);
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to start live stream.');
    } finally {
      setIsLoading(false);
    }
  }, [form]);

  const handleEndLive = useCallback(async () => {
    if (!session) {
return;
}
    try {
      await livestreamService.endSession(session._id);
    } catch (_) {
      // best-effort
    }
    setSession(null);
    setToken(null);
    setRoom(null);
    setIsLive(false);
  }, [session]);

  const handleDiscard = useCallback(() => {
    if (isLive) {
      handleEndLive();
    }
    setForm(DEFAULT_FORM);
    setError(null);
  }, [isLive, handleEndLive]);

  const toggleMic = () => {
    setIsMicOn((v) => !v);
    setMicLevel((v) => (v > 0 ? 0 : 66));
  };

  const toggleCam = () => setIsCamOn((v) => !v);

  const toggleFullscreen = () => {
    const el = document.querySelector(`.${styles.videoCard}`);
    if (el) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        el.requestFullscreen?.();
      }
    }
  };

  const handleRoomConnect = useCallback((liveKitRoom) => {
    setRoom(liveKitRoom);
  }, []);

  // Fetch current session products
  const fetchSessionProducts = useCallback(async () => {
    if (!session?._id) {
return;
}
    try {
      const res = await livestreamService.getSessionProducts(session._id);
      setLiveProducts(res?.data?.products || []);
      setPinnedProductId(res?.data?.pinnedProduct?._id || null);
    } catch (_) {
      // non-critical
    }
  }, [session]);

  // Load products when session becomes live
  useEffect(() => {
    if (session?._id && isLive) {
      fetchSessionProducts();
    }
  }, [session?._id, isLive, fetchSessionProducts]);

  // Add products to session
  const handleAddProducts = async (productIds) => {
    if (!session?._id) {
return;
}
    setAddingProducts(true);
    try {
      const res = await livestreamService.addProductsToSession(session._id, productIds);
      setLiveProducts(res?.data?.products || []);
      setPinnedProductId(res?.data?.pinnedProduct?._id || null);
      setShowProductSelector(false);
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to add products');
    } finally {
      setAddingProducts(false);
    }
  };

  // Remove product from session
  const handleRemoveProduct = async (productId) => {
    if (!session?._id) {
return;
}
    try {
      const res = await livestreamService.removeProductFromSession(session._id, productId);
      setLiveProducts(res?.data?.products || []);
      if (String(productId) === String(pinnedProductId)) {
        setPinnedProductId(null);
      }
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to remove product');
    }
  };

  // Pin product to viewer overlay
  const handlePinProduct = async (productId) => {
    if (!session?._id) {
return;
}
    try {
      const res = await livestreamService.pinProduct(session._id, productId);
      setLiveProducts(res?.data?.products || []);
      setPinnedProductId(res?.data?.pinnedProduct?._id || null);
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to pin product');
    }
  };

  // Unpin current product
  const handleUnpinProduct = async (_productId) => {
    if (!session?._id) {
return;
}
    try {
      const res = await livestreamService.unpinProduct(session._id);
      setLiveProducts(res?.data?.products || []);
      setPinnedProductId(null);
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to unpin product');
    }
  };

  // Fetch current session vouchers
  const fetchSessionVouchers = useCallback(async () => {
    if (!session?._id) {
return;
}
    try {
      const res = await livestreamService.getSessionVouchers(session._id);
      setLiveVouchers(res?.data?.vouchers || []);
    } catch (_) {
      // non-critical
    }
  }, [session?._id]);

  // Load vouchers when session goes live
  useEffect(() => {
    if (session?._id && isLive) {
      fetchSessionVouchers();
    }
  }, [session?._id, isLive, fetchSessionVouchers]);

  // Add vouchers to session
  const handleAddVouchers = async (voucherIds) => {
    if (!session?._id) {
return;
}
    setAddingVouchers(true);
    try {
      const res = await livestreamService.addVouchersToSession(session._id, voucherIds);
      setLiveVouchers(res?.data?.vouchers || []);
      setShowVoucherSelector(false);
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to add vouchers');
    } finally {
      setAddingVouchers(false);
    }
  };

  // Remove voucher from session
  const handleRemoveVoucher = async (voucherId) => {
    if (!session?._id) {
return;
}
    try {
      const res = await livestreamService.removeVoucherFromSession(session._id, voucherId);
      setLiveVouchers(res?.data?.vouchers || []);
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to remove voucher');
    }
  };

  return (
    <div className={styles.pageWrapper}>
      {/* ── Page Header ─────────────────────────────────────────── */}
      <div className={styles.pageHeader}>
        <div className={styles.headerLeft}>
          <h1 className={styles.pageTitle}>Live Stream Studio</h1>
          <p className={styles.pageSubtitle}>
            Get ready to connect with your community. Review your setup and
            manage your products before going live.
          </p>
        </div>

        <div className={styles.headerBadges}>
          <div className={styles.headerBadge}>
            <span className={styles.badgeLabel}>Time Slot</span>
            <span className={`${styles.badgeValue} ${styles.badgeValueAccent}`}>
              Today, 20:00
            </span>
          </div>
          <div className={styles.badgeDivider} />
          <div className={styles.headerBadge}>
            <span className={styles.badgeLabel}>Est. Reach</span>
            <span className={styles.badgeValue}>~2,400</span>
          </div>
        </div>
      </div>

      {/* ── Main Grid ───────────────────────────────────────────── */}
      <div className={styles.mainGrid}>
        {/* Left: Video + Settings */}
        <div className={styles.leftColumn}>
          <VideoPreview
            styles={styles}
            isLive={isLive}
            token={token}
            micLevel={micLevel}
            isMicOn={isMicOn}
            isCamOn={isCamOn}
            onToggleMic={toggleMic}
            onToggleCam={toggleCam}
            onToggleFullscreen={toggleFullscreen}
            onRoomConnect={handleRoomConnect}
          />

          <StreamSettingsForm form={form} onChange={setForm} />
        </div>

        {/* Right: Chat Panel */}
        <LiveChatPanel
          room={room}
          sessionId={session?._id}
          isLive={isLive}
          liveProducts={liveProducts}
          onEditProducts={() => setShowProductSelector(true)}
          onRemoveProduct={handleRemoveProduct}
          pinnedProductId={pinnedProductId}
          onPinProduct={handlePinProduct}
          onUnpinProduct={handleUnpinProduct}
          liveVouchers={liveVouchers}
          onEditVouchers={() => setShowVoucherSelector(true)}
          onRemoveVoucher={handleRemoveVoucher}
        />
      </div>

      {/* ── Product Selector Modal ── */}
      <LiveProductSelector
        isOpen={showProductSelector}
        onClose={() => setShowProductSelector(false)}
        onAdd={handleAddProducts}
        loading={addingProducts}
        existingProductIds={liveProducts.map((p) => p._id)}
      />

      {/* ── Voucher Selector Modal ── */}
      <LiveVoucherSelector
        isOpen={showVoucherSelector}
        onClose={() => setShowVoucherSelector(false)}
        onAdd={handleAddVouchers}
        loading={addingVouchers}
        existingVoucherIds={liveVouchers.map((v) => v._id)}
      />

      {/* ── Action Bar ───────────────────────────────────────────── */}
      <LiveActionBar
        onDiscard={handleDiscard}
        onGoLive={handleGoLive}
        isLive={isLive}
        isLoading={isLoading}
      />

      {/* ── Error toast ─────────────────────────────────────────── */}
      {error && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#dc3545',
            color: '#fff',
            padding: '12px 24px',
            borderRadius: 12,
            fontSize: 13,
            fontWeight: 600,
            boxShadow: '0 4px 16px rgba(220,53,69,0.4)',
            zIndex: 9999,
            maxWidth: 480,
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <span style={{ flex: 1 }}>{error}</span>
          <button
            onClick={() => setError(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              fontSize: 20,
              lineHeight: 1,
              padding: 0,
              flexShrink: 0,
            }}
          >
            &times;
          </button>
        </div>
      )}

      {/* ── End Live floating button (when live) ─────────────────── */}
      {isLive && (
        <button className={styles.endLiveBtn} onClick={handleEndLive} type="button">
          <i className={`bi bi-x-circle-fill ${styles.endLiveBtnIcon}`} />
          End Live
        </button>
      )}
    </div>
  );
}
