import api from './api';

const safetyFeaturesService = {
  // ─── SAFE HAVEN NETWORK ────────────────────────────────────────
  getAllSafeHavens: () => api.get('/features/safe-havens'),

  getNearestSafeHavens: ({ lat, lng, radiusKm = 3, types } = {}) => {
    const params = new URLSearchParams({ lat, lng, radius: radiusKm });
    if (types && types.length > 0) params.append('types', types.join(','));
    return api.get(`/features/safe-havens/nearby?${params}`);
  },

  // ─── COMMUNITY SIGNALS ─────────────────────────────────────────
  getNearbySignals: ({ lat, lng, radiusKm = 5 } = {}) =>
    api.get(`/features/signals/nearby?lat=${lat}&lng=${lng}&radius=${radiusKm}`),

  postCommunitySignal: ({ signalType, severity, description, location, rideId }) =>
    api.post('/features/signals', { signalType, severity, description, location, rideId }),

  confirmSignal: (signalId) => api.post(`/features/signals/${signalId}/confirm`),

  // ─── I FEEL UNSAFE — DISCREET ALERT ───────────────────────────
  triggerDiscreetAlert: (rideId, { location, message } = {}) =>
    api.post(`/features/rides/${rideId}/discreet-alert`, { location, message }),

  // ─── JOURNEY BUDDY ─────────────────────────────────────────────
  requestJourneyBuddy: (rideId) => api.post(`/features/rides/${rideId}/journey-buddy`),

  buddyCheckIn: (buddyId) => api.post(`/features/journey-buddy/${buddyId}/check-in`),

  // ─── GUARDIAN DASHBOARD ────────────────────────────────────────
  getGuardianDashboard: (shareToken) => api.get(`/features/guardian/${shareToken}`),

  guardianPing: (shareToken, { guardianName, message }) =>
    api.post(`/features/guardian/${shareToken}/ping`, { guardianName, message }),

  // ─── TIME-AWARE SAFETY ─────────────────────────────────────────
  getTimeAwareSafety: () => api.get('/features/time-safety'),

  // ─── SAFETY BUBBLE CHECK ───────────────────────────────────────
  checkSafetyBubble: ({ driverCoords, routeCoords, thresholdKm = 0.5 }) =>
    api.post('/features/safety-bubble/check', { driverCoords, routeCoords, thresholdKm }),
};

export default safetyFeaturesService;
