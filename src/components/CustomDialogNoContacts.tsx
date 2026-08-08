import React from 'react';
import { UserPlus, AlertCircle, X } from 'lucide-react';

interface CustomDialogNoContactsProps {
  isOpen: boolean;
  onAddContacts: () => void;
  onClose: () => void;
}

export const CustomDialogNoContacts: React.FC<CustomDialogNoContactsProps> = ({
  isOpen,
  onAddContacts,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full text-center flex flex-col items-center space-y-4 border border-amber-100 relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
          <AlertCircle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h3 className="font-bold text-slate-900 text-xl">No Emergency Contacts</h3>
          <p className="text-sm text-slate-600">
            You haven't added any emergency contacts yet. For SOS alerts and location sharing to work, please add at least one trusted contact.
          </p>
        </div>

        <div className="w-full flex flex-col gap-2 pt-2">
          <button
            onClick={onAddContacts}
            className="w-full py-3.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl shadow-lg shadow-rose-200 transition active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <UserPlus className="w-5 h-5" />
            Add Emergency Contacts
          </button>
          
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 text-slate-500 hover:text-slate-700 font-semibold text-sm transition"
          >
            Remind Me Later
          </button>
        </div>
      </div>
    </div>
  );
};
