import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Calendar, MapPin, 
  CheckCircle, Plus, Minus, Navigation 
} from 'lucide-react';
import { apiService } from '../services/apiService';
import { useAuth } from '../services/AuthContext';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: {
    id: string;
    name: string;
    category: string;
    price: number;
    providerId: string;
    providerName: string;
    imageUrl?: string;
    type: string;
    operatorPrice?: number;
  };
}

const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, asset }) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [duration, setDuration] = useState(1);
  const [includeOperator, setIncludeOperator] = useState(false);
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [existingBookings, setExistingBookings] = useState<any[]>([]);

  const startHour = 6;
  const endHour = 20;
  const operatorRate = asset.operatorPrice || 200;

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setStep(1);
      setSuccess(false);
      setAddress(user?.village ? `${user.village}, ${user.district}` : '');
      // Fetch existing bookings for this asset to block slots
      const fetchBookings = async () => {
        try {
          const res = await apiService.getProviderBookings(asset.providerId);
          // Filter for this specific asset
          setExistingBookings(res.data.filter((b: any) => b.assetId === asset.id));
        } catch (e) {
          console.error('Error fetching existing bookings', e);
        }
      };
      fetchBookings();
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, asset.id, user, asset.providerId]);

  const isSlotBlocked = (hour: number) => {
    if (!selectedDate) return false;
    const slotTime = new Date(`${selectedDate}T${hour.toString().padStart(2, '0')}:00:00`);
    if (slotTime < new Date()) return true;

    return existingBookings.some((b: any) => {
      const start = new Date(b.scheduledStartTime);
      const end = new Date(b.scheduledEndTime);
      return slotTime >= start && slotTime < end && b.status !== 'CANCELLED';
    });
  };

  const calculateTotal = () => {
    const base = asset.price * duration;
    const operator = includeOperator ? (operatorRate * duration) : 0;
    return base + operator;
  };

  const handleBooking = async () => {
    setLoading(true);
    try {
      const id = user?.id || JSON.parse(localStorage.getItem('agrifarm_user') || '{}').id;
      const startTime = new Date(`${selectedDate}T${selectedHour?.toString().padStart(2, '0')}:00:00`);
      const endTime = new Date(startTime.getTime() + duration * 60 * 60 * 1000);

      const payload = {
        farmerId: id,
        providerId: asset.providerId,
        assetId: asset.id,
        assetType: asset.type,
        bookingDate: new Date().toISOString(),
        scheduledStartTime: startTime.toISOString(),
        scheduledEndTime: endTime.toISOString(),
        status: 'PENDING',
        totalAmount: calculateTotal(),
        addressText: address,
        notes: JSON.stringify({
          notes,
          includeOperator,
          duration: `${duration} hours`,
          providerName: asset.providerName
        })
      };

      await apiService.createBooking(payload);
      setSuccess(true);
    } catch (error) {
      alert('Failed to create booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="booking-modal-overlay" onClick={onClose}>
        <motion.div 
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          className="booking-modal"
          onClick={e => e.stopPropagation()}
        >
          <div className="modal-header">
            <div className="header-info">
              <h3>{success ? 'Booking Confirmed' : `Rent ${asset.name}`}</h3>
              <p>{asset.providerName}</p>
            </div>
            <button className="close-btn" onClick={onClose}><X size={20} /></button>
          </div>

          <div className="modal-body">
            {success ? (
              <div className="success-content">
                <div className="success-anim">
                  <CheckCircle size={80} color="var(--primary)" />
                </div>
                <h2>Your request is sent!</h2>
                <p>The provider will review your booking and update the status shortly.</p>
                <div className="booking-summary">
                  <div className="summary-row"><span>Date</span><span>{selectedDate}</span></div>
                  <div className="summary-row"><span>Time</span><span>{selectedHour}:00 for {duration}h</span></div>
                  <div className="summary-row"><span>Total</span><span className="price">₹{calculateTotal()}</span></div>
                </div>
                <button className="btn-primary w-full" onClick={onClose}>Got it</button>
              </div>
            ) : (
              <>
                {step === 1 && (
                  <div className="step-content">
                    <div className="section-title"><Calendar size={16} /> Select Date & Time</div>
                    <input 
                      type="date" 
                      className="date-picker" 
                      min={new Date().toISOString().split('T')[0]}
                      value={selectedDate}
                      onChange={e => setSelectedDate(e.target.value)}
                    />

                    {selectedDate && (
                      <div className="time-grid">
                        {Array.from({ length: endHour - startHour }, (_, i) => startHour + i).map(hour => {
                          const isActive = selectedHour !== null && hour >= selectedHour && hour < selectedHour + duration;
                          return (
                            <button
                              key={hour}
                              disabled={isSlotBlocked(hour)}
                              className={`time-slot ${isActive ? 'active' : ''} ${isSlotBlocked(hour) ? 'blocked' : ''}`}
                              onClick={() => {
                                setSelectedHour(hour);
                                setDuration(1); // Reset duration when starting a new selection
                              }}
                            >
                              {hour === 12 ? '12 PM' : (hour > 12 ? `${hour - 12} PM` : `${hour} AM`)}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {selectedHour !== null && (
                      <div className="duration-picker">
                        <p>How many hours?</p>
                        <div className="duration-controls">
                          <button onClick={() => setDuration(d => Math.max(1, d - 1))}><Minus size={18} /></button>
                          <span>{duration}h</span>
                          <button onClick={() => {
                            // Check if next slot is available before increasing
                            if (!isSlotBlocked(selectedHour + duration) && (selectedHour + duration) < endHour) {
                              setDuration(d => d + 1);
                            } else {
                              alert('Next slot is not available');
                            }
                          }}><Plus size={18} /></button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {step === 2 && (
                  <div className="step-content">
                    <div className="section-title"><MapPin size={16} /> Delivery Details</div>
                    <div className="input-group">
                      <label>Usage Address</label>
                      <div className="address-input">
                        <textarea 
                          value={address} 
                          onChange={e => setAddress(e.target.value)}
                          placeholder="Where should the equipment be delivered?"
                        />
                        <button className="location-btn"><Navigation size={16} /></button>
                      </div>
                    </div>

                      <div className="option-row">
                        <div className="option-info">
                          <p className="title">Include Operator</p>
                          <p className="subtitle">+ ₹{operatorRate}/hr extra</p>
                        </div>
                      <label className="switch">
                        <input type="checkbox" checked={includeOperator} onChange={e => setIncludeOperator(e.target.checked)} />
                        <span className="slider round"></span>
                      </label>
                    </div>

                    <div className="input-group">
                      <label>Additional Notes (Optional)</label>
                      <textarea 
                        value={notes} 
                        onChange={e => setNotes(e.target.value)}
                        placeholder="Any special instructions..."
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {!success && (
            <div className="modal-footer">
              <div className="total-preview">
                <p>Estimated Total</p>
                <h4>₹{calculateTotal()}</h4>
              </div>
              {step === 1 ? (
                <button 
                  className="btn-primary" 
                  disabled={!selectedDate || selectedHour === null}
                  onClick={() => setStep(2)}
                >
                  Next Step
                </button>
              ) : (
                <div className="footer-actions">
                  <button className="btn-ghost" onClick={() => setStep(1)}>Back</button>
                  <button className="btn-primary" disabled={!address || loading} onClick={handleBooking}>
                    {loading ? 'Processing...' : 'Confirm Booking'}
                  </button>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>

      <style>{`
        .booking-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 20px;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
        }
        .booking-modal {
          background: white;
          width: 100%;
          max-width: 500px;
          border-radius: 32px;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }
        .modal-header {
          padding: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--border);
        }
        .header-info h3 { font-weight: 800; color: #1b5e20; }
        .header-info p { font-size: 0.85rem; color: var(--text-muted); font-weight: 600; }
        .close-btn { width: 36px; height: 36px; border-radius: 12px; background: #f8fafc; display: flex; align-items: center; justify-content: center; }

        .modal-body { padding: 24px; max-height: 70vh; overflow-y: auto; }
        .section-title { display: flex; align-items: center; gap: 8px; font-weight: 800; font-size: 0.9rem; color: #1b5e20; margin-bottom: 20px; }
        
        .date-picker { width: 100%; padding: 14px; border-radius: 16px; border: 2px solid #f1f5f9; background: #f8fafc; font-weight: 700; margin-bottom: 24px; }
        .time-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 24px; }
        .time-slot { padding: 10px; border-radius: 12px; border: 1.5px solid #e8f5e9; font-size: 0.75rem; font-weight: 700; background: white; transition: all 0.2s; }
        .time-slot.active { background: var(--primary); color: white; border-color: var(--primary); }
        .time-slot.blocked { background: #f1f5f9; color: #cbd5e1; text-decoration: line-through; cursor: not-allowed; }

        .duration-picker { display: flex; justify-content: space-between; align-items: center; padding: 16px; background: #f8fafc; border-radius: 16px; }
        .duration-picker p { font-weight: 700; font-size: 0.9rem; }
        .duration-controls { display: flex; align-items: center; gap: 16px; }
        .duration-controls span { font-weight: 900; color: #1b5e20; min-width: 30px; text-align: center; }
        .duration-controls button { width: 32px; height: 32px; border-radius: 8px; background: white; display: flex; align-items: center; justify-content: center; box-shadow: var(--shadow-sm); }

        .option-row { display: flex; justify-content: space-between; align-items: center; padding: 20px 0; border-top: 1px dashed var(--border); border-bottom: 1px dashed var(--border); margin: 24px 0; }
        .option-info .title { font-weight: 800; color: #1b5e20; font-size: 0.95rem; }
        .option-info .subtitle { font-size: 0.75rem; color: var(--text-muted); font-weight: 600; }

        .address-input { position: relative; }
        .location-btn { position: absolute; right: 12px; top: 12px; color: var(--primary); }
        textarea { width: 100%; padding: 12px; border-radius: 16px; border: 2px solid #f1f5f9; background: #f8fafc; min-height: 80px; font-weight: 600; }

        .modal-footer { padding: 24px; border-top: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
        .total-preview h4 { font-size: 1.5rem; font-weight: 900; color: #1b5e20; }
        .total-preview p { font-size: 0.75rem; color: var(--text-muted); font-weight: 600; }
        .footer-actions { display: flex; gap: 12px; }

        .success-content { text-align: center; padding: 20px 0; }
        .success-anim { margin-bottom: 24px; }
        .success-content h2 { font-weight: 800; color: #1b5e20; margin-bottom: 8px; }
        .success-content p { color: var(--text-muted); font-size: 0.9rem; margin-bottom: 32px; }
        .booking-summary { background: #f8fafc; padding: 20px; border-radius: 20px; margin-bottom: 32px; }
        .summary-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.9rem; font-weight: 600; }
        .summary-row .price { color: #1b5e20; font-weight: 800; }

        /* Switch Styling */
        .switch { position: relative; display: inline-block; width: 44px; height: 24px; }
        .switch input { opacity: 0; width: 0; height: 0; }
        .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #cbd5e1; transition: .4s; }
        .slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .4s; }
        input:checked + .slider { background-color: var(--primary); }
        input:checked + .slider:before { transform: translateX(20px); }
        .slider.round { border-radius: 34px; }
        .slider.round:before { border-radius: 50%; }
      `}</style>
    </AnimatePresence>
  );
};

export default BookingModal;
