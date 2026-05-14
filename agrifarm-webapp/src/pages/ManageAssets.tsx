import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { useAuth } from '../services/AuthContext';
import { Package, Plus, Edit2, Trash2, Search, Filter, MoreVertical, Eye, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ManageAssets: React.FC = () => {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) navigate('/login');
    
    const fetchMyAssets = async () => {
      try {
        // Fetch all types of inventory for this owner
        const [equip, serv, veh, work] = await Promise.all([
          apiService.getEquipment({ ownerId: user?.id }),
          apiService.getServices({ ownerId: user?.id }),
          apiService.getVehicles({ ownerId: user?.id }),
          apiService.getWorkerGroups({ ownerId: user?.id })
        ]);
        
        setAssets([
          ...equip.data.map((a: any) => ({ ...a, type: 'Equipment', id: a.equipmentId, name: a.brandModel })),
          ...serv.data.map((a: any) => ({ ...a, type: 'Service', id: a.serviceId, name: a.serviceType })),
          ...veh.data.map((a: any) => ({ ...a, type: 'Vehicle', id: a.vehicleId, name: a.vehicleType })),
          ...work.data.map((a: any) => ({ ...a, type: 'Worker Group', id: a.groupId, name: a.groupName }))
        ]);
      } catch (error) {
        console.error('Error fetching assets:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) fetchMyAssets();
  }, [user, isAuthenticated, navigate]);

  return (
    <div className="manage-assets container fade-in">
      <div className="page-header">
        <div>
          <h1 className="text-3xl font-bold">Manage My Assets</h1>
          <p className="text-slate-500">Track and update your listed equipment & services</p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/upload-item')}>
          <Plus size={20} />
          <span>Add New Asset</span>
        </button>
      </div>

      <div className="stats-row">
        <div className="stat-card card">
          <div className="stat-info">
            <span className="label">Total Assets</span>
            <span className="value">{assets.length}</span>
          </div>
          <div className="stat-icon bg-green-50 text-green-600">
            <Package size={24} />
          </div>
        </div>
        <div className="stat-card card">
          <div className="stat-info">
            <span className="label">Active Bookings</span>
            <span className="value">2</span>
          </div>
          <div className="stat-icon bg-blue-50 text-blue-600">
            <Eye size={24} />
          </div>
        </div>
        <div className="stat-card card">
          <div className="stat-info">
            <span className="label">Total Earnings</span>
            <span className="value">₹12,450</span>
          </div>
          <div className="stat-icon bg-amber-50 text-amber-600">
            <AlertCircle size={24} />
          </div>
        </div>
      </div>

      <div className="table-container card">
        <div className="table-header">
          <div className="search-box">
            <Search size={18} />
            <input type="text" placeholder="Filter assets..." />
          </div>
          <button className="filter-btn-sm">
            <Filter size={16} />
            <span>Filter</span>
          </button>
        </div>

        <table className="assets-table">
          <thead>
            <tr>
              <th>Asset Info</th>
              <th>Category</th>
              <th>Price</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [1, 2, 3].map(i => (
                <tr key={i} className="skeleton-row">
                  <td colSpan={5}><div className="skeleton-bar"></div></td>
                </tr>
              ))
            ) : assets.length > 0 ? (
              assets.map((asset) => (
                <tr key={asset.id}>
                  <td>
                    <div className="asset-cell">
                      <div className="asset-img-sm">
                        <img src={asset.imageUrl || 'https://images.unsplash.com/photo-1594913785162-e6785b493bd2?auto=format&fit=crop&q=80&w=100'} alt="" />
                      </div>
                      <div>
                        <div className="font-bold">{asset.name}</div>
                        <div className="text-xs text-slate-400">{asset.id}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="badge-type">{asset.type}</span>
                  </td>
                  <td>
                    <span className="font-semibold">₹{asset.pricePerHour || asset.pricePerKmOrTrip || asset.priceRate || asset.pricePerMale}</span>
                  </td>
                  <td>
                    <span className={`status-pill ${asset.isAvailable ? 'online' : 'offline'}`}>
                      {asset.isAvailable ? 'Available' : 'Booked'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-icon"><Edit2 size={16} /></button>
                      <button className="btn-icon text-red-500"><Trash2 size={16} /></button>
                      <button className="btn-icon"><MoreVertical size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="text-center py-12 text-slate-400">
                  <Package size={48} className="mx-auto mb-4 opacity-20" />
                  <p>No assets listed yet. Start by adding your first item!</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <style>{`
        .manage-assets {
          padding-top: 32px;
        }
        .stats-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          margin: 32px 0;
        }
        .stat-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px;
        }
        .stat-info .label {
          display: block;
          font-size: 0.875rem;
          color: var(--text-muted);
          margin-bottom: 4px;
        }
        .stat-info .value {
          font-size: 1.5rem;
          font-weight: 800;
        }
        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .bg-green-50 { background: #ecfdf5; }
        .bg-blue-50 { background: #eff6ff; }
        .bg-amber-50 { background: #fffbeb; }
        
        .table-container {
          padding: 0;
          overflow: hidden;
        }
        .table-header {
          padding: 20px;
          display: flex;
          justify-content: space-between;
          border-bottom: 1px solid var(--border);
        }
        .assets-table {
          width: 100%;
          border-collapse: collapse;
        }
        .assets-table th {
          text-align: left;
          padding: 16px 20px;
          font-size: 0.75rem;
          text-transform: uppercase;
          color: var(--text-muted);
          letter-spacing: 0.05em;
          background: #f8fafc;
        }
        .assets-table td {
          padding: 16px 20px;
          border-bottom: 1px solid var(--border);
        }
        .asset-cell {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .asset-img-sm {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          overflow: hidden;
        }
        .asset-img-sm img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .badge-type {
          background: #f1f5f9;
          padding: 4px 10px;
          border-radius: 8px;
          font-size: 0.75rem;
          font-weight: 700;
        }
        .status-pill {
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .status-pill.online { background: #ecfdf5; color: #10b981; }
        .status-pill.offline { background: #fef2f2; color: #ef4444; }
        
        .action-buttons {
          display: flex;
          gap: 8px;
        }
        .btn-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }
        .btn-icon:hover { background: #f1f5f9; }

        @media (max-width: 768px) {
          .stats-row { grid-template-columns: 1fr; }
          .assets-table th:nth-child(3), .assets-table td:nth-child(3) { display: none; }
        }
      `}</style>
    </div>
  );
};

export default ManageAssets;
