import { Router } from 'express';
import {
  estimateRide,
  createRide,
  getMyRides,
  getRideById,
  cancelRide,
  acceptRide,
  declineRide,
  updateRideStatus,
  retryMatching,
} from '../controllers/ride.controller.js';
import { startRideShare, stopShare, getSharedRide } from '../controllers/rideShare.controller.js';
import { completeRide, submitRideRating } from '../controllers/completionAndRating.controller.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

// Public / Authenticated estimation
router.post('/estimate', estimateRide);

// Public Shared Ride Link (for trusted contact & family tracking)
router.get('/shared/:shareToken', getSharedRide);

// Protected routes (Require login)
router.use(protect);

// Create ride (Passengers only)
router.post('/', authorize('passenger', 'admin'), createRide);

// Get user/driver rides
router.get('/my-rides', getMyRides);

// Get single ride details
router.get('/:id', getRideById);

// Cancel ride (Passenger / Admin)
router.patch('/:id/cancel', cancelRide);

// Retry matching (Passenger / Admin)
router.post('/:id/retry', authorize('passenger', 'admin'), retryMatching);

// Driver action routes (Driver / Admin)
router.patch('/:id/accept', authorize('driver', 'admin'), acceptRide);
router.patch('/:id/decline', authorize('driver', 'admin'), declineRide);
router.patch('/:id/status', authorize('driver', 'admin'), updateRideStatus);

// Ride Completion (Driver / Admin)
router.post('/:id/complete', authorize('driver', 'admin'), completeRide);

// Ride Sharing
router.post('/:id/share', authorize('passenger', 'admin'), startRideShare);
router.post('/:id/stop-share', authorize('passenger', 'admin'), stopShare);

// Rating & Review (Passenger / Driver / Admin)
router.post('/:id/rate', submitRideRating);

export default router;

