import { useState, useCallback, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useMediaDevices } from '@hooks/useMediaDevices';
import { useMediaQuery } from '@hooks/useMediaQuery';
import livestreamService from '@services/api/livestreamService';
import VideoPreview from '@components/seller/VideoPreview';
import StreamSettingsForm from '@components/seller/StreamSettingsForm';
import LiveChatPanel from '@components/seller/LiveChatPanel';
import LiveActionBar from '@components/seller/LiveActionBar';
import LiveProductSelector from '@components/seller/LiveProductSelector';
import LiveVoucherSelector from '@components/seller/LiveVoucherSelector';
import LiveSessionEndSummaryModal from '@components/seller/LiveSessionEndSummaryModal';
import LiveSessionAnalyticsPanel from '@components/seller/LiveSessionAnalyticsPanel';
import socketService from '@services/socket/socketService';
import styles from '@assets/styles/buyer/LiveStreamPage.module.css';

const DEFAULT_FORM = {
  title: 'Live stream: New product showcase',
  category: 'Fashion & Accessories',
  platforms: ['tiktok'],
};

const END_LIVE_CONFIRM_MSG =
  'Bạn có chắc muốn kết thúc phiên live? Người xem sẽ không còn xem được phát sóng này.';

function getFullscreenElement() {
  const d = document;
  return d.fullscreenElement || d.webkitFullscreenElement || d.mozFullScreenElement || d.msFullscreenElement;
}

function exitFullscreen() {
  const d = document;
  const fn = d.exitFullscreen || d.webkitExitFullscreen || d.mozCancelFullScreen || d.msExitFullscreen;
  return fn?.call(d);
}

function requestFullscreen(el) {
  if (!el) {
    return;
  }
  const fn =
    el.requestFullscreen ||
    el.webkitRequestFullscreen ||
    el.mozRequestFullScreen ||
    el.msRequestFullscreen;
  fn?.call(el);
}

export default function LiveStreamPage() {
  const videoContainerRef = useRef(null);
  const liveHydrateDoneRef = useRef(false);
  const goLiveStartedRef = useRef(false);
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

  /** Right column: chat & stream tools vs. dedicated analytics panel */
  const [rightStudioTab, setRightStudioTab] = useState('tools');

  const [endSummaryOpen, setEndSummaryOpen] = useState(false);
  const [endSummaryLoading, setEndSummaryLoading] = useState(false);
  const [endSummaryError, setEndSummaryError] = useState(null);
  const [endSummaryStats, setEndSummaryStats] = useState(null);

  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [micGain, setMicGain] = useState(1);
  const [selectedMicId, setSelectedMicId] = useState('');
  const [selectedCamId, setSelectedCamId] = useState('');

  const { audioInputs, videoInputs, error: devicesError, requestPermission } = useMediaDevices();
  const isMobileLayout = useMediaQuery('(max-width: 768px)');
  const user = useSelector((state) => state.auth?.user);

  /** Keep seller in livestream socket room while live (chat + analytics tabs; stats tick delivery). */
  useEffect(() => {
    if (!session?._id || !isLive || !user?._id) {
      return undefined;
    }
    const sessionId = session._id;
    socketService.connect(user._id);
    socketService.emit('livestream_join', {
      sessionId,
      userId: user._id,
      displayName: user.fullName || 'Seller',
      role: 'seller',
    });
    return () => {
      socketService.emit('livestream_leave', { sessionId });
    };
  }, [session?._id, isLive, user?._id]);

  useEffect(() => {
    const sellerId = user?._id;
    if (!sellerId || liveHydrateDoneRef.current) {
      return undefined;
    }

    let cancelled = false;

    (async () => {
      try {
        const active = await livestreamService.getActiveByShop(sellerId);
        if (cancelled || !active || String(active.status) !== 'live' || !active._id) {
          liveHydrateDoneRef.current = true;
          return;
        }

        const res = await livestreamService.mintHostToken(active._id);
        const tokenStr = res?.token;
        const sessionObj = res?.session ?? active;

        if (cancelled || goLiveStartedRef.current || !tokenStr || !sessionObj) {
          liveHydrateDoneRef.current = true;
          return;
        }

        setSession(sessionObj);
        setToken(tokenStr);
        setIsLive(true);
        setForm((prev) => ({
          ...prev,
          title: sessionObj.title || prev.title,
          category: sessionObj.category ?? prev.category,
        }));
      } catch {
        /* không có phiên live hoặc lỗi mạng — bỏ qua */
      } finally {
        if (!cancelled) {
          liveHydrateDoneRef.current = true;
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?._id]);

  useEffect(() => {
    if (!isLive) {
      return undefined;
    }
    const onBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isLive]);

  const streamSettingsProps = {
    form,
    onChange: setForm,
    audioInputs,
    videoInputs,
    selectedMicId,
    selectedCamId,
    onMicChange: setSelectedMicId,
    onCamChange: setSelectedCamId,
    onRequestDevicePermission: requestPermission,
    devicesError,
  };

  useEffect(() => {
    if (!selectedMicId && audioInputs[0]?.deviceId) {
      setSelectedMicId(audioInputs[0].deviceId);
    }
  }, [audioInputs, selectedMicId]);

  useEffect(() => {
    if (!selectedCamId && videoInputs[0]?.deviceId) {
      setSelectedCamId(videoInputs[0].deviceId);
    }
  }, [videoInputs, selectedCamId]);

  const handleGoLive = useCallback(async () => {
    if (!form.title.trim()) {
      setError('Please enter a broadcast title.');
      return;
    }
    goLiveStartedRef.current = true;
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
    if (!session?._id) {
      return;
    }
    const sessionId = session._id;
    setEndSummaryOpen(true);
    setEndSummaryLoading(true);
    setEndSummaryError(null);
    setEndSummaryStats(null);

    try {
      await livestreamService.endSession(sessionId);
    } catch (_) {
      /* best-effort end; still try to load stats */
    }

    setSession(null);
    setToken(null);
    setRoom(null);
    setIsLive(false);

    try {
      const res = await livestreamService.getSessionStats(sessionId);
      const payload = res?.data?.data ?? res?.data;
      setEndSummaryStats(payload ?? null);
    } catch (e) {
      setEndSummaryError(
        e.response?.data?.message || e.message || 'Could not load session summary.',
      );
    } finally {
      setEndSummaryLoading(false);
    }
  }, [session]);

  const confirmEndLive = useCallback(() => {
    if (typeof window !== 'undefined' && !window.confirm(END_LIVE_CONFIRM_MSG)) {
      return;
    }
    void handleEndLive();
  }, [handleEndLive]);

  const handleDiscard = useCallback(() => {
    if (isLive) {
      if (typeof window !== 'undefined' && !window.confirm(END_LIVE_CONFIRM_MSG)) {
        return;
      }
      void handleEndLive();
    }
    setForm(DEFAULT_FORM);
    setError(null);
  }, [isLive, handleEndLive]);

  const toggleMic = () => {
    setIsMicOn((v) => !v);
  };

  const toggleCam = () => setIsCamOn((v) => !v);

  const toggleFullscreen = useCallback(() => {
    const el = videoContainerRef.current;
    if (!el) {
      return;
    }
    if (getFullscreenElement()) {
      exitFullscreen();
    } else {
      requestFullscreen(el);
    }
  }, []);

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
      setPinnedProductId(res?.data?.pinnedProduct?._id || pinnedProductId);
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
      </div>

      {/* ── Main: desktop = video+settings | chat; mobile = video → chat → settings ── */}
      <div className={styles.mainGrid}>
        <div className={styles.gridAreaVideo}>
          <VideoPreview
            ref={videoContainerRef}
            styles={styles}
            isLive={isLive}
            token={token}
            micDeviceId={selectedMicId || undefined}
            camDeviceId={selectedCamId || undefined}
            micGain={micGain}
            onMicGainChange={setMicGain}
            isMicOn={isMicOn}
            isCamOn={isCamOn}
            onToggleMic={toggleMic}
            onToggleCam={toggleCam}
            onToggleFullscreen={toggleFullscreen}
            onRoomConnect={handleRoomConnect}
          />
        </div>

        <div className={`${styles.gridAreaChat} ${styles.rightColumn}`}>
          <div className={styles.studioRightStack}>
            <div className={styles.studioPanelTabs} role="tablist" aria-label="Studio panel">
              <button
                type="button"
                role="tab"
                aria-selected={rightStudioTab === 'tools'}
                className={`${styles.studioPanelTab} ${rightStudioTab === 'tools' ? styles.studioPanelTabActive : ''}`}
                onClick={() => setRightStudioTab('tools')}
              >
                {isMobileLayout ? 'Tools' : 'Live tools'}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={rightStudioTab === 'analytics'}
                className={`${styles.studioPanelTab} ${rightStudioTab === 'analytics' ? styles.studioPanelTabActive : ''}`}
                onClick={() => setRightStudioTab('analytics')}
              >
                {isMobileLayout ? 'Analytics' : 'Session analytics'}
              </button>
            </div>
            <div className={styles.studioRightInner}>
              {rightStudioTab === 'tools' && (
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
              )}
              {rightStudioTab === 'analytics' && (
                <LiveSessionAnalyticsPanel sessionId={session?._id} isLive={isLive} />
              )}
            </div>
          </div>
        </div>

        <div className={styles.gridAreaSettings}>
          {isMobileLayout ? (
            <details className={styles.mobileSettingsDetails}>
              <summary className={styles.mobileSettingsSummary}>
                Broadcast settings, mic & camera
              </summary>
              <StreamSettingsForm {...streamSettingsProps} />
            </details>
          ) : (
            <StreamSettingsForm {...streamSettingsProps} />
          )}
        </div>
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

      <LiveSessionEndSummaryModal
        isOpen={endSummaryOpen}
        loading={endSummaryLoading}
        error={endSummaryError}
        stats={endSummaryStats}
        onClose={() => {
          setEndSummaryOpen(false);
          setEndSummaryStats(null);
          setEndSummaryError(null);
        }}
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
        <div className={styles.livestreamErrorToast} role="alert">
          <span className={styles.livestreamErrorToastText}>{error}</span>
          <button
            className={styles.livestreamErrorToastClose}
            onClick={() => setError(null)}
            type="button"
            aria-label="Close"
          >
            &times;
          </button>
        </div>
      )}

      {/* ── End Live floating button (when live) ─────────────────── */}
      {isLive && (
        <button className={styles.endLiveBtn} onClick={confirmEndLive} type="button">
          <i className={`bi bi-x-circle-fill ${styles.endLiveBtnIcon}`} />
          End Live
        </button>
      )}
    </div>
  );
}
