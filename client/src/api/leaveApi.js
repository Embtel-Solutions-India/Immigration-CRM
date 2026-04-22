import api from './axios.js';
export const submitLeave = (data) => api.post('/leave/request', data).then(r => r.data);
export const reviewLeave = (id, data) => api.patch(`/leave/${id}/review`, data).then(r => r.data);
export const getPendingLeaves = () => api.get('/leave/pending').then(r => r.data);
export const getTeamCalendar = (params) => api.get('/leave/team/calendar', { params }).then(r => r.data);
export const getTeamLeaves = () => api.get('/leave/team').then(r => r.data);
export const getUserLeaves = (userId) => api.get(`/leave/user/${userId}`).then(r => r.data);
export const getAllLeaves = () => api.get('/leave/all').then(r => r.data);
