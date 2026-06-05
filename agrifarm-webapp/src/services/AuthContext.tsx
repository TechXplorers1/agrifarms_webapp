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
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, role: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  isVerifyingOtp: boolean;
  setIsVerifyingOtp: (verifying: boolean) => void;
  pendingEmail: string;
  setPendingEmail: (email: string) => void;
  verifyEmailOtp: (otp: string) => Promise<void>;
  resendEmailOtp: () => Promise<void>;
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
        // Seamlessly map old profileImageUrl cache keys to profilePic to support already existing logins
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
  const [pendingEmail, setPendingEmail] = useState('');

  // Restore user session from localStorage and quietly verify active status with DB
  useEffect(() => {
    const storedUser = localStorage.getItem('agrifarm_user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        // Map old cache keys for in-memory session mapping also
        if (parsedUser && !parsedUser.profilePic && parsedUser.profileImageUrl) {
          parsedUser.profilePic = parsedUser.profileImageUrl;
        }
        // Direct DB double check to guarantee status integrity
        apiService.getUser(parsedUser.id || parsedUser.userId)
          .then((response) => {
            if (response && response.data) {
              const profile = response.data;
              if (profile.status === 'PENDING') {
                setPendingEmail(profile.email || '');
                setIsVerifyingOtp(true);
                setUser(null);
                localStorage.removeItem('agrifarm_user');
              } else {
                const activeUser: User = {
                  id: profile.userId || profile.id,
                  name: profile.fullName || 'User',
                  phoneNumber: profile.phoneNumber || '',
                  role: profile.role || 'FARMER',
                  profilePic: profile.profileImageUrl || '',
                  village: profile.village || '',
                  district: profile.district || ''
                };
                setUser(activeUser);
                localStorage.setItem('agrifarm_user', JSON.stringify(activeUser));
              }
            }
          })
          .catch((err) => {
            console.error("Database session status check failed on reload:", err);
            // Already initialized synchronously, keep the parsed local session with mapped photo
            setUser(parsedUser);
          });
      } catch (err) {
        localStorage.removeItem('agrifarm_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await apiService.login(email, password);
      if (response && response.data) {
        const loginData = response.data;
        
        if (loginData.status === 'PENDING') {
          setPendingEmail(email);
          setIsVerifyingOtp(true);
          setUser(null);
          localStorage.removeItem('agrifarm_user');
          return;
        }

        // Fetch full user details from DB to get the profileImageUrl and address properties
        let profile: any = {};
        try {
          const profileRes = await apiService.getUser(loginData.userId);
          if (profileRes && profileRes.data) {
            profile = profileRes.data;
          }
        } catch (dbErr) {
          console.error("Failed to fetch full user profile on login:", dbErr);
        }

        // Successfully logged in via PostgreSQL credentials verification
        const activeUser: User = {
          id: loginData.userId,
          name: profile.fullName || loginData.fullName || 'User',
          phoneNumber: profile.phoneNumber || loginData.phoneNumber || '',
          role: profile.role || loginData.role || 'FARMER',
          profilePic: profile.profileImageUrl || '',
          village: profile.village || '',
          district: profile.district || ''
        };
        setUser(activeUser);
        localStorage.setItem('agrifarm_user', JSON.stringify(activeUser));
      }
    } catch (err: any) {
      console.error('Login Error:', err);
      setUser(null);
      localStorage.removeItem('agrifarm_user');
      // Extract custom error message from server
      const errMsg = err?.response?.data?.message || 'Login failed. Please check your credentials.';
      throw new Error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string, role: string) => {
    setIsLoading(true);
    try {
      await apiService.register(email, password, role);
      setPendingEmail(email);
      setIsVerifyingOtp(true);
    } catch (err: any) {
      console.error('Signup Error:', err);
      const errMsg = err?.response?.data?.message || 'Sign up failed. Please try again.';
      throw new Error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyEmailOtp = async (otp: string) => {
    if (!pendingEmail) throw new Error("No pending email verification session active.");
    setIsLoading(true);
    try {
      await apiService.verifyOtp(pendingEmail, otp);
      
      // Fetch verified user details directly from database by email
      const response = await apiService.getUserByEmail(pendingEmail);
      if (response && response.data) {
        const profile = response.data;
        const activeUser: User = {
          id: profile.userId || profile.id,
          name: profile.fullName || 'User',
          phoneNumber: profile.phoneNumber || '',
          role: profile.role || 'FARMER',
          profilePic: profile.profileImageUrl || '',
          village: profile.village || '',
          district: profile.district || ''
        };
        setUser(activeUser);
        localStorage.setItem('agrifarm_user', JSON.stringify(activeUser));
      }
      setIsVerifyingOtp(false);
      setPendingEmail('');
    } catch (err: any) {
      console.error("OTP verification failed:", err);
      const errMsg = err?.response?.data?.message || 'Invalid or expired OTP code entered.';
      throw new Error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const resendEmailOtp = async () => {
    if (!pendingEmail) throw new Error("No pending email verification session active.");
    await apiService.sendOtp(pendingEmail);
  };

  const logout = async () => {
    setIsLoading(true);
    setUser(null);
    localStorage.removeItem('agrifarm_user');
    setIsVerifyingOtp(false);
    setPendingEmail('');
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

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      login,
      signup,
      logout,
      isLoading,
      isVerifyingOtp,
      setIsVerifyingOtp,
      pendingEmail,
      setPendingEmail,
      verifyEmailOtp,
      resendEmailOtp,
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
