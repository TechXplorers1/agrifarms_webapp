import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { apiService } from '../services/apiService';
import { useLanguage } from '../services/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Star, MapPin, Info, Hammer, Truck, Users, Loader2 } from 'lucide-react';
import { LocationFilterBar, type LocationTarget } from '../components/LocationFilterBar';


interface ServiceItem {
  id: string;
  name: string;
  category: string;
  price: string;
  imageUrl?: string;
  rating?: number;
  location?: string;
  type: 'Service' | 'Transport' | 'Worker';
  specs?: string;
  providerId?: string;
  providerName?: string;
  operatorPrice?: number;
  operatorAvailable?: boolean;
  latitude?: string | number;
  longitude?: string | number;
  distance?: number;
  // Worker-specific pricing fields
  pricePerMale?: number;
  pricePerMaleHourly?: number;
  pricePerFemale?: number;
  pricePerFemaleHourly?: number;
  maleCount?: number;
  femaleCount?: number;
  roles?: any[];
  // Vehicle-specific fields
  pricePerKm?: number;
  pricePerHour?: number;
  brand?: string;
  model?: string;
  yearOfManufacture?: number;
  vehicleCondition?: string;
  ownerBusinessName?: string;
}

const calculateHaversine = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Radius of Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const Services: React.FC = () => {
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [items, setItems] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const transportTypesList = ['Mini Trucks', 'Tractors with Trolley', 'Trucks', 'Containers'];

  const initialMainFilter = transportTypesList.includes(location.state?.initialFilter)
    ? 'Transport'
    : (location.state?.initialFilter || 'All');

  const initialSubFilter = transportTypesList.includes(location.state?.initialFilter)
    ? location.state?.initialFilter
    : 'All';

  const [filter, setFilter] = useState(initialMainFilter);
  const [subFilter, setSubFilter] = useState(initialSubFilter);
  const [searchQuery, setSearchQuery] = useState(location.state?.initialSearch || '');

  // Re-apply filter whenever navigation state changes (e.g. clicking Services in navbar while already on this page)
  useEffect(() => {
    const initF = location.state?.initialFilter;
    if (transportTypesList.includes(initF)) {
      setFilter('Transport');
      setSubFilter(initF);
    } else {
      setFilter(initF || 'All');
      setSubFilter('All');
    }
  }, [location.state?.initialFilter, location.key]);
  const [_userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [maxDistance, setMaxDistance] = useState<number | 'All'>(50);
  const [targetLocation, setTargetLocation] = useState<LocationTarget | null>(null);

  const categories = [
    { value: 'All', label: 'All Services' },
    { value: 'Ploughing', label: 'Ploughing' },
    { value: 'Electricians', label: 'Electricians' },
    { value: 'Harvesting', label: 'Harvesting' },
    { value: 'Farm workers', label: 'Farm workers' },
    { value: 'Drone Spraying', label: 'Drone spraying' }
  ];

  useEffect(() => {
    const fetchServicesAndCoords = async () => {
      setLoading(true);

      // 1. Get user coordinates
      let coords: { latitude: number; longitude: number } | null = null;

      // Try guest location coordinates first
      const guestLocStr = localStorage.getItem('agrifarm_guest_location');
      if (guestLocStr) {
        try {
          const parsed = JSON.parse(guestLocStr);
          if (parsed.latitude && parsed.longitude) {
            coords = { latitude: parseFloat(parsed.latitude), longitude: parseFloat(parsed.longitude) };
          }
        } catch (e) {
          console.error(e);
        }
      }

      // If logged in and guest not available, get user profile coordinates
      if (!coords && isAuthenticated) {
        const storedUser = localStorage.getItem('agrifarm_user');
        if (storedUser) {
          try {
            const parsed = JSON.parse(storedUser);
            if (parsed.id) {
              const res = await apiService.getUser(parsed.id);
              if (res && res.data && res.data.latitude && res.data.longitude) {
                coords = { latitude: parseFloat(res.data.latitude), longitude: parseFloat(res.data.longitude) };
              }
            }
          } catch (err) {
            console.error("Failed to load user profile coords:", err);
          }
        }
      }

      // Browser geolocation fallback
      if (!coords && navigator.geolocation) {
        try {
          coords = await new Promise<{ latitude: number; longitude: number } | null>((resolve) => {
            navigator.geolocation.getCurrentPosition(
              (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
              () => resolve({ latitude: 14.6819, longitude: 77.6006 }), // default to Anantapur
              { enableHighAccuracy: true, timeout: 5000 }
            );
          });
        } catch (e) {
          coords = { latitude: 14.6819, longitude: 77.6006 };
        }
      }

      if (!coords) {
        coords = { latitude: 14.6819, longitude: 77.6006 }; // fallback
      }

      setUserCoords(coords);

      try {
        const [serv, veh, work] = await Promise.all([
          apiService.getServices(),
          apiService.getVehicles(),
          apiService.getWorkerGroups()
        ]);

        const normalized: ServiceItem[] = [
          ...(serv.data || []).map((s: any) => ({
            id: s.serviceId,
            name: s.businessName || 'Unknown Service',
            category: s.serviceType || 'General',
            price: s.serviceType === 'Electricians' ? `₹${s.priceRate}/visit` : `₹${s.priceRate}/hr`,
            imageUrl: s.imageUrl,
            type: 'Service' as const,
            location: s.village,
            providerId: s.ownerId,
            providerName: s.ownerName,
            operatorPrice: s.operatorPrice,
            operatorAvailable: s.operatorIncluded,
            latitude: s.latitude,
            longitude: s.longitude,
            equipmentUsed: s.equipmentUsed,
            description: s.description
          })),
          ...(veh.data || []).map((v: any) => ({
            id: v.vehicleId,
            name: v.brand ? `${v.brand} ${v.model || ''}`.trim() : v.category || 'Vehicle',
            category: v.category || 'Vehicle',
            price: v.pricePerHour ? `₹${v.pricePerHour}/hr` : (v.pricePerKm ? `₹${v.pricePerKm}/km` : '₹0'),
            imageUrl: v.imageUrl,
            type: 'Transport' as const,
            location: v.village,
            providerId: v.ownerId,
            providerName: v.ownerName,
            latitude: v.latitude,
            longitude: v.longitude,
            pricePerKm: v.pricePerKm,
            pricePerHour: v.pricePerHour,
            brand: v.brand,
            model: v.model,
            vehicleCondition: v.vehicleCondition,
          })),
          ...(work.data || []).map((w: any) => ({
            id: w.groupId,
            name: w.groupName || 'Worker Group',
            category: 'Farm Workers',
            price: `₹${w.pricePerMale || w.pricePerFemale || 0}/day`,
            imageUrl: w.imageUrl,
            type: 'Worker' as const,
            location: w.village,
            providerId: w.ownerId,
            providerName: w.ownerName,
            latitude: w.latitude,
            longitude: w.longitude,
            pricePerMale: w.pricePerMale,
            pricePerFemale: w.pricePerFemale,
            pricePerMaleHourly: w.pricePerMaleHourly,
            pricePerFemaleHourly: w.pricePerFemaleHourly,
            maleCount: w.maleCount,
            femaleCount: w.femaleCount,
            roles: w.roles
          }))
        ];

        // Calculate distances
        const processedItems = normalized.map((item) => {
          if (coords && item.latitude && item.longitude) {
            const dist = calculateHaversine(coords.latitude, coords.longitude, parseFloat(String(item.latitude)), parseFloat(String(item.longitude)));
            return { ...item, distance: dist };
          }
          return { ...item };
        });

        // Sort distance-wise: closest first
        processedItems.sort((a, b) => {
          if (a.distance === undefined && b.distance === undefined) return 0;
          if (a.distance === undefined) return 1;
          if (b.distance === undefined) return -1;
          return a.distance - b.distance;
        });

        setItems(processedItems);
      } catch (error) {
        console.error('Error fetching services:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchServicesAndCoords();
  }, [isAuthenticated]);

  // Derive location filter items for the LocationFilterBar
  const locationItems = React.useMemo(() => items.map(item => ({
    location: item.location,
    latitude: item.latitude,
    longitude: item.longitude,
  })), [items]);

  const processedItems = items.map(item => {
    const refLat = targetLocation?.latitude ?? _userCoords?.latitude;
    const refLon = targetLocation?.longitude ?? _userCoords?.longitude;

    let computedDist = item.distance;
    if (refLat && refLon && item.latitude && item.longitude) {
      computedDist = calculateHaversine(refLat, refLon, parseFloat(String(item.latitude)), parseFloat(String(item.longitude)));
    }
    return { ...item, computedDist };
  });

  const filteredItems = processedItems.filter(item => {
    const itemCat = item.category || '';
    const itemName = item.name || '';
    const searchQ = searchQuery || '';
    const filterQ = filter || 'All';

    const matchesFilter = filterQ === 'All' ||
      (filterQ === 'Transport' && item.type === 'Transport' && (subFilter === 'All' || itemCat === subFilter)) ||
      (filterQ !== 'All' && filterQ !== 'Transport' && itemCat.toLowerCase() === filterQ.toLowerCase());

    const matchesSearch = itemName.toLowerCase().includes(searchQ.toLowerCase()) ||
      itemCat.toLowerCase().includes(searchQ.toLowerCase());

    const matchesDistance = maxDistance === 'All' ||
      (item.computedDist !== undefined && item.computedDist <= maxDistance) ||
      (item.computedDist === undefined && targetLocation && !targetLocation.isCurrentLocation);

    // Location filter: if a custom target is selected and we couldn't calculate distance, match by string
    let matchesLocation = true;
    if (targetLocation && !targetLocation.isCurrentLocation && item.computedDist === undefined) {
      const tLoc = (targetLocation.village || targetLocation.name || '').toLowerCase();
      const tDistrict = (targetLocation.district || '').toLowerCase();
      const iLoc = (item.location || '').toLowerCase();
      matchesLocation = !!((tLoc && iLoc.includes(tLoc)) || (tDistrict && iLoc.includes(tDistrict)));
    }

    return matchesFilter && matchesSearch && matchesDistance && matchesLocation;
  });

  return (
    <div className="services-page container fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="text-3xl font-bold">{filter === 'Transport' ? 'Transports' : t('services.title')}</h1>
          <p className="text-slate-500">{filter === 'Transport' ? 'Hire professional transport services' : t('services.desc')}</p>
        </div>
        {isAuthenticated && user?.role !== 'FARMER' && (
          <button
            className="btn-primary"
            onClick={() => navigate('/upload-item', { state: { category: filter === 'Transport' ? 'Vehicles' : 'Services' } })}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '12px',
              fontSize: '0.95rem',
              fontWeight: 700
            }}
          >
            <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>+</span>
            <span>{filter === 'Transport' ? 'Add New Transport' : 'Add New Service'}</span>
          </button>
        )}
      </div>

      <LocationFilterBar
        allItems={locationItems}
        targetLocation={targetLocation}
        onLocationChange={setTargetLocation}
        maxDistance={maxDistance}
        onDistanceChange={setMaxDistance}
      />

      <div className="search-bar-row">
        <div className="search-box">
          <Search size={20} className="text-slate-400" />
          <input
            type="text"
            placeholder={t('services.placeholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {filter !== 'Transport' && (
        <div className="category-pills">
          {categories.map(cat => (
            <button
              key={cat.value}
              className={`pill ${filter === cat.value ? 'active' : ''}`}
              onClick={() => {
                setFilter(cat.value);
                setSubFilter('All');
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {filter === 'Transport' && (
        <div className="sub-category-tabs" style={{
          display: 'flex',
          gap: '10px',
          padding: '0 20px',
          marginBottom: '24px',
          overflowX: 'auto',
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch'
        }}>
          <button
            className={`sub-pill ${subFilter === 'All' ? 'active' : ''}`}
            onClick={() => setSubFilter('All')}
            style={{
              padding: '8px 18px',
              borderRadius: '100px',
              fontSize: '0.85rem',
              fontWeight: 700,
              border: subFilter === 'All' ? '1px solid var(--primary)' : '1px solid var(--border)',
              background: subFilter === 'All' ? 'var(--primary)' : 'white',
              color: subFilter === 'All' ? 'white' : 'var(--text-main)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: subFilter === 'All' ? '0 4px 12px rgba(16, 185, 129, 0.2)' : 'none'
            }}
          >
            All Transports
          </button>
          {transportTypesList.map(type => (
            <button
              key={type}
              className={`sub-pill ${subFilter === type ? 'active' : ''}`}
              onClick={() => setSubFilter(type)}
              style={{
                padding: '8px 18px',
                borderRadius: '100px',
                fontSize: '0.85rem',
                fontWeight: 700,
                border: subFilter === type ? '1px solid var(--primary)' : '1px solid var(--border)',
                background: subFilter === type ? 'var(--primary)' : 'white',
                color: subFilter === type ? 'white' : 'var(--text-main)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: subFilter === type ? '0 4px 12px rgba(16, 185, 129, 0.2)' : 'none'
              }}
            >
              {type}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
          <Loader2 className="animate-spin" size={48} color="var(--primary)" />
        </div>
      ) : subFilter === 'Containers' ? (
        <div className="empty-state">
          <Info size={48} className="text-slate-300" />
          <h3>Coming Soon!</h3>
          <p>Container transport services will be available shortly.</p>
        </div>
      ) : (
        <div className="assets-grid">
          <AnimatePresence>
            {filteredItems.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="asset-card"
              >
                <div className="asset-image">
                  <img src={apiService.getFullImageUrl(item.imageUrl) || 'https://images.unsplash.com/photo-1594913785162-e6785b493bd2?auto=format&fit=crop&q=80&w=400'} alt={item.name} />
                  <div className="category-tag">
                    {item.type === 'Service' && <Hammer size={12} />}
                    {item.type === 'Transport' && <Truck size={12} />}
                    {item.type === 'Worker' && <Users size={12} />}
                    <span>{item.type}</span>
                  </div>
                </div>
                <div className="asset-info">
                  <div className="asset-top">
                    <h4>{item.name}</h4>
                    <div className="rating">
                      <Star size={14} fill="#f9a825" color="#f9a825" />
                      <span>{item.rating || '4.5'}</span>
                    </div>
                  </div>
                  <div className="asset-details">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="category">{item.category}</p>
                      {item.specs && <span className="spec-badge">{item.specs}</span>}
                      {item.type === 'Transport' && item.vehicleCondition && (
                        <span className="spec-badge" style={{ backgroundColor: '#f0fdf4', color: '#166534', borderColor: '#bbf7d0' }}>
                          Condition: {item.vehicleCondition.charAt(0).toUpperCase() + item.vehicleCondition.slice(1).toLowerCase()}
                        </span>
                      )}
                    </div>

                    {/* Transport pricing grid */}
                    {item.type === 'Transport' && (
                      <div className="responsive-grid-2" style={{
                        gap: '6px',
                        margin: '10px 0 12px 0'
                      }}>
                        {/* Per KM */}
                        <div style={{
                          background: 'linear-gradient(135deg, #efebe9, #d7ccc8)',
                          border: '1px solid #bcaaa4',
                          borderRadius: '10px',
                          padding: '8px 10px'
                        }}>
                          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#5d4037', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '4px' }}>
                            🛣️ Rate Per KM
                          </div>
                          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#3e2723' }}>
                            {item.pricePerKm ? `₹${item.pricePerKm}/km` : '—'}
                          </span>
                        </div>
                        {/* Per Hour */}
                        <div style={{
                          background: 'linear-gradient(135deg, #e0f2f1, #b2dfdb)',
                          border: '1px solid #80cbc4',
                          borderRadius: '10px',
                          padding: '8px 10px'
                        }}>
                          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#00796b', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '4px' }}>
                            ⏱️ Rate Per Hour
                          </div>
                          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#004d40' }}>
                            {item.pricePerHour ? `₹${item.pricePerHour}/hr` : '—'}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Worker pricing grid */}
                    {item.type === 'Worker' && (
                      <div className="responsive-grid-2" style={{
                        gap: '6px',
                        margin: '10px 0 12px 0'
                      }}>
                        {/* Male */}
                        <div style={{
                          background: 'linear-gradient(135deg, #e3f2fd, #f0f8ff)',
                          border: '1px solid #bbdefb',
                          borderRadius: '10px',
                          padding: '8px 10px'
                        }}>
                          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#1565c0', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '6px' }}>
                            👨‍🌾 Male {item.maleCount ? `(${item.maleCount})` : ''}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0d47a1' }}>
                              {item.pricePerMale ? `₹${item.pricePerMale}/day` : '—'}
                            </span>
                            {item.pricePerMaleHourly ? (
                              <span style={{ fontSize: '0.72rem', color: '#1976d2', fontWeight: 600 }}>
                                ₹{item.pricePerMaleHourly}/hr
                              </span>
                            ) : null}
                          </div>
                        </div>
                        {/* Female */}
                        <div style={{
                          background: 'linear-gradient(135deg, #fce4ec, #fff0f5)',
                          border: '1px solid #f8bbd0',
                          borderRadius: '10px',
                          padding: '8px 10px'
                        }}>
                          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#880e4f', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '6px' }}>
                            👩‍🌾 Female {item.femaleCount ? `(${item.femaleCount})` : ''}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#880e4f' }}>
                              {item.pricePerFemale ? `₹${item.pricePerFemale}/day` : '—'}
                            </span>
                            {item.pricePerFemaleHourly ? (
                              <span style={{ fontSize: '0.72rem', color: '#c2185b', fontWeight: 600 }}>
                                ₹{item.pricePerFemaleHourly}/hr
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Skill-wise worker division breakdown */}
                    {item.type === 'Worker' && item.roles && item.roles.length > 0 && (
                      <div style={{
                        marginTop: '10px',
                        marginBottom: '12px',
                        padding: '12px',
                        background: '#f8fafc',
                        borderRadius: '12px',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.4px', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>
                          Skill-wise worker division
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {item.roles.map((r: any) => (
                            <div key={r.roleId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem' }}>
                              <span style={{ fontWeight: 600, color: '#475569' }}>
                                {r.taskName.charAt(0).toUpperCase() + r.taskName.slice(1)}
                              </span>
                              <span style={{
                                fontWeight: 800,
                                fontSize: '0.75rem',
                                color: r.gender === 'MALE' ? '#0284c7' : '#db2777',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}>
                                <span>{r.gender === 'MALE' ? '👨‍🌾' : '👩‍🌾'}</span>
                                <span>{r.count} {r.gender === 'MALE' ? 'Men' : 'Women'}</span>
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="location" style={{ marginBottom: '0' }}>
                      <MapPin size={14} />
                      <span>
                        {item.location || 'Local'}
                        {item.computedDist !== undefined ? ` • ${item.computedDist.toFixed(1)} km away` : ''}
                      </span>
                    </div>
                  </div>
                  <div className="asset-footer">
                    <div className="price-tag">
                      <span className="amount">{item.price}</span>
                    </div>
                    <button
                      className="btn-book"
                      onClick={() => {
                        if (!isAuthenticated) {
                          navigate('/login');
                          return;
                        }
                        const assetData = {
                          id: item.id,
                          name: item.name,
                          category: item.category,
                          price: parseFloat(item.price.replace(/[^0-9.]/g, '')),
                          providerId: item.providerId || 'owner123',
                          providerName: item.providerName || 'Service Provider',
                          imageUrl: item.imageUrl,
                          type: item.type,
                          operatorPrice: item.operatorPrice,
                          operatorAvailable: item.operatorAvailable,
                          details: item
                        };
                        navigate('/book', { state: { asset: assetData } });
                      }}
                    >
                      {t('rentals.bookNow')}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {!loading && subFilter !== 'Containers' && filteredItems.length === 0 && (
        <div className="empty-state">
          <Info size={48} className="text-slate-300" />
          <h3>{t('services.empty')}</h3>
          <p>{t('rentals.adjustFilters')}</p>
        </div>
      )}

      <style>{`
        .services-page { padding-top: 24px; }
        .search-bar-row { margin: 24px 0; max-width: 600px; }
        .assets-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 24px;
          margin-bottom: 40px;
        }
        .asset-card {
          background: white;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: var(--shadow-md);
          border: 1px solid var(--border);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .asset-card:hover {
          transform: translateY(-8px);
          box-shadow: var(--shadow-xl);
          border-color: var(--primary-light);
        }
        .asset-image { height: 180px; position: relative; }
        .asset-image img { width: 100%; height: 100%; object-fit: cover; }
        
        .category-tag {
          position: absolute;
          top: 12px;
          left: 12px;
          background: rgba(0, 0, 0, 0.6);
          color: white;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 700;
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .asset-info { padding: 20px; }
        .asset-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
        .asset-top h4 { font-size: 1.15rem; font-weight: 700; }
        .rating { display: flex; align-items: center; gap: 4px; font-weight: 700; font-size: 0.875rem; }
        .asset-details { margin-bottom: 16px; }
        .category { color: var(--primary); font-weight: 700; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
        .location { display: flex; align-items: center; gap: 4px; color: var(--text-muted); font-size: 0.875rem; }
        .asset-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 16px; border-top: 1px dashed var(--border); }
        .price-tag .amount { font-size: 1.25rem; font-weight: 800; color: var(--text-main); }
        .btn-book { background: var(--primary); color: white; padding: 8px 18px; border-radius: 12px; font-weight: 700; font-size: 0.875rem; transition: all 0.2s; }
        .btn-book:hover { background: var(--primary-dark); transform: scale(1.05); }
        .skeleton-card { height: 320px; background: #f1f5f9; border-radius: 24px; animation: pulse 1.5s infinite; }
        .empty-state { text-align: center; padding: 60px; color: var(--text-muted); }
        @keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 0.3; } 100% { opacity: 0.6; } }
        .spec-badge {
          background: #f1f5f9;
          color: #475569;
          font-size: 0.7rem;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
        }
      `}</style>
    </div>
  );
};

export default Services;

