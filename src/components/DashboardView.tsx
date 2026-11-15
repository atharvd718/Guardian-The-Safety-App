import React, { useState, useEffect, useRef } from 'react';
import { useAppUser, AppUserButton } from '../lib/auth';
import { collection, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';
import { toast } from 'react-hot-toast';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import {
  ShieldWarning,
  ChatCircle,
  Microphone,
  Crosshair,
  Robot,
  Users,
  MapPin,
  BatteryWarning,
  BatteryCharging,
  CheckCircle,
  SignOut,
  PhoneCall,
  VideoCamera,
  Siren,
  PhoneIncoming,
  Timer,
  IdentificationCard,
} from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'motion/react';
import { StorageService } from '../lib/storage';
import { ContactNew, ScreenType } from '../types';
import { LottieProgressModal } from './LottieProgressModal';
import { CustomDialogNoContacts } from './CustomDialogNoContacts';
import { useBattery } from '../hooks/useBattery';
import { useSiren } from '../hooks/useSiren';
import { GuardianLogo } from './GuardianLogo';
import { PWAInstallButton } from './InstallPWA';
import { ThemeSwitcher } from './ThemeSwitcher';

gsap.registerPlugin(useGSAP, ScrollTrigger);

interface DashboardViewProps {
  onNavigate: (screen: ScreenType) => void;
  onLogout: () => void;
  geofenceMonitoringEnabled?: boolean;
  activeUnsafeZonesCount?: number;
  insideUnsafeZonesCount?: number;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onLogout,
  geofenceMonitoringEnabled = true,
  activeUnsafeZonesCount = 0,
  insideUnsafeZonesCount = 0,
}) => {
  const { user } = useAppUser();
  const [contacts, setContacts] = useState<ContactNew[]>(() => StorageService.getContacts());
  const containerRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const { isSirenActive, toggleSiren } = useSiren();

  useEffect(() => {
    setContacts(StorageService.getContacts());
    if (!isFirebaseConfigured || !db || !user) return;
    const loadContacts = async () => {
      try {
        const contactsRef = collection(db, 'users', user.id, 'contacts');
        const snapshot = await getDocs(contactsRef);
        const loaded = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as ContactNew[];
        if (loaded.length > 0) {
          setContacts(loaded);
          StorageService.setContacts(loaded);
        }
      } catch (error) {
        console.error('Failed to load contacts for dashboard:', error);
      }
    };
    loadContacts();
  }, [user]);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from('.gsap-bento-card', {
          y: 16,
          opacity: 0,
          duration: 0.42,
          stagger: 0.05,
          ease: 'power2.out',
          clearProps: 'transform,opacity',
        });

        if (progressBarRef.current && containerRef.current) {
          gsap.to(progressBarRef.current, {
            scaleX: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: containerRef.current,
              start: 'top top',
              end: 'bottom bottom',
              scrub: 0.25,
            },
          });
        }
      });
    },
    { scope: containerRef }
  );

  const {
    isLowBattery,
    batteryPercentage,
    charging,
    simulatedLowBattery,
    toggleSimulatedLowBattery,
  } = useBattery();

  const [isProgressOpen, setIsProgressOpen] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [isNoContactsOpen, setIsNoContactsOpen] = useState(false);
  const [sosSuccessToast] = useState('');

  const handleSosClick = async () => {
    if (contacts.length === 0) {
      setIsNoContactsOpen(true);
      return;
    }

    const confirmed = window.confirm('Are you sure you want to send SOS?');
    if (!confirmed) return;

    if (isFirebaseConfigured && db) {
      try {
        await addDoc(collection(db, 'incidents'), {
          userId: user?.id || 'anonymous',
          userName: user?.fullName || 'Unknown',
          userEmail: user?.primaryEmailAddress?.emailAddress || '',
          timestamp: serverTimestamp(),
          type: 'SOS',
          status: 'active',
          location: {
            lat: 0,
            lng: 0,
            address: 'Location pending',
          },
          deviceInfo: navigator.userAgent,
        });
      } catch (error) {
        console.error('Failed to save SOS incident:', error);
      }
    }

    setIsProgressOpen(true);
    setProgressMsg('Fetching current GPS location...');

    let lat = 28.535517;
    let lng = 77.391029;

    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
      });
      lat = pos.coords.latitude;
      lng = pos.coords.longitude;
    } catch {
      console.warn('Geolocation failed, using fallback coordinates');
    }

    const mapLink = `https://maps.google.com/?q=${lat.toFixed(5)},${lng.toFixed(5)}`;
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const message = `SOS Alert! ${user?.fullName || 'User'} is in danger! Need help!\nTime: ${timestamp}\nLocation: ${mapLink}`;

    setProgressMsg(`Broadcasting SOS to ${contacts.length} emergency contacts...`);

    StorageService.addSmsLog({
      id: 'sos_' + Date.now(),
      timestamp,
      recipients: contacts.map((c) => `${c.friendName} (${c.friendPhone})`),
      message,
      status: 'Sent',
    });

    for (const contact of contacts) {
      const phone = contact.friendPhone.replace(/\D/g, '');
      if (!phone) continue;

      const encodedMsg = encodeURIComponent(message);
      const waLink = `https://wa.me/${phone}?text=${encodedMsg}`;
      window.open(waLink, '_blank');
      await new Promise((r) => setTimeout(r, 1000));

      const smsLink = `sms:${phone}?body=${encodedMsg}`;
      window.open(smsLink, '_blank');
      await new Promise((r) => setTimeout(r, 1000));
    }

    setProgressMsg('Alerts sent successfully!');

    setTimeout(() => {
      setIsProgressOpen(false);
      toast.success('SOS Alert Sent! Locating nearby help...', { duration: 4000 });
      onNavigate('safe_places');
    }, 1000);
  };

  return (
    <div
      ref={containerRef}
      data-app-scroll
      className="min-h-screen bg-[var(--color-background)] flex flex-col max-w-md mx-auto relative pb-8 text-[var(--color-foreground)] overflow-x-hidden transition-colors"
    >
      {/* Scroll-linked Blush Reading Progress Hairline */}
      <div
        ref={progressBarRef}
        className="fixed top-0 left-0 right-0 h-[3px] bg-[var(--color-primary)] origin-left scale-x-0 z-40 max-w-md mx-auto pointer-events-none"
      />

      {/* Header */}
      <div className="pt-6 pb-5 px-5 relative z-10 space-y-5">
        <div className="flex items-center justify-between gap-2">
          <GuardianLogo size={36} showWordmark />

          <div className="flex items-center gap-1.5 shrink-0">
            <PWAInstallButton compact />
            <ThemeSwitcher />
            <button
              onClick={onLogout}
              className="min-h-[40px] min-w-[40px] flex items-center justify-center bg-[var(--color-surface)] hover:opacity-85 rounded-xl transition border border-[var(--color-border)]"
              title="Log Out"
              aria-label="Log Out"
            >
              <SignOut weight="bold" className="w-4 h-4 text-[var(--color-muted)]" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between relative">
          <div>
            <h2 className="text-2xl font-serif tracking-tight text-[var(--color-foreground)]">
              Hi, <span>{user?.firstName || user?.emailAddresses[0]?.emailAddress || 'Friend'}</span>
            </h2>
            <p className="text-sm text-[var(--color-muted)] font-medium">
              Your personal safety shield is ready
            </p>
          </div>

          <div className="w-12 h-12 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center relative z-10">
            <AppUserButton />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="px-5 z-20 flex-1 space-y-5">
        <AnimatePresence>
          {sosSuccessToast && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-4 bg-[var(--color-accent)] text-white rounded-2xl shadow-lg flex items-center gap-3 font-bold"
            >
              <CheckCircle weight="fill" className="w-6 h-6 flex-shrink-0" />
              <span>{sosSuccessToast}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active Siren Banner */}
        {isSirenActive && (
          <div className="p-4 rounded-2xl bg-red-600 text-white flex items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-2.5 text-xs font-bold">
              <Siren weight="fill" className="w-5 h-5 shrink-0" />
              <span>Deterrent Safety Siren Active</span>
            </div>
            <button
              type="button"
              onClick={toggleSiren}
              className="min-h-[36px] px-3.5 rounded-xl bg-white text-red-700 text-xs font-bold shrink-0"
            >
              Stop Siren
            </button>
          </div>
        )}

        {/* Battery Monitor */}
        <div className="bg-[var(--color-surface)] backdrop-blur-md px-4 py-3.5 rounded-2xl border border-[var(--color-border)] flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm font-medium">
            {isLowBattery ? (
              <BatteryWarning weight="fill" className="w-6 h-6 text-amber-500" />
            ) : charging ? (
              <BatteryCharging weight="fill" className="w-6 h-6 text-[var(--color-accent)]" />
            ) : (
              <BatteryWarning weight="fill" className="w-6 h-6 text-[var(--color-muted)]" />
            )}
            <div>
              <div className="text-[var(--color-foreground)] font-bold text-xs tabular-nums">
                Battery: {batteryPercentage !== null ? `${batteryPercentage}%` : 'Sufficient'}
                {isLowBattery ? ' · Critical Level' : ''}
              </div>
            </div>
          </div>
          <button
            onClick={toggleSimulatedLowBattery}
            className="min-h-[36px] text-xs font-bold text-[var(--color-primary)] bg-[var(--color-surface-tint)] px-3 py-1.5 rounded-xl transition border border-[var(--color-border)] whitespace-nowrap"
          >
            {simulatedLowBattery ? 'Restore' : 'Test <20%'}
          </button>
        </div>

        {/* MASSIVE SOS TRIGGER */}
        <div className="flex justify-center py-4">
          <button
            aria-label="Send Emergency SOS Alert"
            onClick={handleSosClick}
            className="relative group w-44 h-44 rounded-full flex items-center justify-center bg-[var(--color-primary)] border-4 border-rose-200/50 shadow-[0_12px_40px_var(--color-shadow-rose)] transition-transform active:scale-95"
          >
            <div className="absolute inset-0 rounded-full animate-sos-pulse pointer-events-none bg-[var(--color-primary)]" />
            <div className="absolute inset-2 rounded-full border border-white/30 bg-gradient-to-b from-[#FF5C8D] to-[#A6184E]" />
            <div className="relative z-10 flex flex-col items-center justify-center space-y-1.5">
              <ShieldWarning weight="fill" className="w-12 h-12 text-white drop-shadow-sm" />
              <span className="text-white font-serif text-2xl tracking-widest drop-shadow-sm">
                SOS
              </span>
            </div>
          </button>
        </div>

        {/* Quick Deterrent & Escape Strip */}
        <div className="grid grid-cols-4 gap-2">
          <button
            type="button"
            onClick={toggleSiren}
            className={`gsap-bento-card min-h-[68px] p-2.5 rounded-2xl border flex flex-col items-center justify-center gap-1.5 text-center transition-colors ${
              isSirenActive
                ? 'bg-red-600 text-white border-red-600'
                : 'bg-[var(--color-surface-elevated)] text-[var(--color-foreground)] border-[var(--color-border)] hover:bg-[var(--color-surface-tint)]'
            }`}
          >
            <Siren weight="fill" className={`w-5 h-5 ${isSirenActive ? 'text-white' : 'text-red-500'}`} />
            <span className="text-[11px] font-bold leading-tight whitespace-nowrap">
              {isSirenActive ? 'Stop' : 'Siren'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('fake_call')}
            className="gsap-bento-card min-h-[68px] p-2.5 rounded-2xl bg-[var(--color-surface-elevated)] border border-[var(--color-border)] hover:bg-[var(--color-surface-tint)] flex flex-col items-center justify-center gap-1.5 text-center transition-colors"
          >
            <PhoneIncoming weight="fill" className="w-5 h-5 text-[var(--color-primary)]" />
            <span className="text-[11px] font-bold leading-tight whitespace-nowrap">
              Escape Call
            </span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('safety_checkin')}
            className="gsap-bento-card min-h-[68px] p-2.5 rounded-2xl bg-[var(--color-surface-elevated)] border border-[var(--color-border)] hover:bg-[var(--color-surface-tint)] flex flex-col items-center justify-center gap-1.5 text-center transition-colors"
          >
            <Timer weight="fill" className="w-5 h-5 text-[#0D9488]" />
            <span className="text-[11px] font-bold leading-tight whitespace-nowrap">
              Check-In
            </span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('safety_id')}
            className="gsap-bento-card min-h-[68px] p-2.5 rounded-2xl bg-[var(--color-surface-elevated)] border border-[var(--color-border)] hover:bg-[var(--color-surface-tint)] flex flex-col items-center justify-center gap-1.5 text-center transition-colors"
          >
            <IdentificationCard weight="fill" className="w-5 h-5 text-indigo-500" />
            <span className="text-[11px] font-bold leading-tight whitespace-nowrap">
              Safety ID
            </span>
          </button>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-2 gap-3.5">
          <button
            onClick={() => onNavigate('emergency_sms')}
            className="gsap-bento-card bg-[var(--color-surface-elevated)] border border-[var(--color-border)] shadow-sm p-4 rounded-2xl flex flex-col items-start gap-3 active:scale-95 transition-transform"
          >
            <div className="w-11 h-11 rounded-xl bg-[#EC4899]/10 flex items-center justify-center border border-[#EC4899]/20">
              <ChatCircle weight="fill" className="w-6 h-6 text-[#EC4899]" />
            </div>
            <span className="font-serif text-[var(--color-foreground)] text-left leading-tight text-lg">
              Emergency
              <br />
              SMS
            </span>
          </button>

          <button
            onClick={() => onNavigate('record_audio')}
            className="gsap-bento-card bg-[var(--color-surface-elevated)] border border-[var(--color-border)] shadow-sm p-4 rounded-2xl flex flex-col items-start gap-3 active:scale-95 transition-transform"
          >
            <div className="w-11 h-11 rounded-xl bg-[#A855F7]/10 flex items-center justify-center border border-[#A855F7]/20">
              <Microphone weight="fill" className="w-6 h-6 text-[#A855F7]" />
            </div>
            <span className="font-serif text-[var(--color-foreground)] text-left leading-tight text-lg">
              Record
              <br />
              Audio
            </span>
          </button>

          <button
            onClick={() => onNavigate('track_me')}
            className="gsap-bento-card bg-[var(--color-surface-elevated)] border border-[var(--color-border)] shadow-sm p-4 rounded-2xl flex flex-col items-start gap-3 active:scale-95 transition-transform"
          >
            <div className="w-11 h-11 rounded-xl bg-[#6366F1]/10 flex items-center justify-center border border-[#6366F1]/20">
              <Crosshair weight="fill" className="w-6 h-6 text-[#6366F1]" />
            </div>
            <span className="font-serif text-[var(--color-foreground)] text-left leading-tight text-lg">
              Track
              <br />
              Me
            </span>
          </button>

          <button
            onClick={() => onNavigate('aria')}
            className="gsap-bento-card bg-[var(--color-surface-elevated)] border border-[var(--color-border)] shadow-sm p-4 rounded-2xl flex flex-col items-start gap-3 active:scale-95 transition-transform"
          >
            <div className="w-11 h-11 rounded-xl bg-[#0D9488]/10 flex items-center justify-center border border-[#0D9488]/20">
              <Robot size={24} className="text-[#0D9488]" weight="duotone" />
            </div>
            <span className="font-serif text-[var(--color-foreground)] text-left leading-tight text-lg">
              ARIA
              <br />
              AI Aid
            </span>
          </button>

          <button
            onClick={() => onNavigate('unsafe_zones')}
            className="gsap-bento-card col-span-2 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] shadow-sm p-4 rounded-2xl flex items-center justify-between active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                <ShieldWarning weight="fill" className="w-6 h-6 text-[var(--color-primary)]" />
              </div>
              <div className="text-left">
                <span className="font-serif text-lg text-[var(--color-foreground)] block">
                  Unsafe Area Alerts
                </span>
                <span className="text-xs text-[var(--color-muted)] font-medium tabular-nums">
                  {activeUnsafeZonesCount} active zone{activeUnsafeZonesCount === 1 ? '' : 's'} ·
                  Silent watch {geofenceMonitoringEnabled ? 'on' : 'paused'}
                  {insideUnsafeZonesCount > 0 ? ` · Inside ${insideUnsafeZonesCount}` : ''}
                </span>
              </div>
            </div>
          </button>

          <button
            onClick={() => onNavigate('safe_places')}
            className="gsap-bento-card col-span-2 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] shadow-sm p-4 rounded-2xl flex items-center justify-between active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-[var(--color-accent)]/10 flex items-center justify-center border border-[var(--color-accent)]/20">
                <MapPin weight="fill" className="w-6 h-6 text-[var(--color-accent)]" />
              </div>
              <div className="text-left">
                <span className="font-serif text-lg text-[var(--color-foreground)] block">
                  Nearby Safe Places
                </span>
                <span className="text-xs text-[var(--color-muted)] font-medium">
                  Hospitals, Police, Fire Stations
                </span>
              </div>
            </div>
          </button>

          <button
            onClick={() => onNavigate('helplines')}
            className="gsap-bento-card col-span-2 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] shadow-sm p-4 rounded-2xl flex items-center justify-between active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-[#F59E0B]/10 flex items-center justify-center border border-[#F59E0B]/20">
                <PhoneCall weight="fill" className="w-6 h-6 text-[#F59E0B]" />
              </div>
              <div className="text-left">
                <span className="font-serif text-lg text-[var(--color-foreground)] block">
                  Emergency Helplines
                </span>
                <span className="text-xs text-[var(--color-muted)] font-medium">
                  24/7 Support, Abuse &amp; Legal Aid
                </span>
              </div>
            </div>
          </button>

          <button
            onClick={() => onNavigate('self_defense')}
            className="gsap-bento-card col-span-2 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] shadow-sm p-4 rounded-2xl flex items-center justify-between active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                <VideoCamera weight="fill" className="w-6 h-6 text-emerald-500" />
              </div>
              <div className="text-left">
                <span className="font-serif text-lg text-[var(--color-foreground)] block">
                  Self-Defense Tips
                </span>
                <span className="text-xs text-[var(--color-muted)] font-medium">
                  Zoomable Response Guide &amp; Videos
                </span>
              </div>
            </div>
          </button>
        </div>

        {/* Contacts Summary Card */}
        <div className="bg-[var(--color-surface-elevated)] p-4 rounded-2xl shadow-sm border border-[var(--color-border)] flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-surface-tint)] flex items-center justify-center border border-[var(--color-border)]">
              <Users weight="fill" className="w-5 h-5 text-[var(--color-primary)]" />
            </div>
            <div>
              <h4 className="font-bold text-[var(--color-foreground)] text-sm tabular-nums">
                Emergency Contacts ({contacts.length})
              </h4>
              <p className="text-xs text-[var(--color-muted)] truncate max-w-[160px]">
                {contacts.length > 0
                  ? contacts.map((c) => c.friendName).join(', ')
                  : 'No contacts added.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('added_contacts')}
            className="min-h-[40px] text-xs font-bold text-[var(--color-primary)] bg-[var(--color-surface-tint)] hover:opacity-90 px-4 py-2 rounded-xl transition border border-[var(--color-border)]"
          >
            Manage
          </button>
        </div>
      </div>

      <LottieProgressModal isOpen={isProgressOpen} message={progressMsg} />

      <CustomDialogNoContacts
        isOpen={isNoContactsOpen}
        onAddContacts={() => {
          setIsNoContactsOpen(false);
          onNavigate('add_contacts');
        }}
        onClose={() => setIsNoContactsOpen(false)}
      />
    </div>
  );
};
