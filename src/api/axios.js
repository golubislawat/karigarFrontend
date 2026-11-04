import axios from 'axios';

const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    const clean = import.meta.env.VITE_API_URL.replace(/\/+$/, '');
    return clean.endsWith('/api') ? clean : `${clean}/api`;
  }
  return '/api';
};

const api = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true,
});

// Remove the 401 redirect — let React Router route guards handle it
api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

export default api;
