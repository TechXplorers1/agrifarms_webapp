import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Tractor, Truck, Users, Sprout, ChevronLeft, Upload, Check, AlertCircle, MapPin, Compass, Loader2, ChevronDown, ChevronUp, Plus, Trash2, X } from 'lucide-react';
import { useAuth } from '../services/AuthContext';
import { apiService } from '../services/apiService';
import { resolveCoordinates } from '../services/locationHelper';

const UploadItem: React.FC = () => {
  const location = useLocation();
  const editData = location.state?.edit;
  const initialCategory = location.state?.category;

  const [category, setCategory] = useState<'Equipment' | 'Services' | 'Vehicles' | 'Workers' | null>(initialCategory || null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [formData, setFormData] = useState<any>(editData || {
    isAvailable: true,
    approvalStatus: 'PENDING',
    rating: 0,
    village: '',
    district: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Worker Skills & Allocation States
  const [dbSkills, setDbSkills] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [skillAllocations, setSkillAllocations] = useState<Record<string, { male: number; female: number }>>({});
  const [newSkillName, setNewSkillName] = useState('');
  const [showCustomSkillInput, setShowCustomSkillInput] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Vehicle Category States
  const [dbVehicleCategories, setDbVehicleCategories] = useState<string[]>([]);
  const [newVehicleCategoryName, setNewVehicleCategoryName] = useState('');
  const [showCustomCategoryInput, setShowCustomCategoryInput] = useState(false);

  const handleUploadBoxClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG/JPEG/GIF).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Selected file exceeds the 5MB size limit.');
      return;
    }

    setIsUploading(true);
    try {
      const response = await apiService.uploadMedia(file);
      if (response && response.data && response.data.url) {
        const uploadedUrl = response.data.url;
        setFormData((prev: any) => ({
          ...prev,
          imageUrl: uploadedUrl
        }));
      } else {
        throw new Error('Image upload failed.');
      }
    } catch (err: any) {
      console.error('Failed to upload image:', err);
      alert(err?.response?.data?.message || 'Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  useEffect(() => {
    if (editData) {
      setFormData(editData);
      if (initialCategory) setCategory(initialCategory);
    }
  }, [editData, initialCategory]);

  // Fetch all available skills and vehicle categories from database
  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const res = await apiService.getSkills();
        if (res && res.data) {
          setDbSkills(res.data.map((s: any) => s.name));
        }
      } catch (err) {
        console.error('Failed to fetch skills:', err);
      }
    };
    const fetchVehicleCategories = async () => {
      try {
        const res = await apiService.getVehicleCategories();
        if (res && res.data) {
          setDbVehicleCategories(res.data.map((vc: any) => vc.name));
        }
      } catch (err) {
        console.error('Failed to fetch vehicle categories:', err);
      }
    };
    fetchSkills();
    fetchVehicleCategories();
  }, []);

  // Initialize selected skills and allocations when editing a worker group
  useEffect(() => {
    if (editData) {
      if (editData.roles && editData.roles.length > 0) {
        const skillsSet = new Set<string>();
        const allocations: Record<string, { male: any; female: any }> = {};

        editData.roles.forEach((r: any) => {
          skillsSet.add(r.taskName);
          if (!allocations[r.taskName]) {
            allocations[r.taskName] = { male: '', female: '' };
          }
          if (r.gender === 'MALE') {
            allocations[r.taskName].male = r.count === 0 ? '' : r.count;
          } else if (r.gender === 'FEMALE') {
            allocations[r.taskName].female = r.count === 0 ? '' : r.count;
          }
        });

        setSelectedSkills(Array.from(skillsSet));
        setSkillAllocations(allocations);
      } else if (editData.skills) {
        const skillsArray = editData.skills.split(',').map((s: string) => s.trim()).filter(Boolean);
        setSelectedSkills(skillsArray);
        const allocations: Record<string, { male: any; female: any }> = {};
        skillsArray.forEach((s: string) => {
          allocations[s] = { male: '', female: '' };
        });
        setSkillAllocations(allocations);
      }
    }
  }, [editData]);

  const handleAddNewSkill = async () => {
    const trimmed = newSkillName.trim();
    if (!trimmed) return;
    try {
      const res = await apiService.createSkill({ name: trimmed });
      if (res && res.data) {
        const addedName = res.data.name;
        if (!dbSkills.includes(addedName)) {
          setDbSkills(prev => [...prev, addedName]);
        }
        if (!selectedSkills.includes(addedName)) {
          setSelectedSkills(prev => [...prev, addedName]);
          setSkillAllocations(prev => ({
            ...prev,
            [addedName]: { male: '', female: '' }
          }));
        }
        setNewSkillName('');
        setShowCustomSkillInput(false);
      }
    } catch (err) {
      console.error('Failed to add custom skill:', err);
      alert('Failed to add new skill. It might already exist.');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value
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

            setFormData((prev: any) => ({
              ...prev,
              street: street,
              village: village,
              district: district,
              state: state,
              pincode: pincode,
              latitude: latitude.toFixed(6),
              longitude: longitude.toFixed(6)
            }));

            alert(`GPS location detected! Village & District auto-populated successfully.`);
          }
        } catch (err) {
          console.error("GPS Reverse-geocoding failed:", err);
          alert("Failed to reverse-geocode coordinates. Using coordinates directly.");
          setFormData((prev: any) => ({
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const id = user?.id || JSON.parse(localStorage.getItem('agrifarm_user') || '{}').id;
      let finalPayload = { ...formData, ownerId: id };

      if (category === 'Workers') {
        const totalMaleAllocated = selectedSkills.reduce((sum, skill) => {
          const alloc = skillAllocations[skill] || { male: '' };
          return sum + (alloc.male === '' ? 0 : Number(alloc.male));
        }, 0);

        const totalFemaleAllocated = selectedSkills.reduce((sum, skill) => {
          const alloc = skillAllocations[skill] || { female: '' };
          return sum + (alloc.female === '' ? 0 : Number(alloc.female));
        }, 0);

        const totalMaleExpected = Number(formData.maleCount || 0);
        const totalFemaleExpected = Number(formData.femaleCount || 0);

        if (totalMaleAllocated !== totalMaleExpected) {
          alert(`Validation Error: The sum of male workers allocated to skills (${totalMaleAllocated}) must match the total Male Count (${totalMaleExpected}) exactly.`);
          setLoading(false);
          return;
        }

        if (totalFemaleAllocated !== totalFemaleExpected) {
          alert(`Validation Error: The sum of female workers allocated to skills (${totalFemaleAllocated}) must match the total Female Count (${totalFemaleExpected}) exactly.`);
          setLoading(false);
          return;
        }

        // Build skills list string
        finalPayload.skills = selectedSkills.join(', ');

        // Build roles payload
        const rolesList: any[] = [];
        selectedSkills.forEach((skill) => {
          const alloc = skillAllocations[skill] || { male: '', female: '' };
          const mCount = alloc.male === '' ? 0 : Number(alloc.male);
          const fCount = alloc.female === '' ? 0 : Number(alloc.female);
          if (mCount > 0) {
            rolesList.push({
              gender: 'MALE',
              count: mCount,
              taskName: skill
            });
          }
          if (fCount > 0) {
            rolesList.push({
              gender: 'FEMALE',
              count: fCount,
              taskName: skill
            });
          }
        });
        finalPayload.roles = rolesList;
      }

      if (category === 'Equipment') {
        finalPayload.operatorAvailable = !!formData.operatorPrice && parseFloat(String(formData.operatorPrice)) > 0;
      }

      // Auto-resolve manual coordinates if not detected via GPS already
      if (!formData.latitude || !formData.longitude || String(formData.latitude).trim() === '' || String(formData.longitude).trim() === '') {
        try {
          const coords = await resolveCoordinates(formData.village, formData.district, formData.state);
          if (coords) {
            finalPayload.latitude = coords.latitude;
            finalPayload.longitude = coords.longitude;
          }
        } catch (err) {
          console.error("Upload manual address geocoding failed:", err);
        }
      }

      if (editData) {
        const assetId = editData.vehicleId || editData.equipmentId || editData.serviceId || editData.groupId;
        if (category === 'Equipment') await apiService.updateEquipment(assetId, finalPayload);
        else if (category === 'Services') await apiService.updateService(assetId, finalPayload);
        else if (category === 'Vehicles') await apiService.updateVehicle(assetId, finalPayload);
        else if (category === 'Workers') await apiService.updateWorkerGroup(assetId, finalPayload);
      } else {
        if (category === 'Equipment') await apiService.createEquipment(finalPayload);
        else if (category === 'Services') await apiService.createService(finalPayload);
        else if (category === 'Vehicles') await apiService.createVehicle(finalPayload);
        else if (category === 'Workers') await apiService.createWorkerGroup(finalPayload);
      }

      setSuccess(true);
      setTimeout(() => navigate('/manage-assets'), 2000);
    } catch (error) {
      console.error('Error uploading item:', error);
      alert('Error saving item. Please try again.');
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
              <input name="brandModel" value={formData.brandModel || ''} placeholder="e.g. John Deere 5310" onChange={handleInputChange} required />
            </div>
            <div className="input-group">
              <label>Category</label>
              <select name="category" value={formData.category || ''} onChange={handleInputChange} required>
                <option value="">Select Category</option>
                <option value="Tractor">Tractor</option>
                <option value="Harvester">Harvester</option>
                <option value="Plough">Plough</option>
                <option value="Seeder">Seeder</option>
                <option value="Sprayer">Sprayer</option>
              </select>
            </div>
            <div className="input-group">
              <label>Horse Power (HP)</label>
              <input type="number" name="hp" value={formData.hp || ''} placeholder="50" onChange={handleInputChange} required />
            </div>
            <div className="input-group">
              <label>Price Per Hour (₹)</label>
              <input type="number" name="pricePerHour" value={formData.pricePerHour || ''} placeholder="500" onChange={handleInputChange} required />
            </div>
            <div className="input-group">
              <label>Operator Price (₹/hr)</label>
              <input type="number" name="operatorPrice" value={formData.operatorPrice || ''} placeholder="200" onChange={handleInputChange} />
            </div>
            <div className="input-group">
              <label>Condition Status</label>
              <select name="conditionStatus" value={formData.conditionStatus || 'EXCELLENT'} onChange={handleInputChange}>
                <option value="EXCELLENT">Excellent</option>
                <option value="GOOD">Good</option>
                <option value="FAIR">Fair</option>
              </select>
            </div>
          </div>
        );
      case 'Vehicles':
        {
          const isDriverIncluded = formData.driverIncluded === true;
          return (
            <div className="form-fields grid-2">
              <div className="input-group" style={{ position: 'relative' }}>
                <label>Vehicle Type (Category)</label>
                <select
                  name="vehicleType"
                  value={formData.vehicleType || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'Others') {
                      setShowCustomCategoryInput(true);
                      setFormData((prev: any) => ({ ...prev, vehicleType: '' }));
                    } else {
                      setShowCustomCategoryInput(false);
                      setFormData((prev: any) => ({ ...prev, vehicleType: val }));
                    }
                  }}
                  required
                >
                  <option value="">Select Category</option>
                  {dbVehicleCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="Others">Others (Add custom category)</option>
                </select>

                {showCustomCategoryInput && (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <input
                      type="text"
                      placeholder="Type new category..."
                      value={newVehicleCategoryName}
                      onChange={(e) => setNewVehicleCategoryName(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                        fontSize: '0.85rem'
                      }}
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        const trimmed = newVehicleCategoryName.trim();
                        if (!trimmed) return;
                        try {
                          const res = await apiService.createVehicleCategory({ name: trimmed });
                          if (res && res.data) {
                            const addedName = res.data.name;
                            if (!dbVehicleCategories.includes(addedName)) {
                              setDbVehicleCategories(prev => [...prev, addedName]);
                            }
                            setFormData((prev: any) => ({ ...prev, vehicleType: addedName }));
                            setNewVehicleCategoryName('');
                            setShowCustomCategoryInput(false);
                          }
                        } catch (err) {
                          console.error('Failed to add custom category:', err);
                          alert('Failed to add category. It might already exist.');
                        }
                      }}
                      className="btn-primary"
                      style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700 }}
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCustomCategoryInput(false);
                        setNewVehicleCategoryName('');
                      }}
                      style={{
                        background: '#f1f5f9',
                        border: 'none',
                        color: '#64748b',
                        padding: '8px',
                        borderRadius: '8px',
                        cursor: 'pointer'
                      }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>

              <div className="input-group">
                <label>Vehicle Number</label>
                <input name="vehicleNumber" value={formData.vehicleNumber || ''} placeholder="PB-XX-XXXX" onChange={handleInputChange} required />
              </div>
              <div className="input-group">
                <label>Load Capacity (Tons)</label>
                <input type="number" name="loadCapacity" value={formData.loadCapacity || ''} placeholder="2" onChange={handleInputChange} required />
              </div>
              <div className="input-group">
                <label>Price Per KM / Trip (₹)</label>
                <input type="number" name="pricePerKmOrTrip" value={formData.pricePerKmOrTrip || ''} placeholder="20" onChange={handleInputChange} required />
              </div>

              <div className="input-group" style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontWeight: 800, marginBottom: '8px' }}>Operator Option</label>
                <div style={{ display: 'flex', gap: '24px', marginTop: '4px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600 }}>
                    <input
                      type="radio"
                      name="driverIncluded"
                      checked={!isDriverIncluded}
                      onChange={() => setFormData((prev: any) => ({ ...prev, driverIncluded: false, operatorPrice: '' }))}
                    />
                    <span>Without Operator (Self Drive)</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600 }}>
                    <input
                      type="radio"
                      name="driverIncluded"
                      checked={isDriverIncluded}
                      onChange={() => setFormData((prev: any) => ({ ...prev, driverIncluded: true }))}
                    />
                    <span>With Operator</span>
                  </label>
                </div>
              </div>

              {isDriverIncluded && (
                <div className="input-group" style={{ gridColumn: 'span 2' }}>
                  <label>Operator Price (₹/trip or km)</label>
                  <input
                    type="number"
                    name="operatorPrice"
                    value={formData.operatorPrice || ''}
                    placeholder="e.g. 500"
                    onChange={handleInputChange}
                    required
                  />
                </div>
              )}
            </div>
          );
        }
      case 'Workers':
        return (
          <div className="form-fields">
            {/* Row 1: Group Name + Counts */}
            <div className="grid-2" style={{ marginBottom: '24px' }}>
              <div className="input-group">
                <label>Group Name</label>
                <input name="groupName" value={formData.groupName || ''} placeholder="e.g. Skilled Harvest Team" onChange={handleInputChange} required />
              </div>
              <div className="grid-2">
                <div className="input-group">
                  <label>Male Count</label>
                  <input type="number" name="maleCount" value={formData.maleCount || ''} placeholder="0" onChange={handleInputChange} required />
                </div>
                <div className="input-group">
                  <label>Female Count</label>
                  <input type="number" name="femaleCount" value={formData.femaleCount || ''} placeholder="0" onChange={handleInputChange} required />
                </div>
              </div>
            </div>

            {/* Male Pricing */}
            <div className="worker-pricing-block" style={{
              background: 'linear-gradient(135deg, #e3f2fd 0%, #f0f8ff 100%)',
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '16px',
              border: '1px solid #bbdefb'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <span style={{ fontSize: '1.2rem' }}>👨‍🌾</span>
                <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1565c0' }}>Male Worker Rates</span>
              </div>
              <div className="grid-2">
                <div className="input-group">
                  <label>Daily Rate per Male (₹/day)</label>
                  <input type="number" name="pricePerMale" value={formData.pricePerMale || ''} placeholder="e.g. 500" onChange={handleInputChange} required />
                </div>
                <div className="input-group">
                  <label>Hourly Rate per Male (₹/hr)</label>
                  <input type="number" name="pricePerMaleHourly" value={formData.pricePerMaleHourly || ''} placeholder="e.g. 80" onChange={handleInputChange} />
                </div>
              </div>
            </div>

            {/* Female Pricing */}
            <div className="worker-pricing-block" style={{
              background: 'linear-gradient(135deg, #fce4ec 0%, #fff0f5 100%)',
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '16px',
              border: '1px solid #f8bbd0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <span style={{ fontSize: '1.2rem' }}>👩‍🌾</span>
                <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#880e4f' }}>Female Worker Rates</span>
              </div>
              <div className="grid-2">
                <div className="input-group">
                  <label>Daily Rate per Female (₹/day)</label>
                  <input type="number" name="pricePerFemale" value={formData.pricePerFemale || ''} placeholder="e.g. 400" onChange={handleInputChange} required />
                </div>
                <div className="input-group">
                  <label>Hourly Rate per Female (₹/hr)</label>
                  <input type="number" name="pricePerFemaleHourly" value={formData.pricePerFemaleHourly || ''} placeholder="e.g. 65" onChange={handleInputChange} />
                </div>
              </div>
            </div>

            {/* Skills Dropdown with custom styling */}
            <div className="input-group" style={{ marginTop: '8px', position: 'relative' }}>
              <label>Skills / Expertise</label>
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setShowDropdown(!showDropdown)}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                    background: 'white',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                    textAlign: 'left'
                  }}
                >
                  <span style={{ color: selectedSkills.length > 0 ? 'var(--text-main)' : '#94a3b8' }}>
                    {selectedSkills.length > 0
                      ? `${selectedSkills.length} selected (${selectedSkills.join(', ')})`
                      : 'Select Skills...'
                    }
                  </span>
                  {showDropdown ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>

                {showDropdown && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: 'white',
                    borderRadius: '12px',
                    boxShadow: 'var(--shadow-lg)',
                    border: '1px solid var(--border)',
                    marginTop: '6px',
                    zIndex: 100,
                    maxHeight: '260px',
                    overflowY: 'auto',
                    padding: '8px'
                  }}>
                    {dbSkills.map((skill) => (
                      <label
                        key={skill}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          transition: 'background 0.2s',
                          fontWeight: selectedSkills.includes(skill) ? 700 : 500,
                          fontSize: '0.9rem'
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <input
                          type="checkbox"
                          checked={selectedSkills.includes(skill)}
                          onChange={() => {
                            if (selectedSkills.includes(skill)) {
                              setSelectedSkills(prev => prev.filter(s => s !== skill));
                              setSkillAllocations(prev => {
                                const next = { ...prev };
                                delete next[skill];
                                return next;
                              });
                            } else {
                              setSelectedSkills(prev => [...prev, skill]);
                              setSkillAllocations(prev => ({
                                ...prev,
                                [skill]: { male: '', female: '' }
                              }));
                            }
                          }}
                        />
                        <span>{skill}</span>
                      </label>
                    ))}

                    <div style={{ borderTop: '1px solid var(--border)', marginTop: '6px', paddingTop: '6px' }}>
                      {!showCustomSkillInput ? (
                        <button
                          type="button"
                          onClick={() => setShowCustomSkillInput(true)}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '10px 12px',
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--primary)',
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            textAlign: 'left'
                          }}
                        >
                          <Plus size={16} />
                          <span>Others (Add custom skill)</span>
                        </button>
                      ) : (
                        <div style={{ display: 'flex', gap: '8px', padding: '6px 12px' }}>
                          <input
                            type="text"
                            placeholder="Type new skill..."
                            value={newSkillName}
                            onChange={(e) => setNewSkillName(e.target.value)}
                            style={{
                              flex: 1,
                              padding: '8px 12px',
                              borderRadius: '8px',
                              border: '1px solid var(--border)',
                              fontSize: '0.85rem'
                            }}
                          />
                          <button
                            type="button"
                            onClick={handleAddNewSkill}
                            className="btn-primary"
                            style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700 }}
                          >
                            Add
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowCustomSkillInput(false);
                              setNewSkillName('');
                            }}
                            style={{
                              background: '#f1f5f9',
                              border: 'none',
                              color: '#64748b',
                              padding: '8px',
                              borderRadius: '8px',
                              cursor: 'pointer'
                            }}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Selected Skills allocation forms */}
            {selectedSkills.length > 0 && (
              <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <label style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                  Allocate Workers Per Skill
                </label>
                {selectedSkills.map(skill => {
                  const alloc = skillAllocations[skill] || { male: 0, female: 0 };
                  return (
                    <div key={skill} style={{
                      background: '#f8fafc',
                      borderRadius: '16px',
                      padding: '16px',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--primary)' }}>
                          {skill}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSkills(prev => prev.filter(s => s !== skill));
                            setSkillAllocations(prev => {
                              const next = { ...prev };
                              delete next[skill];
                              return next;
                            });
                          }}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Trash2 size={12} />
                          <span>Remove</span>
                        </button>
                      </div>
                      <div className="grid-2">
                        <div className="input-group" style={{ marginBottom: 0 }}>
                          <label style={{ fontSize: '0.78rem' }}>Male Workers count for {skill}</label>
                          <input
                            type="number"
                            min="0"
                            max={formData.maleCount || 0}
                            value={alloc.male ?? ''}
                            onChange={(e) => {
                              const valStr = e.target.value;
                              const val = valStr === '' ? '' : Math.max(0, parseInt(valStr) || 0);
                              setSkillAllocations(prev => ({
                                ...prev,
                                [skill]: { ...prev[skill], male: val }
                              }));
                            }}
                            placeholder="0"
                          />
                          <span style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px' }}>
                            Max available: {formData.maleCount || 0}
                          </span>
                        </div>
                        <div className="input-group" style={{ marginBottom: 0 }}>
                          <label style={{ fontSize: '0.78rem' }}>Female Workers count for {skill}</label>
                          <input
                            type="number"
                            min="0"
                            max={formData.femaleCount || 0}
                            value={alloc.female ?? ''}
                            onChange={(e) => {
                              const valStr = e.target.value;
                              const val = valStr === '' ? '' : Math.max(0, parseInt(valStr) || 0);
                              setSkillAllocations(prev => ({
                                ...prev,
                                [skill]: { ...prev[skill], female: val }
                              }));
                            }}
                            placeholder="0"
                          />
                          <span style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px' }}>
                            Max available: {formData.femaleCount || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Allocation Summary */}
            {selectedSkills.length > 0 && (() => {
              const totalMaleAllocated = selectedSkills.reduce((sum, skill) => {
                const alloc = skillAllocations[skill] || { male: '' };
                return sum + (alloc.male === '' ? 0 : Number(alloc.male));
              }, 0);

              const totalFemaleAllocated = selectedSkills.reduce((sum, skill) => {
                const alloc = skillAllocations[skill] || { female: '' };
                return sum + (alloc.female === '' ? 0 : Number(alloc.female));
              }, 0);

              const maleExpected = Number(formData.maleCount || 0);
              const femaleExpected = Number(formData.femaleCount || 0);

              return (
                <div style={{
                  marginTop: '20px',
                  padding: '16px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                    Allocation Summary
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '0.9rem', fontWeight: 800 }}>
                    <div style={{ color: totalMaleAllocated === maleExpected ? '#16a34a' : '#dc2626' }}>
                      👨‍🌾 Male: {totalMaleAllocated} / {maleExpected} allocated
                    </div>
                    <div style={{ color: totalFemaleAllocated === femaleExpected ? '#16a34a' : '#dc2626' }}>
                      👩‍🌾 Female: {totalFemaleAllocated} / {femaleExpected} allocated
                    </div>
                  </div>
                  {(totalMaleAllocated !== maleExpected || totalFemaleAllocated !== femaleExpected) && (
                    <div style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 600, marginTop: '4px' }}>
                      * Note: The sum of allocated workers per skill must match your total Male/Female counts exactly before submitting.
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        );
      case 'Services':
        return (
          <div className="form-fields grid-2">
            <div className="input-group">
              <label>Service Type</label>
              <select name="serviceType" value={formData.serviceType || ''} onChange={handleInputChange} required>
                <option value="">Select Service Type</option>
                <option value="Land Levelling">Land Levelling</option>
                <option value="Harvesting">Harvesting</option>
                <option value="Sowing/Seeding">Sowing/Seeding</option>
                <option value="Pesticide Spraying">Pesticide Spraying</option>
                <option value="Irrigation Service">Irrigation Service</option>
                <option value="Ploughing">Ploughing</option>
                <option value="Soil Testing">Soil Testing</option>
                <option value="Crop Advisory">Crop Advisory</option>
                <option value="Other Service">Other Service</option>
              </select>
            </div>
            <div className="input-group">
              <label>Business Name</label>
              <input name="businessName" value={formData.businessName || ''} onChange={handleInputChange} required />
            </div>
            <div className="input-group">
              <label>Base Price Rate (₹)</label>
              <input type="number" name="priceRate" value={formData.priceRate || ''} onChange={handleInputChange} required />
            </div>
            <div className="input-group">
              <label>Operator Price (₹/hr)</label>
              <input type="number" name="operatorPrice" value={formData.operatorPrice || ''} onChange={handleInputChange} />
            </div>
            <div className="input-group span-2">
              <label>Detailed Description</label>
              <textarea name="description" value={formData.description || ''} onChange={handleInputChange} placeholder="Tell users more about your service..."></textarea>
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
        <h1>{category ? (editData ? `Edit ${category}` : `Add ${category}`) : 'What are you listing?'}</h1>
      </div>

      {!category ? (
        <div className="category-selection-grid">
          {[
            { id: 'Equipment', icon: Tractor, label: 'Equipment', color: '#e8f5e9', fg: '#2e7d32' },
            { id: 'Vehicles', icon: Truck, label: 'Transport', color: '#e3f2fd', fg: '#1565c0' },
            { id: 'Workers', icon: Users, label: 'Workers', color: '#f3e5f5', fg: '#6a1b9a' },
            { id: 'Services', icon: Sprout, label: 'Service', color: '#fff3e0', fg: '#e65100' },
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
              <h2>{editData ? 'Update Successful!' : 'Listing Successful!'}</h2>
              <p>Your item has been submitted for moderation.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-section">
                <h3><AlertCircle size={18} /> Basic Information</h3>
                {renderFormFields()}
              </div>

              <div className="form-section">
                <div className="flex justify-between items-center" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                  <h3 style={{ border: 'none', margin: 0, padding: 0 }}><MapPin size={18} /> Location Details</h3>
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
                    <span>{isDetectingLocation ? 'Detecting...' : 'Detect GPS'}</span>
                  </button>
                </div>
                <div className="grid-2" style={{ gap: '16px 24px' }}>
                  <div className="input-group">
                    <label>House No / Flat / Plot</label>
                    <input name="houseNo" value={formData.houseNo || ''} placeholder="e.g. D-14" onChange={handleInputChange} required />
                  </div>
                  <div className="input-group">
                    <label>Street / Area / Colony</label>
                    <input name="street" value={formData.street || ''} placeholder="e.g. Main Road" onChange={handleInputChange} required />
                  </div>
                  <div className="input-group">
                    <label>Village / City / Town</label>
                    <input name="village" value={formData.village || ''} placeholder="Enter Village" onChange={handleInputChange} required />
                  </div>
                  <div className="input-group">
                    <label>District</label>
                    <input name="district" value={formData.district || ''} placeholder="Enter District" onChange={handleInputChange} required />
                  </div>
                  <div className="input-group">
                    <label>State</label>
                    <input name="state" value={formData.state || ''} placeholder="Enter State" onChange={handleInputChange} required />
                  </div>
                  <div className="input-group">
                    <label>Pincode</label>
                    <input name="pincode" value={formData.pincode || ''} placeholder="Enter Pincode" onChange={handleInputChange} required />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3><Upload size={18} /> Media</h3>
                <div
                  className="image-upload-box"
                  onClick={handleUploadBoxClick}
                  style={{
                    position: 'relative',
                    overflow: 'hidden',
                    minHeight: '200px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: formData.imageUrl ? '2px solid var(--primary-light)' : '2px dashed var(--border)',
                    background: formData.imageUrl ? 'rgba(0,0,0,0.02)' : 'transparent',
                    cursor: 'pointer'
                  }}
                >
                  {isUploading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                      <Loader2 className="animate-spin" size={32} color="var(--primary)" />
                      <p style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Uploading photo...</p>
                    </div>
                  ) : formData.imageUrl ? (
                    <>
                      <img
                        src={apiService.getFullImageUrl(formData.imageUrl)}
                        alt="Uploaded Preview"
                        style={{
                          width: '100%',
                          height: '200px',
                          objectFit: 'cover',
                          borderRadius: '16px'
                        }}
                      />
                      <div style={{
                        position: 'absolute',
                        bottom: '12px',
                        right: '12px',
                        background: 'rgba(15, 23, 42, 0.75)',
                        color: 'white',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        zIndex: 10
                      }}>
                        <Upload size={14} />
                        <span>Change Photo</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <Upload size={32} className="text-slate-300" />
                      <p style={{ fontWeight: 600, color: 'var(--text-main)' }}>Click to upload item photos</p>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Max size: 5MB</span>
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
              </div>

              <div className="form-footer">
                {!editData && <button type="button" className="btn-cancel" onClick={() => setCategory(null)}>Back</button>}
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Submitting...' : (editData ? 'Save Changes' : 'List Item Now')}
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
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default UploadItem;

