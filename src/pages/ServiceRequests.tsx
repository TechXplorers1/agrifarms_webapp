import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { apiService } from '../services/apiService';
import { useLanguage } from '../services/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  History, Calendar, Clock, MapPin, CheckCircle2, Clock3, XCircle, 
  AlertCircle, RefreshCcw, User, Phone, Check, X, ShieldAlert,
  Search, ClipboardList, IndianRupee, MessageCircle, Loader2
} from 'lucide-react';

interface Booking {
  id: string;
  assetId: string;
  assetName: string;
  bookingDate: string;
  startTime: string;
  duration: number;
  totalPrice: number;
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'COMPLETED';
  category?: string;
  farmerId: string;
  addressText: string;
  notesText: string;
  includeOperator: boolean;
  scheduledStartTime: string;
  scheduledEndTime: string;
  cancellationReason?: string;
}

const ServiceRequests: React.FC = () => {
  const { t } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [userProfiles, setUserProfiles] = useState<Record<string, any>>({});
  
  // Modal for cancellation reason
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [actionType, setActionType] = useState<'REJECT' | 'CANCEL'>('REJECT');

  const fetchRequests = async () => {
    const id = user?.id || JSON.parse(localStorage.getItem('agrifarm_user') || '{}').id;
    if (!id) return;
    
    setLoading(true);
    try {
      const response = await apiService.getProviderBookings(id);
      const data = response.data || [];
      
      // Sort by bookingDate descending
      data.sort((a: any, b: any) => new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime());

      const mappedBookings = data.map((b: any): Booking => {
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
          assetId: b.assetId,
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
          farmerId: b.farmerId,
          addressText: b.addressText || 'N/A',
          notesText: parsedNotes.notes || '',
          includeOperator: !!parsedNotes.includeOperator,
          scheduledStartTime: b.scheduledStartTime,
          scheduledEndTime: b.scheduledEndTime,
          cancellationReason: b.cancellationReason
        };
      });

      setBookings(mappedBookings);

      // Fetch customer profiles for customer info
      const uniqueFarmerIds = Array.from(new Set(mappedBookings.map(b => b.farmerId).filter(Boolean))) as string[];
      const profilesMap: Record<string, any> = {};
      
      await Promise.all(
        uniqueFarmerIds.map(async (farmerId) => {
          try {
            const res = await apiService.getUser(farmerId);
            if (res && res.data) {
              profilesMap[farmerId] = res.data;
            }
          } catch (err) {
            console.error(`Failed to fetch profile for user ${farmerId}:`, err);
          }
        })
      );
      setUserProfiles(profilesMap);
    } catch (error) {
      console.error('Error fetching received requests:', error);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated && !localStorage.getItem('agrifarm_user')) {
      navigate('/login');
      return;
    }
    
    // Redirect if user is not OWNER or PROVIDER
    const storedUser = user || JSON.parse(localStorage.getItem('agrifarm_user') || '{}');
    if (storedUser && !['OWNER', 'PROVIDER'].includes(storedUser.role || '')) {
      navigate('/');
      return;
    }
    
    fetchRequests();
  }, [user, isAuthenticated, navigate]);

  const handleStatusUpdate = async (bookingId: string, status: string, cancelledBy?: string, reason?: string) => {
    try {
      await apiService.updateBookingStatus(bookingId, status, cancelledBy, reason);
      setBookings(prev => prev.map(b => b.id === bookingId ? { 
        ...b, 
        status: status as any,
        cancellationReason: reason
      } : b));
      alert(`Booking status updated to ${status}`);
    } catch (err) {
      console.error("Failed to update booking status:", err);
      alert("Failed to update status. Please try again.");
    }
  };

  const openCancelModal = (bookingId: string, type: 'REJECT' | 'CANCEL') => {
    setSelectedBookingId(bookingId);
    setActionType(type);
    setCancelReason('');
    setShowCancelModal(true);
  };

  const submitCancellation = async () => {
    if (!selectedBookingId) return;
    if (!cancelReason.trim()) {
      alert("Please provide a reason.");
      return;
    }

    const status = actionType === 'REJECT' ? 'REJECTED' : 'REJECTED';
    await handleStatusUpdate(selectedBookingId, status, 'PROVIDER', cancelReason);
    setShowCancelModal(false);
    setSelectedBookingId(null);
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'PENDING': return { bg: '#fff7ed', fg: '#ea580c', icon: Clock3, label: 'Pending Approval' };
      case 'CONFIRMED': return { bg: '#f0fdf4', fg: '#16a34a', icon: CheckCircle2, label: 'Confirmed / Active' };
      case 'REJECTED': return { bg: '#fef2f2', fg: '#dc2626', icon: XCircle, label: 'Rejected / Cancelled' };
      case 'COMPLETED': return { bg: '#f8fafc', fg: '#64748b', icon: CheckCircle2, label: 'Completed' };
      default: return { bg: '#f1f5f9', fg: '#475569', icon: AlertCircle, label: status };
    }
  };

  // Stats computation
  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'PENDING').length,
    confirmed: bookings.filter(b => b.status === 'CONFIRMED').length,
    completed: bookings.filter(b => b.status === 'COMPLETED').length,
    earnings: bookings
      .filter(b => b.status === 'COMPLETED')
      .reduce((sum, b) => sum + (b.totalPrice || 0), 0)
  };

  // Filtering Logic
  const filteredBookings = bookings.filter(booking => {
    const customer = userProfiles[booking.farmerId] || {};
    const customerName = (customer.fullName || '').toLowerCase();
    const customerPhone = (customer.phoneNumber || '').toLowerCase();
    const customerVillage = (customer.village || '').toLowerCase();
    const customerDistrict = (customer.district || '').toLowerCase();
    const assetName = booking.assetName.toLowerCase();
    
    const matchesSearch = 
      customerName.includes(searchTerm.toLowerCase()) || 
      customerPhone.includes(searchTerm.toLowerCase()) || 
      customerVillage.includes(searchTerm.toLowerCase()) || 
      customerDistrict.includes(searchTerm.toLowerCase()) || 
      assetName.includes(searchTerm.toLowerCase());
      
    const matchesStatus = statusFilter === 'ALL' || booking.status === statusFilter;
    const matchesCategory = categoryFilter === 'ALL' || (booking.category || '').toUpperCase() === categoryFilter.toUpperCase();
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <div className="service-requests-page container fade-in">
      <div className="page-header">
        <div>
          <h1 className="text-3xl font-bold">Service Requests</h1>
          <p className="text-slate-500">Manage, confirm, and track incoming booking requests from farmers</p>
        </div>
        <button className="refresh-btn" onClick={fetchRequests} title="Refresh requests">
          <RefreshCcw size={20} />
        </button>
      </div>

      {/* Stats Dashboard */}
      <div className="stats-dashboard">
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#e0f2fe', color: '#0369a1' }}>
            <ClipboardList size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Requests</span>
            <span className="stat-val">{stats.total}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#fff7ed', color: '#ea580c' }}>
            <Clock3 size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Pending Approval</span>
            <span className="stat-val alert-glow">{stats.pending}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#f0fdf4', color: '#16a34a' }}>
            <CheckCircle2 size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Completed Jobs</span>
            <span className="stat-val">{stats.completed}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#f5f3ff', color: '#6d28d9' }}>
            <IndianRupee size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Earnings</span>
            <span className="stat-val">₹{stats.earnings}</span>
          </div>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="filter-toolbar card">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search by farmer name, location, phone, or asset..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filters-group">
          <div className="filter-item">
            <label>Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending Approval</option>
              <option value="CONFIRMED">Confirmed / Active</option>
              <option value="COMPLETED">Completed</option>
              <option value="REJECTED">Rejected / Cancelled</option>
            </select>
          </div>
          
          <div className="filter-item">
            <label>Asset Type</label>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="ALL">All Types</option>
              <option value="EQUIPMENT">Equipment</option>
              <option value="VEHICLE">Vehicles</option>
              <option value="SERVICE">Services</option>
              <option value="WORKER_GROUP">Worker Groups</option>
            </select>
          </div>
        </div>
      </div>

      {/* Requests Listing */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
          <Loader2 className="animate-spin" size={48} color="var(--primary)" />
        </div>
      ) : (
        <div className="requests-list">
          <AnimatePresence mode="popLayout">
            {filteredBookings.length > 0 ? (
              filteredBookings.map((booking) => {
                const style = getStatusStyle(booking.status);
                const customer = userProfiles[booking.farmerId] || {};
                const customerName = customer.fullName || 'Farmer User';
                const customerPhone = customer.phoneNumber || '';
                const customerLocation = customer.village && customer.district 
                  ? `${customer.village}, ${customer.district}` 
                  : booking.addressText || 'Location Not Specified';
                  
                const waText = `Hello ${customerName}, I am contacting you regarding your booking request for ${booking.assetName} on ${booking.bookingDate}.`;
                const waLink = `https://wa.me/${customerPhone.replace(/\D/g, '').length === 10 ? `91${customerPhone.replace(/\D/g, '')}` : customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(waText)}`;

                return (
                  <motion.div
                    key={booking.id}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="request-card card"
                  >
                    <div className="card-top-indicator" style={{ backgroundColor: style.fg }} />
                    
                    {/* Header Row */}
                    <div className="request-card-header">
                      <div className="asset-meta">
                        <div className="category-tag">{booking.category || 'Rental'}</div>
                        <h3 className="asset-title">{booking.assetName}</h3>
                      </div>
                      
                      <div className="status-badge" style={{ backgroundColor: style.bg, color: style.fg }}>
                        <style.icon size={14} />
                        <span>{style.label}</span>
                      </div>
                    </div>

                    {/* Middle Section: Customer & Booking Grid */}
                    <div className="request-card-body">
                      {/* Farmer Customer Column */}
                      <div className="body-col customer-details">
                        <h4 className="section-title">Customer Information</h4>
                        <div className="detail-row">
                          <User size={16} />
                          <span className="bold-text">{customerName}</span>
                        </div>
                        {customerPhone && (
                          <div className="detail-row">
                            <Phone size={16} />
                            <span>{customerPhone}</span>
                          </div>
                        )}
                        <div className="detail-row">
                          <MapPin size={16} />
                          <span>{customerLocation}</span>
                        </div>
                      </div>

                      {/* Schedule / Logistics Column */}
                      <div className="body-col schedule-details">
                        <h4 className="section-title">Booking Schedule</h4>
                        <div className="detail-row">
                          <Calendar size={16} />
                          <span>{booking.bookingDate}</span>
                        </div>
                        <div className="detail-row">
                          <Clock size={16} />
                          <span>{booking.startTime}:00 ({booking.duration} Hours)</span>
                        </div>
                        <div className="detail-row">
                          <IndianRupee size={16} />
                          <span className="bold-text price-text">Total Price: ₹{booking.totalPrice}</span>
                        </div>
                      </div>
                    </div>

                    {/* Remarks/Notes Section if present */}
                    {(booking.notesText || booking.includeOperator || booking.cancellationReason) && (
                      <div className="request-card-notes">
                        {booking.includeOperator && (
                          <div className="notes-tag">Operator Included</div>
                        )}
                        {booking.notesText && (
                          <p className="notes-paragraph"><strong>Notes: </strong>"{booking.notesText}"</p>
                        )}
                        {booking.cancellationReason && (
                          <div className="cancellation-alert">
                            <ShieldAlert size={16} />
                            <span><strong>Reason for Cancellation: </strong>"{booking.cancellationReason}"</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Footer Actions */}
                    <div className="request-card-actions">
                      <div className="left-actions">
                        {customerPhone && (
                          <a 
                            href={waLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="btn-whatsapp"
                          >
                            <MessageCircle size={16} />
                            <span>WhatsApp Customer</span>
                          </a>
                        )}
                      </div>
                      
                      <div className="right-actions">
                        {booking.status === 'PENDING' && (
                          <>
                            <button 
                              className="btn-action-decline"
                              onClick={() => openCancelModal(booking.id, 'REJECT')}
                            >
                              <X size={16} />
                              <span>Decline</span>
                            </button>
                            <button 
                              className="btn-action-confirm"
                              onClick={() => handleStatusUpdate(booking.id, 'CONFIRMED')}
                            >
                              <Check size={16} />
                              <span>Confirm Booking</span>
                            </button>
                          </>
                        )}
                        {booking.status === 'CONFIRMED' && (
                          <>
                            <button 
                              className="btn-action-decline"
                              onClick={() => openCancelModal(booking.id, 'CANCEL')}
                            >
                              <X size={16} />
                              <span>Cancel</span>
                            </button>
                            <button 
                              className="btn-action-confirm"
                              onClick={() => handleStatusUpdate(booking.id, 'COMPLETED')}
                            >
                              <Check size={16} />
                              <span>Mark Completed</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="empty-requests card"
              >
                <History size={48} className="empty-icon" />
                <h3>No requests found</h3>
                <p>Try modifying your search or filtering queries to find what you need.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Cancellation Reason Modal */}
      {showCancelModal && (
        <div className="modal-overlay">
          <div className="modal-box card">
            <div className="modal-header">
              <h3 className="text-xl font-bold">
                {actionType === 'REJECT' ? 'Decline Request' : 'Cancel Booking'}
              </h3>
              <button className="close-modal-btn" onClick={() => setShowCancelModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p className="text-slate-500 mb-4">
                Please specify the reason for {actionType === 'REJECT' ? 'declining' : 'cancelling'} this service request. This will be shared with the farmer.
              </p>
              <textarea 
                rows={4}
                placeholder="E.g., Equipment undergoing maintenance, operator unavailable on this date, etc."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="modal-textarea"
                required
              />
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowCancelModal(false)}>
                Go Back
              </button>
              <button 
                className="btn-action-decline" 
                style={{ padding: '10px 24px', borderRadius: '12px' }}
                onClick={submitCancellation}
              >
                Confirm Submit
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .service-requests-page {
          padding-top: 24px;
          max-width: 900px !important;
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
          cursor: pointer;
        }

        .refresh-btn:hover {
          background: var(--bg-main);
          color: var(--primary);
        }

        /* Stats Cards Dashboard */
        .stats-dashboard {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .stat-card {
          background: white;
          padding: 16px;
          border-radius: 20px;
          box-shadow: var(--shadow-sm);
          display: flex;
          align-items: center;
          gap: 16px;
          border: 1px solid #f1f5f9;
        }

        .stat-icon-wrapper {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .stat-info {
          display: flex;
          flex-direction: column;
        }

        .stat-label {
          font-size: 0.8rem;
          color: var(--text-muted);
          font-weight: 600;
        }

        .stat-val {
          font-size: 1.35rem;
          font-weight: 800;
          color: var(--text-main);
        }

        .alert-glow {
          color: #ea580c;
          text-shadow: 0 0 10px rgba(234, 88, 12, 0.15);
        }

        /* Filter Toolbar */
        .filter-toolbar {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          padding: 16px 20px !important;
          margin-bottom: 24px;
        }

        .search-box {
          position: relative;
          flex: 1;
          min-width: 280px;
        }

        .search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
        }

        .search-box input {
          width: 100%;
          padding: 12px 16px 12px 42px;
          border-radius: 14px;
          background: #f8fafc;
          border: 1px solid transparent;
          font-weight: 600;
          font-size: 0.9rem;
          outline: none;
          transition: all 0.2s;
        }

        .search-box input:focus {
          background: white;
          border-color: var(--primary);
          box-shadow: 0 0 10px rgba(0, 170, 85, 0.08);
        }

        .filters-group {
          display: flex;
          gap: 16px;
          align-items: center;
        }

        .filter-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .filter-item label {
          font-size: 0.72rem;
          color: var(--text-muted);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .filter-item select {
          padding: 10px 14px;
          border-radius: 12px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          font-weight: 700;
          font-size: 0.85rem;
          color: var(--text-main);
          outline: none;
          cursor: pointer;
          min-width: 150px;
        }

        /* Requests Lists */
        .requests-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 40px;
        }

        .request-card {
          position: relative;
          overflow: hidden;
          padding: 0 !important;
        }

        .card-top-indicator {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 5px;
        }

        .request-card-header {
          padding: 20px 24px 16px 24px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 1px solid #f8fafc;
        }

        .category-tag {
          display: inline-block;
          font-size: 0.65rem;
          font-weight: 800;
          text-transform: uppercase;
          color: var(--primary);
          margin-bottom: 4px;
          letter-spacing: 0.5px;
        }

        .asset-title {
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--text-main);
          margin: 0;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 10px;
          font-size: 0.75rem;
          font-weight: 800;
        }

        .request-card-body {
          padding: 20px 24px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        @media (max-width: 600px) {
          .request-card-body {
            grid-template-columns: 1fr;
            gap: 16px;
          }
        }

        .body-col {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .section-title {
          font-size: 0.8rem;
          color: var(--text-muted);
          font-weight: 800;
          text-transform: uppercase;
          margin: 0 0 4px 0;
          letter-spacing: 0.5px;
        }

        .detail-row {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #475569;
          font-size: 0.875rem;
          font-weight: 550;
        }

        .detail-row svg {
          color: var(--primary);
          flex-shrink: 0;
        }

        .bold-text {
          font-weight: 800;
          color: var(--text-main);
        }

        .bold-text.price-text {
          color: var(--primary) !important;
          font-size: 1rem;
        }

        /* Remarks/Notes Section */
        .request-card-notes {
          margin: 0 24px;
          padding: 14px 18px;
          background: #f8fafc;
          border-radius: 14px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          border-left: 3px solid var(--primary);
        }

        .notes-tag {
          display: inline-block;
          align-self: flex-start;
          font-size: 0.65rem;
          font-weight: 800;
          background: #e0f2fe;
          color: #0369a1;
          padding: 2px 8px;
          border-radius: 6px;
        }

        .notes-paragraph {
          font-size: 0.82rem;
          color: #475569;
          margin: 0;
          line-height: 1.4;
        }

        .cancellation-alert {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #dc2626;
          font-size: 0.82rem;
        }

        .cancellation-alert svg {
          flex-shrink: 0;
        }

        /* Footer Actions */
        .request-card-actions {
          padding: 16px 24px 20px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        @media (max-width: 480px) {
          .request-card-actions {
            flex-direction: column;
            align-items: stretch;
          }
          .right-actions {
            justify-content: stretch;
          }
          .right-actions button {
            flex: 1;
          }
        }

        .btn-whatsapp {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #25D366;
          color: white;
          padding: 10px 18px;
          border-radius: 12px;
          font-size: 0.82rem;
          font-weight: 800;
          text-decoration: none;
          box-shadow: 0 4px 12px rgba(37, 211, 102, 0.2);
          transition: all 0.2s;
        }

        .btn-whatsapp:hover {
          background: #20ba56;
          transform: translateY(-1px);
        }

        .right-actions {
          display: flex;
          gap: 12px;
        }

        .btn-action-decline {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
          padding: 10px 18px;
          border-radius: 12px;
          font-size: 0.82rem;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-action-decline:hover {
          background: #fde2e2;
        }

        .btn-action-confirm {
          display: flex;
          align-items: center;
          gap: 6px;
          background: var(--primary);
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 12px;
          font-size: 0.82rem;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 12px rgba(0, 170, 85, 0.15);
        }

        .btn-action-confirm:hover {
          background: #00964b;
          transform: translateY(-1px);
        }

        /* Empty Requests */
        .empty-requests {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 24px;
          text-align: center;
          color: var(--text-muted);
        }

        .empty-icon {
          margin-bottom: 16px;
          opacity: 0.3;
        }

        .empty-requests h3 {
          font-weight: 800;
          color: var(--text-main);
          margin-bottom: 6px;
        }

        /* Skeletons */
        .skeleton-request-card {
          height: 250px;
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

        /* Modals */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.4);
          backdrop-filter: blur(6px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100000;
          padding: 20px;
        }

        .modal-box {
          width: 100%;
          max-width: 500px;
          padding: 28px !important;
          position: relative;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .close-modal-btn {
          background: #f1f5f9;
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: var(--text-muted);
          transition: all 0.2s;
        }

        .close-modal-btn:hover {
          background: #e2e8f0;
          color: var(--text-main);
        }

        .modal-textarea {
          width: 100%;
          padding: 12px;
          border-radius: 12px;
          border: 1px solid #cbd5e1;
          font-family: inherit;
          font-size: 0.9rem;
          font-weight: 550;
          outline: none;
          resize: none;
          transition: border-color 0.2s;
        }

        .modal-textarea:focus {
          border-color: var(--primary);
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 24px;
        }
      `}</style>
    </div>
  );
};

export default ServiceRequests;
