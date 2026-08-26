import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { motion } from 'framer-motion';
import { Phone, User as UserIcon, ChevronRight, Sprout, AlertCircle, CheckCircle2 } from 'lucide-react';

const Login: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('FARMER');

  // Messages
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const { sendPhoneOtp, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhoneNumber(val);
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (phoneNumber.length !== 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (isSignUp && !fullName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }

    try {
      await sendPhoneOtp(phoneNumber, !isSignUp, isSignUp ? fullName.trim() : undefined, isSignUp ? role : undefined);
      navigate('/verify-otp');
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please check details and try again.');
    }
  };

  const isFormValid = phoneNumber.length === 10 && (!isSignUp || fullName.trim().length > 0);

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
          <h1>Agri Farms</h1>
          <p>{isSignUp ? 'Join the agricultural community' : 'Login with Mobile Number & OTP'}</p>
        </div>

        {/* Auth Mode Tabs */}
        <div className="auth-tabs">
          <button
            type="button"
            className={`tab-btn ${!isSignUp ? 'active' : ''}`}
            onClick={() => {
              setIsSignUp(false);
              setErrorMsg('');
              setSuccessMsg('');
            }}
          >
            Login
          </button>
          <button
            type="button"
            className={`tab-btn ${isSignUp ? 'active' : ''}`}
            onClick={() => {
              setIsSignUp(true);
              setErrorMsg('');
              setSuccessMsg('');
            }}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {isSignUp && (
            <>
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="input-group"
              >
                <label htmlFor="fullName">Full Name</label>
                <div className="input-wrapper">
                  <UserIcon size={20} className="input-icon" />
                  <input
                    id="fullName"
                    type="text"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      setErrorMsg('');
                    }}
                    required={isSignUp}
                  />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="input-group"
              >
                <label htmlFor="role">Select Your Role</label>
                <div className="input-wrapper select-wrapper">
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    required={isSignUp}
                  >
                    <option value="FARMER">Farmer</option>
                    <option value="OWNER">Equipment / Service Owner</option>
                  </select>
                </div>
              </motion.div>
            </>
          )}

          <div className="input-group">
            <label htmlFor="phoneNumber">Mobile Number</label>
            <div className="phone-input-row">
              <div className="country-code-box">
                <span>+91</span>
              </div>
              <div className="input-wrapper flex-1">
                <Phone size={20} className="input-icon" />
                <input
                  id="phoneNumber"
                  type="tel"
                  placeholder="00000 00000"
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  maxLength={10}
                  required
                />
              </div>
            </div>
          </div>

          {errorMsg && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="message-box error-message">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </motion.div>
          )}

          {successMsg && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="message-box success-message">
              <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </motion.div>
          )}

          <button
            type="submit"
            className="btn-login"
            disabled={!isFormValid || isLoading}
          >
            {isLoading ? 'Sending OTP...' : (isSignUp ? 'Register & Get OTP' : 'Get OTP')}
            <ChevronRight size={20} />
          </button>
        </form>

        <div className="login-footer">
          {isSignUp && (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px', lineHeight: '1.4' }}>
              By registering, you agree to Agri Farms' <Link to="/terms" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>Terms of Service</Link> and <Link to="/privacy-policy" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>Privacy Policy</Link>.
            </p>
          )}
          <p>
            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
            <span onClick={() => {
              setIsSignUp(!isSignUp);
              setErrorMsg('');
              setSuccessMsg('');
            }}>
              {isSignUp ? 'Login' : 'Sign Up'}
            </span>
          </p>
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
          max-width: 440px;
          padding: 40px;
          border-radius: 32px;
          z-index: 1;
        }
        .login-header {
          text-align: center;
          margin-bottom: 24px;
        }
        .login-logo {
          background: white;
          width: 76px;
          height: 76px;
          border-radius: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
          box-shadow: var(--shadow-lg);
        }
        .login-header h1 {
          font-size: 1.75rem;
          margin-bottom: 6px;
          font-weight: 800;
        }
        .login-header p {
          color: var(--text-muted);
          font-size: 0.95rem;
        }
        .auth-tabs {
          display: flex;
          background: #f1f5f9;
          padding: 4px;
          border-radius: 16px;
          margin-bottom: 28px;
        }
        .tab-btn {
          flex: 1;
          padding: 10px;
          border: none;
          background: transparent;
          border-radius: 12px;
          font-weight: 700;
          font-size: 0.9rem;
          color: var(--text-muted);
          cursor: pointer;
          transition: all 0.2s;
        }
        .tab-btn.active {
          background: white;
          color: var(--primary);
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }
        .input-group {
          margin-bottom: 20px;
        }
        .input-group label {
          display: block;
          font-weight: 700;
          margin-bottom: 8px;
          font-size: 0.875rem;
          color: var(--text-main);
        }
        .phone-input-row {
          display: flex;
          gap: 10px;
          align-items: center;
        }
        .country-code-box {
          background: #e8f5e9;
          border: 2px solid #c8e6c9;
          color: #1b5e20;
          font-weight: 800;
          font-size: 1rem;
          padding: 12px 16px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 52px;
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
          height: 52px;
        }
        .input-wrapper:focus-within {
          border-color: var(--primary);
          background: white;
          box-shadow: 0 0 0 4px rgba(0, 170, 85, 0.1);
        }
        .input-wrapper input, .input-wrapper select {
          background: transparent;
          border: none;
          outline: none;
          width: 100%;
          font-size: 1rem;
          font-weight: 700;
          color: var(--text-main);
        }
        .input-icon {
          color: var(--primary);
        }
        .select-wrapper select {
          cursor: pointer;
          -webkit-appearance: none;
          -moz-appearance: none;
          appearance: none;
        }
        .message-box {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 12px 16px;
          border-radius: 14px;
          margin-bottom: 20px;
          font-size: 0.875rem;
          font-weight: 600;
          line-height: 1.4;
        }
        .error-message {
          color: #ef4444;
          background: #fef2f2;
          border: 1px solid #fecaca;
        }
        .success-message {
          color: #059669;
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
        }
        .btn-login {
          width: 100%;
          background: var(--primary);
          color: white;
          padding: 16px;
          border-radius: 16px;
          font-weight: 700;
          font-size: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s;
          box-shadow: 0 4px 14px rgba(0, 170, 85, 0.3);
          border: none;
          cursor: pointer;
          margin-top: 10px;
        }
        .btn-login:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(0, 170, 85, 0.4);
        }
        .btn-login:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .login-footer {
          margin-top: 28px;
          text-align: center;
          font-size: 0.875rem;
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
