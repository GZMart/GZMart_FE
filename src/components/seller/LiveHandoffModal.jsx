import { useEffect, useState, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import PropTypes from 'prop-types';
import { toast } from 'react-toastify';
import livestreamService from '@services/api/livestreamService';
import styles from '@assets/styles/buyer/LiveStreamPage.module.css';

export default function LiveHandoffModal({ isOpen, sessionId, onClose }) {
  const [token, setToken] = useState('');
  const [expiresAt, setExpiresAt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [now, setNow] = useState(Date.now());

  const fetchHandoff = useCallback(async () => {
    if (!sessionId) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await livestreamService.createHandoff(sessionId);
      const payload = res?.data ?? res;
      const inner = payload?.data ?? payload;
      setToken(inner.token);
      setExpiresAt(inner.expiresAt);
    } catch (e) {
      const msg = e.response?.data?.message || e.message || 'Không tạo được link';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (isOpen && sessionId) {
      fetchHandoff();
    }
  }, [isOpen, sessionId, fetchHandoff]);

  useEffect(() => {
    if (!isOpen || !expiresAt) {
      return undefined;
    }
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [isOpen, expiresAt]);

  if (!isOpen) {
    return null;
  }

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const handoffUrl =
    token && sessionId
      ? `${baseUrl}/seller/live/mobile?sessionId=${encodeURIComponent(sessionId)}&h=${encodeURIComponent(token)}`
      : '';

  const expMs = expiresAt ? new Date(expiresAt).getTime() : 0;
  const secondsLeft = expMs > now ? Math.max(0, Math.floor((expMs - now) / 1000)) : 0;

  const copyLink = async () => {
    if (!handoffUrl) {
      return;
    }
    try {
      await navigator.clipboard.writeText(handoffUrl);
      toast.success('Đã copy link');
    } catch {
      toast.error('Không copy được — hãy copy thủ công');
    }
  };

  return (
    <div className={styles.handoffModalBackdrop} role="presentation" onClick={onClose}>
      <div
        className={styles.handoffModal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="handoff-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.handoffModalHeader}>
          <h2 id="handoff-title" className={styles.handoffModalTitle}>
            Live trên điện thoại
          </h2>
          <button type="button" className={styles.handoffModalClose} onClick={onClose} aria-label="Đóng">
            ×
          </button>
        </div>
        <p className={styles.handoffModalHint}>
          Mở link trên điện thoại (cùng tài khoản seller). Link dùng một lần và hết hạn sau ~10 phút.
        </p>

        {loading && <p className={styles.handoffModalStatus}>Đang tạo link…</p>}
        {error && (
          <p className={styles.handoffModalError}>{error}</p>
        )}

        {!loading && handoffUrl && (
          <>
            <div className={styles.handoffQrWrap}>
              <QRCodeSVG value={handoffUrl} size={200} level="M" includeMargin />
            </div>
            <p className={styles.handoffExpire}>
              Hết hạn sau: <strong>{secondsLeft}s</strong>
            </p>
            <div className={styles.handoffActions}>
              <button type="button" className={styles.btnCopyLink} onClick={copyLink}>
                Copy link
              </button>
              <button type="button" className={styles.btnRegenLink} onClick={fetchHandoff}>
                Tạo link mới
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

LiveHandoffModal.propTypes = {
  isOpen: PropTypes.bool,
  sessionId: PropTypes.string,
  onClose: PropTypes.func,
};
