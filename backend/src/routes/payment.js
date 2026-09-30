import { Router } from 'express';
import {
  createOrder,
  verify,
  recordFailure,
  getInvoice,
  getPaymentHistory,
  handleWebhook,
} from '../controllers/payment.controller.js';
import { protect } from '../middleware/auth.js';

const router = Router();

// Public Webhook endpoint
router.post('/webhook', handleWebhook);

// Protected endpoints
router.use(protect);

router.post('/create-order', createOrder);
router.post('/verify', verify);
router.post('/failure', recordFailure);
router.get('/invoice/:rideId', getInvoice);
router.get('/history', getPaymentHistory);

export default router;
