import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Filter, Star, MapPin } from 'lucide-react';

const Services: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = ['All', 'Equipment', 'Services', 'Transport', 'Workers'];

  const services = [
    { id: 1, name: 'John Deere 5050D', category: 'Equipment', price: '₹800/hr', rating: 4.8, reviews: 124, distance: '2.5 km', image: 'https://images.unsplash.com/photo-1594494252110-388277977465?auto=format&fit=crop&q=80&w=400' },
    { id: 2, name: 'Paddy Harvester', category: 'Equipment', price: '₹1200/hr', rating: 4.9, reviews: 86, distance: '4.1 km', image: 'https://images.unsplash.com/photo-1592982537447-6f2a6a0c7c18?auto=format&fit=crop&q=80&w=400' },
    { id: 3, name: 'Soil Testing Service', category: 'Services', price: '₹500/sample', rating: 4.7, reviews: 42, distance: '1.2 km', image: 'https://images.unsplash.com/photo-1595113316349-9fa4ee24f884?auto=format&fit=crop&q=80&w=400' },
    { id: 4, name: 'Mini Truck Delivery', category: 'Transport', price: '₹20/km', rating: 4.6, reviews: 215, distance: '3.8 km', image: 'https://images.unsplash.com/photo-1580674285054-bed31e145f59?auto=format&fit=crop&q=80&w=400' },
  ];

  const filteredServices = activeCategory === 'All' 
    ? services 
    : services.filter(s => s.category === activeCategory);

  return (
    <div className="services-page fade-in">
      <div className="container">
        <div className="page-header">
          <h2>Agricultural Services</h2>
          <button className="filter-btn">
            <Filter size={18} />
            <span>Filter</span>
          </button>
        </div>

        <div className="category-pills">
          {categories.map(cat => (
            <button
              key={cat}
              className={`pill ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="services-grid">
          {filteredServices.map(service => (
            <motion.div
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              key={service.id}
              className="service-card"
            >
              <div className="service-image">
                <img src={service.image} alt={service.name} />
                <span className="category-tag">{service.category}</span>
              </div>
              <div className="service-info">
                <div className="service-top">
                  <h4>{service.name}</h4>
                  <div className="rating">
                    <Star size={14} fill="#f9a825" color="#f9a825" />
                    <span>{service.rating} ({service.reviews})</span>
                  </div>
                </div>
                <div className="distance">
                  <MapPin size={14} />
                  <span>{service.distance} away</span>
                </div>
                <div className="service-footer">
                  <span className="price">{service.price}</span>
                  <button className="btn-book">Book Now</button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Services;
