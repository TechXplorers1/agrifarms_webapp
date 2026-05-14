import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { motion } from 'framer-motion';
import { ShieldCheck, ChevronRight, ArrowLeft } from 'lucide-react';

const VerifyOTP: React.FC = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const { verifyOtp, isLoading } = useAuth();
  const navigate = useNavigate();
  const phoneNumber = localStorage.getItem('pending_phone');

  useEffect(() => {
    if (!phoneNumber) navigate('/login');
  }, [phoneNumber, navigate]);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) value = value[value.length - 1];
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpValue = otp.join('');
    if (otpValue.length === 6) {
      try {
        await verifyOtp(otpValue);
        navigate('/');
      } catch (err) {
        setError('Invalid OTP. Please try again.');
      }
    }
  };

  return (
    <div className="login-page">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="login-card glass"
      >
        <button onClick={() => navigate('/login')} className="btn-back">
          <ArrowLeft size={20} />
        </button>

        <div className="login-header">
          <div className="login-logo">
            <ShieldCheck size={40} color="var(--primary)" />
          </div>
          <h1>Verify Identity</h1>
          <p>Enter the 6-digit code sent to<br/><strong>+91 {phoneNumber}</strong></p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="otp-container">
            {otp.map((digit, index) => (
              <input
                key={index}
                id={`otp-${index}`}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className={error ? 'error' : ''}
                autoFocus={index === 0}
              />
            ))}
          </div>

          {error && <p className="error-message">{error}</p>}

          <button 
            type="submit" 
            className="btn-login"
            disabled={otp.join('').length < 6 || isLoading}
          >
            {isLoading ? 'Verifying...' : 'Verify & Continue'}
            <ChevronRight size={20} />
          </button>
        </form>

        <div className="login-footer">
          <p>Didn't receive code? <span>Resend OTP</span></p>
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
          position: relative;
        }
        .btn-back {
          position: absolute;
          top: 24px;
          left: 24px;
          background: #f1f5f9;
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-main);
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
          line-height: 1.5;
        }
        .otp-container {
          display: flex;
          gap: 10px;
          justify-content: center;
          margin-bottom: 32px;
        }
        .otp-container input {
          width: 48px;
          height: 56px;
          border-radius: 12px;
          border: 2px solid #f1f5f9;
          background: #f1f5f9;
          text-align: center;
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-main);
          transition: all 0.2s;
        }
        .otp-container input:focus {
          border-color: var(--primary);
          background: white;
          outline: none;
          box-shadow: 0 0 0 4px rgba(0, 170, 85, 0.1);
        }
        .otp-container input.error {
          border-color: var(--error);
          background: #fef2f2;
        }
        .error-message {
          color: var(--error);
          font-size: 0.875rem;
          font-weight: 600;
          text-align: center;
          margin-top: -16px;
          margin-bottom: 24px;
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
        }
        .btn-login:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0, 170, 85, 0.4);
        }
        .login-footer {
          margin-top: 32px;
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

export default VerifyOTP;
