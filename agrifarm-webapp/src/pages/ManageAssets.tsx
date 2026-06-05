import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { useAuth } from '../services/AuthContext';
import { useLanguage } from '../services/LanguageContext';
import { 
  Package, Plus, Edit2, Trash2, 
  CheckCircle, Clock, XCircle 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

type AssetType = 'Vehicles' | 'Equipment' | 'Services' | 'Workers';

const ManageAssets: React.FC = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<AssetType>('Vehicles');
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const id = user?.id || JSON.parse(localStorage.getItem('agrifarm_user') || '{}').id;
      if (!id) return;

      const [veh, equip, serv, work] = await Promise.all([
        apiService.getVehicles({ ownerId: id }),
        apiService.getEquipment({ ownerId: id }),
        apiService.getServices({ ownerId: id }),
        apiService.getWorkerGroups({ ownerId: id })
      ]);

      const allAssets = {
        'Vehicles': veh.data || [],
        'Equipment': equip.data || [],
        'Services': serv.data || [],
        'Workers': work.data || []
      };

      setAssets((allAssets as any)[activeTab]);
    } catch (error) {
      console.error('Error fetching assets:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated && !localStorage.getItem('agrifarm_user')) navigate('/login');
    fetchAssets();
  }, [user, isAuthenticated, navigate, activeTab]);

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('manage.confirmDelete'))) return;
    
    try {
      if (activeTab === 'Vehicles') await apiService.deleteVehicle(id);
      else if (activeTab === 'Equipment') await apiService.deleteEquipment(id);
      else if (activeTab === 'Services') await apiService.deleteService(id);
      else if (activeTab === 'Workers') await apiService.deleteWorkerGroup(id);
      
      fetchAssets();
    } catch (error) {
      alert(t('manage.failedDelete'));
    }
  };

  const getStatusInfo = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return { color: '#2e7d32', bg: '#e8f5e9', icon: CheckCircle, label: t('manage.status.approved') };
      case 'rejected':
        return { color: '#c62828', bg: '#ffebee', icon: XCircle, label: t('manage.status.rejected') };
      default:
        return { color: '#ef6c00', bg: '#fff3e0', icon: Clock, label: t('manage.status.pending') };
    }
  };

  const renderStatusBadge = (status?: string) => {
    const info = getStatusInfo(status);
    return (
      <div className="status-badge" style={{ backgroundColor: info.bg, color: info.color }}>
        <info.icon size={12} />
        <span>{info.label}</span>
      </div>
    );
  };

  const tabs = [
    { value: 'Vehicles', label: t('manage.tab.vehicles') },
    { value: 'Equipment', label: t('manage.tab.equipment') },
    { value: 'Services', label: t('manage.tab.services') },
    { value: 'Workers', label: t('manage.tab.workers') }
  ];

  return (
    <div className="manage-assets container fade-in">
      <div className="page-header">
        <div>
          <h1>{t('manage.title')}</h1>
          <p>{t('manage.subtitle')}</p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/upload-item')}>
          <Plus size={20} />
          <span>{t('manage.addBtn')}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="tab-bar-container">
        <div className="tab-bar">
          {tabs.map((tab) => (
            <button 
              key={tab.value}
              className={`tab-item ${activeTab === tab.value ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.value as any)}
            >
              {tab.label}
              {activeTab === tab.value && <motion.div layoutId="tab-underline" className="tab-underline" />}
            </button>
          ))}
        </div>
      </div>

      <div className="assets-content">
        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
          </div>
        ) : assets.length > 0 ? (
          <div className="assets-list">
            <AnimatePresence mode="popLayout">
              {assets.map((asset) => {
                const isVehicle = activeTab === 'Vehicles';
                const id = asset.vehicleId || asset.equipmentId || asset.serviceId || asset.groupId;
                const title = isVehicle && asset.brand 
                  ? `${asset.brand} ${asset.model || ''}` 
                  : (asset.vehicleType || asset.brandModel || asset.businessName || asset.groupName);
                const subtitle = isVehicle 
                  ? `${asset.vehicleType || 'Transport'} • ${asset.vehicleNumber}` 
                  : (asset.vehicleNumber || asset.category || asset.serviceType || `${asset.maleCount} Men, ${asset.femaleCount} Women`);
                const price = isVehicle 
                  ? `${asset.pricePerKm || 0}/km • ₹${asset.pricePerHour || 0}/hr` 
                  : (asset.pricePerKmOrTrip || asset.pricePerHour || asset.priceRate || asset.pricePerMale);
                
                return (
                  <motion.div 
                    key={id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="asset-card-managed"
                  >
                    <div className="card-main">
                      <div className="asset-img-managed">
                        <img 
                          src={apiService.getFullImageUrl(asset.imageUrl)} 
                          alt="" 
                          onError={(e) => (e.currentTarget.src = 'https://images.unsplash.com/photo-1594913785162-e6785b493bd2?auto=format&fit=crop&q=80&w=200')}
                        />
                      </div>
                      <div className="asset-details-managed">
                        <h4>{title}</h4>
                        <p>{subtitle} • ₹{price}</p>
                        {renderStatusBadge(asset.approvalStatus)}
                      </div>
                    </div>
                    <div className="card-actions">
                      <button className="action-btn edit" onClick={() => navigate(`/upload-item`, { state: { edit: asset, category: activeTab } })}>
                        <Edit2 size={18} />
                      </button>
                      <button className="action-btn delete" onClick={() => handleDelete(id)}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">
              <Package size={48} />
            </div>
            <h3>{t('manage.emptyTitle').replace('{tab}', t('manage.tab.' + activeTab.toLowerCase()))}</h3>
            <p>{t('manage.emptyDesc')}</p>
          </div>
        )}
      </div>

      <style>{`
        .manage-assets { padding-top: 20px; }
        
        .tab-bar-container {
          margin: 24px 0;
          border-bottom: 1px solid var(--border);
          overflow-x: auto;
          scrollbar-width: none;
        }
        .tab-bar-container::-webkit-scrollbar { display: none; }
        
        .tab-bar {
          display: flex;
          gap: 32px;
          padding: 0 4px;
        }
        
        .tab-item {
          padding: 12px 4px;
          font-weight: 700;
          color: var(--text-muted);
          position: relative;
          white-space: nowrap;
          font-size: 0.95rem;
        }
        
        .tab-item.active {
          color: var(--primary);
        }
        
        .tab-underline {
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 3px;
          background: var(--primary);
          border-radius: 3px 3px 0 0;
        }
        
        .assets-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
          gap: 16px;
        }
        
        @media (max-width: 768px) {
          .assets-list { grid-template-columns: 1fr; }
        }
        
        .asset-card-managed {
          background: white;
          padding: 12px;
          border-radius: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: var(--shadow-md);
        }
        
        .card-main {
          display: flex;
          align-items: center;
          gap: 16px;
          flex: 1;
        }
        
        .asset-img-managed {
          width: 75px;
          height: 75px;
          border-radius: 16px;
          overflow: hidden;
          background: #f1f8f1;
        }
        
        .asset-img-managed img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .asset-details-managed h4 {
          font-size: 1rem;
          font-weight: 800;
          color: #1b5e20;
          margin-bottom: 2px;
        }
        
        .asset-details-managed p {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-muted);
          margin-bottom: 8px;
        }
        
        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          border-radius: 8px;
          font-size: 0.65rem;
          font-weight: 800;
          letter-spacing: 0.5px;
        }
        
        .card-actions {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .action-btn {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        
        .action-btn.edit { color: var(--primary); background: #e8f5e9; }
        .action-btn.delete { color: #e57373; background: #ffebee; }
        
        .loading-state {
          display: flex;
          justify-content: center;
          padding: 60px 0;
        }
        
        .spinner {
          width: 32px;
          height: 32px;
          border: 3px solid #e2e8f0;
          border-top-color: var(--primary);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        
        @keyframes spin { to { transform: rotate(360deg); } }
        
        .empty-state {
          text-align: center;
          padding: 60px 20px;
        }
        
        .empty-icon {
          width: 80px;
          height: 80px;
          background: white;
          border-radius: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px auto;
          color: #cbd5e1;
          box-shadow: var(--shadow-sm);
        }
        
        .empty-state h3 { color: #1b5e20; font-weight: 800; margin-bottom: 8px; }
        .empty-state p { color: var(--text-muted); font-size: 0.9rem; }
      `}</style>
    </div>
  );
};

export default ManageAssets;

