import api from './api';
import { API_ENDPOINTS } from '../constants';

const driverService = {
  getDriverStatus: async () => {
    return api.get(API_ENDPOINTS.DRIVER.STATUS);
  },
  updateOnlineStatus: async (isOnline) => {
    return api.post(API_ENDPOINTS.DRIVER.STATUS, { isOnline });
  },
  getPendingRequests: async () => {
    return api.get(API_ENDPOINTS.DRIVER.REQUESTS);
  },
  getVerificationStatus: async () => {
    return api.get(API_ENDPOINTS.DRIVER.VERIFICATION);
  },
  uploadVerificationDocument: async (formData) => {
    return api.post(API_ENDPOINTS.DRIVER.VERIFICATION, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getVehicleDetails: async () => {
    return api.get(API_ENDPOINTS.DRIVER.VEHICLE);
  },
  getEarningsSummary: async (period) => {
    return api.get(API_ENDPOINTS.DRIVER.EARNINGS, { params: { period } });
  },
  updateLocation: async ({ coordinates, heading, speed, rideId }) => {
    return api.patch('/driver/location', { coordinates, heading, speed, rideId });
  },
};

export default driverService;
