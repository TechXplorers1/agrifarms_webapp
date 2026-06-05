import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { apiService } from '../services/apiService';
import { useLanguage } from '../services/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, Sprout, Tractor, ChevronRight, 
  ArrowLeft, Loader2, Tag, CheckCheck, X
} from 'lucide-react';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  relatedId?: string;
  read: boolean;
  isRead?: boolean;
  time?: string;
  createdAt?: string;
}

const Notifications: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

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
      read: false
    }
  ];

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    const fetchNotifications = async () => {
      try {
        const res = await apiService.getNotifications(user.id);
        if (res && res.data && res.data.length > 0) {
          // Filter to display only unread notifications (disappearing when read)
          const unread = res.data.filter((n: any) => n.read === false || n.isRead === false);
          setNotifications(unread);
        } else {
          setNotifications(defaultNotifications);
        }
      } catch (err) {
        console.error("Error fetching notifications for screen:", err);
        setNotifications(defaultNotifications);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [isAuthenticated, user]);

  const handleNotificationClick = async (notif: NotificationItem) => {
    // 1. Optimistically filter it out of the UI list so it disappears instantly
    setNotifications(prev => prev.filter(n => n.id !== notif.id));

    // 2. Report read status to backend API
    try {
      await apiService.markAsRead(notif.id);
    } catch (err) {
      console.error("Failed to mark notification as read on backend:", err);
    }

    // 3. Resolve target route and redirect
    const type = (notif.type || '').toLowerCase();
    const title = (notif.title || '').toLowerCase();
    const message = (notif.message || '').toLowerCase();
    const relatedId = notif.relatedId || '';

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

  const getNotificationIcon = (type: string, title?: string, message?: string) => {
    const tLower = type.toLowerCase();
    const isApproval = tLower === 'asset_approval' || tLower.includes('approval') || tLower.includes('approve') || tLower.includes('reject');
    const isRejected = (title || '').toLowerCase().includes('reject') || (message || '').toLowerCase().includes('reject');

    if (isApproval) {
      return isRejected 
        ? { icon: X, bg: '#fde8e8', fg: '#dc2626' }
        : { icon: CheckCheck, bg: '#e8f5e9', fg: '#2e7d32' };
    }
    if (tLower === 'booking' || tLower.includes('book')) return { icon: Tractor, bg: '#e8f5e9', fg: '#2e7d32' };
    if (tLower === 'advice' || tLower.includes('crop')) return { icon: Sprout, bg: '#e3f2fd', fg: '#1565c0' };
    return { icon: Tag, bg: '#fff8e1', fg: '#b78103' };
  };

  const formatTimeText = (notif: NotificationItem) => {
    if (notif.time) return notif.time;
    if (notif.createdAt) {
      const date = new Date(notif.createdAt);
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    return 'Just now';
  };

  return (
    <div className="notifications-page container fade-in" style={{ paddingBottom: '60px' }}>
      <div className="settings-header-row" style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px' }}>
        <motion.button 
          whileHover={{ scale: 1.05, x: -2 }}
          whileTap={{ scale: 0.95 }}
          className="back-arrow-btn"
          onClick={() => navigate('/')}
          style={{
            background: 'white',
            border: '1px solid var(--border)',
            width: '46px',
            height: '46px',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-main)',
            boxShadow: 'var(--shadow-sm)',
            cursor: 'pointer'
          }}
        >
          <ArrowLeft size={20} />
        </motion.button>
        <div style={{ flex: 1 }}>
          <h1 className="text-3xl font-extrabold">{t('notifications.title') || 'Notifications'}</h1>
          <p className="text-slate-500">Manage your new alerts and service status updates</p>
        </div>
        {notifications.length > 0 && (
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleMarkAllAsRead}
            style={{
              padding: '10px 20px',
              fontSize: '0.85rem',
              fontWeight: 800,
              color: 'var(--primary)',
              background: '#e8f5e9',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <CheckCheck size={16} />
            <span>Mark all as read</span>
          </motion.button>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
          <Loader2 className="animate-spin" size={36} color="var(--primary)" />
        </div>
      ) : (
        <div className="notifications-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '720px', margin: '0 auto' }}>
          <AnimatePresence mode="popLayout">
            {notifications.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '60px 24px',
                  background: 'white',
                  borderRadius: '28px',
                  border: '1px solid var(--border)',
                  boxShadow: 'var(--shadow-sm)',
                  textAlign: 'center',
                  minHeight: '280px'
                }}
              >
                <div style={{ background: '#f1f5f9', padding: '20px', borderRadius: '50%', marginBottom: '16px' }}>
                  <Bell size={40} style={{ opacity: 0.4, color: 'var(--text-muted)' }} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>All caught up!</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '6px', maxWidth: '340px' }}>
                  You have no new unread notifications. Read alerts will automatically disappear from this feed.
                </p>
              </motion.div>
            ) : (
              notifications.map((notif) => {
                const iconMeta = getNotificationIcon(notif.type, notif.title, notif.message);
                const IconComponent = iconMeta.icon;

                return (
                  <motion.div
                    key={notif.id}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                    whileHover={{ scale: 1.01, boxShadow: 'var(--shadow-md)', borderColor: 'rgba(16, 185, 129, 0.15)' }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => handleNotificationClick(notif)}
                    style={{
                      background: 'white',
                      padding: '20px',
                      borderRadius: '20px',
                      border: '1px solid var(--border)',
                      boxShadow: 'var(--shadow-sm)',
                      cursor: 'pointer',
                      display: 'flex',
                      gap: '16px',
                      alignItems: 'center',
                      textAlign: 'left',
                      transition: 'border-color 0.2s, box-shadow 0.2s'
                    }}
                  >
                    <div style={{
                      background: iconMeta.bg,
                      color: iconMeta.fg,
                      width: '48px',
                      height: '48px',
                      borderRadius: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <IconComponent size={24} />
                    </div>
                    
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                        {notif.title}
                      </h4>
                      <p style={{ fontSize: '0.9rem', color: '#475569', margin: '4px 0 0 0', lineHeight: 1.4 }}>
                        {notif.message}
                      </p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        {formatTimeText(notif)}
                      </span>
                      <ChevronRight size={18} color="#94a3b8" />
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default Notifications;
