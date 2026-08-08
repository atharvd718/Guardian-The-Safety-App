import React, { useEffect } from 'react';
import { Shield, HeartPulse } from 'lucide-react';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 2400);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-500 via-pink-600 to-rose-700 flex flex-col items-center justify-between p-8 text-white relative overflow-hidden">
      {/* Decorative Background Shapes */}
      <div className="absolute top-[-100px] left-[-100px] w-80 h-80 rounded-full bg-white/10 blur-2xl pointer-events-none"></div>
      <div className="absolute bottom-[-100px] right-[-100px] w-96 h-96 rounded-full bg-pink-400/20 blur-3xl pointer-events-none"></div>

      <div className="flex-1 flex flex-col items-center justify-center text-center z-10 space-y-6">
        <div className="relative">
          <div className="w-28 h-28 rounded-3xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-2xl animate-pulse">
            <Shield className="w-16 h-16 text-white" />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-white text-rose-600 p-2 rounded-2xl shadow-lg">
            <HeartPulse className="w-6 h-6" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tight drop-shadow-xs">GUARDIAN</h1>
          <p className="text-rose-100 font-medium tracking-wide text-sm uppercase">The Safety App</p>
        </div>
      </div>

      <div className="z-10 text-center space-y-3 pb-6">
        <div className="flex items-center justify-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-white animate-bounce"></div>
          <div className="w-2 h-2 rounded-full bg-white animate-bounce [animation-delay:0.2s]"></div>
          <div className="w-2 h-2 rounded-full bg-white animate-bounce [animation-delay:0.4s]"></div>
        </div>
        <p className="text-xs text-rose-100/80 font-medium">Your 24/7 Personal Emergency Shield</p>
      </div>
    </div>
  );
};
