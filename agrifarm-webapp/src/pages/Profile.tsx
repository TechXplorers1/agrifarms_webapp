import React from 'react';
import { useAuth } from '../services/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, MapPin, Phone, LogOut, Settings, Shield, ChevronRight, Package, Calendar } from 'lucide-react';

const Profile: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  const menuItems = [
    { name: 'My Assets', icon: Package, color: '#e8f5e9', fg: '#2e7d32', path: '/manage-assets' },
    { name: 'Booking History', icon: Calendar, color: '#e3f2fd', fg: '#1565c0', path: '/activity' },
    { name: 'Account Settings', icon: Settings, color: '#fff3e0', fg: '#e65100', path: '/settings' },
    { name: 'Privacy & Security', icon: Shield, color: '#f3e5f5', fg: '#6a1b9a', path: '/privacy' },
  ];

  return (
    <div className="profile-page container fade-in">
      <div className="profile-header">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="profile-info-card card"
        >
          <div className="avatar-large">
            {user?.profilePic ? (
              <img src={user.profilePic} alt={user.name} />
            ) : (
              <User size={48} color="white" />
            )}
          </div>
          <div className="info-details">
            <h2>{user?.name}</h2>
            <div className="badge-role">{user?.role || 'Farmer'}</div>
            <div className="contact-info">
              <div className="item">
                <Phone size={14} />
                <span>+91 {user?.phoneNumber}</span>
              </div>
              <div className="item">
                <MapPin size={14} />
                <span>{user?.village}, {user?.district}</span>
              </div>
            </div>
          </div>
          <button className="btn-edit">Edit Profile</button>
        </motion.div>
      </div>

      <div className="profile-menu">
        <div className="grid-menu">
          {menuItems.map((item) => (
            <motion.div 
              key={item.name}
              whileHover={{ y: -4 }}
              className="menu-card"
              onClick={() => navigate(item.path)}
            >
              <div className="icon-box" style={{ backgroundColor: item.color }}>
                <item.icon size={24} color={item.fg} />
              </div>
              <div className="menu-text">
                <h4>{item.name}</h4>
                <p>Manage your {item.name.toLowerCase()}</p>
              </div>
              <ChevronRight size={20} className="arrow" />
            </motion.div>
          ))}
        </div>

        <button className="btn-logout" onClick={logout}>
          <LogOut size={20} />
          <span>Logout from Account</span>
        </button>
      </div>

      <style>{`
        .profile-page {
          padding-top: 40px;
          max-width: 800px !important;
        }
        .profile-header {
          margin-bottom: 32px;
        }
        .profile-info-card {
          display: flex;
          align-items: center;
          gap: 32px;
          padding: 32px;
          position: relative;
        }
        .avatar-large {
          width: 100px;
          height: 100px;
          border-radius: 32px;
          background: var(--grad-header);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          box-shadow: var(--shadow-lg);
        }
        .info-details h2 {
          font-size: 1.75rem;
          margin-bottom: 8px;
        }
        .badge-role {
          background: #e8f5e9;
          color: var(--primary);
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 800;
          display: inline-block;
          margin-bottom: 12px;
        }
        .contact-info {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .contact-info .item {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--text-muted);
          font-size: 0.875rem;
        }
        .btn-edit {
          position: absolute;
          top: 32px;
          right: 32px;
          background: #f1f5f9;
          padding: 8px 16px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 0.875rem;
        }
        .grid-menu {
          display: grid;
          gap: 16px;
          margin-bottom: 32px;
        }
        .menu-card {
          background: white;
          padding: 16px 20px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          gap: 20px;
          cursor: pointer;
          box-shadow: var(--shadow-sm);
          border: 1px solid var(--border);
          transition: all 0.2s;
        }
        .menu-card:hover {
          box-shadow: var(--shadow-md);
          border-color: var(--primary-light);
        }
        .icon-box {
          width: 52px;
          height: 52px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .menu-text {
          flex: 1;
        }
        .menu-text h4 {
          font-size: 1.1rem;
          margin-bottom: 2px;
        }
        .menu-text p {
          font-size: 0.8rem;
          color: var(--text-muted);
        }
        .arrow {
          color: var(--border);
        }
        .btn-logout {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 18px;
          border-radius: 20px;
          background: #fff1f2;
          color: var(--error);
          font-weight: 700;
          transition: all 0.2s;
        }
        .btn-logout:hover {
          background: #ffe4e6;
        }
        @media (max-width: 640px) {
          .profile-info-card {
            flex-direction: column;
            text-align: center;
          }
          .btn-edit {
            position: static;
            margin-top: 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default Profile;
