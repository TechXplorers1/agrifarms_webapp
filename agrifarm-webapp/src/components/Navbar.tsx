import React from 'react';
import { Home, History, User, LayoutGrid, LogIn, Sprout } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';

const Navbar: React.FC = () => {
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();

  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Rentals', path: '/rentals', icon: LayoutGrid },
    { name: 'Services', path: '/services', icon: Sprout },
    { name: 'Activity', path: '/activity', icon: History },
  ];

  return (
    <nav className="web-navbar">
      <div className="nav-container">
        <Link to="/" className="logo-section">
          <div className="logo-box">
            <Sprout size={24} color="var(--primary)" />
          </div>
          <span className="logo-text">Agri Farms</span>
        </Link>
        <div className="nav-links">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              <item.icon size={20} />
              <span>{item.name}</span>
            </Link>
          ))}
          {isAuthenticated ? (
            <Link
              to="/profile"
              className={`nav-item ${location.pathname === '/profile' ? 'active' : ''}`}
            >
              <User size={20} />
              <span>{user?.name || 'Profile'}</span>
            </Link>
          ) : (
            <Link to="/login" className="btn-primary" style={{ padding: '8px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <LogIn size={18} />
              <span>Login</span>
            </Link>
          )}
        </div>

        {/* Mobile Bottom Nav */}
        <div className="mobile-nav">
          {[...navItems, { name: 'Profile', path: '/profile', icon: User }].map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={`mobile-nav-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              <item.icon size={22} />
              <span>{item.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
