import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Calendar, MapPin, CheckCircle, Plus, Minus, 
  ChevronRight, Info, ShieldAlert, Award, FileText, Check,
  Home, Building, Hash, UserCheck, Edit3, AlertTriangle
} from 'lucide-react';
import { apiService } from '../services/apiService';
import { useAuth } from '../services/AuthContext';

interface Asset {
  id: string;
  name: string;
  category: string;
  price: number;
  providerId: string;
  providerName: string;
  imageUrl?: string;
  type: string;
  operatorPrice?: number;
  operatorAvailable?: boolean;
}

const BookAsset: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Extract asset from navigation state
  const asset: Asset | null = location.state?.asset || null;

  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [duration, setDuration] = useState(1);
  const [includeOperator, setIncludeOperator] = useState(false);
  const [address, setAddress] = useState('');
  const [addressMode, setAddressMode] = useState<'profile' | 'manual'>('profile');
  const [houseNo, setHouseNo] = useState('');
  const [street, setStreet] = useState('');
  const [village, setVillage] = useState('');
  const [district, setDistrict] = useState('');
  const [stateName, setStateName] = useState('');
  const [pincode, setPincode] = useState('');
  const [profileAddress, setProfileAddress] = useState<{
    houseNo: string;
    street: string;
    village: string;
    district: string;
    state: string;
    pincode: string;
  } | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [existingBookings, setExistingBookings] = useState<any[]>([]);

  const startHour = 6;
  const endHour = 20;
  const operatorRate = asset?.operatorPrice !== undefined && asset?.operatorPrice !== null ? asset.operatorPrice : 200;

  useEffect(() => {
    // If no asset is in state, redirect to rentals as a fallback
    if (!asset) {
      navigate('/rentals');
      return;
    }

    const fetchUserProfileAndBookings = async () => {
      try {
        if (user?.id) {
          const profileRes = await apiService.getUser(user.id);
          if (profileRes && profileRes.data) {
            const data = profileRes.data;
            const profileAddr = {
              houseNo: data.houseNo || '',
              street: data.street || '',
              village: data.village || '',
              district: data.district || '',
              state: data.state || '',
              pincode: data.pincode || ''
            };
            setProfileAddress(profileAddr);
            
            // By default, if the profile address has fields, fill the inputs
            if (profileAddr.village || profileAddr.district) {
              setHouseNo(profileAddr.houseNo);
              setStreet(profileAddr.street);
              setVillage(profileAddr.village);
              setDistrict(profileAddr.district);
              setStateName(profileAddr.state);
              setPincode(profileAddr.pincode);
              setAddressMode('profile');
              
              const parts = [profileAddr.houseNo, profileAddr.street, profileAddr.village, profileAddr.district, profileAddr.state, profileAddr.pincode].map(p => p.trim()).filter(Boolean);
              setAddress(parts.join(', '));
            } else {
              setAddressMode('manual');
            }
          }
        }
      } catch (err) {
        console.error("Error fetching user profile details", err);
      }

      try {
        const res = await apiService.getProviderBookings(asset.providerId);
        setExistingBookings(res.data.filter((b: any) => b.assetId === asset.id));
      } catch (e) {
        console.error('Error fetching existing bookings', e);
      }
    };
    fetchUserProfileAndBookings();
  }, [asset, user, navigate]);

  if (!asset) return null;

  const getConcatenatedAddress = () => {
    const parts = [houseNo, street, village, district, stateName, pincode].map(p => p.trim()).filter(Boolean);
    return parts.join(', ');
  };

  const handleAddressModeChange = (mode: 'profile' | 'manual') => {
    setAddressMode(mode);
    if (mode === 'profile' && profileAddress) {
      setHouseNo(profileAddress.houseNo);
      setStreet(profileAddress.street);
      setVillage(profileAddress.village);
      setDistrict(profileAddress.district);
      setStateName(profileAddress.state);
      setPincode(profileAddress.pincode);
    } else if (mode === 'manual') {
      setHouseNo('');
      setStreet('');
      setVillage('');
      setDistrict('');
      setStateName('');
      setPincode('');
    }
  };

  const isAddressValid = 
    houseNo.trim() !== '' && 
    street.trim() !== '' && 
    village.trim() !== '' && 
    district.trim() !== '' && 
    stateName.trim() !== '' && 
    pincode.trim().length === 6;

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

  const calculateBaseTotal = () => asset.price * duration;
  const calculateOperatorTotal = () => includeOperator ? (operatorRate * duration) : 0;
  const calculateTaxTotal = () => Math.round((calculateBaseTotal() + calculateOperatorTotal()) * 0.02); // 2% service charge
  const calculateGrandTotal = () => calculateBaseTotal() + calculateOperatorTotal() + calculateTaxTotal();

  const handleBookingSubmit = async () => {
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
        totalAmount: calculateGrandTotal(),
        addressText: address,
        notes: JSON.stringify({
          notes,
          assetName: asset.name,
          includeOperator,
          duration: `${duration} hours`,
          providerName: asset.providerName
        })
      };

      await apiService.createBooking(payload);
      setSuccess(true);
    } catch (error) {
      alert('Failed to submit booking request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderActiveStep = () => {
    switch (step) {
      case 1:
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="wizard-step"
          >
            <h3 className="step-heading">
              <Calendar className="step-icon" size={22} />
              <span>Select Date & Starting Hour</span>
            </h3>
            <p className="step-description">Choose a convenient date and starting slot for your rental.</p>
            
            <div className="form-group">
              <label className="input-label">Date of Rental</label>
              <input 
                type="date" 
                className="date-picker-input" 
                min={new Date().toISOString().split('T')[0]}
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
              />
            </div>

            {selectedDate && (
              <div className="time-slots-container">
                <label className="input-label">Available Slots</label>
                <div className="slots-grid">
                  {Array.from({ length: endHour - startHour }, (_, i) => startHour + i).map(hour => {
                    const isActive = selectedHour !== null && hour >= selectedHour && hour < selectedHour + duration;
                    const isBlocked = isSlotBlocked(hour);
                    return (
                      <button
                        key={hour}
                        disabled={isBlocked}
                        className={`slot-pill ${isActive ? 'active' : ''} ${isBlocked ? 'blocked' : ''}`}
                        onClick={() => {
                          setSelectedHour(hour);
                          setDuration(1); // Reset to 1 hour upon selection
                        }}
                      >
                        {hour === 12 ? '12 PM' : (hour > 12 ? `${hour - 12} PM` : `${hour} AM`)}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {selectedHour !== null && (
              <div className="duration-picker-box">
                <div className="duration-header">
                  <div className="duration-text">
                    <h4>Rental Duration</h4>
                    <p>Select the number of hours you need the asset.</p>
                  </div>
                  <div className="duration-control-buttons">
                    <button 
                      className="ctrl-btn" 
                      onClick={() => setDuration(d => Math.max(1, d - 1))}
                    >
                      <Minus size={16} />
                    </button>
                    <span className="duration-display-value">{duration}h</span>
                    <button 
                      className="ctrl-btn" 
                      onClick={() => {
                        if (!isSlotBlocked(selectedHour + duration) && (selectedHour + duration) < endHour) {
                          setDuration(d => d + 1);
                        } else {
                          alert('Next hourly slot is not available or is outside operating hours.');
                        }
                      }}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="wizard-actions">
              <button 
                className="btn-primary-wizard w-full"
                disabled={!selectedDate || selectedHour === null}
                onClick={() => setStep(2)}
              >
                <span>Continue to Delivery</span>
                <ChevronRight size={18} />
              </button>
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="wizard-step"
          >
            <h3 className="step-heading">
              <MapPin className="step-icon" size={22} />
              <span>Delivery & Operator Options</span>
            </h3>
            <p className="step-description">Select address source and provide complete delivery details.</p>

            {/* Address option selector */}
            <div className="form-group">
              <label className="input-label">Delivery Address Method</label>
              <div className="address-mode-selector">
                <button 
                  type="button"
                  className={`address-mode-card ${addressMode === 'profile' ? 'active' : ''}`}
                  onClick={() => handleAddressModeChange('profile')}
                >
                  <div className="mode-card-header">
                    <UserCheck size={18} className="mode-icon" />
                    <span className="mode-title">Use Profile Address</span>
                  </div>
                  <p className="mode-desc">Auto-fill using the address saved in your profile</p>
                </button>
                
                <button 
                  type="button"
                  className={`address-mode-card ${addressMode === 'manual' ? 'active' : ''}`}
                  onClick={() => handleAddressModeChange('manual')}
                >
                  <div className="mode-card-header">
                    <Edit3 size={18} className="mode-icon" />
                    <span className="mode-title">Enter Custom Address</span>
                  </div>
                  <p className="mode-desc">Manually write a different address for this booking</p>
                </button>
              </div>
            </div>

            {/* Address warning banner if empty profile address */}
            {addressMode === 'profile' && (!profileAddress || !profileAddress.village || !profileAddress.district) && (
              <div className="address-warning-banner">
                <AlertTriangle size={18} className="warning-icon" />
                <div className="warning-content">
                  <h5>No Saved Address Found</h5>
                  <p>Your profile does not have a saved address yet. Please enter the details below; it will be filled automatically in the future!</p>
                </div>
              </div>
            )}

            {/* Structured address writing form */}
            <div className="address-form-box">
              <h4 className="form-section-title">Delivery Details</h4>
              <div className="address-form-grid">
                <div className="form-group col-span-2">
                  <label className="input-label">House No / Flat / Landmark *</label>
                  <div className="input-wrapper">
                    <Home className="input-icon" size={16} />
                    <input 
                      type="text" 
                      value={houseNo} 
                      onChange={e => setHouseNo(e.target.value)} 
                      placeholder="e.g. Flat 102, Near Hanuman Temple" 
                      className="form-input-field"
                    />
                  </div>
                </div>
                
                <div className="form-group col-span-2">
                  <label className="input-label">Street / Colony *</label>
                  <div className="input-wrapper">
                    <Building className="input-icon" size={16} />
                    <input 
                      type="text" 
                      value={street} 
                      onChange={e => setStreet(e.target.value)} 
                      placeholder="e.g. Subhash Road, Ram Nagar" 
                      className="form-input-field"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="input-label">Village / Area / Taluk *</label>
                  <div className="input-wrapper">
                    <MapPin className="input-icon" size={16} />
                    <input 
                      type="text" 
                      value={village} 
                      onChange={e => setVillage(e.target.value)} 
                      placeholder="e.g. Gorantla Village" 
                      className="form-input-field"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="input-label">District *</label>
                  <div className="input-wrapper">
                    <MapPin className="input-icon" size={16} />
                    <input 
                      type="text" 
                      value={district} 
                      onChange={e => setDistrict(e.target.value)} 
                      placeholder="e.g. Guntur" 
                      className="form-input-field"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="input-label">State *</label>
                  <div className="input-wrapper">
                    <MapPin className="input-icon" size={16} />
                    <input 
                      type="text" 
                      value={stateName} 
                      onChange={e => setStateName(e.target.value)} 
                      placeholder="e.g. Andhra Pradesh" 
                      className="form-input-field"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="input-label">Pincode *</label>
                  <div className="input-wrapper">
                    <Hash className="input-icon" size={16} />
                    <input 
                      type="text" 
                      maxLength={6}
                      value={pincode} 
                      onChange={e => {
                        const val = e.target.value.replace(/\D/g, ''); // digit only
                        setPincode(val);
                      }} 
                      placeholder="6-digit pincode" 
                      className="form-input-field"
                    />
                  </div>
                </div>
              </div>
            </div>

            {asset.type === 'Equipment' && asset.operatorAvailable && (
              <div className="operator-card-switch">
                <div className="operator-text-info">
                  <span className="badge-operator-active">Optional</span>
                  <h4>Include Professional Operator</h4>
                  <p>Hire a certified operator. Recommended for complex operations.</p>
                  <span className="operator-rate-cost">+ ₹{operatorRate}/hr extra rate</span>
                </div>
                <label className="switch">
                  <input type="checkbox" checked={includeOperator} onChange={e => setIncludeOperator(e.target.checked)} />
                  <span className="slider round"></span>
                </label>
              </div>
            )}

            <div className="form-group">
              <label className="input-label">Instructions & Special Notes (Optional)</label>
              <textarea 
                rows={3}
                value={notes} 
                onChange={e => setNotes(e.target.value)}
                placeholder="Share any special instructions, soil quality, or access details..."
                className="notes-textarea"
              />
            </div>

            <div className="wizard-actions-container">
              <div className="wizard-actions dual">
                <button className="btn-ghost-wizard" onClick={() => setStep(1)}>Back</button>
                <AnimatePresence>
                  {isAddressValid && (
                    <motion.button 
                      initial={{ opacity: 0, scale: 0.9, x: 20 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.9, x: 20 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                      className="btn-primary-wizard animate-review-btn"
                      onClick={() => {
                        setAddress(getConcatenatedAddress());
                        setStep(3);
                      }}
                    >
                      <span>Review Order</span>
                      <ChevronRight size={18} />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
              {!isAddressValid && (
                <div className="form-validation-tip">
                  <span className="bullet-validation">•</span> Please enter all required delivery address fields above to view the <strong>Review Order</strong> option.
                </div>
              )}
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="wizard-step"
          >
            <h3 className="step-heading">
              <FileText className="step-icon" size={22} />
              <span>Final Review & Submit</span>
            </h3>
            <p className="step-description">Verify details before sending the request to the owner.</p>

            <div className="review-cards-list">
              <div className="review-card">
                <Calendar size={18} className="review-card-icon" />
                <div className="review-card-details">
                  <h5>Schedule & Duration</h5>
                  <p>{selectedDate} starting at {selectedHour}:00 for <strong>{duration} hour(s)</strong></p>
                </div>
              </div>

              <div className="review-card">
                <MapPin size={18} className="review-card-icon" />
                <div className="review-card-details">
                  <h5>Delivery Address</h5>
                  <p>{address}</p>
                </div>
              </div>

              {includeOperator && (
                <div className="review-card">
                  <Award size={18} className="review-card-icon" />
                  <div className="review-card-details">
                    <h5>Operator Request Included</h5>
                    <p>Yes, operator rate of <strong>₹{operatorRate}/hr</strong> is incorporated.</p>
                  </div>
                </div>
              )}
            </div>

            <div className="verification-notice">
              <Info size={16} />
              <p>The owner will review this request. You can cancel with no charge before approval.</p>
            </div>

            <div className="wizard-actions dual">
              <button className="btn-ghost-wizard" onClick={() => setStep(2)}>Back</button>
              <button 
                className="btn-primary-wizard submit"
                disabled={loading}
                onClick={handleBookingSubmit}
              >
                {loading ? 'Submitting Request...' : 'Confirm & Request Booking'}
              </button>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="booking-page-layout">
      {success ? (
        <div className="success-container-screen">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="success-message-card"
          >
            <div className="success-lottie-badge">
              <CheckCircle size={90} color="var(--primary)" />
            </div>
            <h2>Booking Request Submitted!</h2>
            <p className="success-tagline">Your rental request has been successfully routed to the equipment owner.</p>
            
            <div className="booking-visual-receipt">
              <div className="receipt-head">
                <h4>{asset.name}</h4>
                <span>{asset.category}</span>
              </div>
              <div className="receipt-details-list">
                <div className="r-row"><span>Date</span><span>{selectedDate}</span></div>
                <div className="r-row"><span>Hours</span><span>{selectedHour}:00 for {duration}h</span></div>
                {includeOperator && <div className="r-row"><span>Operator</span><span>Included</span></div>}
                <div className="r-row grand"><span>Total Amount</span><span>₹{calculateGrandTotal()}</span></div>
              </div>
            </div>

            <div className="success-buttons-row">
              <button className="btn-primary-wizard" onClick={() => navigate('/activity')}>
                Go to Bookings History
              </button>
              <button className="btn-ghost-wizard" onClick={() => navigate('/rentals')}>
                Back to Rentals
              </button>
            </div>
          </motion.div>
        </div>
      ) : (
        <div className="checkout-main-content">
          {/* Header row */}
          <div className="checkout-header-row">
            <button className="back-btn" onClick={() => navigate(-1)}>
              <ArrowLeft size={18} />
              <span>Back</span>
            </button>
            <div className="title-and-progress">
              <h2>Complete Your Booking</h2>
              <div className="progress-stepper">
                <div className={`step-node ${step >= 1 ? 'active' : ''}`}>
                  <span className="node-num">{step > 1 ? <Check size={12} /> : '1'}</span>
                  <span className="node-label">Schedule</span>
                </div>
                <div className="step-bar-connector"><div className="bar-fill" style={{ width: step > 1 ? '100%' : '0%' }}></div></div>
                <div className={`step-node ${step >= 2 ? 'active' : ''}`}>
                  <span className="node-num">{step > 2 ? <Check size={12} /> : '2'}</span>
                  <span className="node-label">Details</span>
                </div>
                <div className="step-bar-connector"><div className="bar-fill" style={{ width: step > 2 ? '100%' : '0%' }}></div></div>
                <div className={`step-node ${step >= 3 ? 'active' : ''}`}>
                  <span className="node-num">3</span>
                  <span className="node-label">Review</span>
                </div>
              </div>
            </div>
          </div>

          <div className="split-layout-grid">
            {/* Left Hand Wizard */}
            <div className="checkout-left-form">
              <div className="glass-wizard-card">
                <AnimatePresence mode="wait">
                  {renderActiveStep()}
                </AnimatePresence>
              </div>
            </div>

            {/* Right Hand Checkout Sidebar Receipt */}
            <div className="checkout-right-sidebar">
              <div className="sticky-bill-card">
                <div className="sidebar-asset-summary">
                  {asset.imageUrl ? (
                    <img src={asset.imageUrl} alt={asset.name} className="sidebar-asset-img" />
                  ) : (
                    <div className="sidebar-asset-img-placeholder">🚜</div>
                  )}
                  <div className="sidebar-asset-desc">
                    <span className="asset-type-badge">{asset.type}</span>
                    <h3>{asset.name}</h3>
                    <p className="owner-name-sub">Provided by <strong>{asset.providerName}</strong></p>
                  </div>
                </div>

                <div className="pricing-bill-breakdown">
                  <h4>Price Details</h4>
                  
                  <div className="bill-item">
                    <span className="item-label">Base Hourly Rate</span>
                    <span className="item-val">₹{asset.price}/hr</span>
                  </div>

                  <div className="bill-item">
                    <span className="item-label">Duration Selection</span>
                    <span className="item-val">{duration} hour(s)</span>
                  </div>

                  <div className="bill-item divider" />

                  <div className="bill-item">
                    <span className="item-label">Equipment Rental Subtotal</span>
                    <span className="item-val">₹{calculateBaseTotal()}</span>
                  </div>

                  {includeOperator && (
                    <div className="bill-item operator">
                      <span className="item-label">Professional Operator ({duration}h)</span>
                      <span className="item-val">₹{calculateOperatorTotal()}</span>
                    </div>
                  )}

                  <div className="bill-item tax">
                    <span className="item-label">AgriFarm Service Charge (2%)</span>
                    <span className="item-val">₹{calculateTaxTotal()}</span>
                  </div>

                  <div className="bill-item divider-thick" />

                  <div className="bill-item grand-total">
                    <span className="item-label">Estimated Grand Total</span>
                    <span className="item-val">₹{calculateGrandTotal()}</span>
                  </div>
                </div>

                <div className="safety-guarantee-card">
                  <ShieldAlert size={18} className="shield-icon" />
                  <div className="safety-text">
                    <h5>Secure Checkouts</h5>
                    <p>Payments are safely processed after delivery validation.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .booking-page-layout {
          min-height: calc(100vh - 80px);
          background: #f8fafc;
          padding: 32px 24px;
          display: flex;
          justify-content: center;
        }

        .checkout-main-content {
          width: 100%;
          max-width: 1200px;
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .checkout-header-row {
          display: flex;
          align-items: center;
          gap: 24px;
          padding-bottom: 8px;
        }

        .back-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: white;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          font-weight: 700;
          color: #475569;
          cursor: pointer;
          transition: all 0.2s;
        }
        .back-btn:hover {
          background: #f1f5f9;
          border-color: #cbd5e1;
        }

        .title-and-progress {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex: 1;
          flex-wrap: wrap;
          gap: 16px;
        }

        .title-and-progress h2 {
          font-weight: 900;
          color: #1e293b;
          font-size: 1.6rem;
        }

        .progress-stepper {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .step-node {
          display: flex;
          align-items: center;
          gap: 8px;
          opacity: 0.5;
          transition: all 0.3s ease;
        }
        .step-node.active {
          opacity: 1;
        }

        .node-num {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #e2e8f0;
          color: #475569;
          font-weight: 800;
          font-size: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .step-node.active .node-num {
          background: var(--primary);
          color: white;
        }

        .node-label {
          font-weight: 700;
          font-size: 0.85rem;
          color: #475569;
        }
        .step-node.active .node-label {
          color: #1e293b;
        }

        .step-bar-connector {
          width: 40px;
          height: 4px;
          background: #e2e8f0;
          border-radius: 2px;
          overflow: hidden;
        }
        .bar-fill {
          height: 100%;
          background: var(--primary);
          transition: width 0.3s ease;
        }

        .split-layout-grid {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 32px;
          align-items: start;
        }

        .checkout-left-form {
          width: 100%;
        }

        .glass-wizard-card {
          background: white;
          border-radius: 28px;
          padding: 32px;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);
          border: 1px solid #f1f5f9;
        }

        .wizard-step {
          display: flex;
          flex-direction: column;
        }

        .step-heading {
          display: flex;
          align-items: center;
          gap: 12px;
          font-weight: 850;
          color: #1e293b;
          font-size: 1.25rem;
          margin-bottom: 8px;
        }
        .step-icon {
          color: var(--primary);
        }

        .step-description {
          font-size: 0.9rem;
          color: #64748b;
          margin-bottom: 24px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 24px;
        }

        .input-label {
          font-weight: 800;
          color: #334155;
          font-size: 0.9rem;
        }

        .date-picker-input {
          padding: 14px;
          border-radius: 14px;
          border: 2px solid #e2e8f0;
          font-weight: 700;
          font-size: 0.95rem;
          color: #334155;
          background: #f8fafc;
          outline: none;
          transition: all 0.2s;
        }
        .date-picker-input:focus {
          border-color: var(--primary);
          background: white;
        }

        .time-slots-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 24px;
        }

        .slots-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(85px, 1fr));
          gap: 10px;
        }

        .slot-pill {
          padding: 12px 6px;
          border-radius: 12px;
          border: 1.5px solid #e2e8f0;
          font-size: 0.75rem;
          font-weight: 800;
          background: white;
          color: #475569;
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;
        }
        .slot-pill:hover:not(:disabled) {
          border-color: var(--primary);
          background: #f0fdf4;
          color: var(--primary);
        }
        .slot-pill.active {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
        }
        .slot-pill.blocked {
          background: #f1f5f9;
          color: #cbd5e1;
          text-decoration: line-through;
          cursor: not-allowed;
          border-color: #e2e8f0;
        }

        .duration-picker-box {
          background: #f8fafc;
          border-radius: 16px;
          padding: 20px;
          border: 1.5px dashed #cbd5e1;
          margin-bottom: 24px;
        }

        .duration-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
        }

        .duration-text h4 {
          font-weight: 850;
          color: #1e293b;
          font-size: 0.95rem;
          margin: 0 0 4px 0;
        }
        .duration-text p {
          font-size: 0.8rem;
          color: #64748b;
          margin: 0;
        }

        .duration-control-buttons {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .ctrl-btn {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: white;
          border: 1.5px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #475569;
          transition: all 0.2s;
        }
        .ctrl-btn:hover {
          border-color: var(--primary);
          color: var(--primary);
          background: #f0fdf4;
        }

        .duration-display-value {
          font-size: 1.1rem;
          font-weight: 950;
          color: var(--primary);
          min-width: 32px;
          text-align: center;
        }

        .wizard-actions {
          margin-top: 12px;
        }
        .wizard-actions.dual {
          display: grid;
          grid-template-columns: 100px 1fr;
          gap: 16px;
        }

        .btn-primary-wizard {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 14px 24px;
          background: var(--grad-primary);
          color: white;
          font-weight: 850;
          font-size: 0.95rem;
          border-radius: 14px;
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(5, 150, 105, 0.2);
          transition: all 0.2s;
        }
        .btn-primary-wizard:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(5, 150, 105, 0.3);
        }
        .btn-primary-wizard:disabled {
          background: #cbd5e1;
          color: #94a3b8;
          box-shadow: none;
          cursor: not-allowed;
        }
        .btn-primary-wizard.submit {
          background: #1b5e20;
        }

        .btn-ghost-wizard {
          padding: 14px;
          background: #f1f5f9;
          color: #475569;
          font-weight: 800;
          font-size: 0.95rem;
          border-radius: 14px;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-ghost-wizard:hover {
          background: #e2e8f0;
          color: #1e293b;
        }
        .address-mode-selector {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 8px;
        }

        .address-mode-card {
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 16px;
          padding: 16px;
          text-align: left;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          outline: none;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .address-mode-card:hover {
          border-color: #cbd5e1;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
        }
        .address-mode-card.active {
          border-color: var(--primary);
          background: #f0fdf4;
          box-shadow: 0 4px 20px rgba(16, 185, 129, 0.08);
        }

        .mode-card-header {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .mode-icon {
          color: #64748b;
          transition: color 0.2s;
        }
        .address-mode-card.active .mode-icon {
          color: var(--primary);
        }

        .mode-title {
          font-weight: 850;
          font-size: 0.9rem;
          color: #334155;
        }
        .address-mode-card.active .mode-title {
          color: #1b5e20;
        }

        .mode-desc {
          font-size: 0.75rem;
          color: #64748b;
          margin: 0;
          line-height: 1.4;
        }

        .address-warning-banner {
          display: flex;
          gap: 12px;
          padding: 14px 16px;
          background: #fffbeb;
          border: 1.5px solid #fef3c7;
          border-radius: 16px;
          color: #b45309;
          margin-bottom: 20px;
          align-items: flex-start;
        }
        .warning-icon {
          color: #d97706;
          flex-shrink: 0;
          margin-top: 2px;
        }
        .warning-content h5 {
          margin: 0 0 3px 0;
          font-weight: 850;
          font-size: 0.85rem;
          color: #92400e;
        }
        .warning-content p {
          margin: 0;
          font-size: 0.78rem;
          color: #b45309;
          line-height: 1.4;
        }

        .address-form-box {
          background: #fafafa;
          border: 1px solid #f1f5f9;
          border-radius: 20px;
          padding: 24px;
          margin-bottom: 24px;
        }

        .form-section-title {
          font-size: 0.95rem;
          font-weight: 850;
          color: #334155;
          margin: 0 0 16px 0;
          padding-bottom: 8px;
          border-bottom: 1.5px solid #e2e8f0;
        }

        .address-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .col-span-2 {
          grid-column: span 2;
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 14px;
          color: #94a3b8;
          pointer-events: none;
        }

        .form-input-field {
          width: 100%;
          padding: 12px 12px 12px 42px;
          border-radius: 12px;
          border: 2px solid #e2e8f0;
          background: white;
          font-weight: 600;
          font-size: 0.9rem;
          outline: none;
          color: #334155;
          transition: all 0.2s;
        }
        .form-input-field:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1);
        }

        .notes-textarea {
          width: 100%;
          padding: 14px;
          border-radius: 14px;
          border: 2px solid #e2e8f0;
          background: #f8fafc;
          font-weight: 600;
          font-size: 0.95rem;
          outline: none;
          resize: none;
          transition: all 0.2s;
        }
        .notes-textarea:focus {
          border-color: var(--primary);
          background: white;
        }

        .wizard-actions-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 16px;
        }

        .form-validation-tip {
          font-size: 0.8rem;
          color: #b45309;
          background: #fffbeb;
          padding: 10px 16px;
          border-radius: 10px;
          border: 1px solid #fef3c7;
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 700;
        }

        .bullet-validation {
          color: #d97706;
          font-size: 1.2rem;
          line-height: 1;
        }

        .operator-card-switch {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          padding: 20px;
          background: #f8fafc;
          border-radius: 20px;
          border: 1px dashed #cbd5e1;
          margin-bottom: 24px;
        }

        .operator-text-info h4 {
          font-weight: 850;
          color: #1e293b;
          font-size: 0.95rem;
          margin: 4px 0 2px 0;
        }
        .operator-text-info p {
          font-size: 0.8rem;
          color: #64748b;
          margin: 0 0 6px 0;
        }

        .badge-operator-active {
          padding: 3px 8px;
          background: #e0f2fe;
          color: #0369a1;
          font-size: 0.65rem;
          font-weight: 900;
          border-radius: 6px;
        }

        .operator-rate-cost {
          font-size: 0.8rem;
          font-weight: 850;
          color: var(--primary);
        }

        /* Switch Styling */
        .switch {
          position: relative;
          display: inline-block;
          width: 46px;
          height: 26px;
          flex-shrink: 0;
        }
        .switch input { opacity: 0; width: 0; height: 0; }
        .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #cbd5e1; transition: .4s; }
        .slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 4px; bottom: 4px; background-color: white; transition: .4s; }
        input:checked + .slider { background-color: var(--primary); }
        input:checked + .slider:before { transform: translateX(20px); }
        .slider.round { border-radius: 34px; }
        .slider.round:before { border-radius: 50%; }

        .review-cards-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 24px;
        }

        .review-card {
          display: flex;
          gap: 16px;
          padding: 16px;
          background: #f8fafc;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          align-items: flex-start;
        }

        .review-card-icon {
          color: var(--primary);
          flex-shrink: 0;
          margin-top: 2px;
        }

        .review-card-details h5 {
          margin: 0 0 2px 0;
          font-weight: 850;
          color: #1e293b;
          font-size: 0.9rem;
        }
        .review-card-details p {
          margin: 0;
          font-size: 0.85rem;
          color: #64748b;
        }

        .verification-notice {
          display: flex;
          gap: 10px;
          align-items: center;
          padding: 12px 16px;
          background: #fffbeb;
          border: 1px solid #fef3c7;
          border-radius: 12px;
          color: #b45309;
          font-size: 0.8rem;
          font-weight: 700;
          margin-bottom: 24px;
        }

        /* Right Hand Checkout Sidebar */
        .sticky-bill-card {
          background: white;
          border-radius: 28px;
          padding: 32px;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);
          border: 1px solid #f1f5f9;
          position: sticky;
          top: 100px;
        }

        .sidebar-asset-summary {
          display: flex;
          gap: 16px;
          align-items: center;
          padding-bottom: 24px;
          border-bottom: 1.5px solid #f1f5f9;
        }

        .sidebar-asset-img {
          width: 70px;
          height: 70px;
          object-fit: cover;
          border-radius: 16px;
        }
        .sidebar-asset-img-placeholder {
          width: 70px;
          height: 70px;
          background: #f0fdf4;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
        }

        .sidebar-asset-desc {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .asset-type-badge {
          align-self: flex-start;
          padding: 3px 8px;
          background: #e8f5e9;
          color: var(--primary);
          font-weight: 900;
          font-size: 0.65rem;
          border-radius: 6px;
        }

        .sidebar-asset-desc h3 {
          font-size: 1.05rem;
          font-weight: 850;
          color: #1e293b;
          margin: 0;
        }

        .owner-name-sub {
          font-size: 0.75rem;
          color: #64748b;
          margin: 0;
        }

        .pricing-bill-breakdown {
          padding-top: 24px;
        }

        .pricing-bill-breakdown h4 {
          font-size: 1.05rem;
          font-weight: 900;
          color: #1e293b;
          margin: 0 0 16px 0;
        }

        .bill-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 0;
          font-size: 0.85rem;
          font-weight: 700;
          color: #64748b;
        }

        .bill-item.operator {
          color: var(--primary);
        }

        .bill-item.tax {
          color: #475569;
        }

        .bill-item .item-val {
          font-weight: 850;
          color: #334155;
        }
        .bill-item.operator .item-val {
          color: var(--primary);
        }

        .bill-item.divider {
          border-bottom: 1.5px dashed #e2e8f0;
          padding: 0;
          margin: 10px 0;
        }
        .bill-item.divider-thick {
          border-bottom: 1.5px solid #f1f5f9;
          padding: 0;
          margin: 12px 0;
        }

        .bill-item.grand-total {
          padding-top: 8px;
          font-size: 1.15rem;
        }
        .bill-item.grand-total .item-label {
          font-weight: 900;
          color: #1e293b;
        }
        .bill-item.grand-total .item-val {
          font-weight: 950;
          color: #1b5e20;
          font-size: 1.25rem;
        }

        .safety-guarantee-card {
          margin-top: 24px;
          display: flex;
          gap: 12px;
          padding: 16px;
          background: #fafbfb;
          border-radius: 16px;
          border: 1px solid #f1f5f9;
          align-items: center;
        }
        .shield-icon {
          color: #64748b;
          flex-shrink: 0;
        }
        .safety-text h5 {
          margin: 0 0 2px 0;
          font-weight: 850;
          color: #334155;
          font-size: 0.8rem;
        }
        .safety-text p {
          margin: 0;
          font-size: 0.7rem;
          color: #64748b;
          line-height: 1.3;
        }

        /* Success Screen layout */
        .success-container-screen {
          width: 100%;
          max-width: 600px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 0;
        }

        .success-message-card {
          background: white;
          border-radius: 32px;
          padding: 40px;
          box-shadow: 0 15px 40px rgba(15, 23, 42, 0.06);
          border: 1px solid #f1f5f9;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
        }

        .success-lottie-badge {
          margin-bottom: 24px;
        }

        .success-message-card h2 {
          font-weight: 950;
          color: #1b5e20;
          font-size: 1.6rem;
          margin: 0 0 8px 0;
        }

        .success-tagline {
          font-size: 0.95rem;
          color: #64748b;
          margin: 0 0 32px 0;
          line-height: 1.5;
        }

        .booking-visual-receipt {
          width: 100%;
          background: #fafbfb;
          border-radius: 20px;
          padding: 24px;
          border: 1.5px solid #f1f5f9;
          margin-bottom: 32px;
          text-align: left;
        }

        .receipt-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 14px;
          border-bottom: 1.5px dashed #cbd5e1;
          margin-bottom: 16px;
        }
        .receipt-head h4 {
          margin: 0;
          font-weight: 850;
          color: #1e293b;
          font-size: 1.05rem;
        }
        .receipt-head span {
          padding: 3px 8px;
          background: #e8f5e9;
          color: var(--primary);
          font-weight: 900;
          font-size: 0.65rem;
          border-radius: 6px;
        }

        .receipt-details-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .r-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
          font-weight: 700;
          color: #64748b;
        }

        .r-row span:last-child {
          font-weight: 850;
          color: #334155;
        }

        .r-row.grand {
          padding-top: 12px;
          border-top: 1.5px solid #f1f5f9;
          font-size: 1.05rem;
          color: #1e293b;
        }
        .r-row.grand span:first-child {
          font-weight: 900;
        }
        .r-row.grand span:last-child {
          font-weight: 950;
          color: #1b5e20;
        }

        .success-buttons-row {
          display: flex;
          flex-direction: column;
          gap: 12px;
          width: 100%;
        }

        @media (max-width: 900px) {
          .split-layout-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }
          .checkout-right-sidebar {
            order: -1; /* Sidebar goes above input forms on mobile */
          }
          .sticky-bill-card {
            position: relative;
            top: 0;
            padding: 24px;
          }
          .title-and-progress {
            flex-direction: column;
            align-items: flex-start;
          }
          .progress-stepper {
            width: 100%;
            justify-content: space-between;
          }
        }
      `}</style>
    </div>
  );
};

export default BookAsset;
