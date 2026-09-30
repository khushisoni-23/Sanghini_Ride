import { Router } from 'express';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  removeNotification,
} from '../controllers/notification.controller.js';
import { protect } from '../middleware/auth.js';

const router = Router();

// Protect all notification routes
router.use(protect);

router.get('/', getNotifications);
router.patch('/read-all', markAllAsRead);
router.post('/mark-all-read', markAllAsRead); // Alternative endpoint support
router.patch('/:id/read', markAsRead);
router.delete('/:id', removeNotification);

export default router;
