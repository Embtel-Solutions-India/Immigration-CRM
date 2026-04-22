import api from './axios.js';
export const setKpiTarget = (data) => api.post('/kpi/set', data).then(r => r.data);
export const getUserKpis = (userId, params) => api.get(`/kpi/user/${userId}`, { params }).then(r => r.data);
export const getTeamKpis = (team, params) => api.get(`/kpi/team/${team}`, { params }).then(r => r.data);
export const getCeoKpiSummary = () => api.get('/kpi/ceo-summary').then(r => r.data);
