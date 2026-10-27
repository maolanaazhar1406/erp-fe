import axios from 'axios';
import { loadingState } from './loading';

export const TOKEN_KEY = 'erp_token';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
});

api.interceptors.request.use(config => {
  loadingState.start();
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => {
    loadingState.end();
    return res;
  },
  err => {
    loadingState.end();
    if (err.response?.status === 401 && !window.location.pathname.startsWith('/login')) {
      localStorage.removeItem(TOKEN_KEY);
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const errMsg = e => {
  if (e.response?.status === 403) return 'Anda tidak punya izin untuk aksi ini.';
  return e.response?.data?.message || e.response?.data?.error || e.message;
};