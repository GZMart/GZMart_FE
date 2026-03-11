import axiosClient from '../axiosClient';

const notificationAPI = {
  fetchNotifications: (params) => axiosClient.get('/notifications', { params }),
  fetchUnreadCount: () => axiosClient.get('/notifications/unread/count'),
  markAsRead: (id) => axiosClient.put(`/notifications/${id}/read`),
  markAllAsRead: () => axiosClient.put('/notifications/read-all'),
};

export default notificationAPI;
