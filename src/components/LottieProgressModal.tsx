import React from 'react';
import { Loader2, ShieldAlert } from 'lucide-react';

interface LottieProgressModalProps {
  isOpen: boolean;
  message: string;
}

export const LottieProgressModal: React.FC<LottieProgressModalProps> = ({ isOpen, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 transition-opacity">
      <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full text-center flex flex-col items-center space-y-4 border border-rose-100 animate-in fade-in zoom-in-95 duration-200">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 animate-pulse">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <Loader2 className="w-20 h-20 text-rose-500 animate-spin absolute" style={{ animationDuration: '3s' }} />
        </div>
        
        <div className="space-y-1">
          <h3 className="font-bold text-slate-800 text-lg">Guardian Safety</h3>
          <p className="text-sm font-medium text-slate-600 min-h-[40px] flex items-center justify-center px-2">
            {message || 'Please wait...'}
          </p>
        </div>

        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
          <div className="bg-rose-500 h-full w-2/3 animate-pulse rounded-full"></div>
        </div>
      </div>
    </div>
  );
};
