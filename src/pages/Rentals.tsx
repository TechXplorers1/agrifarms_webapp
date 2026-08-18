import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { apiService } from '../services/apiService';
import { useLanguage } from '../services/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Star, MapPin, SlidersHorizontal, Info, Loader2 } from 'lucide-react';


interface Equipment {
  equipmentId: string;
  category: string;
  brandModel: string;
  pricePerHour: number;
  imageUrl?: string;
  rating?: number;
  village?: string;
  isAvailable: boolean;
  hp?: number;
  ownerId?: string;
  ownerName?: string;
  operatorPrice?: number;
  operatorAvailable?: boolean;
  latitude?: string | number;
  longitude?: string | number;
  distance?: number;
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

const Rentals: React.FC = () => {
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const initialFilter = location.state?.initialFilter || 'All';

  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(initialFilter);
  const [searchQuery, setSearchQuery] = useState(location.state?.initialSearch || '');
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [showDistanceDropdown, setShowDistanceDropdown] = useState(false);
  const [maxDistance, setMaxDistance] = useState<number | 'All'>('All');

  const categories = [
    { value: 'All', label: t('rentals.all') },
    { value: 'Tractor', label: t('home.tractors') },
    { value: 'Harvester', label: t('home.harvesters') },
    { value: 'Plough', label: t('rentals.plough') },
    { value: 'Seeder', label: t('rentals.seeder') },
    { value: 'Sprayer', label: t('home.sprayers') },
    { value: 'Trolley', label: t('rentals.trolley') }
  ];

  useEffect(() => {
    const fetchEquipmentAndCoords = async () => {
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
        const [equipRes, vehRes] = await Promise.all([
          apiService.getEquipment(),
          apiService.getVehicles(),
          new Promise(resolve => setTimeout(resolve, 1000))
        ]);
        const rawEquip = equipRes.data || [];
        const rawVeh = (vehRes.data || []).map((v: any) => ({
          ...v,
          equipmentId: v.vehicleId,
          brandModel: `${v.brand || ''} ${v.model || ''}`.trim() || v.vehicleType,
          category: v.vehicleType,
          pricePerHour: v.pricePerHour || v.pricePerKm,
          operatorAvailable: v.driverIncluded
        }));
        const rawItems = [...rawEquip, ...rawVeh];

        // Calculate distances
        const processedItems = rawItems.map((item: any) => {
          if (coords && item.latitude && item.longitude) {
            const dist = calculateHaversine(coords.latitude, coords.longitude, parseFloat(item.latitude), parseFloat(item.longitude));
            return { ...item, distance: dist };
          }
          return { ...item };
        });

        // Sort distance-wise: closest first
        processedItems.sort((a: any, b: any) => {
          if (a.distance === undefined && b.distance === undefined) return 0;
          if (a.distance === undefined) return 1;
          if (b.distance === undefined) return -1;
          return a.distance - b.distance;
        });

        setEquipment(processedItems);
      } catch (error) {
        console.error('Error fetching equipment:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEquipmentAndCoords();
  }, [isAuthenticated]);

  const filteredEquipment = equipment.filter(item => {
    if (user?.id && item.ownerId === user.id) return false;

    const itemCat = item.category.toLowerCase();
    const activeFilter = filter.toLowerCase();

    const matchesFilter = filter === 'All' ||
      itemCat === activeFilter ||
      itemCat === `${activeFilter}s` ||
      activeFilter === `${itemCat}s` ||
      itemCat.includes(activeFilter) ||
      activeFilter.includes(itemCat);

    const matchesSearch = item.brandModel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDistance = maxDistance === 'All' ||
      (item.distance !== undefined && item.distance <= maxDistance);

    return matchesFilter && matchesSearch && matchesDistance;
  });

  return (
    <div className="rentals-page container fade-in">
      <div className="page-header">
        <div>
          <h1 className="text-3xl font-bold">{t('rentals.title')}</h1>
          <p className="text-slate-500">{t('rentals.desc')}</p>
        </div>
        <div style={{ position: 'relative' }}>
          <button
            className="filter-btn"
            onClick={() => setShowDistanceDropdown(!showDistanceDropdown)}
            style={{ cursor: 'pointer' }}
          >
            <SlidersHorizontal size={20} />
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
      </div>

      <div className="search-bar-row">
        <div className="search-box">
          <Search size={20} className="text-slate-400" />
          <input
            type="text"
            placeholder={t('rentals.searchPlaceholder')}
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
            {filteredEquipment.map((item) => (
              <motion.div
                key={item.equipmentId}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="asset-card"
              >
                <div className="asset-image">
                  <img src={item.imageUrl || 'https://images.unsplash.com/photo-1594913785162-e6785b493bd2?auto=format&fit=crop&q=80&w=400'} alt={item.brandModel} />
                  {!item.isAvailable && <div className="status-badge busy">{t('rentals.booked')}</div>}
                  {item.isAvailable && <div className="status-badge available">{t('rentals.available')}</div>}
                </div>
                <div className="asset-info">
                  <div className="asset-top">
                    <h4>{item.brandModel}</h4>
                    <div className="rating">
                      <Star size={14} fill="#f9a825" color="#f9a825" />
                      <span>{item.rating || '4.5'}</span>
                    </div>
                  </div>
                  <div className="asset-details">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="category">{item.category}</p>
                      {item.hp && <span className="spec-badge">{item.hp} HP</span>}
                    </div>
                    <div className="location">
                      <MapPin size={14} />
                      <span>
                        {item.village || 'Local'}
                        {item.distance !== undefined ? ` • ${item.distance.toFixed(1)} km away` : ''}
                      </span>
                    </div>
                  </div>
                  <div className="asset-footer">
                    <div className="price-tag">
                      <span className="amount">₹{item.pricePerHour}</span>
                      <span className="unit">/hr</span>
                    </div>
                    <button
                      className="btn-book"
                      onClick={() => {
                        if (!isAuthenticated) {
                          navigate('/login');
                          return;
                        }
                        const assetData = {
                          id: item.equipmentId,
                          name: item.brandModel,
                          category: item.category,
                          price: item.pricePerHour,
                          providerId: item.ownerId || 'owner123',
                          providerName: item.ownerName || 'Equipment Owner',
                          imageUrl: item.imageUrl,
                          type: 'Equipment',
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

      {!loading && filteredEquipment.length === 0 && (
        <div className="empty-state">
          <Info size={48} className="text-slate-300" />
          <h3>{t('rentals.empty')}</h3>
          <p>{t('rentals.adjustFilters')}</p>
        </div>
      )}

      <style>{`
        .rentals-page {
          padding-top: 24px;
        }
        .search-bar-row {
          margin: 24px 0;
          max-width: 600px;
        }
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
        .asset-image {
          height: 180px;
          position: relative;
        }
        .asset-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .status-badge {
          position: absolute;
          top: 12px;
          right: 12px;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 800;
          backdrop-filter: blur(8px);
        }
        .status-badge.available {
          background: rgba(16, 185, 129, 0.9);
          color: white;
        }
        .status-badge.busy {
          background: rgba(239, 68, 68, 0.9);
          color: white;
        }
        .asset-info {
          padding: 20px;
        }
        .asset-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }
        .asset-top h4 {
          font-size: 1.15rem;
          font-weight: 700;
        }
        .rating {
          display: flex;
          align-items: center;
          gap: 4px;
          font-weight: 700;
          font-size: 0.875rem;
        }
        .asset-details {
          margin-bottom: 16px;
        }
        .category {
          color: var(--primary);
          font-weight: 700;
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }
        .location {
          display: flex;
          align-items: center;
          gap: 4px;
          color: var(--text-muted);
          font-size: 0.875rem;
        }
        .asset-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 16px;
          border-top: 1px dashed var(--border);
        }
        .price-tag .amount {
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--text-main);
        }
        .price-tag .unit {
          font-size: 0.875rem;
          color: var(--text-muted);
          margin-left: 2px;
        }
        .btn-book {
          background: var(--primary);
          color: white;
          padding: 8px 18px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 0.875rem;
          transition: all 0.2s;
        }
        .btn-book:hover {
          background: var(--primary-dark);
          transform: scale(1.05);
        }
        .skeleton-card {
          height: 320px;
          background: #f1f5f9;
          border-radius: 24px;
          animation: pulse 1.5s infinite;
        }
        .empty-state {
          text-align: center;
          padding: 60px;
          color: var(--text-muted);
        }
        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 0.3; }
          100% { opacity: 0.6; }
        }
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

export default Rentals;
