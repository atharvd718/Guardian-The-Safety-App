import React, { useState, useEffect } from 'react';
import { ArrowLeft, UserPlus, Trash2, Phone, Heart, Users, AlertCircle } from 'lucide-react';
import { StorageService } from '../lib/storage';
import { ContactNew } from '../types';

interface AddedContactsViewProps {
  onBack: () => void;
  onNavigateAdd: () => void;
}

export const AddedContactsView: React.FC<AddedContactsViewProps> = ({
  onBack,
  onNavigateAdd,
}) => {
  const [contacts, setContacts] = useState<ContactNew[]>([]);

  useEffect(() => {
    setContacts(StorageService.getContacts());
  }, []);

  const handleDelete = (phone: string, name: string) => {
    const confirmDelete = window.confirm(`Are you sure you want to remove ${name}?`);
    if (confirmDelete) {
      StorageService.removeContact(phone);
      setContacts(StorageService.getContacts());
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col max-w-md mx-auto shadow-2xl border-x border-slate-200 relative pb-20">
      {/* Top Bar */}
      <div className="bg-rose-600 text-white p-5 flex items-center justify-between sticky top-0 z-20 shadow-md">
        <button
          onClick={onBack}
          className="p-2 hover:bg-white/10 rounded-full transition"
          aria-label="Back"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="font-extrabold text-lg text-white">Emergency Contacts</h1>
        <div className="w-8"></div>
      </div>

      <div className="p-5 flex-1 space-y-4">
        {/* Header summary */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="font-extrabold text-slate-900 text-base">Trusted Contacts</h2>
            <p className="text-xs text-slate-500">
              {contacts.length} contact{contacts.length === 1 ? '' : 's'} configured
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 bg-rose-50 text-rose-600 rounded-full">
            Active Shield
          </span>
        </div>

        {/* List or Empty State */}
        {contacts.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-4 my-8">
            <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-10 h-10" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">No Contacts Added</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Add emergency contacts so Guardian can alert them automatically during an SOS trigger.
              </p>
            </div>
            <button
              onClick={onNavigateAdd}
              className="py-3 px-6 bg-rose-600 text-white font-bold rounded-2xl text-sm hover:bg-rose-700 transition inline-flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add First Contact</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {contacts.map((contact, idx) => (
              <div
                key={contact.friendPhone + idx}
                className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between hover:border-rose-200 transition"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 text-white flex items-center justify-center font-black text-lg shadow-md shadow-rose-200">
                    {contact.friendName.charAt(0).toUpperCase()}
                  </div>

                  <div className="space-y-0.5">
                    <h3 className="font-extrabold text-slate-900 text-sm">
                      {contact.friendName}
                    </h3>
                    <p className="text-xs font-medium text-slate-500 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-rose-500" />
                      <span>+91 {contact.friendPhone}</span>
                    </p>
                    {contact.friendRelation && (
                      <span className="inline-block text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                        {contact.friendRelation}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(contact.friendPhone, contact.friendName)}
                  className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition"
                  title="Remove Contact"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button (FAB) matching fabAddContacts */}
      <button
        onClick={onNavigateAdd}
        className="fixed bottom-6 right-6 z-30 w-14 h-14 bg-rose-600 hover:bg-rose-700 text-white rounded-full shadow-2xl shadow-rose-500/50 flex items-center justify-center transition active:scale-95"
        title="Add New Contact"
      >
        <UserPlus className="w-6 h-6" />
      </button>
    </div>
  );
};
