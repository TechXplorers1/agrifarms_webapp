import React, { useState, useEffect } from 'react';
import {
  Search, MapPin, Tractor, Truck, Plus, Crosshair,
  ChevronRight, Sprout, Droplets, Construction,
  CloudSun, TrendingUp, Calculator, Loader2, ChevronDown,
  MessageSquare, LifeBuoy
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { apiService } from '../services/apiService';
import { resolveCoordinates } from '../services/locationHelper';
import { useLanguage } from '../services/LanguageContext';

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
  const { t } = useLanguage();
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
    { name: 'Community', label: 'Community', icon: MessageSquare, color: '#e0f2fe', fg: '#0284c7' },
    { name: 'Crop Advisory', label: 'Crop Advisory', icon: Sprout, color: '#e8f5e9', fg: '#00aa55' },
    { name: 'Calculators', label: 'Calculators', icon: Calculator, color: '#f3e5f5', fg: '#6a1b9a' },
    { name: 'Help Support', label: 'Help & Support', icon: LifeBuoy, color: '#fee2e2', fg: '#ef4444' },
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
    <div className="home-page fade-in" style={{ position: 'relative', overflowX: 'clip', paddingBottom: 0 }}>
      {/* Premium Floating Ambient Backgrounds */}
      <div className="ambient-bg ambient-bg-1" />
      <div className="ambient-bg ambient-bg-2" />

      {/* Cinematic Hero Section with Custom Background Image */}
      <section 
        className="hero-section hero-mesh" 
        style={{
          padding: '50px 0 90px 0',
          borderRadius: '0 0 40px 40px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 20px 45px -10px rgba(15, 23, 42, 0.3)',
          backgroundImage: 'linear-gradient(135deg, rgba(15, 23, 42, 0.65) 0%, rgba(15, 23, 42, 0.3) 50%, rgba(15, 23, 42, 0.75) 100%), linear-gradient(135deg, rgba(255, 255, 255, 0) 30%, rgba(255, 255, 255, 0.12) 50%, rgba(255, 255, 255, 0) 70%), url(/crop_sowing_banner.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center 35%'
        }}
      >
        {/* Subtle decorative grid lines overlay */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          opacity: 0.3,
          pointerEvents: 'none'
        }} />

        <div className="container">
          <div className="hero-content">
            <div className="flex justify-between items-center" style={{ position: 'relative', zIndex: 2 }}>
              <motion.div
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 90, damping: 15, mass: 0.8 }}
                className="user-greeting"
              >
                <h1 style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: 900, 
                  textShadow: '0 3px 10px rgba(0,0,0,0.3)', 
                  color: 'white', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px',
                  letterSpacing: '-0.3px'
                }}>
                  {t('home.greeting').replace('{name}', user?.name || t('role.farmer'))}
                </h1>
                
                <motion.div 
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 100, damping: 15, delay: 0.15 }}
                  className="location-badge glass" 
                  onClick={() => setShowLocationModal(true)} 
                  style={{
                    marginTop: '10px',
                    padding: '6px 14px',
                    background: 'rgba(255,255,255,0.15)',
                    border: '1px solid rgba(255,255,255,0.25)',
                    borderRadius: '100px',
                    color: 'white',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    width: 'fit-content',
                    boxShadow: '0 8px 16px -4px rgba(0,0,0,0.1)',
                    backdropFilter: 'blur(12px)'
                  }}
                >
                  <MapPin size={14} style={{ color: '#10b981', fill: '#10b981' }} />
                  <span>{displayLocation.village}, {displayLocation.district}</span>
                  <div className="pulse-dot" style={{ marginLeft: '4px' }} />
                  <span style={{ fontSize: '0.7rem', opacity: 0.8, marginLeft: '2px' }}>⌵</span>
                </motion.div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 80, damping: 15, delay: 0.25 }}
              className="search-container"
              style={{ marginTop: '36px', position: 'relative', zIndex: 2 }}
            >
              <div className="search-box glossy-search" style={{ height: '60px', borderRadius: '30px', padding: '0 8px 0 20px' }}>
                <Search className="search-icon" size={20} style={{ color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder={t('home.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  style={{
                    fontSize: '1rem',
                    color: 'var(--text-main)',
                    fontWeight: 500,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    width: '100%',
                    marginLeft: '10px'
                  }}
                />
                <motion.button 
                  whileHover={{ scale: 1.03, boxShadow: '0 8px 20px rgba(16, 185, 129, 0.4)' }}
                  whileTap={{ scale: 0.97 }}
                  className="btn-primary" 
                  onClick={handleSearch} 
                  style={{ 
                    padding: '10px 28px', 
                    borderRadius: '24px', 
                    background: 'var(--grad-primary)', 
                    border: 'none',
                    color: 'white',
                    fontWeight: 800,
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.25)'
                  }}
                >
                  {t('home.searchBtn')}
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <div className="container" style={{ marginTop: '-35px', position: 'relative', zIndex: 10 }}>
        {/* Compact Quick Tools Row with Distinct Background and Hover Colors */}
        <section className="section" style={{ marginTop: 0, paddingBottom: '20px' }}>
          <div className="strict-grid-4" style={{ gap: '16px', width: '100%', boxSizing: 'border-box' }}>
            {tools.map((tool, idx) => {
              const hoverClass = tool.name === 'Weather' 
                ? 'frosted-tool-tile-weather' 
                : tool.name.includes('Crop') 
                  ? 'frosted-tool-tile-crop' 
                  : tool.name.includes('Mandi') 
                    ? 'frosted-tool-tile-mandi' 
                    : 'frosted-tool-tile-calc';

              const toolKey = tool.name === 'Weather' 
                ? 'weather' 
                : tool.name.includes('Crop') 
                  ? 'crop' 
                  : tool.name.includes('Mandi') 
                    ? 'mandi' 
                    : 'calc';

              return (
                <motion.div
                  key={tool.name}
                  initial={{ opacity: 0, y: 40, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ 
                    type: 'spring', 
                    stiffness: 100, 
                    damping: 16, 
                    delay: 0.1 * idx 
                  }}
                  whileHover={{ 
                    scale: 1.05, 
                    y: -6,
                    transition: { type: 'spring', stiffness: 400, damping: 10 }
                  }}
                  whileTap={{ scale: 0.95 }}
                  className={`tool-tile card frosted-tool-tile tool-tile-${toolKey} ${hoverClass}`}
                  onClick={() => {
                    if (tool.name === 'Community') navigate('/community');
                    else if (tool.name === 'Crop Advisory') navigate('/crop-advisory');
                    else if (tool.name === 'Calculators') navigate('/calculators');
                    else navigate('/help');
                  }}
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    padding: '10px 16px',
                    justifyContent: 'flex-start',
                    alignItems: 'center',
                    borderRadius: '16px',
                    gap: '16px',
                    cursor: 'pointer',
                    background: 'rgba(255, 255, 255, 0.95)',
                    boxShadow: '0 8px 25px -8px rgba(15, 23, 42, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.8)'
                  }}
                >
                  <div style={{
                    background: tool.color,
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 10px -2px ' + tool.color,
                    transition: 'transform 0.3s ease',
                    flexShrink: 0
                  }}>
                    <tool.icon size={18} color={tool.fg} />
                  </div>
                  <span style={{ color: 'var(--text-main)', fontSize: '1rem', fontWeight: 700, letterSpacing: '-0.3px', textAlign: 'left' }}>
                    {tool.label}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Promo Banner - Refined for compact UI */}
        <section className="section">
          <div 
            className="promo-banner card" 
            style={{ 
              padding: 0, 
              border: 'none', 
              background: 'linear-gradient(135deg, #064e3b 0%, #047857 60%, #059669 100%)', 
              color: 'white', 
              overflow: 'hidden',
              borderRadius: '24px',
              boxShadow: '0 12px 24px -8px rgba(4, 120, 87, 0.25)',
              display: 'flex',
              alignItems: 'stretch',
              maxHeight: '380px'
            }}
          >
            <div className="banner-text" style={{ padding: '48px 40px', maxWidth: '55%', zIndex: 2, position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ marginBottom: '16px' }}>
                <span className="badge" style={{ 
                  background: 'rgba(255,255,255,0.15)', 
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  padding: '6px 14px',
                  borderRadius: '100px',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>{t('home.seasonOffer')}</span>
              </div>
              
              <h2 style={{ 
                fontSize: '2.5rem', 
                fontWeight: 900, 
                color: 'white', 
                margin: '0 0 12px 0', 
                lineHeight: '1.2',
                letterSpacing: '-0.5px'
              }}>{t('home.bannerTitle')}</h2>
              
              <p style={{
                color: 'rgba(255,255,255,0.85)',
                margin: '0 0 24px 0',
                fontSize: '1.05rem',
                lineHeight: '1.5'
              }}>{t('home.bannerDesc')}</p>
              
              <div>
                <motion.button 
                  whileHover={{ scale: 1.05, y: -2, boxShadow: '0 6px 15px rgba(255, 152, 0, 0.4)' }}
                  whileTap={{ scale: 0.95 }}
                  className="btn-accent" 
                  style={{ 
                    background: '#FF9800', 
                    color: 'white', 
                    padding: '14px 32px', 
                    borderRadius: '100px', 
                    fontWeight: 800, 
                    border: 'none', 
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 10px rgba(255, 152, 0, 0.3)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }} 
                  onClick={() => navigate('/services')}
                >
                  {t('home.exploreBtn')} <ChevronRight size={16} />
                </motion.button>
              </div>
            </div>
            
            <div className="banner-image" style={{ 
              flex: 1,
              clipPath: 'polygon(10% 0, 100% 0, 100% 100%, 0% 100%)',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: 0, left: 0, bottom: 0, width: '40px',
                background: 'linear-gradient(to right, rgba(4, 120, 87, 0.8), transparent)',
                zIndex: 2,
                pointerEvents: 'none'
              }} />
              <img 
                src="/hero_banner.png" 
                alt="Farmer" 
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            </div>
          </div>
        </section>

        {/* Categories Section - Improved Visual Cards */}
        <section className="section">
          <div className="section-header" style={{ marginBottom: '28px' }}>
            <div className="flex items-center gap-3">
              <div style={{ 
                background: '#e8f5e9', 
                padding: '12px', 
                borderRadius: '16px',
                boxShadow: 'inset 0 2px 4px rgba(46,125,50,0.06)'
              }}>
                <Tractor size={26} color="#2e7d32" />
              </div>
              <h3 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.5px' }}>{t('home.rentEquip')}</h3>
            </div>
            <motion.button 
              whileHover={{ scale: 1.05, background: '#c8e6c9' }}
              whileTap={{ scale: 0.95 }}
              className="view-all" 
              style={{ 
                background: '#e8f5e9', 
                color: '#2e7d32', 
                fontWeight: 800, 
                padding: '10px 24px', 
                borderRadius: '100px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.95rem'
              }} 
              onClick={() => navigate('/rentals')}
            >
              {t('home.viewAll')} <ChevronRight size={18} />
            </motion.button>
          </div>

          <div className="categories-grid responsive-grid-4" style={{ gap: '24px' }}>
            {rentalItems.map((item, idx) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  type: 'spring', 
                  stiffness: 80, 
                  damping: 16, 
                  delay: 0.08 * idx 
                }}
                whileHover={{ 
                  y: -10,
                  transition: { type: 'spring', stiffness: 300, damping: 15 }
                }}
                whileTap={{ scale: 0.98 }}
                className="premium-card visual-card"
                style={{ 
                  height: '280px',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  borderRadius: '28px',
                  boxShadow: '0 12px 30px -10px rgba(15, 23, 42, 0.08)'
                }}
                onClick={() => navigate('/rentals', { state: { initialFilter: item.name === 'Tractors' ? 'Tractor' : item.name } })}
              >
                <img 
                  src={item.image} 
                  alt={item.name} 
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    position: 'absolute',
                    top: 0, left: 0
                  }}
                />
                
                <div className="overlay" style={{ 
                  padding: '28px 24px',
                  position: 'absolute',
                  bottom: 0, left: 0, right: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  height: '100%',
                  zIndex: 2
                }}>
                  <span style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: 800, 
                    textTransform: 'uppercase', 
                    letterSpacing: '1.5px', 
                    opacity: 0.85, 
                    marginBottom: '6px', 
                    color: 'rgba(255,255,255,0.9)' 
                  }}>{item.subtitle}</span>
                  
                  <h4 style={{ 
                    fontSize: '1.65rem', 
                    color: 'white', 
                    fontWeight: 900,
                    letterSpacing: '-0.3px',
                    lineHeight: '1.2'
                  }}>{item.name === 'Tractors' ? t('home.tractors') : item.name === 'Harvesters' ? t('home.harvesters') : item.name === 'Sprayers' ? t('home.sprayers') : item.name}</h4>
                  
                  <div className="rent-badge-btn" style={{ 
                    marginTop: '14px', 
                    background: 'rgba(255,255,255,0.2)', 
                    width: 'fit-content', 
                    padding: '6px 16px', 
                    borderRadius: '100px', 
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255,255,255,0.15)'
                  }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'white' }}>{t('home.rentNowBtn')}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Earn Section - WOW Layout */}
        <section className="section" style={{ marginBottom: '0', paddingBottom: '0' }}>
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 60, damping: 15 }}
            className="card" 
            style={{ 
              background: 'linear-gradient(135deg, #0b1511 0%, #042f1a 100%)', 
              color: 'white', 
              padding: '60px', 
              border: '1px solid rgba(16, 185, 129, 0.15)', 
              position: 'relative', 
              overflow: 'hidden',
              borderRadius: '32px',
              boxShadow: '0 25px 50px -12px rgba(4, 47, 26, 0.4)'
            }}
          >
            {/* Glowing neon decorative bubbles (Optimized for performance) */}
            <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '250px', height: '250px', background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: '-80px', left: '10%', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

            <div className="flex justify-between items-center relative" style={{ zIndex: 2 }}>
              <div style={{ maxWidth: '58%' }}>
                <h3 style={{ 
                  fontSize: '2.8rem', 
                  fontWeight: 900, 
                  color: 'white', 
                  marginBottom: '20px',
                  letterSpacing: '-1px',
                  lineHeight: '1.15'
                }}>{t('home.listAssetTitle')}</h3>
                
                <p style={{ 
                  color: 'rgba(255,255,255,0.75)', 
                  fontSize: '1.15rem', 
                  marginBottom: '36px',
                  lineHeight: '1.6' 
                }}>{t('home.listAssetDesc')}</p>
                
                <div className="flex gap-4">
                  {(!user || user.role !== 'FARMER') ? (
                    <motion.button 
                      whileHover={{ scale: 1.05, y: -2, boxShadow: '0 8px 25px rgba(16, 185, 129, 0.4)' }}
                      whileTap={{ scale: 0.95 }}
                      className="btn-primary" 
                      style={{ 
                        padding: '16px 36px', 
                        borderRadius: '16px', 
                        background: 'var(--grad-primary)', 
                        fontWeight: 800,
                        fontSize: '1rem',
                        border: 'none',
                        cursor: 'pointer'
                      }} 
                      onClick={() => navigate(user ? '/upload-item' : '/login')}
                    >
                      {t('home.registerAssetBtn')}
                    </motion.button>
                  ) : (
                    <motion.button 
                      whileHover={{ scale: 1.05, y: -2, boxShadow: '0 8px 25px rgba(16, 185, 129, 0.4)' }}
                      whileTap={{ scale: 0.95 }}
                      className="btn-primary" 
                      style={{ 
                        padding: '16px 36px', 
                        borderRadius: '16px', 
                        background: 'var(--grad-primary)', 
                        fontWeight: 800,
                        fontSize: '1rem',
                        border: 'none',
                        cursor: 'pointer'
                      }} 
                      onClick={() => navigate('/rentals')}
                    >
                      {t('home.rentEquip')}
                    </motion.button>
                  )}
                  
                  <motion.button 
                    whileHover={{ scale: 1.05, background: 'rgba(255,255,255,0.1)' }}
                    whileTap={{ scale: 0.95 }}
                    className="btn-secondary" 
                    style={{ 
                      border: '2px solid rgba(255,255,255,0.25)', 
                      background: 'transparent',
                      color: 'white',
                      padding: '16px 36px', 
                      borderRadius: '16px', 
                      fontWeight: 800,
                      fontSize: '1rem',
                      cursor: 'pointer'
                    }} 
                    onClick={() => navigate('/services')}
                  >
                    {t('home.howItWorks')}
                  </motion.button>
                </div>
              </div>

              <div className="upload-grid responsive-grid-2">
                <motion.div 
                  whileHover={{ 
                    y: -10, 
                    borderColor: 'rgba(16, 185, 129, 0.5)', 
                    background: 'rgba(255, 255, 255, 0.12)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                  className="glass-card" 
                  style={{ 
                    background: 'rgba(255,255,255,0.04)', 
                    padding: '28px 24px', 
                    borderRadius: '24px', 
                    backdropFilter: 'blur(16px)', 
                    border: '1px solid rgba(255,255,255,0.08)',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                    cursor: 'pointer'
                  }}
                >
                  <Tractor size={36} color="#10b981" style={{ filter: 'drop-shadow(0 0 10px rgba(16,185,129,0.3))' }} />
                  <h4 style={{ marginTop: '16px', fontWeight: 800, fontSize: '1.2rem', color: 'white' }}>Tractors</h4>
                  <p style={{ fontSize: '0.85rem', opacity: 0.65, marginTop: '4px' }}>Earn up to ₹5,000/day</p>
                </motion.div>
                
                <motion.div 
                  whileHover={{ 
                    y: -10, 
                    borderColor: 'rgba(245, 158, 11, 0.5)', 
                    background: 'rgba(255, 255, 255, 0.12)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                  className="glass-card" 
                  style={{ 
                    background: 'rgba(255,255,255,0.04)', 
                    padding: '28px 24px', 
                    borderRadius: '24px', 
                    backdropFilter: 'blur(16px)', 
                    border: '1px solid rgba(255,255,255,0.08)',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                    cursor: 'pointer'
                  }}
                >
                  <Truck size={36} color="#FF9800" style={{ filter: 'drop-shadow(0 0 10px rgba(255,152,0,0.3))' }} />
                  <h4 style={{ marginTop: '16px', fontWeight: 800, fontSize: '1.2rem', color: 'white' }}>Transport</h4>
                  <p style={{ fontSize: '0.85rem', opacity: 0.65, marginTop: '4px' }}>Earn per kilometer</p>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Floating Action Button for Add Asset - Shown Only for Non-Farmers */}
        {(!user || user.role !== 'FARMER') && createPortal(
          <motion.button
            className="fab-add"
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => navigate(user ? '/upload-item' : '/login')}
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              padding: '12px 24px',
              fontSize: '0.95rem',
              boxShadow: '0 15px 35px rgba(5, 150, 105, 0.4)',
              borderRadius: '50px',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            <Plus size={20} style={{ strokeWidth: 3 }} />
            <span>{t('manage.addBtn')}</span>
          </motion.button>,
          document.body
        )}
      </div>

      {/* Location Selector Modal */}
      <AnimatePresence>
        {showLocationModal && createPortal(
          <div className="location-modal-overlay" onClick={() => setShowLocationModal(false)}>
            <motion.div
              className="location-modal-content card"
              onClick={e => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              style={{ border: 'none', padding: '40px', borderRadius: '28px', maxWidth: '500px', width: '100%' }}
            >
              <div style={{ width: 50, height: 6, background: '#e2e8f0', borderRadius: 3, margin: '0 auto 24px auto' }} />
              <h3 style={{ fontSize: '1.75rem', marginBottom: '1.5rem', textAlign: 'center', fontWeight: 900, color: 'var(--primary)' }}>{t('home.selectField')}</h3>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="location-option card"
                style={{ padding: '24px', marginBottom: '16px', background: '#f8fafc', opacity: isDetecting ? 0.7 : 1, pointerEvents: isDetecting ? 'none' : 'auto', cursor: 'pointer', display: 'flex', alignItems: 'center', borderRadius: '20px' }}
                onClick={handleDetectLocation}
              >
                <div className="icon-box" style={{ background: 'var(--primary)', color: 'white', width: '56px', height: '56px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {isDetecting ? <Loader2 className="animate-spin" size={28} /> : <Crosshair size={28} />}
                </div>
                <div style={{ marginLeft: '16px', textAlign: 'left' }}>
                  <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>{isDetecting ? 'Detecting...' : t('home.detectLocation')}</h4>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{isDetecting ? 'Acquiring GPS Signal...' : 'Use GPS for current location'}</p>
                </div>
                <ChevronRight size={22} style={{ marginLeft: 'auto', color: '#cbd5e1' }} />
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="location-option card"
                style={{ padding: '24px', background: '#f8fafc', cursor: 'pointer', display: 'flex', alignItems: 'center', borderRadius: '20px' }}
                onClick={handleManualLocation}
              >
                <div className="icon-box" style={{ background: 'var(--accent)', color: 'white', width: '56px', height: '56px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MapPin size={28} />
                </div>
                <div style={{ marginLeft: '16px', textAlign: 'left' }}>
                  <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>{t('home.manualLocation')}</h4>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Search and select manually</p>
                </div>
                <ChevronRight size={22} style={{ marginLeft: 'auto', color: '#cbd5e1' }} />
              </motion.div>
            </motion.div>
          </div>,
          document.body
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
          background: rgba(11, 21, 17, 0.6);
          backdrop-filter: blur(16px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 20px;
        }
        .fab-add {
          position: fixed;
          bottom: 32px;
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
          color: rgba(100, 116, 139, 0.7);
        }

        /* Weather, Crop, Mandi, and Calculator tabs custom colors and hover gradients */
        .tool-tile-weather {
          background: #fff9c4 !important;
          border: 2px solid rgba(251, 192, 45, 0.4) !important;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }
        .tool-tile-weather:hover {
          background: #ffe082 !important;
          border-color: #ffb300 !important;
          transform: translateY(-6px) scale(1.03) !important;
          box-shadow: 0 14px 30px -4px rgba(255, 179, 0, 0.45) !important;
        }
        .tool-tile-crop {
          background: #c8e6c9 !important;
          border: 2px solid rgba(76, 175, 80, 0.4) !important;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }
        .tool-tile-crop:hover {
          background: #a5d6a7 !important;
          border-color: #4caf50 !important;
          transform: translateY(-6px) scale(1.03) !important;
          box-shadow: 0 14px 30px -4px rgba(76, 175, 80, 0.45) !important;
        }
        .tool-tile-mandi {
          background: #bbdefb !important;
          border: 2px solid rgba(33, 150, 243, 0.4) !important;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }
        .tool-tile-mandi:hover {
          background: #90caf9 !important;
          border-color: #2196f3 !important;
          transform: translateY(-6px) scale(1.03) !important;
          box-shadow: 0 14px 30px -4px rgba(33, 150, 243, 0.45) !important;
        }
        .tool-tile-calc {
          background: #f3e5f5 !important;
          border: 2px solid rgba(156, 39, 176, 0.4) !important;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }
        .tool-tile-calc:hover {
          background: #e1bee7 !important;
          border-color: #9c27b0 !important;
          transform: translateY(-6px) scale(1.03) !important;
          box-shadow: 0 14px 30px -4px rgba(156, 39, 176, 0.45) !important;
        }
      `}</style>
    </div>
  );
};

export default Home;
