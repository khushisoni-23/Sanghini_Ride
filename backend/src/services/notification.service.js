import Notification from '../models/Notification.js';
import { getIO } from '../socket.js';

/**
 * Create and dispatch a real-time notification
 * @param {Object} params
 * @param {string} params.recipient - User ID of recipient
 * @param {string} [params.sender] - User ID of sender (optional)
 * @param {string} params.title - Notification title
 * @param {string} params.message - Notification body text
 * @param {string} params.type - Notification category
 * @param {string} [params.rideId] - Linked Ride ID
 * @param {Object} [params.data] - Extra metadata
 */
export async function createNotification({
  recipient,
  sender,
  title,
  message,
  type = 'system',
  rideId,
  data = {},
}) {
  try {
    if (!recipient) return null;

    // Deduplication check: Avoid duplicate unread notification of same type for same ride within 30s
    if (rideId) {
      const recentDuplicate = await Notification.findOne({
        recipient,
        type,
        ride: rideId,
        isRead: false,
        createdAt: { $gte: new Date(Date.now() - 30000) },
      });
      if (recentDuplicate) {
        return recentDuplicate;
      }
    }

    const notification = await Notification.create({
      recipient,
      sender,
      title,
      message,
      type,
      ride: rideId,
      data,
      isRead: false,
    });

    // Count total unread notifications for recipient
    const unreadCount = await Notification.countDocuments({
      recipient,
      isRead: false,
    });

    // Real-time Socket.IO emission to recipient's personal room
    const io = getIO();
    if (io) {
      io.to(`user:${recipient}`).emit('notification:new', {
        notification,
        unreadCount,
      });
    }

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
}

/**
 * Fetch notifications for a user with unread count
 */
export async function getUserNotifications(userId, { page = 1, limit = 20, unreadOnly = false } = {}) {
  try {
    const query = { recipient: userId };
    if (unreadOnly) {
      query.isRead = false;
    }

    const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .lean(),
      Notification.countDocuments(query),
      Notification.countDocuments({ recipient: userId, isRead: false }),
    ]);

    return {
      notifications,
      total,
      unreadCount,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      totalPages: Math.ceil(total / limit) || 1,
    };
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
}

/**
 * Mark single notification as read
 */
export async function markNotificationRead(notificationId, userId) {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { $set: { isRead: true, readAt: new Date() } },
      { returnDocument: 'after' }
    );

    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      isRead: false,
    });

    const io = getIO();
    if (io) {
      io.to(`user:${userId}`).emit('notification:count', { unreadCount });
    }

    return { notification, unreadCount };
  } catch (error) {
    console.error('Error marking notification read:', error);
    throw error;
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsRead(userId) {
  try {
    await Notification.updateMany(
      { recipient: userId, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );

    const io = getIO();
    if (io) {
      io.to(`user:${userId}`).emit('notification:count', { unreadCount: 0 });
    }

    return { success: true, unreadCount: 0 };
  } catch (error) {
    console.error('Error marking all notifications read:', error);
    throw error;
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId, userId) {
  try {
    const deleted = await Notification.findOneAndDelete({
      _id: notificationId,
      recipient: userId,
    });

    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      isRead: false,
    });

    const io = getIO();
    if (io) {
      io.to(`user:${userId}`).emit('notification:count', { unreadCount });
    }

    return { success: !!deleted, unreadCount };
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
}
