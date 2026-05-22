import React, { useState, useEffect } from 'react';
import { 
  Home, History, User, LayoutGrid, LogIn, Sprout, Bell, ClipboardList, 
  X, CheckCheck, Info, Tag 
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { apiService } from '../services/apiService';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar: React.FC = () => {
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  const defaultNotifications = [
    {
      id: '1',
      title: 'Booking Confirmed 🚜',
      message: 'Your tractor rental booking for John Deere 5050D has been approved by the owner.',
      type: 'booking',
      time: '10 mins ago',
      read: false
    },
    {
      id: '2',
      title: 'Crop Advice Alert 🌾',
      message: 'High humidity levels detected in your area. Spraying pesticide is recommended for paddy crops.',
      type: 'advice',
      time: '2 hours ago',
      read: false
    },
    {
      id: '3',
      title: 'Mandi Price Update 📈',
      message: 'Wheat prices in your local Mandi increased by ₹80/quintal. Current rate is ₹2,280/quintal.',
      type: 'price',
      time: 'Yesterday',
      read: true
    }
  ];

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      setNotifications([]);
      return;
    }

    const fetchNotifications = async () => {
      try {
        const res = await apiService.getNotifications(user.id);
        if (res && res.data && res.data.length > 0) {
          setNotifications(res.data);
        } else {
          setNotifications(defaultNotifications);
        }
      } catch (err) {
        console.error("Error fetching notifications:", err);
        setNotifications(defaultNotifications);
      }
    };

    fetchNotifications();
    // Poll every 30 seconds for live updates
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, user]);

  const handleMarkAsRead = async (id: string) => {
    // Optimistic UI update
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    try {
      await apiService.markAsRead(id);
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user?.id) return;
    // Optimistic UI update
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try {
      await apiService.markAllNotificationsAsRead(user.id);
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    }
  };

  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Rentals', path: '/rentals', icon: LayoutGrid },
    { name: 'Services', path: '/services', icon: Sprout },
    { name: 'Activity', path: '/activity', icon: History },
  ];

  const showManageAssets = isAuthenticated && ['OWNER', 'PROVIDER'].includes(user?.role || '');
  const unreadCount = notifications.filter(n => !n.read).length;

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

          {showManageAssets && (
            <Link
              to="/manage-assets"
              className={`nav-item ${location.pathname === '/manage-assets' ? 'active' : ''}`}
            >
              <ClipboardList size={20} />
              <span>Manage Assets</span>
            </Link>
          )}

          {isAuthenticated && (
            <button
              onClick={() => setIsNotificationsOpen(true)}
              className={`nav-item ${isNotificationsOpen ? 'active' : ''}`}
              style={{ 
                position: 'relative', 
                background: 'none', 
                border: 'none', 
                font: 'inherit', 
                padding: 0, 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="nav-badge" style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '-8px',
                    background: '#ef4444',
                    color: 'white',
                    fontSize: '0.65rem',
                    fontWeight: 900,
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                  }}>{unreadCount}</span>
                )}
              </div>
              <span>Notifications</span>
            </button>
          )}

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
          {[
            ...navItems,
            ...(showManageAssets ? [{ name: 'Manage', path: '/manage-assets', icon: ClipboardList }] : []),
            ...(isAuthenticated ? [{ name: 'Alerts', path: '/notifications', icon: Bell }] : []),
            { name: 'Profile', path: '/profile', icon: User }
          ].map((item) => {
            const isAlerts = item.name === 'Alerts';
            return isAlerts ? (
              <button
                key={item.name}
                onClick={() => setIsNotificationsOpen(true)}
                className={`mobile-nav-item ${isNotificationsOpen ? 'active' : ''}`}
                style={{ background: 'none', border: 'none', font: 'inherit', cursor: 'pointer' }}
              >
                <item.icon size={22} />
                <span>{item.name}</span>
              </button>
            ) : (
              <Link
                key={item.name}
                to={item.path}
                className={`mobile-nav-item ${location.pathname === item.path ? 'active' : ''}`}
              >
                <item.icon size={22} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Premium Sliding Notifications Drawer Panel */}
      <AnimatePresence>
        {isNotificationsOpen && (
          <>
            {/* Backdrop Blur Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNotificationsOpen(false)}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(15, 23, 42, 0.4)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                zIndex: 9999
              }}
            />

            {/* Drawer Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              style={{
                position: 'fixed',
                top: 0,
                right: 0,
                height: '100vh',
                width: '100%',
                maxWidth: '420px',
                background: '#ffffff',
                boxShadow: '-10px 0 40px rgba(15, 23, 42, 0.15)',
                display: 'flex',
                flexDirection: 'column',
                zIndex: 10000,
                overflow: 'hidden'
              }}
            >
              {/* Header */}
              <div style={{
                padding: '24px 20px',
                borderBottom: '1px solid #f1f5f9',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#fafbfb'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Bell size={22} color="var(--primary)" />
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>Notifications</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                      {unreadCount} unread alerts
                    </p>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {unreadCount > 0 && (
                    <button 
                      onClick={handleMarkAllAsRead}
                      style={{
                        padding: '6px 12px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: 'var(--primary)',
                        background: '#e8f5e9',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                      title="Mark all as read"
                    >
                      <CheckCheck size={14} />
                      <span>Read All</span>
                    </button>
                  )}
                  <button
                    onClick={() => setIsNotificationsOpen(false)}
                    style={{
                      background: '#f1f5f9',
                      border: 'none',
                      padding: '8px',
                      borderRadius: '50%',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-muted)'
                    }}
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Drawer Body */}
              <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '20px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                {notifications.length === 0 ? (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    color: 'var(--text-muted)',
                    gap: '12px',
                    textAlign: 'center',
                    padding: '0 24px'
                  }}>
                    <div style={{ background: '#f1f5f9', padding: '16px', borderRadius: '50%' }}>
                      <Bell size={36} style={{ opacity: 0.4 }} />
                    </div>
                    <div>
                      <h4 style={{ fontWeight: 800, color: 'var(--text-main)' }}>All caught up!</h4>
                      <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>No new notifications or alerts at this moment.</p>
                    </div>
                  </div>
                ) : (
                  notifications.map((notif, index) => {
                    const iconBg = notif.type === 'booking' ? '#e8f5e9' : notif.type === 'advice' ? '#e3f2fd' : '#fff8e1';
                    const iconColor = notif.type === 'booking' ? '#2e7d32' : notif.type === 'advice' ? '#1565c0' : '#b78103';
                    const IconComp = notif.type === 'booking' ? CheckCheck : notif.type === 'advice' ? Info : Tag;

                    return (
                      <div
                        key={notif.id || `notif-${index}`}
                        onClick={() => handleMarkAsRead(notif.id)}
                        style={{
                          display: 'flex',
                          gap: '14px',
                          padding: '16px',
                          borderRadius: '16px',
                          background: notif.read ? '#ffffff' : '#f8fafc',
                          border: notif.read ? '1px solid #f1f5f9' : '1px solid rgba(16, 185, 129, 0.15)',
                          cursor: 'pointer',
                          position: 'relative',
                          transition: 'all 0.2s ease',
                          textAlign: 'left'
                        }}
                      >
                        {!notif.read && (
                          <div style={{
                            position: 'absolute',
                            top: '16px',
                            right: '16px',
                            width: '8px',
                            height: '8px',
                            background: '#ef4444',
                            borderRadius: '50%'
                          }} />
                        )}

                        <div style={{
                          background: iconBg,
                          color: iconColor,
                          width: '42px',
                          height: '42px',
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <IconComp size={20} />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <h4 style={{
                            fontSize: '0.95rem',
                            fontWeight: notif.read ? 700 : 900,
                            color: 'var(--text-main)',
                            margin: 0
                          }}>{notif.title}</h4>
                          <p style={{
                            fontSize: '0.85rem',
                            color: '#475569',
                            margin: 0,
                            lineHeight: '1.4'
                          }}>{notif.message}</p>
                          <span style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-muted)',
                            marginTop: '4px',
                            fontWeight: 600
                          }}>{notif.time}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Drawer Footer */}
              <div style={{
                padding: '20px',
                borderTop: '1px solid #f1f5f9',
                background: '#fafbfb',
                display: 'flex',
                justifyContent: 'center'
              }}>
                <button
                  onClick={() => setIsNotificationsOpen(false)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '12px',
                    background: 'var(--grad-primary)',
                    color: 'white',
                    fontWeight: 800,
                    fontSize: '0.95rem',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(5, 150, 105, 0.2)',
                    textAlign: 'center'
                  }}
                >
                  Close Panel
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
