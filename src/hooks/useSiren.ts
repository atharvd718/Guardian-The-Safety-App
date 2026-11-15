import { useEffect, useRef, useState, useCallback } from 'react';

export function useSiren() {
  const [isPlaying, setIsPlaying] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const intervalRef = useRef<number | null>(null);

  const stopSiren = useCallback(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    try {
      oscRef.current?.stop();
      oscRef.current?.disconnect();
    } catch {
      // ignore
    }
    oscRef.current = null;
    if (ctxRef.current) {
      ctxRef.current.close().catch(() => {});
      ctxRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const startSiren = useCallback(() => {
    if (isPlaying) {
      stopSiren();
      return;
    }
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(720, ctx.currentTime);
      gain.gain.setValueAtTime(0.35, ctx.currentTime);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();

      let high = false;
      const id = window.setInterval(() => {
        if (!ctx || ctx.state === 'closed') return;
        high = !high;
        osc.frequency.setTargetAtTime(high ? 1280 : 680, ctx.currentTime, 0.08);
      }, 320);

      ctxRef.current = ctx;
      oscRef.current = osc;
      intervalRef.current = id;
      setIsPlaying(true);

      if ('vibrate' in navigator) {
        navigator.vibrate([300, 150, 300, 150, 300]);
      }
    } catch {
      setIsPlaying(false);
    }
  }, [isPlaying, stopSiren]);

  useEffect(() => {
    return () => {
      stopSiren();
    };
  }, [stopSiren]);

  return { isSirenActive: isPlaying, toggleSiren: startSiren, stopSiren };
}
