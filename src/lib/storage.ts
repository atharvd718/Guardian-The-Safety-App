import { Users, ContactNew, AudioRecordItem, SmsLogItem, UnsafeZone, GeofenceEventItem, SafetyIdProfile } from '../types';
import { FirebaseService, auth } from './firebase';

const STORAGE_KEYS = {
  USER: 'guardian_user',
  ONBOARDING_FINISHED: 'guardian_onboarding_finished',
  CONTACTS: 'guardian_contacts',
  AUDIO_RECORDS: 'guardian_audio_records',
  SMS_LOGS: 'guardian_sms_logs',
  UNSAFE_ZONES: 'guardian_unsafe_zones',
  GEOFENCE_EVENTS: 'guardian_geofence_events',
  GEOFENCE_MONITORING: 'guardian_geofence_monitoring',
  SAFETY_ID: 'guardian_safety_id',
};

const DEFAULT_UNSAFE_ZONES: UnsafeZone[] = [
  {
    id: 'zone_default_1',
    name: 'East Underpass Corridor',
    lat: 28.5372,
    lng: 77.3935,
    radiusMeters: 300,
    notifyOnEnter: true,
    notifyOnExit: true,
    enabled: true,
    notes: 'Poorly lit pedestrian underpass after 8 PM',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'zone_default_2',
    name: 'Old Industrial Yard',
    lat: 28.5325,
    lng: 77.3878,
    radiusMeters: 450,
    notifyOnEnter: true,
    notifyOnExit: false,
    enabled: true,
    notes: 'Isolated stretch with sparse foot traffic',
    createdAt: new Date().toISOString(),
  },
];

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
    if (auth?.currentUser) {
      FirebaseService.saveUserProfile(user).catch(console.error);
    }
  },

  logoutUser(): void {
    localStorage.removeItem(STORAGE_KEYS.USER);
    if (auth) {
      FirebaseService.logout().catch(console.error);
    }
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

    if (auth?.currentUser) {
      FirebaseService.addContact(auth.currentUser.uid, contact).catch(console.error);
    }
  },

  removeContact(friendPhone: string): void {
    const contacts = this.getContacts();
    const updated = contacts.filter((c) => c.friendPhone !== friendPhone);
    this.setContacts(updated);

    if (auth?.currentUser) {
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

    if (auth?.currentUser) {
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

    if (auth?.currentUser) {
      FirebaseService.addSmsLog(auth.currentUser.uid, log).catch(console.error);
    }
  },

  // Unsafe Geofence Zones
  getUnsafeZones(): UnsafeZone[] {
    const data = localStorage.getItem(STORAGE_KEYS.UNSAFE_ZONES);
    if (!data) {
      this.setUnsafeZones(DEFAULT_UNSAFE_ZONES);
      return DEFAULT_UNSAFE_ZONES;
    }
    try {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : DEFAULT_UNSAFE_ZONES;
    } catch {
      return DEFAULT_UNSAFE_ZONES;
    }
  },

  setUnsafeZones(zones: UnsafeZone[]): void {
    localStorage.setItem(STORAGE_KEYS.UNSAFE_ZONES, JSON.stringify(zones));
  },

  addUnsafeZone(zone: UnsafeZone): UnsafeZone[] {
    const zones = this.getUnsafeZones();
    const updated = [zone, ...zones];
    this.setUnsafeZones(updated);
    return updated;
  },

  updateUnsafeZone(updatedZone: UnsafeZone): UnsafeZone[] {
    const zones = this.getUnsafeZones();
    const updated = zones.map((z) => (z.id === updatedZone.id ? updatedZone : z));
    this.setUnsafeZones(updated);
    return updated;
  },

  removeUnsafeZone(zoneId: string): UnsafeZone[] {
    const zones = this.getUnsafeZones();
    const updated = zones.filter((z) => z.id !== zoneId);
    this.setUnsafeZones(updated);
    return updated;
  },

  // Geofence Monitoring State
  isGeofenceMonitoringEnabled(): boolean {
    const val = localStorage.getItem(STORAGE_KEYS.GEOFENCE_MONITORING);
    return val === null ? true : val === 'true';
  },

  setGeofenceMonitoringEnabled(enabled: boolean): void {
    localStorage.setItem(STORAGE_KEYS.GEOFENCE_MONITORING, enabled ? 'true' : 'false');
  },

  // Silent Geofence Alert Events
  getGeofenceEvents(): GeofenceEventItem[] {
    const data = localStorage.getItem(STORAGE_KEYS.GEOFENCE_EVENTS);
    if (!data) return [];
    try {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  addGeofenceEvent(event: GeofenceEventItem): GeofenceEventItem[] {
    const events = this.getGeofenceEvents();
    const updated = [event, ...events].slice(0, 50);
    localStorage.setItem(STORAGE_KEYS.GEOFENCE_EVENTS, JSON.stringify(updated));
    return updated;
  },

  clearGeofenceEvents(): void {
    localStorage.setItem(STORAGE_KEYS.GEOFENCE_EVENTS, JSON.stringify([]));
  },

  // Emergency Medical & Safety ID
  getSafetyIdProfile(): SafetyIdProfile {
    const user = this.getCurrentUser();
    const fallback: SafetyIdProfile = {
      fullName: user?.name || 'Olivia',
      bloodGroup: 'O+',
      allergies: 'None reported',
      medicalNotes: 'No chronic conditions listed',
      safeAddress: 'Home — Update your safe address',
      emergencyNote: 'Please contact my listed emergency contacts immediately.',
    };
    const data = localStorage.getItem(STORAGE_KEYS.SAFETY_ID);
    if (!data) return fallback;
    try {
      return { ...fallback, ...JSON.parse(data) };
    } catch {
      return fallback;
    }
  },

  saveSafetyIdProfile(profile: SafetyIdProfile): void {
    localStorage.setItem(STORAGE_KEYS.SAFETY_ID, JSON.stringify(profile));
  },
};

