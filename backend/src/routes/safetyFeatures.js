import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import {
  getNearestHavensAction,
  getAllHavensAction,
  postSignalAction,
  getNearbySignalsAction,
  confirmSignalAction,
  triggerDiscreetAlertAction,
  requestBuddyAction,
  buddyCheckInAction,
  getGuardianDashboardAction,
  guardianPingAction,
  getTimeAwareSafetyAction,
  checkSafetyBubbleAction,
} from '../controllers/safetyFeatures.controller.js';

const router = Router();

// ─── PUBLIC ROUTES (No auth required) ────────────────────────────
// Guardian Dashboard — accessible via share token (like public shared ride)
router.get('/guardian/:shareToken', getGuardianDashboardAction);
router.post('/guardian/:shareToken/ping', guardianPingAction);

// Safe Havens — public for map display
router.get('/safe-havens', getAllHavensAction);
router.get('/safe-havens/nearby', getNearestHavensAction);

// Time-Aware Safety — public
router.get('/time-safety', getTimeAwareSafetyAction);

// ─── AUTHENTICATED ROUTES ─────────────────────────────────────────
router.use(protect);

// Community Safety Signals
router.get('/signals/nearby', getNearbySignalsAction);
router.post('/signals', postSignalAction);
router.post('/signals/:id/confirm', confirmSignalAction);

// I Feel Unsafe — Discreet Alert (per active ride)
router.post('/rides/:rideId/discreet-alert', triggerDiscreetAlertAction);

// Journey Buddy
router.post('/rides/:rideId/journey-buddy', requestBuddyAction);
router.post('/journey-buddy/:buddyId/check-in', buddyCheckInAction);

// Safety Bubble
router.post('/safety-bubble/check', checkSafetyBubbleAction);

export default router;
