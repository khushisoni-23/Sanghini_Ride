import { Router } from 'express';
import {
  triggerSosAction,
  getIncidentsAction,
  getIncidentByIdAction,
  updateIncidentStatusAction,
} from '../controllers/safety.controller.js';
import {
  getContacts,
  addContact,
  updateContact,
  deleteContact,
} from '../controllers/trustedContact.controller.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

// All safety routes require authentication
router.use(protect);

// ─── SOS Emergency System ───────────────────────────────────────────
router.post('/sos', triggerSosAction);

// ─── Safety Desk / Admin Incidents ──────────────────────────────────
router.get('/incidents', getIncidentsAction);
router.get('/incidents/:id', getIncidentByIdAction);
router.patch('/incidents/:id/status', authorize('admin'), updateIncidentStatusAction);

// ─── Trusted Contacts ───────────────────────────────────────────────
router.get('/trusted-contacts', getContacts);
router.post('/trusted-contacts', addContact);
router.put('/trusted-contacts/:id', updateContact);
router.delete('/trusted-contacts/:id', deleteContact);

export default router;
