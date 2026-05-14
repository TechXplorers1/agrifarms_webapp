import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { motion } from 'framer-motion';
import { Phone, ChevronRight, Sprout } from 'lucide-react';

const Login: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneNumber.length >= 10) {
      await login(phoneNumber);
      navigate('/verify-otp');
    }
  };

  return (
    <div className="login-page">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="login-card glass"
      >
        <div className="login-header">
          <div className="login-logo">
            <Sprout size={40} color="var(--primary)" />
          </div>
          <h1>Welcome to Agri Farms</h1>
          <p>Your digital partner in farming</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label htmlFor="phone">Phone Number</label>
            <div className="input-wrapper">
              <Phone size={20} className="input-icon" />
              <span>+91</span>
              <input
                id="phone"
                type="tel"
                placeholder="Enter 10 digit number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn-login"
            disabled={phoneNumber.length < 10 || isLoading}
          >
            {isLoading ? 'Sending...' : 'Get OTP'}
            <ChevronRight size={20} />
          </button>
        </form>

        <div className="login-footer">
          <p>By continuing, you agree to our <span>Terms & Conditions</span></p>
        </div>
      </motion.div>

      <style>{`
        .login-page {
          min-height: calc(100vh - 70px);
          display: flex;
          align-items: center;
          justify-content: center;
          background: url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80') center/cover no-repeat;
          position: relative;
        }
        .login-page::before {
          content: '';
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.4);
        }
        .login-card {
          width: 100%;
          max-width: 420px;
          padding: 40px;
          border-radius: 32px;
          z-index: 1;
        }
        .login-header {
          text-align: center;
          margin-bottom: 32px;
        }
        .login-logo {
          background: white;
          width: 80px;
          height: 80px;
          border-radius: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
          box-shadow: var(--shadow-lg);
        }
        .login-header h1 {
          font-size: 1.75rem;
          margin-bottom: 8px;
        }
        .login-header p {
          color: var(--text-muted);
        }
        .input-group {
          margin-bottom: 24px;
        }
        .input-group label {
          display: block;
          font-weight: 600;
          margin-bottom: 8px;
          font-size: 0.875rem;
        }
        .input-wrapper {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #f1f5f9;
          padding: 12px 16px;
          border-radius: 16px;
          border: 2px solid transparent;
          transition: all 0.2s;
        }
        .input-wrapper:focus-within {
          border-color: var(--primary);
          background: white;
        }
        .input-wrapper span {
          font-weight: 700;
          color: var(--text-main);
          border-right: 1px solid var(--border);
          padding-right: 12px;
        }
        .input-wrapper input {
          background: transparent;
          border: none;
          outline: none;
          width: 100%;
          font-size: 1rem;
          font-weight: 600;
        }
        .btn-login {
          width: 100%;
          background: var(--primary);
          color: white;
          padding: 16px;
          border-radius: 16px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s;
          box-shadow: 0 4px 12px rgba(0, 170, 85, 0.3);
        }
        .btn-login:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0, 170, 85, 0.4);
        }
        .btn-login:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .login-footer {
          margin-top: 32px;
          text-align: center;
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        .login-footer span {
          color: var(--primary);
          font-weight: 700;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export default Login;
