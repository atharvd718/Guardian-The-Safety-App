import React, { useState } from 'react';
import { Phone, Calendar, Shield, CheckCircle2, AlertCircle } from 'lucide-react';
import { StorageService } from '../../lib/storage';

interface RegisterDetailViewProps {
  initialData: { name: string; email: string; pass: string };
  onRegisterSuccess: () => void;
  onBack: () => void;
}

export const RegisterDetailView: React.FC<RegisterDetailViewProps> = ({
  initialData,
  onRegisterSuccess,
  onBack,
}) => {
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [acceptedPolicy, setAcceptedPolicy] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!phone.trim() || !dob.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    if (phone.replace(/\D/g, '').length !== 10) {
      setError('Enter a valid 10-digit phone number.');
      return;
    }

    if (!acceptedPolicy) {
      setError('Accept our Privacy Policies to Continue.');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      StorageService.setCurrentUser({
        uid: 'usr_' + Date.now(),
        name: initialData.name,
        email: initialData.email,
        phone: phone.replace(/\D/g, ''),
        dob,
      });

      setLoading(false);
      onRegisterSuccess();
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between max-w-md mx-auto p-6 shadow-xl border-x border-slate-200">
      {/* Top Header */}
      <div className="pt-6 pb-2 text-center space-y-3">
        <div className="w-16 h-16 rounded-2xl bg-rose-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-rose-200">
          <Shield className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900">Safety Profile</h1>
          <p className="text-sm text-slate-500">Step 2: Emergency Contact Info</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleRegister} className="space-y-4 my-auto">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-rose-700 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            Phone Number (10 digits)
          </label>
          <div className="relative">
            <Phone className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="9876543210"
              maxLength={10}
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition"
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            Date of Birth
          </label>
          <div className="relative">
            <Calendar className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition"
              required
            />
          </div>
        </div>

        {/* Checkbox */}
        <label className="flex items-start gap-3 p-3 bg-white border border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-50 transition">
          <input
            type="checkbox"
            checked={acceptedPolicy}
            onChange={(e) => setAcceptedPolicy(e.target.checked)}
            className="w-5 h-5 mt-0.5 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
          />
          <span className="text-xs text-slate-600 leading-relaxed">
            I agree to Guardian's Safety Terms & Privacy Policy to enable emergency location sharing and broadcast SMS alerts.
          </span>
        </label>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onBack}
            className="w-1/3 py-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-2xl transition"
          >
            Back
          </button>

          <button
            type="submit"
            disabled={loading}
            className="w-2/3 py-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl shadow-lg shadow-rose-200 transition active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading ? (
              <span className="text-sm">Creating Profile...</span>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>Finish & Register</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Footer */}
      <div className="text-center py-4 text-xs text-slate-400 border-t border-slate-200/80">
        Guardian Safety App • Privacy Protected
      </div>
    </div>
  );
};
