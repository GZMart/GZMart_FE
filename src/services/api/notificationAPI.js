import axiosClient from '../axiosClient';

const notificationAPI = {
  fetchNotifications: (params) => axiosClient.get('/api/notifications', { params }),
  fetchUnreadCount: () => axiosClient.get('/api/notifications/unread/count'),
  markAsRead: (id) => axiosClient.put(`/api/notifications/${id}/read`),
  markAllAsRead: () => axiosClient.put('/api/notifications/read-all'),
  sendAnnouncement: (data) => axiosClient.post('/api/notifications/shop/announce', data),
};

export default notificationAPI;
