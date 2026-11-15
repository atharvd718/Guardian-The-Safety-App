import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Phone, PhoneOff, PhoneIncoming, Volume2, MicOff, User } from 'lucide-react';

interface FakeCallViewProps {
  onBack: () => void;
}

const CALLER_PRESETS = [
  { name: 'Mom', subtitle: 'Mobile · India', script: '"Hey, I see your live location on my phone—are you almost at the main gate? Stay on the line with me until you get inside."' },
  { name: 'Dad', subtitle: 'Mobile · Speed Dial', script: '"Hello beta, I\'m waiting right outside the corner in the car. Tell me which lane you\'re walking out of."' },
  { name: 'Priya (Sister)', subtitle: 'WhatsApp Audio', script: '"Hey! Don\'t hang up—I\'m tracking your cab route right now. Share the driver\'s plate if you haven\'t already."' },
  { name: 'Control Desk', subtitle: 'Verified Helpline', script: '"Guardian dispatch check-in: we have your GPS coordinates active. Stay on this call while moving toward a lit public place."' },
];

export const FakeCallView: React.FC<FakeCallViewProps> = ({ onBack }) => {
  const [callerName, setCallerName] = useState('Mom');
  const [callerSub, setCallerSub] = useState('Mobile · India');
  const [scriptLine, setScriptLine] = useState(CALLER_PRESETS[0].script);
  const [delaySeconds, setDelaySeconds] = useState<number>(0);

  const [callState, setCallState] = useState<'setup' | 'countdown' | 'ringing' | 'connected'>('setup');
  const [countdownLeft, setCountdownLeft] = useState(0);
  const [callSeconds, setCallSeconds] = useState(0);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [muted, setMuted] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const ringIntervalRef = useRef<number | null>(null);

  const stopRingtone = useCallback(() => {
    if (ringIntervalRef.current !== null) {
      window.clearInterval(ringIntervalRef.current);
      ringIntervalRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    if ('vibrate' in navigator) {
      navigator.vibrate(0);
    }
  }, []);

  const startRingtone = useCallback(() => {
    stopRingtone();
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const playBurst = () => {
        if (!ctx || ctx.state === 'closed') return;
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        osc1.frequency.setValueAtTime(440, ctx.currentTime);
        osc2.frequency.setValueAtTime(480, ctx.currentTime);
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9);
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        osc1.start();
        osc2.start();
        osc1.stop(ctx.currentTime + 0.9);
        osc2.stop(ctx.currentTime + 0.9);
        if ('vibrate' in navigator) {
          navigator.vibrate([400, 200, 400]);
        }
      };

      playBurst();
      ringIntervalRef.current = window.setInterval(playBurst, 2200);
    } catch {
      // Ignore if audio context blocked
    }
  }, [stopRingtone]);

  useEffect(() => {
    return () => stopRingtone();
  }, [stopRingtone]);

  // Countdown before ring
  useEffect(() => {
    if (callState !== 'countdown') return;
    if (countdownLeft <= 0) {
      setCallState('ringing');
      startRingtone();
      return;
    }
    const timer = window.setTimeout(() => setCountdownLeft((prev) => prev - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [callState, countdownLeft, startRingtone]);

  // Active call duration timer
  useEffect(() => {
    if (callState !== 'connected') return;
    const id = window.setInterval(() => setCallSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [callState]);

  const triggerCall = () => {
    if (delaySeconds === 0) {
      setCallState('ringing');
      startRingtone();
    } else {
      setCountdownLeft(delaySeconds);
      setCallState('countdown');
    }
  };

  const acceptCall = () => {
    stopRingtone();
    setCallSeconds(0);
    setCallState('connected');
  };

  const endCall = () => {
    stopRingtone();
    setCallState('setup');
    setCallSeconds(0);
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (callState === 'ringing' || callState === 'connected') {
    return (
      <div className="min-h-screen bg-[#15111A] text-white flex flex-col justify-between p-8 max-w-md mx-auto">
        <div className="pt-10 text-center space-y-4">
          <div className="w-24 h-24 rounded-full bg-rose-500/20 border border-rose-300/30 flex items-center justify-center mx-auto">
            <User className="w-11 h-11 text-rose-200" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-rose-200/80 font-semibold">
              {callState === 'ringing' ? 'Incoming Call' : 'Connected'}
            </p>
            <h2 className="text-3xl font-serif font-bold mt-1">{callerName}</h2>
            <p className="text-sm text-white/70 mt-1 tabular-nums">
              {callState === 'ringing' ? callerSub : formatDuration(callSeconds)}
            </p>
          </div>
        </div>

        {callState === 'connected' && (
          <div className="bg-white/10 border border-white/15 rounded-2xl p-4 space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-rose-200">
              Suggested Conversation Cue
            </p>
            <p className="text-sm leading-relaxed text-white/90">{scriptLine}</p>
          </div>
        )}

        <div className="pb-8 space-y-6">
          {callState === 'connected' && (
            <div className="flex items-center justify-center gap-6">
              <button
                type="button"
                onClick={() => setMuted((m) => !m)}
                className={`w-16 h-16 rounded-full flex flex-col items-center justify-center gap-1 text-[10px] font-semibold transition-colors ${
                  muted ? 'bg-white text-slate-900' : 'bg-white/15 text-white'
                }`}
              >
                <MicOff className="w-5 h-5" />
                <span>Mute</span>
              </button>
              <button
                type="button"
                onClick={() => setSpeakerOn((s) => !s)}
                className={`w-16 h-16 rounded-full flex flex-col items-center justify-center gap-1 text-[10px] font-semibold transition-colors ${
                  speakerOn ? 'bg-white text-slate-900' : 'bg-white/15 text-white'
                }`}
              >
                <Volume2 className="w-5 h-5" />
                <span>Speaker</span>
              </button>
            </div>
          )}

          {callState === 'ringing' ? (
            <div className="flex items-center justify-around">
              <button
                type="button"
                onClick={endCall}
                className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center shadow-lg"
                aria-label="Decline call"
              >
                <PhoneOff className="w-7 h-7" />
              </button>
              <button
                type="button"
                onClick={acceptCall}
                className="w-16 h-16 rounded-full bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center shadow-lg"
                aria-label="Accept call"
              >
                <Phone className="w-7 h-7" />
              </button>
            </div>
          ) : (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={endCall}
                className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center shadow-lg"
                aria-label="End call"
              >
                <PhoneOff className="w-7 h-7" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)] flex flex-col max-w-md mx-auto">
      <header className="sticky top-0 z-20 bg-[var(--color-surface)] backdrop-blur-md border-b border-[var(--color-border)] px-4 py-3 flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="min-h-[44px] min-w-[44px] -ml-2 flex items-center justify-center rounded-full hover:bg-black/5"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-serif font-bold">Escape Call (Fake Call)</h1>
      </header>

      <div className="flex-1 p-5 space-y-5">
        <div className="bg-[var(--color-surface-elevated)] rounded-2xl p-4 border border-[var(--color-border)] space-y-1.5">
          <h2 className="text-sm font-bold">Discreet Exit Strategy</h2>
          <p className="text-xs text-[var(--color-muted)] leading-relaxed">
            Trigger a realistic incoming phone call with ringtone and on-screen cues to safely
            excuse yourself from uncomfortable rides or conversations.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-[var(--color-muted)] block">
            Select Caller Preset
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            {CALLER_PRESETS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => {
                  setCallerName(preset.name);
                  setCallerSub(preset.subtitle);
                  setScriptLine(preset.script);
                }}
                className={`min-h-[48px] p-3 rounded-xl border text-left transition-colors ${
                  callerName === preset.name
                    ? 'bg-[var(--color-surface-tint)] border-[var(--color-primary)] text-[var(--color-primary)]'
                    : 'bg-[var(--color-surface-elevated)] border-[var(--color-border)] text-[var(--color-foreground)]'
                }`}
              >
                <span className="text-xs font-bold block">{preset.name}</span>
                <span className="text-[11px] text-[var(--color-muted)]">{preset.subtitle}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[var(--color-muted)] block">
            Custom Caller Name
          </label>
          <input
            type="text"
            value={callerName}
            onChange={(e) => setCallerName(e.target.value)}
            className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[var(--color-surface-elevated)] border border-[var(--color-border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-[var(--color-muted)] block">
            Ring Delay
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Instant', val: 0 },
              { label: '5 sec', val: 5 },
              { label: '15 sec', val: 15 },
            ].map((opt) => (
              <button
                key={opt.val}
                type="button"
                onClick={() => setDelaySeconds(opt.val)}
                className={`min-h-[44px] rounded-xl text-xs font-bold border transition-colors ${
                  delaySeconds === opt.val
                    ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                    : 'bg-[var(--color-surface-elevated)] text-[var(--color-foreground)] border-[var(--color-border)]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {callState === 'countdown' ? (
          <div className="bg-[var(--color-surface-tint)] border border-[var(--color-primary)] rounded-2xl p-5 text-center space-y-3">
            <p className="text-xs font-bold text-[var(--color-primary)]">
              Call arriving in {countdownLeft}s...
            </p>
            <button
              type="button"
              onClick={() => setCallState('setup')}
              className="min-h-[40px] px-4 rounded-xl bg-[var(--color-surface-elevated)] border border-[var(--color-border)] text-xs font-bold"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={triggerCall}
            className="w-full min-h-[52px] rounded-2xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-active)] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-colors"
          >
            <PhoneIncoming className="w-5 h-5" />
            <span>Start Escape Call</span>
          </button>
        )}
      </div>
    </div>
  );
};
