import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../services/LanguageContext';
import { motion } from 'framer-motion';
import {
  CloudSun, Sprout, TrendingUp, Calculator,
  ArrowLeft, Construction
} from 'lucide-react';

const ToolPlaceholder: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();

  // Resolve active tool metadata from pathname
  const getToolMetadata = () => {
    const path = location.pathname.toLowerCase();
    if (path.includes('weather')) {
      return {
        id: 'weather',
        title: t('tool.weather'),
        icon: CloudSun,
        color: '#fff8e1',
        fg: '#f57f17',
        bgGlow: 'rgba(251, 192, 45, 0.15)'
      };
    } else if (path.includes('crop-advice')) {
      return {
        id: 'crop',
        title: t('tool.cropAdvice'),
        icon: Sprout,
        color: '#e8f5e9',
        fg: '#00aa55',
        bgGlow: 'rgba(76, 175, 80, 0.15)'
      };
    } else if (path.includes('mandi-prices')) {
      return {
        id: 'mandi',
        title: t('tool.mandiPrices'),
        icon: TrendingUp,
        color: '#e3f2fd',
        fg: '#1565c0',
        bgGlow: 'rgba(33, 150, 243, 0.15)'
      };
    } else {
      return {
        id: 'calc',
        title: t('tool.calculator'),
        icon: Calculator,
        color: '#f3e5f5',
        fg: '#6a1b9a',
        bgGlow: 'rgba(156, 39, 176, 0.15)'
      };
    }
  };

  const tool = getToolMetadata();

  return (
    <div className="tool-placeholder-page container fade-in">
      <div className="settings-header-row">
        <motion.button
          whileHover={{ scale: 1.05, x: -2 }}
          whileTap={{ scale: 0.95 }}
          className="back-arrow-btn"
          onClick={() => navigate('/')}
        >
          <ArrowLeft size={20} />
        </motion.button>
        <div>
          <h1 className="text-3xl font-extrabold">{tool.title}</h1>
          <p className="text-slate-500">Agri Farms Premium Smart Tools</p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="placeholder-card card glass-settings text-center"
        style={{
          padding: '56px 40px',
          borderRadius: '32px',
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.45)',
          boxShadow: '0 20px 50px rgba(15, 23, 42, 0.04)',
          maxWidth: '680px',
          margin: '0 auto'
        }}
      >
        {/* Glowing Animated Circular Shield */}
        <motion.div
          animate={{
            scale: [1, 1.05, 1],
            boxShadow: [
              `0 10px 30px -5px ${tool.fg}22`,
              `0 20px 40px 0px ${tool.fg}33`,
              `0 10px 30px -5px ${tool.fg}22`
            ]
          }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          style={{
            background: tool.color,
            color: tool.fg,
            width: '96px',
            height: '96px',
            borderRadius: '30px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 28px auto',
            border: '1.5px solid rgba(255, 255, 255, 0.65)',
            position: 'relative'
          }}
        >
          <tool.icon size={44} style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.06))' }} />

          {/* Animated decorative ring */}
          <div style={{
            position: 'absolute',
            top: '-6px', left: '-6px', right: '-6px', bottom: '-6px',
            border: `2px dashed ${tool.fg}40`,
            borderRadius: '36px',
            animation: 'spin 16s linear infinite'
          }} />
        </motion.div>

        <h3 style={{
          fontSize: '1.8rem',
          fontWeight: 900,
          color: 'var(--text-main)',
          marginBottom: '12px',
          letterSpacing: '-0.5px'
        }}>
          {tool.title} Service
        </h3>

        <p style={{
          fontSize: '1.12rem',
          color: 'var(--text-muted)',
          fontWeight: 700,
          lineHeight: 1.6,
          maxWidth: '460px',
          margin: '0 auto 36px auto'
        }}>
          {t('tool.comingSoon') || 'The service will come in next updated.'}
        </p>

        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '12px',
          background: 'rgba(241, 245, 249, 0.5)',
          padding: '14px 24px',
          borderRadius: '16px',
          width: 'fit-content',
          margin: '0 auto 36px auto',
          border: '1px solid #f1f5f9'
        }}>
          <Construction size={18} color="#94a3b8" />
          <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 700 }}>
            Under active development for next release
          </span>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/')}
          className="btn-primary"
          style={{
            padding: '14px 44px',
            borderRadius: '18px',
            fontSize: '0.98rem',
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: '0 8px 20px rgba(16, 185, 129, 0.25)'
          }}
        >
          {t('nav.home') === 'Home' ? 'Back to Home' : t('nav.home')}
        </motion.button>
      </motion.div>

      <style>{`
        .tool-placeholder-page {
          padding-top: 40px;
          padding-bottom: 80px;
          max-width: 720px !important;
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

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ToolPlaceholder;
