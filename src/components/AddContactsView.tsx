import React, { useState } from 'react';
import { ArrowLeft, UserPlus, Phone, Heart, Search, CheckCircle2, AlertCircle } from 'lucide-react';
import { StorageService } from '../lib/storage';
import { ContactInfo } from '../types';

interface AddContactsViewProps {
  onBack: () => void;
}

const DEVICE_CONTACTS_PRESETS: ContactInfo[] = [
  { name: 'Mom (Sarah)', number: '9876500001' },
  { name: 'Alex Smith (Friend)', number: '9876500002' },
  { name: 'John Bennett (Brother)', number: '9876500003' },
  { name: 'David (Partner)', number: '9876500004' },
  { name: 'Dr. Anita Roy', number: '9876500005' },
  { name: 'Officer Sharma (Local Guard)', number: '9876500006' },
];

export const AddContactsView: React.FC<AddContactsViewProps> = ({ onBack }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relation, setRelation] = useState('Family');
  const [showDeviceContacts, setShowDeviceContacts] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const handleSaveContact = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !phone.trim()) {
      setError('Please fill in both Name and Phone Number.');
      return;
    }

    const cleanedPhone = phone.replace(/\D/g, '');
    if (cleanedPhone.length !== 10) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }

    StorageService.addContact({
      friendName: name.trim(),
      friendPhone: cleanedPhone,
      friendRelation: relation,
    });

    setToast(`${name.trim()} added to Emergency Contacts!`);
    setName('');
    setPhone('');
    setTimeout(() => {
      onBack();
    }, 1200);
  };

  const handlePickPreset = (preset: ContactInfo) => {
    setName(preset.name);
    setPhone(preset.number);
    setShowDeviceContacts(false);
  };

  const filteredPresets = DEVICE_CONTACTS_PRESETS.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.number.includes(searchQuery)
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col max-w-md mx-auto shadow-2xl border-x border-slate-200">
      {/* Top Bar */}
      <div className="bg-rose-600 text-white p-5 flex items-center justify-between sticky top-0 z-20 shadow-md">
        <button
          onClick={onBack}
          className="p-2 hover:bg-white/10 rounded-full transition"
          aria-label="Back"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="font-extrabold text-lg text-white">Add Emergency Contact</h1>
        <div className="w-8"></div>
      </div>

      <div className="p-5 flex-1 space-y-5">
        {toast && (
          <div className="p-3.5 bg-emerald-600 text-white rounded-2xl shadow-lg flex items-center gap-3 animate-in fade-in text-xs font-bold">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>{toast}</span>
          </div>
        )}

        {/* Option to fetch device contacts */}
        <div className="bg-gradient-to-r from-rose-500 to-pink-600 text-white p-4 rounded-3xl shadow-md flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-sm">Device Phonebook</h3>
            <p className="text-xs text-rose-100">Pick quickly from phone contacts</p>
          </div>
          <button
            onClick={() => setShowDeviceContacts(!showDeviceContacts)}
            className="py-2 px-4 bg-white text-rose-600 hover:bg-rose-50 font-bold rounded-2xl text-xs shadow-sm transition"
          >
            {showDeviceContacts ? 'Hide List' : 'Browse Contacts'}
          </button>
        </div>

        {/* Device contacts picker drawer */}
        {showDeviceContacts && (
          <div className="bg-white p-4 rounded-3xl border border-slate-200 space-y-3 animate-in fade-in">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search phonebook..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {filteredPresets.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => handlePickPreset(preset)}
                  className="w-full p-2.5 hover:bg-rose-50 rounded-2xl text-left flex items-center justify-between text-xs transition group"
                >
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-800 group-hover:text-rose-600 block">
                      {preset.name}
                    </span>
                    <span className="text-slate-400 font-mono text-[11px]">
                      +91 {preset.number}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-rose-600 bg-rose-100 px-2.5 py-1 rounded-lg">
                    Select
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Manual Input Form */}
        <form onSubmit={handleSaveContact} className="bg-white p-5 rounded-3xl border border-slate-200 space-y-4 shadow-sm">
          <h2 className="font-extrabold text-slate-900 text-base">Contact Details</h2>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-rose-700 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Contact Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sarah Bennett (Mom)"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Phone Number (10 digits)
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="9876543210"
                maxLength={10}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Relationship
            </label>
            <select
              value={relation}
              onChange={(e) => setRelation(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <option value="Family">Family</option>
              <option value="Friend">Friend</option>
              <option value="Partner">Partner</option>
              <option value="Neighbor">Neighbor</option>
              <option value="Colleague">Colleague</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl shadow-lg shadow-rose-200 transition active:scale-[0.98] flex items-center justify-center gap-2 pt-3"
          >
            <UserPlus className="w-5 h-5" />
            <span>Save Emergency Contact</span>
          </button>
        </form>
      </div>
    </div>
  );
};
