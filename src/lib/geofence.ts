import { ContactNew, GeofenceEventItem, UnsafeZone } from '../types';
import { StorageService } from './storage';
import { db, isFirebaseConfigured } from './firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

export function getDistanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(2)} km`;
}

export const GEOFENCE_UPDATED_EVENT = 'guardian:geofence-updated';
export const GEOFENCE_SIMULATE_EVENT = 'guardian:geofence-simulate';

export function notifyGeofenceUpdated(): void {
  window.dispatchEvent(new CustomEvent(GEOFENCE_UPDATED_EVENT));
}

export function triggerSimulatedCoordinates(lat: number, lng: number): void {
  window.dispatchEvent(
    new CustomEvent(GEOFENCE_SIMULATE_EVENT, { detail: { lat, lng } })
  );
}

export async function dispatchSilentGeofenceAlert(params: {
  zone: UnsafeZone;
  eventType: 'enter' | 'exit';
  lat: number;
  lng: number;
  userName: string;
  userPhone: string;
  userId?: string;
  contacts: ContactNew[];
}): Promise<GeofenceEventItem> {
  const {
    zone,
    eventType,
    lat,
    lng,
    userName,
    userPhone,
    userId,
    contacts,
  } = params;

  const timestamp = new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
  const actionVerb = eventType === 'enter' ? 'entered' : 'exited';
  const mapLink = `https://maps.google.com/?q=${lat.toFixed(5)},${lng.toFixed(5)}`;
  const recipientLabels = contacts.map(
    (c) => `${c.friendName} (${c.friendPhone})`
  );

  let finalMessage = `[Silent Guardian Alert] ${userName}${
    userPhone ? ` (${userPhone})` : ''
  } ${actionVerb} unsafe area "${zone.name}" at ${timestamp}. Location: ${mapLink}`;
  let status: 'Dispatched' | 'Queued' = 'Dispatched';

  try {
    const res = await fetch('/api/alerts/silent-geofence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userName,
        userPhone,
        zoneName: zone.name,
        eventType,
        lat,
        lng,
        contacts,
        timestamp,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.message) finalMessage = data.message;
    } else {
      status = 'Queued';
    }
  } catch {
    status = 'Queued';
  }

  const eventItem: GeofenceEventItem = {
    id: `geo_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    zoneId: zone.id,
    zoneName: zone.name,
    eventType,
    timestamp,
    lat,
    lng,
    recipients: recipientLabels,
    message: finalMessage,
    silent: true,
    status,
  };

  StorageService.addGeofenceEvent(eventItem);

  StorageService.addSmsLog({
    id: `silent_${Date.now()}`,
    timestamp,
    recipients: recipientLabels,
    message: finalMessage,
    status: status === 'Dispatched' ? 'Sent' : 'Failed',
  });

  if (isFirebaseConfigured && db && userId) {
    try {
      await addDoc(collection(db, 'users', userId, 'geofenceEvents'), {
        ...eventItem,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('Failed to sync silent geofence event to Firestore:', err);
    }
  }

  notifyGeofenceUpdated();
  return eventItem;
}
