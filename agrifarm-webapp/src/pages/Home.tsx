import React, { useState, useEffect } from 'react';
import {
  Search, MapPin, Tractor, Truck, Bell, Plus, Crosshair,
  ChevronRight, ClipboardList, Sprout, Droplets, Construction,
  CloudSun, TrendingUp, Calculator, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { apiService } from '../services/apiService';
import { resolveCoordinates } from '../services/locationHelper';

interface ServiceItem {
  name: string;
  icon: any;
  image: string;
  subtitle: string;
  color: string;
  iconColor: string;
  category: 'Rentals' | 'Services' | 'Transport';
}

const Home: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showLocationModal, setShowLocationModal] = useState(false);
  const navigate = useNavigate();
  const { user, updateUserLocation } = useAuth();

  const handleSearch = () => {
    const query = searchQuery.trim();
    if (!query) return;

    const lowerQuery = query.toLowerCase();
    
    // Explicit rental terms take precedence
    const rentalKeywords = [
      'tractor', 'harvester', 'plough', 'seeder', 'sprayer', 'jcb', 
      'equipment', 'machinery', 'tool', 'tools', 'implement', 'implements'
    ];
    
    const isRental = rentalKeywords.some(keyword => lowerQuery.includes(keyword));

    if (isRental) {
      navigate('/rentals', { state: { initialSearch: query } });
    } else {
      // Check for worker or transport keywords
      const serviceKeywords = [
        'worker', 'workers', 'labor', 'labour', 'helper', 'helpers', 
        'transport', 'truck', 'trucks', 'vehicle', 'vehicles', 
        'driver', 'drivers', 'service', 'services', 'business', 'farm hand'
      ];
      const isService = serviceKeywords.some(keyword => lowerQuery.includes(keyword));
      
      if (isService) {
        navigate('/services', { state: { initialSearch: query } });
      } else {
        // Fallback to rentals if unsure
        navigate('/rentals', { state: { initialSearch: query } });
      }
    }
  };

  const [isDetecting, setIsDetecting] = useState(false);
  const [displayLocation, setDisplayLocation] = useState({
    village: 'Green Valley',
    district: 'Agri District'
  });

  useEffect(() => {
    if (user) {
      setDisplayLocation({
        village: user.village || 'Green Valley',
        district: user.district || 'Agri District'
      });
    } else {
      const guestLoc = localStorage.getItem('agrifarm_guest_location');
      if (guestLoc) {
        try {
          const parsed = JSON.parse(guestLoc);
          setDisplayLocation({
            village: parsed.village || 'Green Valley',
            district: parsed.district || 'Agri District'
          });
        } catch (e) {
          // ignore
        }
      }
    }
  }, [user]);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsDetecting(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            {
              headers: {
                'User-Agent': 'AgriFarmsApp/1.0'
              }
            }
          );

          if (!response.ok) {
            throw new Error('Reverse geocoding network response failed.');
          }

          const data = await response.json();
          if (data && data.address) {
            const addr = data.address;

            // Geocoding extraction optimized to isolate city/village vs suburb/area name correctly
            const village = addr.city || addr.town || addr.village || addr.municipality || addr.suburb || addr.neighbourhood || addr.city_district || 'Unknown Village';
            const district = addr.district || addr.county || addr.city || 'District';

            const areaParts = [];
            if (addr.road) areaParts.push(addr.road);
            const areaName = addr.suburb || addr.neighbourhood || addr.quarter;
            if (areaName && areaName !== village) {
              areaParts.push(areaName);
            }
            const street = areaParts.join(', ') || addr.road || addr.suburb || '';

            // Update display
            setDisplayLocation({ village, district });

            if (user) {
              updateUserLocation(village, district);
              try {
                const userProfileRes = await apiService.getUser(user.id);
                if (userProfileRes && userProfileRes.data) {
                  const currentProfile = userProfileRes.data;
                  const updatedPayload = {
                    ...currentProfile,
                    street: street,
                    village,
                    district,
                    latitude,
                    longitude
                  };
                  await apiService.updateUser(user.id, updatedPayload);
                }
              } catch (apiErr) {
                console.error("Failed to sync location with database:", apiErr);
              }
            } else {
              localStorage.setItem('agrifarm_guest_location', JSON.stringify({ village, district }));
            }

            alert(`Location detected successfully: ${village}, ${district}`);
            setShowLocationModal(false);
          } else {
            throw new Error('Nominatim returned invalid address format.');
          }
        } catch (err: any) {
          console.error("Nominatim reverse geocoding failed:", err);
          alert("Failed to fetch address. Please check your network or search manually.");
        } finally {
          setIsDetecting(false);
        }
      },
      (geoErr) => {
        console.error("Browser geolocation error:", geoErr);
        let errorMsg = 'Error obtaining location coordinates.';
        if (geoErr.code === geoErr.PERMISSION_DENIED) {
          errorMsg = 'Location permission denied. Please allow access in browser settings.';
        } else if (geoErr.code === geoErr.POSITION_UNAVAILABLE) {
          errorMsg = 'Location information is unavailable.';
        } else if (geoErr.code === geoErr.TIMEOUT) {
          errorMsg = 'Location request timed out.';
        }
        alert(errorMsg);
        setIsDetecting(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const handleManualLocation = async () => {
    const inputVillage = prompt("Enter Village Name:");
    if (inputVillage === null) return;
    const inputDistrict = prompt("Enter District Name:");
    if (inputDistrict === null) return;

    const village = inputVillage.trim() || 'Green Valley';
    const district = inputDistrict.trim() || 'Agri District';

    setDisplayLocation({ village, district });

    // Auto-resolve coordinates behind the scenes
    const coords = await resolveCoordinates(village, district);

    if (user) {
      updateUserLocation(village, district);
      try {
        const res = await apiService.getUser(user.id);
        if (res && res.data) {
          const updatedPayload = {
            ...res.data,
            village,
            district
          };
          if (coords) {
            updatedPayload.latitude = coords.latitude;
            updatedPayload.longitude = coords.longitude;
          }
          await apiService.updateUser(user.id, updatedPayload);
        }
      } catch (err) {
        console.error("Failed to sync manual location with database:", err);
      }
    } else {
      localStorage.setItem('agrifarm_guest_location', JSON.stringify({
        village,
        district,
        ...(coords ? { latitude: coords.latitude, longitude: coords.longitude } : {})
      }));
    }

    setShowLocationModal(false);
  };

  const rentalItems: ServiceItem[] = [
    { name: 'Tractors', icon: Tractor, image: 'https://images.unsplash.com/photo-1594913785162-e67853f2c522?auto=format&fit=crop&q=80&w=400', subtitle: 'Plough & Cultivate', color: '#e8f5e9', iconColor: '#2e7d32', category: 'Rentals' },
    { name: 'Harvesters', icon: Sprout, image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&q=80&w=400', subtitle: 'Wheat & Paddy Harvest', color: '#fff9c4', iconColor: '#f9a825', category: 'Rentals' },
    { name: 'Sprayers', icon: Droplets, image: 'https://images.unsplash.com/photo-1592842415124-7da8534b8683?auto=format&fit=crop&q=80&w=400', subtitle: 'Drone & Pest Control', color: '#e3f2fd', iconColor: '#1565c0', category: 'Rentals' },
    { name: 'JCB', icon: Construction, image: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&q=80&w=400', subtitle: 'Digging & Leveling', color: '#fff3e0', iconColor: '#e65100', category: 'Rentals' },
  ];



  const tools = [
    { name: 'Weather', icon: CloudSun, color: '#fff8e1', fg: '#f57f17' },
    { name: 'Crop Advice', icon: Sprout, color: '#e8f5e9', fg: '#00aa55' },
    { name: 'Mandi Prices', icon: TrendingUp, color: '#e3f2fd', fg: '#1565c0' },
    { name: 'Calculator', icon: Calculator, color: '#f3e5f5', fg: '#6a1b9a' },
  ];

  React.useEffect(() => {
    if (showLocationModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showLocationModal]);



  return (
    <div className="home-page fade-in">
      {/* Cinematic Hero Section */}
      <section className="hero-section" style={{
        background: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 45%, #4caf50 100%)',
        padding: '40px 0 80px 0',
        borderRadius: '0 0 32px 32px'
      }}>
        <div className="container">
          <div className="hero-content">
            <div className="flex justify-between items-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="user-greeting"
              >
                <h1 style={{ fontSize: '2.5rem', fontWeight: 900, textShadow: '0 2px 10px rgba(0,0,0,0.15)', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Namaste, {user?.name || 'Farmer'}! 👋
                </h1>
                <div className="location-badge" onClick={() => setShowLocationModal(true)} style={{
                  marginTop: '6px',
                  padding: '4px 0',
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(255,255,255,0.9)',
                  fontSize: '1rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer'
                }}>
                  <MapPin size={16} style={{ color: 'white', fill: 'white' }} />
                  <span>{displayLocation.village}, {displayLocation.district}</span>
                  <span style={{ fontSize: '0.8rem', marginLeft: '2px' }}>⌵</span>
                </div>
              </motion.div>

              <div className="flex gap-4">
                {['OWNER', 'PROVIDER', 'FARMER'].includes(user?.role || '') && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    className="notification-bell glass"
                    style={{ background: 'rgba(255,255,255,0.2)', border: 'none', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={() => navigate('/manage-assets')}
                  >
                    <ClipboardList size={22} color="white" />
                  </motion.button>
                )}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  className="notification-bell glass"
                  style={{ background: 'rgba(255,255,255,0.2)', border: 'none', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onClick={() => navigate('/notifications')}
                >
                  <Bell size={22} color="white" />
                  <span className="unread-badge">2</span>
                </motion.button>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="search-container"
              style={{ marginTop: '24px' }}
            >
              <div className="search-box">
                <Search className="search-icon" size={20} />
                <input
                  type="text"
                  placeholder="Search seeds, tractor, spraying..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button className="btn-primary" onClick={handleSearch} style={{ padding: '12px 24px', borderRadius: '24px', background: 'var(--primary)', fontWeight: 800 }}>Search</button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <div className="container" style={{ marginTop: '-60px', position: 'relative', zIndex: 10 }}>
        {/* Quick Tools Row */}
        <section className="section" style={{ marginTop: 0 }}>
          <div className="tools-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
            {tools.map((tool, idx) => (
              <motion.div
                key={tool.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * idx }}
                whileHover={{ y: -8, boxShadow: 'var(--shadow-xl)' }}
                className="tool-tile card"
                style={{
                  backgroundColor: 'white',
                  flexDirection: 'row',
                  padding: '24px',
                  justifyContent: 'center',
                  border: 'none'
                }}
              >
                <div style={{
                  background: `${tool.color}`,
                  padding: '12px',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <tool.icon size={24} color={tool.fg} />
                </div>
                <span style={{ color: 'var(--text-main)', fontSize: '1rem', fontWeight: 800 }}>{tool.name}</span>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Promo Banner - Refined to match Mobile Spec */}
        <section className="section">
          <div className="promo-banner card" style={{ padding: 0, border: 'none', background: 'var(--grad-primary)', color: 'white', overflow: 'hidden' }}>
            <div className="banner-text" style={{ padding: '48px' }}>
              <span className="badge" style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)' }}>Season Offer</span>
              <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'white', marginTop: '12px', lineHeight: '1.2' }}>Book Farm Services Today!</h2>
              <button className="btn-accent" style={{ background: '#FF9800', color: 'white', padding: '14px 28px', borderRadius: '100px', fontWeight: 800, marginTop: '16px', border: 'none', boxShadow: '0 4px 15px rgba(255, 152, 0, 0.4)' }} onClick={() => navigate('/services')}>Explore Now</button>
            </div>
            <div className="banner-image" style={{ clipPath: 'polygon(10% 0, 100% 0, 100% 100%, 0% 100%)' }}>
              <img src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=800" alt="Farmer" />
            </div>
          </div>
        </section>

        {/* Categories Section - Improved Visual Cards */}
        <section className="section">
          <div className="section-header">
            <div className="flex items-center gap-3">
              <div style={{ background: '#e8f5e9', padding: '10px', borderRadius: '14px' }}>
                <Tractor size={24} color="#2e7d32" />
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 900 }}>Rent Equipment</h3>
            </div>
            <button className="view-all" style={{ background: '#e8f5e9', color: '#2e7d32', fontWeight: 800, padding: '8px 20px', borderRadius: '100px', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => navigate('/rentals')}>View All <ChevronRight size={18} /></button>
          </div>
          <div className="categories-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
            {rentalItems.map((item, idx) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 * idx }}
                whileHover={{ y: -10 }}
                className="premium-card visual-card"
                style={{ height: '260px' }}
                onClick={() => navigate('/rentals', { state: { initialFilter: item.name === 'Tractors' ? 'Tractor' : item.name } })}
              >
                <img src={item.image} alt={item.name} />
                <div className="overlay" style={{ padding: '24px' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8, marginBottom: '4px', color: 'white' }}>{item.subtitle}</span>
                  <h4 style={{ fontSize: '1.5rem', color: 'white', fontWeight: 900 }}>{item.name}</h4>
                  <div style={{ marginTop: '12px', background: 'rgba(255,255,255,0.2)', width: 'fit-content', padding: '4px 12px', borderRadius: '100px', backdropFilter: 'blur(4px)' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'white' }}>Rent Now</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Earn Section - WOW Layout */}
        <section className="section" style={{ marginBottom: '100px' }}>
          <div className="card" style={{ background: 'var(--text-main)', color: 'white', padding: '50px', border: 'none', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: 'var(--primary)', borderRadius: '100px', filter: 'blur(80px)', opacity: 0.4 }}></div>
            <div className="flex justify-between items-center relative" style={{ zIndex: 1 }}>
              <div style={{ maxWidth: '60%' }}>
                <h3 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'white', marginBottom: '16px' }}>List your assets & earn.</h3>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem', marginBottom: '32px' }}>Join 5000+ providers earning weekly by renting equipment, vehicles, and services.</p>
                <div className="flex gap-4">
                  <button className="btn-primary" style={{ padding: '16px 32px' }} onClick={() => navigate('/upload-item')}>Register Asset</button>
                  <button className="btn-secondary" style={{ border: '2px solid rgba(255,255,255,0.2)', padding: '16px 32px', borderRadius: '14px', fontWeight: 700 }} onClick={() => navigate('/services')}>How it works</button>
                </div>
              </div>
              <div className="upload-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                <div className="glass-card" style={{ background: 'rgba(255,255,255,0.05)', padding: '24px', borderRadius: '24px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <Tractor size={32} color="var(--primary-light)" />
                  <h4 style={{ marginTop: '12px', fontWeight: 800 }}>Tractors</h4>
                  <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>Earn up to ₹5k/day</p>
                </div>
                <div className="glass-card" style={{ background: 'rgba(255,255,255,0.05)', padding: '24px', borderRadius: '24px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <Truck size={32} color="var(--accent)" />
                  <h4 style={{ marginTop: '12px', fontWeight: 800 }}>Transport</h4>
                  <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>Earn per trip</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Floating Action Button for Add Asset */}
        <motion.button
          className="fab-add"
          whileHover={{ scale: 1.05, y: -4 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate(user ? '/upload-item' : '/login')}
          style={{
            background: 'var(--grad-primary)',
            padding: '20px 36px',
            fontSize: '1.1rem',
            boxShadow: '0 15px 35px rgba(0, 137, 71, 0.4)'
          }}
        >
          <Plus size={28} />
          <span>Add Asset</span>
        </motion.button>
      </div>

      {/* Location Selector Modal */}
      <AnimatePresence>
        {showLocationModal && (
          <div className="location-modal-overlay" onClick={() => setShowLocationModal(false)}>
            <motion.div
              className="location-modal-content card"
              onClick={e => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              style={{ border: 'none', padding: '40px' }}
            >
              <div style={{ width: 50, height: 6, background: '#e2e8f0', borderRadius: 3, margin: '0 auto 24px auto' }} />
              <h3 style={{ fontSize: '1.75rem', marginBottom: '1.5rem', textAlign: 'center', fontWeight: 900, color: 'var(--primary)' }}>Select Your Field</h3>

              <div
                className="location-option card"
                style={{ padding: '24px', marginBottom: '16px', background: '#f8fafc', opacity: isDetecting ? 0.7 : 1, pointerEvents: isDetecting ? 'none' : 'auto' }}
                onClick={handleDetectLocation}
              >
                <div className="icon-box" style={{ background: 'var(--primary)', color: 'white', width: '56px', height: '56px' }}>
                  {isDetecting ? <Loader2 className="animate-spin" size={28} /> : <Crosshair size={28} />}
                </div>
                <div style={{ marginLeft: '12px' }}>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{isDetecting ? 'Detecting...' : 'Auto-Detect Field'}</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{isDetecting ? 'Acquiring GPS Signal...' : 'Use GPS for current location'}</p>
                </div>
                <ChevronRight size={22} style={{ marginLeft: 'auto', color: '#cbd5e1' }} />
              </div>

              <div
                className="location-option card"
                style={{ padding: '24px', background: '#f8fafc' }}
                onClick={handleManualLocation}
              >
                <div className="icon-box" style={{ background: 'var(--accent)', color: 'white', width: '56px', height: '56px' }}>
                  <MapPin size={28} />
                </div>
                <div style={{ marginLeft: '12px' }}>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Enter Village/District</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Search and select manually</p>
                </div>
                <ChevronRight size={22} style={{ marginLeft: 'auto', color: '#cbd5e1' }} />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <style>{`
        .glass {
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .location-modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(26, 46, 33, 0.6);
          backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 20px;
        }
        .fab-add {
          position: fixed;
          bottom: 100px;
          right: 32px;
          color: white;
          border-radius: 50px;
          display: flex;
          align-items: center;
          gap: 12px;
          font-weight: 900;
          z-index: 1000;
          border: none;
          cursor: pointer;
          letter-spacing: 0.5px;
        }
        .search-box input::placeholder {
          color: rgba(255,255,255,0.6);
        }
      `}</style>
    </div>
  );
};

export default Home;

