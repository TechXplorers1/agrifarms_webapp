import React, { useState } from 'react';
import { Search, MapPin, Tractor, Truck, Users, Sprout, ChevronRight, Calculator, CloudSun, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';

const Home: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  const categories = [
    { name: 'Tractors', icon: Tractor, color: '#e8f5e9', iconColor: '#00aa55', subtitle: 'Plough & Cultivate', path: '/rentals' },
    { name: 'Harvesters', icon: Sprout, color: '#fff9c4', iconColor: '#f9a825', subtitle: 'Wheat & Paddy', path: '/rentals' },
    { name: 'Transport', icon: Truck, color: '#e3f2fd', iconColor: '#1565c0', subtitle: 'Load & Carry', path: '/services' },
    { name: 'Workers', icon: Users, color: '#f3e5f5', iconColor: '#6a1b9a', subtitle: 'Skilled Labour', path: '/services' },
  ];

  const tools = [
    { name: 'Weather', icon: CloudSun, color: '#fff8e1', fg: '#f57f17' },
    { name: 'Crop Advice', icon: Sprout, color: '#e8f5e9', fg: '#00aa55' },
    { name: 'Mandi Prices', icon: TrendingUp, color: '#e3f2fd', fg: '#1565c0' },
    { name: 'Calculator', icon: Calculator, color: '#f3e5f5', fg: '#6a1b9a' },
  ];

  return (
    <div className="home-page fade-in">
      {/* Premium Header */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-content">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="user-greeting"
            >
              <h1>Namaste, {user?.name || 'Farmer'}! 👋</h1>
              <div className="location-badge">
                <MapPin size={14} />
                <span>{user?.village || 'Local'}, {user?.district || 'India'}</span>
              </div>
            </motion.div>
            
            <div className="search-container">
              <div className="search-box">
                <Search className="search-icon" size={20} />
                <input 
                  type="text" 
                  placeholder="Search for tractors, harvesters, or workers..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container">
        {/* Banner Section */}
        <section className="banner-section">
          <div className="promo-banner">
            <div className="banner-text">
              <span className="badge">Season Offer</span>
              <h2>Book Farm Services Today!</h2>
              <p>Get up to 20% off on first equipment rental</p>
              <button className="btn-accent" onClick={() => navigate('/rentals')}>Explore Now</button>
            </div>
            <div className="banner-image">
               <img src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=600" alt="Farmer" />
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="section">
          <div className="section-header">
            <h3>Rent Equipment 🚜</h3>
            <button className="view-all" onClick={() => navigate('/rentals')}>View All <ChevronRight size={16} /></button>
          </div>
          <div className="categories-grid">
            {categories.map((cat) => (
              <motion.div 
                key={cat.name}
                whileHover={{ y: -5 }}
                className="category-card"
                onClick={() => navigate(cat.path)}
              >
                <div className="card-bg" style={{ backgroundColor: cat.color }}>
                  <cat.icon size={32} color={cat.iconColor} />
                </div>
                <div className="card-info">
                  <h4>{cat.name}</h4>
                  <p>{cat.subtitle}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Tools Section */}
        <section className="section">
          <div className="section-header">
            <h3>Agricultural Tools 🛠️</h3>
          </div>
          <div className="tools-row">
            {tools.map((tool) => (
              <div key={tool.name} className="tool-tile" style={{ backgroundColor: tool.color }}>
                <tool.icon size={28} color={tool.fg} />
                <span style={{ color: tool.fg }}>{tool.name}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;
