import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const createCustomPin = () => {
  return L.divIcon({
    className: 'custom-map-pin',
    html: `
      <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
        <div style="width: 30px; height: 30px; background: #10b981; border: 3px solid #ffffff; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); box-shadow: 0 4px 10px rgba(0,0,0,0.35);"></div>
        <div style="position: absolute; width: 10px; height: 10px; background: #ffffff; border-radius: 50%; top: 7px;"></div>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -34],
  });
};

export default function OpenStreetMapPicker({
  initialLat = 22.7196,
  initialLng = 75.8577,
  onLocationSelect,
  autoDetectOnMount = true,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [geoError, setGeoError] = useState('');
  const [currentAddress, setCurrentAddress] = useState('');

  // Reverse geocode lat/lng to get address details via OpenStreetMap Nominatim
  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'en',
          },
        }
      );
      if (!response.ok) throw new Error('Geocoding request failed');
      const data = await response.json();

      const addr = data.address || {};
      const city =
        addr.city ||
        addr.town ||
        addr.village ||
        addr.suburb ||
        addr.city_district ||
        addr.county ||
        'Indore';
      const state = addr.state || 'Madhya Pradesh';
      const postalCode = addr.postcode || '452001';
      const country = addr.country || 'India';
      const displayName = data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

      setCurrentAddress(displayName);
      setGeoError('');

      if (onLocationSelect) {
        onLocationSelect({
          latitude: lat,
          longitude: lng,
          displayName,
          addressDetails: {
            address_line1: displayName,
            city,
            state,
            postal_code: postalCode,
            country,
          },
        });
      }
    } catch (err) {
      console.error('Reverse geocode error:', err);
      setGeoError('Could not fetch address details for this location. You can still select it.');
    }
  };

  // Browser Geolocation auto-fetch
  const detectCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }

    setLocating(true);
    setGeoError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocating(false);

        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.setView([latitude, longitude], 16);
          markerRef.current.setLatLng([latitude, longitude]);
        }

        reverseGeocode(latitude, longitude);
      },
      (error) => {
        setLocating(false);
        console.warn('Geolocation error:', error);
        if (error.code === error.PERMISSION_DENIED) {
          setGeoError('Location permission denied. Please allow location access in your browser or search manually.');
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setGeoError('Location information is currently unavailable.');
        } else if (error.code === error.TIMEOUT) {
          setGeoError('Location request timed out. Please try again.');
        } else {
          setGeoError('Could not detect your current location.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Search places via Nominatim
  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    setGeoError('');

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'en',
          },
        }
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const item = data[0];
        const lat = parseFloat(item.lat);
        const lng = parseFloat(item.lon);

        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.setView([lat, lng], 15);
          markerRef.current.setLatLng([lat, lng]);
        }

        reverseGeocode(lat, lng);
      } else {
        setGeoError('No location results found for this search.');
      }
    } catch (err) {
      console.error('Search error:', err);
      setGeoError('Failed to search location.');
    } finally {
      setSearching(false);
    }
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Check if map already initialized
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }

    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
    }).setView([initialLat, initialLng], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    const pin = createCustomPin();
    const marker = L.marker([initialLat, initialLng], {
      icon: pin,
      draggable: true,
    }).addTo(map);

    // Click on map to place pin
    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      reverseGeocode(lat, lng);
    });

    // Drag pin to update location
    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      reverseGeocode(pos.lat, pos.lng);
    });

    mapInstanceRef.current = map;
    markerRef.current = marker;

    // Fix map rendering sizing issues inside tabs
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    // Initial reverse geocode or auto-detect
    if (autoDetectOnMount) {
      detectCurrentLocation();
    } else {
      reverseGeocode(initialLat, initialLng);
    }

    return () => {
      clearTimeout(timer);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  return (
    <div className="space-y-3">
      {/* Search and Auto-detect controls */}
      <div className="flex flex-col sm:flex-row gap-2">
        <form onSubmit={handleSearch} className="relative flex-1">
          <input
            type="text"
            placeholder="Search locality, landmark, or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-4 pr-24 py-3 rounded-xl bg-bg border border-rule text-ink text-[13px] font-bold outline-none focus:border-accent transition-all"
          />
          <button
            type="submit"
            disabled={searching}
            className="absolute right-1.5 top-1.5 bottom-1.5 px-4 bg-ink text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-accent transition-all disabled:opacity-50"
          >
            {searching ? 'Searching...' : 'Search'}
          </button>
        </form>

        <button
          type="button"
          onClick={detectCurrentLocation}
          disabled={locating}
          className="px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[12px] font-bold flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95 disabled:opacity-60"
        >
          {locating ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Detecting GPS...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <circle cx="12" cy="11" r="3" strokeWidth="2.5" />
              </svg>
              <span>Auto-Detect Location</span>
            </>
          )}
        </button>
      </div>

      {/* Geolocation status message or error */}
      {geoError && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[12px] font-medium flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{geoError}</span>
        </div>
      )}

      {/* Interactive Leaflet Map */}
      <div className="relative w-full h-72 rounded-2xl border border-rule overflow-hidden shadow-inner-soft">
        <div ref={mapContainerRef} className="w-full h-full z-0" />
        <div className="absolute bottom-2 left-2 right-2 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg text-[11px] font-medium text-mid z-[400] shadow-sm flex items-center justify-between pointer-events-none">
          <span>Click anywhere on the map or drag the pin to adjust your exact location.</span>
        </div>
      </div>
    </div>
  );
}
