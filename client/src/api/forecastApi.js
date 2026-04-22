import api from './axios.js';
export const getForecast = (params) => api.get('/forecast/revenue', { params }).then(r => r.data);
export const getConfidence = () => api.get('/forecast/confidence').then(r => r.data);
export const getForecastHistory = () => api.get('/forecast/history').then(r => r.data);
