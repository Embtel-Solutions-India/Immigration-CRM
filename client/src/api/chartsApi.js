import api from './axios.js';
export const getSalesOrgChart = (params) => api.get('/charts/sales/org', { params }).then(r => r.data);
export const getSalesTeamChart = (teamId, params) => api.get(`/charts/sales/team/${teamId}`, { params }).then(r => r.data);
export const getSalesUserChart = (userId, params) => api.get(`/charts/sales/user/${userId}`, { params }).then(r => r.data);
export const getMarketingOrgChart = (params) => api.get('/charts/marketing/org', { params }).then(r => r.data);
export const getMarketingTeamChart = (teamId, params) => api.get(`/charts/marketing/team/${teamId}`, { params }).then(r => r.data);
export const getMarketingUserChart = (userId, params) => api.get(`/charts/marketing/user/${userId}`, { params }).then(r => r.data);
