import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiService } from './apiService';

interface User {
  id: string;
  name: string;
  phoneNumber: string;
  role: string;
  profilePic?: string;
  village?: string;
  district?: string;
  email?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  sendPhoneOtp: (phoneNumber: string, isLogin: boolean, fullName?: string, role?: string) => Promise<void>;
  verifyPhoneOtp: (otp: string) => Promise<void>;
  resendPhoneOtp: () => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  isVerifyingOtp: boolean;
  setIsVerifyingOtp: (verifying: boolean) => void;
  pendingPhone: string;
  pendingFullName: string;
  pendingRole: string;
  isLoginMode: boolean;
  // Backward compatibility fields for email callers
  pendingEmail: string;
  setPendingEmail: (email: string) => void;
  verifyEmailOtp: (otp: string) => Promise<void>;
  resendEmailOtp: () => Promise<void>;
  login: (phoneOrEmail: string, passwordOrUnused?: string) => Promise<void>;
  signup: (phoneOrEmail: string, nameOrPassword?: string, role?: string) => Promise<void>;
  updateUserLocation: (village: string, district: string) => void;
  updateUserProfile: (name: string, phoneNumber: string, profilePic?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('agrifarm_user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed && !parsed.profilePic && parsed.profileImageUrl) {
          parsed.profilePic = parsed.profileImageUrl;
        }
        return parsed;
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [pendingPhone, setPendingPhone] = useState('');
  const [pendingFullName, setPendingFullName] = useState('');
  const [pendingRole, setPendingRole] = useState('FARMER');
  const [isLoginMode, setIsLoginMode] = useState(true);

  // Session verification on initial load
  useEffect(() => {
    const storedUser = localStorage.getItem('agrifarm_user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser && !parsedUser.profilePic && parsedUser.profileImageUrl) {
          parsedUser.profilePic = parsedUser.profileImageUrl;
        }
        const userId = parsedUser.id || parsedUser.userId;
        if (userId) {
          apiService.getUser(userId)
            .then((response) => {
              if (response && response.data) {
                const profile = response.data;
                const activeUser: User = {
                  id: profile.userId || profile.id,
                  name: profile.fullName || 'User',
                  phoneNumber: profile.phoneNumber || parsedUser.phoneNumber || '',
                  role: profile.role || 'FARMER',
                  profilePic: profile.profileImageUrl || '',
                  village: profile.village || '',
                  district: profile.district || '',
                  email: profile.email || ''
                };
                setUser(activeUser);
                localStorage.setItem('agrifarm_user', JSON.stringify(activeUser));
              }
            })
            .catch((err) => {
              console.warn("Session double-check using local cache:", err);
              setUser(parsedUser);
            });
        }
      } catch (err) {
        localStorage.removeItem('agrifarm_user');
      }
    }
    setIsLoading(false);
  }, []);

  const normalizePhone = (phone: string): string => {
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.length > 10) {
      cleaned = cleaned.slice(-10);
    }
    return cleaned;
  };

  const sendPhoneOtp = async (phoneNumber: string, isLogin: boolean, fullName?: string, role?: string) => {
    setIsLoading(true);
    const cleanedPhone = normalizePhone(phoneNumber);

    if (cleanedPhone.length !== 10) {
      setIsLoading(false);
      throw new Error('Please enter a valid 10-digit mobile number.');
    }

    try {
      // 1. Check if user already exists by phone number
      let userExists = false;
      try {
        const userRes = await apiService.getUserByPhone(cleanedPhone);
        if (userRes && userRes.data) {
          userExists = true;
        }
      } catch (err: any) {
        if (err?.response?.status === 404) {
          userExists = false;
        } else {
          console.warn("Phone lookup warning:", err);
        }
      }

      if (isLogin && !userExists) {
        throw new Error('No account found for this mobile number. Please register first to get started!');
      }

      if (!isLogin && userExists) {
        throw new Error('Account already exists with this mobile number. Please login instead.');
      }

      // 2. Request OTP via MSG91 endpoint (with static fallback support)
      try {
        await apiService.sendMsg91Otp(cleanedPhone);
      } catch (msg91Err) {
        console.warn("MSG91 OTP trigger failed, proceeding to OTP verification mode:", msg91Err);
      }

      setPendingPhone(cleanedPhone);
      setPendingFullName(fullName || '');
      setPendingRole(role || 'FARMER');
      setIsLoginMode(isLogin);
      setIsVerifyingOtp(true);
    } catch (err: any) {
      console.error('Send OTP Error:', err);
      const errMsg = err.message || err?.response?.data?.message || 'Failed to send OTP code. Please try again.';
      throw new Error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyPhoneOtp = async (otp: string) => {
    if (!pendingPhone) {
      throw new Error("No active phone verification session.");
    }
    setIsLoading(true);

    try {
      let authResponseData: any = null;

      try {
        const res = await apiService.verifyMsg91Otp({
          phoneNumber: pendingPhone,
          otp: otp.trim(),
          role: pendingRole,
          fullName: pendingFullName,
          isLogin: isLoginMode
        });
        authResponseData = res.data;
      } catch (msg91Err: any) {
        // Fallback for static dev login when static OTP test key is used
        if (otp.trim() === '123456') {
          const staticRes = await apiService.staticLogin({
            phoneNumber: pendingPhone,
            role: pendingRole,
            fullName: pendingFullName,
            isLogin: isLoginMode
          });
          authResponseData = staticRes.data;
        } else {
          throw msg91Err;
        }
      }

      if (authResponseData) {
        const userId = authResponseData.userId;
        let profile: any = {};
        if (userId) {
          try {
            const profileRes = await apiService.getUser(userId);
            if (profileRes && profileRes.data) {
              profile = profileRes.data;
            }
          } catch (pErr) {
            console.warn("Profile detail lookup failed on verify:", pErr);
          }
        }

        const activeUser: User = {
          id: userId || authResponseData.id || `user_${pendingPhone}`,
          name: profile.fullName || authResponseData.fullName || pendingFullName || 'User',
          phoneNumber: authResponseData.phoneNumber || pendingPhone,
          role: profile.role || authResponseData.role || pendingRole || 'FARMER',
          profilePic: profile.profileImageUrl || '',
          village: profile.village || '',
          district: profile.district || '',
          email: profile.email || authResponseData.email || ''
        };

        setUser(activeUser);
        localStorage.setItem('agrifarm_user', JSON.stringify(activeUser));
        setIsVerifyingOtp(false);
        setPendingPhone('');
        setPendingFullName('');
      }
    } catch (err: any) {
      console.error("OTP verification error:", err);
      const errMsg = err?.response?.data?.message || err.message || 'Invalid or expired OTP code entered.';
      throw new Error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const resendPhoneOtp = async () => {
    if (!pendingPhone) throw new Error("No active phone verification session.");
    try {
      await apiService.sendMsg91Otp(pendingPhone);
    } catch (err) {
      // Fallback silently if dev mode
      console.warn("Resend OTP fallback:", err);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    setUser(null);
    localStorage.removeItem('agrifarm_user');
    setIsVerifyingOtp(false);
    setPendingPhone('');
    setPendingFullName('');
    setIsLoading(false);
  };

  const updateUserLocation = (village: string, district: string) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, village, district };
      localStorage.setItem('agrifarm_user', JSON.stringify(updated));
      return updated;
    });
  };

  const updateUserProfile = (name: string, phoneNumber: string, profilePic?: string) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { 
        ...prev, 
        name, 
        phoneNumber, 
        profilePic: profilePic !== undefined ? profilePic : prev.profilePic 
      };
      localStorage.setItem('agrifarm_user', JSON.stringify(updated));
      return updated;
    });
  };

  // Helper mappings for backward compatibility
  const login = async (phoneOrEmail: string) => {
    return sendPhoneOtp(phoneOrEmail, true);
  };

  const signup = async (phoneOrEmail: string, nameOrPassword?: string, role?: string) => {
    return sendPhoneOtp(phoneOrEmail, false, nameOrPassword, role);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      sendPhoneOtp,
      verifyPhoneOtp,
      resendPhoneOtp,
      logout,
      isLoading,
      isVerifyingOtp,
      setIsVerifyingOtp,
      pendingPhone,
      pendingFullName,
      pendingRole,
      isLoginMode,
      pendingEmail: pendingPhone,
      setPendingEmail: setPendingPhone,
      verifyEmailOtp: verifyPhoneOtp,
      resendEmailOtp: resendPhoneOtp,
      login,
      signup,
      updateUserLocation,
      updateUserProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
