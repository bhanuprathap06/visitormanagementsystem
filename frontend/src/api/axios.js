import axios from 'axios';

const api = axios.create({
  // In production (Vercel), VITE_API_URL must be set to your Railway backend URL
  // e.g. https://vms-backend-production.up.railway.app
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api',
  timeout: 15000,
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 500) {
      console.error('Server error:', err.response?.data);
    }
    return Promise.reject(err);
  }
);

export default api;
