import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api',
  timeout: 15000,
});

// Attach visitor JWT token if present
api.interceptors.request.use(config => {
  const token = getVisitorToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 500) console.error('Server error:', err.response?.data);
    return Promise.reject(err);
  }
);

/** Extract data from backend { success, data } envelope */
export function extractData(res) {
  const d = res?.data;
  if (d && typeof d === 'object' && 'data' in d) return d.data;
  return d;
}

export function getVisitorToken() {
  return localStorage.getItem('vms_visitor_token');
}

export function setVisitorToken(token) {
  if (token) localStorage.setItem('vms_visitor_token', token);
  else localStorage.removeItem('vms_visitor_token');
}

export function clearVisitorToken() {
  localStorage.removeItem('vms_visitor_token');
}

export default api;
