import axios from 'axios';

const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    const clean = import.meta.env.VITE_API_URL.replace(/\/+$/, '');
    return clean.endsWith('/api') ? clean : `${clean}/api`;
  }
  // In production default directly to Render backend if env variable is unset
  if (import.meta.env.PROD) {
    return 'https://karigarbackend.onrender.com/api';
  }
  return '/api';
};

const api = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true,
});

// Attach JWT token from localStorage to every outgoing request if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('karigar_token');
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // If unauthorized on auth endpoints, clear stored token
      const url = error.config?.url || '';
      if (url.includes('/auth/me')) {
        localStorage.removeItem('karigar_token');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
