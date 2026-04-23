import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      originalRequest.url !== '/auth/refresh'
    ) {
      originalRequest._retry = true;
      try {
        const { data } = await api.post('/auth/refresh');
        const token = data?.accessToken;
        if (token) {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers['Authorization'] = `Bearer ${token}`;
        }
        return api(originalRequest);
      } catch {
        delete api.defaults.headers.common['Authorization'];
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
