import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ShieldAlert,
  MapPin,
  Plus,
  Trash2,
  EyeOff,
  Crosshair,
  CheckCircle2,
  AlertTriangle,
  Play,
  LogOut,
  BellOff,
  Navigation,
} from 'lucide-react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import { StorageService } from '../lib/storage';
import { GeofenceEventItem, UnsafeZone } from '../types';
import {
  formatDistance,
  GEOFENCE_UPDATED_EVENT,
  getDistanceMeters,
  notifyGeofenceUpdated,
  triggerSimulatedCoordinates,
} from '../lib/geofence';
import { GeoPermissionState } from '../hooks/useGeofenceMonitor';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface UnsafeZonesViewProps {
  onBack: () => void;
  monitoringEnabled: boolean;
  onToggleMonitoring: (enabled?: boolean) => void;
  currentPosition: {
    lat: number;
    lng: number;
    accuracy?: number;
    isSimulated?: boolean;
  } | null;
  permissionState: GeoPermissionState;
  insideZoneIds: string[];
}

const FALLBACK_CENTER = { lat: 28.5355, lng: 77.391 };

const MapRecenter: React.FC<{ lat: number; lng: number }> = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng]);
  }, [lat, lng, map]);
  return null;
};

const MapInteractionHandler: React.FC<{
  mode: 'pick' | 'simulate';
  onPickLocation: (lat: number, lng: number) => void;
  onSimulateMove: (lat: number, lng: number) => void;
}> = ({ mode, onPickLocation, onSimulateMove }) => {
  useMapEvents({
    click(e) {
      if (mode === 'pick') {
        onPickLocation(e.latlng.lat, e.latlng.lng);
      } else {
        onSimulateMove(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
};

export const UnsafeZonesView: React.FC<UnsafeZonesViewProps> = ({
  onBack,
  monitoringEnabled,
  onToggleMonitoring,
  currentPosition,
  permissionState,
  insideZoneIds,
}) => {
  const [zones, setZones] = useState<UnsafeZone[]>(() => StorageService.getUnsafeZones());
  const [events, setEvents] = useState<GeofenceEventItem[]>(() =>
    StorageService.getGeofenceEvents()
  );
  const [contacts] = useState(() => StorageService.getContacts());

  const [activeTab, setActiveTab] = useState<'zones' | 'logs'>('zones');
  const [showAddForm, setShowAddForm] = useState(false);
  const [mapClickMode, setMapClickMode] = useState<'pick' | 'simulate'>('pick');

  // New zone form state
  const [zoneName, setZoneName] = useState('');
  const [zoneLat, setZoneLat] = useState<number>(
    currentPosition?.lat ?? FALLBACK_CENTER.lat
  );
  const [zoneLng, setZoneLng] = useState<number>(
    currentPosition?.lng ?? FALLBACK_CENTER.lng
  );
  const [radiusMeters, setRadiusMeters] = useState<number>(300);
  const [notifyOnEnter, setNotifyOnEnter] = useState<boolean>(true);
  const [notifyOnExit, setNotifyOnExit] = useState<boolean>(true);
  const [zoneNotes, setZoneNotes] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    const sync = () => {
      setZones(StorageService.getUnsafeZones());
      setEvents(StorageService.getGeofenceEvents());
    };
    window.addEventListener(GEOFENCE_UPDATED_EVENT, sync);
    return () => window.removeEventListener(GEOFENCE_UPDATED_EVENT, sync);
  }, []);

  const mapCenter = currentPosition ?? FALLBACK_CENTER;

  const handleUseCurrentGps = () => {
    if (currentPosition) {
      setZoneLat(Number(currentPosition.lat.toFixed(6)));
      setZoneLng(Number(currentPosition.lng.toFixed(6)));
      return;
    }
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setZoneLat(Number(pos.coords.latitude.toFixed(6)));
          setZoneLng(Number(pos.coords.longitude.toFixed(6)));
        },
        () => {
          setFormError('Unable to read device GPS. Tap the map to select coordinates.');
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  };

  const handleAddZone = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!zoneName.trim()) {
      setFormError('Please enter a name for this unsafe area.');
      return;
    }
    if (!notifyOnEnter && !notifyOnExit) {
      setFormError('Select at least one trigger (Notify on Enter or Notify on Exit).');
      return;
    }

    const newZone: UnsafeZone = {
      id: `zone_${Date.now()}`,
      name: zoneName.trim(),
      lat: zoneLat,
      lng: zoneLng,
      radiusMeters,
      notifyOnEnter,
      notifyOnExit,
      enabled: true,
      notes: zoneNotes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    const updated = StorageService.addUnsafeZone(newZone);
    setZones(updated);
    notifyGeofenceUpdated();
    setZoneName('');
    setZoneNotes('');
    setShowAddForm(false);
  };

  const handleToggleZone = (zone: UnsafeZone) => {
    const updated = StorageService.updateUnsafeZone({
      ...zone,
      enabled: !zone.enabled,
    });
    setZones(updated);
    notifyGeofenceUpdated();
  };

  const handleDeleteZone = (zoneId: string) => {
    const updated = StorageService.removeUnsafeZone(zoneId);
    setZones(updated);
    notifyGeofenceUpdated();
  };

  const handleSimulateEnter = (zone: UnsafeZone) => {
    if (!monitoringEnabled) {
      onToggleMonitoring(true);
    }
    // Place simulated GPS inside the zone center
    triggerSimulatedCoordinates(zone.lat, zone.lng);
  };

  const handleSimulateExit = (zone: UnsafeZone) => {
    if (!monitoringEnabled) {
      onToggleMonitoring(true);
    }
    // Offset latitude safely outside the radius (approx 111,111m per degree)
    const offsetDegrees = (zone.radiusMeters + 250) / 111111;
    triggerSimulatedCoordinates(zone.lat + offsetDegrees, zone.lng);
  };

  const activeZonesCount = zones.filter((z) => z.enabled).length;

  return (
    <div className="min-h-screen bg-[var(--color-background)] flex flex-col max-w-md mx-auto text-[var(--color-foreground)]">
      {/* Compact Mobile Top App Bar */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-[var(--color-border)] px-4 py-3 flex items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="min-h-[44px] min-w-[44px] -ml-2 flex items-center justify-center rounded-full hover:bg-rose-50 transition-colors"
          aria-label="Back to Dashboard"
        >
          <ArrowLeft className="w-5 h-5 text-[var(--color-foreground)]" />
        </button>

        <h1 className="text-lg font-serif font-bold text-[var(--color-foreground)] truncate flex-1">
          Unsafe Area Alerts
        </h1>

        <button
          onClick={() => onToggleMonitoring()}
          className={`min-h-[44px] px-4 rounded-xl text-xs font-bold transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
            monitoringEnabled
              ? 'bg-[var(--color-primary)] text-white'
              : 'bg-slate-200 text-slate-700'
          }`}
          aria-pressed={monitoringEnabled}
        >
          <EyeOff className="w-4 h-4" />
          <span>{monitoringEnabled ? 'Silent Watch On' : 'Paused'}</span>
        </button>
      </header>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 pb-10">
        {/* Discreet Behavior Summary */}
        <div className="bg-white/85 rounded-2xl p-4 border border-[var(--color-border)] space-y-2">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-[var(--color-primary)] flex items-center justify-center shrink-0">
              <BellOff className="w-5 h-5" />
            </div>
            <div className="space-y-1 min-w-0">
              <h2 className="text-sm font-bold text-[var(--color-foreground)]">
                Silent Background Geofencing
              </h2>
              <p className="text-xs text-[var(--color-muted)] leading-relaxed">
                Automatically dispatches a silent alert with your live GPS coordinates to{' '}
                {contacts.length} emergency contact{contacts.length === 1 ? '' : 's'} whenever you
                enter or leave a marked area—without audible alarms or popups.
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-[var(--color-border)] flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--color-muted)] tabular-nums">
            <span>
              GPS:{' '}
              {currentPosition
                ? `${currentPosition.lat.toFixed(4)}, ${currentPosition.lng.toFixed(4)}`
                : permissionState === 'denied'
                ? 'Permission denied'
                : 'Awaiting fix'}
            </span>
            <span aria-hidden="true">·</span>
            <span>{activeZonesCount} active zones</span>
            {currentPosition?.isSimulated && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-semibold text-[var(--color-primary)]">
                  Simulated GPS active
                </span>
              </>
            )}
          </div>
        </div>

        {/* Interactive Leaflet Geofence Map */}
        <section className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-[var(--color-muted)]">
              Tap map to {mapClickMode === 'pick' ? 'set new zone pin' : 'simulate GPS move'}
            </span>
            <div className="flex items-center gap-1 p-1 bg-white/80 rounded-xl border border-[var(--color-border)]">
              <button
                type="button"
                onClick={() => setMapClickMode('pick')}
                className={`min-h-[36px] px-3 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  mapClickMode === 'pick'
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'text-[var(--color-muted)] hover:text-[var(--color-foreground)]'
                }`}
              >
                Pick Pin
              </button>
              <button
                type="button"
                onClick={() => setMapClickMode('simulate')}
                className={`min-h-[36px] px-3 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  mapClickMode === 'simulate'
                    ? 'bg-[var(--color-foreground)] text-white'
                    : 'text-[var(--color-muted)] hover:text-[var(--color-foreground)]'
                }`}
              >
                Test GPS
              </button>
            </div>
          </div>

          <div className="h-56 rounded-2xl overflow-hidden border border-[var(--color-border)] bg-slate-100 relative z-0">
            <MapContainer
              center={[mapCenter.lat, mapCenter.lng]}
              zoom={14}
              className="w-full h-full"
              zoomControl={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              />
              <MapRecenter lat={mapCenter.lat} lng={mapCenter.lng} />
              <MapInteractionHandler
                mode={mapClickMode}
                onPickLocation={(lat, lng) => {
                  setZoneLat(Number(lat.toFixed(6)));
                  setZoneLng(Number(lng.toFixed(6)));
                  setShowAddForm(true);
                }}
                onSimulateMove={(lat, lng) => {
                  if (!monitoringEnabled) onToggleMonitoring(true);
                  triggerSimulatedCoordinates(lat, lng);
                }}
              />

              {/* Current or Simulated Device Location Marker */}
              <Marker position={[mapCenter.lat, mapCenter.lng]}>
                <Popup>
                  <div className="text-xs font-bold text-slate-900">
                    {currentPosition?.isSimulated ? 'Simulated Device Position' : 'Your Location'}
                  </div>
                </Popup>
              </Marker>

              {/* Selected New Zone Pin when adding */}
              {showAddForm && (
                <Circle
                  center={[zoneLat, zoneLng]}
                  radius={radiusMeters}
                  pathOptions={{
                    color: '#6366F1',
                    fillColor: '#6366F1',
                    fillOpacity: 0.15,
                    dashArray: '6 6',
                  }}
                />
              )}

              {/* Saved Unsafe Zones */}
              {zones.map((zone) => {
                const isInside = insideZoneIds.includes(zone.id);
                const strokeColor = !zone.enabled
                  ? '#94A3B8'
                  : isInside
                  ? '#DC2626'
                  : '#E8437A';
                return (
                  <Circle
                    key={zone.id}
                    center={[zone.lat, zone.lng]}
                    radius={zone.radiusMeters}
                    pathOptions={{
                      color: strokeColor,
                      fillColor: strokeColor,
                      fillOpacity: zone.enabled ? (isInside ? 0.28 : 0.14) : 0.06,
                    }}
                  >
                    <Popup>
                      <div className="text-xs font-bold text-slate-900">{zone.name}</div>
                      <div className="text-[11px] text-slate-600">
                        Radius: {zone.radiusMeters} m · {isInside ? 'Inside' : 'Outside'}
                      </div>
                    </Popup>
                  </Circle>
                );
              })}
            </MapContainer>
          </div>
        </section>

        {/* Segmented Tab Controls + Add Button */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1 p-1 bg-white/80 rounded-xl border border-[var(--color-border)] flex-1">
            <button
              type="button"
              onClick={() => setActiveTab('zones')}
              className={`flex-1 min-h-[40px] px-3 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'zones'
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-foreground)]'
              }`}
            >
              Unsafe Areas ({zones.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('logs')}
              className={`flex-1 min-h-[40px] px-3 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'logs'
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-foreground)]'
              }`}
            >
              Silent Log ({events.length})
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setActiveTab('zones');
              setShowAddForm((prev) => !prev);
            }}
            className="min-h-[44px] px-4 bg-[var(--color-foreground)] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 whitespace-nowrap shrink-0 active:scale-[0.98] transition-transform"
          >
            <Plus className="w-4 h-4" />
            <span>{showAddForm ? 'Close' : 'Add Area'}</span>
          </button>
        </div>

        {/* Add Unsafe Area Form */}
        {showAddForm && activeTab === 'zones' && (
          <form
            onSubmit={handleAddZone}
            className="bg-white rounded-2xl p-4 border border-[var(--color-border)] space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-serif font-bold text-[var(--color-foreground)]">
                Define Unsafe Area
              </h3>
              <button
                type="button"
                onClick={handleUseCurrentGps}
                className="min-h-[36px] px-3 text-xs font-semibold text-[var(--color-primary)] bg-rose-50 rounded-lg flex items-center gap-1.5"
              >
                <Crosshair className="w-3.5 h-3.5" />
                <span>Use Current GPS</span>
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--color-foreground)] block">
                Area Name
              </label>
              <input
                type="text"
                value={zoneName}
                onChange={(e) => setZoneName(e.target.value)}
                placeholder="e.g. Railway Footbridge, Isolated Alley"
                className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--color-muted)] block">
                  Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={zoneLat}
                  onChange={(e) => setZoneLat(parseFloat(e.target.value) || 0)}
                  className="w-full min-h-[44px] px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono tabular-nums text-slate-900"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--color-muted)] block">
                  Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={zoneLng}
                  onChange={(e) => setZoneLng(parseFloat(e.target.value) || 0)}
                  className="w-full min-h-[44px] px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono tabular-nums text-slate-900"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[var(--color-foreground)]">
                  Geofence Radius
                </span>
                <span className="font-mono tabular-nums font-bold text-[var(--color-primary)]">
                  {radiusMeters} m
                </span>
              </div>
              <input
                type="range"
                min={100}
                max={2000}
                step={50}
                value={radiusMeters}
                onChange={(e) => setRadiusMeters(Number(e.target.value))}
                className="w-full accent-[#E8437A]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="min-h-[44px] flex items-center gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyOnEnter}
                  onChange={(e) => setNotifyOnEnter(e.target.checked)}
                  className="w-4 h-4 accent-[#E8437A]"
                />
                <span className="text-xs font-semibold text-slate-800">Notify on Enter</span>
              </label>

              <label className="min-h-[44px] flex items-center gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyOnExit}
                  onChange={(e) => setNotifyOnExit(e.target.checked)}
                  className="w-4 h-4 accent-[#E8437A]"
                />
                <span className="text-xs font-semibold text-slate-800">Notify on Exit</span>
              </label>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--color-muted)] block">
                Safety Note (optional)
              </label>
              <input
                type="text"
                value={zoneNotes}
                onChange={(e) => setZoneNotes(e.target.value)}
                placeholder="e.g. Low visibility at night"
                className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            </div>

            <button
              type="submit"
              className="w-full min-h-[48px] bg-[var(--color-primary)] hover:bg-[var(--color-primary-active)] text-white font-bold text-sm rounded-xl transition-colors"
            >
              Save Unsafe Area
            </button>
          </form>
        )}

        {/* TAB 1: Unsafe Zones List */}
        {activeTab === 'zones' && (
          <div className="space-y-3">
            {zones.length === 0 ? (
              <div className="bg-white/85 rounded-2xl p-8 border border-[var(--color-border)] text-center space-y-3">
                <MapPin className="w-8 h-8 text-[var(--color-muted)] mx-auto" />
                <p className="text-sm font-bold text-[var(--color-foreground)]">
                  No unsafe areas defined
                </p>
                <p className="text-xs text-[var(--color-muted)]">
                  Tap "Add Area" or click anywhere on the map to define an unsafe geofence zone.
                </p>
              </div>
            ) : (
              zones.map((zone) => {
                const isInside = insideZoneIds.includes(zone.id);
                const distanceMeters = currentPosition
                  ? getDistanceMeters(
                      currentPosition.lat,
                      currentPosition.lng,
                      zone.lat,
                      zone.lng
                    )
                  : null;

                const triggerSummary = [
                  zone.notifyOnEnter ? 'Enter' : null,
                  zone.notifyOnExit ? 'Exit' : null,
                ]
                  .filter(Boolean)
                  .join(' & ');

                return (
                  <div
                    key={zone.id}
                    className="bg-white/90 rounded-2xl p-4 border border-[var(--color-border)] space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <h3 className="text-base font-serif font-bold text-[var(--color-foreground)] truncate">
                          {zone.name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[var(--color-muted)] tabular-nums">
                          <span>{zone.radiusMeters} m radius</span>
                          <span aria-hidden="true">·</span>
                          <span>Notify: {triggerSummary || 'None'}</span>
                          {distanceMeters !== null && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span>{formatDistance(distanceMeters)} away</span>
                            </>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleZone(zone)}
                        className={`min-h-[40px] px-3 rounded-xl text-xs font-bold shrink-0 transition-colors ${
                          zone.enabled
                            ? 'bg-rose-50 text-[var(--color-primary)] border border-[var(--color-border)]'
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}
                      >
                        {zone.enabled ? 'Active' : 'Off'}
                      </button>
                    </div>

                    {zone.notes && (
                      <p className="text-xs text-[var(--color-muted)]">{zone.notes}</p>
                    )}

                    {/* Explicit Status Line (Icon + Text, never hue-only) */}
                    <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border)] gap-2">
                      <div className="flex items-center gap-1.5 text-xs font-semibold">
                        {isInside ? (
                          <>
                            <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                            <span className="text-red-700">Inside Zone</span>
                          </>
                        ) : (
                          <>
                            <Navigation className="w-4 h-4 text-emerald-700 shrink-0" />
                            <span className="text-emerald-800">Outside Zone</span>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleSimulateEnter(zone)}
                          className="min-h-[40px] px-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center gap-1 transition-colors whitespace-nowrap"
                          title="Simulate entering this unsafe area"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Test Enter</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSimulateExit(zone)}
                          className="min-h-[40px] px-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center gap-1 transition-colors whitespace-nowrap"
                          title="Simulate leaving this unsafe area"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Test Exit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteZone(zone.id)}
                          className="min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-rose-50 rounded-xl transition-colors"
                          aria-label={`Delete ${zone.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 2: Silent Dispatch Log */}
        {activeTab === 'logs' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--color-muted)]">
                Discreetly sent to emergency contacts
              </span>
              {events.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    StorageService.clearGeofenceEvents();
                    setEvents([]);
                  }}
                  className="min-h-[36px] px-3 text-xs font-semibold text-[var(--color-primary)] hover:underline"
                >
                  Clear Log
                </button>
              )}
            </div>

            {events.length === 0 ? (
              <div className="bg-white/85 rounded-2xl p-8 border border-[var(--color-border)] text-center space-y-2">
                <BellOff className="w-8 h-8 text-[var(--color-muted)] mx-auto" />
                <p className="text-sm font-bold text-[var(--color-foreground)]">
                  No silent alerts triggered yet
                </p>
                <p className="text-xs text-[var(--color-muted)]">
                  Use "Test Enter" or "Test Exit" on any area, or move across a geofence boundary
                  with GPS enabled.
                </p>
              </div>
            ) : (
              events.map((ev) => (
                <div
                  key={ev.id}
                  className="bg-white/90 rounded-2xl p-4 border border-[var(--color-border)] space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span className="text-[var(--color-foreground)]">
                        {ev.eventType === 'enter' ? 'Entered' : 'Exited'} {ev.zoneName}
                      </span>
                    </div>
                    <span className="text-xs text-[var(--color-muted)] tabular-nums shrink-0">
                      {ev.timestamp}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed">{ev.message}</p>

                  <div className="text-xs text-[var(--color-muted)] flex flex-wrap items-center gap-x-2 gap-y-0.5 tabular-nums">
                    <span>Silent dispatch ({ev.status})</span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {ev.recipients.length} contact{ev.recipients.length === 1 ? '' : 's'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
