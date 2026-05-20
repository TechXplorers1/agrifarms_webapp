import React, { useState } from 'react';
import { 
  Search, MapPin, Tractor, Truck, Bell, Plus, Crosshair, 
  ChevronRight, ClipboardList, Sprout, Droplets, Construction,
  CloudSun, TrendingUp, Calculator
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';

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
  const { user } = useAuth();

  const rentalItems: ServiceItem[] = [
    { name: 'Tractors', icon: Tractor, image: 'https://images.unsplash.com/photo-1594495894542-a46cc73e081a?auto=format&fit=crop&q=80&w=400', subtitle: 'Plough & Cultivate', color: '#e8f5e9', iconColor: '#2e7d32', category: 'Rentals' },
    { name: 'Harvesters', icon: Sprout, image: 'https://images.unsplash.com/photo-1594495894542-a46cc73e081a?auto=format&fit=crop&q=80&w=400', subtitle: 'Wheat & Paddy', color: '#fff9c4', iconColor: '#f9a825', category: 'Rentals' },
    { name: 'Sprayers', icon: Droplets, image: 'https://images.unsplash.com/photo-1592842415124-7da8534b8683?auto=format&fit=crop&q=80&w=400', subtitle: 'Pest Control', color: '#e3f2fd', iconColor: '#1565c0', category: 'Rentals' },
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
        background: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.2)), url('/C:/Users/csc/.gemini/antigravity/brain/664424ba-f158-4c1f-b215-54f844f38e47/agri_farms_hero_banner_1778932160919.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        padding: '80px 0 120px 0',
        borderRadius: '0 0 48px 48px'
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
                <span style={{ 
                  background: 'rgba(255,255,255,0.2)', 
                  padding: '6px 16px', 
                  borderRadius: '100px', 
                  fontSize: '0.8rem', 
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  backdropFilter: 'blur(4px)',
                  marginBottom: '12px',
                  display: 'inline-block'
                }}>
                  Digital Farming Partner
                </span>
                <h1 style={{ fontSize: '3rem', fontWeight: 900, textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
                  Namaste, {user?.name || 'Farmer'}! 👋
                </h1>
                <div className="location-badge glass" onClick={() => setShowLocationModal(true)} style={{ 
                  marginTop: '12px',
                  padding: '8px 16px',
                  borderRadius: '12px',
                  cursor: 'pointer'
                }}>
                  <MapPin size={16} />
                  <span style={{ fontWeight: 700 }}>{user?.village || 'Green Valley'}, {user?.district || 'Agri District'}</span>
                </div>
              </motion.div>
              
              <div className="flex gap-4">
                {['OWNER', 'PROVIDER', 'FARMER'].includes(user?.role || '') && (
                   <motion.button 
                    whileHover={{ scale: 1.05 }}
                    className="notification-bell glass" 
                    onClick={() => navigate('/manage-assets')}
                  >
                      <ClipboardList size={22} />
                   </motion.button>
                )}
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  className="notification-bell glass" 
                  onClick={() => navigate('/notifications')}
                >
                  <Bell size={22} />
                  <span className="unread-badge">2</span>
                </motion.button>
              </div>
            </div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="search-container" 
              style={{ marginTop: '40px' }}
            >
              <div className="search-box glass" style={{ padding: '6px 6px 6px 18px', border: '1px solid rgba(255,255,255,0.3)' }}>
                <Search className="search-icon" size={20} style={{ color: 'white' }} />
                <input 
                  type="text" 
                  placeholder="Search for tractors, harvesters, or workers..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ background: 'transparent', color: 'white', fontWeight: 500 }}
                />
                <button className="btn-primary" style={{ padding: '12px 24px', borderRadius: '14px' }}>Search</button>
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

        {/* Promo Banner - Refined */}
        <section className="section">
          <div className="promo-banner card" style={{ padding: 0, border: 'none', background: 'var(--grad-primary)', color: 'white' }}>
            <div className="banner-text" style={{ padding: '50px' }}>
              <span className="badge" style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)' }}>Season Offer</span>
              <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'white' }}>Modern Farming,<br/>Better Yields.</h2>
              <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '1.1rem' }}>Get high-performance equipment with instant delivery.</p>
              <button className="btn-accent" style={{ background: 'white', color: 'var(--primary)', padding: '16px 32px', borderRadius: '16px' }} onClick={() => navigate('/rentals')}>Explore Rentals</button>
            </div>
            <div className="banner-image" style={{ clipPath: 'polygon(10% 0, 100% 0, 100% 100%, 0% 100%)' }}>
               <img src="https://images.unsplash.com/photo-1590682680695-43b964a3ae17?auto=format&fit=crop&q=80&w=800" alt="Farmer" />
            </div>
          </div>
        </section>

        {/* Categories Section - Improved Visual Cards */}
        <section className="section">
          <div className="section-header">
            <div className="flex items-center gap-3">
              <div style={{ background: '#e8f5e9', padding: '10px', borderRadius: '14px' }}>
                <Tractor size={24} color="var(--primary)" />
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 900 }}>Rent Equipment</h3>
            </div>
            <button className="view-all" onClick={() => navigate('/rentals')}>View Catalog <ChevronRight size={18} /></button>
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
              
              <div className="location-option card" style={{ padding: '24px', marginBottom: '16px', background: '#f8fafc' }} onClick={() => setShowLocationModal(false)}>
                <div className="icon-box" style={{ background: 'var(--primary)', color: 'white', width: '56px', height: '56px' }}>
                  <Crosshair size={28} />
                </div>
                <div style={{ marginLeft: '12px' }}>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Auto-Detect Field</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Use GPS for current location</p>
                </div>
                <ChevronRight size={22} style={{ marginLeft: 'auto', color: '#cbd5e1' }} />
              </div>

              <div className="location-option card" style={{ padding: '24px', background: '#f8fafc' }} onClick={() => setShowLocationModal(false)}>
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

