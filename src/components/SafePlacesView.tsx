import React, { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Phone, Navigation, Loader2, ShieldPlus, AlertTriangle } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { SafePlace } from '../types';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface SafePlacesViewProps {
  onBack: () => void;
}

// Distance calculation (Haversine)
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export const SafePlacesView: React.FC<SafePlacesViewProps> = ({ onBack }) => {
  const [places, setPlaces] = useState<SafePlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userLoc, setUserLoc] = useState<{lat: number, lon: number} | null>(null);
  const [filter, setFilter] = useState<'all' | 'police' | 'hospital' | 'fire_station'>('all');

  const fetchPlaces = (lat: number, lon: number) => {
    setLoading(true);
    setError('');
    const query = `
      [out:json];
      (
        node["amenity"="police"](around:5000,${lat},${lon});
        node["amenity"="hospital"](around:5000,${lat},${lon});
        node["amenity"="fire_station"](around:5000,${lat},${lon});
      );
      out;
    `;
    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        const results: SafePlace[] = data.elements.map((el: any) => {
          const type = el.tags.amenity as 'police' | 'hospital' | 'fire_station';
          const distance = getDistance(lat, lon, el.lat, el.lon);
          return {
            id: el.id.toString(),
            name: el.tags.name || `Unknown ${type.replace('_', ' ')}`,
            type,
            lat: el.lat,
            lon: el.lon,
            distanceKm: distance,
            address: el.tags['addr:street'] || el.tags['addr:city'] || 'Address not available',
            phone: el.tags.phone || el.tags['contact:phone']
          };
        }).sort((a: SafePlace, b: SafePlace) => a.distanceKm - b.distanceKm);
        
        setPlaces(results);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError('Failed to fetch nearby places. Please try again.');
        setLoading(false);
      });
  };

  const locateUser = () => {
    setLoading(true);
    setError('');
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLoc({ lat: latitude, lon: longitude });
        fetchPlaces(latitude, longitude);
      },
      (err) => {
        setError('Location access denied. Please enable GPS.');
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    locateUser();
  }, []);

  const filteredPlaces = places.filter(p => filter === 'all' || p.type === filter);

  // Map Recenter Component
  const RecenterMap = ({ lat, lon }: { lat: number, lon: number }) => {
    const map = useMap();
    useEffect(() => {
      map.setView([lat, lon]);
    }, [lat, lon, map]);
    return null;
  };

  return (
    <div className="h-[100dvh] bg-slate-900 flex flex-col max-w-md mx-auto shadow-2xl relative text-slate-100">
      {/* Header */}
      <div className="flex items-center px-4 py-4 bg-slate-800 border-b border-slate-700 shrink-0">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-slate-700 transition mr-2">
          <ArrowLeft className="w-5 h-5 text-slate-300" />
        </button>
        <h1 className="text-lg font-bold flex-1 flex items-center gap-2">
          <ShieldPlus className="w-5 h-5 text-emerald-400" /> Safe Places
        </h1>
        <button onClick={locateUser} disabled={loading} className="p-2 text-emerald-400 hover:bg-slate-700 rounded-full transition disabled:opacity-50">
          <MapPin className="w-5 h-5" />
        </button>
      </div>

      {loading && !userLoc && (
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
          <p className="text-slate-400 font-medium">Locating nearest help...</p>
        </div>
      )}

      {error && !userLoc && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-rose-500" />
          <p className="text-rose-400 font-medium">{error}</p>
          <button onClick={locateUser} className="px-6 py-2 bg-slate-800 rounded-xl font-semibold border border-slate-700 hover:bg-slate-700">Retry</button>
        </div>
      )}

      {userLoc && (
        <>
          {/* Map Section */}
          <div className="h-64 shrink-0 bg-slate-800 z-0 relative">
            <MapContainer center={[userLoc.lat, userLoc.lon]} zoom={13} className="w-full h-full" zoomControl={false}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              />
              <RecenterMap lat={userLoc.lat} lon={userLoc.lon} />
              
              {/* User Marker */}
              <Marker position={[userLoc.lat, userLoc.lon]}>
                <Popup>You are here</Popup>
              </Marker>
              
              {/* Places Markers */}
              {filteredPlaces.map(p => (
                <Marker key={p.id} position={[p.lat, p.lon]}>
                  <Popup>
                    <div className="font-bold text-slate-900">{p.name}</div>
                    <div className="text-xs text-slate-600 capitalize">{p.type.replace('_', ' ')}</div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
            
            {/* Loading Overlay for map */}
            {loading && (
              <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[400]">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="flex px-4 py-3 gap-2 overflow-x-auto no-scrollbar shrink-0 border-b border-slate-800 bg-slate-900">
            {(['all', 'police', 'hospital', 'fire_station'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${filter === f ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
              >
                {f === 'all' ? 'All' : f === 'fire_station' ? 'Fire Stations' : f.charAt(0).toUpperCase() + f.slice(1) + 's'}
              </button>
            ))}
          </div>

          {/* List Section */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900">
            {filteredPlaces.length === 0 && !loading ? (
              <div className="text-center py-10 text-slate-500 font-medium">
                No safe places found nearby.
              </div>
            ) : (
              filteredPlaces.map(place => (
                <div key={place.id} className="bg-slate-800 p-4 rounded-2xl border border-slate-700 shadow-md">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-slate-100 text-base">{place.name}</h3>
                      <p className="text-xs text-emerald-400 font-medium capitalize">
                        {place.type.replace('_', ' ')} • {place.distanceKm.toFixed(1)} km
                      </p>
                    </div>
                  </div>
                  
                  <p className="text-xs text-slate-400 mb-4 truncate">{place.address}</p>
                  
                  <div className="flex gap-2 text-xs font-medium text-slate-300 mb-4">
                    <span className="bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-700">
                      🚶 {Math.round(place.distanceKm / 5 * 60) || '< 1'} min
                    </span>
                    <span className="bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-700">
                      🚗 {Math.round(place.distanceKm / 40 * 60) || '< 1'} min
                    </span>
                  </div>

                  <div className="flex gap-3">
                    <a
                      href={place.phone ? `tel:${place.phone}` : '#'}
                      onClick={(e) => !place.phone && e.preventDefault()}
                      className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition ${place.phone ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'}`}
                    >
                      <Phone className="w-4 h-4" /> Call
                    </a>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lon}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 py-2.5 bg-blue-500 text-white rounded-xl flex items-center justify-center gap-2 text-sm font-bold hover:bg-blue-600 transition shadow-lg shadow-blue-500/20"
                    >
                      <Navigation className="w-4 h-4" /> Navigate
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};
