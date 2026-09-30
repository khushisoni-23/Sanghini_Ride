import { Router } from 'express';
import {
  getAnalytics,
  getUsers,
  toggleUserStatus,
  deleteUserByAdmin,
  getDrivers,
  verifyDriver,
  toggleDriverStatus,
  getRides,
  getRideDetails,
  getPayments,
  getSafetyIncidents,
  updateIncidentStatus
} from '../controllers/admin.controller.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

// Strict RBAC: All admin routes require authenticated Admin role
router.use(protect);
router.use(authorize('admin'));

// ─── Analytics ───────────────────────────────────────────────────────
router.get('/analytics', getAnalytics);

// ─── User Management ─────────────────────────────────────────────────
router.get('/users', getUsers);
router.patch('/users/:id/status', toggleUserStatus);
router.delete('/users/:id', deleteUserByAdmin);

// ─── Driver Management ───────────────────────────────────────────────
router.get('/drivers', getDrivers);
router.patch('/drivers/:id/verify', verifyDriver);
router.patch('/drivers/:id/status', toggleDriverStatus);

// ─── Ride Management ─────────────────────────────────────────────────
router.get('/rides', getRides);
router.get('/rides/:id', getRideDetails);

// ─── Payment Auditing ────────────────────────────────────────────────
router.get('/payments', getPayments);

// ─── Safety & SOS Desk ───────────────────────────────────────────────
router.get('/safety/incidents', getSafetyIncidents);
router.patch('/safety/incidents/:id/status', updateIncidentStatus);

export default router;
