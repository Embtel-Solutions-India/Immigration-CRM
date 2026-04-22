import api from './axios.js';
export const getNotifications = (userId) => api.get(`/notifications/${userId}`).then(r => r.data);
export const markRead = (id) => api.patch(`/notifications/${id}/read`).then(r => r.data);
export const markUnread = (id) => api.patch(`/notifications/${id}/unread`).then(r => r.data);
export const markAllRead = () => api.patch('/notifications/mark-all-read').then(r => r.data);
