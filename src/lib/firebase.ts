import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  signInAnonymously
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  setDoc,
  getDoc,
  collection,
  getDocs,
  deleteDoc,
  query,
  orderBy
} from 'firebase/firestore';
import { Users, ContactNew, AudioRecordItem, SmsLogItem } from '../types';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

Object.entries(firebaseConfig).forEach(([key, value]) => {
  if (value === undefined || value === '') {
    console.warn(`Firebase config warning: ${key} is undefined or empty! Check your .env file.`);
  }
});

let appInstance: any;
let dbInstance: any;
let authInstance: any;
let googleProviderInstance: any;

try {
  appInstance = initializeApp(firebaseConfig);
  dbInstance = getFirestore(appInstance);
  authInstance = getAuth(appInstance);
  googleProviderInstance = new GoogleAuthProvider();
} catch (error) {
  console.error('Failed to initialize Firebase:', error);
}

export const app = appInstance;
export const db = dbInstance;
export const auth = authInstance;
export const googleProvider = googleProviderInstance;

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider: any) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection test
async function testConnection() {
  if (!db) return;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

// Firebase Auth & Firestore Helpers
export const FirebaseService = {
  // Sign in with Google
  async loginWithGoogle() {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Save or update user profile in Firestore
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      const userData: Users = {
        uid: user.uid,
        name: user.displayName || 'Guardian User',
        email: user.email || '',
        phone: user.phoneNumber || '',
        dob: '',
      };

      if (!userDoc.exists()) {
        await setDoc(userRef, {
          ...userData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      return userData;
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      throw error;
    }
  },

  // Anonymous Sign In fallback
  async loginAnonymously() {
    try {
      const result = await signInAnonymously(auth);
      const user = result.user;
      const userData: Users = {
        uid: user.uid,
        name: 'Guest Guardian',
        email: 'guest@guardian.app',
        phone: '',
        dob: '',
      };
      
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        ...userData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      return userData;
    } catch (error) {
      console.error('Anonymous Sign-In Error:', error);
      throw error;
    }
  },

  // Logout
  async logout() {
    await signOut(auth);
  },

  // Save/Update User Profile
  async saveUserProfile(user: Users) {
    if (!auth.currentUser) return;
    const path = `users/${auth.currentUser.uid}`;
    try {
      await setDoc(doc(db, 'users', auth.currentUser.uid), {
        uid: auth.currentUser.uid,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        dob: user.dob || '',
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  // Contacts
  async getContacts(userId: string): Promise<ContactNew[]> {
    const path = `users/${userId}/contacts`;
    try {
      const snapshot = await getDocs(collection(db, 'users', userId, 'contacts'));
      return snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          friendName: data.friendName,
          friendPhone: data.friendPhone,
          friendRelation: data.friendRelation || 'Friend',
        };
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  async addContact(userId: string, contact: ContactNew) {
    const safePhoneId = contact.friendPhone.replace(/[^a-zA-Z0-9_\-]/g, '_') || `contact_${Date.now()}`;
    const path = `users/${userId}/contacts/${safePhoneId}`;
    try {
      await setDoc(doc(db, 'users', userId, 'contacts', safePhoneId), {
        id: safePhoneId,
        userId: userId,
        friendName: contact.friendName,
        friendPhone: contact.friendPhone,
        friendRelation: contact.friendRelation,
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async deleteContact(userId: string, friendPhone: string) {
    const safePhoneId = friendPhone.replace(/[^a-zA-Z0-9_\-]/g, '_');
    const path = `users/${userId}/contacts/${safePhoneId}`;
    try {
      await deleteDoc(doc(db, 'users', userId, 'contacts', safePhoneId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  // Audio Records
  async getAudioRecordings(userId: string): Promise<AudioRecordItem[]> {
    const path = `users/${userId}/audioRecords`;
    try {
      const q = query(collection(db, 'users', userId, 'audioRecords'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          fileName: data.fileName,
          date: data.date,
          duration: data.duration || '0:00',
          audioUrl: data.audioUrl,
        };
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  async addAudioRecording(userId: string, item: AudioRecordItem) {
    const safeId = item.id.replace(/[^a-zA-Z0-9_\-]/g, '_') || `rec_${Date.now()}`;
    const path = `users/${userId}/audioRecords/${safeId}`;
    try {
      await setDoc(doc(db, 'users', userId, 'audioRecords', safeId), {
        id: safeId,
        userId: userId,
        fileName: item.fileName,
        date: item.date,
        duration: item.duration || '00:00',
        audioUrl: item.audioUrl || '',
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  // SMS Logs
  async getSmsLogs(userId: string): Promise<SmsLogItem[]> {
    const path = `users/${userId}/smsLogs`;
    try {
      const snapshot = await getDocs(collection(db, 'users', userId, 'smsLogs'));
      return snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          timestamp: data.timestamp,
          recipients: data.recipients || [],
          message: data.message || '',
          status: data.status || 'Sent',
        };
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  async addSmsLog(userId: string, log: SmsLogItem) {
    const safeId = log.id.replace(/[^a-zA-Z0-9_\-]/g, '_') || `sms_${Date.now()}`;
    const path = `users/${userId}/smsLogs/${safeId}`;
    try {
      await setDoc(doc(db, 'users', userId, 'smsLogs', safeId), {
        id: safeId,
        userId: userId,
        timestamp: log.timestamp,
        recipients: log.recipients,
        message: log.message,
        status: log.status,
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },
};
