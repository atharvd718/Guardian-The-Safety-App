import React, { useState } from 'react';
import { Mail, Lock, LogIn, Shield, AlertCircle } from 'lucide-react';
import { StorageService } from '../../lib/storage';
import { FirebaseService } from '../../lib/firebase';

interface LoginViewProps {
  onLoginSuccess: () => void;
  onNavigateRegister: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLoginSuccess,
  onNavigateRegister,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const user = await FirebaseService.loginWithGoogle();
      StorageService.setCurrentUser(user);
      onLoginSuccess();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const user = await FirebaseService.loginAnonymously();
      StorageService.setCurrentUser(user);
      onLoginSuccess();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to sign in anonymously');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const currentUser = StorageService.getCurrentUser();
      // If user exists or fallback match
      if (currentUser && currentUser.email.toLowerCase() === email.trim().toLowerCase()) {
        onLoginSuccess();
      } else {
        // Create or authenticate
        const newUser = {
          uid: 'usr_' + Date.now(),
          name: email.split('@')[0] || 'User',
          email: email.trim(),
          phone: '9876543210',
          dob: '01/01/2000',
        };
        StorageService.setCurrentUser(newUser);
        FirebaseService.saveUserProfile(newUser).catch(console.error);
        onLoginSuccess();
      }
      setLoading(false);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between max-w-md mx-auto p-6 shadow-xl border-x border-slate-200">
      {/* Top Graphic Header */}
      <div className="pt-8 pb-4 text-center space-y-4">
        <div className="w-20 h-20 rounded-3xl bg-rose-600 text-white flex items-center justify-center mx-auto shadow-xl shadow-rose-200">
          <Shield className="w-10 h-10" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900">Welcome Back</h1>
          <p className="text-sm text-slate-500">Sign in to your Guardian Emergency Shield</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleLogin} className="space-y-4 my-auto">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-rose-700 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

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
            Password
          </label>
          <div className="relative">
            <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl shadow-lg shadow-rose-200 transition active:scale-[0.98] flex items-center justify-center gap-2 mt-2 disabled:opacity-70"
        >
          {loading ? (
            <span className="text-sm">Signing In...</span>
          ) : (
            <>
              <LogIn className="w-5 h-5" />
              <span>Sign In</span>
            </>
          )}
        </button>

        <div className="relative my-3 flex items-center justify-center">
          <div className="border-t border-slate-200 w-full"></div>
          <span className="bg-slate-50 px-3 text-xs text-slate-400 uppercase font-bold tracking-wider relative">OR</span>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full py-3 bg-white hover:bg-slate-100 text-slate-800 font-bold rounded-2xl border border-slate-300 shadow-sm transition active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-70"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span className="text-sm">Sign in with Google</span>
        </button>

        <button
          type="button"
          onClick={handleGuestLogin}
          disabled={loading}
          className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-2xl transition text-xs flex items-center justify-center gap-2 disabled:opacity-70"
        >
          <span>Continue as Guest (Anonymous)</span>
        </button>
      </form>

      {/* Footer Switch */}
      <div className="text-center py-4 border-t border-slate-200/80 space-y-2">
        <p className="text-sm text-slate-600">
          Don't have an account?{' '}
          <button
            onClick={onNavigateRegister}
            className="font-bold text-rose-600 hover:text-rose-700 underline underline-offset-2 ml-1"
          >
            Sign Up
          </button>
        </p>
      </div>
    </div>
  );
};
