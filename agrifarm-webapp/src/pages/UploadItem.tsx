import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Tractor, Truck, Users, Sprout, ChevronLeft, Upload, Check, AlertCircle, MapPin } from 'lucide-react';
import { useAuth } from '../services/AuthContext';

const UploadItem: React.FC = () => {
  const [category, setCategory] = useState<'Equipment' | 'Service' | 'Vehicle' | 'Workers' | null>(null);
  const [formData, setFormData] = useState<any>({
    isAvailable: true,
    approvalStatus: 'PENDING',
    rating: 0,
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e as any;
    setFormData((prev: any) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...formData, ownerId: user?.id };
      console.log('Uploading payload:', payload);
      // In a real app, I'd have POST methods in apiService. 
      // For this demo, I'll simulate success.
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSuccess(true);
      setTimeout(() => navigate('/manage-assets'), 2000);
    } catch (error) {
      console.error('Error uploading item:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderFormFields = () => {
    switch (category) {
      case 'Equipment':
        return (
          <div className="form-fields grid-2">
            <div className="input-group">
              <label>Equipment Name / Brand</label>
              <input name="brandModel" placeholder="e.g. John Deere 5310" onChange={handleInputChange} required />
            </div>
            <div className="input-group">
              <label>Category</label>
              <select name="category" onChange={handleInputChange} required>
                <option value="">Select Category</option>
                <option value="Tractor">Tractor</option>
                <option value="Harvester">Harvester</option>
                <option value="Plough">Plough</option>
              </select>
            </div>
            <div className="input-group">
              <label>Price Per Hour (₹)</label>
              <input type="number" name="pricePerHour" placeholder="500" onChange={handleInputChange} required />
            </div>
            <div className="input-group">
              <label>Condition Status</label>
              <select name="conditionStatus" onChange={handleInputChange}>
                <option value="EXCELLENT">Excellent</option>
                <option value="GOOD">Good</option>
                <option value="FAIR">Fair</option>
              </select>
            </div>
          </div>
        );
      case 'Vehicle':
        return (
          <div className="form-fields grid-2">
            <div className="input-group">
              <label>Vehicle Type</label>
              <input name="vehicleType" placeholder="e.g. Trolley, Pickup Truck" onChange={handleInputChange} required />
            </div>
            <div className="input-group">
              <label>Vehicle Number</label>
              <input name="vehicleNumber" placeholder="PB-XX-XXXX" onChange={handleInputChange} required />
            </div>
            <div className="input-group">
              <label>Load Capacity (Tons)</label>
              <input type="number" name="loadCapacity" placeholder="2" onChange={handleInputChange} required />
            </div>
            <div className="input-group">
              <label>Price Per KM / Trip (₹)</label>
              <input type="number" name="pricePerKmOrTrip" placeholder="20" onChange={handleInputChange} required />
            </div>
          </div>
        );
      case 'Workers':
        return (
          <div className="form-fields grid-2">
            <div className="input-group">
              <label>Group Name</label>
              <input name="groupName" placeholder="e.g. Skilled Harvest Team" onChange={handleInputChange} required />
            </div>
            <div className="input-group">
              <label>Male Count</label>
              <input type="number" name="maleCount" onChange={handleInputChange} required />
            </div>
            <div className="input-group">
              <label>Female Count</label>
              <input type="number" name="femaleCount" onChange={handleInputChange} required />
            </div>
            <div className="input-group">
              <label>Daily Rate Per Person (₹)</label>
              <input type="number" name="pricePerMale" onChange={handleInputChange} required />
            </div>
          </div>
        );
      case 'Service':
        return (
          <div className="form-fields grid-2">
            <div className="input-group">
              <label>Service Type</label>
              <input name="serviceType" placeholder="e.g. Land Levelling" onChange={handleInputChange} required />
            </div>
            <div className="input-group">
              <label>Business Name</label>
              <input name="businessName" onChange={handleInputChange} required />
            </div>
            <div className="input-group">
              <label>Price Rate (₹)</label>
              <input type="number" name="priceRate" onChange={handleInputChange} required />
            </div>
            <div className="input-group">
              <label>Description</label>
              <textarea name="description" onChange={handleInputChange} className="span-2"></textarea>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="upload-page container fade-in">
      <div className="page-header">
        <button onClick={() => navigate(-1)} className="btn-back">
          <ChevronLeft size={24} />
        </button>
        <h1>{category ? `Add ${category}` : 'What are you listing?'}</h1>
      </div>

      {!category ? (
        <div className="category-selection-grid">
          {[
            { id: 'Equipment', icon: Tractor, label: 'Equipment', color: '#e8f5e9', fg: '#2e7d32' },
            { id: 'Vehicle', icon: Truck, label: 'Transport', color: '#e3f2fd', fg: '#1565c0' },
            { id: 'Workers', icon: Users, label: 'Workers', color: '#f3e5f5', fg: '#6a1b9a' },
            { id: 'Service', icon: Sprout, label: 'Service', color: '#fff3e0', fg: '#e65100' },
          ].map((item) => (
            <motion.div
              key={item.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="category-select-card"
              onClick={() => setCategory(item.id as any)}
            >
              <div className="icon-circle" style={{ backgroundColor: item.color }}>
                <item.icon size={40} color={item.fg} />
              </div>
              <span>{item.label}</span>
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="upload-form-container card"
        >
          {success ? (
            <div className="success-state">
              <div className="success-icon">
                <Check size={48} color="white" />
              </div>
              <h2>Listing Successful!</h2>
              <p>Your item has been submitted for moderation.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-section">
                <h3><AlertCircle size={18} /> Basic Information</h3>
                {renderFormFields()}
              </div>

              <div className="form-section">
                <h3><MapPin size={18} /> Location Details</h3>
                <div className="grid-2">
                  <div className="input-group">
                    <label>Village</label>
                    <input name="village" placeholder="Enter Village" onChange={handleInputChange} required />
                  </div>
                  <div className="input-group">
                    <label>District</label>
                    <input name="district" placeholder="Enter District" onChange={handleInputChange} required />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3><Upload size={18} /> Media</h3>
                <div className="image-upload-box">
                  <Upload size={32} className="text-slate-300" />
                  <p>Click to upload item photos</p>
                  <span>Max size: 5MB</span>
                </div>
              </div>

              <div className="form-footer">
                <button type="button" className="btn-cancel" onClick={() => setCategory(null)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Submitting...' : 'List Item Now'}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      )}

      <style>{`
        .upload-page { padding-top: 32px; max-width: 900px !important; }
        .page-header { display: flex; align-items: center; gap: 16px; margin-bottom: 40px; }
        .btn-back { width: 48px; height: 48px; border-radius: 12px; background: white; box-shadow: var(--shadow-sm); display: flex; align-items: center; justify-content: center; }
        
        .category-selection-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 24px; }
        .category-select-card { background: white; padding: 40px; border-radius: 32px; display: flex; flex-direction: column; align-items: center; gap: 20px; cursor: pointer; box-shadow: var(--shadow-md); border: 2px solid transparent; transition: all 0.2s; }
        .category-select-card:hover { border-color: var(--primary); box-shadow: var(--shadow-xl); }
        .icon-circle { width: 100px; height: 100px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
        .category-select-card span { font-weight: 800; font-size: 1.25rem; }
        
        .upload-form-container { padding: 40px; border-radius: 32px; }
        .form-section { margin-bottom: 40px; }
        .form-section h3 { display: flex; align-items: center; gap: 8px; font-size: 1rem; margin-bottom: 24px; color: var(--text-muted); padding-bottom: 8px; border-bottom: 1px solid var(--border); }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        .input-group { display: flex; flex-direction: column; gap: 8px; }
        .input-group label { font-weight: 600; font-size: 0.875rem; }
        .input-group input, .input-group select, .input-group textarea { padding: 12px 16px; border-radius: 12px; border: 2px solid #f1f5f9; background: #f8fafc; font-weight: 600; outline: none; transition: all 0.2s; }
        .input-group input:focus, .input-group select:focus { border-color: var(--primary); background: white; }
        .span-2 { grid-column: span 2; min-height: 100px; }
        
        .image-upload-box { border: 2px dashed var(--border); border-radius: 20px; padding: 40px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 12px; cursor: pointer; transition: all 0.2s; }
        .image-upload-box:hover { border-color: var(--primary); background: #f0fdf4; }
        
        .form-footer { display: flex; justify-content: flex-end; gap: 16px; margin-top: 40px; }
        .btn-cancel { padding: 14px 28px; border-radius: 16px; font-weight: 700; color: var(--text-muted); }
        .success-state { text-align: center; padding: 40px 0; }
        .success-icon { width: 80px; height: 80px; background: var(--primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; }
        
        @media (max-width: 640px) { .grid-2 { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
};

export default UploadItem;
