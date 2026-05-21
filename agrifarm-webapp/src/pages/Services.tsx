import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { apiService } from '../services/apiService';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Star, MapPin, SlidersHorizontal, Info, Hammer, Truck, Users } from 'lucide-react';
import BookingModal from '../components/BookingModal';


interface ServiceItem {
  id: string;
  name: string;
  category: string;
  price: string;
  imageUrl?: string;
  rating?: number;
  location?: string;
  type: 'Service' | 'Transport' | 'Worker';
  specs?: string;
}

const Services: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const initialFilter = location.state?.initialFilter || 'All';

  const [items, setItems] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(initialFilter);
  const [searchQuery, setSearchQuery] = useState(location.state?.initialSearch || '');
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);


  const categories = ['All', 'Services', 'Transport', 'Workers'];

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const [serv, veh, work] = await Promise.all([
          apiService.getServices(),
          apiService.getVehicles(),
          apiService.getWorkerGroups()
        ]);

        const normalized: ServiceItem[] = [
          ...serv.data.map((s: any) => ({
            id: s.serviceId,
            name: s.businessName,
            category: s.serviceType,
            price: `₹${s.priceRate}`,
            imageUrl: s.imageUrl,
            type: 'Service',
            location: s.village
          })),
          ...veh.data.map((v: any) => ({
            id: v.vehicleId,
            name: v.vehicleType,
            category: 'Transport',
            price: `₹${v.pricePerKmOrTrip}`,
            imageUrl: v.imageUrl,
            type: 'Transport',
            location: v.village,
            specs: v.tonnage ? `${v.tonnage} Ton` : undefined
          })),
          ...work.data.map((w: any) => ({
            id: w.groupId,
            name: w.groupName,
            category: 'Manual Labor',
            price: `₹${w.pricePerMale}/day`,
            imageUrl: w.imageUrl,
            type: 'Worker',
            location: w.village,
            specs: `${(w.numMales || 0) + (w.numFemales || 0)} People`
          }))
        ];

        setItems(normalized);
      } catch (error) {
        console.error('Error fetching services:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  const filteredItems = items.filter(item => {
    const matchesFilter = filter === 'All' || 
                         (filter === 'Services' && item.type === 'Service') ||
                         (filter === 'Transport' && item.type === 'Transport') ||
                         (filter === 'Workers' && item.type === 'Worker');
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="services-page container fade-in">
      <div className="page-header">
        <div>
          <h1 className="text-3xl font-bold">Agri Services</h1>
          <p className="text-slate-500">Book skilled professionals and transport for your needs</p>
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
            placeholder="Search for services, vehicles, or labor..." 
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
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="skeleton-card"></div>
          ))}
        </div>
      ) : (
        <div className="assets-grid">
          <AnimatePresence>
            {filteredItems.map((item) => (
              <motion.div 
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="asset-card"
              >
                <div className="asset-image">
                  <img src={apiService.getFullImageUrl(item.imageUrl) || 'https://images.unsplash.com/photo-1594913785162-e6785b493bd2?auto=format&fit=crop&q=80&w=400'} alt={item.name} />
                  <div className="category-tag">
                    {item.type === 'Service' && <Hammer size={12} />}
                    {item.type === 'Transport' && <Truck size={12} />}
                    {item.type === 'Worker' && <Users size={12} />}
                    <span>{item.type}</span>
                  </div>
                </div>
                <div className="asset-info">
                  <div className="asset-top">
                    <h4>{item.name}</h4>
                    <div className="rating">
                      <Star size={14} fill="#f9a825" color="#f9a825" />
                      <span>{item.rating || '4.5'}</span>
                    </div>
                  </div>
                  <div className="asset-details">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="category">{item.category}</p>
                      {item.specs && <span className="spec-badge">{item.specs}</span>}
                    </div>
                    <div className="location">
                      <MapPin size={14} />
                      <span>{item.location || 'Local'}</span>
                    </div>
                  </div>
                  <div className="asset-footer">
                    <div className="price-tag">
                      <span className="amount">{item.price}</span>
                    </div>
                    <button 
                      className="btn-book"
                      onClick={() => {
                        if (!isAuthenticated) {
                          navigate('/login');
                          return;
                        }
                        setSelectedAsset({
                          id: item.id,
                          name: item.name,
                          category: item.category,
                          price: parseFloat(item.price.replace(/[^0-9.]/g, '')),
                          providerId: (item as any).providerId || 'owner123',
                          providerName: (item as any).providerName || 'Service Provider',
                          imageUrl: item.imageUrl,
                          type: item.type,
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

      {!loading && filteredItems.length === 0 && (
        <div className="empty-state">
          <Info size={48} className="text-slate-300" />
          <h3>No Services Found</h3>
          <p>Try adjusting your search or filters</p>
        </div>
      )}

      <style>{`
        .services-page { padding-top: 24px; }
        .search-bar-row { margin: 24px 0; max-width: 600px; }
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
        .asset-image { height: 180px; position: relative; }
        .asset-image img { width: 100%; height: 100%; object-fit: cover; }
        
        .category-tag {
          position: absolute;
          top: 12px;
          left: 12px;
          background: rgba(0, 0, 0, 0.6);
          color: white;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 700;
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .asset-info { padding: 20px; }
        .asset-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
        .asset-top h4 { font-size: 1.15rem; font-weight: 700; }
        .rating { display: flex; align-items: center; gap: 4px; font-weight: 700; font-size: 0.875rem; }
        .asset-details { margin-bottom: 16px; }
        .category { color: var(--primary); font-weight: 700; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
        .location { display: flex; align-items: center; gap: 4px; color: var(--text-muted); font-size: 0.875rem; }
        .asset-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 16px; border-top: 1px dashed var(--border); }
        .price-tag .amount { font-size: 1.25rem; font-weight: 800; color: var(--text-main); }
        .btn-book { background: var(--primary); color: white; padding: 8px 18px; border-radius: 12px; font-weight: 700; font-size: 0.875rem; transition: all 0.2s; }
        .btn-book:hover { background: var(--primary-dark); transform: scale(1.05); }
        .skeleton-card { height: 320px; background: #f1f5f9; border-radius: 24px; animation: pulse 1.5s infinite; }
        .empty-state { text-align: center; padding: 60px; color: var(--text-muted); }
        @keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 0.3; } 100% { opacity: 0.6; } }
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

export default Services;

