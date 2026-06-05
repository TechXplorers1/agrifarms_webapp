import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../services/LanguageContext';
import { motion } from 'framer-motion';
import { 
  Settings, Globe2, Bell, ShieldAlert, UserX, 
  ChevronRight, ArrowLeft 
} from 'lucide-react';

const AccountSettings: React.FC = () => {
  const { language, t } = useLanguage();
  const navigate = useNavigate();

  const getLanguageName = (lang: string) => {
    switch (lang) {
      case 'hi': return 'हिंदी (Hindi)';
      case 'te': return 'తెలుగు (Telugu)';
      case 'ta': return 'தமிழ் (Tamil)';
      case 'kn': return 'ಕನ್ನಡ (Kannada)';
      case 'mr': return 'मराठी (Marathi)';
      default: return 'English';
    }
  };

  const settingsItems = [
    {
      id: 'language',
      title: t('settings.chooseLanguage'),
      desc: t('profile.selectLanguage'),
      icon: Globe2,
      color: '#e8f5e9',
      fg: '#2e7d32',
      badge: getLanguageName(language),
      onClick: () => navigate('/select-language')
    },
    {
      id: 'notifications',
      title: t('settings.notificationPrefs'),
      desc: 'Customize your push alerts and mandi updates',
      icon: Bell,
      color: '#e3f2fd',
      fg: '#1565c0',
      badge: 'All Active',
      onClick: () => alert('Notification settings panel coming soon!')
    },
    {
      id: 'privacy',
      title: t('settings.accSecurity'),
      desc: t('profile.security'),
      icon: ShieldAlert,
      color: '#f3e5f5',
      fg: '#6a1b9a',
      onClick: () => navigate('/profile')
    },
    {
      id: 'delete',
      title: t('settings.deleteAcc'),
      desc: 'Permanently remove your farm profile data',
      icon: UserX,
      color: '#ffebee',
      fg: '#c62828',
      onClick: () => {
        if (window.confirm('Are you sure you want to delete your account? This action is irreversible.')) {
          alert('Account deletion initiated.');
        }
      }
    }
  ];

  return (
    <div className="settings-page container fade-in">
      <div className="settings-header-row">
        <motion.button 
          whileHover={{ scale: 1.05, x: -2 }}
          whileTap={{ scale: 0.95 }}
          className="back-arrow-btn"
          onClick={() => navigate('/profile')}
        >
          <ArrowLeft size={20} />
        </motion.button>
        <div>
          <h1 className="text-3xl font-extrabold">{t('settings.title')}</h1>
          <p className="text-slate-500">{t('settings.subtitle')}</p>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="settings-card-container card glass-settings"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '28px', borderBottom: '1px dashed var(--border)', paddingBottom: '20px' }}>
          <div style={{ background: 'var(--primary-light)', padding: '10px', borderRadius: '14px', color: 'var(--primary)' }}>
            <Settings size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>General Preferences</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>Configure language and account privacy options</p>
          </div>
        </div>

        <div className="settings-list">
          {settingsItems.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.08, duration: 0.4 }}
              whileHover={{ scale: 1.01, x: 4, background: '#fafbfc', borderColor: 'var(--primary-light)' }}
              whileTap={{ scale: 0.99 }}
              className={`settings-item-row ${item.id === 'delete' ? 'danger-hover' : ''}`}
              onClick={item.onClick}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                <div className="settings-icon-box" style={{ backgroundColor: item.color, color: item.fg }}>
                  <item.icon size={22} />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <h4 style={{ fontSize: '1.02rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>{item.title}</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '3px', margin: 0 }}>{item.desc}</p>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {item.badge && (
                  <span className="settings-badge" style={{ backgroundColor: item.color, color: item.fg }}>
                    {item.badge}
                  </span>
                )}
                <ChevronRight size={18} className="settings-chevron" />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <style>{`
        .settings-page {
          padding-top: 40px;
          max-width: 720px !important;
          padding-bottom: 80px;
        }
        
        .settings-header-row {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 32px;
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
        
        .settings-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .settings-item-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          background: white;
          border: 1.5px solid #f1f5f9;
          border-radius: 20px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        .settings-icon-box {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        
        .settings-badge {
          font-size: 0.75rem;
          font-weight: 800;
          padding: 4px 12px;
          border-radius: 8px;
          text-transform: capitalize;
        }
        
        .settings-chevron {
          color: #cbd5e1;
          transition: transform 0.2s ease;
        }
        
        .settings-item-row:hover .settings-chevron {
          transform: translateX(2px);
          color: var(--primary);
        }
        
        .danger-hover:hover {
          border-color: rgba(239, 68, 68, 0.25) !important;
        }
        
        .danger-hover:hover .settings-chevron {
          color: #ef4444 !important;
        }
      `}</style>
    </div>
  );
};

export default AccountSettings;
