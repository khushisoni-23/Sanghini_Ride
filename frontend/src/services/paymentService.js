import api from './api';

const paymentService = {
  createPaymentOrder: async (rideId, paymentMethod = 'online') => {
    return api.post('/payments/create-order', { rideId, paymentMethod });
  },
  verifyPayment: async (paymentData) => {
    return api.post('/payments/verify', paymentData);
  },
  recordFailure: async (failureData) => {
    return api.post('/payments/failure', failureData);
  },
  getInvoice: async (rideId) => {
    return api.get(`/payments/invoice/${rideId}`);
  },
  getPaymentHistory: async () => {
    return api.get('/payments/history');
  },
};

export default paymentService;
