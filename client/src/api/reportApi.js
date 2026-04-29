import api from './axios.js';

export const getUserReport = (userId, params) => api.get(`/reports/user/${userId}`, { params }).then(r => r.data);
export const getTeamReport = (team, params) => api.get(`/reports/team/${team}`, { params }).then(r => r.data);
export const getOrgReport = (params) => api.get('/reports/org', { params }).then(r => r.data);
export const getOverallReport = (params) => api.get('/reports/overall', { params }).then(r => r.data);
export const getPipeline = (params) => api.get('/reports/pipeline', { params }).then(r => r.data);
export const getActivity = (params) => api.get('/reports/activity', { params }).then(r => r.data);
