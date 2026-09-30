import {
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from '../services/notification.service.js';

/**
 * @desc    Get user notifications
 * @route   GET /api/notifications
 * @access  Private
 */
export const getNotifications = async (req, res) => {
  try {
    const { page, limit, unreadOnly } = req.query;
    const result = await getUserNotifications(req.user._id, {
      page,
      limit,
      unreadOnly: unreadOnly === 'true' || unreadOnly === true,
    });

    return res.status(200).json({
      success: true,
      data: result.notifications,
      unreadCount: result.unreadCount,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    console.error('Error in getNotifications:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications.',
    });
  }
};

/**
 * @desc    Mark single notification as read
 * @route   PATCH /api/notifications/:id/read
 * @access  Private
 */
export const markAsRead = async (req, res) => {
  try {
    const result = await markNotificationRead(req.params.id, req.user._id);

    if (!result.notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read.',
      data: result.notification,
      unreadCount: result.unreadCount,
    });
  } catch (error) {
    console.error('Error in markAsRead:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update notification.',
    });
  }
};

/**
 * @desc    Mark all notifications as read
 * @route   PATCH /api/notifications/read-all, POST /api/notifications/mark-all-read
 * @access  Private
 */
export const markAllAsRead = async (req, res) => {
  try {
    const result = await markAllNotificationsRead(req.user._id);
    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read.',
      unreadCount: result.unreadCount,
    });
  } catch (error) {
    console.error('Error in markAllAsRead:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update notifications.',
    });
  }
};

/**
 * @desc    Delete single notification
 * @route   DELETE /api/notifications/:id
 * @access  Private
 */
export const removeNotification = async (req, res) => {
  try {
    const result = await deleteNotification(req.params.id, req.user._id);
    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Notification deleted.',
      unreadCount: result.unreadCount,
    });
  } catch (error) {
    console.error('Error in removeNotification:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete notification.',
    });
  }
};
