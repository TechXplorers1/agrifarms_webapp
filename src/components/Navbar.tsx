import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Home, History, User, LayoutGrid, LogIn, Sprout, Bell, ClipboardList, 
  X, CheckCheck, Info, Tag, Menu
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { apiService } from '../services/apiService';
import { useLanguage } from '../services/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar: React.FC = () => {
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      setNotifications([]);
      return;
    }

    const fetchNotifications = async () => {
      try {
        const res = await apiService.getNotifications(user.id);
        if (res && res.data && res.data.length > 0) {
          const unread = res.data.filter((n: any) => n.read === false || n.isRead === false);
          setNotifications(unread);
        } else {
          setNotifications([]);
        }
      } catch (err) {
        console.error("Error fetching notifications:", err);
        setNotifications([]);
      }
    };

    fetchNotifications();
    // Poll every 5 seconds for live updates
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, [isAuthenticated, user]);

  const handleMarkAsRead = async (id: string) => {
    // Optimistic UI update - filter out read items immediately
    setNotifications(prev => prev.filter(n => n.id !== id));
    try {
      await apiService.markAsRead(id);
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const handleNotificationClick = async (notif: any) => {
    // 1. Mark as read if unread
    if (notif.read === false || notif.isRead === false) {
      await handleMarkAsRead(notif.id);
    }
    
    // 2. Close notifications panel
    setIsNotificationsOpen(false);
    
    // 3. Determine target route based on type, title, and message
    const type = (notif.type || '').toLowerCase();
    const title = (notif.title || '').toLowerCase();
    const message = (notif.message || '').toLowerCase();
    const relatedId = notif.relatedId || notif.bookingId || '';
    
    if (type.includes('booking') || title.includes('booking') || message.includes('booking') || message.includes('confirmed') || message.includes('requested')) {
      if (relatedId) {
        navigate(`/activity?bookingId=${relatedId}`);
      } else {
        navigate('/activity');
      }
    } else if (type.includes('approval') || type.includes('asset') || title.includes('approved') || title.includes('rejected') || message.includes('approved') || message.includes('rejected')) {
      navigate('/manage-assets');
    } else if (type.includes('advice') || type.includes('crop') || title.includes('advice') || title.includes('crop') || message.includes('pesticide') || message.includes('crop')) {
      navigate('/services');
    } else if (type.includes('price') || type.includes('mandi') || title.includes('price') || title.includes('mandi') || message.includes('price') || message.includes('mandi')) {
      navigate('/');
    } else if (type.includes('equipment') || type.includes('rental') || title.includes('equipment') || title.includes('rental') || message.includes('rent')) {
      navigate('/rentals');
    } else {
      // Fallback
      if (relatedId) {
        navigate(`/activity?bookingId=${relatedId}`);
      } else {
        navigate('/activity');
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user?.id) return;
    // Clear notifications list (they all disappear)
    setNotifications([]);
    try {
      await apiService.markAllNotificationsAsRead(user.id);
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    }
  };

  const navItems = [
    { name: t('nav.home'), path: '/', icon: Home, state: undefined },
    { name: t('nav.rentals'), path: '/rentals', icon: LayoutGrid, state: undefined },
    { name: t('nav.services'), path: '/services', icon: Sprout, state: { initialFilter: 'Services' } },
    { name: t('nav.activity'), path: '/activity', icon: History, state: undefined },
  ];

  const showManageAssets = isAuthenticated && ['OWNER', 'PROVIDER'].includes(user?.role || '');
  const unreadCount = notifications.length;

  return (
    <nav className="web-navbar">
      <div className="nav-container">
        <Link to="/" className="logo-section">
          <div className="logo-box">
            <Sprout size={24} color="var(--primary)" />
          </div>
          <span className="logo-text">{t('logo.title')}</span>
        </Link>
        <div className="nav-links">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              state={item.state}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              <item.icon size={20} />
              <span>{item.name}</span>
            </Link>
          ))}

          {showManageAssets && (
            <>
              <Link
                to="/manage-assets"
                className={`nav-item ${location.pathname === '/manage-assets' ? 'active' : ''}`}
              >
                <ClipboardList size={20} />
                <span>{t('nav.manage')}</span>
              </Link>
              <Link
                to="/service-requests"
                className={`nav-item ${location.pathname === '/service-requests' ? 'active' : ''}`}
              >
                <History size={20} />
                <span>{t('nav.requests')}</span>
              </Link>
            </>
          )}

          {isAuthenticated && (
            <button
              onClick={() => setIsNotificationsOpen(true)}
              className={`nav-item ${isNotificationsOpen ? 'active' : ''}`}
              style={{ 
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
                  <span className="nav-badge-count" style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '-8px',
                    background: '#ef4444',
                    color: 'white',
                    fontSize: '10px',
                    fontWeight: 800,
                    minWidth: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 4px',
                    boxShadow: '0 0 8px rgba(239, 68, 68, 0.8)',
                    border: '1.5px solid white'
                  }}>
                    {unreadCount}
                  </span>
                )}
              </div>
              <span>{t('nav.notifications')}</span>
            </button>
          )}

          {isAuthenticated ? (
            <Link
              to="/profile"
              className={`nav-item ${location.pathname === '/profile' ? 'active' : ''}`}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              {user?.profilePic ? (
                <img 
                  src={apiService.getFullImageUrl(user.profilePic)} 
                  alt={user?.name || 'Profile'} 
                  style={{ 
                    width: '24px', 
                    height: '24px', 
                    borderRadius: '50%', 
                    objectFit: 'cover', 
                    border: '1.5px solid var(--primary-light)' 
                  }} 
                />
              ) : (
                <User size={20} />
              )}
              <span>{user?.name || t('nav.profile')}</span>
            </Link>
          ) : (
            <Link to="/login" className="btn-primary" style={{ padding: '8px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <LogIn size={18} />
              <span>{t('nav.login')}</span>
            </Link>
          )}
        </div>

        {/* Hamburger Menu Button (Mobile) */}
        <button 
          className="mobile-menu-btn" 
          onClick={() => setIsMobileMenuOpen(true)}
          style={{ display: 'none', background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '8px' }}
        >
          <Menu size={28} />
        </button>
      </div>

      {/* Mobile Drawer */}
      {createPortal(
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileMenuOpen(false)}
                style={{
                  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                  background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', zIndex: 9999
                }}
              />
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                style={{
                  position: 'fixed', top: 0, left: 0, height: '100vh', width: '80%', maxWidth: '320px',
                  background: '#ffffff', boxShadow: '10px 0 40px rgba(15, 23, 42, 0.15)',
                  display: 'flex', flexDirection: 'column', zIndex: 10000, overflow: 'hidden'
                }}
              >
                <div style={{ padding: '24px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fafbfb' }}>
                  <div className="logo-section" onClick={() => { navigate('/'); setIsMobileMenuOpen(false); }} style={{ cursor: 'pointer' }}>
                    <div className="logo-box">
                      <Sprout size={24} color="var(--primary)" />
                    </div>
                    <span className="logo-text">{t('logo.title')}</span>
                  </div>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    style={{ background: '#f1f5f9', border: 'none', padding: '8px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}
                  >
                    <X size={18} />
                  </button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    ...navItems,
                    ...(showManageAssets ? [
                      { name: t('nav.manage'), path: '/manage-assets', icon: ClipboardList },
                      { name: t('nav.requests'), path: '/service-requests', icon: History }
                    ] : []),
                    ...(isAuthenticated ? [{ name: t('nav.notifications'), path: '/notifications', icon: Bell }] : []),
                    { name: t('nav.profile'), path: '/profile', icon: User }
                  ].map((item) => {
                    const isAlerts = item.name === t('nav.notifications');
                    const targetPath = isAlerts ? '/notifications' : item.path;
                    return (
                      <Link
                        key={item.name}
                        to={targetPath}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`mobile-drawer-item ${location.pathname === targetPath ? 'active' : ''}`}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px',
                          borderRadius: '12px', color: 'var(--text-main)', textDecoration: 'none', fontWeight: 600,
                          transition: 'background 0.2s, color 0.2s'
                        }}
                      >
                        <item.icon size={22} style={{ color: 'var(--primary)' }} />
                        <span style={{ fontSize: '1.05rem' }}>{item.name}</span>
                        {isAlerts && unreadCount > 0 && (
                          <span style={{ background: '#ef4444', color: 'white', fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '10px', marginLeft: 'auto' }}>
                            {unreadCount} New
                          </span>
                        )}
                      </Link>
                    )
                  })}
                  {!isAuthenticated && (
                    <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', borderRadius: '12px', background: 'var(--grad-primary)', color: 'white', textDecoration: 'none', fontWeight: 700, marginTop: '8px', boxShadow: '0 4px 10px rgba(5,150,105,0.3)' }}>
                      <LogIn size={20} />
                      <span style={{ fontSize: '1.05rem' }}>{t('nav.login')}</span>
                    </Link>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Premium Sliding Notifications Drawer Panel - portaled to body to escape nav stacking context */}
      {createPortal(
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
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>{t('notifications.title')}</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                      {t('notifications.unreadAlerts').replace('{count}', String(unreadCount))}
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
                      <span>{t('notifications.readAll')}</span>
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
                      <h4 style={{ fontWeight: 800, color: 'var(--text-main)' }}>{t('notifications.emptyTitle')}</h4>
                      <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>{t('notifications.emptyDesc')}</p>
                    </div>
                  </div>
                ) : (
                  notifications.map((notif, index) => {
                    const tLower = (notif.type || '').toLowerCase();
                    const isApproval = tLower === 'asset_approval' || tLower.includes('approval') || tLower.includes('approve') || tLower.includes('reject');
                    const isRejected = (notif.title || '').toLowerCase().includes('reject') || (notif.message || '').toLowerCase().includes('reject');

                    const iconBg = isApproval ? (isRejected ? '#fde8e8' : '#e8f5e9') : notif.type === 'booking' ? '#e8f5e9' : notif.type === 'advice' ? '#e3f2fd' : '#fff8e1';
                    const iconColor = isApproval ? (isRejected ? '#dc2626' : '#2e7d32') : notif.type === 'booking' ? '#2e7d32' : notif.type === 'advice' ? '#1565c0' : '#b78103';
                    const IconComp = isApproval ? (isRejected ? X : CheckCheck) : notif.type === 'booking' ? CheckCheck : notif.type === 'advice' ? Info : Tag;

                    return (
                      <div
                        key={notif.id || `notif-${index}`}
                        onClick={() => handleNotificationClick(notif)}
                        style={{
                          display: 'flex',
                          gap: '14px',
                          padding: '16px',
                          borderRadius: '16px',
                          background: (notif.read || notif.isRead) ? '#ffffff' : '#f8fafc',
                          border: (notif.read || notif.isRead) ? '1px solid #f1f5f9' : '1px solid rgba(16, 185, 129, 0.15)',
                          cursor: 'pointer',
                          position: 'relative',
                          transition: 'all 0.2s ease',
                          textAlign: 'left'
                        }}
                      >
                        {!(notif.read || notif.isRead) && (
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
                            fontWeight: (notif.read || notif.isRead) ? 700 : 900,
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
                  {t('notifications.close')}
                </button>
              </div>
            </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </nav>
  );
};

export default Navbar;
