import { useEffect, useRef, useState, useCallback, forwardRef, useMemo } from 'react';
import { LiveKitRoom, VideoTrack, RoomAudioRenderer, useLocalParticipant, useRoomContext } from '@livekit/components-react';
import { Room, Track } from 'livekit-client';
import '@livekit/components-styles';
import { createMicGainController } from '@utils/sellerAudioGainer';

/* eslint-disable react/prop-types */

function MicGainSliderRow({ value, onChange, disabled, styles }) {
  return (
    <div className={styles.micGainRow}>
      <input
        type="range"
        className={styles.micGainSlider}
        min={0}
        max={100}
        value={Math.round(value * 100)}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        disabled={disabled}
        aria-label="Âm lượng micro"
        title="Âm lượng micro"
      />
    </div>
  );
}

// ── Thin wrapper inside LiveKitRoom to grab Room from context ───────────────
function SellerLiveView({
  isMicOn,
  isCamOn,
  micDeviceId,
  camDeviceId,
  micGain,
  onMeterFrame,
}) {
  const { localParticipant, cameraTrack, lastCameraError, lastMicrophoneError } = useLocalParticipant();
  const room = useRoomContext();
  const gainCtrlRef = useRef(null);
  const micGainRef = useRef(micGain);
  const isMicOnRef = useRef(isMicOn);
  micGainRef.current = micGain;
  isMicOnRef.current = isMicOn;

  useEffect(() => {
    if (!localParticipant) {
      return;
    }
    localParticipant.setCameraEnabled(isCamOn).catch(() => {
      /* ignore */
    });
  }, [isCamOn, localParticipant]);

  useEffect(() => {
    if (!localParticipant) {
      return;
    }
    localParticipant.setMicrophoneEnabled(isMicOn).catch(() => {
      /* ignore */
    });
  }, [isMicOn, localParticipant]);

  useEffect(() => {
    if (!room || !micDeviceId) {
      return;
    }
    room.switchActiveDevice('audioinput', micDeviceId).catch(() => {
      /* ignore */
    });
  }, [room, micDeviceId]);

  useEffect(() => {
    if (!room || !camDeviceId) {
      return;
    }
    room.switchActiveDevice('videoinput', camDeviceId).catch(() => {
      /* ignore */
    });
  }, [room, camDeviceId]);

  useEffect(() => {
    const ctrl = gainCtrlRef.current;
    if (!ctrl) {
      return;
    }
    ctrl.setGain(isMicOn ? micGain : 0);
  }, [micGain, isMicOn]);

  useEffect(() => {
    if (!localParticipant) {
      return undefined;
    }

    if (!gainCtrlRef.current) {
      gainCtrlRef.current = createMicGainController();
    }
    const controller = gainCtrlRef.current;
    let cancelled = false;
    let intervalId;
    let attachInFlight = false;

    const tryAttach = async () => {
      if (cancelled || attachInFlight) {
        return false;
      }
      const pub = localParticipant.getTrackPublication(Track.Source.Microphone);
      const t = pub?.track;
      if (!t || t.kind !== Track.Kind.Audio) {
        return false;
      }
      attachInFlight = true;
      try {
        const g = isMicOnRef.current ? micGainRef.current : 0;
        await controller.attach(t, g, (lvl) => {
          if (!cancelled) {
            onMeterFrame?.(isMicOnRef.current ? lvl : 0);
          }
        });
        return true;
      } catch {
        return false;
      } finally {
        attachInFlight = false;
      }
    };

    tryAttach().catch(() => {});

    intervalId = setInterval(() => {
      tryAttach().then((ok) => {
        if (ok && intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
      });
    }, 300);

    return () => {
      cancelled = true;
      if (intervalId) {
        clearInterval(intervalId);
      }
      controller.dispose().catch(() => {});
      gainCtrlRef.current = null;
    };
  }, [localParticipant, micDeviceId, onMeterFrame]);

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

// ── Live overlay: mic / cam / fullscreen ───────────────────────────────────
function SellerLiveOverlay({
  styles,
  isMicOn,
  isCamOn,
  meterLevel,
  micGain,
  onMicGainChange,
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
            <div className={styles.micBarFill} style={{ width: isMicOn ? `${meterLevel}%` : '0%' }} />
          </div>
        </div>
      </div>

      <div className={styles.overlayFooter}>
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

          <div className={styles.videoControlsRow}>
            <MicGainSliderRow
              value={micGain}
              onChange={onMicGainChange}
              disabled={!isMicOn}
              styles={styles}
            />
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
      </div>
    </div>
  );
}

function buildCaptureConstraints(micDeviceId, camDeviceId) {
  const videoConstraints = {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30 },
  };
  if (camDeviceId) {
    videoConstraints.deviceId = { exact: camDeviceId };
  }
  const audioConstraints = {};
  if (micDeviceId) {
    audioConstraints.deviceId = { exact: micDeviceId };
  }
  const audio =
    Object.keys(audioConstraints).length > 0 ? audioConstraints : true;
  return { video: videoConstraints, audio };
}

const SellerLiveController = forwardRef((
  {
    token,
    isMicOn,
    isCamOn,
    micDeviceId,
    camDeviceId,
    micGain,
    onMicGainChange,
    styles,
    onToggleMic,
    onToggleCam,
    onToggleFullscreen,
    onRoomConnect,
  },
  ref,
) => {
  const [liveMeter, setLiveMeter] = useState(0);
  const onMeterFrame = useCallback((v) => {
    setLiveMeter(v);
  }, []);

  const roomRef = useRef(
    new Room({
      adaptiveStream: true,
      dynacast: true,
    }),
  );

  const handleConnected = useCallback(() => {
    onRoomConnect?.(roomRef.current);
  }, [onRoomConnect]);

  const handleDisconnected = useCallback(() => {
    onRoomConnect?.(null);
  }, [onRoomConnect]);

  /** LiveKitRoom re-runs connect when callback deps change; inline arrows spam room.connect(). */
  const handleLiveKitError = useCallback(() => {
    /* ignore */
  }, []);

  const audioOpts = useMemo(
    () => (micDeviceId ? { deviceId: micDeviceId } : true),
    [micDeviceId],
  );

  const videoOpts = useMemo(
    () =>
      camDeviceId
        ? {
            deviceId: camDeviceId,
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 },
          }
        : {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 },
          },
    [camDeviceId],
  );

  return (
    <div ref={ref} className={styles.videoCard}>
      <div className={styles.videoAspect} style={{ position: 'relative' }}>
        <LiveKitRoom
          serverUrl={import.meta.env.VITE_LIVEKIT_URL}
          token={token}
          connect={true}
          audio={audioOpts}
          video={videoOpts}
          room={roomRef.current}
          onConnected={handleConnected}
          onDisconnected={handleDisconnected}
          onError={handleLiveKitError}
          style={{ height: '100%', width: '100%' }}
        >
          <SellerLiveView
            isMicOn={isMicOn}
            isCamOn={isCamOn}
            micDeviceId={micDeviceId}
            camDeviceId={camDeviceId}
            micGain={micGain}
            onMeterFrame={onMeterFrame}
          />
        </LiveKitRoom>

        <SellerLiveOverlay
          styles={styles}
          isMicOn={isMicOn}
          isCamOn={isCamOn}
          meterLevel={liveMeter}
          micGain={micGain}
          onMicGainChange={onMicGainChange}
          onToggleMic={onToggleMic}
          onToggleCam={onToggleCam}
          onToggleFullscreen={onToggleFullscreen}
        />
      </div>
    </div>
  );
});

// ── Preview mode: local camera only, no LiveKit ───────────────────────────
const CameraPreviewView = forwardRef((
  {
    videoRef,
    isCamOn,
    isMicOn,
    micDeviceId,
    camDeviceId,
    micGain,
    onMicGainChange,
    styles,
    onToggleMic,
    onToggleCam,
    onToggleFullscreen,
  },
  ref,
) => {
  const [streamError, setStreamError] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);
  const streamRef = useRef(null);
  const previewMeterRef = useRef(0);
  const [, setPreviewMeterTick] = useState(0);
  const previewGainRef = useRef(null);
  const isMicOnMeterRef = useRef(isMicOn);
  const micGainRefPreview = useRef(micGain);

  isMicOnMeterRef.current = isMicOn;
  micGainRefPreview.current = micGain;

  useEffect(() => {
    if (previewGainRef.current) {
      previewGainRef.current.gain.value = isMicOn ? micGain : 0;
    }
  }, [isMicOn, micGain]);

  useEffect(() => {
    let mounted = true;
    let meterRaf;
    let previewCtx;

    async function startPreview() {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      streamRef.current = null;
      previewGainRef.current = null;
      setCameraReady(false);

      try {
        const { video, audio } = buildCaptureConstraints(micDeviceId, camDeviceId);
        const stream = await navigator.mediaDevices.getUserMedia({ video, audio });
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

        const a = stream.getAudioTracks()[0];
        if (a) {
          previewCtx = new AudioContext();
          const src = previewCtx.createMediaStreamSource(new MediaStream([a]));
          const gain = previewCtx.createGain();
          previewGainRef.current = gain;
          gain.gain.value = isMicOnMeterRef.current ? micGainRefPreview.current : 0;
          const an = previewCtx.createAnalyser();
          an.fftSize = 512;
          src.connect(gain);
          gain.connect(an);
          const data = new Uint8Array(an.frequencyBinCount);
          const tickMeter = () => {
            if (!mounted || !an) {
              return;
            }
            an.getByteFrequencyData(data);
            let s = 0;
            for (let i = 0; i < data.length; i += 1) {
              s += data[i];
            }
            const avg = s / data.length / 255;
            previewMeterRef.current = isMicOnMeterRef.current ? Math.min(100, avg * 320) : 0;
            setPreviewMeterTick((x) => x + 1);
            meterRaf = requestAnimationFrame(tickMeter);
          };
          tickMeter();
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
      if (meterRaf) {
        cancelAnimationFrame(meterRaf);
      }
      previewGainRef.current = null;
      if (previewCtx) {
        previewCtx.close().catch(() => {});
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
    /* Only re-acquire getUserMedia when device selection changes; micGain uses previewGainRef. */
    // eslint-disable-next-line react-hooks/exhaustive-deps -- omit micGain, videoRef (stable)
  }, [micDeviceId, camDeviceId]);

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

  const displayMeter = cameraReady ? previewMeterRef.current : 0;

  return (
    <div ref={ref} className={styles.videoCard}>
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
                type="button"
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
                  <div className={styles.micBarFill} style={{ width: isMicOn ? `${displayMeter}%` : '0%' }} />
                </div>
              </div>
            </div>

            <div className={styles.overlayFooter}>
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

                <div className={styles.videoControlsRow}>
                  <MicGainSliderRow
                    value={micGain}
                    onChange={onMicGainChange}
                    disabled={!isMicOn}
                    styles={styles}
                  />
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

const VideoPreview = forwardRef((
  {
    styles = {},
    isLive,
    token,
    micDeviceId,
    camDeviceId,
    micGain = 1,
    onMicGainChange,
    isMicOn = true,
    isCamOn = true,
    onToggleMic,
    onToggleCam,
    onToggleFullscreen,
    onRoomConnect,
  },
  ref,
) => {
  const videoRef = useRef(null);

  if (isLive && token) {
    return (
      <SellerLiveController
        ref={ref}
        token={token}
        isMicOn={isMicOn}
        isCamOn={isCamOn}
        micDeviceId={micDeviceId}
        camDeviceId={camDeviceId}
        micGain={micGain}
        onMicGainChange={onMicGainChange}
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
      ref={ref}
      videoRef={videoRef}
      isCamOn={isCamOn}
      isMicOn={isMicOn}
      micDeviceId={micDeviceId}
      camDeviceId={camDeviceId}
      micGain={micGain}
      onMicGainChange={onMicGainChange}
      styles={styles}
      onToggleMic={onToggleMic}
      onToggleCam={onToggleCam}
      onToggleFullscreen={onToggleFullscreen}
    />
  );
});

export default VideoPreview;
