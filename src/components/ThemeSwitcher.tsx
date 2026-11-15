import React, { useState } from 'react';
import { Palette, Check } from 'lucide-react';
import { GuardianTheme, THEME_OPTIONS, useGuardianTheme } from '../lib/theme';

export const ThemeSwitcher: React.FC = () => {
  const { theme, setTheme } = useGuardianTheme();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="min-h-[40px] min-w-[40px] px-3 flex items-center justify-center gap-1.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-foreground)] hover:opacity-90 transition-opacity text-xs font-semibold whitespace-nowrap"
        aria-label="Change color grading theme"
        aria-expanded={open}
      >
        <Palette className="w-4 h-4 text-[var(--color-primary)] shrink-0" />
        <span className="hidden sm:inline">Tone</span>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute right-0 mt-2 w-48 z-40 rounded-2xl bg-[var(--color-surface-elevated)] border border-[var(--color-border)] shadow-xl p-2 space-y-1">
            <p className="px-2.5 py-1 text-[11px] font-semibold text-[var(--color-muted)]">
              Color Grading
            </p>
            {THEME_OPTIONS.map((opt) => {
              const active = theme === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setTheme(opt.id as GuardianTheme);
                    setOpen(false);
                  }}
                  className={`w-full min-h-[40px] px-2.5 py-2 rounded-xl flex items-center justify-between text-xs font-semibold transition-colors ${
                    active
                      ? 'bg-[var(--color-surface-tint)] text-[var(--color-primary)]'
                      : 'text-[var(--color-foreground)] hover:bg-black/5'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <span
                      className="w-4 h-4 rounded-full border border-black/15 shrink-0"
                      style={{ backgroundColor: opt.swatch }}
                    />
                    <span>{opt.label}</span>
                  </span>
                  {active && <Check className="w-3.5 h-3.5 shrink-0" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
