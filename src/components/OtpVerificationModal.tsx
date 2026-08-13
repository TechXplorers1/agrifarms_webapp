import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../services/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Clock, LogOut, RefreshCw, AlertCircle, ShieldCheck } from 'lucide-react';

const OtpVerificationModal: React.FC = () => {
  const {
    isVerifyingOtp,
    pendingEmail,
    verifyEmailOtp,
    resendEmailOtp,
    logout
  } = useAuth();

  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isResending, setIsResending] = useState<boolean>(false);
  
  // Timer state - 2 minutes (120 seconds)
  const [timeLeft, setTimeLeft] = useState<number>(120);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    let timer: any;
    if (isVerifyingOtp && timeLeft > 0 && !success) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isVerifyingOtp, timeLeft, success]);

  // Focus first input on open
  useEffect(() => {
    if (isVerifyingOtp) {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
      setTimeLeft(120);
      setOtp(['', '', '', '', '', '']);
      setError('');
      setSuccess(false);
      setIsVerifying(false);
      setIsResending(false);
    }
  }, [isVerifyingOtp]);

  if (!isVerifyingOtp) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleChange = (index: number, value: string) => {
    // Only allow numbers
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    // Keep only the last character entered
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError('');

    // Auto-advance to next input if filled
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        // Clear previous input and focus it
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
      } else {
        // Clear current input
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim();
    if (!/^\d{6}$/.test(pasteData)) return;

    const digits = pasteData.split('');
    setOtp(digits);
    setError('');
    
    // Focus last input
    inputRefs.current[5]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('Please enter a valid 6-digit OTP code.');
      return;
    }

    setIsVerifying(true);
    setError('');
    try {
      await verifyEmailOtp(otpCode);
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || 'Verification failed. Please check the code and try again.');
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (timeLeft > 0 || isResending) return;
    
    setIsResending(true);
    setError('');
    try {
      await resendEmailOtp();
      setTimeLeft(120);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      // Temporary user visual feedback
      setError('A fresh 6-digit OTP has been sent successfully.');
    } catch (err: any) {
      setError('Failed to resend OTP. Please try again later.');
    } finally {
      setIsResending(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Logout failed inside OTP modal', err);
    }
  };

  return (
    <AnimatePresence>
      <div className="otp-modal-overlay">
        <motion.div
          className="otp-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleLogout}
        />
        
        <motion.div
          className="otp-modal-card glass"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 350 }}
        >
          <div className="otp-modal-header">
            <div className="otp-shield-icon">
              <ShieldCheck size={38} color="#008947" />
            </div>
            <h2>Verify Your Email</h2>
            <p className="otp-subtitle">
              We have sent a secure 6-digit code to
            </p>
            <div className="otp-email-box">
              <Mail size={16} color="var(--primary)" />
              <span>{pendingEmail}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="otp-modal-form">
            <div className="otp-inputs-grid">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  disabled={isVerifying || success}
                  className={`otp-digit-input ${error && !digit ? 'input-error' : ''} ${digit ? 'input-filled' : ''}`}
                  autoComplete="one-time-code"
                />
              ))}
            </div>

            {error && (
              <motion.div 
                className={`otp-feedback-msg ${error.includes('sent successfully') ? 'info-msg' : 'error-msg'}`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <AlertCircle size={16} />
                <span>{error}</span>
              </motion.div>
            )}

            <button
              type="submit"
              className="btn-primary otp-submit-btn"
              disabled={otp.join('').length < 6 || isVerifying || success}
            >
              {isVerifying ? (
                <span className="otp-loader-flex">
                  <RefreshCw className="animate-spin" size={18} />
                  Verifying...
                </span>
              ) : success ? (
                'Verified Successfully!'
              ) : (
                'Verify & Login'
              )}
            </button>
          </form>

          <div className="otp-modal-footer">
            <div className="otp-timer-box">
              <Clock size={16} color={timeLeft > 0 ? "var(--text-muted)" : "var(--error)"} />
              <span className={timeLeft === 0 ? "timer-expired" : ""}>
                {timeLeft > 0 ? `Code expires in: ${formatTime(timeLeft)}` : "Code expired"}
              </span>
            </div>

            <div className="otp-footer-actions">
              <button
                type="button"
                className={`otp-action-link ${timeLeft > 0 ? 'disabled-link' : ''}`}
                onClick={handleResend}
                disabled={timeLeft > 0 || isResending}
              >
                {isResending ? (
                  <span className="action-loading">
                    <RefreshCw className="animate-spin" size={14} />
                    Resending
                  </span>
                ) : (
                  'Resend Code'
                )}
              </button>

              <div className="divider-dot" />

              <button
                type="button"
                className="otp-action-link logout-link"
                onClick={handleLogout}
              >
                <LogOut size={14} />
                Cancel & Logout
              </button>
            </div>
          </div>
        </motion.div>

        <style>{`
          .otp-modal-overlay {
            position: fixed;
            inset: 0;
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }
          
          .otp-modal-backdrop {
            position: absolute;
            inset: 0;
            background: rgba(15, 32, 22, 0.65);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
          }
          
          .otp-modal-card {
            background: rgba(255, 255, 255, 0.85);
            backdrop-filter: blur(25px);
            -webkit-backdrop-filter: blur(25px);
            border: 1px solid rgba(255, 255, 255, 0.45);
            box-shadow: 0 25px 50px -12px rgba(0, 137, 71, 0.25), 
                        0 0 80px 0 rgba(0, 137, 71, 0.1) inset;
            width: 100%;
            max-width: 440px;
            border-radius: 32px;
            padding: 40px 30px;
            z-index: 10;
            position: relative;
            text-align: center;
            overflow: hidden;
          }
          
          .otp-modal-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 6px;
            background: var(--grad-primary);
          }

          .otp-modal-header {
            margin-bottom: 32px;
          }

          .otp-shield-icon {
            background: #e8f5e9;
            width: 72px;
            height: 72px;
            border-radius: 22px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            box-shadow: 0 10px 20px -5px rgba(0, 137, 71, 0.2);
            border: 1px solid rgba(0, 137, 71, 0.1);
          }

          .otp-modal-header h2 {
            font-size: 1.65rem;
            font-weight: 800;
            color: var(--text-main);
            margin-bottom: 8px;
            letter-spacing: -0.5px;
          }

          .otp-subtitle {
            font-size: 0.95rem;
            color: var(--text-muted);
            line-height: 1.4;
          }

          .otp-email-box {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: rgba(0, 137, 71, 0.08);
            border: 1px solid rgba(0, 137, 71, 0.15);
            padding: 6px 14px;
            border-radius: 20px;
            font-weight: 700;
            color: var(--primary-dark);
            font-size: 0.875rem;
            margin-top: 12px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.02);
          }

          .otp-modal-form {
            margin-bottom: 28px;
          }

          .otp-inputs-grid {
            display: flex;
            gap: 12px;
            justify-content: space-between;
            margin-bottom: 24px;
          }

          .otp-digit-input {
            width: 50px;
            height: 60px;
            border-radius: 14px;
            border: 2px solid rgba(0,0,0,0.06);
            background: rgba(255, 255, 255, 0.8);
            text-align: center;
            font-size: 1.5rem;
            font-weight: 800;
            color: var(--text-main);
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 2px 4px rgba(0,0,0,0.02);
          }

          .otp-digit-input:focus {
            border-color: var(--primary);
            background: white;
            outline: none;
            box-shadow: 0 0 0 4px rgba(0, 137, 71, 0.15), 
                        0 4px 10px rgba(0, 137, 71, 0.05);
            transform: translateY(-2px);
          }

          .otp-digit-input.input-filled {
            border-color: rgba(0, 137, 71, 0.4);
            background: #fbfdfc;
          }

          .otp-digit-input.input-error {
            border-color: var(--error);
            background: #fff5f5;
          }

          .otp-digit-input:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          .otp-feedback-msg {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            font-size: 0.875rem;
            font-weight: 600;
            margin-top: -12px;
            margin-bottom: 20px;
            padding: 8px 16px;
            border-radius: 10px;
          }

          .error-msg {
            color: var(--error);
            background: rgba(239, 68, 68, 0.08);
          }

          .info-msg {
            color: var(--primary);
            background: rgba(16, 185, 129, 0.08);
          }

          .otp-submit-btn {
            width: 100%;
            padding: 14px 20px;
            font-size: 1rem;
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 52px;
          }

          .otp-loader-flex {
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .animate-spin {
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }

          .otp-modal-footer {
            border-top: 1px solid rgba(0,0,0,0.06);
            padding-top: 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 16px;
          }

          .otp-timer-box {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 0.875rem;
            color: var(--text-muted);
            font-weight: 600;
          }

          .timer-expired {
            color: var(--error);
            font-weight: 700;
          }

          .otp-footer-actions {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .otp-action-link {
            font-size: 0.875rem;
            font-weight: 700;
            color: var(--primary);
            display: flex;
            align-items: center;
            gap: 6px;
            transition: all 0.2s;
            cursor: pointer;
            padding: 4px 8px;
            border-radius: 6px;
          }

          .otp-action-link:hover:not(:disabled) {
            color: var(--primary-dark);
            background: rgba(0, 137, 71, 0.05);
          }

          .otp-action-link.disabled-link {
            color: var(--text-muted);
            opacity: 0.5;
            cursor: not-allowed;
          }

          .otp-action-link.disabled-link:hover {
            background: none;
            color: var(--text-muted);
          }

          .logout-link {
            color: #d32f2f;
          }

          .logout-link:hover {
            color: #b71c1c;
            background: rgba(211, 47, 47, 0.05) !important;
          }

          .action-loading {
            display: flex;
            align-items: center;
            gap: 6px;
          }

          .divider-dot {
            width: 4px;
            height: 4px;
            border-radius: 2px;
            background: rgba(0,0,0,0.15);
          }

          @media (max-width: 480px) {
            .otp-modal-card {
              padding: 30px 20px;
            }
            .otp-digit-input {
              width: 42px;
              height: 52px;
              font-size: 1.25rem;
              border-radius: 10px;
            }
            .otp-inputs-grid {
              gap: 6px;
            }
          }
        `}</style>
      </div>
    </AnimatePresence>
  );
};

export default OtpVerificationModal;
