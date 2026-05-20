import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Star, MapPin, SlidersHorizontal, Info } from 'lucide-react';
import BookingModal from '../components/BookingModal';


interface Equipment {
  equipmentId: string;
  category: string;
  brandModel: string;
  pricePerHour: number;
  imageUrl?: string;
  rating?: number;
  village?: string;
  isAvailable: boolean;
  hp?: number;
}

const Rentals: React.FC = () => {
  const location = useLocation();
  const initialFilter = location.state?.initialFilter || 'All';

  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(initialFilter);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);


  const categories = ['All', 'Tractor', 'Harvester', 'Plough', 'Seeder', 'Sprayer'];

  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        const response = await apiService.getEquipment();
        setEquipment(response.data);
      } catch (error) {
        console.error('Error fetching equipment:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEquipment();
  }, []);

  const filteredEquipment = equipment.filter(item => {
    const itemCat = item.category.toLowerCase();
    const activeFilter = filter.toLowerCase();
    
    const matchesFilter = filter === 'All' || 
                         itemCat === activeFilter || 
                         itemCat === `${activeFilter}s` || 
                         activeFilter === `${itemCat}s` ||
                         itemCat.includes(activeFilter) ||
                         activeFilter.includes(itemCat);

    const matchesSearch = item.brandModel.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="rentals-page container fade-in">
      <div className="page-header">
        <div>
          <h1 className="text-3xl font-bold">Equipment Rentals</h1>
          <p className="text-slate-500">Find the best machinery for your farm</p>
        </div>
        <button className="filter-btn">
          <SlidersHorizontal size={20} />
          <span>Filters</span>
        </button>
      </div>

      <div className="search-bar-row">
        <div className="search-box">
          <Search size={20} className="text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by brand or category..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="category-pills">
        {categories.map(cat => (
          <button 
            key={cat}
            className={`pill ${filter === cat ? 'active' : ''}`}
            onClick={() => setFilter(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-grid">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="skeleton-card"></div>
          ))}
        </div>
      ) : (
        <div className="assets-grid">
          <AnimatePresence>
            {filteredEquipment.map((item) => (
              <motion.div 
                key={item.equipmentId}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="asset-card"
              >
                <div className="asset-image">
                  <img src={item.imageUrl || 'https://images.unsplash.com/photo-1594913785162-e6785b493bd2?auto=format&fit=crop&q=80&w=400'} alt={item.brandModel} />
                  {!item.isAvailable && <div className="status-badge busy">Booked</div>}
                  {item.isAvailable && <div className="status-badge available">Available</div>}
                </div>
                <div className="asset-info">
                  <div className="asset-top">
                    <h4>{item.brandModel}</h4>
                    <div className="rating">
                      <Star size={14} fill="#f9a825" color="#f9a825" />
                      <span>{item.rating || '4.5'}</span>
                    </div>
                  </div>
                  <div className="asset-details">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="category">{item.category}</p>
                      {item.hp && <span className="spec-badge">{item.hp} HP</span>}
                    </div>
                    <div className="location">
                      <MapPin size={14} />
                      <span>{item.village || 'Local'}</span>
                    </div>
                  </div>
                  <div className="asset-footer">
                    <div className="price-tag">
                      <span className="amount">₹{item.pricePerHour}</span>
                      <span className="unit">/hr</span>
                    </div>
                    <button 
                      className="btn-book"
                      onClick={() => {
                        setSelectedAsset({
                          id: item.equipmentId,
                          name: item.brandModel,
                          category: item.category,
                          price: item.pricePerHour,
                          providerId: (item as any).ownerId, // API should provide this
                          providerName: (item as any).providerName || 'Equipment Owner',
                          imageUrl: item.imageUrl,
                          type: 'Equipment',
                          operatorPrice: (item as any).operatorPrice
                        });
                        setIsModalOpen(true);
                      }}
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {selectedAsset && (
        <BookingModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          asset={selectedAsset}
        />
      )}

      {!loading && filteredEquipment.length === 0 && (
        <div className="empty-state">
          <Info size={48} className="text-slate-300" />
          <h3>No Equipment Found</h3>
          <p>Try adjusting your search or filters</p>
        </div>
      )}

      <style>{`
        .rentals-page {
          padding-top: 24px;
        }
        .search-bar-row {
          margin: 24px 0;
          max-width: 600px;
        }
        .assets-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 24px;
          margin-bottom: 40px;
        }
        .asset-card {
          background: white;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: var(--shadow-md);
          border: 1px solid var(--border);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .asset-card:hover {
          transform: translateY(-8px);
          box-shadow: var(--shadow-xl);
          border-color: var(--primary-light);
        }
        .asset-image {
          height: 180px;
          position: relative;
        }
        .asset-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .status-badge {
          position: absolute;
          top: 12px;
          right: 12px;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 800;
          backdrop-filter: blur(8px);
        }
        .status-badge.available {
          background: rgba(16, 185, 129, 0.9);
          color: white;
        }
        .status-badge.busy {
          background: rgba(239, 68, 68, 0.9);
          color: white;
        }
        .asset-info {
          padding: 20px;
        }
        .asset-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }
        .asset-top h4 {
          font-size: 1.15rem;
          font-weight: 700;
        }
        .rating {
          display: flex;
          align-items: center;
          gap: 4px;
          font-weight: 700;
          font-size: 0.875rem;
        }
        .asset-details {
          margin-bottom: 16px;
        }
        .category {
          color: var(--primary);
          font-weight: 700;
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }
        .location {
          display: flex;
          align-items: center;
          gap: 4px;
          color: var(--text-muted);
          font-size: 0.875rem;
        }
        .asset-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 16px;
          border-top: 1px dashed var(--border);
        }
        .price-tag .amount {
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--text-main);
        }
        .price-tag .unit {
          font-size: 0.875rem;
          color: var(--text-muted);
          margin-left: 2px;
        }
        .btn-book {
          background: var(--primary);
          color: white;
          padding: 8px 18px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 0.875rem;
          transition: all 0.2s;
        }
        .btn-book:hover {
          background: var(--primary-dark);
          transform: scale(1.05);
        }
        .skeleton-card {
          height: 320px;
          background: #f1f5f9;
          border-radius: 24px;
          animation: pulse 1.5s infinite;
        }
        .empty-state {
          text-align: center;
          padding: 60px;
          color: var(--text-muted);
        }
        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 0.3; }
          100% { opacity: 0.6; }
        }
        .spec-badge {
          background: #f1f5f9;
          color: #475569;
          font-size: 0.7rem;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
        }
      `}</style>
    </div>
  );
};

export default Rentals;
