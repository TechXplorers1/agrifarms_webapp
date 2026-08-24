import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { motion } from 'framer-motion';
import { Mail, Lock, ChevronRight, Sprout, AlertCircle, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

const Login: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('FARMER'); // Default role

  // Visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Messages
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const { login, signup, isLoading } = useAuth();
  const navigate = useNavigate();

  // Password Validation: At least one capital letter, one number, one special character, min 6 length
  const validatePassword = (pass: string) => {
    const hasUpperCase = /[A-Z]/.test(pass);
    const hasNumber = /\d/.test(pass);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(pass);
    const isLengthValid = pass.length >= 6;

    if (!isLengthValid) return "Password must be at least 6 characters long.";
    if (!hasUpperCase) return "Password must contain at least one capital letter.";
    if (!hasNumber) return "Password must contain at least one number.";
    if (!hasSpecialChar) return "Password must contain at least one special character.";

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (isSignUp) {
      const passwordError = validatePassword(password);
      if (passwordError) {
        setErrorMsg(passwordError);
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match.');
        return;
      }
    }

    if (email && password) {
      try {
        if (isSignUp) {
          await signup(email, password, role);
          setSuccessMsg('Account created! A verification link has been sent to your email. Please verify and then log in.');
          // Reset form to switch to login mode cleanly
          setIsSignUp(false);
          setPassword('');
          setConfirmPassword('');
        } else {
          await login(email, password);
          navigate('/');
        }
      } catch (err: any) {
        if (err.code === 'auth/invalid-credential') {
          setErrorMsg('Invalid email or password.');
        } else if (err.code === 'auth/email-already-in-use') {
          setErrorMsg('Email already in use. Please log in.');
        } else {
          setErrorMsg(err.message || 'Authentication failed. Please try again.');
        }
      }
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
            <label htmlFor="email">Email Address</label>
            <div className="input-wrapper">
              <Mail size={20} className="input-icon" />
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <Lock size={20} className="input-icon" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                required
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {isSignUp && (
            <>
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="input-group"
              >
                <label htmlFor="confirmPassword">Confirm Password</label>
                <div className="input-wrapper">
                  <Lock size={20} className="input-icon" />
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setErrorMsg('');
                      setSuccessMsg('');
                    }}
                    required
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
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
                    required
                  >
                    <option value="FARMER">Farmer</option>
                    <option value="OWNER">Owner</option>
                  </select>
                </div>
              </motion.div>
            </>
          )}

          {errorMsg && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="message-box error-message">
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </motion.div>
          )}

          {successMsg && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="message-box success-message">
              <CheckCircle2 size={16} />
              <span>{successMsg}</span>
            </motion.div>
          )}

          <button
            type="submit"
            className="btn-login"
            disabled={!email || !password || (isSignUp && !confirmPassword) || isLoading}
          >
            {isLoading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Login')}
            <ChevronRight size={20} />
          </button>
        </form>

        <div className="login-footer">
          {isSignUp && (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px', lineHeight: '1.4' }}>
              By signing up, you agree to Agri Farms' <Link to="/terms" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>Terms of Service</Link> and <Link to="/privacy-policy" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>Privacy Policy</Link>.
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
        .input-wrapper input, .input-wrapper select {
          background: transparent;
          border: none;
          outline: none;
          width: 100%;
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-main);
        }
        .select-wrapper select {
          cursor: pointer;
          -webkit-appearance: none;
          -moz-appearance: none;
          appearance: none;
        }
        .toggle-password {
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          transition: color 0.2s;
        }
        .toggle-password:hover {
          color: var(--primary);
        }
        .message-box {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 12px;
          border-radius: 12px;
          margin-bottom: 16px;
          font-size: 0.875rem;
          font-weight: 500;
          line-height: 1.4;
        }
        .error-message {
          color: #ef4444;
          background: #fef2f2;
        }
        .success-message {
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
