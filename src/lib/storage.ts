import { Users, ContactNew, AudioRecordItem, SmsLogItem } from '../types';
import { FirebaseService, auth } from './firebase';

const STORAGE_KEYS = {
  USER: 'guardian_user',
  ONBOARDING_FINISHED: 'guardian_onboarding_finished',
  CONTACTS: 'guardian_contacts',
  AUDIO_RECORDS: 'guardian_audio_records',
  SMS_LOGS: 'guardian_sms_logs',
};

// Seed initial default user
const DEFAULT_USER: Users = {
  uid: 'usr_default_101',
  name: 'Olivia',
  email: 'olivia.guardian@example.com',
  phone: '9876543210',
  dob: '12/05/2000',
};

// Seed sample emergency contacts
const DEFAULT_CONTACTS: ContactNew[] = [
  {
    friendName: 'Mom (Sarah)',
    friendPhone: '9876500001',
    friendRelation: 'Family',
  },
  {
    friendName: 'Alex Smith',
    friendPhone: '9876500002',
    friendRelation: 'Friend',
  },
  {
    friendName: 'John (Brother)',
    friendPhone: '9876500003',
    friendRelation: 'Family',
  },
];

export const StorageService = {
  // Onboarding Status
  isOnboardingFinished(): boolean {
    return localStorage.getItem(STORAGE_KEYS.ONBOARDING_FINISHED) === 'true';
  },

  setOnboardingFinished(finished: boolean): void {
    localStorage.setItem(STORAGE_KEYS.ONBOARDING_FINISHED, finished ? 'true' : 'false');
  },

  // User Authentication / Profile
  getCurrentUser(): Users | null {
    const data = localStorage.getItem(STORAGE_KEYS.USER);
    if (!data) {
      this.setCurrentUser(DEFAULT_USER);
      return DEFAULT_USER;
    }
    try {
      return JSON.parse(data);
    } catch {
      return DEFAULT_USER;
    }
  },

  setCurrentUser(user: Users): void {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    if (auth.currentUser) {
      FirebaseService.saveUserProfile(user).catch(console.error);
    }
  },

  logoutUser(): void {
    localStorage.removeItem(STORAGE_KEYS.USER);
    FirebaseService.logout().catch(console.error);
  },

  // Emergency Contacts
  getContacts(): ContactNew[] {
    const data = localStorage.getItem(STORAGE_KEYS.CONTACTS);
    if (!data) {
      this.setContacts(DEFAULT_CONTACTS);
      return DEFAULT_CONTACTS;
    }
    try {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : DEFAULT_CONTACTS;
    } catch {
      return DEFAULT_CONTACTS;
    }
  },

  setContacts(contacts: ContactNew[]): void {
    localStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(contacts));
  },

  addContact(contact: ContactNew): void {
    const contacts = this.getContacts();
    const filtered = contacts.filter((c) => c.friendPhone !== contact.friendPhone);
    const updated = [contact, ...filtered];
    this.setContacts(updated);

    if (auth.currentUser) {
      FirebaseService.addContact(auth.currentUser.uid, contact).catch(console.error);
    }
  },

  removeContact(friendPhone: string): void {
    const contacts = this.getContacts();
    const updated = contacts.filter((c) => c.friendPhone !== friendPhone);
    this.setContacts(updated);

    if (auth.currentUser) {
      FirebaseService.deleteContact(auth.currentUser.uid, friendPhone).catch(console.error);
    }
  },

  // Audio Recordings Log
  getAudioRecordings(): AudioRecordItem[] {
    const data = localStorage.getItem(STORAGE_KEYS.AUDIO_RECORDS);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  addAudioRecording(recording: AudioRecordItem): void {
    const records = this.getAudioRecordings();
    this.saveAudioRecordings([recording, ...records]);

    if (auth.currentUser) {
      FirebaseService.addAudioRecording(auth.currentUser.uid, recording).catch(console.error);
    }
  },

  saveAudioRecordings(recordings: AudioRecordItem[]): void {
    localStorage.setItem(STORAGE_KEYS.AUDIO_RECORDS, JSON.stringify(recordings));
  },

  removeAudioRecording(id: string): void {
    const records = this.getAudioRecordings();
    this.saveAudioRecordings(records.filter((r) => r.id !== id));
  },

  // Emergency SMS History Log
  getSmsLogs(): SmsLogItem[] {
    const data = localStorage.getItem(STORAGE_KEYS.SMS_LOGS);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  addSmsLog(log: SmsLogItem): void {
    const logs = this.getSmsLogs();
    localStorage.setItem(STORAGE_KEYS.SMS_LOGS, JSON.stringify([log, ...logs]));

    if (auth.currentUser) {
      FirebaseService.addSmsLog(auth.currentUser.uid, log).catch(console.error);
    }
  },
};

