export interface Users {
  uid: string;
  name: string;
  email: string;
  phone: string;
  dob: string;
}

export interface SafePlace {
  id: string;
  name: string;
  type: 'police' | 'hospital' | 'fire_station';
  lat: number;
  lon: number;
  distanceKm: number;
  address: string;
  phone?: string;
}

export interface ContactNew {
  id?: string;
  friendName: string;
  friendPhone: string;
  friendRelation: string;
}

export interface ContactInfo {
  name: string;
  number: string;
}

export interface AudioRecordItem {
  id: string;
  fileName: string;
  date: string;
  duration: string;
  audioUrl?: string;
  blob?: Blob;
}

export interface SmsLogItem {
  id: string;
  timestamp: string;
  recipients: string[];
  message: string;
  status: 'Sent' | 'Failed';
}

export interface UnsafeZone {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radiusMeters: number;
  notifyOnEnter: boolean;
  notifyOnExit: boolean;
  enabled: boolean;
  notes?: string;
  createdAt: string;
}

export interface GeofenceEventItem {
  id: string;
  zoneId: string;
  zoneName: string;
  eventType: 'enter' | 'exit';
  timestamp: string;
  lat: number;
  lng: number;
  recipients: string[];
  message: string;
  silent: boolean;
  status: 'Dispatched' | 'Queued';
}

export interface SafetyIdProfile {
  fullName: string;
  bloodGroup: string;
  allergies: string;
  medicalNotes: string;
  safeAddress: string;
  emergencyNote: string;
}

export type ScreenType =
  | 'splash'
  | 'onboarding'
  | 'login'
  | 'register'
  | 'register_detail'
  | 'dashboard'
  | 'emergency_sms'
  | 'record_audio'
  | 'track_me'
  | 'added_contacts'
  | 'add_contacts'
  | 'aria'
  | 'safe_places'
  | 'helplines'
  | 'self_defense'
  | 'unsafe_zones'
  | 'fake_call'
  | 'safety_checkin'
  | 'safety_id';
