import React, { useState } from 'react';
import { Mic, MapPin, ShieldAlert, ArrowRight, Check } from 'lucide-react';

interface OnboardingCarouselProps {
  onComplete: () => void;
}

const SCREENS = [
  {
    icon: Mic,
    title: 'Record Emergency Audio',
    subtitle: 'Voice Emergency Capture',
    description:
      'Guardian gives you the ability to record your Voice Recording and send it seamlessly to your loved one\'s in case of Emergency.',
    badge: 'Audio Shield',
    color: 'from-rose-500 to-pink-600',
    iconBg: 'bg-rose-100 text-rose-600',
  },
  {
    icon: MapPin,
    title: 'Live Location Sharing',
    subtitle: 'Instant GPS Tracker',
    description:
      'Guardian allows you to share your current location to your emergency contacts through text SMS just by clicking a button.',
    badge: 'Real-time GPS',
    color: 'from-pink-500 to-rose-600',
    iconBg: 'bg-pink-100 text-pink-600',
  },
  {
    icon: ShieldAlert,
    title: 'Instant SOS Broadcast',
    subtitle: 'One-Tap Panic Alert',
    description:
      'Guardian gives you the power to alert your loved one\'s by sending your current location and audio recording whenever you feel unsafe.',
    badge: 'One-Tap Emergency',
    color: 'from-rose-600 to-rose-700',
    iconBg: 'bg-rose-100 text-rose-700',
  },
];

export const OnboardingCarousel: React.FC<OnboardingCarouselProps> = ({ onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = () => {
    if (currentIndex < SCREENS.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      onComplete();
    }
  };

  const current = SCREENS[currentIndex];
  const IconComponent = current.icon;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between max-w-md mx-auto relative overflow-hidden shadow-xl border-x border-slate-200">
      {/* Top Header */}
      <div className="p-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-rose-600 flex items-center justify-center text-white font-black text-sm">
            G
          </div>
          <span className="font-bold text-slate-800 text-sm tracking-wide">GUARDIAN</span>
        </div>

        <button
          onClick={onComplete}
          className="text-xs font-bold text-slate-500 hover:text-slate-800 uppercase tracking-wider px-3 py-1.5 rounded-full hover:bg-slate-200/60 transition"
        >
          Skip
        </button>
      </div>

      {/* Slide Content */}
      <div className="px-6 flex-1 flex flex-col items-center justify-center text-center space-y-6 my-auto">
        {/* Visual Hero Container */}
        <div className="relative w-64 h-64 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-rose-100 to-pink-50 animate-pulse"></div>
          <div className="w-48 h-48 rounded-3xl bg-white shadow-xl flex flex-col items-center justify-center p-6 border border-slate-100 relative z-10 transition-transform duration-300 transform scale-105">
            <div className={`w-20 h-20 rounded-2xl ${current.iconBg} flex items-center justify-center mb-3 shadow-inner`}>
              <IconComponent className="w-10 h-10" />
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
              {current.badge}
            </span>
          </div>
        </div>

        <div className="space-y-3 max-w-xs">
          <p className="text-xs font-bold text-rose-600 tracking-wider uppercase">
            {current.subtitle}
          </p>
          <h2 className="text-2xl font-extrabold text-slate-900 leading-tight">
            {current.title}
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed font-normal">
            {current.description}
          </p>
        </div>
      </div>

      {/* Bottom Action Controls */}
      <div className="p-6 space-y-6 z-10">
        {/* Indicators */}
        <div className="flex items-center justify-center gap-2">
          {SCREENS.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                idx === currentIndex ? 'w-8 bg-rose-600' : 'w-2.5 bg-slate-300'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>

        {/* Action Button */}
        <button
          onClick={handleNext}
          className="w-full py-4 px-6 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white font-bold rounded-2xl shadow-lg shadow-rose-200 transition active:scale-[0.98] flex items-center justify-center gap-2"
        >
          {currentIndex === SCREENS.length - 1 ? (
            <>
              <span>Get Started</span>
              <Check className="w-5 h-5" />
            </>
          ) : (
            <>
              <span>Next</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
