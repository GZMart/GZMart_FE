import { useEffect, useRef, useState } from 'react';
import { LiveKitRoom, VideoTrack, RoomAudioRenderer, useLocalParticipant } from '@livekit/components-react';
import { Room, Track } from 'livekit-client';
import '@livekit/components-styles';

/* eslint-disable react/prop-types */

// ── Thin wrapper inside LiveKitRoom to grab Room from context ───────────────
// useLocalParticipant() internally uses useEnsureRoom → RoomContext → RoomContext.Provider
// So we can safely call useLocalParticipant() inside LiveKitRoom and it works.
function SellerLiveView({ isMicOn, isCamOn }) {
  const { localParticipant, cameraTrack, lastCameraError, lastMicrophoneError } = useLocalParticipant();

  useEffect(() => {
    if (!localParticipant) {
      return;
    }
    localParticipant.setCameraEnabled(isCamOn).catch(() => {
      // ignore
    });
  }, [isCamOn, localParticipant]);

  useEffect(() => {
    if (!localParticipant) {
      return;
    }
    localParticipant.setMicrophoneEnabled(isMicOn).catch(() => {
      // ignore
    });
  }, [isMicOn, localParticipant]);

  const videoTrackRef =
    cameraTrack && localParticipant
      ? {
          participant: localParticipant,
          publication: cameraTrack,
          source: cameraTrack.source ?? Track.Source.Camera,
        }
      : undefined;

  const errMsg = lastCameraError?.message || lastMicrophoneError?.message;

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#0a0f12' }}>
      {videoTrackRef ? (
        <>
          <VideoTrack
            trackRef={videoTrackRef}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <RoomAudioRenderer />
          {!isCamOn && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(10,15,18,0.85)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>Camera đang tắt</span>
            </div>
          )}
        </>
      ) : errMsg ? (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ff8a8a',
            fontSize: 13,
            padding: '0 16px',
            textAlign: 'center',
            gap: 8,
          }}
        >
          <span>Không mở được camera/mic</span>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{errMsg}</span>
        </div>
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'rgba(255,255,255,0.5)',
            fontSize: 14,
          }}
        >
          Đang kết nối camera...
        </div>
      )}
    </div>
  );
}

// ── Live overlay: mic / cam / fullscreen (same UX as preview) ─────────────
function SellerLiveOverlay({
  styles,
  isMicOn,
  isCamOn,
  micLevel,
  onToggleMic,
  onToggleCam,
  onToggleFullscreen,
}) {
  return (
    <div className={styles.videoOverlay} style={{ pointerEvents: 'auto' }}>
      <div className={styles.overlayTop}>
        <div className={styles.liveBadge}>
          <div className={styles.liveDot} />
          LIVE
        </div>
        <div className={styles.micIndicator}>
          <i
            className={`bi bi-mic${isMicOn ? '-fill' : '-mute'}`}
            style={{ fontSize: 18, lineHeight: 1, color: isMicOn ? undefined : '#ff6b6b' }}
          />
          <div className={styles.micBar}>
            <div className={styles.micBarFill} style={{ width: isMicOn ? `${micLevel}%` : '0%' }} />
          </div>
        </div>
      </div>

      <div className={styles.overlayBottom}>
        <div className={styles.qualityInfo}>
          <div className={styles.qualityItem}>
            <i className={`bi bi-display ${styles.qualityItemIcon}`} />
            720p <span className={styles.qualityValue}>30fps</span>
          </div>
          <div className={styles.qualityItem}>
            <i className={`bi bi-signal ${styles.qualityItemIcon}`} />
            Broadcasting
          </div>
        </div>

        <div className={styles.videoControls}>
          <button
            className={`${styles.vcBtn} ${isMicOn ? styles.vcBtnActive : ''}`}
            onClick={onToggleMic}
            title={isMicOn ? 'Tắt micro' : 'Bật micro'}
            type="button"
          >
            <i className={`bi bi-mic${isMicOn ? '-fill' : '-mute'}`} />
          </button>
          <button
            className={`${styles.vcBtn} ${isCamOn ? styles.vcBtnActive : ''}`}
            onClick={onToggleCam}
            title={isCamOn ? 'Tắt camera' : 'Bật camera'}
            type="button"
          >
            <i
              className={isCamOn ? 'bi bi-camera-video-fill' : 'bi bi-camera-video-off'}
              style={isCamOn ? undefined : { color: '#ff6b6b' }}
            />
          </button>
          <button
            className={styles.vcBtn}
            onClick={onToggleFullscreen}
            title="Toàn màn hình"
            type="button"
          >
            <i className="bi bi-fullscreen" />
          </button>
        </div>
      </div>
    </div>
  );
}

function SellerLiveController({
  token,
  isMicOn,
  isCamOn,
  micLevel,
  styles,
  onToggleMic,
  onToggleCam,
  onToggleFullscreen,
  onRoomConnect,
}) {
  // Create Room upfront — this is what LiveKitRoom uses as its room prop.
  // LiveKitRoom sets up RoomContext.Provider with this instance,
  // so useLocalParticipant() (which calls useEnsureRoom → RoomContext) works in children.
  const roomRef = useRef(
    new Room({
      adaptiveStream: true,
      dynacast: true,
    }),
  );

  const handleConnected = () => {
    onRoomConnect?.(roomRef.current);
  };

  return (
    <div className={styles.videoCard}>
      <div className={styles.videoAspect} style={{ position: 'relative' }}>
        <LiveKitRoom
          serverUrl={import.meta.env.VITE_LIVEKIT_URL}
          token={token}
          connect={true}
          audio={true}
          video={true}
          room={roomRef.current}
          onConnected={handleConnected}
          onDisconnected={() => {
            onRoomConnect?.(null);
          }}
          onError={() => {
            // ignore
          }}
          style={{ height: '100%', width: '100%' }}
        >
          <SellerLiveView isMicOn={isMicOn} isCamOn={isCamOn} />
        </LiveKitRoom>

        <SellerLiveOverlay
          styles={styles}
          isMicOn={isMicOn}
          isCamOn={isCamOn}
          micLevel={micLevel}
          onToggleMic={onToggleMic}
          onToggleCam={onToggleCam}
          onToggleFullscreen={onToggleFullscreen}
        />
      </div>
    </div>
  );
}

// ── Preview mode: local camera only, no LiveKit ───────────────────────────
function CameraPreviewView({ videoRef, isCamOn, isMicOn, micLevel, styles, onToggleMic, onToggleCam, onToggleFullscreen }) {
  const [streamError, setStreamError] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);
  const streamRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    async function startPreview() {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
          audio: true,
        });
        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        setStreamError(null);
        setCameraReady(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        if (!mounted) {
          return;
        }
        setStreamError(
          err.name === 'NotAllowedError'
            ? 'Vui lòng cho phép truy cập camera và microphone'
            : 'Không thể truy cập camera/microphone',
        );
        setCameraReady(false);
      }
    }

    startPreview();

    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!streamRef.current) {
      return;
    }
    streamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = isMicOn;
    });
  }, [isMicOn]);

  useEffect(() => {
    if (!streamRef.current) {
      return;
    }
    streamRef.current.getVideoTracks().forEach((track) => {
      track.enabled = isCamOn;
    });
  }, [isCamOn]);

  return (
    <div className={styles.videoCard}>
      <div className={styles.videoAspect}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={styles.videoImage}
          style={{
            display: streamError || !cameraReady ? 'none' : 'block',
            opacity: isCamOn ? 1 : 0,
            transition: 'opacity 0.3s',
          }}
        />

        {!isCamOn && !streamError && (
          <div className={styles.videoOverlay} style={{ opacity: 1, background: 'rgba(10,15,18,0.85)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, color: 'rgba(255,255,255,0.5)' }}>
                <i className="bi bi-camera-video-off" />
              </div>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, margin: 0 }}>
                Camera đang tắt — bật để xem trước
              </p>
            </div>
          </div>
        )}

        {streamError && (
          <div className={styles.videoOverlay} style={{ opacity: 1, background: 'rgba(10,15,18,0.85)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12, padding: '0 24px', textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,100,100,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: '#ff6b6b' }}>
                <i className="bi bi-camera-video-off" />
              </div>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, margin: 0, lineHeight: 1.5 }}>
                {streamError}
              </p>
              <button
                onClick={() => {
                  navigator.mediaDevices
                    .getUserMedia({ video: true, audio: true })
                    .then((s) => {
                      if (videoRef.current) {
                        videoRef.current.srcObject = s;
                      }
                    })
                    .catch(() => {});
                }}
                style={{ marginTop: 4, padding: '8px 20px', borderRadius: 8, border: 'none', background: 'var(--ls-primary)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                Thử lại
              </button>
            </div>
          </div>
        )}

        {!streamError && (
          <div className={styles.videoOverlay}>
            <div className={styles.overlayTop}>
              <div className={styles.liveBadge}>
                <div className={styles.liveDot} />
                Preview
              </div>
              <div className={styles.micIndicator}>
                <i
                  className={`bi bi-mic${isMicOn ? '-fill' : '-mute'}`}
                  style={{ fontSize: 18, lineHeight: 1, color: isMicOn ? undefined : '#ff6b6b' }}
                />
                <div className={styles.micBar}>
                  <div className={styles.micBarFill} style={{ width: isMicOn ? `${micLevel}%` : '0%' }} />
                </div>
              </div>
            </div>

            <div className={styles.overlayBottom}>
              <div className={styles.qualityInfo}>
                <div className={styles.qualityItem}>
                  <i className={`bi bi-display ${styles.qualityItemIcon}`} />
                  720p <span className={styles.qualityValue}>30fps</span>
                </div>
                <div className={styles.qualityItem}>
                  <i className={`bi bi-signal ${styles.qualityItemIcon}`} />
                  Ready
                </div>
              </div>

              <div className={styles.videoControls}>
                <button
                  className={`${styles.vcBtn} ${isMicOn ? styles.vcBtnActive : ''}`}
                  onClick={onToggleMic}
                  title={isMicOn ? 'Tắt micro' : 'Bật micro'}
                  type="button"
                >
                  <i className={`bi bi-mic${isMicOn ? '-fill' : '-mute'}`} />
                </button>
                <button
                  className={`${styles.vcBtn} ${isCamOn ? styles.vcBtnActive : ''}`}
                  onClick={onToggleCam}
                  title={isCamOn ? 'Tắt camera' : 'Bật camera'}
                  type="button"
                >
                  <i
                    className={isCamOn ? 'bi bi-camera-video-fill' : 'bi bi-camera-video-off'}
                    style={isCamOn ? undefined : { color: '#ff6b6b' }}
                  />
                </button>
                <button className={styles.vcBtn} onClick={onToggleFullscreen} title="Toàn màn hình" type="button">
                  <i className="bi bi-fullscreen" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VideoPreview({
  styles = {},
  isLive,
  token,
  micLevel = 66,
  isMicOn = true,
  isCamOn = true,
  onToggleMic,
  onToggleCam,
  onToggleFullscreen,
  onRoomConnect,
}) {
  const videoRef = useRef(null);

  if (isLive && token) {
    return (
      <SellerLiveController
        token={token}
        isMicOn={isMicOn}
        isCamOn={isCamOn}
        micLevel={micLevel}
        styles={styles}
        onToggleMic={onToggleMic}
        onToggleCam={onToggleCam}
        onToggleFullscreen={onToggleFullscreen}
        onRoomConnect={onRoomConnect}
      />
    );
  }

  return (
    <CameraPreviewView
      videoRef={videoRef}
      isCamOn={isCamOn}
      isMicOn={isMicOn}
      micLevel={micLevel}
      styles={styles}
      onToggleMic={onToggleMic}
      onToggleCam={onToggleCam}
      onToggleFullscreen={onToggleFullscreen}
    />
  );
}
