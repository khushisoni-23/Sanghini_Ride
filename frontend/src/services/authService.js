import api from './api';
import { API_ENDPOINTS } from '../constants';

const authService = {
  login: async (credentials) => {
    return api.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
  },
  register: async (userData) => {
    return api.post(API_ENDPOINTS.AUTH.REGISTER, userData);
  },
  sendOtp: async ({ email, phone, name }) => {
    return api.post('/auth/send-otp', { email, phone, name });
  },
  verifyOtpRegister: async (registrationData) => {
    return api.post('/auth/verify-otp-register', registrationData);
  },
  getCurrentUser: async () => {
    return api.get(API_ENDPOINTS.AUTH.ME);
  },
  logout: async () => {
    return api.post('/auth/logout');
  },
};

export default authService;
