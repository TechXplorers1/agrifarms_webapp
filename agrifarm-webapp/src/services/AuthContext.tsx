import React, { createContext, useContext, useState, useEffect } from 'react';

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
  login: (phoneNumber: string) => Promise<void>;
  verifyOtp: (otp: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('agrifarm_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (phoneNumber: string) => {
    setIsLoading(true);
    // Simulate API call to send OTP
    console.log('Sending OTP to', phoneNumber);
    localStorage.setItem('pending_phone', phoneNumber);
    setIsLoading(false);
  };

  const verifyOtp = async (otp: string) => {
    setIsLoading(true);
    // Simulate OTP verification
    if (otp === '123456') { // Test OTP
      const phoneNumber = localStorage.getItem('pending_phone') || '';
      const newUser = {
        id: 'user_' + Math.random().toString(36).substr(2, 9),
        name: 'Farmer John',
        phoneNumber,
        role: 'FARMER',
        village: 'Green Valley',
        district: 'Agri District'
      };
      setUser(newUser);
      localStorage.setItem('agrifarm_user', JSON.stringify(newUser));
      localStorage.removeItem('pending_phone');
    } else {
      throw new Error('Invalid OTP');
    }
    setIsLoading(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('agrifarm_user');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, verifyOtp, logout, isLoading }}>
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
