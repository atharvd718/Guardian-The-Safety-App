import { useEffect, useRef, useState, useCallback } from 'react';
import { StorageService } from '../lib/storage';
import { UnsafeZone } from '../types';
import {
  dispatchSilentGeofenceAlert,
  GEOFENCE_SIMULATE_EVENT,
  GEOFENCE_UPDATED_EVENT,
  getDistanceMeters,
  notifyGeofenceUpdated,
} from '../lib/geofence';
import { useAppUser } from '../lib/auth';

export type GeoPermissionState = 'prompt' | 'granted' | 'denied' | 'unsupported';

const COOLDOWN_MS = 30_000;

export function useGeofenceMonitor(active: boolean) {
  const { user } = useAppUser();
  const [monitoringEnabled, setMonitoringEnabled] = useState<boolean>(() =>
    StorageService.isGeofenceMonitoringEnabled()
  );
  const [zones, setZones] = useState<UnsafeZone[]>(() =>
    StorageService.getUnsafeZones()
  );
  const [currentPosition, setCurrentPosition] = useState<{
    lat: number;
    lng: number;
    accuracy?: number;
    isSimulated?: boolean;
  } | null>(null);
  const [permissionState, setPermissionState] = useState<GeoPermissionState>('prompt');
  const [insideZoneIds, setInsideZoneIds] = useState<string[]>([]);

  const presenceRef = useRef<Map<string, 'inside' | 'outside'>>(new Map());
  const lastAlertRef = useRef<Map<string, number>>(new Map());
  const zonesRef = useRef<UnsafeZone[]>(zones);
  const monitoringRef = useRef<boolean>(monitoringEnabled);

  useEffect(() => {
    zonesRef.current = zones;
  }, [zones]);

  useEffect(() => {
    monitoringRef.current = monitoringEnabled;
  }, [monitoringEnabled]);

  const reloadZones = useCallback(() => {
    setZones(StorageService.getUnsafeZones());
    setMonitoringEnabled(StorageService.isGeofenceMonitoringEnabled());
  }, []);

  useEffect(() => {
    const handler = () => reloadZones();
    window.addEventListener(GEOFENCE_UPDATED_EVENT, handler);
    return () => window.removeEventListener(GEOFENCE_UPDATED_EVENT, handler);
  }, [reloadZones]);

  const evaluatePosition = useCallback(
    async (lat: number, lng: number, accuracy?: number, isSimulated = false) => {
      setCurrentPosition({ lat, lng, accuracy, isSimulated });

      const activeZones = zonesRef.current.filter((z) => z.enabled);
      const nowInside: string[] = [];

      for (const zone of activeZones) {
        const dist = getDistanceMeters(lat, lng, zone.lat, zone.lng);
        const currentState: 'inside' | 'outside' =
          dist <= zone.radiusMeters ? 'inside' : 'outside';

        if (currentState === 'inside') {
          nowInside.push(zone.id);
        }

        if (!monitoringRef.current) {
          presenceRef.current.set(zone.id, currentState);
          continue;
        }

        const prevState = presenceRef.current.get(zone.id);
        presenceRef.current.set(zone.id, currentState);

        // First GPS reading initializes baseline state unless explicitly simulated
        if (prevState === undefined) {
          if (isSimulated && currentState === 'inside' && zone.notifyOnEnter) {
            // Allow simulated first jump into an unsafe zone to trigger silently
          } else {
            continue;
          }
        }

        if (prevState === currentState) {
          continue;
        }

        const shouldNotify =
          (currentState === 'inside' && zone.notifyOnEnter) ||
          (currentState === 'outside' && zone.notifyOnExit);

        if (!shouldNotify) continue;

        const alertKey = `${zone.id}:${currentState}`;
        const lastFired = lastAlertRef.current.get(alertKey) || 0;
        const now = Date.now();
        if (!isSimulated && now - lastFired < COOLDOWN_MS) {
          continue;
        }

        const contacts = StorageService.getContacts();
        if (contacts.length === 0) continue;

        lastAlertRef.current.set(alertKey, now);

        const storedUser = StorageService.getCurrentUser();
        const userName =
          user?.fullName || user?.firstName || storedUser?.name || 'Guardian User';
        const userPhone = storedUser?.phone || '';

        await dispatchSilentGeofenceAlert({
          zone,
          eventType: currentState === 'inside' ? 'enter' : 'exit',
          lat,
          lng,
          userName,
          userPhone,
          userId: user?.id,
          contacts,
        });
      }

      setInsideZoneIds(nowInside);
    },
    [user]
  );

  // Listen for simulated GPS moves (from UnsafeZonesView map/test controls)
  useEffect(() => {
    const onSimulate = (e: Event) => {
      const detail = (e as CustomEvent<{ lat: number; lng: number }>).detail;
      if (detail && typeof detail.lat === 'number' && typeof detail.lng === 'number') {
        evaluatePosition(detail.lat, detail.lng, 5, true);
      }
    };
    window.addEventListener(GEOFENCE_SIMULATE_EVENT, onSimulate);
    return () => window.removeEventListener(GEOFENCE_SIMULATE_EVENT, onSimulate);
  }, [evaluatePosition]);

  // Watch device geolocation continuously while authenticated & monitoring enabled
  useEffect(() => {
    if (!active) return;

    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setPermissionState('unsupported');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setPermissionState('granted');
        evaluatePosition(
          pos.coords.latitude,
          pos.coords.longitude,
          pos.coords.accuracy,
          false
        );
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setPermissionState('denied');
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 15000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [active, evaluatePosition]);

  const toggleMonitoring = useCallback((nextVal?: boolean) => {
    const val = typeof nextVal === 'boolean' ? nextVal : !monitoringRef.current;
    StorageService.setGeofenceMonitoringEnabled(val);
    setMonitoringEnabled(val);
    notifyGeofenceUpdated();
  }, []);

  return {
    monitoringEnabled,
    toggleMonitoring,
    zones,
    currentPosition,
    permissionState,
    insideZoneIds,
    evaluatePosition,
  };
}
