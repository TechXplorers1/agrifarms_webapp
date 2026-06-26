import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MessageSquare, ThumbsUp, UserCircle2, MessageCircle } from 'lucide-react';

const categories = ['All', 'Crops', 'Livestock', 'Machinery', 'Diseases', 'Market'];

const mockPosts = [
  {
    id: 1,
    author: 'Ramesh Singh',
    time: '2 hours ago',
    category: 'Diseases',
    content: 'My tomato leaves are curling and turning yellow at the edges. Is this leaf curl virus or nutrient deficiency? I have been using NPK 19:19:19.',
    likes: 12,
    comments: 5,
  },
  {
    id: 2,
    author: 'Suresh Patil',
    time: '5 hours ago',
    category: 'Machinery',
    content: 'Looking to buy a used rotavator. Which brand is best for hard clay soil? I have a 45HP tractor. Please suggest.',
    likes: 8,
    comments: 14,
  },
  {
    id: 3,
    author: 'Anil Kumar',
    time: '1 day ago',
    category: 'Market',
    content: 'The local Mandi price for Soybean has suddenly dropped by ₹300 per quintal. Should I hold my stock or sell it now? Anyone has market insights?',
    likes: 24,
    comments: 8,
  },
  {
    id: 4,
    author: 'Vinod Reddy',
    time: '1 day ago',
    category: 'Crops',
    content: 'Just successfully harvested my first batch of organic turmeric! Yield was slightly lower but the quality is excellent. Happy to share tips if anyone is interested.',
    likes: 45,
    comments: 12,
  }
];

const Community: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPosts = mockPosts.filter(post => {
    const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
    const matchesSearch = post.content.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          post.author.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="community-page container fade-in">
      <div className="community-header">
        <div className="header-content">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: 'white' }}>Community Forum</h1>
            <p style={{ color: 'rgba(255,255,255,0.8)' }}>Ask questions, share knowledge, and grow together.</p>
          </div>
          <div className="header-icon" style={{ background: 'rgba(255,255,255,0.2)', padding: '16px', borderRadius: '16px', color: 'white' }}>
            <MessageSquare size={32} />
          </div>
        </div>
        
        <div className="search-box">
          <Search size={20} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search interesting topics..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="categories-scroll">
        {categories.map(cat => (
          <button 
            key={cat}
            className={`cat-pill ${selectedCategory === cat ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="posts-list">
        <AnimatePresence>
          {filteredPosts.map(post => (
            <motion.div 
              key={post.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="post-card card"
            >
              <div className="post-header">
                <UserCircle2 size={40} color="#94a3b8" />
                <div className="post-meta">
                  <h4>{post.author}</h4>
                  <span>{post.time} • <span className="cat-tag">{post.category}</span></span>
                </div>
              </div>
              <p className="post-content">{post.content}</p>
              
              <div className="post-actions">
                <button className="action-btn">
                  <ThumbsUp size={18} />
                  <span>{post.likes} Likes</span>
                </button>
                <button className="action-btn">
                  <MessageCircle size={18} />
                  <span>{post.comments} Comments</span>
                </button>
              </div>
            </motion.div>
          ))}
          {filteredPosts.length === 0 && (
            <div className="empty-state">
              <MessageSquare size={48} color="#cbd5e1" style={{ marginBottom: '16px' }} />
              <h3>No posts found</h3>
              <p>Try searching for a different topic.</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Action Button for New Post */}
      <button className="fab">
        +
      </button>

      <style>{`
        .community-page {
          padding-top: 0;
          max-width: 700px !important;
          padding-bottom: 80px;
        }

        .community-header {
          background: linear-gradient(135deg, #059669 0%, #10b981 100%);
          margin: 0 -24px 24px -24px;
          padding: 40px 24px 30px 24px;
          border-radius: 0 0 32px 32px;
          box-shadow: var(--shadow-md);
        }

        @media (min-width: 768px) {
          .community-header {
            margin: 24px 0;
            border-radius: 32px;
          }
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .search-box {
          position: relative;
          width: 100%;
        }

        .search-box input {
          width: 100%;
          padding: 16px 20px 16px 50px;
          border-radius: 16px;
          border: none;
          font-size: 1rem;
          font-weight: 500;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }

        .search-box input:focus {
          outline: none;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        .search-icon {
          position: absolute;
          left: 20px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
        }

        .categories-scroll {
          display: flex;
          gap: 12px;
          overflow-x: auto;
          padding-bottom: 12px;
          margin-bottom: 24px;
          scrollbar-width: none; /* Firefox */
        }

        .categories-scroll::-webkit-scrollbar {
          display: none; /* Chrome */
        }

        .cat-pill {
          padding: 10px 20px;
          background: white;
          border-radius: 24px;
          font-weight: 700;
          font-size: 0.9rem;
          color: var(--text-muted);
          white-space: nowrap;
          box-shadow: var(--shadow-sm);
          border: 1px solid transparent;
          transition: all 0.2s;
        }

        .cat-pill:hover {
          border-color: #dcfce7;
        }

        .cat-pill.active {
          background: linear-gradient(135deg, #059669 0%, #10b981 100%);
          color: white;
          box-shadow: 0 4px 10px rgba(16, 185, 129, 0.3);
        }

        .posts-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .post-card {
          padding: 24px;
        }

        .post-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .post-meta h4 {
          margin: 0 0 2px 0;
          font-size: 1.05rem;
        }

        .post-meta span {
          font-size: 0.8rem;
          color: var(--text-muted);
        }

        .cat-tag {
          color: var(--primary);
          font-weight: 700;
        }

        .post-content {
          font-size: 1rem;
          line-height: 1.6;
          color: #334155;
          margin-bottom: 20px;
        }

        .post-actions {
          display: flex;
          gap: 16px;
          border-top: 1px solid #f1f5f9;
          padding-top: 16px;
        }

        .action-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: transparent;
          color: var(--text-muted);
          font-weight: 600;
          font-size: 0.9rem;
          padding: 8px 12px;
          border-radius: 8px;
        }

        .action-btn:hover {
          background: #f8fafc;
          color: var(--primary);
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: var(--text-muted);
        }

        .fab {
          position: fixed;
          bottom: 30px;
          right: 30px;
          width: 60px;
          height: 60px;
          border-radius: 30px;
          background: linear-gradient(135deg, #059669 0%, #10b981 100%);
          color: white;
          font-size: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 10px 25px rgba(16, 185, 129, 0.4);
          cursor: pointer;
          transition: transform 0.2s;
          z-index: 100;
        }

        .fab:hover {
          transform: scale(1.1);
        }
      `}</style>
    </div>
  );
};

export default Community;
