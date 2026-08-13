import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { apiService } from '../services/apiService';
import { useLanguage } from '../services/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Star, MapPin, Info, Hammer, Truck, Users, SlidersHorizontal, Loader2 } from 'lucide-react';


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
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<ServiceItem[]>([]);
  const [providerPhones, setProviderPhones] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(location.state?.initialFilter || 'All');
  const [searchQuery, setSearchQuery] = useState(location.state?.initialSearch || '');

  // Re-apply filter whenever navigation state changes (e.g. clicking Services in navbar while already on this page)
  useEffect(() => {
    if (location.state?.initialFilter) {
      setFilter(location.state.initialFilter);
    }
  }, [location.state?.initialFilter]);
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [showDistanceDropdown, setShowDistanceDropdown] = useState(false);
  const [maxDistance, setMaxDistance] = useState<number | 'All'>('All');

  const categories = [
    { value: 'All', label: t('rentals.all') },
    { value: 'Services', label: t('nav.services') },
    { value: 'Transport', label: t('services.transport') },
    { value: 'Workers', label: t('services.workers') }
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
          apiService.getWorkerGroups(),
          new Promise(resolve => setTimeout(resolve, 1000))
        ]);

        const normalized: ServiceItem[] = [
          ...(serv.data || []).map((s: any) => ({
            id: s.serviceId,
            name: s.businessName,
            category: s.serviceType,
            price: `₹${s.priceRate}`,
            imageUrl: s.imageUrl,
            type: 'Service',
            location: s.village,
            providerId: s.ownerId,
            providerName: s.ownerName,
            operatorPrice: s.operatorPrice,
            operatorAvailable: s.operatorIncluded,
            latitude: s.latitude,
            longitude: s.longitude
          })),
          ...(veh.data || []).map((v: any) => ({
            id: v.vehicleId,
            name: v.brand && v.model ? `${v.brand} ${v.model}` : (v.vehicleType || 'Transport'),
            category: v.vehicleType || 'Transport',
            price: v.pricePerHour ? `₹${v.pricePerHour}/hr` : (v.pricePerKm ? `₹${v.pricePerKm}/km` : `₹${v.pricePerKmOrTrip || 0}`),
            imageUrl: v.imageUrl,
            type: 'Transport',
            location: v.village,
            specs: v.loadCapacity ? `${v.loadCapacity} Ton` : (v.tonnage ? `${v.tonnage} Ton` : undefined),
            providerId: v.ownerId,
            providerName: v.ownerBusinessName || v.ownerName || 'Service Provider',
            latitude: v.latitude,
            longitude: v.longitude,
            pricePerKm: v.pricePerKm,
            pricePerHour: v.pricePerHour,
            brand: v.brand,
            model: v.model,
            yearOfManufacture: v.yearOfManufacture,
            vehicleCondition: v.vehicleCondition,
            ownerBusinessName: v.ownerBusinessName
          })),
          ...(work.data || []).map((w: any) => ({
            id: w.groupId,
            name: w.groupName,
            category: 'Manual Labor',
            price: `₹${w.pricePerMale}/day`,
            imageUrl: w.imageUrl,
            type: 'Worker',
            location: w.village,
            specs: `${(w.maleCount || 0) + (w.femaleCount || 0)} Workers`,
            providerId: w.ownerId,
            providerName: w.ownerName,
            latitude: w.latitude,
            longitude: w.longitude,
            pricePerMale: w.pricePerMale,
            pricePerMaleHourly: w.pricePerMaleHourly,
            pricePerFemale: w.pricePerFemale,
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

        // Fetch provider phone numbers
        const uniqueProviderIds = Array.from(new Set(processedItems.map(item => item.providerId).filter(Boolean))) as string[];
        const phoneMap: Record<string, string> = {};
        await Promise.all(
          uniqueProviderIds.map(async (id) => {
            try {
              const res = await apiService.getUser(id);
              if (res && res.data && res.data.phoneNumber) {
                phoneMap[id] = res.data.phoneNumber;
              }
            } catch (err) {
              console.error(`Failed to fetch user phone for provider ${id}:`, err);
            }
          })
        );
        setProviderPhones(phoneMap);
      } catch (error) {
        console.error('Error fetching services:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchServicesAndCoords();
  }, [isAuthenticated]);

  const filteredItems = items.filter(item => {
    const matchesFilter = filter === 'All' || 
                         (filter === 'Services' && item.type === 'Service') ||
                         (filter === 'Transport' && item.type === 'Transport') ||
                         (filter === 'Workers' && item.type === 'Worker');
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDistance = maxDistance === 'All' || 
                            (item.distance !== undefined && item.distance <= maxDistance);
    return matchesFilter && matchesSearch && matchesDistance;
  });

  return (
    <div className="services-page container fade-in">
      <div className="page-header">
        <div>
          <h1 className="text-3xl font-bold">{t('services.title')}</h1>
          <p className="text-slate-500">{t('services.desc')}</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', position: 'relative', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => setShowDistanceDropdown(!showDistanceDropdown)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                borderRadius: '12px',
                fontSize: '0.95rem',
                fontWeight: 700,
                border: '1px solid var(--border)',
                background: 'white',
                color: 'var(--text-main)',
                cursor: 'pointer'
              }}
            >
              <SlidersHorizontal size={18} />
              <span>{maxDistance === 'All' ? 'Distance Filter' : `Distance: ${maxDistance} km`}</span>
            </button>
            {showDistanceDropdown && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '8px',
                background: 'white',
                borderRadius: '16px',
                boxShadow: 'var(--shadow-lg)',
                border: '1px solid var(--border)',
                padding: '8px',
                zIndex: 100,
                minWidth: '180px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}>
                {[
                  { label: 'All Distances', value: 'All' },
                  { label: 'Within 5 km', value: 5 },
                  { label: 'Within 10 km', value: 10 },
                  { label: 'Within 25 km', value: 25 },
                  { label: 'Within 50 km', value: 50 },
                  { label: 'Within 100 km', value: 100 }
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setMaxDistance(opt.value as any);
                      setShowDistanceDropdown(false);
                    }}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '10px',
                      textAlign: 'left',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      background: maxDistance === opt.value ? 'var(--bg-main)' : 'transparent',
                      color: maxDistance === opt.value ? 'var(--primary)' : 'var(--text-main)',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      whiteSpace: 'nowrap'
                    }}
                    onMouseOver={(e) => {
                      if (maxDistance !== opt.value) e.currentTarget.style.background = '#f8fafc';
                    }}
                    onMouseOut={(e) => {
                      if (maxDistance !== opt.value) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <button 
            className="btn-primary" 
            onClick={() => navigate('/upload-item')}
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
            <span>{t('services.addBtn')}</span>
          </button>
        </div>
      </div>

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

      <div className="category-pills">
        {categories.map(cat => (
          <button 
            key={cat.value}
            className={`pill ${filter === cat.value ? 'active' : ''}`}
            onClick={() => setFilter(cat.value)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
          <Loader2 className="animate-spin" size={48} color="var(--primary)" />
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
                    {(() => {
                      const providerId = item.providerId || '';
                      return providerPhones[providerId] ? (
                        <>
                          <div className="location" style={{ marginBottom: '8px' }}>
                            <MapPin size={14} />
                            <span>
                              {item.location || 'Local'}
                              {item.distance !== undefined ? ` • ${item.distance.toFixed(1)} km away` : ''}
                            </span>
                          </div>
                          <div className="provider-contact-row" style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginTop: '12px',
                            paddingTop: '8px',
                            borderTop: '1px solid #f1f5f9'
                          }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>Contact Info</span>
                              <a href={`tel:${providerPhones[providerId]}`} style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)', textDecoration: 'none' }}>
                                {providerPhones[providerId].length === 10 
                                  ? `+91 ${providerPhones[providerId].slice(0, 5)} ${providerPhones[providerId].slice(5)}` 
                                  : providerPhones[providerId]
                                }
                              </a>
                            </div>
                            <a 
                              href={`https://wa.me/${providerPhones[providerId].replace(/\D/g, '').length === 10 ? `91${providerPhones[providerId].replace(/\D/g, '')}` : providerPhones[providerId].replace(/\D/g, '')}?text=Hello,%20I%20am%20interested%20in%20booking%20your%20service:%20${encodeURIComponent(item.name)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                backgroundColor: '#25D366',
                                color: 'white',
                                padding: '6px 12px',
                                borderRadius: '10px',
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                textDecoration: 'none',
                                boxShadow: '0 2px 6px rgba(37, 211, 102, 0.25)',
                                transition: 'all 0.2s'
                              }}
                              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#20ba56')}
                              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#25D366')}
                            >
                              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.725 1.451 5.437 0 9.862-4.43 9.866-9.873.002-2.637-1.023-5.116-2.887-6.98a9.86 9.86 0 0 0-6.98-2.881c-5.447 0-9.873 4.432-9.877 9.877-.001 1.63.432 3.22 1.253 4.636l-.99 3.61 3.712-.973zm10.274-6.425c-.29-.145-1.716-.847-1.978-.942-.262-.096-.453-.145-.642.145-.19.29-.733.942-.898 1.133-.166.19-.33.21-.62.066-.29-.145-1.22-.45-2.324-1.433-.859-.766-1.439-1.713-1.607-2.002-.168-.29-.018-.447.127-.59.13-.13.29-.33.435-.494.145-.166.19-.28.29-.467.097-.19.047-.355-.024-.5-.07-.145-.642-1.549-.88-2.12-.23-.556-.464-.48-.642-.486-.165-.005-.355-.006-.547-.006-.19 0-.5.072-.76.359-.26.29-1 .978-1 2.387 0 1.41 1.02 2.77 1.163 2.96.143.19 2 3.059 4.848 4.286.677.29 1.207.464 1.62.594.68.217 1.3.187 1.79.112.546-.083 1.716-.7 1.958-1.378.24-.678.24-1.258.17-1.378-.072-.12-.262-.21-.553-.355z"/>
                              </svg>
                              <span>WhatsApp</span>
                            </a>
                          </div>
                        </>
                      ) : (
                        <div className="location" style={{ marginBottom: '0' }}>
                          <MapPin size={14} />
                          <span>
                            {item.location || 'Local'}
                            {item.distance !== undefined ? ` • ${item.distance.toFixed(1)} km away` : ''}
                          </span>
                        </div>
                      );
                    })()}
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
                          operatorAvailable: item.operatorAvailable
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

      {!loading && filteredItems.length === 0 && (
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

