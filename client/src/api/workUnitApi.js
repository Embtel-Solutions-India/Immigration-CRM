import api from './axios.js';

export const getWorkUnits = (params) => api.get('/work-units', { params }).then(r => r.data);
export const getWorkUnit = (id) => api.get(`/work-units/${id}`).then(r => r.data);
export const createWorkUnit = (data) => api.post('/work-units', data).then(r => r.data);
export const updateWorkUnit = (id, data) => api.patch(`/work-units/${id}`, data).then(r => r.data);
export const deleteWorkUnit = (id) => api.delete(`/work-units/${id}`).then(r => r.data);
export const addComment = (id, text) => api.post(`/work-units/${id}/comments`, { text }).then(r => r.data);
export const timerStart = (id) => api.post(`/work-units/${id}/timer/start`).then(r => r.data);
export const timerStop = (id) => api.post(`/work-units/${id}/timer/stop`).then(r => r.data);
