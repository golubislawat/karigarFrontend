import axios from 'axios';

const apiBase = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/+$/, '')}/api`
  : '/api';

const api = axios.create({
  baseURL: apiBase,
  withCredentials: true,
});

// Remove the 401 redirect — let React Router route guards handle it
api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

export default api;
