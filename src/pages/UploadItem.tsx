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
    approvalStatus: 'Approved',
    rating: 0,
    village: '',
    mandal: '',
    district: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const { user } = useAuth();
  const navigate = useNavigate();

  const [isUploading, setIsUploading] = useState(false);

  // Helper: render a red error message under a field
  const errMsg = (key: string) =>
    fieldErrors[key] ? (
      <span style={{
        display: 'flex', alignItems: 'center', gap: '5px',
        color: '#dc2626', fontSize: '0.78rem', fontWeight: 600,
        marginTop: '5px', animationName: 'fadeIn', animationDuration: '0.2s'
      }}>
        <AlertCircle size={13} />
        {fieldErrors[key]}
      </span>
    ) : null;

  const clearError = (key: string) => {
    if (fieldErrors[key]) {
      setFieldErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
    }
  };
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Worker Skills & Allocation States
  const [dbSkills, setDbSkills] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [skillAllocations, setSkillAllocations] = useState<Record<string, { male: number | string; female: number | string }>>({});
  const [newSkillName, setNewSkillName] = useState('');
  const [showCustomSkillInput, setShowCustomSkillInput] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Vehicle Category States
  const [dbVehicleCategories, setDbVehicleCategories] = useState<string[]>([]);
  const [newVehicleCategoryName, setNewVehicleCategoryName] = useState('');
  const [showCustomCategoryInput, setShowCustomCategoryInput] = useState(false);

  // Equipment Brand / Make / Model States
  const [showCustomBrandInput, setShowCustomBrandInput] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [brandList, setBrandList] = useState(['Mahindra', 'Sonalika', 'Swaraj', 'John Deere', 'Massey Ferguson', 'New Holland']);
  const [selectedEquipMake, setSelectedEquipMake] = useState<string | null>(null);
  const [selectedEquipModel, setSelectedEquipModel] = useState<string | null>(null);

  // Equipment Attached / Trolley chip states
  const [selectedAttachedEquipments, setSelectedAttachedEquipments] = useState<string[]>([]);
  const [otherAttachedInput, setOtherAttachedInput] = useState('');
  const [showOtherAttachedInput, setShowOtherAttachedInput] = useState(false);
  const [attachedEquipmentOptions, setAttachedEquipmentOptions] = useState([
    'Mouldboard Plow', 'Disc Plow', 'Chisel Plow', 'Rotavator (Rotary Tiller)', 'Disc Harrow', 'Other'
  ]);

  const [selectedTrolleyTypes, setSelectedTrolleyTypes] = useState<string[]>([]);
  const [otherTrolleyInput, setOtherTrolleyInput] = useState('');
  const [showOtherTrolleyInput, setShowOtherTrolleyInput] = useState(false);
  const [trolleyTypeOptions, setTrolleyTypeOptions] = useState([
    '2-Wheel Hydraulic', '4-Wheel Hydraulic', '2-Wheel Non-Tipping', '4-Wheel Non-Tipping', 'Other'
  ]);

  // Harvester Capacities State
  const [harvestCapacitiesMap, setHarvestCapacitiesMap] = useState<Record<string, string[]>>({});
  const [currentHarvestType, setCurrentHarvestType] = useState<string>('');
  const [currentOtherHarvestType, setCurrentOtherHarvestType] = useState<string>('');
  const [currentHarvestCapacity, setCurrentHarvestCapacity] = useState<string>('');
  const [currentHarvestUnit, setCurrentHarvestUnit] = useState<string>('HP');
  const harvestCapacityUnits = ['HP', 'Ft', 'Bags/Hr', 'Tons/Hr'];
  const [availableHarvestTypes, setAvailableHarvestTypes] = useState([
    'Track / Chain Model (Wet Land)', 'Wheel Harvester (4 Wheeler Tyres)', 'Wheel Harvester (2 Tyres)',
    'Combine Harvester', 'Paddy Harvester', 'Mini Harvester', 'Sugarcane Harvester', 'Maize Harvester', 'Other'
  ]);

  // Sprayer Capacities State
  const [sprayerCapacitiesMap, setSprayerCapacitiesMap] = useState<Record<string, string[]>>({});
  const [currentSprayerType, setCurrentSprayerType] = useState<string>('');
  const [currentOtherSprayerType, setCurrentOtherSprayerType] = useState<string>('');
  const [currentSprayerCapacity, setCurrentSprayerCapacity] = useState<string>('');
  const [availableSprayerTypes, setAvailableSprayerTypes] = useState([
    'Boom Sprayer', 'Knapsack Sprayer', 'Tractor Mounted Sprayer', 'Battery Sprayer',
    'Hand Compression Sprayer', 'Power Sprayer', 'Aerial / Drone Sprayer', 'Other'
  ]);

  // Operator toggle state for Equipment
  const [operatorAvailable, setOperatorAvailable] = useState(false);

  // VehicleData inline (mirrors vehicle_data.dart)
  const vehicleData: Record<string, Record<string, string[]>> = {
    Tractors: {
      Mahindra: ['575 DI', '275 DI TU', '475 DI', 'Yuvo 575 DI', 'Jivo 245 DI', 'Arjun Novo 605 Di-i', 'XP Plus 265 DI', 'Oja 3140', '585 DI XP Plus', 'Other'],
      Swaraj: ['744 FE', '855 FE', '735 FE', '717', '963 FE', '724 XM', '742 XT', '843 XM', 'Other'],
      'John Deere': ['5310', '5050 D', '5105', '5405', '3028 EN', '5045 D', '5075 E', '5210', 'Other'],
      Sonalika: ['DI 745 III', 'DI 35', 'DI 60', 'DI 750 III', 'Tiger 55', 'GT 20', 'Sikander DI 35', 'Other'],
      'Escorts Powertrac': ['Euro 50', '439 DS Plus', '434 DS', 'Euro 60', 'ALT 4000', 'Other'],
      Farmtrac: ['60 Powermaxx', '45', '6055 Powermaxx', 'Champion 35', 'Atom 26', 'Other'],
      'New Holland': ['3630 TX Special Edition', '3230 TX', '3600-2 TX', '4710', '5620 TX Plus', 'Other'],
      Eicher: ['380', '242', '551', '333', '485', '557', '188', 'Other'],
      Kubota: ['MU4501 2WD', 'L4508', 'A211N', 'NeoStar B2741', 'MU5501', 'Other'],
      Other: [],
    },
    Harvesters: {
      Preet: ['987', '949', '749', 'Other'],
      Claas: ['Crop Tiger 30', 'Crop Tiger 40', 'Dominator 40', 'Other'],
      Dasmesh: ['9100', '7100', '3100', 'Other'],
      Kartar: ['4000', '3500', 'Other'],
      Malkit: ['897', '997', 'Other'],
      Swaraj: ['8100', 'Pro Combine 7060', 'Other'],
      'John Deere': ['W50', 'W70', 'Other'],
      Mahindra: ['HarvestMaster H12 4WD', 'Other'],
      Other: [],
    },
    JCB: {
      JCB: ['3DX', '3DX Super', '3DX Plus', '4DX', 'Other'],
      Case: ['770', '851', 'Other'],
      CAT: ['424', 'Other'],
      Other: [],
    },
    Trolleys: {
      Standard: ['Hydraulic Tipping', 'Non-Tipping', '2 Wheel', '4 Wheel'],
      Other: [],
    },
    Sprayers: {},
  };

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

      if (editData.brandModel && !editData.brand) {
        const parts = editData.brandModel.split(' ');
        if (parts.length > 1) {
          const brandVal = parts[0];
          const modelVal = parts.slice(1).join(' ');
          setFormData((prev: any) => ({
            ...prev,
            brand: brandVal,
            model: modelVal
          }));
        } else {
          setFormData((prev: any) => ({
            ...prev,
            brand: editData.brandModel,
            model: ''
          }));
        }
      }
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
    clearError(name);
    setFormData((prev: any) => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value
    }));
  };

  // ── Validation ──────────────────────────────────────────────────
  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    // Common location fields
    if (!formData.village?.trim()) errors.village = 'Village / City is required';
    if (!formData.district?.trim()) errors.district = 'District is required';

    if (category === 'Equipment') {
      if (!formData.category) errors.category = 'Please select an equipment category';
      if (!formData.ownerBusinessName?.trim()) errors.ownerBusinessName = 'Owner / Business Name is required';
      const equipCat = formData.category || '';
      const isSprayer = equipCat === 'Sprayers';
      const isTrolley = equipCat === 'Trolleys';
      if (!isSprayer) {
        const hasDropdownMake = selectedEquipMake && selectedEquipMake !== 'Other';
        const hasDropdownModel = selectedEquipModel && selectedEquipModel !== 'Other';
        const hasManualEntry = formData.brandModel?.trim();
        if (!hasDropdownMake && !hasManualEntry) errors.brand = 'Please select or enter a Make / Brand';
        if (hasDropdownMake && !hasDropdownModel && !hasManualEntry) errors.model = 'Please select or enter a Model';
      }
      if (!formData.pricePerDay && !formData.pricePerHour) errors.pricePerDay = isTrolley ? 'Full Day Price is required' : 'Rental Price is required';
      if (operatorAvailable && !formData.operatorPrice) errors.operatorPrice = 'Operator price is required when operator is available';
    }

    if (category === 'Vehicles') {
      if (!formData.ownerBusinessName?.trim()) errors.ownerBusinessName = 'Owner / Business Name is required';
      if (!formData.vehicleType?.trim()) errors.vehicleType = 'Vehicle type / category is required';
      if (!formData.brand?.trim()) errors.brand = 'Brand is required';
      if (!formData.model?.trim()) errors.model = 'Model is required';
      if (!formData.vehicleNumber?.trim()) errors.vehicleNumber = 'Vehicle number is required';
      if (!formData.loadCapacity) errors.loadCapacity = 'Load capacity is required';
      if (!formData.vehicleCondition) errors.vehicleCondition = 'Condition is required';
      if (!formData.pricePerKm) errors.pricePerKm = 'Price per KM is required';
      if (!formData.pricePerHour) errors.pricePerHour = 'Price per hour is required';
      if (formData.driverIncluded && !formData.operatorPrice) errors.operatorPrice = 'Operator price is required';
    }

    if (category === 'Services') {
      if (!formData.serviceName?.trim()) errors.serviceName = 'Service name is required';
      if (!formData.pricePerDay) errors.pricePerDay = 'Price is required';
    }

    if (category === 'Workers') {
      if (!formData.groupName?.trim()) errors.groupName = 'Group name is required';
      if (!formData.maleCount && !formData.femaleCount) errors.maleCount = 'Enter at least one worker count (male or female)';
      if (!formData.pricePerMale && !formData.pricePerFemale) errors.pricePerMale = 'At least one rate (male or female) is required';
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      // Scroll to first error
      setTimeout(() => {
        const firstErrorEl = document.querySelector('[data-error="true"]');
        firstErrorEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
      return false;
    }
    return true;
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
              mandal: formData.mandal || '',
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
    if (!validate()) return;
    setLoading(true);
    try {
      const id = user?.id || JSON.parse(localStorage.getItem('agrifarm_user') || '{}').id;
      let finalPayload = { ...formData, ownerId: id };

      if (category === 'Workers') {
        const totalMaleAllocated = selectedSkills.reduce((sum, skill) => {
          const alloc = skillAllocations[skill] || { male: '' };
          return sum + (String(alloc.male) === '' ? 0 : Number(alloc.male));
        }, 0);

        const totalFemaleAllocated = selectedSkills.reduce((sum, skill) => {
          const alloc = skillAllocations[skill] || { female: '' };
          return sum + (String(alloc.female) === '' ? 0 : Number(alloc.female));
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
          const mCount = String(alloc.male) === '' ? 0 : Number(alloc.male);
          const fCount = String(alloc.female) === '' ? 0 : Number(alloc.female);
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
        finalPayload.operatorAvailable = operatorAvailable;
        // Encode attached equipments and trolley types into description/notes
        if (selectedAttachedEquipments.length > 0) {
          finalPayload.attachedEquipments = selectedAttachedEquipments.join(', ');
        }
        if (selectedTrolleyTypes.length > 0) {
          finalPayload.trolleyTypes = selectedTrolleyTypes.join(', ');
        }

        const equipCat = formData.category;

        if (equipCat === 'Sprayers') {
          finalPayload.sprayerTypes = Object.entries(sprayerCapacitiesMap).map(([k, v]) => `${k} - ${v.join('/')} L`);
          const allCaps: string[] = [];
          Object.values(sprayerCapacitiesMap).forEach(list => allCaps.push(...list));
          finalPayload.sprayerCapacities = Array.from(new Set(allCaps));
        }

        if (equipCat === 'Harvesters') {
          if (Object.keys(harvestCapacitiesMap).length > 0) {
            finalPayload.harvestCapacities = Object.entries(harvestCapacitiesMap).map(([k, v]) => `${k} - ${v.join('/')}`);
          }
        }

        // Set brandModel from Make + Model if selected from dropdowns
        if (selectedEquipMake && selectedEquipModel && selectedEquipModel !== 'Other') {
          finalPayload.brandModel = `${selectedEquipMake} ${selectedEquipModel}`;
          finalPayload.brand = selectedEquipMake;
          finalPayload.model = selectedEquipModel;
        }
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
      setTimeout(() => navigate('/manage-assets', { state: { activeTab: category } }), 1800);
    } catch (error) {
      console.error('Error uploading item:', error);
      alert('Error saving item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderFormFields = () => {
    switch (category) {
      case 'Equipment': {
        const equipCat = formData.category || '';
        const makes = equipCat && vehicleData[equipCat] ? Object.keys(vehicleData[equipCat]).filter(k => k !== 'Other') : [];
        const allMakes = makes.length > 0 ? [...makes, 'Other'] : [];
        const models = equipCat && selectedEquipMake && vehicleData[equipCat]?.[selectedEquipMake]
          ? vehicleData[equipCat][selectedEquipMake]
          : [];
        const showManualBrandModel = allMakes.length === 0 || selectedEquipMake === 'Other' || equipCat === 'Sprayers';
        const showManualModel = showManualBrandModel || models.length === 0 || selectedEquipModel === 'Other';
        const isTrolley = equipCat === 'Trolleys';
        const isTractor = equipCat === 'Tractors';
        const isSprayer = equipCat === 'Sprayers';

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* ─── Equipment Info Card ─── */}
            <div style={{
              background: 'white',
              borderRadius: '20px',
              padding: '28px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
              border: '1px solid #f1f5f9'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                <div style={{ background: 'linear-gradient(135deg, #00aa55, #00cc66)', borderRadius: '10px', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Tractor size={18} color="white" />
                </div>
                <span style={{ fontWeight: 800, fontSize: '1rem', color: '#1a2e1a' }}>Equipment Info</span>
              </div>

              <div className="form-fields grid-2">

                {/* Category */}
                <div className="input-group" data-error={!!fieldErrors.category}>
                  <label>Category *</label>
                  <select
                    name="category"
                    value={equipCat}
                    onChange={(e) => {
                      clearError('category');
                      setFormData((prev: any) => ({ ...prev, category: e.target.value, brand: '', model: '' }));
                      setSelectedEquipMake(null);
                      setSelectedEquipModel(null);
                      setSelectedAttachedEquipments([]);
                      setSelectedTrolleyTypes([]);
                      setOperatorAvailable(e.target.value === 'Sprayers');
                    }}
                    style={{ border: fieldErrors.category ? '2px solid #dc2626' : undefined }}>
                    <option value="">Select Category</option>
                    <option value="Tractors">🚜 Tractors</option>
                    <option value="Harvesters">🌾 Harvesters</option>
                    <option value="Sprayers">💧 Sprayers</option>
                    <option value="Trolleys">🪝 Trolleys</option>
                    <option value="JCB">🏗️ JCB / Excavator</option>
                  </select>
                  {errMsg('category')}
                </div>

                {/* Owner / Business Name */}
                <div className="input-group" data-error={!!fieldErrors.ownerBusinessName}>
                  <label>Owner / Business Name *</label>
                  <input
                    name="ownerBusinessName"
                    value={formData.ownerBusinessName || ''}
                    placeholder="e.g. Baldev Singh Farms"
                    onChange={handleInputChange}
                    style={{ border: fieldErrors.ownerBusinessName ? '2px solid #dc2626' : undefined }} />
                  {errMsg('ownerBusinessName')}
                </div>

                {/* Harvester Capacity Section */}
                {equipCat === 'Harvesters' && (
                  <div className="form-section capacity-section" style={{ gridColumn: '1 / -1', background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginTop: '10px', marginBottom: '10px' }}>
                    <h4 style={{ margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '8px', color: '#1B5E20' }}><AlertCircle size={16} /> Harvesting Equipment Types</h4>
                    <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '15px' }}>Add harvester types and their capacities:</p>

                    <div className="grid-2" style={{ alignItems: 'end', marginBottom: '15px' }}>
                      <div className="input-group">
                        <label>Harvester Type</label>
                        <select
                          value={currentHarvestType}
                          onChange={(e) => setCurrentHarvestType(e.target.value)}>
                          <option value="">Select Harvester Type</option>
                          {availableHarvestTypes.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>

                      {currentHarvestType === 'Other' && (
                        <div className="input-group">
                          <label>Custom Harvester Name</label>
                          <input
                            value={currentOtherHarvestType}
                            placeholder="e.g. Special Harvester"
                            onChange={(e) => setCurrentOtherHarvestType(e.target.value)} />
                        </div>
                      )}
                    </div>

                    <div className="grid-2" style={{ alignItems: 'end', gridTemplateColumns: '1fr 1fr auto', gap: '15px' }}>
                      <div className="input-group">
                        <label>Capacity</label>
                        <input
                          type="number"
                          value={currentHarvestCapacity}
                          placeholder="e.g. 45"
                          onChange={(e) => setCurrentHarvestCapacity(e.target.value)} />
                      </div>
                      <div className="input-group">
                        <label>Unit</label>
                        <select
                          value={currentHarvestUnit}
                          onChange={(e) => setCurrentHarvestUnit(e.target.value)}>
                          {harvestCapacityUnits.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </div>
                      <button
                        type="button"
                        className="btn-primary"
                        style={{ height: '42px', padding: '0 20px', borderRadius: '8px', marginBottom: '8px' }}
                        onClick={() => {
                          if (!currentHarvestType) return;
                          let type = currentHarvestType;
                          if (type === 'Other') {
                            if (!currentOtherHarvestType.trim()) return;
                            type = currentOtherHarvestType.trim();
                            if (!availableHarvestTypes.includes(type)) setAvailableHarvestTypes(prev => [...prev.slice(0, prev.length - 1), type, 'Other']);
                          }
                          const capText = currentHarvestCapacity.trim();
                          if (capText) {
                            const formattedCap = `${capText} ${currentHarvestUnit}`;
                            setHarvestCapacitiesMap(prev => {
                              const map = { ...prev };
                              if (!map[type]) map[type] = [];
                              if (!map[type].includes(formattedCap)) map[type].push(formattedCap);
                              return map;
                            });
                            setCurrentHarvestCapacity('');
                            setCurrentOtherHarvestType('');
                            setCurrentHarvestType('');
                          }
                        }}>
                        Add
                      </button>
                    </div>

                    {Object.keys(harvestCapacitiesMap).length > 0 && (
                      <div style={{ marginTop: '20px' }}>
                        <h5 style={{ margin: '0 0 10px 0', color: '#334155' }}>Added Equipment:</h5>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {Object.entries(harvestCapacitiesMap).map(([type, capacities]) =>
                            capacities.map(cap => (
                              <div key={`${type}-${cap}`} style={{ background: '#dcfce7', color: '#166534', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid #bbf7d0' }}>
                                {type} - {cap}
                                <button type="button" style={{ background: 'none', border: 'none', color: '#166534', cursor: 'pointer', padding: 0, display: 'flex' }} onClick={() => {
                                  setHarvestCapacitiesMap(prev => {
                                    const map = { ...prev };
                                    map[type] = map[type].filter(c => c !== cap);
                                    if (map[type].length === 0) delete map[type];
                                    return map;
                                  });
                                }}>&#x2715;</button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Sprayer Capacity Section */}
                {equipCat === 'Sprayers' && (
                  <div className="form-section capacity-section" style={{ gridColumn: '1 / -1', background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginTop: '10px', marginBottom: '10px' }}>
                    <h4 style={{ margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '8px', color: '#0369a1' }}><AlertCircle size={16} /> Sprayer Types</h4>
                    <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '15px' }}>Add sprayers and their capacities:</p>

                    <div className="input-group" style={{ marginBottom: '15px' }}>
                      <label>Sprayer Type</label>
                      <select
                        value={currentSprayerType}
                        onChange={(e) => setCurrentSprayerType(e.target.value)}>
                        <option value="">Select Sprayer Type</option>
                        {availableSprayerTypes.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>

                    {currentSprayerType === 'Other' && (
                      <div className="input-group" style={{ marginBottom: '15px' }}>
                        <label>Custom Sprayer Name</label>
                        <input
                          value={currentOtherSprayerType}
                          placeholder="e.g. Special Sprayer"
                          onChange={(e) => setCurrentOtherSprayerType(e.target.value)} />
                      </div>
                    )}

                    <div className="grid-2" style={{ alignItems: 'end', gridTemplateColumns: '1fr auto', gap: '15px' }}>
                      <div className="input-group">
                        <label>Capacity (Litres)</label>
                        <input
                          type="number"
                          value={currentSprayerCapacity}
                          placeholder="e.g. 150"
                          onChange={(e) => setCurrentSprayerCapacity(e.target.value)} />
                      </div>
                      <button
                        type="button"
                        className="btn-primary"
                        style={{ height: '42px', padding: '0 20px', borderRadius: '8px', marginBottom: '8px', background: '#0284c7', borderColor: '#0284c7' }}
                        onClick={() => {
                          if (!currentSprayerType) return;
                          let type = currentSprayerType;
                          if (type === 'Other') {
                            if (!currentOtherSprayerType.trim()) return;
                            type = currentOtherSprayerType.trim();
                            if (!availableSprayerTypes.includes(type)) setAvailableSprayerTypes(prev => [...prev.slice(0, prev.length - 1), type, 'Other']);
                          }
                          const capText = currentSprayerCapacity.trim();
                          if (capText) {
                            setSprayerCapacitiesMap(prev => {
                              const map = { ...prev };
                              if (!map[type]) map[type] = [];
                              if (!map[type].includes(capText)) map[type].push(capText);
                              return map;
                            });
                            setCurrentSprayerCapacity('');
                            setCurrentOtherSprayerType('');
                            setCurrentSprayerType('');
                          }
                        }}>
                        Add
                      </button>
                    </div>

                    {Object.keys(sprayerCapacitiesMap).length > 0 && (
                      <div style={{ marginTop: '20px' }}>
                        <h5 style={{ margin: '0 0 10px 0', color: '#334155' }}>Added Sprayers:</h5>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {Object.entries(sprayerCapacitiesMap).map(([type, capacities]) =>
                            capacities.map(cap => (
                              <div key={`${type}-${cap}`} style={{ background: '#e0f2fe', color: '#0369a1', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid #bae6fd' }}>
                                {type} - {cap} L
                                <button type="button" style={{ background: 'none', border: 'none', color: '#0369a1', cursor: 'pointer', padding: 0, display: 'flex' }} onClick={() => {
                                  setSprayerCapacitiesMap(prev => {
                                    const map = { ...prev };
                                    map[type] = map[type].filter(c => c !== cap);
                                    if (map[type].length === 0) delete map[type];
                                    return map;
                                  });
                                }}>&#x2715;</button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Make dropdown (category-aware) */}
                {!isSprayer && allMakes.length > 0 && (
                  <div className="input-group" data-error={!!fieldErrors.brand}>
                    <label>Make (Brand) *</label>
                    <select
                      value={selectedEquipMake || ''}
                      onChange={(e) => {
                        clearError('brand');
                        const v = e.target.value;
                        setSelectedEquipMake(v || null);
                        setSelectedEquipModel(null);
                        setFormData((prev: any) => ({ ...prev, brand: v === 'Other' ? '' : v, model: '' }));
                      }}
                      style={{ border: fieldErrors.brand ? '2px solid #dc2626' : undefined }}>
                      <option value="">Select Make</option>
                      {allMakes.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    {errMsg('brand')}
                  </div>
                )}

                {/* Model dropdown */}
                {!isSprayer && !showManualBrandModel && models.length > 0 && (
                  <div className="input-group" data-error={!!fieldErrors.model}>
                    <label>Model *</label>
                    <select
                      value={selectedEquipModel || ''}
                      onChange={(e) => {
                        clearError('model');
                        const v = e.target.value;
                        setSelectedEquipModel(v || null);
                        if (v && v !== 'Other') {
                          setFormData((prev: any) => ({ ...prev, model: v, brandModel: `${selectedEquipMake} ${v}` }));
                        } else {
                          setFormData((prev: any) => ({ ...prev, model: '', brandModel: '' }));
                        }
                      }}
                      style={{ border: fieldErrors.model ? '2px solid #dc2626' : undefined }}>
                      <option value="">Select Model</option>
                      {models.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    {errMsg('model')}
                  </div>
                )}

                {/* Manual Brand/Model fallback */}
                {!isSprayer && (showManualBrandModel || showManualModel) && (
                  <div className="input-group" data-error={!!fieldErrors.brand}>
                    <label>Brand / Model *</label>
                    <input
                      name="brandModel"
                      value={formData.brandModel || ''}
                      placeholder="e.g. John Deere 5310"
                      onChange={handleInputChange}
                      style={{ border: fieldErrors.brand ? '2px solid #dc2626' : undefined }} />
                    {errMsg('brand')}
                  </div>
                )}

                {/* Sprayer brand/model manual */}
                {isSprayer && (
                  <div className="input-group">
                    <label>Brand / Model</label>
                    <input
                      name="brandModel"
                      value={formData.brandModel || ''}
                      placeholder="e.g. Aspee 500L, Solo 425"
                      onChange={handleInputChange}
                    />
                  </div>
                )}

                {/* Year of Manufacture */}
                <div className="input-group">
                  <label>Year of Manufacture</label>
                  <input
                    type="number"
                    name="yearOfManufacture"
                    value={formData.yearOfManufacture || ''}
                    placeholder="e.g. 2021"
                    onChange={handleInputChange}
                    min="1990"
                    max={new Date().getFullYear()}
                  />
                </div>

                {/* Vehicle Number (not for Sprayers) */}
                {!isSprayer && (
                  <div className="input-group">
                    <label>Vehicle / Registration Number (Optional)</label>
                    <input
                      name="vehicleNumber"
                      value={formData.vehicleNumber || ''}
                      placeholder="e.g. TN 37 BY 1234"
                      onChange={handleInputChange}
                    />
                  </div>
                )}

              </div>
            </div>

            {/* ─── Attached Equipments (Tractors only) ─── */}
            {isTractor && (
              <div style={{
                background: 'white',
                borderRadius: '20px',
                padding: '28px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                border: '1px solid #f1f5f9'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <div style={{ background: 'linear-gradient(135deg, #00aa55, #00cc66)', borderRadius: '10px', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Sprout size={18} color="white" />
                  </div>
                  <span style={{ fontWeight: 800, fontSize: '1rem', color: '#1a2e1a' }}>Attached Equipments</span>
                </div>
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '16px' }}>Select any attached equipments available with the tractor:</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {attachedEquipmentOptions.map(eq => {
                    const sel = selectedAttachedEquipments.includes(eq);
                    return (
                      <button
                        key={eq}
                        type="button"
                        onClick={() => {
                          if (eq === 'Other') {
                            setShowOtherAttachedInput(prev => !prev);
                          } else {
                            setSelectedAttachedEquipments(prev =>
                              sel ? prev.filter(x => x !== eq) : [...prev, eq]
                            );
                          }
                        }}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '20px',
                          border: `2px solid ${sel ? '#00aa55' : '#e2e8f0'}`,
                          background: sel ? '#e8f5e9' : 'white',
                          color: sel ? '#1b5e20' : '#475569',
                          fontWeight: sel ? 700 : 500,
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                      >
                        {sel && <Check size={13} style={{ marginRight: '5px', display: 'inline' }} />}
                        {eq}
                      </button>
                    );
                  })}
                </div>
                {showOtherAttachedInput && (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                    <input
                      type="text"
                      placeholder="e.g. Cultivator"
                      value={otherAttachedInput}
                      onChange={e => setOtherAttachedInput(e.target.value)}
                      style={{ flex: 1, padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem' }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const t = otherAttachedInput.trim();
                        if (!t) return;
                        if (!attachedEquipmentOptions.includes(t)) {
                          setAttachedEquipmentOptions(prev => [...prev.slice(0, -1), t, 'Other']);
                        }
                        if (!selectedAttachedEquipments.includes(t)) {
                          setSelectedAttachedEquipments(prev => [...prev, t]);
                        }
                        setOtherAttachedInput('');
                        setShowOtherAttachedInput(false);
                      }}
                      className="btn-primary"
                      style={{ padding: '10px 18px', borderRadius: '10px', fontWeight: 700 }}
                    >
                      Add
                    </button>
                    <button type="button" onClick={() => { setShowOtherAttachedInput(false); setOtherAttachedInput(''); }}
                      style={{ background: '#f1f5f9', border: 'none', color: '#64748b', padding: '10px', borderRadius: '10px', cursor: 'pointer' }}>
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ─── Trolley Types (Trolleys only) ─── */}
            {isTrolley && (
              <div style={{
                background: 'white',
                borderRadius: '20px',
                padding: '28px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                border: '1px solid #f1f5f9'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <div style={{ background: 'linear-gradient(135deg, #00aa55, #00cc66)', borderRadius: '10px', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Truck size={18} color="white" />
                  </div>
                  <span style={{ fontWeight: 800, fontSize: '1rem', color: '#1a2e1a' }}>Trolley Types</span>
                </div>
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '16px' }}>Select the available trolley types:</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {trolleyTypeOptions.map(tt => {
                    const sel = selectedTrolleyTypes.includes(tt);
                    return (
                      <button
                        key={tt}
                        type="button"
                        onClick={() => {
                          if (tt === 'Other') {
                            setShowOtherTrolleyInput(prev => !prev);
                          } else {
                            setSelectedTrolleyTypes(prev =>
                              sel ? prev.filter(x => x !== tt) : [...prev, tt]
                            );
                          }
                        }}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '20px',
                          border: `2px solid ${sel ? '#00aa55' : '#e2e8f0'}`,
                          background: sel ? '#e8f5e9' : 'white',
                          color: sel ? '#1b5e20' : '#475569',
                          fontWeight: sel ? 700 : 500,
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                      >
                        {sel && <Check size={13} style={{ marginRight: '5px', display: 'inline' }} />}
                        {tt}
                      </button>
                    );
                  })}
                </div>
                {showOtherTrolleyInput && (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                    <input
                      type="text"
                      placeholder="e.g. 6-Wheel Hydraulic"
                      value={otherTrolleyInput}
                      onChange={e => setOtherTrolleyInput(e.target.value)}
                      style={{ flex: 1, padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem' }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const t = otherTrolleyInput.trim();
                        if (!t) return;
                        if (!trolleyTypeOptions.includes(t)) {
                          setTrolleyTypeOptions(prev => [...prev.slice(0, -1), t, 'Other']);
                        }
                        if (!selectedTrolleyTypes.includes(t)) {
                          setSelectedTrolleyTypes(prev => [...prev, t]);
                        }
                        setOtherTrolleyInput('');
                        setShowOtherTrolleyInput(false);
                      }}
                      className="btn-primary"
                      style={{ padding: '10px 18px', borderRadius: '10px', fontWeight: 700 }}
                    >
                      Add
                    </button>
                    <button type="button" onClick={() => { setShowOtherTrolleyInput(false); setOtherTrolleyInput(''); }}
                      style={{ background: '#f1f5f9', border: 'none', color: '#64748b', padding: '10px', borderRadius: '10px', cursor: 'pointer' }}>
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ─── Rental Terms & Condition Card ─── */}
            <div style={{
              background: 'white',
              borderRadius: '20px',
              padding: '28px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
              border: '1px solid #f1f5f9'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                <div style={{ background: 'linear-gradient(135deg, #00aa55, #00cc66)', borderRadius: '10px', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Check size={18} color="white" />
                </div>
                <span style={{ fontWeight: 800, fontSize: '1rem', color: '#1a2e1a' }}>Rental Terms &amp; Condition</span>
              </div>

              <div className="form-fields grid-2">
                {/* Price fields */}
                {isTrolley ? (
                  <>
                    <div className="input-group" data-error={!!fieldErrors.pricePerDay}>
                      <label>Full Day Price (₹) *</label>
                      <input
                        type="number" name="pricePerDay"
                        value={formData.pricePerDay || ''}
                        placeholder="e.g. 1500"
                        onChange={handleInputChange}
                        style={{ border: fieldErrors.pricePerDay ? '2px solid #dc2626' : undefined }} />
                      {errMsg('pricePerDay')}
                    </div>
                    <div className="input-group">
                      <label>Half Day Price (₹)</label>
                      <input type="number" name="halfDayPrice" value={formData.halfDayPrice || ''} placeholder="e.g. 800" onChange={handleInputChange} />
                    </div>
                  </>
                ) : (
                  <div className="input-group" data-error={!!fieldErrors.pricePerDay}>
                    <label>Rental Price *</label>
                    <input
                      type="number"
                      name="pricePerDay"
                      value={formData.pricePerDay || ''}
                      placeholder={isSprayer ? 'e.g. ₹50 per litre' : 'e.g. ₹500 per hour'}
                      onChange={handleInputChange}
                      style={{ border: fieldErrors.pricePerDay ? '2px solid #dc2626' : undefined }} />
                    {errMsg('pricePerDay')}
                  </div>
                )}

                {/* Condition */}
                <div className="input-group">
                  <label>Condition</label>
                  <select name="conditionStatus" value={formData.conditionStatus || 'Good'} onChange={handleInputChange}>
                    <option value="New">New</option>
                    <option value="Good">Good</option>
                    <option value="Average">Average</option>
                    <option value="Poor">Poor</option>
                  </select>
                </div>

                {/* Operator Available toggle */}
                <div className="input-group span-2">
                  <label style={{ display: 'block', fontWeight: 800, marginBottom: '8px' }}>Operator Available</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: operatorAvailable ? '16px' : '0' }}>
                    <button
                      type="button"
                      onClick={() => setOperatorAvailable(prev => !prev)}
                      style={{
                        position: 'relative',
                        width: '52px',
                        height: '28px',
                        background: operatorAvailable ? '#00aa55' : '#cbd5e1',
                        borderRadius: '14px',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'background 0.3s',
                        flexShrink: 0,
                      }}
                    >
                      <div style={{
                        position: 'absolute',
                        top: '3px',
                        left: operatorAvailable ? '27px' : '3px',
                        width: '22px',
                        height: '22px',
                        background: 'white',
                        borderRadius: '50%',
                        transition: 'left 0.3s',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                      }} />
                    </button>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: '0.9rem', margin: 0, color: '#1a2e1a' }}>
                        {operatorAvailable ? 'Operator Included' : 'No Operator (Self-use)'}
                      </p>
                      <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>Does an operator come along with this equipment?</p>
                    </div>
                  </div>
                  {operatorAvailable && (
                    <div className="input-group" style={{ marginBottom: 0 }} data-error={!!fieldErrors.operatorPrice}>
                      <label>Operator Price (₹/day) *</label>
                      <input
                        type="number"
                        name="operatorPrice"
                        value={formData.operatorPrice || ''}
                        placeholder="e.g. ₹300 / day"
                        onChange={handleInputChange}
                        style={{ border: fieldErrors.operatorPrice ? '2px solid #dc2626' : undefined }}
                      />
                      {errMsg('operatorPrice')}
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="input-group span-2">
                  <label>Description / Extra Details (Optional)</label>
                  <textarea
                    name="description"
                    value={formData.description || ''}
                    onChange={handleInputChange}
                    placeholder="Enter details like accessories included, service history, specific rules..."
                    rows={3}
                    style={{
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: '2px solid #f1f5f9',
                      background: '#f8fafc',
                      fontWeight: 600,
                      outline: 'none',
                      transition: 'all 0.2s',
                      minHeight: '80px',
                      resize: 'vertical',
                    }}
                  />
                </div>
              </div>
            </div>

          </div>
        );
      }
      case 'Vehicles':
        {
          const isDriverIncluded = formData.driverIncluded === true;
          return (
            <div className="form-fields grid-2">
              <div className="input-group" data-error={!!fieldErrors.ownerBusinessName}>
                <label>Owner / Business Name *</label>
                <input
                  name="ownerBusinessName"
                  value={formData.ownerBusinessName || ''}
                  placeholder="e.g. Ram Singh Transports"
                  onChange={handleInputChange}
                  style={{ border: fieldErrors.ownerBusinessName ? '2px solid #dc2626' : undefined }} />
                {errMsg('ownerBusinessName')}
              </div>

              <div className="input-group" style={{ position: 'relative' }} data-error={!!fieldErrors.vehicleType}>
                <label>Vehicle Type (Category) *</label>
                <select
                  name="vehicleType"
                  value={formData.vehicleType || ''}
                  onChange={(e) => {
                    clearError('vehicleType');
                    const val = e.target.value;
                    if (val === 'Others') {
                      setShowCustomCategoryInput(true);
                      setFormData((prev: any) => ({ ...prev, vehicleType: '' }));
                    } else {
                      setShowCustomCategoryInput(false);
                      setFormData((prev: any) => ({ ...prev, vehicleType: val }));
                    }
                  }}
                  style={{ border: fieldErrors.vehicleType ? '2px solid #dc2626' : undefined }}>
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
                {errMsg('vehicleType')}
              </div>

              <div className="input-group" data-error={!!fieldErrors.brand}>
                <label>Brand *</label>
                <input
                  name="brand"
                  value={formData.brand || ''}
                  placeholder="e.g. Tata, Mahindra"
                  onChange={handleInputChange}
                  style={{ border: fieldErrors.brand ? '2px solid #dc2626' : undefined }} />
                {errMsg('brand')}
              </div>

              <div className="input-group" data-error={!!fieldErrors.model}>
                <label>Model *</label>
                <input
                  name="model"
                  value={formData.model || ''}
                  placeholder="e.g. Ace Gold, Bolero Pikup"
                  onChange={handleInputChange}
                  style={{ border: fieldErrors.model ? '2px solid #dc2626' : undefined }} />
                {errMsg('model')}
              </div>

              <div className="input-group" data-error={!!fieldErrors.vehicleNumber}>
                <label>Vehicle Number *</label>
                <input
                  name="vehicleNumber"
                  value={formData.vehicleNumber || ''}
                  placeholder="PB-XX-XXXX"
                  onChange={handleInputChange}
                  style={{ border: fieldErrors.vehicleNumber ? '2px solid #dc2626' : undefined }} />
                {errMsg('vehicleNumber')}
              </div>

              <div className="input-group" data-error={!!fieldErrors.loadCapacity}>
                <label>Load Capacity (Tons) *</label>
                <input
                  type="number" name="loadCapacity"
                  value={formData.loadCapacity || ''}
                  placeholder="2"
                  onChange={handleInputChange}
                  style={{ border: fieldErrors.loadCapacity ? '2px solid #dc2626' : undefined }} />
                {errMsg('loadCapacity')}
              </div>

              <div className="input-group" data-error={!!fieldErrors.vehicleCondition}>
                <label>Vehicle Condition *</label>
                <select
                  name="vehicleCondition"
                  value={formData.vehicleCondition || ''}
                  onChange={handleInputChange}
                  style={{ border: fieldErrors.vehicleCondition ? '2px solid #dc2626' : undefined }}>
                  <option value="">Select Condition</option>
                  <option value="NEW">New</option>
                  <option value="GOOD">Good</option>
                  <option value="MANAGABLE">Manageable</option>
                  <option value="AVERAGE">Average</option>
                </select>
                {errMsg('vehicleCondition')}
              </div>

              <div className="input-group" data-error={!!fieldErrors.pricePerKm}>
                <label>Price Per KM (₹) *</label>
                <input
                  type="number"
                  name="pricePerKm"
                  value={formData.pricePerKm || ''}
                  placeholder="e.g. 15"
                  onChange={handleInputChange}
                  style={{ border: fieldErrors.pricePerKm ? '2px solid #dc2626' : undefined }} />
                {errMsg('pricePerKm')}
              </div>

              <div className="input-group" data-error={!!fieldErrors.pricePerHour}>
                <label>Price Per Hour (₹) *</label>
                <input
                  type="number"
                  name="pricePerHour"
                  value={formData.pricePerHour || ''}
                  placeholder="e.g. 300"
                  onChange={handleInputChange}
                  style={{ border: fieldErrors.pricePerHour ? '2px solid #dc2626' : undefined }} />
                {errMsg('pricePerHour')}
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
                    onChange={handleInputChange} />
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
              <div className="input-group" data-error={!!fieldErrors.groupName}>
                <label>Group Name *</label>
                <input
                  name="groupName"
                  value={formData.groupName || ''}
                  placeholder="e.g. Skilled Harvest Team"
                  onChange={handleInputChange}
                  style={{ border: fieldErrors.groupName ? '2px solid #dc2626' : undefined }} />
                {errMsg('groupName')}
              </div>
              <div className="grid-2">
                <div className="input-group" data-error={!!fieldErrors.maleCount}>
                  <label>Male Count</label>
                  <input
                    type="number" name="maleCount"
                    value={formData.maleCount || ''}
                    placeholder="0"
                    onChange={handleInputChange}
                    style={{ border: fieldErrors.maleCount ? '2px solid #dc2626' : undefined }} />
                  {errMsg('maleCount')}
                </div>
                <div className="input-group">
                  <label>Female Count</label>
                  <input type="number" name="femaleCount" value={formData.femaleCount || ''} placeholder="0" onChange={handleInputChange} />
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
                <div className="input-group" data-error={!!fieldErrors.pricePerMale}>
                  <label>Daily Rate per Male (₹/day) *</label>
                  <input
                    type="number" name="pricePerMale"
                    value={formData.pricePerMale || ''}
                    placeholder="e.g. 500"
                    onChange={handleInputChange}
                    style={{ border: fieldErrors.pricePerMale ? '2px solid #dc2626' : undefined }} />
                  {errMsg('pricePerMale')}
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
                  <input type="number" name="pricePerFemale" value={formData.pricePerFemale || ''} placeholder="e.g. 400" onChange={handleInputChange} />
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
                return sum + (String(alloc.male) === '' ? 0 : Number(alloc.male));
              }, 0);

              const totalFemaleAllocated = selectedSkills.reduce((sum, skill) => {
                const alloc = skillAllocations[skill] || { female: '' };
                return sum + (String(alloc.female) === '' ? 0 : Number(alloc.female));
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
                  <div className="grid-2" style={{ gap: '16px', fontSize: '0.9rem', fontWeight: 800 }}>
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
            <div className="input-group" data-error={!!fieldErrors.serviceName}>
              <label>Service Type *</label>
              <select
                name="serviceName"
                value={formData.serviceName || ''}
                onChange={handleInputChange}
                style={{ border: fieldErrors.serviceName ? '2px solid #dc2626' : undefined }}>
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
              {errMsg('serviceName')}
            </div>
            <div className="input-group">
              <label>Business Name</label>
              <input name="businessName" value={formData.businessName || ''} onChange={handleInputChange} />
            </div>
            <div className="input-group" data-error={!!fieldErrors.pricePerDay}>
              <label>Base Price Rate (₹) *</label>
              <input
                type="number" name="pricePerDay"
                value={formData.pricePerDay || ''}
                onChange={handleInputChange}
                style={{ border: fieldErrors.pricePerDay ? '2px solid #dc2626' : undefined }} />
              {errMsg('pricePerDay')}
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
              <p>Your item has been submitted and added to your listings.</p>
              <button
                onClick={() => navigate('/manage-assets', { state: { activeTab: category } })}
                className="btn-primary"
                style={{ marginTop: '20px', padding: '12px 28px', borderRadius: '12px' }}
              >
                Go to My {category || 'Assets'}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
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
                    <input name="houseNo" value={formData.houseNo || ''} placeholder="e.g. D-14" onChange={handleInputChange} />
                  </div>
                  <div className="input-group">
                    <label>Street / Area / Colony</label>
                    <input name="street" value={formData.street || ''} placeholder="e.g. Main Road" onChange={handleInputChange} />
                  </div>
                  <div className="input-group" data-error={!!fieldErrors.village}>
                    <label>Village / City / Town *</label>
                    <input
                      name="village"
                      value={formData.village || ''}
                      placeholder="Enter Village"
                      onChange={handleInputChange}
                      style={{ border: fieldErrors.village ? '2px solid #dc2626' : undefined }} />
                    {errMsg('village')}
                  </div>
                  <div className="input-group">
                    <label>Mandal</label>
                    <input
                      name="mandal"
                      value={formData.mandal || ''}
                      placeholder="Enter Mandal"
                      onChange={handleInputChange} />
                  </div>
                  <div className="input-group" data-error={!!fieldErrors.district}>
                    <label>District *</label>
                    <input
                      name="district"
                      value={formData.district || ''}
                      placeholder="Enter District"
                      onChange={handleInputChange}
                      style={{ border: fieldErrors.district ? '2px solid #dc2626' : undefined }} />
                    {errMsg('district')}
                  </div>
                  <div className="input-group">
                    <label>State</label>
                    <input name="state" value={formData.state || ''} placeholder="Enter State" onChange={handleInputChange} />
                  </div>
                  <div className="input-group">
                    <label>Pincode</label>
                    <input name="pincode" value={formData.pincode || ''} placeholder="Enter Pincode" onChange={handleInputChange} />
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
        .page-header { display: flex; align-items: center; justify-content: center; position: relative; margin-bottom: 40px; min-height: 48px; }
        .page-header h1 { margin: 0; text-align: center; }
        .btn-back { position: absolute; left: 0; width: 48px; height: 48px; border-radius: 12px; background: white; box-shadow: var(--shadow-sm); display: flex; align-items: center; justify-content: center; border: none; cursor: pointer; }
        
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
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default UploadItem;

