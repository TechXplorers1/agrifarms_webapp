import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../services/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, MapPin, Phone, LogOut, Settings, Shield, ChevronRight, 
  Package, Calendar, Mail, Edit2, Save, X, Building2, Map, Globe2, 
  Pin, Compass, AlertCircle, CheckCircle2, UserCheck, Camera, Loader2
} from 'lucide-react';
import { apiService } from '../services/apiService';
import { resolveCoordinates } from '../services/locationHelper';

const Profile: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [profile, setProfile] = useState<any>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    houseNo: '',
    street: '',
    village: '',
    district: '',
    state: '',
    country: 'India',
    pincode: '',
    profileImageUrl: '',
    latitude: '',
    longitude: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (PNG/JPEG/GIF).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Selected file exceeds the 5MB size limit.');
      return;
    }

    setIsUploadingImage(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const response = await apiService.uploadMedia(file);
      if (response && response.data && response.data.url) {
        const uploadedUrl = response.data.url;
        setFormData((prev) => ({
          ...prev,
          profileImageUrl: uploadedUrl
        }));

        if (user?.id && profile) {
          const lat = formData.latitude ? parseFloat(formData.latitude) : (profile.latitude ? parseFloat(profile.latitude) : null);
          const lon = formData.longitude ? parseFloat(formData.longitude) : (profile.longitude ? parseFloat(profile.longitude) : null);
          
          const payload = {
            ...profile,
            fullName: formData.fullName || profile.fullName,
            phoneNumber: formData.phoneNumber || profile.phoneNumber,
            houseNo: formData.houseNo || profile.houseNo,
            street: formData.street || profile.street,
            village: formData.village || profile.village,
            district: formData.district || profile.district,
            state: formData.state || profile.state,
            country: formData.country || profile.country || 'India',
            pincode: formData.pincode || profile.pincode,
            profileImageUrl: uploadedUrl,
            latitude: lat,
            longitude: lon
          };

          const responseUpdate = await apiService.updateUser(user.id, payload);
          if (responseUpdate && responseUpdate.data) {
            setProfile(responseUpdate.data);
            
            // Sync session cache
            const storedUser = localStorage.getItem('agrifarm_user');
            if (storedUser) {
              const parsed = JSON.parse(storedUser);
              parsed.profileImageUrl = responseUpdate.data.profileImageUrl;
              localStorage.setItem('agrifarm_user', JSON.stringify(parsed));
            }
            setSuccessMsg('Profile picture successfully uploaded and saved in database!');
            setTimeout(() => setSuccessMsg(''), 4000);
          }
        } else {
          setSuccessMsg('Profile image uploaded successfully! Save profile to persist changes.');
          setTimeout(() => setSuccessMsg(''), 4000);
        }
      } else {
        throw new Error('Image upload failed.');
      }
    } catch (err: any) {
      console.error('Failed to upload image:', err);
      setErrorMsg(err?.response?.data?.message || 'Failed to upload profile image.');
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    fetchFullProfile();
  }, [isAuthenticated, user?.id]);

  const fetchFullProfile = async () => {
    if (!user?.id) return;
    setIsLoadingProfile(true);
    try {
      const response = await apiService.getUser(user.id);
      if (response && response.data) {
        const data = response.data;
        setProfile(data);
        setFormData({
          fullName: data.fullName || '',
          phoneNumber: data.phoneNumber || '',
          houseNo: data.houseNo || '',
          street: data.street || '',
          village: data.village || '',
          district: data.district || '',
          state: data.state || '',
          country: data.country || 'India',
          pincode: data.pincode || '',
          profileImageUrl: data.profileImageUrl || '',
          latitude: data.latitude ? String(data.latitude) : '',
          longitude: data.longitude ? String(data.longitude) : ''
        });
      }
    } catch (err) {
      console.error("Failed to load profile details:", err);
      setErrorMsg("Failed to retrieve your complete profile details from the database.");
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDetectGpsLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setIsDetectingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            {
              headers: {
                'User-Agent': 'AgriFarmsApp/1.0'
              }
            }
          );

          if (!response.ok) {
            throw new Error('Nominatim request failed');
          }

          const data = await response.json();
          if (data && data.address) {
            const addr = data.address;
            
            // Geocoding extraction optimized to isolate city/village vs suburb/area name correctly
            const village = addr.city || addr.town || addr.village || addr.municipality || addr.suburb || addr.neighbourhood || addr.city_district || '';
            const district = addr.district || addr.county || addr.city || '';
            
            const areaParts = [];
            if (addr.road) areaParts.push(addr.road);
            const areaName = addr.suburb || addr.neighbourhood || addr.quarter;
            if (areaName && areaName !== village) {
              areaParts.push(areaName);
            }
            const street = areaParts.join(', ') || addr.road || addr.suburb || '';
            
            const state = addr.state || '';
            const pincode = addr.postcode || '';

            setFormData((prev) => ({
              ...prev,
              street: street,
              village: village,
              district: district,
              state: state,
              pincode: pincode,
              latitude: latitude.toFixed(6),
              longitude: longitude.toFixed(6)
            }));

            alert(`GPS location detected! Auto-populated fields successfully.`);
          }
        } catch (err) {
          console.error("GPS Reverse-geocoding failed:", err);
          alert("Failed to reverse-geocode coordinates. Filled in lat/lng coordinates only.");
          setFormData((prev) => ({
            ...prev,
            latitude: latitude.toFixed(6),
            longitude: longitude.toFixed(6)
          }));
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (geoErr) => {
        console.error("GPS detection error:", geoErr);
        alert(`Failed to detect GPS location: ${geoErr.message}`);
        setIsDetectingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setErrorMsg('');
    setSuccessMsg('');
    
    // Validate phone number: must be exactly 10 digits
    const cleanedPhone = (formData.phoneNumber || '').replace(/\D/g, '');
    if (cleanedPhone.length !== 10) {
      setErrorMsg('Phone number must be exactly 10 digits.');
      return;
    }

    setIsSaving(true);

    let lat = formData.latitude ? parseFloat(formData.latitude) : null;
    let lon = formData.longitude ? parseFloat(formData.longitude) : null;

    // Auto-resolve coordinates for manual changes
    const locationChanged = formData.village !== profile?.village || formData.district !== profile?.district;
    if ((locationChanged && (!formData.latitude || formData.latitude.trim() === '')) || (!lat || !lon)) {
      try {
        const coords = await resolveCoordinates(formData.village, formData.district, formData.state);
        if (coords) {
          lat = coords.latitude;
          lon = coords.longitude;
          // Sync back to form state for completeness
          setFormData(prev => ({
            ...prev,
            latitude: String(coords.latitude),
            longitude: String(coords.longitude)
          }));
        }
      } catch (err) {
        console.error("Profile manual address geocoding failed:", err);
      }
    }

    try {
      const payload = {
        ...profile,
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber,
        houseNo: formData.houseNo,
        street: formData.street,
        village: formData.village,
        district: formData.district,
        state: formData.state,
        country: formData.country,
        pincode: formData.pincode,
        profileImageUrl: formData.profileImageUrl,
        latitude: lat,
        longitude: lon
      };

      const response = await apiService.updateUser(user.id, payload);
      if (response && response.data) {
        setProfile(response.data);
        // Force refresh local cached session to keep the UI perfectly synced
        const storedUser = localStorage.getItem('agrifarm_user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          parsed.name = response.data.fullName;
          parsed.phoneNumber = response.data.phoneNumber;
          localStorage.setItem('agrifarm_user', JSON.stringify(parsed));
        }
        setSuccessMsg("Profile details successfully saved!");
        setIsEditing(false);
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err: any) {
      console.error("Failed to update profile:", err);
      setErrorMsg(err?.response?.data?.message || "Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAuthenticated) return null;

  if (isLoadingProfile) {
    return (
      <div style={{ 
        minHeight: '60vh', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: '20px' 
      }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            border: '3px solid rgba(46, 125, 50, 0.15)',
            borderTop: '3px solid var(--primary)',
          }}
        />
        <span style={{ color: 'var(--text-light)', fontSize: '1rem', fontWeight: 600, letterSpacing: '0.5px' }}>
          Retrieving Agri Profile...
        </span>
      </div>
    );
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
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="profile-info-card card glass-profile"
        >
          <div className="profile-main-row">
            <div 
              className="avatar-large editable"
              onClick={handleAvatarClick}
              title="Click to select and upload a new profile picture immediately"
            >
              {isUploadingImage ? (
                <div className="avatar-loader">
                  <Loader2 size={32} className="animate-spin" color="white" />
                </div>
              ) : (
                <>
                  {formData.profileImageUrl || profile?.profileImageUrl ? (
                    <img 
                      src={apiService.getFullImageUrl(formData.profileImageUrl || profile?.profileImageUrl)} 
                      alt={formData.fullName || profile?.fullName} 
                    />
                  ) : (
                    <User size={48} color="white" />
                  )}
                  <div className="avatar-edit-overlay">
                    <Camera size={20} color="white" />
                    <span>Change Photo</span>
                  </div>
                </>
              )}
            </div>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              style={{ display: 'none' }} 
            />
            
            <div className="info-details">
              <div className="name-badge-row">
                <h2>{profile?.fullName || user?.name || 'Agri Farms User'}</h2>
                <div className="badge-role">{profile?.role || user?.role || 'Farmer'}</div>
              </div>
              
              <div className="contact-info-grid">
                <div className="contact-item">
                  <Mail size={15} color="var(--primary)" />
                  <span>{profile?.email}</span>
                </div>
                <div className="contact-item">
                  <Phone size={15} color="var(--primary)" />
                  <span>{profile?.phoneNumber ? `+91 ${profile.phoneNumber}` : 'No phone number provided'}</span>
                </div>
                <div className="contact-item full-width-item">
                  <MapPin size={15} color="var(--primary)" />
                  <span>
                    {profile?.village || profile?.district 
                      ? `${profile.houseNo ? profile.houseNo + ', ' : ''}${profile.street ? profile.street + ', ' : ''}${profile.village || ''}, ${profile.district || ''}, ${profile.state || ''} - ${profile.pincode || ''}`
                      : 'No address added yet.'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {!isEditing && (
            <button 
              className="btn-edit-action" 
              onClick={() => {
                setIsEditing(true);
                setErrorMsg('');
                setSuccessMsg('');
              }}
            >
              <Edit2 size={16} />
              <span>Edit Profile</span>
            </button>
          )}
        </motion.div>
      </div>

      {errorMsg && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="message-box error-message">
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </motion.div>
      )}
      
      {successMsg && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="message-box success-message">
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </motion.div>
      )}

      <AnimatePresence>
        {isEditing && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="edit-profile-card card glass"
          >
            <div className="edit-card-header">
              <div className="header-title-flex">
                <UserCheck size={24} color="var(--primary)" />
                <h3>Personal & Address Details Form</h3>
              </div>
              <button className="btn-close-edit" onClick={() => setIsEditing(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="profile-edit-form">
              <div className="form-sections-grid">
                
                {/* Personal Information Section */}
                <div className="form-section">
                  <h4 className="section-subtitle">
                    <User size={16} /> Personal Information
                  </h4>
                  
                  <div className="form-group">
                    <label htmlFor="fullName">Full Name</label>
                    <div className="input-wrapper">
                      <User size={18} className="input-icon" />
                      <input
                        id="fullName"
                        name="fullName"
                        type="text"
                        placeholder="Enter full name"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="phoneNumber">Phone Number</label>
                    <div className="input-wrapper">
                      <Phone size={18} className="input-icon" />
                      <input
                        id="phoneNumber"
                        name="phoneNumber"
                        type="text"
                        placeholder="10-digit mobile number"
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="profileImageUrl">Profile Image URL</label>
                    <div className="input-wrapper">
                      <Globe2 size={18} className="input-icon" />
                      <input
                        id="profileImageUrl"
                        name="profileImageUrl"
                        type="text"
                        placeholder="https://example.com/avatar.jpg"
                        value={formData.profileImageUrl}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>

                {/* Address & Location Information Section */}
                <div className="form-section">
                  <div className="flex justify-between items-center" style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 className="section-subtitle" style={{ margin: 0, borderBottom: 'none', paddingBottom: 0 }}>
                      <MapPin size={16} /> Contact Address Details
                    </h4>
                    {isEditing && (
                      <button
                        type="button"
                        className="btn-gps-detect"
                        onClick={handleDetectGpsLocation}
                        disabled={isDetectingLocation}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          background: 'rgba(0, 137, 71, 0.1)',
                          color: 'var(--primary)',
                          padding: '8px 16px',
                          borderRadius: '100px',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          border: '1px solid rgba(0, 137, 71, 0.2)',
                          transition: 'all 0.2s',
                          cursor: 'pointer'
                        }}
                      >
                        <Compass size={14} className={isDetectingLocation ? 'animate-spin' : ''} />
                        <span>{isDetectingLocation ? 'Detecting...' : 'Detect GPS Location'}</span>
                      </button>
                    )}
                  </div>

                  <div className="form-row-2">
                    <div className="form-group">
                      <label htmlFor="houseNo">House No.</label>
                      <div className="input-wrapper">
                        <Building2 size={18} className="input-icon" />
                        <input
                          id="houseNo"
                          name="houseNo"
                          type="text"
                          placeholder="e.g. 45-B"
                          value={formData.houseNo}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="street">Street / Area</label>
                      <div className="input-wrapper">
                        <Map size={18} className="input-icon" />
                        <input
                          id="street"
                          name="street"
                          type="text"
                          placeholder="e.g. Sprout Lane"
                          value={formData.street}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-row-2">
                    <div className="form-group">
                      <label htmlFor="village">Village / City</label>
                      <div className="input-wrapper">
                        <MapPin size={18} className="input-icon" />
                        <input
                          id="village"
                          name="village"
                          type="text"
                          placeholder="e.g. Guntakal"
                          value={formData.village}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="district">District</label>
                      <div className="input-wrapper">
                        <MapPin size={18} className="input-icon" />
                        <input
                          id="district"
                          name="district"
                          type="text"
                          placeholder="e.g. Anantapur"
                          value={formData.district}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-row-3">
                    <div className="form-group">
                      <label htmlFor="state">State</label>
                      <div className="input-wrapper">
                        <Globe2 size={18} className="input-icon" />
                        <input
                          id="state"
                          name="state"
                          type="text"
                          placeholder="e.g. Andhra Pradesh"
                          value={formData.state}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="pincode">Pincode</label>
                      <div className="input-wrapper">
                        <Pin size={18} className="input-icon" />
                        <input
                          id="pincode"
                          name="pincode"
                          type="text"
                          placeholder="6-digit ZIP"
                          value={formData.pincode}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="country">Country</label>
                      <div className="input-wrapper select-wrapper">
                        <input
                          id="country"
                          name="country"
                          type="text"
                          placeholder="e.g. India"
                          value={formData.country}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Geolocation Fields */}
                  <h4 className="section-subtitle sub-geo">
                    <Compass size={16} /> GPS Coordinates (Optional)
                  </h4>
                  <div className="form-row-2">
                    <div className="form-group">
                      <label htmlFor="latitude">Latitude</label>
                      <div className="input-wrapper">
                        <Compass size={18} className="input-icon" />
                        <input
                          id="latitude"
                          name="latitude"
                          type="number"
                          step="0.000001"
                          placeholder="15.123456"
                          value={formData.latitude}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="longitude">Longitude</label>
                      <div className="input-wrapper">
                        <Compass size={18} className="input-icon" />
                        <input
                          id="longitude"
                          name="longitude"
                          type="number"
                          step="0.000001"
                          placeholder="77.123456"
                          value={formData.longitude}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              <div className="edit-form-actions">
                <button 
                  type="button" 
                  className="btn-cancel-edit" 
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-save-profile"
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving Changes...' : (
                    <>
                      <Save size={18} />
                      <span>Save Detailed Profile</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="profile-menu">
        <h3 className="dashboard-section-title">Account Quick Management</h3>
        <div className="grid-menu">
          {menuItems.map((item) => (
            <motion.div 
              key={item.name}
              whileHover={{ y: -4, scale: 1.01 }}
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
          max-width: 1440px !important;
          padding-bottom: 80px;
        }
        .profile-header {
          margin-bottom: 24px;
        }
        .glass-profile {
          background: rgba(255, 255, 255, 0.8) !important;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.45);
          box-shadow: 0 15px 35px rgba(46, 125, 50, 0.08);
          border-radius: 28px;
          padding: 35px;
          position: relative;
        }
        .profile-main-row {
          display: flex;
          align-items: center;
          gap: 32px;
        }
        .avatar-large {
          width: 108px;
          height: 108px;
          border-radius: 32px;
          background: linear-gradient(135deg, var(--primary) 0%, #1b5e20 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          box-shadow: 0 8px 20px rgba(0, 137, 71, 0.2);
          border: 2px solid white;
          flex-shrink: 0;
          position: relative;
          transition: all 0.3s ease;
        }
        .avatar-large.editable {
          cursor: pointer;
        }
        .avatar-large.editable:hover {
          transform: scale(1.02);
          box-shadow: 0 10px 25px rgba(0, 137, 71, 0.3);
          border-color: var(--primary);
        }
        .avatar-large img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: all 0.3s ease;
        }
        .avatar-large.editable:hover img {
          filter: brightness(0.6) blur(1px);
        }
        .avatar-edit-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.45);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
        }
        .avatar-large.editable:hover .avatar-edit-overlay {
          opacity: 1;
        }
        .avatar-edit-overlay span {
          color: white;
          font-size: 0.65rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .avatar-loader {
          position: absolute;
          inset: 0;
          background: rgba(0, 137, 71, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .info-details {
          flex: 1;
        }
        .name-badge-row {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 12px;
          flex-wrap: wrap;
        }
        .info-details h2 {
          font-size: 1.85rem;
          margin: 0;
          font-weight: 800;
          color: var(--text-main);
          letter-spacing: -0.5px;
        }
        .badge-role {
          background: rgba(0, 137, 71, 0.08);
          color: var(--primary);
          border: 1px solid rgba(0, 137, 71, 0.15);
          padding: 4px 14px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 800;
          display: inline-block;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .contact-info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .contact-item {
          display: flex;
          align-items: center;
          gap: 10px;
          color: var(--text-muted);
          font-size: 0.9rem;
          font-weight: 600;
        }
        .full-width-item {
          grid-column: span 2;
          line-height: 1.4;
          margin-top: 4px;
        }
        .btn-edit-action {
          position: absolute;
          top: 35px;
          right: 35px;
          background: white;
          color: var(--text-main);
          border: 1px solid var(--border);
          padding: 10px 18px;
          border-radius: 14px;
          font-weight: 700;
          font-size: 0.875rem;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: var(--shadow-sm);
          transition: all 0.2s;
          cursor: pointer;
        }
        .btn-edit-action:hover {
          background: #f8fafc;
          border-color: rgba(0, 137, 71, 0.3);
          color: var(--primary);
          transform: translateY(-1px);
        }
        
        /* Edit profile card */
        .edit-profile-card {
          margin-top: 24px;
          margin-bottom: 32px;
          padding: 30px;
          border-radius: 28px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.05);
        }
        .edit-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--border);
          padding-bottom: 20px;
          margin-bottom: 24px;
        }
        .header-title-flex {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .header-title-flex h3 {
          font-size: 1.35rem;
          font-weight: 800;
          color: var(--text-main);
          margin: 0;
        }
        .btn-close-edit {
          background: #f1f5f9;
          border: none;
          width: 38px;
          height: 38px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-close-edit:hover {
          background: #e2e8f0;
          color: #ef4444;
        }
        
        .form-sections-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
          margin-bottom: 28px;
        }
        .form-section {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .section-subtitle {
          font-size: 1.05rem;
          font-weight: 800;
          color: var(--primary-dark);
          margin: 0 0 4px 0;
          display: flex;
          align-items: center;
          gap: 8px;
          border-bottom: 2px solid rgba(0, 137, 71, 0.08);
          padding-bottom: 8px;
        }
        .sub-geo {
          margin-top: 10px;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .form-group label {
          font-weight: 700;
          font-size: 0.85rem;
          color: var(--text-main);
        }
        .form-row-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .form-row-3 {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 12px;
        }
        .input-wrapper {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #f8fafc;
          padding: 10px 16px;
          border-radius: 14px;
          border: 2px solid rgba(0,0,0,0.04);
          transition: all 0.2s;
        }
        .input-wrapper:focus-within {
          border-color: var(--primary);
          background: white;
          box-shadow: 0 4px 12px rgba(0, 137, 71, 0.05);
        }
        .input-wrapper input {
          background: transparent;
          border: none;
          outline: none;
          width: 100%;
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--text-main);
        }
        .input-icon {
          color: var(--text-muted);
          flex-shrink: 0;
        }
        
        .edit-form-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 16px;
          border-top: 1px solid var(--border);
          padding-top: 24px;
        }
        .btn-cancel-edit {
          background: #f1f5f9;
          color: var(--text-main);
          font-weight: 700;
          padding: 12px 24px;
          border-radius: 14px;
          transition: all 0.2s;
          cursor: pointer;
          border: none;
        }
        .btn-cancel-edit:hover {
          background: #e2e8f0;
        }
        .btn-save-profile {
          background: var(--primary);
          color: white;
          font-weight: 700;
          padding: 12px 28px;
          border-radius: 14px;
          transition: all 0.2s;
          cursor: pointer;
          border: none;
          display: flex;
          align-items: center;
          gap: 10px;
          box-shadow: 0 4px 12px rgba(0, 137, 71, 0.2);
        }
        .btn-save-profile:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(0, 137, 71, 0.3);
        }
        .btn-save-profile:disabled, .btn-cancel-edit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .dashboard-section-title {
          font-size: 1.15rem;
          font-weight: 800;
          color: var(--text-main);
          margin-bottom: 16px;
          letter-spacing: -0.2px;
        }

        .grid-menu {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
          gap: 16px;
          margin-bottom: 32px;
        }
        .menu-card {
          background: white;
          padding: 18px 24px;
          border-radius: 24px;
          display: flex;
          align-items: center;
          gap: 20px;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.02);
          border: 1px solid var(--border);
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .menu-card:hover {
          box-shadow: 0 10px 20px rgba(0, 137, 71, 0.05);
          border-color: rgba(0, 137, 71, 0.25);
          background: #fbfdfc;
        }
        .icon-box {
          width: 54px;
          height: 54px;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 10px rgba(0,0,0,0.02);
        }
        .menu-text {
          flex: 1;
        }
        .menu-text h4 {
          font-size: 1.1rem;
          margin-bottom: 3px;
          font-weight: 700;
          color: var(--text-main);
        }
        .menu-text p {
          font-size: 0.825rem;
          color: var(--text-muted);
          margin: 0;
        }
        .arrow {
          color: var(--text-muted);
          opacity: 0.6;
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
          border: none;
          cursor: pointer;
        }
        .btn-logout:hover {
          background: #ffe4e6;
        }
        
        .message-box {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 16px 20px;
          border-radius: 16px;
          margin-bottom: 24px;
          font-size: 0.95rem;
          font-weight: 600;
          line-height: 1.4;
          box-shadow: 0 4px 10px rgba(0,0,0,0.02);
        }
        .error-message {
          color: #ef4444;
          background: #fef2f2;
          border: 1px solid rgba(239, 68, 68, 0.15);
        }
        .success-message {
          color: #059669;
          background: #ecfdf5;
          border: 1px solid rgba(5, 150, 105, 0.15);
        }

        @media (max-width: 768px) {
          .form-sections-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }
          .profile-main-row {
            flex-direction: column;
            text-align: center;
            gap: 20px;
          }
          .contact-info-grid {
            grid-template-columns: 1fr;
          }
          .full-width-item {
            grid-column: span 1;
          }
          .btn-edit-action {
            position: static;
            margin: 20px auto 0 auto;
            width: fit-content;
          }
          .glass-profile {
            padding: 24px;
          }
        }
      `}</style>
    </div>
  );
};

export default Profile;
