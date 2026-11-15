import React, { useState } from 'react';
import { Download, Share, PlusSquare, WifiOff, X } from 'lucide-react';
import { useOnlineStatus, usePWAInstall } from '../hooks/usePWAInstall';
import { GuardianLogo } from './GuardianLogo';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (!accepted) return;
    } else {
      setShowGuide(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={`min-h-[40px] flex items-center justify-center gap-1.5 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-active)] text-white text-xs font-bold transition-colors whitespace-nowrap shrink-0 shadow-sm ${
          compact ? 'px-3 py-2' : 'px-4 py-2'
        }`}
        aria-label="Download Guardian App"
      >
        <Download className="w-3.5 h-3.5 shrink-0" />
        <span>{isIOS ? 'Get App' : 'Install App'}</span>
      </button>

      {showGuide && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-install-title"
        >
          <div className="w-full max-w-sm rounded-3xl bg-[var(--color-surface-elevated)] text-[var(--color-foreground)] border border-[var(--color-border)] p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <GuardianLogo size={48} />
                <div>
                  <h3 id="pwa-install-title" className="text-lg font-serif font-bold">
                    Install Guardian App
                  </h3>
                  <p className="text-xs text-[var(--color-muted)]">
                    Runs standalone with offline safety tools
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-full hover:bg-black/5"
                aria-label="Close install guide"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isIOS ? (
              <ol className="space-y-3 text-xs leading-relaxed text-[var(--color-foreground)] bg-[var(--color-surface-tint)] p-4 rounded-2xl border border-[var(--color-border)]">
                <li className="flex items-center gap-2.5">
                  <Share className="w-4 h-4 text-[var(--color-primary)] shrink-0" />
                  <span>
                    1. Tap the <strong>Share</strong> icon in Safari&apos;s toolbar.
                  </span>
                </li>
                <li className="flex items-center gap-2.5">
                  <PlusSquare className="w-4 h-4 text-[var(--color-primary)] shrink-0" />
                  <span>
                    2. Scroll down and tap <strong>Add to Home Screen</strong>.
                  </span>
                </li>
              </ol>
            ) : (
              <div className="space-y-2.5 text-xs leading-relaxed text-[var(--color-foreground)] bg-[var(--color-surface-tint)] p-4 rounded-2xl border border-[var(--color-border)]">
                <p>
                  To install Guardian as a standalone app on your device:
                </p>
                <ul className="list-disc pl-4 space-y-1 text-[var(--color-muted)]">
                  <li>
                    <strong>Desktop Chrome / Edge:</strong> Click the install icon in the address bar
                    or menu → <em>Install Guardian Safety App</em>.
                  </li>
                  <li>
                    <strong>Android Chrome:</strong> Tap the browser menu (⋮) →{' '}
                    <em>Add to Home screen / Install app</em>.
                  </li>
                </ul>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="w-full min-h-[44px] rounded-xl bg-[var(--color-primary)] text-white text-sm font-bold hover:bg-[var(--color-primary-active)] transition-colors"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-semibold text-white shadow-lg">
      <WifiOff className="w-3.5 h-3.5 shrink-0" />
      <span>Offline Mode · Cached safety tools active</span>
    </div>
  );
};

export default function InstallPWA() {
  return <OfflineIndicator />;
}
