import api from './axios.js';

export const getMe = () => api.get('/users/me').then(r => r.data);
export const updateMe = (data) => api.patch('/users/me', data).then(r => r.data);
export const getUsers = () => api.get('/users').then(r => r.data);
export const getUser = (id) => api.get(`/users/${id}`).then(r => r.data);
export const updateUser = (id, data) => api.patch(`/users/${id}`, data).then(r => r.data);
export const registerUser = (data) => api.post('/users', data).then(r => r.data);
