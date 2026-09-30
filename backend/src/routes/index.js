import { Router } from 'express';
import healthRoutes from './health.js';
import authRoutes from './auth.js';
import rideRoutes from './ride.js';
import driverRoutes from './driver.js';
import notificationRoutes from './notification.js';
import paymentRoutes from './payment.js';
import safetyRoutes from './safety.js';
import adminRoutes from './admin.js';
import safetyFeaturesRoutes from './safetyFeatures.js';

const router = Router();

// Health check
router.use('/health', healthRoutes);

// Authentication
router.use('/auth', authRoutes);

// Rides (Passenger & Driver acceptance)
router.use('/rides', rideRoutes);

// Driver duty & requests (Phase 5)
router.use('/driver', driverRoutes);

// Notifications (Phase 7 & 8)
router.use('/notifications', notificationRoutes);

// Payments & Invoices (Phase 9)
router.use('/payments', paymentRoutes);

// Safety, SOS & Trusted Contacts
router.use('/safety', safetyRoutes);

// Admin Operations & Real-time Analytics (Phase 12)
router.use('/admin', adminRoutes);

// Advanced Safety Features (Phase 16+):
// Safe Havens, Community Signals, I Feel Unsafe, Journey Buddy, Guardian Dashboard, Safety Bubble
router.use('/features', safetyFeaturesRoutes);

export default router;



