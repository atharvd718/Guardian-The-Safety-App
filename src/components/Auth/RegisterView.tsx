import React, { useState } from 'react';
import { User, Mail, Lock, ArrowRight, Shield, AlertCircle } from 'lucide-react';

interface RegisterViewProps {
  onNext: (data: { name: string; email: string; pass: string }) => void;
  onNavigateLogin: () => void;
}

export const RegisterView: React.FC<RegisterViewProps> = ({
  onNext,
  onNavigateLogin,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !email.trim() || !pass.trim()) {
      setError('Please fill in all the fields.');
      return;
    }

    if (pass.length < 6) {
      setError('Password must have at least 6 characters.');
      return;
    }

    onNext({ name: name.trim(), email: email.trim(), pass: pass.trim() });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between max-w-md mx-auto p-6 shadow-xl border-x border-slate-200">
      {/* Top Header */}
      <div className="pt-6 pb-2 text-center space-y-3">
        <div className="w-16 h-16 rounded-2xl bg-rose-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-rose-200">
          <Shield className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900">Create Account</h1>
          <p className="text-sm text-slate-500">Step 1: Personal Credentials</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4 my-auto">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-rose-700 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            Full Name
          </label>
          <div className="relative">
            <User className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Olivia Bennett"
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition"
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            Email Address
          </label>
          <div className="relative">
            <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="olivia@example.com"
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition"
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            Password (6+ chars)
          </label>
          <div className="relative">
            <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl shadow-lg shadow-rose-200 transition active:scale-[0.98] flex items-center justify-center gap-2 mt-2"
        >
          <span>Continue to Details</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </form>

      {/* Switch to Login */}
      <div className="text-center py-4 border-t border-slate-200/80">
        <p className="text-sm text-slate-600">
          Already have an account?{' '}
          <button
            onClick={onNavigateLogin}
            className="font-bold text-rose-600 hover:text-rose-700 underline underline-offset-2 ml-1"
          >
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
};
