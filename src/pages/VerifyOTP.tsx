import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { motion } from 'framer-motion';
import { ShieldCheck, ChevronRight, ArrowLeft, AlertCircle } from 'lucide-react';

const VerifyOTP: React.FC = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [secondsRemaining, setSecondsRemaining] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const { verifyPhoneOtp, resendPhoneOtp, pendingPhone, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    } else if (!pendingPhone) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, pendingPhone, navigate]);

  useEffect(() => {
    let timer: any;
    if (secondsRemaining > 0) {
      timer = setInterval(() => {
        setSecondsRemaining((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(timer);
  }, [secondsRemaining]);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) value = value[value.length - 1];
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

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

  const handleResend = async () => {
    if (!canResend || isResending) return;
    setIsResending(true);
    setError('');

    try {
      await resendPhoneOtp();
      setSecondsRemaining(60);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      setError('A fresh 6-digit OTP code has been sent successfully.');
    } catch (err) {
      setError('Failed to resend OTP. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpValue = otp.join('');
    if (otpValue.length === 6) {
      try {
        await verifyPhoneOtp(otpValue);
        navigate('/');
      } catch (err: any) {
        setError(err.message || 'Invalid or expired OTP. Please try again.');
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
        <button onClick={() => navigate('/login')} className="btn-back" title="Back to Login">
          <ArrowLeft size={20} />
        </button>

        <div className="login-header">
          <div className="login-logo">
            <ShieldCheck size={40} color="var(--primary)" />
          </div>
          <h1>Verify Identity</h1>
          <p>Enter the 6-digit OTP code sent to<br/><strong>+91 {pendingPhone}</strong></p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="otp-container">
            {otp.map((digit, index) => (
              <input
                key={index}
                id={`otp-${index}`}
                type="text"
                maxLength={1}
                inputMode="numeric"
                pattern="[0-9]*"
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className={error && !error.includes('successfully') ? 'error' : ''}
                autoFocus={index === 0}
              />
            ))}
          </div>

          {error && (
            <div className={`error-message ${error.includes('successfully') ? 'success-text' : ''}`}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <button 
            type="submit" 
            className="btn-login"
            disabled={otp.join('').length < 6 || isLoading}
          >
            {isLoading ? 'Verifying...' : 'Verify & Proceed'}
            <ChevronRight size={20} />
          </button>
        </form>

        <div className="login-footer">
          {canResend ? (
            <p>Didn't receive code? <span onClick={handleResend} style={{ cursor: 'pointer', color: 'var(--primary)', fontWeight: 700 }}>Resend OTP</span></p>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>Resend code in <strong style={{ color: 'var(--primary)' }}>{secondsRemaining}s</strong></p>
          )}
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
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-main);
          cursor: pointer;
          transition: background 0.2s;
        }
        .btn-back:hover {
          background: #e2e8f0;
        }
        .login-header {
          text-align: center;
          margin-bottom: 28px;
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
          margin-bottom: 8px;
          font-weight: 800;
        }
        .login-header p {
          color: var(--text-muted);
          line-height: 1.5;
          font-size: 0.95rem;
        }
        .otp-container {
          display: flex;
          gap: 10px;
          justify-content: center;
          margin-bottom: 28px;
        }
        .otp-container input {
          width: 50px;
          height: 58px;
          border-radius: 14px;
          border: 2px solid #f1f5f9;
          background: #f1f5f9;
          text-align: center;
          font-size: 1.5rem;
          font-weight: 800;
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
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: -12px;
          margin-bottom: 20px;
          padding: 8px 14px;
          background: #fef2f2;
          border-radius: 10px;
        }
        .error-message.success-text {
          color: #059669;
          background: #ecfdf5;
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
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(0, 170, 85, 0.3);
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
          margin-top: 24px;
          text-align: center;
          font-size: 0.875rem;
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
};

export default VerifyOTP;
