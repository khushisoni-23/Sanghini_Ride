import api from './api';

const notificationService = {
  getNotifications: async (params = {}) => {
    return api.get('/notifications', { params });
  },
  markAsRead: async (id) => {
    return api.patch(`/notifications/${id}/read`);
  },
  markAllAsRead: async () => {
    return api.patch('/notifications/read-all');
  },
  deleteNotification: async (id) => {
    return api.delete(`/notifications/${id}`);
  },
};

export default notificationService;
