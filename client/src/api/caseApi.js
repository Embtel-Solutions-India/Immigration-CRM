import api from './axios.js';

export const getCases = (params) => api.get('/cases', { params }).then(r => r.data);
export const getCase = (id) => api.get(`/cases/${id}`).then(r => r.data);
export const createCase = (data) => api.post('/cases', data).then(r => r.data);
export const updateCase = (id, data) => api.patch(`/cases/${id}`, data).then(r => r.data);
export const addStatusUpdate = (id, data) => api.post(`/cases/${id}/status-update`, data).then(r => r.data);
