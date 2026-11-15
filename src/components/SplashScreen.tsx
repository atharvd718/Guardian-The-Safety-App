import React, { useEffect } from 'react';
import { GuardianLogo } from './GuardianLogo';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 2200);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#A6184E] via-[#C2185B] to-[#E8437A] flex flex-col items-center justify-between p-8 text-white relative overflow-hidden">
      <div className="absolute top-[-100px] left-[-100px] w-80 h-80 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      <div className="absolute bottom-[-100px] right-[-100px] w-96 h-96 rounded-full bg-rose-300/20 blur-3xl pointer-events-none" />

      <div className="flex-1 flex flex-col items-center justify-center text-center z-10 space-y-6">
        <div className="p-2 rounded-[32px] bg-white/15 backdrop-blur-md border border-white/25 shadow-2xl">
          <GuardianLogo size={112} />
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-serif font-bold tracking-tight drop-shadow-xs">
            GUARDIAN
          </h1>
          <p className="text-rose-100 font-medium tracking-widest text-xs uppercase">
            Women&apos;s Personal Safety Shield
          </p>
        </div>
      </div>

      <div className="z-10 text-center space-y-3 pb-6">
        <div className="flex items-center justify-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-white animate-bounce" />
          <div className="w-2 h-2 rounded-full bg-white animate-bounce [animation-delay:0.2s]" />
          <div className="w-2 h-2 rounded-full bg-white animate-bounce [animation-delay:0.4s]" />
        </div>
        <p className="text-xs text-rose-100/90 font-medium">
          Your 24/7 Personal Emergency Companion
        </p>
      </div>
    </div>
  );
};
