import api from './axios.js';

// Clients
export const getDocClients = (params) => api.get('/doc-clients', { params }).then(r => r.data);
export const getDocClient = (id) => api.get(`/doc-clients/${id}`).then(r => r.data);
export const createDocClient = (data) => api.post('/doc-clients', data).then(r => r.data);
export const updateDocClient = (id, data) => api.patch(`/doc-clients/${id}`, data).then(r => r.data);
export const deleteDocClient = (id) => api.delete(`/doc-clients/${id}`).then(r => r.data);

// Cases
export const getDocCases = (params) => api.get('/doc-cases', { params }).then(r => r.data);
export const getDocCase = (id) => api.get(`/doc-cases/${id}`).then(r => r.data);
export const createDocCase = (data) => api.post('/doc-cases', data).then(r => r.data);
export const updateDocCase = (id, data) => api.patch(`/doc-cases/${id}`, data).then(r => r.data);
export const deleteDocCase = (id) => api.delete(`/doc-cases/${id}`).then(r => r.data);

// Documents
export const getDocDocuments = (params) => api.get('/doc-documents', { params }).then(r => r.data);
export const getDocDocument = (id) => api.get(`/doc-documents/${id}`).then(r => r.data);
export const createDocDocument = (data) => api.post('/doc-documents', data).then(r => r.data);
export const updateDocDocument = (id, data) => api.patch(`/doc-documents/${id}`, data).then(r => r.data);
export const deleteDocDocument = (id) => api.delete(`/doc-documents/${id}`).then(r => r.data);
export const getDocStats = (params) => api.get('/doc-documents/stats', { params }).then(r => r.data);

// Work Units
export const getDocWorkUnits = (params) => api.get('/doc-work-units', { params }).then(r => r.data);
export const getDocWorkUnit = (id) => api.get(`/doc-work-units/${id}`).then(r => r.data);
export const createDocWorkUnit = (data) => api.post('/doc-work-units', data).then(r => r.data);
export const updateDocWorkUnit = (id, data) => api.patch(`/doc-work-units/${id}`, data).then(r => r.data);
export const deleteDocWorkUnit = (id) => api.delete(`/doc-work-units/${id}`).then(r => r.data);

// Checklist
export const getDocChecklist = (clientId, params) => api.get(`/doc-checklist/client/${clientId}`, { params }).then(r => r.data);
export const updateChecklistStage = (id, stage) => api.patch(`/doc-checklist/${id}/stage`, { stage }).then(r => r.data);
export const toggleChecklistItem = (id, itemId) => api.patch(`/doc-checklist/${id}/items/${itemId}/toggle`).then(r => r.data);
export const addCustomChecklistItem = (id, data) => api.post(`/doc-checklist/${id}/items`, data).then(r => r.data);
export const removeChecklistItem = (id, itemId) => api.delete(`/doc-checklist/${id}/items/${itemId}`).then(r => r.data);

// Dashboard
export const getDocDashboardStats = () => api.get('/doc-dashboard/stats').then(r => r.data);
export const getDocMonthlyTrend = () => api.get('/doc-dashboard/monthly-trend').then(r => r.data);
export const getDocClientProgress = () => api.get('/doc-dashboard/client-progress').then(r => r.data);

// Leaderboard
export const getDocLeaderboard = (params) => api.get('/doc-leaderboard', { params }).then(r => r.data);
