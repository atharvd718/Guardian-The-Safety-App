import React, { useState, useEffect } from 'react';
import { useUser, UserButton } from '@clerk/clerk-react';
import { collection, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'react-hot-toast';
import { ShieldWarning, ChatCircle, Microphone, Crosshair, Robot, Users, MapPin, BatteryWarning, BatteryCharging, Lightning, CheckCircle, Power, UserCircle, SignOut, PhoneCall, VideoCamera } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'motion/react';
import { StorageService } from '../lib/storage';
import { ContactNew, ScreenType } from '../types';
import { LottieProgressModal } from './LottieProgressModal';
import { CustomDialogNoContacts } from './CustomDialogNoContacts';
import { useBattery } from '../hooks/useBattery';

interface DashboardViewProps {
  onNavigate: (screen: ScreenType) => void;
  onLogout: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onLogout,
}) => {
  const { user } = useUser();
  const [contacts, setContacts] = useState<ContactNew[]>([]);

  useEffect(() => {
    if (!user) return;
    const loadContacts = async () => {
      try {
        const contactsRef = collection(db, 'users', user.id, 'contacts');
        const snapshot = await getDocs(contactsRef);
        const loaded = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as ContactNew[];
        setContacts(loaded);
      } catch (error) {
        console.error('Failed to load contacts for dashboard:', error);
      }
    };
    loadContacts();
  }, [user]);

  const {
    isLowBattery,
    batteryPercentage,
    charging,
    isSupported,
    simulatedLowBattery,
    toggleSimulatedLowBattery,
  } = useBattery();

  const [isProgressOpen, setIsProgressOpen] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [isNoContactsOpen, setIsNoContactsOpen] = useState(false);
  const [sosSuccessToast, setSosSuccessToast] = useState('');

  // Handle SOS Click (Triggers exact Android workflow from DashboardFragment.kt)
  const handleSosClick = async () => {
    if (contacts.length === 0) {
      setIsNoContactsOpen(true);
      return;
    }

    const confirmed = window.confirm('Are you sure you want to send SOS?');
    if (!confirmed) return;

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
          address: 'Location pending'
        },
        deviceInfo: navigator.userAgent
      });
      console.log('SOS incident saved to Firestore');
    } catch (error) {
      console.error('Failed to save SOS incident:', error);
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
    } catch (err) {
      console.warn('Geolocation failed, using fallback coordinates');
    }

    const mapLink = `https://maps.google.com/?q=${lat.toFixed(5)},${lng.toFixed(5)}`;
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const message = `SOS Alert! ${user?.fullName || 'User'} is in danger! Need help!\nTime: ${timestamp}\nLocation: ${mapLink}`;

    setProgressMsg(`Broadcasting SOS to ${contacts.length} emergency contacts...`);

    // Save SMS log
    StorageService.addSmsLog({
      id: 'sos_' + Date.now(),
      timestamp,
      recipients: contacts.map((c) => `${c.friendName} (${c.friendPhone})`),
      message,
      status: 'Sent',
    });

    for (const contact of contacts) {
      const phone = contact.friendPhone.replace(/\D/g, ''); // sanitize phone number
      if (!phone) continue;

      const encodedMsg = encodeURIComponent(message);
      
      // WhatsApp deep link
      const waLink = `https://wa.me/${phone}?text=${encodedMsg}`;
      window.open(waLink, '_blank');
      
      // 1-second delay
      await new Promise(r => setTimeout(r, 1000));
      
      // SMS deep link backup
      const smsLink = `sms:${phone}?body=${encodedMsg}`;
      window.open(smsLink, '_blank');
      
      // 1-second delay
      await new Promise(r => setTimeout(r, 1000));
    }

    setProgressMsg('Alerts sent successfully!');
    
    setTimeout(() => {
      setIsProgressOpen(false);
      toast.success('SOS Alert Sent! Locating nearby help...', { duration: 4000 });
      onNavigate('safe_places');
    }, 1000);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { ease: "easeOut", duration: 0.3 } }
  };

  return (
    <div className="min-h-screen bg-[var(--color-background)] flex flex-col max-w-md mx-auto relative pb-8 text-[var(--color-foreground)] overflow-x-hidden">
      {/* Header Glass Area */}
      <div className="pt-10 pb-6 px-6 relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2 bg-[var(--color-surface)] backdrop-blur-md px-4 py-2 rounded-full border border-[var(--color-border)]">
            <ShieldWarning weight="fill" className="w-5 h-5 text-[var(--color-primary)]" />
            <span className="text-sm font-bold tracking-wider uppercase text-[var(--color-foreground)]">Guardian</span>
          </div>

          <button
            onClick={onLogout}
            className="p-2.5 bg-[var(--color-surface)] hover:bg-white/10 rounded-full transition backdrop-blur-md border border-[var(--color-border)]"
            title="Log Out"
          >
            <SignOut weight="bold" className="w-5 h-5 text-[var(--color-muted)]" />
          </button>
        </div>

        <div className="flex items-center justify-between relative">
          <div>
            <h2 className="text-2xl font-serif tracking-tight text-[var(--color-foreground)]">
              Hi, <span>{user?.firstName || user?.emailAddresses[0]?.emailAddress || 'Friend'}</span>
            </h2>
            <p className="text-sm text-[var(--color-muted)] font-medium">
              Ready to protect you
            </p>
          </div>
          {/* Female SVG Character */}
          <div className="absolute right-16 -top-2 opacity-90 pointer-events-none">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--color-primary)]">
              <path d="M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" fill="var(--color-primary)" opacity="0.2"/>
              <path d="M12 12c-4 0-7 2-7 6v2h14v-2c0-4-3-6-7-6z" />
              <path d="M7 6c0-2 2-3 5-3s5 1 5 3-1 6-5 6-5-4-5-6z" />
            </svg>
          </div>
          <div className="w-14 h-14 rounded-full bg-[var(--color-surface)] shadow-sm border border-[var(--color-border)] flex items-center justify-center backdrop-blur-md relative z-10">
            <UserButton afterSignOutUrl='/' />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="px-5 z-20 flex-1 space-y-6">
        
        {/* Toast */}
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

        {/* Battery Monitor */}
        <div className="bg-[var(--color-surface)] backdrop-blur-md px-5 py-4 rounded-3xl border border-[var(--color-border)] flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm font-medium">
            {isLowBattery ? (
              <BatteryWarning weight="fill" className="w-6 h-6 text-amber-500 animate-pulse" />
            ) : charging ? (
              <BatteryCharging weight="fill" className="w-6 h-6 text-[var(--color-accent)]" />
            ) : (
              <BatteryWarning weight="fill" className="w-6 h-6 text-[var(--color-muted)]" />
            )}
            <div>
              <div className="text-[var(--color-foreground)] font-bold">Battery: {batteryPercentage !== null ? `${batteryPercentage}%` : 'Sufficient'}</div>
              {isLowBattery && <div className="text-[10px] text-amber-500 font-bold uppercase mt-0.5">Critical Level</div>}
            </div>
          </div>
          <button
            onClick={toggleSimulatedLowBattery}
            className="text-[10px] font-bold text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-3 py-1.5 rounded-full transition hover:bg-[var(--color-primary)]/20"
          >
            {simulatedLowBattery ? 'Fix' : 'Test <20%'}
          </button>
        </div>

        {/* MASSIVE SOS TRIGGER */}
        <div className="flex justify-center py-6">
          <button
            aria-label="Send Emergency SOS Alert"
            onClick={handleSosClick}
            className="relative group w-48 h-48 rounded-full flex items-center justify-center bg-[var(--color-primary)] border-4 border-pink-200/50 shadow-[0_0_50px_rgba(232,67,122,0.4)] transition-transform active:scale-95"
          >
            <div className="absolute inset-0 rounded-full animate-sos-pulse pointer-events-none bg-[var(--color-primary)]"></div>
            <div className="absolute inset-2 rounded-full border border-white/30 bg-gradient-to-b from-[#FF5C8D] to-[#D42B62]"></div>
            <div className="relative z-10 flex flex-col items-center justify-center space-y-2">
              <ShieldWarning weight="fill" className="w-14 h-14 text-white drop-shadow-sm" />
              <span className="text-white font-serif text-2xl tracking-widest drop-shadow-sm">SOS</span>
            </div>
          </button>
        </div>

        {/* Bento Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 gap-4"
        >
          <motion.button
            variants={itemVariants}
            onClick={() => onNavigate('emergency_sms')}
            className="bg-[var(--color-surface)] backdrop-blur-md border border-[var(--color-border)] shadow-sm p-5 rounded-3xl flex flex-col items-start gap-4 active:scale-95 transition-transform"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#EC4899]/10 flex items-center justify-center border border-[#EC4899]/20">
              <ChatCircle weight="fill" className="w-6 h-6 text-[#EC4899]" />
            </div>
            <span className="font-serif text-[var(--color-foreground)] text-left leading-tight text-lg">Emergency<br/>SMS</span>
          </motion.button>

          <motion.button
            variants={itemVariants}
            onClick={() => onNavigate('record_audio')}
            className="bg-[var(--color-surface)] backdrop-blur-md border border-[var(--color-border)] shadow-sm p-5 rounded-3xl flex flex-col items-start gap-4 active:scale-95 transition-transform"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#A855F7]/10 flex items-center justify-center border border-[#A855F7]/20">
              <Microphone weight="fill" className="w-6 h-6 text-[#A855F7]" />
            </div>
            <span className="font-serif text-[var(--color-foreground)] text-left leading-tight text-lg">Record<br/>Audio</span>
          </motion.button>

          <motion.button
            variants={itemVariants}
            onClick={() => onNavigate('track_me')}
            className="bg-[var(--color-surface)] backdrop-blur-md border border-[var(--color-border)] shadow-sm p-5 rounded-3xl flex flex-col items-start gap-4 active:scale-95 transition-transform"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#6366F1]/10 flex items-center justify-center border border-[#6366F1]/20">
              <Crosshair weight="fill" className="w-6 h-6 text-[#6366F1]" />
            </div>
            <span className="font-serif text-[var(--color-foreground)] text-left leading-tight text-lg">Track<br/>Me</span>
          </motion.button>

          <motion.button
            variants={itemVariants}
            onClick={() => onNavigate('shield_mate')}
            className="bg-[var(--color-surface)] backdrop-blur-md border border-[var(--color-border)] shadow-sm p-5 rounded-3xl flex flex-col items-start gap-4 active:scale-95 transition-transform"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#0EA5E9]/10 flex items-center justify-center border border-[#0EA5E9]/20">
              <Robot size={24} className="text-[#00695C]" weight="duotone" />
            </div>
            <span className="font-serif text-[var(--color-foreground)] text-left leading-tight text-lg">ARIA</span>
          </motion.button>

          <motion.button
            variants={itemVariants}
            onClick={() => onNavigate('safe_places')}
            className="col-span-2 bg-[var(--color-surface)] backdrop-blur-md border border-[var(--color-border)] shadow-sm p-5 rounded-3xl flex items-center justify-between active:scale-[0.98] transition-transform overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-accent)]/10 blur-2xl rounded-full"></div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-[var(--color-accent)]/10 flex items-center justify-center border border-[var(--color-accent)]/20">
                <MapPin weight="fill" className="w-6 h-6 text-[var(--color-accent)]" />
              </div>
              <div className="text-left">
                <span className="font-serif text-xl text-[var(--color-foreground)] block">Nearby Safe Places</span>
                <span className="text-xs text-[var(--color-muted)] font-medium">Hospitals, Police, Fire Stations</span>
              </div>
            </div>
          </motion.button>

          <motion.button
            variants={itemVariants}
            onClick={() => onNavigate('helplines')}
            className="col-span-2 bg-[var(--color-surface)] backdrop-blur-md border border-[var(--color-border)] shadow-sm p-5 rounded-3xl flex items-center justify-between active:scale-[0.98] transition-transform overflow-hidden relative"
          >
            <div className="absolute top-0 left-0 w-32 h-32 bg-[#F59E0B]/10 blur-2xl rounded-full"></div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-[#F59E0B]/10 flex items-center justify-center border border-[#F59E0B]/20">
                <PhoneCall weight="fill" className="w-6 h-6 text-[#F59E0B]" />
              </div>
              <div className="text-left">
                <span className="font-serif text-xl text-[var(--color-foreground)] block">Emergency Helplines</span>
                <span className="text-xs text-[var(--color-muted)] font-medium">24/7 Support, Abuse & Legal Aid</span>
              </div>
            </div>
          </motion.button>

          <motion.button
            variants={itemVariants}
            onClick={() => onNavigate('self_defense')}
            className="col-span-2 bg-[var(--color-surface)] backdrop-blur-md border border-[var(--color-border)] shadow-sm p-5 rounded-3xl flex items-center justify-between active:scale-[0.98] transition-transform overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-2xl rounded-full"></div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                <VideoCamera weight="fill" className="w-6 h-6 text-emerald-500" />
              </div>
              <div className="text-left">
                <span className="font-serif text-xl text-[var(--color-foreground)] block">Self-Defense Tips</span>
                <span className="text-xs text-[var(--color-muted)] font-medium">Video Tutorials & Techniques</span>
              </div>
            </div>
          </motion.button>
        </motion.div>

        {/* Contacts Summary Card */}
        <div className="bg-[var(--color-surface)] p-4 rounded-3xl shadow-sm border border-[var(--color-border)] flex items-center justify-between mb-8 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[var(--color-primary)]/10 flex items-center justify-center border border-[var(--color-primary)]/20">
              <Users weight="fill" className="w-5 h-5 text-[var(--color-primary)]" />
            </div>
            <div>
              <h4 className="font-bold text-[var(--color-foreground)] text-sm">Emergency Contacts ({contacts.length})</h4>
              <p className="text-xs text-[var(--color-muted)] truncate max-w-[150px]">
                {contacts.length > 0
                  ? `${contacts.map((c) => c.friendName).join(', ')}`
                  : 'No contacts added.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('added_contacts')}
            className="text-xs font-bold text-[var(--color-primary)] bg-[var(--color-primary)]/10 hover:bg-[var(--color-primary)]/20 px-4 py-2.5 rounded-xl transition border border-[var(--color-primary)]/10"
          >
            Manage
          </button>
        </div>
      </div>

      {/* Progress Dialog */}
      <LottieProgressModal isOpen={isProgressOpen} message={progressMsg} />

      {/* Custom Dialog for No Contacts */}
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
