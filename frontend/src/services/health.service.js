import api from './api';

/**
 * Health service — checks backend connectivity.
 */
const healthService = {
  check: () => api.get('/health'),
};

export default healthService;
