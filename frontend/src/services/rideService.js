import api from './api';

export const rideService = {
  // Estimate distance, duration & fare
  estimateRide: async ({ pickupLocation, dropoffLocation, vehicleType }) => {
    return await api.post('/rides/estimate', {
      pickupLocation,
      dropoffLocation,
      vehicleType,
    });
  },

  // Create a new ride request
  createRide: async ({ pickupLocation, dropoffLocation, vehicleType }) => {
    return await api.post('/rides', {
      pickupLocation,
      dropoffLocation,
      vehicleType,
    });
  },

  // Get user's or driver's rides history
  getMyRides: async (status = 'all') => {
    return await api.get(`/rides/my-rides${status ? `?status=${status}` : ''}`);
  },

  // Get single ride details by ID
  getRideById: async (id) => {
    return await api.get(`/rides/${id}`);
  },

  // Cancel ride
  cancelRide: async (id, reason) => {
    return await api.patch(`/rides/${id}/cancel`, { reason });
  },

  // Accept ride request (Driver)
  acceptRide: async (id) => {
    return await api.patch(`/rides/${id}/accept`);
  },

  // Decline ride request (Driver)
  declineRide: async (id) => {
    return await api.patch(`/rides/${id}/decline`);
  },

  // Update ride status (Driver: arrived, in_progress, completed)
  updateRideStatus: async (id, status) => {
    return await api.patch(`/rides/${id}/status`, { status });
  },

  // Authoritative ride completion (Driver)
  completeRide: async (id, { distanceKm, durationMins } = {}) => {
    return await api.post(`/rides/${id}/complete`, { distanceKm, durationMins });
  },

  // Submit 1-5 star rating & optional review
  submitRating: async (id, { rating, review }) => {
    return await api.post(`/rides/${id}/rate`, { rating, review });
  },

  // Retry matching drivers for active ride
  retryMatching: async (id) => {
    return await api.post(`/rides/${id}/retry`);
  },
};

export default rideService;
