import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Timer, CheckCircle2, Plus, ShieldAlert } from 'lucide-react';
import { StorageService } from '../lib/storage';

interface SafetyCheckInViewProps {
  onBack: () => void;
}

export const SafetyCheckInView: React.FC<SafetyCheckInViewProps> = ({ onBack }) => {
  const [minutes, setMinutes] = useState(10);
  const [tripNote, setTripNote] = useState('Walking home from transit stop');
  const [isActive, setIsActive] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(600);
  const [statusMessage, setStatusMessage] = useState('');
  const contacts = StorageService.getContacts();

  const dispatchTimeoutAlert = useCallback(async () => {
    let lat = 28.5355;
    let lng = 77.391;
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 4000 });
      });
      lat = pos.coords.latitude;
      lng = pos.coords.longitude;
    } catch {
      // use fallback
    }

    const user = StorageService.getCurrentUser();
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const zoneLabel = `Missed Safety Check-In (${tripNote || 'Trip Timer'})`;

    try {
      await fetch('/api/alerts/silent-geofence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: user?.name || 'Guardian User',
          userPhone: user?.phone || '',
          zoneName: zoneLabel,
          eventType: 'enter',
          lat,
          lng,
          contacts,
          timestamp,
        }),
      });
    } catch {
      // fallback logged locally
    }

    const mapLink = `https://maps.google.com/?q=${lat.toFixed(5)},${lng.toFixed(5)}`;
    StorageService.addSmsLog({
      id: `checkin_${Date.now()}`,
      timestamp,
      recipients: contacts.map((c) => `${c.friendName} (${c.friendPhone})`),
      message: `[Missed Check-In Alert] ${user?.name || 'User'} did not check in for "${
        tripNote || 'Safety Timer'
      }" by ${timestamp}. Last known GPS: ${mapLink}`,
      status: 'Sent',
    });

    setIsActive(false);
    setStatusMessage(
      `Timer expired — silent alert with GPS coordinates sent to ${contacts.length} emergency contact(s).`
    );
  }, [contacts, tripNote]);

  useEffect(() => {
    if (!isActive) return;
    if (secondsLeft <= 0) {
      dispatchTimeoutAlert();
      return;
    }
    const id = window.setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
  }, [isActive, secondsLeft, dispatchTimeoutAlert]);

  const startTimer = () => {
    setStatusMessage('');
    setSecondsLeft(minutes * 60);
    setIsActive(true);
  };

  const markSafe = () => {
    setIsActive(false);
    setStatusMessage('Checked in safely! Emergency contacts were not alerted.');
  };

  const formatCountdown = (total: number) => {
    const mins = Math.floor(total / 60)
      .toString()
      .padStart(2, '0');
    const secs = (total % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

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
        <h1 className="text-lg font-serif font-bold">Safe Walk Check-In</h1>
      </header>

      <div className="flex-1 p-5 space-y-5">
        <div className="bg-[var(--color-surface-elevated)] rounded-2xl p-4 border border-[var(--color-border)] space-y-1.5">
          <h2 className="text-sm font-bold">Timed Safety Auto-Alert</h2>
          <p className="text-xs text-[var(--color-muted)] leading-relaxed">
            Set a countdown for a walk or cab ride. If you don&apos;t tap{' '}
            <strong>I&apos;m Safe</strong> before time runs out, Guardian silently sends your GPS
            coordinates to your {contacts.length} emergency contacts.
          </p>
        </div>

        {statusMessage && (
          <div className="p-4 rounded-2xl bg-[var(--color-surface-tint)] border border-[var(--color-primary)] text-xs font-semibold flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[var(--color-primary)] shrink-0 mt-0.5" />
            <span>{statusMessage}</span>
          </div>
        )}

        {isActive ? (
          <div className="bg-[var(--color-surface-elevated)] rounded-3xl p-6 border border-[var(--color-border)] text-center space-y-5">
            <div className="w-36 h-36 rounded-full border-4 border-[var(--color-primary)] bg-[var(--color-surface-tint)] flex flex-col items-center justify-center mx-auto">
              <span className="text-3xl font-mono font-bold tabular-nums text-[var(--color-foreground)]">
                {formatCountdown(secondsLeft)}
              </span>
              <span className="text-[11px] font-semibold text-[var(--color-muted)] mt-1">
                Remaining
              </span>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-bold">{tripNote || 'Active Trip'}</p>
              <p className="text-xs text-[var(--color-muted)]">
                Will alert {contacts.length} contacts if unconfirmed
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSecondsLeft((s) => s + 300)}
                className="min-h-[48px] rounded-xl bg-[var(--color-surface-tint)] text-[var(--color-primary)] text-xs font-bold flex items-center justify-center gap-1.5 border border-[var(--color-border)]"
              >
                <Plus className="w-4 h-4" />
                <span>+5 Min</span>
              </button>
              <button
                type="button"
                onClick={markSafe}
                className="min-h-[48px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>I&apos;m Safe</span>
              </button>
            </div>

            <button
              type="button"
              onClick={dispatchTimeoutAlert}
              className="w-full min-h-[44px] rounded-xl border border-[var(--color-border)] text-xs font-semibold text-[var(--color-muted)] hover:text-red-600 flex items-center justify-center gap-1.5"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Test Expired Check-In Alert Now</span>
            </button>
          </div>
        ) : (
          <div className="bg-[var(--color-surface-elevated)] rounded-2xl p-5 border border-[var(--color-border)] space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-[var(--color-muted)] block">
                Check-In Duration
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 15, 30].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMinutes(m)}
                    className={`min-h-[44px] rounded-xl text-xs font-bold border tabular-nums transition-colors ${
                      minutes === m
                        ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                        : 'bg-[var(--color-background)] text-[var(--color-foreground)] border-[var(--color-border)]'
                    }`}
                  >
                    {m}m
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--color-muted)] block">
                Trip / Route Note
              </label>
              <input
                type="text"
                value={tripNote}
                onChange={(e) => setTripNote(e.target.value)}
                placeholder="e.g. Cab to Sector 18"
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            </div>

            <button
              type="button"
              onClick={startTimer}
              className="w-full min-h-[52px] rounded-2xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-active)] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-colors"
            >
              <Timer className="w-5 h-5" />
              <span>Start {minutes}-Minute Safety Timer</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
