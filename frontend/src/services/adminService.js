import api from './api';
import { API_ENDPOINTS } from '../constants';

const adminService = {
  getAnalytics: async () => {
    return api.get(API_ENDPOINTS.ADMIN.ANALYTICS);
  },
  getUsers: async (params) => {
    return api.get(API_ENDPOINTS.ADMIN.USERS, { params });
  },
  toggleUserStatus: async (userId, isActive) => {
    return api.patch(API_ENDPOINTS.ADMIN.USER_STATUS(userId), { isActive });
  },
  deleteUser: async (userId) => {
    return api.delete(`/admin/users/${userId}`);
  },
  getDrivers: async (params) => {
    return api.get(API_ENDPOINTS.ADMIN.DRIVERS, { params });
  },
  verifyDriver: async (driverId, status, notes) => {
    return api.patch(API_ENDPOINTS.ADMIN.VERIFY_DRIVER(driverId), { status, notes });
  },
  toggleDriverStatus: async (driverId) => {
    return api.patch(API_ENDPOINTS.ADMIN.DRIVER_STATUS(driverId));
  },
  getRides: async (params) => {
    return api.get(API_ENDPOINTS.ADMIN.RIDES, { params });
  },
  getRideDetails: async (rideId) => {
    return api.get(API_ENDPOINTS.ADMIN.RIDE_DETAIL(rideId));
  },
  getPayments: async (params) => {
    return api.get(API_ENDPOINTS.ADMIN.PAYMENTS, { params });
  },
  getSafetyIncidents: async (params) => {
    return api.get(API_ENDPOINTS.ADMIN.SAFETY_INCIDENTS, { params });
  },
  updateIncidentStatus: async (incidentId, status, notes) => {
    return api.patch(API_ENDPOINTS.ADMIN.INCIDENT_STATUS(incidentId), { status, notes });
  },
};

export default adminService;
