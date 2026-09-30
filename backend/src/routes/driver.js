import { Router } from 'express';
import {
  getDriverStatus,
  updateDriverStatus,
  updateDriverLocation,
  getPendingRequests,
  getDriverEarnings,
  submitVerification,
} from '../controllers/driver.controller.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

// Protect all driver routes - driver or admin role required
router.use(protect);
router.use(authorize('driver', 'admin'));

// Duty Status
router.get('/status', getDriverStatus);
router.post('/status', updateDriverStatus);
router.patch('/status', updateDriverStatus);

// Live GPS Location
router.post('/location', updateDriverLocation);
router.patch('/location', updateDriverLocation);

// Pending Ride Requests
router.get('/requests', getPendingRequests);

// Earnings
router.get('/earnings', getDriverEarnings);

// Verification Submission
router.post('/verification', submitVerification);
router.put('/verification', submitVerification);

export default router;

