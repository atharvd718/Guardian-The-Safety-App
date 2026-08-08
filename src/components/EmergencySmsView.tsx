import React, { useState } from 'react';
import { ArrowLeft, Send, Users, CheckCircle2, AlertCircle, History } from 'lucide-react';
import { StorageService } from '../lib/storage';
import { ScreenType } from '../types';

interface EmergencySmsViewProps {
  onBack: () => void;
  onNavigate: (screen: ScreenType) => void;
}

export const EmergencySmsView: React.FC<EmergencySmsViewProps> = ({ onBack, onNavigate }) => {
  const user = StorageService.getCurrentUser();
  const contacts = StorageService.getContacts();
  const smsLogs = StorageService.getSmsLogs();

  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [toast, setToast] = useState('');

  const handleSendSms = (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) {
      alert('Please type an emergency message to send.');
      return;
    }

    if (contacts.length === 0) {
      alert('No emergency contacts added! Please add contacts first.');
      onNavigate('add_contacts');
      return;
    }

    setSending(true);
    const total = contacts.length;
    let count = 0;

    const interval = setInterval(() => {
      count++;
      setStatusMsg(`Sending SMS... (${count} / ${total})`);

      if (count >= total) {
        clearInterval(interval);
        
        // Boilerplate format matching EmergencySMSFragment.kt
        const finalMsg = `${message}\nFrom: ${user?.name || 'User'} (${user?.phone || ''})\n\nSent via Guardian - The Safety App`;

        StorageService.addSmsLog({
          id: 'sms_' + Date.now(),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          recipients: contacts.map((c) => `${c.friendName} (${c.friendPhone})`),
          message: finalMsg,
          status: 'Sent',
        });

        setTimeout(() => {
          setSending(false);
          setMessage('');
          setStatusMsg('');
          setToast('All messages sent successfully!');
          setTimeout(() => setToast(''), 4000);
        }, 600);
      }
    }, 500);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col max-w-md mx-auto shadow-2xl border-x border-slate-200">
      {/* Top Navigation Bar */}
      <div className="bg-rose-600 text-white p-5 flex items-center justify-between sticky top-0 z-20 shadow-md">
        <button
          onClick={onBack}
          className="p-2 hover:bg-white/10 rounded-full transition"
          aria-label="Back to home"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="font-extrabold text-lg text-white">Emergency SMS</h1>
        <div className="w-8"></div>
      </div>

      <div className="p-5 flex-1 space-y-6">
        {toast && (
          <div className="p-3.5 bg-emerald-600 text-white rounded-2xl shadow-lg flex items-center gap-3 animate-in fade-in text-xs font-bold">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>{toast}</span>
          </div>
        )}

        {/* Recipients Summary */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Recipients</p>
              <p className="text-sm font-extrabold text-slate-900">
                {contacts.length} Emergency Contacts
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('added_contacts')}
            className="text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-xl transition"
          >
            Edit List
          </button>
        </div>

        {/* SMS Form */}
        <form onSubmit={handleSendSms} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Emergency Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your emergency distress note here (e.g. Please help, I am trapped near the station and need urgent assistance!)..."
              rows={5}
              className="w-full p-4 bg-white border border-slate-200 rounded-3xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition shadow-inner resize-none"
              required
            ></textarea>
          </div>

          {/* Message Preview Box */}
          <div className="bg-slate-100 p-3.5 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1">
            <span className="font-bold text-slate-700 block">Automatic Footer Tag:</span>
            <p className="italic">
              From: {user?.name || 'User'} ({user?.phone || '9876543210'})
            </p>
            <p className="text-rose-600 font-medium">Sent via Guardian - The Safety App</p>
          </div>

          <button
            type="submit"
            disabled={sending}
            className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl shadow-lg shadow-rose-200 transition active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {sending ? (
              <span className="text-sm">{statusMsg || 'Sending SMS...'}</span>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>Send Emergency SMS</span>
              </>
            )}
          </button>
        </form>

        {/* Recent SMS Dispatch History */}
        <div className="space-y-3 pt-4 border-t border-slate-200">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
            <History className="w-4 h-4 text-rose-600" />
            <span>Recent Broadcast Logs</span>
          </div>

          {smsLogs.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No broadcast logs yet.</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {smsLogs.map((log) => (
                <div key={log.id} className="bg-white p-3 rounded-2xl border border-slate-200 space-y-1 text-xs">
                  <div className="flex items-center justify-between font-bold text-slate-800">
                    <span className="text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Sent
                    </span>
                    <span className="text-slate-400 text-[10px]">{log.timestamp}</span>
                  </div>
                  <p className="text-slate-600 line-clamp-2">{log.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
