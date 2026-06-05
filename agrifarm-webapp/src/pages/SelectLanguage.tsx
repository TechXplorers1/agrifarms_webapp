import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../services/LanguageContext';
import { motion } from 'framer-motion';
import { Sprout, Check, Globe2 } from 'lucide-react';
import { useAuth } from '../services/AuthContext';

type LanguageCode = 'en' | 'hi' | 'te' | 'ta' | 'kn' | 'mr';

interface LanguageOption {
  code: LanguageCode;
  nativeName: string;
  englishName: string;
}

const SelectLanguage: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const options: LanguageOption[] = [
    { code: 'en', nativeName: 'English', englishName: 'English' },
    { code: 'hi', nativeName: 'हिंदी', englishName: 'Hindi' },
    { code: 'te', nativeName: 'తెలుగు', englishName: 'Telugu' },
    { code: 'ta', nativeName: 'தமிழ்', englishName: 'Tamil' },
    { code: 'kn', nativeName: 'ಕನ್ನಡ', englishName: 'Kannada' },
    { code: 'mr', nativeName: 'मराठी', englishName: 'Marathi' },
  ];

  const handleSelect = (code: LanguageCode) => {
    setLanguage(code);
    setTimeout(() => {
      if (isAuthenticated) {
        navigate('/settings');
      } else {
        navigate('/');
      }
    }, 400); // Small premium delay to let the select check animation shine
  };

  return (
    <div className="select-lang-page container fade-in">


      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="select-lang-widescreen-container card glass-settings"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '28px', borderBottom: '1px dashed var(--border)', paddingBottom: '20px' }}>
          <div style={{ background: 'var(--primary-light)', padding: '10px', borderRadius: '14px', color: 'white' }}>
            <Globe2 size={24} />
          </div>
          <div style={{ textAlign: 'left' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              {t('settings.chooseLanguage')}
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              Select a language to update all menus, options, and content
            </p>
          </div>
        </div>

        {/* Widescreen Desktop Responsive Grid */}
        <div className="lang-responsive-grid">
          {options.map((opt, index) => {
            const isActive = opt.code === language;
            return (
              <motion.div
                key={opt.code}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.4 }}
                whileHover={{ scale: 1.03, translateY: -4 }}
                whileTap={{ scale: 0.98 }}
                className={`lang-grid-card ${isActive ? 'active-grid-card' : ''}`}
                onClick={() => handleSelect(opt.code)}
              >
                {/* Active Indicator Icon */}
                <div className={`active-check-badge ${isActive ? 'visible' : ''}`}>
                  <Check size={14} color="white" />
                </div>

                <div className="card-decor-leaf">
                  <Sprout size={18} className="decor-leaf" />
                </div>

                <div className="lang-info-block">
                  <span className="native-title">{opt.nativeName}</span>
                  <span className="english-title">{opt.englishName}</span>
                </div>
              </motion.div>
            );
          })}
        </div>

        <p className="bottom-note-web">
          {t('profile.changeSuccess') ? 'Instant translation applied. Change anytime from Settings.' : 'Translations will update instantly across all screens.'}
        </p>
      </motion.div>

      <style>{`
        .select-lang-page {
          padding-top: 40px;
          max-width: 960px !important;
          padding-bottom: 80px;
        }

        .settings-header-row {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 32px;
          text-align: left;
        }
        
        .back-arrow-btn {
          background: white;
          border: 1px solid var(--border);
          width: 46px;
          height: 46px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-main);
          box-shadow: var(--shadow-sm);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .back-arrow-btn:hover {
          background: var(--bg-main);
          color: var(--primary);
          border-color: rgba(0, 137, 71, 0.25);
        }

        .glass-settings {
          background: rgba(255, 255, 255, 0.85) !important;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.45);
          box-shadow: 0 15px 35px rgba(0,0,0,0.04);
          border-radius: 28px;
          padding: 36px;
        }

        /* Widescreen Responsive Grid */
        .lang-responsive-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-bottom: 24px;
          margin-top: 10px;
        }

        @media (max-width: 900px) {
          .lang-responsive-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 580px) {
          .lang-responsive-grid {
            grid-template-columns: 1fr;
          }
        }

        .lang-grid-card {
          background: white;
          border: 2px solid #f1f5f9;
          border-radius: 24px;
          padding: 24px;
          display: flex;
          align-items: center;
          gap: 16px;
          cursor: pointer;
          position: relative;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          text-align: left;
        }

        .lang-grid-card:hover {
          border-color: rgba(16, 185, 129, 0.25);
          background: #fafcfb;
          box-shadow: 0 12px 30px rgba(5, 150, 105, 0.05);
        }

        /* Active Grid Card Styling */
        .active-grid-card {
          border-color: var(--primary) !important;
          background: rgba(16, 185, 129, 0.03) !important;
          box-shadow: 0 12px 30px rgba(5, 150, 105, 0.08) !important;
        }

        .active-check-badge {
          position: absolute;
          top: 14px;
          right: 14px;
          width: 22px;
          height: 22px;
          background: var(--primary);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transform: scale(0.6);
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .active-check-badge.visible {
          opacity: 1;
          transform: scale(1);
        }

        .card-decor-leaf {
          width: 42px;
          height: 42px;
          background: #f1f5f9;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: #94a3b8;
          transition: all 0.3s ease;
        }

        .lang-grid-card:hover .card-decor-leaf {
          background: #e8f5e9;
          color: var(--primary);
          transform: rotate(10deg);
        }

        .active-grid-card .card-decor-leaf {
          background: #e8f5e9 !important;
          color: var(--primary) !important;
        }

        .lang-info-block {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .native-title {
          font-size: 1.25rem;
          font-weight: 900;
          color: #0f172a;
          transition: color 0.2s;
        }

        .active-grid-card .native-title {
          color: #064e3b;
        }

        .english-title {
          font-size: 0.85rem;
          color: #94a3b8;
          font-weight: 700;
        }

        .bottom-note-web {
          font-size: 0.88rem;
          color: #94a3b8;
          font-weight: 600;
          margin-top: 16px;
        }
      `}</style>
    </div>
  );
};

export default SelectLanguage;
