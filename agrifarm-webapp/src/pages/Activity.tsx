import React, { useState, useEffect } from 'react';
import { useAuth } from '../services/AuthContext';
import { apiService } from '../services/apiService';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  History, Calendar, Clock, MapPin, ChevronRight, 
  CheckCircle2, Clock3, XCircle, AlertCircle, RefreshCcw
} from 'lucide-react';

interface Booking {
  id: string;
  assetName: string;
  bookingDate: string;
  startTime: string;
  duration: number;
  totalPrice: number;
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'COMPLETED';
  category?: string;
}

const Activity: React.FC = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'Upcoming' | 'History'>('Upcoming');

  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const response = await apiService.getFarmerBookings(user.id);
        setBookings(response.data);
      } catch (error) {
        console.error('Error fetching bookings:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, [user]);

  const upcomingBookings = bookings.filter(b => b.status === 'PENDING' || b.status === 'CONFIRMED');
  const historyBookings = bookings.filter(b => b.status === 'REJECTED' || b.status === 'COMPLETED');

  const displayBookings = activeTab === 'Upcoming' ? upcomingBookings : historyBookings;

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'PENDING': return { bg: '#fff7ed', fg: '#ea580c', icon: Clock3 };
      case 'CONFIRMED': return { bg: '#f0fdf4', fg: '#16a34a', icon: CheckCircle2 };
      case 'REJECTED': return { bg: '#fef2f2', fg: '#dc2626', icon: XCircle };
      case 'COMPLETED': return { bg: '#f8fafc', fg: '#64748b', icon: History };
      default: return { bg: '#f1f5f9', fg: '#475569', icon: AlertCircle };
    }
  };

  return (
    <div className="activity-page container fade-in">
      <div className="page-header">
        <div>
          <h1 className="text-3xl font-bold">My Activity</h1>
          <p className="text-slate-500">Track your bookings and rental history</p>
        </div>
        <button className="refresh-btn" onClick={() => window.location.reload()}>
          <RefreshCcw size={20} />
        </button>
      </div>

      <div className="tab-switcher">
        <button 
          className={activeTab === 'Upcoming' ? 'active' : ''} 
          onClick={() => setActiveTab('Upcoming')}
        >
          Upcoming ({upcomingBookings.length})
        </button>
        <button 
          className={activeTab === 'History' ? 'active' : ''} 
          onClick={() => setActiveTab('History')}
        >
          History ({historyBookings.length})
        </button>
      </div>

      {loading ? (
        <div className="loading-state">
          {[1, 2, 3].map(i => <div key={i} className="skeleton-booking-card" />)}
        </div>
      ) : (
        <div className="bookings-list">
          <AnimatePresence mode="popLayout">
            {displayBookings.length > 0 ? (
              displayBookings.map((booking) => {
                const style = getStatusStyle(booking.status);
                return (
                  <motion.div 
                    key={booking.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="booking-card card"
                  >
                    <div className="booking-status-indicator" style={{ backgroundColor: style.fg }} />
                    <div className="booking-main">
                      <div className="asset-info">
                        <div className="asset-type-icon">
                           <History size={24} color={style.fg} />
                        </div>
                        <div className="asset-text">
                          <h4>{booking.assetName}</h4>
                          <p className="category">{booking.category || 'Rental'}</p>
                        </div>
                      </div>
                      
                      <div className="booking-status-badge" style={{ backgroundColor: style.bg, color: style.fg }}>
                        <style.icon size={14} />
                        <span>{booking.status}</span>
                      </div>
                    </div>

                    <div className="booking-details">
                      <div className="detail-item">
                        <Calendar size={14} />
                        <span>{booking.bookingDate}</span>
                      </div>
                      <div className="detail-item">
                        <Clock size={14} />
                        <span>{booking.startTime}:00 ({booking.duration}h)</span>
                      </div>
                      <div className="detail-item">
                        <MapPin size={14} />
                        <span>Village Location</span>
                      </div>
                    </div>

                    <div className="booking-footer">
                      <div className="price-info">
                        <p>Total Paid</p>
                        <h4>₹{booking.totalPrice}</h4>
                      </div>
                      <button className="btn-view-details">
                        <span>View Receipt</span>
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="empty-bookings"
              >
                <div className="empty-icon">
                  <History size={48} color="#cbd5e1" />
                </div>
                <h3>No bookings found</h3>
                <p>You haven't made any {activeTab.toLowerCase()} bookings yet.</p>
                <button className="btn-primary" style={{ marginTop: '16px' }}>Explore Rentals</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <style>{`
        .activity-page {
          padding-top: 24px;
          max-width: 800px !important;
        }
        .refresh-btn {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          background: white;
          border: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          transition: all 0.2s;
        }
        .refresh-btn:hover {
          background: var(--bg-main);
          color: var(--primary);
        }
        .tab-switcher {
          display: flex;
          background: #f1f5f9;
          padding: 6px;
          border-radius: 16px;
          margin: 32px 0;
        }
        .tab-switcher button {
          flex: 1;
          padding: 12px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 0.95rem;
          color: var(--text-muted);
          transition: all 0.2s;
        }
        .tab-switcher button.active {
          background: white;
          color: var(--primary);
          box-shadow: var(--shadow-sm);
        }
        .bookings-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 40px;
        }
        .booking-card {
          position: relative;
          overflow: hidden;
          padding: 0 !important;
        }
        .booking-status-indicator {
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 6px;
        }
        .booking-main {
          padding: 20px 24px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 1px solid #f8fafc;
        }
        .asset-info {
          display: flex;
          gap: 16px;
          align-items: center;
        }
        .asset-type-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: #f8fafc;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .asset-text h4 {
          font-size: 1.15rem;
          font-weight: 700;
          margin-bottom: 2px;
        }
        .asset-text .category {
          font-size: 0.8rem;
          color: var(--primary);
          font-weight: 700;
          text-transform: uppercase;
        }
        .booking-status-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 10px;
          font-size: 0.75rem;
          font-weight: 800;
        }
        .booking-details {
          padding: 16px 24px;
          background: #fcfdfe;
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
        }
        .detail-item {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--text-muted);
          font-size: 0.875rem;
          font-weight: 500;
        }
        .booking-footer {
          padding: 16px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: white;
          border-top: 1px solid #f8fafc;
        }
        .price-info p {
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-bottom: 2px;
        }
        .price-info h4 {
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--text-main);
        }
        .btn-view-details {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--primary);
          font-weight: 700;
          font-size: 0.9rem;
          padding: 8px 12px;
          border-radius: 10px;
          transition: all 0.2s;
        }
        .btn-view-details:hover {
          background: #f0fdf4;
        }
        .empty-bookings {
          text-align: center;
          padding: 60px 20px;
          color: var(--text-muted);
        }
        .empty-icon {
          margin-bottom: 16px;
        }
        .skeleton-booking-card {
          height: 200px;
          background: #f1f5f9;
          border-radius: 24px;
          margin-bottom: 16px;
          animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 0.3; }
          100% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
};

export default Activity;
