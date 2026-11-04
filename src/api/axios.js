import axios from 'axios';

const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return `${import.meta.env.VITE_API_URL.replace(/\/+$/, '')}/api`;
  }
  // When running locally in dev mode, use Vite proxy /api
  if (import.meta.env.DEV) {
    return '/api';
  }
  // In production (Vercel), default to the live Render backend
  return 'https://karigarbackend.onrender.com/api';
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
