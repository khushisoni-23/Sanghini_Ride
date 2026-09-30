import api from './api';

const safetyService = {
  // SOS System
  triggerSOS: async (rideId, location) => {
    return api.post('/safety/sos', { rideId, location });
  },
  getIncidents: async (status) => {
    return api.get('/safety/incidents' + (status ? `?status=${status}` : ''));
  },
  getIncidentById: async (id) => {
    return api.get(`/safety/incidents/${id}`);
  },
  updateIncidentStatus: async (id, status, notes) => {
    return api.patch(`/safety/incidents/${id}/status`, { status, notes });
  },

  // Trusted Contacts
  getTrustedContacts: async () => {
    return api.get('/safety/trusted-contacts');
  },
  addTrustedContact: async (contactData) => {
    return api.post('/safety/trusted-contacts', contactData);
  },
  updateTrustedContact: async (id, data) => {
    return api.put(`/safety/trusted-contacts/${id}`, data);
  },
  deleteTrustedContact: async (id) => {
    return api.delete(`/safety/trusted-contacts/${id}`);
  },

  // Live Ride Sharing
  shareRide: async (rideId) => {
    return api.post(`/rides/${rideId}/share`);
  },
  stopShareRide: async (rideId) => {
    return api.post(`/rides/${rideId}/stop-share`);
  },
  getSharedRidePublic: async (shareToken) => {
    return api.get(`/rides/shared/${shareToken}`);
  },
};

export default safetyService;
