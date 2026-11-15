import React, { useState } from 'react';
import { ArrowLeft, HeartPulse, Share2, CheckCircle2, Edit3, Save } from 'lucide-react';
import { StorageService } from '../lib/storage';
import { SafetyIdProfile } from '../types';
import { ZoomableStage } from './ZoomableStage';
import { GuardianLogo } from './GuardianLogo';

interface SafetyIdViewProps {
  onBack: () => void;
}

export const SafetyIdView: React.FC<SafetyIdViewProps> = ({ onBack }) => {
  const [profile, setProfile] = useState<SafetyIdProfile>(() =>
    StorageService.getSafetyIdProfile()
  );
  const [editing, setEditing] = useState(false);
  const [savedToast, setSavedToast] = useState('');
  const contacts = StorageService.getContacts();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.saveSafetyIdProfile(profile);
    setEditing(false);
    setSavedToast('Medical & Safety ID updated');
    setTimeout(() => setSavedToast(''), 3000);
  };

  const handleShare = () => {
    const primary = contacts[0]
      ? `${contacts[0].friendName} (${contacts[0].friendPhone})`
      : 'Not set';
    const text = `GUARDIAN EMERGENCY ID\nName: ${profile.fullName}\nBlood Group: ${profile.bloodGroup}\nAllergies: ${profile.allergies}\nMedical Notes: ${profile.medicalNotes}\nSafe Address: ${profile.safeAddress}\nPrimary ICE: ${primary}`;
    if (navigator.share) {
      navigator.share({ title: 'Guardian Safety ID', text }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setSavedToast('Safety ID copied to clipboard');
        setTimeout(() => setSavedToast(''), 3000);
      });
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)] flex flex-col max-w-md mx-auto">
      <header className="sticky top-0 z-20 bg-[var(--color-surface)] backdrop-blur-md border-b border-[var(--color-border)] px-4 py-3 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="min-h-[44px] min-w-[44px] -ml-2 flex items-center justify-center rounded-full hover:bg-black/5"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-serif font-bold flex-1">Emergency Safety ID</h1>
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          className="min-h-[40px] px-3 rounded-xl bg-[var(--color-surface-tint)] text-[var(--color-primary)] text-xs font-bold flex items-center gap-1.5 border border-[var(--color-border)]"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>{editing ? 'Preview' : 'Edit'}</span>
        </button>
      </header>

      <div className="flex-1 p-5 space-y-5">
        {savedToast && (
          <div className="p-3 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{savedToast}</span>
          </div>
        )}

        {editing ? (
          <form
            onSubmit={handleSave}
            className="bg-[var(--color-surface-elevated)] rounded-2xl p-5 border border-[var(--color-border)] space-y-4"
          >
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-1">
                <label className="text-xs font-bold text-[var(--color-muted)] block">
                  Full Name
                </label>
                <input
                  type="text"
                  value={profile.fullName}
                  onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-sm"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--color-muted)] block">
                  Blood
                </label>
                <input
                  type="text"
                  value={profile.bloodGroup}
                  onChange={(e) => setProfile({ ...profile, bloodGroup: e.target.value })}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-sm font-bold"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[var(--color-muted)] block">
                Allergies
              </label>
              <input
                type="text"
                value={profile.allergies}
                onChange={(e) => setProfile({ ...profile, allergies: e.target.value })}
                className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[var(--color-muted)] block">
                Medical Notes
              </label>
              <input
                type="text"
                value={profile.medicalNotes}
                onChange={(e) => setProfile({ ...profile, medicalNotes: e.target.value })}
                className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[var(--color-muted)] block">
                Safe Home / Drop Address
              </label>
              <input
                type="text"
                value={profile.safeAddress}
                onChange={(e) => setProfile({ ...profile, safeAddress: e.target.value })}
                className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[var(--color-muted)] block">
                Responder Note
              </label>
              <textarea
                rows={2}
                value={profile.emergencyNote}
                onChange={(e) => setProfile({ ...profile, emergencyNote: e.target.value })}
                className="w-full p-3 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-sm resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full min-h-[48px] rounded-xl bg-[var(--color-primary)] text-white font-bold text-sm flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Save Safety ID</span>
            </button>
          </form>
        ) : (
          <>
            <ZoomableStage title="Zoomable Responder Card">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
                  <div className="flex items-center gap-3">
                    <GuardianLogo size={42} />
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-primary)]">
                        In Case of Emergency
                      </p>
                      <h2 className="text-xl font-serif font-bold">{profile.fullName}</h2>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-[var(--color-muted)] block">Blood</span>
                    <span className="text-lg font-mono font-bold text-[var(--color-primary)]">
                      {profile.bloodGroup}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 text-xs">
                  <div>
                    <span className="text-[var(--color-muted)] block">Allergies</span>
                    <span className="font-semibold">{profile.allergies}</span>
                  </div>
                  <div>
                    <span className="text-[var(--color-muted)] block">Medical Conditions</span>
                    <span className="font-semibold">{profile.medicalNotes}</span>
                  </div>
                  <div>
                    <span className="text-[var(--color-muted)] block">Safe Address</span>
                    <span className="font-semibold">{profile.safeAddress}</span>
                  </div>
                  <div>
                    <span className="text-[var(--color-muted)] block">
                      Primary Emergency Contacts
                    </span>
                    <div className="mt-1 space-y-1">
                      {contacts.slice(0, 3).map((c, idx) => (
                        <div key={idx} className="font-semibold tabular-nums">
                          {c.friendName} · {c.friendPhone}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="pt-2 border-t border-[var(--color-border)] flex items-start gap-2 text-[var(--color-muted)]">
                    <HeartPulse className="w-4 h-4 text-[var(--color-primary)] shrink-0 mt-0.5" />
                    <span>{profile.emergencyNote}</span>
                  </div>
                </div>
              </div>
            </ZoomableStage>

            <button
              type="button"
              onClick={handleShare}
              className="w-full min-h-[48px] rounded-2xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-active)] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span>Share / Copy Emergency ID</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};
