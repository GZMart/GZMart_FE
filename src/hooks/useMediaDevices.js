import { useCallback, useEffect, useState } from 'react';

function fallbackLabel(kind) {
  if (kind === 'audioinput') {
    return 'Microphone';
  }
  if (kind === 'videoinput') {
    return 'Camera';
  }
  return 'Device';
}

function pickDevices(kind, devices) {
  return devices
    .filter((d) => d.kind === kind && d.deviceId)
    .map((d) => ({
      deviceId: d.deviceId,
      label: d.label?.trim() || fallbackLabel(kind),
    }));
}

export function useMediaDevices() {
  const [audioInputs, setAudioInputs] = useState([]);
  const [videoInputs, setVideoInputs] = useState([]);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      setAudioInputs(pickDevices('audioinput', devices));
      setVideoInputs(pickDevices('videoinput', devices));
      setError(null);
    } catch (e) {
      setError(e?.message || 'enumerateDevices failed');
    }
  }, []);

  const requestPermission = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
    stream.getTracks().forEach((t) => t.stop());
    await refresh();
  }, [refresh]);

  useEffect(() => {
    refresh();
    navigator.mediaDevices?.addEventListener?.('devicechange', refresh);
    return () => navigator.mediaDevices?.removeEventListener?.('devicechange', refresh);
  }, [refresh]);

  return { audioInputs, videoInputs, error, refresh, requestPermission };
}
