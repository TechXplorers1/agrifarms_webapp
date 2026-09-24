/**
 * LocationFilterBar — mirrors the mobile app's ServiceProvidersScreen location filter:
 *   Location bar + Change button → bottom-sheet modal with:
 *     1. Use My GPS
 *     2. Nominatim search (village / mandal / district)
 *     3. Quick-select chips (areas from active providers)
 *     4. Manual entry form
 *   + Distance km dropdown
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Navigation, Search, X, ChevronDown, SlidersHorizontal, Loader2, Zap } from 'lucide-react';

export interface LocationTarget {
  name: string;
  displayName: string;
  latitude?: number;
  longitude?: number;
  village?: string;
  district?: string;
  isCurrentLocation: boolean;
}

interface LocationFilterBarProps {
  allItems: Array<{ location?: string; latitude?: number | string; longitude?: number | string }>;
  targetLocation: LocationTarget | null;
  onLocationChange: (loc: LocationTarget | null) => void;
  maxDistance: number | 'All';
  onDistanceChange: (v: number | 'All') => void;
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  name: string;
  lat: string;
  lon: string;
  address?: { village?: string; town?: string; city?: string; county?: string; district?: string; state?: string };
}

function getUserStoredLocation(): LocationTarget {
  const selected = localStorage.getItem('agrifarm_selected_location');
  if (selected) {
    try {
      const s = JSON.parse(selected);
      if (s.village || s.district || s.name) {
        return {
          name: s.village || s.district || s.name,
          displayName: s.displayName || [s.village, s.district].filter(Boolean).join(', ') || s.name,
          latitude: s.latitude ? parseFloat(s.latitude) : undefined,
          longitude: s.longitude ? parseFloat(s.longitude) : undefined,
          village: s.village, district: s.district, isCurrentLocation: s.isCurrentLocation || false,
        };
      }
    } catch { /**/ }
  }

  const stored = localStorage.getItem('agrifarm_user');
  if (stored) {
    try {
      const u = JSON.parse(stored);
      if (u.village || u.district) {
        return {
          name: u.village || u.district,
          displayName: [u.village, u.district].filter(Boolean).join(', '),
          latitude: u.latitude ? parseFloat(u.latitude) : undefined,
          longitude: u.longitude ? parseFloat(u.longitude) : undefined,
          village: u.village, district: u.district, isCurrentLocation: true,
        };
      }
    } catch { /**/ }
  }
  const guest = localStorage.getItem('agrifarm_guest_location');
  if (guest) {
    try {
      const g = JSON.parse(guest);
      if (g.village || g.district) {
        return {
          name: g.village || g.district,
          displayName: [g.village, g.district].filter(Boolean).join(', '),
          latitude: g.latitude ? parseFloat(g.latitude) : undefined,
          longitude: g.longitude ? parseFloat(g.longitude) : undefined,
          village: g.village, district: g.district, isCurrentLocation: true,
        };
      }
    } catch { /**/ }
  }
  return { name: 'Current Location', displayName: 'Current Location', isCurrentLocation: true };
}

interface ModalProps {
  onClose: () => void;
  currentLocation: LocationTarget | null;
  allItems: LocationFilterBarProps['allItems'];
  onSelect: (loc: LocationTarget | null) => void;
}

const LocationSelectorModal: React.FC<ModalProps> = ({ onClose, currentLocation, allItems, onSelect }) => {
  const [searchText, setSearchText] = useState('');
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualVillage, setManualVillage] = useState('');
  const [manualDistrict, setManualDistrict] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const areaCounts: Record<string, number> = {};
  const areaSample: Record<string, { latitude?: number | string; longitude?: number | string }> = {};
  allItems.forEach(item => {
    const loc = (item.location || '').trim();
    if (loc) {
      areaCounts[loc] = (areaCounts[loc] ?? 0) + 1;
      if (!areaSample[loc]) areaSample[loc] = { latitude: item.latitude, longitude: item.longitude };
    }
  });

  useEffect(() => { setTimeout(() => searchInputRef.current?.focus(), 150); }, []);

  const handleSearchChange = (val: string) => {
    setSearchText(val);
    setSearchError(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!val.trim()) { setSuggestions([]); return; }
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(val + ', India')}&format=json&limit=6&addressdetails=1`,
          { headers: { 'User-Agent': 'AgriFarmsApp/1.0' } }
        );
        const data: NominatimResult[] = await res.json();
        setSuggestions(data);
        if (data.length === 0) setSearchError('No places found. Try a different spelling or enter manually below.');
      } catch { setSearchError('Search failed. Check your connection and try again.'); }
      finally { setIsSearching(false); }
    }, 500);
  };

  const handleSelectSuggestion = (item: NominatimResult) => {
    const addr = item.address || {};
    const village = addr.village || addr.town || addr.city || item.name;
    const district = addr.county || addr.district;
    onSelect({ name: village || item.display_name, displayName: item.display_name, latitude: parseFloat(item.lat), longitude: parseFloat(item.lon), village, district, isCurrentLocation: false });
    onClose();
  };

  const handleGps = async () => {
    setIsDetectingGps(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 })
      );
      const { latitude, longitude } = pos.coords;
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`, { headers: { 'User-Agent': 'AgriFarmsApp/1.0' } });
      const data = await res.json();
      const addr = data.address || {};
      const village = addr.city || addr.town || addr.village || addr.suburb || 'Current Location';
      const district = addr.district || addr.county;
      onSelect({ name: village, displayName: [village, district].filter(Boolean).join(', '), latitude, longitude, village, district, isCurrentLocation: true });
      onClose();
    } catch { alert('Could not detect GPS. Please allow location permission or search manually.'); }
    finally { setIsDetectingGps(false); }
  };

  const handleManualSubmit = async () => {
    if (!manualVillage.trim()) { alert('Please enter a village or town name.'); return; }
    const name = manualVillage.trim();
    const district = manualDistrict.trim() || undefined;
    let lat: number | undefined, lng: number | undefined;
    try {
      const q = [name, district, 'India'].filter(Boolean).join(', ');
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q!)}&format=json&limit=1`, { headers: { 'User-Agent': 'AgriFarmsApp/1.0' } });
      const data = await res.json();
      if (data[0]) { lat = parseFloat(data[0].lat); lng = parseFloat(data[0].lon); }
    } catch { /**/ }
    onSelect({ name, displayName: [name, district].filter(Boolean).join(', '), latitude: lat, longitude: lng, village: name, district, isCurrentLocation: false });
    onClose();
  };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, backdropFilter: 'blur(2px)' }} />
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1001, background: 'white', borderRadius: '28px 28px 0 0', maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 -8px 40px rgba(0,0,0,0.18)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
          <div style={{ width: 44, height: 4, background: '#ddd', borderRadius: 2 }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px 8px' }}>
          <div style={{ padding: 8, background: 'rgba(0,170,85,0.12)', borderRadius: 10, display: 'flex' }}>
            <MapPin size={22} color="#00AA55" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#2C3E50' }}>Select Search Location</div>
            <div style={{ fontSize: '0.78rem', color: '#888', marginTop: 2 }}>Find providers near your farm or another village</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999' }}><X size={22} /></button>
        </div>
        <div style={{ height: 1, background: '#eee', margin: '8px 0' }} />
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 32px' }}>

          {/* GPS button */}
          <button onClick={handleGps} disabled={isDetectingGps}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', border: '1px solid #C8E6C9', borderRadius: 14, background: '#F1F8F1', cursor: 'pointer', textAlign: 'left', opacity: isDetectingGps ? 0.7 : 1 }}>
            <div style={{ padding: 8, background: '#00AA55', borderRadius: '50%', display: 'flex', flexShrink: 0 }}>
              {isDetectingGps ? <Loader2 size={16} color="white" className="animate-spin" /> : <Navigation size={16} color="white" />}
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#1B5E20', fontSize: '0.9rem' }}>Use My Current GPS Location</div>
              <div style={{ fontSize: '0.75rem', color: '#666', marginTop: 2 }}>Detect live device GPS and nearby providers</div>
            </div>
            <ChevronDown size={18} color="#00AA55" style={{ marginLeft: 'auto', transform: 'rotate(-90deg)' }} />
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '18px 0 14px' }}>
            <div style={{ flex: 1, height: 1, background: '#eee' }} />
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#aaa', letterSpacing: '0.6px', whiteSpace: 'nowrap' }}>OR SEARCH VILLAGE / TOWN</span>
            <div style={{ flex: 1, height: 1, background: '#eee' }} />
          </div>

          {/* Nominatim search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#F6F8F6', borderRadius: 12, border: '1px solid #D8E2D8', padding: '0 12px', height: 48 }}>
            <Search size={18} color="#00AA55" />
            <input ref={searchInputRef} value={searchText} onChange={e => handleSearchChange(e.target.value)}
              placeholder="Search village, mandal, or district..."
              style={{ flex: 1, border: 'none', background: 'none', outline: 'none', fontSize: '0.875rem', fontWeight: 600, color: '#2C3E50' }} />
            {searchText && <button onClick={() => { setSearchText(''); setSuggestions([]); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa' }}><X size={16} /></button>}
          </div>

          {isSearching && <div style={{ textAlign: 'center', padding: '16px 0' }}><Loader2 size={24} color="#00AA55" className="animate-spin" /></div>}
          {searchError && !isSearching && <div style={{ padding: '10px 4px', fontSize: '0.8rem', color: '#c47a00', fontWeight: 600 }}>{searchError}</div>}

          {/* Suggestions */}
          {suggestions.length > 0 && !isSearching && (
            <div style={{ marginTop: 12, background: 'white', borderRadius: 14, border: '1px solid #E8ECE8', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
              {suggestions.slice(0, 6).map((item, idx) => (
                <button key={item.place_id} onClick={() => handleSelectSuggestion(item)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', borderBottom: idx < suggestions.length - 1 ? '1px solid #f0f0f0' : 'none' }}
                  onMouseOver={e => (e.currentTarget.style.background = '#f8faf8')} onMouseOut={e => (e.currentTarget.style.background = 'none')}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <MapPin size={16} color="#00AA55" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#2C3E50' }}>{item.name || item.display_name.split(',')[0]}</div>
                    <div style={{ fontSize: '0.75rem', color: '#888', marginTop: 1 }}>{item.display_name}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Provider area chips */}
          {Object.keys(areaCounts).length > 0 && suggestions.length === 0 && !isSearching && (
            <div style={{ marginTop: 22 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <Zap size={15} color="#00AA55" />
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#888', letterSpacing: '0.5px' }}>AREAS WITH ACTIVE PROVIDERS</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {Object.entries(areaCounts).slice(0, 12).map(([loc, count]) => {
                  const sample = areaSample[loc];
                  const isSel = currentLocation?.name?.toLowerCase() === loc.toLowerCase();
                  return (
                    <button key={loc}
                      onClick={() => { onSelect({ name: loc, displayName: loc, latitude: sample?.latitude as number | undefined, longitude: sample?.longitude as number | undefined, village: loc, isCurrentLocation: false }); onClose(); }}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 10, border: `1px solid ${isSel ? '#00AA55' : '#E0E6E0'}`, background: isSel ? '#00AA55' : '#F4F6F4', color: isSel ? 'white' : '#2C3E50', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
                      <MapPin size={12} />{loc} <span style={{ opacity: 0.7 }}>({count})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Manual entry */}
          {suggestions.length === 0 && !isSearching && (
            <div style={{ marginTop: 22 }}>
              <button onClick={() => setShowManualEntry(v => !v)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: '#00AA55', fontWeight: 700, fontSize: '0.875rem', padding: '6px 0' }}>
                <ChevronDown size={18} style={{ transform: showManualEntry ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                Can't find your village? Enter manually
              </button>
              {showManualEntry && (
                <div style={{ marginTop: 10, padding: 14, background: '#F9FBF9', borderRadius: 14, border: '1px solid #E2EBE2' }}>
                  <input value={manualVillage} onChange={e => setManualVillage(e.target.value)} placeholder="Village / Town Name *  (e.g. Nidubrolu, Inkollu…)"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #ccc', fontSize: '0.875rem', boxSizing: 'border-box', fontFamily: 'inherit', fontWeight: 600, outline: 'none' }} />
                  <input value={manualDistrict} onChange={e => setManualDistrict(e.target.value)} placeholder="District (Optional)  (e.g. Bapatla, Guntur…)"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #ccc', fontSize: '0.875rem', boxSizing: 'border-box', fontFamily: 'inherit', fontWeight: 600, outline: 'none', marginTop: 10 }} />
                  <button onClick={handleManualSubmit}
                    style={{ width: '100%', marginTop: 12, padding: 12, background: '#00AA55', color: 'white', fontWeight: 800, fontSize: '0.9rem', border: 'none', borderRadius: 10, cursor: 'pointer' }}>
                    Set As Search Location
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

const DISTANCE_OPTIONS = [
  { label: 'All Distances', value: 'All' as const },
  { label: '5 km', value: 5 }, { label: '10 km', value: 10 }, { label: '15 km', value: 15 },
  { label: '25 km', value: 25 }, { label: '50 km', value: 50 }, { label: '75 km', value: 75 }, { label: '100 km', value: 100 },
];

export const LocationFilterBar: React.FC<LocationFilterBarProps> = ({ allItems, targetLocation, onLocationChange, maxDistance, onDistanceChange }) => {
  const [showModal, setShowModal] = useState(false);
  const [showDistDrop, setShowDistDrop] = useState(false);
  const distRef = useRef<HTMLDivElement>(null);
  const isCustom = targetLocation !== null && !targetLocation.isCurrentLocation;
  const locText = targetLocation?.displayName ?? 'Current Location';

  useEffect(() => {
    if (!targetLocation) onLocationChange(getUserStoredLocation());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (distRef.current && !distRef.current.contains(e.target as Node)) setShowDistDrop(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleReset = useCallback(() => { 
    localStorage.removeItem('agrifarm_selected_location');
    onLocationChange(getUserStoredLocation()); 
  }, [onLocationChange]);

  return (
    <>
      <div style={{ display: 'flex', gap: 10, alignItems: 'stretch', flexWrap: 'wrap', margin: '0 0 16px' }}>
        {/* Location bar */}
        <div style={{ flex: '1 1 240px', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: isCustom ? '#E8F5E9' : '#F4F6F4', borderRadius: 12, border: `${isCustom ? 1.5 : 1}px solid ${isCustom ? '#00AA55' : '#E0E6E0'}`, minWidth: 0 }}>
          <div style={{ padding: 6, borderRadius: '50%', background: isCustom ? '#00AA55' : '#bbb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <MapPin size={14} color="white" />
          </div>
          <button onClick={() => setShowModal(true)} style={{ flex: 1, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.4px', color: isCustom ? '#008844' : '#888' }}>{isCustom ? 'SEARCHING NEAR' : 'SEARCH LOCATION'}</span>
              {isCustom && <span style={{ background: '#00AA55', color: 'white', fontSize: '0.55rem', fontWeight: 800, padding: '1px 4px', borderRadius: 3 }}>CUSTOM</span>}
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, marginTop: 2, color: isCustom ? '#1B5E20' : '#2C3E50', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{locText}</div>
          </button>
          <button onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0, padding: '5px 8px', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: '0.78rem', color: '#00AA55', background: isCustom ? 'white' : 'rgba(0,170,85,0.08)', border: isCustom ? '1px solid #00AA55' : 'none' }}>
            Change <ChevronDown size={14} />
          </button>
          {isCustom && (
            <button onClick={handleReset} title="Reset to my location" style={{ padding: 4, borderRadius: 6, background: 'white', border: '1px solid #ddd', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={14} color="#777" />
            </button>
          )}
        </div>

        {/* Distance dropdown */}
        <div ref={distRef} style={{ position: 'relative', flexShrink: 0 }}>
          <button onClick={() => setShowDistDrop(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px', height: '100%', minHeight: 52, borderRadius: 12, cursor: 'pointer', fontWeight: 700, fontSize: '0.875rem', background: maxDistance !== 'All' ? '#00AA55' : 'white', color: maxDistance !== 'All' ? 'white' : '#2C3E50', border: `1px solid ${maxDistance !== 'All' ? '#00AA55' : '#E0E6E0'}`, transition: 'all 0.2s' }}>
            <SlidersHorizontal size={16} />
            <span>{maxDistance === 'All' ? 'Distance' : `≤ ${maxDistance} km`}</span>
            <ChevronDown size={13} />
          </button>
          {showDistDrop && (
            <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 8, background: 'white', borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', border: '1px solid #eee', padding: 8, zIndex: 500, minWidth: 180, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {DISTANCE_OPTIONS.map(opt => (
                <button key={String(opt.value)} onClick={() => { onDistanceChange(opt.value as any); setShowDistDrop(false); }}
                  style={{ padding: '10px 14px', borderRadius: 10, textAlign: 'left', fontWeight: 700, fontSize: '0.875rem', border: 'none', cursor: 'pointer', background: maxDistance === opt.value ? '#F0FDF4' : 'transparent', color: maxDistance === opt.value ? '#00AA55' : '#2C3E50' }}
                  onMouseOver={e => { if (maxDistance !== opt.value) e.currentTarget.style.background = '#f8faf8'; }}
                  onMouseOut={e => { if (maxDistance !== opt.value) e.currentTarget.style.background = 'transparent'; }}>
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Active chips */}
      {(isCustom || maxDistance !== 'All') && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          {isCustom && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#E8F5E9', color: '#00AA55', border: '1px solid #A5D6A7', borderRadius: 20, padding: '4px 12px', fontSize: '0.8rem', fontWeight: 700 }}>
              <MapPin size={12} /> {targetLocation?.name}
              <button onClick={handleReset} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#00AA55', fontWeight: 900, fontSize: '1rem', lineHeight: 1, padding: '0 2px' }}>×</button>
            </span>
          )}
          {maxDistance !== 'All' && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#E8F5E9', color: '#00AA55', border: '1px solid #A5D6A7', borderRadius: 20, padding: '4px 12px', fontSize: '0.8rem', fontWeight: 700 }}>
              <SlidersHorizontal size={12} /> ≤ {maxDistance} km
              <button onClick={() => onDistanceChange('All')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#00AA55', fontWeight: 900, fontSize: '1rem', lineHeight: 1, padding: '0 2px' }}>×</button>
            </span>
          )}
        </div>
      )}

      {showModal && (
        <LocationSelectorModal 
          onClose={() => setShowModal(false)} 
          currentLocation={targetLocation} 
          allItems={allItems} 
          onSelect={loc => { 
            if (loc) {
              localStorage.setItem('agrifarm_selected_location', JSON.stringify({
                name: loc.name,
                displayName: loc.displayName,
                village: loc.village,
                district: loc.district,
                latitude: loc.latitude,
                longitude: loc.longitude,
                isCurrentLocation: loc.isCurrentLocation
              }));
            }
            onLocationChange(loc); 
          }} 
        />
      )}
    </>
  );
};

export default LocationFilterBar;
