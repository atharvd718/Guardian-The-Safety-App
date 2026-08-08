import React, { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Share2, Navigation, CheckCircle2, RefreshCw } from 'lucide-react';
import { StorageService } from '../lib/storage';

interface TrackMeViewProps {
  onBack: () => void;
}

export const TrackMeView: React.FC<TrackMeViewProps> = ({ onBack }) => {
  const user = StorageService.getCurrentUser();
  const contacts = StorageService.getContacts();

  const [lat, setLat] = useState<number>(28.535517);
  const [lng, setLng] = useState<number>(77.391029);
  const [address, setAddress] = useState<string>('Sector 62, Noida, Uttar Pradesh, India');
  const [loadingLoc, setLoadingLoc] = useState<boolean>(false);
  const [toast, setToast] = useState<string>('');

  const fetchLocation = () => {
    setLoadingLoc(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;
          setLat(latitude);
          setLng(longitude);
          setAddress(`GPS Lat: ${latitude.toFixed(5)}, Lng: ${longitude.toFixed(5)} (Live Location)`);
          setLoadingLoc(false);
        },
        (error) => {
          // Fallback location
          setAddress('Location permission restricted. Using default GPS coordinates.');
          setLoadingLoc(false);
        },
        { timeout: 8000 }
      );
    } else {
      setLoadingLoc(false);
    }
  };

  useEffect(() => {
    fetchLocation();
  }, []);

  const handleShareLocation = () => {
    if (contacts.length === 0) {
      alert('No emergency contacts added yet! Please add emergency contacts first.');
      return;
    }

    const mapLink = `https://www.google.com/maps?q=${lat},${lng}`;
    const finalMsg = `Location: ${address}\nLocation Link: ${mapLink}\nFrom: ${user?.name || 'User'} (${user?.phone || ''})\n\nSent via Guardian - The Safety App`;

    StorageService.addSmsLog({
      id: 'track_' + Date.now(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      recipients: contacts.map((c) => `${c.friendName} (${c.friendPhone})`),
      message: finalMsg,
      status: 'Sent',
    });

    setToast('Live location shared with all emergency contacts!');
    setTimeout(() => setToast(''), 4000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col max-w-md mx-auto shadow-2xl border-x border-slate-200">
      {/* Top Header */}
      <div className="bg-indigo-600 text-white p-5 flex items-center justify-between sticky top-0 z-20 shadow-md">
        <button
          onClick={onBack}
          className="p-2 hover:bg-white/10 rounded-full transition"
          aria-label="Back"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="font-extrabold text-lg text-white">Track Me</h1>
        <button
          onClick={fetchLocation}
          className="p-2 hover:bg-white/10 rounded-full transition"
          title="Refresh GPS"
        >
          <RefreshCw className={`w-5 h-5 ${loadingLoc ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Main Body */}
      <div className="flex-1 flex flex-col p-5 space-y-4">
        {toast && (
          <div className="p-3.5 bg-emerald-600 text-white rounded-2xl shadow-lg flex items-center gap-3 animate-in fade-in text-xs font-bold">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>{toast}</span>
          </div>
        )}

        {/* Map Display Card */}
        <div className="bg-slate-900 rounded-3xl overflow-hidden shadow-lg border border-slate-200 relative h-72 flex flex-col justify-between p-4">
          {/* Simulated Dark Map Canvas matching map_style.json */}
          <iframe
            title="Guardian GPS Map"
            width="100%"
            height="100%"
            frameBorder="0"
            className="absolute inset-0 opacity-80"
            src={`https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`}
          ></iframe>

          {/* Map Pin Overlay */}
          <div className="relative z-10 self-end bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700 flex items-center gap-2 text-white text-xs font-bold">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></div>
            <span>GPS Signal Active</span>
          </div>

          <div className="relative z-10 bg-slate-900/90 backdrop-blur-md p-3 rounded-2xl border border-slate-700 space-y-1">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs">
              <Navigation className="w-4 h-4" />
              <span>Current Coordinates</span>
            </div>
            <p className="text-white font-mono text-xs">
              Lat: {lat.toFixed(5)} | Lng: {lng.toFixed(5)}
            </p>
          </div>
        </div>

        {/* Current Address Card */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200 space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Current Address Look-up
          </label>
          <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <MapPin className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-transparent text-sm font-semibold text-slate-800 focus:outline-none"
            />
          </div>
        </div>

        {/* Share Button */}
        <button
          onClick={handleShareLocation}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 transition active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <Share2 className="w-5 h-5" />
          <span>Share Current Location via SMS</span>
        </button>

        {/* Info box */}
        <p className="text-center text-xs text-slate-500 px-4">
          Your location will be formatted as a live Google Maps link and sent to all {contacts.length} emergency contacts.
        </p>
      </div>
    </div>
  );
};
