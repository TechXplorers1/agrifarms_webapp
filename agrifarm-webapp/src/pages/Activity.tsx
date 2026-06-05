import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { apiService } from '../services/apiService';
import { useLanguage } from '../services/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  History, Calendar, Clock, MapPin,
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
  roleInBooking: 'farmer' | 'provider';
  farmerId: string;
  providerId: string;
  addressText: string;
  notesText: string;
  includeOperator: boolean;
  providerName: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
}

const Activity: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const highlightBookingId = searchParams.get('bookingId');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'Upcoming' | 'History'>('Upcoming');
  const [userProfiles, setUserProfiles] = useState<Record<string, any>>({});

  const handleStatusUpdate = async (bookingId: string, status: string, cancelledBy?: string, cancellationReason?: string) => {
    try {
      await apiService.updateBookingStatus(bookingId, status, cancelledBy, cancellationReason);
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: status as any } : b));
      alert(`Booking status updated to ${status}`);
    } catch (err) {
      console.error("Failed to update booking status:", err);
      alert("Failed to update status. Please try again.");
    }
  };

  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const isProviderUser = ['OWNER', 'PROVIDER'].includes(user.role || '');
        const [farmerRes, providerRes] = await Promise.all([
          apiService.getFarmerBookings(user.id),
          isProviderUser ? apiService.getProviderBookings(user.id) : Promise.resolve({ data: [] })
        ]);

        const farmerBookings = (farmerRes.data || []).map((b: any) => ({ ...b, roleInBooking: 'farmer' }));
        const providerBookings = (providerRes.data || []).map((b: any) => ({ ...b, roleInBooking: 'provider' }));

        const merged = [...farmerBookings, ...providerBookings];
        // Remove duplicates if self-booking happens
        const uniqueMerged = merged.filter((value, index, self) =>
          self.findIndex(v => v.bookingId === value.bookingId) === index
        );

        // Sort by bookingDate descending
        uniqueMerged.sort((a: any, b: any) => new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime());

        const mappedBookings = uniqueMerged.map((b: any) => {
          let parsedNotes: any = {};
          try {
            parsedNotes = JSON.parse(b.notes || '{}');
          } catch (e) {
            parsedNotes = { notes: b.notes };
          }

          const start = new Date(b.scheduledStartTime);
          const end = new Date(b.scheduledEndTime);
          const durationHours = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60));

          return {
            id: b.bookingId,
            assetName: parsedNotes.assetName || `${b.assetType || 'Equipment'} Rental`,
            bookingDate: new Date(b.bookingDate).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            }),
            startTime: start.getHours().toString(),
            duration: durationHours || 1,
            totalPrice: b.totalAmount,
            status: b.status,
            category: b.assetType,
            roleInBooking: b.roleInBooking,
            // Extra fields for Receipt Modal and WhatsApp button
            farmerId: b.farmerId,
            providerId: b.providerId,
            addressText: b.addressText || 'N/A',
            notesText: parsedNotes.notes || '',
            includeOperator: !!parsedNotes.includeOperator,
            providerName: parsedNotes.providerName || 'Service Provider',
            scheduledStartTime: b.scheduledStartTime,
            scheduledEndTime: b.scheduledEndTime
          };
        });
        setBookings(mappedBookings);

        // Fetch user profiles for WhatsApp contact numbers and names
        const uniqueUserIds = Array.from(new Set([
          ...uniqueMerged.map(b => b.farmerId),
          ...uniqueMerged.map(b => b.providerId)
        ].filter(Boolean))) as string[];

        const userProfilesMap: Record<string, any> = {};
        await Promise.all(
          uniqueUserIds.map(async (id) => {
            try {
              const res = await apiService.getUser(id);
              if (res && res.data) {
                userProfilesMap[id] = res.data;
              }
            } catch (err) {
              console.error(`Failed to fetch profile for user ${id}:`, err);
            }
          })
        );
        setUserProfiles(userProfilesMap);

      } catch (error) {
        console.error('Error fetching bookings:', error);
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, [user]);

  // Handle auto-highlighting, tab selection and scrolling when navigating from notifications
  useEffect(() => {
    if (highlightBookingId && bookings.length > 0) {
      const targetBooking = bookings.find(b => b.id === highlightBookingId);
      if (targetBooking) {
        if (targetBooking.status === 'PENDING' || targetBooking.status === 'CONFIRMED') {
          setActiveTab('Upcoming');
        } else {
          setActiveTab('History');
        }

        // Wait a brief moment for the tab switch animation/render and scroll smoothly to the card
        setTimeout(() => {
          const cardElement = document.getElementById(`booking-card-${highlightBookingId}`);
          if (cardElement) {
            cardElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 300);
      }
    }
  }, [highlightBookingId, bookings]);

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
          <h1 className="text-3xl font-bold">{t('activity.title')}</h1>
          <p className="text-slate-500">{t('activity.desc')}</p>
        </div>
        <button className="refresh-btn" onClick={() => window.location.reload()} title={t('activity.refresh')}>
          <RefreshCcw size={20} />
        </button>
      </div>

      <div className="tab-switcher">
        <button
          className={activeTab === 'Upcoming' ? 'active' : ''}
          onClick={() => setActiveTab('Upcoming')}
        >
          {t('activity.upcomingTitle').replace('{count}', String(upcomingBookings.length))}
        </button>
        <button
          className={activeTab === 'History' ? 'active' : ''}
          onClick={() => setActiveTab('History')}
        >
          {t('activity.historyTitle').replace('{count}', String(historyBookings.length))}
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
                const isHighlighted = booking.id === highlightBookingId;
                return (
                  <motion.div
                    key={booking.id}
                    layout
                    id={`booking-card-${booking.id}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className={`booking-card card ${isHighlighted ? 'highlighted-booking-card' : ''}`}
                    style={isHighlighted ? {
                      border: '2px solid var(--primary)',
                      boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)',
                      transform: 'scale(1.02)'
                    } : undefined}
                  >
                    <div className="booking-status-indicator" style={{ backgroundColor: style.fg }} />
                    <div className="booking-main">
                      <div className="asset-info">
                        <div className="asset-type-icon">
                          <History size={24} color={style.fg} />
                        </div>
                        <div className="asset-text">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <h4 style={{ margin: 0 }}>{booking.assetName}</h4>
                            <span style={{
                              fontSize: '0.65rem',
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              background: booking.roleInBooking === 'provider' ? '#e0f2fe' : '#f0fdf4',
                              color: booking.roleInBooking === 'provider' ? '#0369a1' : '#15803d'
                            }}>
                              {booking.roleInBooking === 'provider' ? 'Received Request' : 'Booked by me'}
                            </span>
                          </div>
                          <p className="category">{booking.category || 'Rental'}</p>
                        </div>
                      </div>

                      <div className="booking-status-badge" style={{ backgroundColor: style.bg, color: style.fg }}>
                        <style.icon size={14} />
                        <span>{t('activity.status.' + booking.status.toLowerCase())}</span>
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

                    {/* Interactive Action Buttons */}
                    {(booking.status === 'PENDING' || booking.status === 'CONFIRMED') && (
                      <div className="booking-actions" style={{
                        display: 'flex',
                        gap: '12px',
                        padding: '12px 24px',
                        background: '#fafbfb',
                        borderTop: '1px solid #f8fafc',
                        borderBottom: '1px solid #f8fafc'
                      }}>
                        {booking.status === 'PENDING' && booking.roleInBooking === 'provider' && (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(booking.id, 'CONFIRMED')}
                              style={{
                                flex: 1,
                                padding: '10px 16px',
                                background: 'var(--primary)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '10px',
                                fontWeight: 800,
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                              }}
                            >
                              Confirm Booking
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(booking.id, 'REJECTED', 'PROVIDER', 'Rejected by provider')}
                              style={{
                                flex: 1,
                                padding: '10px 16px',
                                background: '#fef2f2',
                                color: '#dc2626',
                                border: '1px solid #fecaca',
                                borderRadius: '10px',
                                fontWeight: 800,
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                              }}
                            >
                              Reject Request
                            </button>
                          </>
                        )}
                        {booking.status === 'CONFIRMED' && booking.roleInBooking === 'provider' && (
                          <button
                            onClick={() => handleStatusUpdate(booking.id, 'COMPLETED')}
                            style={{
                              flex: 1,
                              padding: '10px 16px',
                              background: 'var(--primary)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '10px',
                              fontWeight: 800,
                              fontSize: '0.85rem',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                          >
                            Mark Completed
                          </button>
                        )}
                        {booking.roleInBooking === 'farmer' && (
                          <button
                            onClick={() => handleStatusUpdate(booking.id, 'REJECTED', 'FARMER', 'Cancelled by farmer')}
                            style={{
                              flex: 1,
                              padding: '10px 16px',
                              background: '#fff',
                              color: '#dc2626',
                              border: '1px solid #fecaca',
                              borderRadius: '10px',
                              fontWeight: 800,
                              fontSize: '0.85rem',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                          >
                            Cancel Booking
                          </button>
                        )}
                      </div>
                    )}

                    {/* Direct WhatsApp Contact Details Row */}
                    {(() => {
                      const otherId = booking.roleInBooking === 'farmer' ? booking.providerId : booking.farmerId;
                      const otherProfile = userProfiles[otherId];
                      if (!otherProfile || !otherProfile.phoneNumber) return null;

                      const phone = otherProfile.phoneNumber;
                      const name = otherProfile.fullName || 'User';

                      const waText = booking.roleInBooking === 'farmer'
                        ? `Hello ${name}, I am contacting you regarding my booking for ${booking.assetName} on ${booking.bookingDate}.`
                        : `Hello ${name}, I am contacting you regarding your booking request for ${booking.assetName} on ${booking.bookingDate}.`;

                      const waLink = `https://wa.me/${phone.replace(/\D/g, '').length === 10 ? `91${phone.replace(/\D/g, '')}` : phone.replace(/\D/g, '')}?text=${encodeURIComponent(waText)}`;

                      return (
                        <div className="booking-contact-row" style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 24px',
                          background: '#f8fafc',
                          borderTop: '1px solid #f1f5f9'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 650, color: 'var(--text-muted)' }}>
                              {booking.roleInBooking === 'farmer' ? 'Provider:' : 'Customer:'}
                            </span>
                            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)' }}>
                              {name} ({phone.length === 10 ? `+91 ${phone.slice(0, 5)} ${phone.slice(5)}` : phone})
                            </span>
                          </div>

                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              backgroundColor: '#25D366',
                              color: 'white',
                              padding: '6px 12px',
                              borderRadius: '8px',
                              fontSize: '0.75rem',
                              fontWeight: 800,
                              textDecoration: 'none',
                              boxShadow: '0 2px 6px rgba(37, 211, 102, 0.25)',
                              transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#20ba56')}
                            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#25D366')}
                          >
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.725 1.451 5.437 0 9.862-4.43 9.866-9.873.002-2.637-1.023-5.116-2.887-6.98a9.86 9.86 0 0 0-6.98-2.881c-5.447 0-9.873 4.432-9.877 9.877-.001 1.63.432 3.22 1.253 4.636l-.99 3.61 3.712-.973zm10.274-6.425c-.29-.145-1.716-.847-1.978-.942-.262-.096-.453-.145-.642.145-.19.29-.733.942-.898 1.133-.166.19-.33.21-.62.066-.29-.145-1.22-.45-2.324-1.433-.859-.766-1.439-1.713-1.607-2.002-.168-.29-.018-.447.127-.59.13-.13.29-.33.435-.494.145-.166.19-.28.29-.467.097-.19.047-.355-.024-.5-.07-.145-.642-1.549-.88-2.12-.23-.556-.464-.48-.642-.486-.165-.005-.355-.006-.547-.006-.19 0-.5.072-.76.359-.26.29-1 .978-1 2.387 0 1.41 1.02 2.77 1.163 2.96.143.19 2 3.059 4.848 4.286.677.29 1.207.464 1.62.594.68.217 1.3.187 1.79.112.546-.083 1.716-.7 1.958-1.378.24-.678.24-1.258.17-1.378-.072-.12-.262-.21-.553-.355z" />
                            </svg>
                            <span>WhatsApp</span>
                          </a>
                        </div>
                      );
                    })()}

                    <div className="booking-footer">
                      <div className="price-info">
                        <p>{t('activity.paid')}</p>
                        <h4>₹{booking.totalPrice}</h4>
                      </div>
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
                <h3>{t('activity.emptyLabel')}</h3>
                <p>{t('activity.emptySub')}</p>
                <button className="btn-primary" onClick={() => navigate('/rentals')} style={{ marginTop: '16px' }}>{t('activity.exploreRentals')}</button>
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
        .highlighted-booking-card {
          animation: highlightGlow 2.5s ease-out;
        }
        @keyframes highlightGlow {
          0% { border-color: transparent; box-shadow: none; }
          15% { border-color: var(--primary); box-shadow: 0 0 20px rgba(16, 185, 129, 0.6); }
          85% { border-color: var(--primary); box-shadow: 0 0 20px rgba(16, 185, 129, 0.6); }
          100% { border-color: var(--primary); box-shadow: 0 0 15px rgba(16, 185, 129, 0.4); }
        }
      `}</style>
    </div>
  );
};

export default Activity;
