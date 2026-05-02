import { useState, useCallback, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useMediaDevices } from '@hooks/useMediaDevices';
import livestreamService from '@services/api/livestreamService';
import VideoPreview from '@components/seller/VideoPreview';
import { SELLER_ROUTES } from '@constants/routes';
import EndLiveConfirmModal from '@components/seller/EndLiveConfirmModal';
import styles from '@assets/styles/buyer/LiveStreamPage.module.css';

/**
 * Seller opens this page from handoff link: /seller/live/mobile?sessionId=&h=
 * Same seller account must be logged in. Token is one-time + short TTL.
 */
export default function LiveStreamMobilePage() {
  const [searchParams] = useSearchParams();
  const sessionIdParam = searchParams.get('sessionId');
  const handoffToken = searchParams.get('h');

  const [exchangeError, setExchangeError] = useState(null);
  const [handoffOk, setHandoffOk] = useState(false);
  const [session, setSession] = useState(null);
  const [token, setToken] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [micGain, setMicGain] = useState(1);
  const [selectedMicId, setSelectedMicId] = useState('');
  const [selectedCamId, setSelectedCamId] = useState('');

  const { audioInputs, videoInputs, error: devicesError, requestPermission } = useMediaDevices();

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

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!sessionIdParam || !handoffToken) {
        setExchangeError('Link không hợp lệ — thiếu session hoặc mã.');
        return;
      }
      setExchangeError(null);
      try {
        await livestreamService.exchangeHandoff(handoffToken);
        if (cancelled) {
          return;
        }
        setHandoffOk(true);
      } catch (e) {
        if (!cancelled) {
          setExchangeError(
            e.response?.data?.message || e.message || 'Link hết hạn hoặc đã được dùng.',
          );
        }
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [sessionIdParam, handoffToken]);

  useEffect(() => {
    if (!handoffOk || !sessionIdParam) {
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await livestreamService.getSession(sessionIdParam);
        const s = res?.data ?? res;
        if (!cancelled && s) {
          setSession(s);
        }
      } catch {
        /* non-critical */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [handoffOk, sessionIdParam]);

  const handleGoLive = useCallback(async () => {
    if (!sessionIdParam || !handoffOk) {
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      const startRes = await livestreamService.startSession(sessionIdParam);
      setSession(startRes.session);
      setToken(startRes.token);
      setIsLive(true);
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Không thể bắt đầu live.');
    } finally {
      setIsLoading(false);
    }
  }, [sessionIdParam, handoffOk]);

  const handleEndLive = useCallback(async () => {
    if (!sessionIdParam) {
      return;
    }
    try {
      await livestreamService.endSession(sessionIdParam);
    } catch (_) {
      /* best-effort */
    }
    setSession(null);
    setToken(null);
    setIsLive(false);
  }, [sessionIdParam]);

  const confirmEndLive = useCallback(() => {
    setShowEndConfirm(true);
  }, []);

  // Remove h from URL after successful exchange so refresh doesn't reuse token
  useEffect(() => {
    if (!handoffOk || !sessionIdParam) {
      return;
    }
    const url = new URL(window.location.href);
    if (url.searchParams.has('h')) {
      url.searchParams.delete('h');
      window.history.replaceState({}, '', `${url.pathname}${url.search}`);
    }
  }, [handoffOk, sessionIdParam]);

  if (exchangeError) {
    return (
      <div className={styles.mobileHandoffPage}>
        <div className={styles.mobileHandoffCard}>
          <h1 className={styles.mobileHandoffTitle}>Không mở được link</h1>
          <p className={styles.mobileHandoffText}>{exchangeError}</p>
          <p className={styles.mobileHandoffText}>
            Hãy tạo link mới trên máy tính (Live Studio → nút &quot;Tiếp tục trên điện thoại&quot;).
          </p>
          <Link to={SELLER_ROUTES.LIVE} className={styles.mobileHandoffLink}>
            Về Live Studio
          </Link>
        </div>
      </div>
    );
  }

  if (!sessionIdParam || !handoffToken) {
    return (
      <div className={styles.mobileHandoffPage}>
        <div className={styles.mobileHandoffCard}>
          <p className={styles.mobileHandoffText}>Link không hợp lệ.</p>
          <Link to={SELLER_ROUTES.LIVE} className={styles.mobileHandoffLink}>
            Về Live Studio
          </Link>
        </div>
      </div>
    );
  }

  if (!handoffOk) {
    return (
      <div className={styles.mobileHandoffPage}>
        <p className={styles.mobileHandoffText}>Đang xác thực link…</p>
      </div>
    );
  }

  return (
    <div className={styles.mobileLivePage}>
      <div className={styles.mobileLiveBanner}>
        <strong>Điện thoại đang phát.</strong> Không bật camera/mic trên máy tính cùng lúc cho cùng phiên.
      </div>

      <div className={styles.mobileLiveHeader}>
        <h1 className={styles.mobileLiveTitle}>Live (điện thoại)</h1>
        {session?.title && <p className={styles.mobileLiveSubtitle}>{session.title}</p>}
      </div>

      <div className={styles.mobileLiveVideo}>
        <VideoPreview
          styles={styles}
          isLive={isLive}
          token={token}
          micDeviceId={selectedMicId || undefined}
          camDeviceId={selectedCamId || undefined}
          micGain={micGain}
          onMicGainChange={setMicGain}
          isMicOn={isMicOn}
          isCamOn={isCamOn}
          onToggleMic={() => setIsMicOn((v) => !v)}
          onToggleCam={() => setIsCamOn((v) => !v)}
          onToggleFullscreen={() => {}}
        />
      </div>

      {devicesError && (
        <p className={styles.mobileHandoffText} style={{ color: '#c62828', fontSize: 12 }}>
          {devicesError}
        </p>
      )}
      <button type="button" className={styles.btnDevicePermission} onClick={requestPermission}>
        <i className={`bi bi-unlock-fill ${styles.btnDevicePermissionIcon}`} aria-hidden />
        Allow microphone &amp; camera
      </button>

      {!isLive && (
        <button
          type="button"
          className={styles.mobileGoLiveBtn}
          onClick={handleGoLive}
          disabled={isLoading}
        >
          {isLoading ? 'Đang kết nối…' : 'BẮT ĐẦU LIVE'}
        </button>
      )}

      {isLive && (
        <button type="button" className={styles.mobileEndLiveBtn} onClick={confirmEndLive}>
          Kết thúc live
        </button>
      )}

      {error && <p className={styles.mobileHandoffError}>{error}</p>}

      <EndLiveConfirmModal
        isOpen={showEndConfirm}
        onCancel={() => setShowEndConfirm(false)}
        onConfirm={() => { setShowEndConfirm(false); void handleEndLive(); }}
      />
    </div>
  );
}
