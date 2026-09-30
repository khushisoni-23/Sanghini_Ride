import api from './api';

const userService = {
  getProfile: async () => {
    return api.get('/users/profile');
  },
  updateProfile: async (data) => {
    return api.patch('/users/profile', data);
  },
  getPreferences: async () => {
    return api.get('/users/preferences');
  },
  updatePreferences: async (preferences) => {
    return api.patch('/users/preferences', preferences);
  },
};

export default userService;
