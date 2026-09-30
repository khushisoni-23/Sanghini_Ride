import { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  // Load user on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/me');
      setUser(res.user);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      setUser(res.user);
      toast.success('Logged in successfully');
      return res.user;
    } catch (error) {
      toast.error(error.message || 'Login failed');
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const res = await api.post('/auth/register', userData);
      setUser(res.user);
      toast.success('Registration successful');
      return res.user;
    } catch (error) {
      toast.error(error.message || 'Registration failed');
      throw error;
    }
  };

  const sendOtp = async ({ email, phone, name }) => {
    try {
      const res = await api.post('/auth/send-otp', { email, phone, name });
      toast.success(res.message || 'Verification code sent to your email!');
      return res;
    } catch (error) {
      toast.error(error.message || 'Failed to send verification code');
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
      setUser(null);
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  const updateUserProfile = async (profileData) => {
    try {
      const res = await api.put('/auth/profile', profileData);
      if (res.user) {
        setUser(res.user);
      }
      return res;
    } catch (error) {
      toast.error(error.message || 'Profile update failed');
      throw error;
    }
  };

  const deleteAccount = async () => {
    try {
      const res = await api.delete('/auth/account');
      setUser(null);
      toast.success(res.message || 'Your account has been permanently deleted.');
      return res;
    } catch (error) {
      toast.error(error.message || 'Account deletion failed');
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, sendOtp, logout, updateUserProfile, deleteAccount, checkAuthStatus }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
