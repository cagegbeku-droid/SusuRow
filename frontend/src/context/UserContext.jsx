import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  registerUser as apiRegisterUser,
  loginUser as apiLoginUser,
  sendOtp as apiSendOtp, 
  verifyOtp as apiVerifyOtp, 
  getProfile, 
  updateProfile as apiUpdateProfile 
} from '../api/client';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('susurow_auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('susurow_auth_token') || null;
  });

  const [isSeniorMode, setIsSeniorMode] = useState(() => {
    return localStorage.getItem('susurow_senior_mode') === 'true';
  });

  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Apply senior/large-text mode to document
  useEffect(() => {
    if (isSeniorMode) {
      document.documentElement.classList.add('senior-mode');
    } else {
      document.documentElement.classList.remove('senior-mode');
    }
    localStorage.setItem('susurow_senior_mode', isSeniorMode ? 'true' : 'false');
  }, [isSeniorMode]);

  const toggleSeniorMode = () => {
    setIsSeniorMode(prev => !prev);
  };

  // Validate token on mount
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('susurow_auth_token');
      if (savedToken) {
        try {
          const profile = await getProfile();
          setUser(profile);
          localStorage.setItem('susurow_auth_user', JSON.stringify(profile));
        } catch (err) {
          console.warn('Session expired or invalid token');
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // 1. Password Registration
  const registerWithPassword = async (fullName, phoneNumber, momoProvider, password) => {
    const res = await apiRegisterUser({
      full_name: fullName,
      phone_number: phoneNumber,
      momo_provider: momoProvider,
      password: password
    });

    setToken(res.access_token);
    setUser(res.user);
    localStorage.setItem('susurow_auth_token', res.access_token);
    localStorage.setItem('susurow_auth_user', JSON.stringify(res.user));
    setIsAuthModalOpen(false);
    return res;
  };

  // 2. Password Login
  const loginWithPassword = async (phoneNumber, password) => {
    const res = await apiLoginUser({
      phone_number: phoneNumber,
      password: password
    });

    setToken(res.access_token);
    setUser(res.user);
    localStorage.setItem('susurow_auth_token', res.access_token);
    localStorage.setItem('susurow_auth_user', JSON.stringify(res.user));
    setIsAuthModalOpen(false);
    return res;
  };

  // 3. OTP Fallback
  const requestOtp = async (phoneNumber, fullName, momoProvider) => {
    return await apiSendOtp({
      phone_number: phoneNumber,
      full_name: fullName,
      momo_provider: momoProvider
    });
  };

  const verifyAndLogin = async (phoneNumber, otpCode, fullName, momoProvider, password) => {
    const res = await apiVerifyOtp({
      phone_number: phoneNumber,
      otp_code: otpCode,
      full_name: fullName,
      momo_provider: momoProvider,
      password: password
    });

    setToken(res.access_token);
    setUser(res.user);
    localStorage.setItem('susurow_auth_token', res.access_token);
    localStorage.setItem('susurow_auth_user', JSON.stringify(res.user));
    setIsAuthModalOpen(false);
    return res;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('susurow_auth_token');
    localStorage.removeItem('susurow_auth_user');
  };

  const updateUserProfile = async (profileData) => {
    const updated = await apiUpdateProfile(profileData);
    setUser(updated);
    localStorage.setItem('susurow_auth_user', JSON.stringify(updated));
    return updated;
  };

  // Unique Referral Code helper
  const referralCode = user?.phone_number
    ? `SUSU-${user.phone_number.slice(-4)}`
    : 'SUSU-GH26';

  return (
    <UserContext.Provider
      value={{
        user,
        currentUser: user,
        token,
        isAuthenticated: Boolean(user && token),
        loading,
        isAuthModalOpen,
        openAuthModal: () => setIsAuthModalOpen(true),
        closeAuthModal: () => setIsAuthModalOpen(false),
        registerWithPassword,
        loginWithPassword,
        requestOtp,
        verifyAndLogin,
        logout,
        updateUserProfile,
        isSeniorMode,
        toggleSeniorMode,
        referralCode
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
