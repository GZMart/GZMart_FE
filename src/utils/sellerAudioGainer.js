import { Track } from 'livekit-client';

/**
 * Pipes the local mic through Web Audio (gain) and replaces the published track.
 * Call attach() again after device switch so the graph binds to the new MediaStreamTrack.
 */
export function createMicGainController() {
  let ctx = null;
  let gainNode = null;
  let analyser = null;
  let rafId = null;

  function stopMeter() {
    if (rafId != null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  function startMeter(onFrame) {
    stopMeter();
    function tick() {
      if (!analyser || !onFrame) {
        return;
      }
      const buf = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(buf);
      let s = 0;
      for (let i = 0; i < buf.length; i += 1) {
        s += buf[i];
      }
      const avg = s / buf.length / 255;
      onFrame(Math.min(100, avg * 320));
      rafId = requestAnimationFrame(tick);
    }
    tick();
  }

  async function dispose() {
    stopMeter();
    if (ctx) {
      await ctx.close();
      ctx = null;
    }
    gainNode = null;
    analyser = null;
  }

  /**
   * @param {import('livekit-client').LocalAudioTrack} localAudioTrack
   */
  async function attach(localAudioTrack, gainValue, onFrame) {
    if (!localAudioTrack || localAudioTrack.kind !== Track.Kind.Audio) {
      return;
    }
    const raw = localAudioTrack.mediaStreamTrack;
    if (!raw || raw.readyState === 'ended') {
      return;
    }

    const oldCtx = ctx;
    ctx = new AudioContext();
    const source = ctx.createMediaStreamSource(new MediaStream([raw]));
    gainNode = ctx.createGain();
    gainNode.gain.value = gainValue;
    analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.35;
    const dest = ctx.createMediaStreamDestination();
    source.connect(gainNode);
    gainNode.connect(analyser);
    gainNode.connect(dest);
    const out = dest.stream.getAudioTracks()[0];
    await localAudioTrack.replaceTrack(out, { userProvidedTrack: true });

    if (oldCtx) {
      await oldCtx.close();
    }

    startMeter(onFrame);
  }

  function setGain(value) {
    if (gainNode) {
      gainNode.gain.value = value;
    }
  }

  return { attach, setGain, startMeter, stopMeter, dispose };
}
