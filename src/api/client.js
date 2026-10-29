import axios from 'axios';
import { loadingState } from './loading';

export const TOKEN_KEY = 'erp_token';
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = t => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY));

// Client utama: mengirim cookie refresh, dan access token di header
export const api = axios.create({ baseURL: BASE_URL, withCredentials: true });

// Client polos untuk refresh, tanpa interceptor agar tidak terjadi loop
const raw = axios.create({ baseURL: BASE_URL, withCredentials: true });

// Beberapa request yang gagal bersamaan hanya memicu satu kali refresh
let refreshing = null;
export function refreshAccessToken() {
  if (!refreshing) {
    refreshing = raw.post('/api/v1/auth/refresh')
      .then(({ data }) => {
        const t = data.data.token;
        setToken(t);
        return t;
      })
      .catch(err => {
        setToken(null);
        window.dispatchEvent(new Event('auth:expired'));
        throw err;
      })
      .finally(() => { refreshing = null; });
  }
  return refreshing;
}

api.interceptors.request.use(config => {
  loadingState.start();
  const t = getToken();
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

api.interceptors.response.use(
  res => {
    loadingState.end();
    return res;
  },
  async err => {
    loadingState.end();
    const cfg = err.config;
    const isAuthCall = cfg?.url?.includes('/api/v1/auth/');

    // Access token habis: refresh lalu ulangi request sekali
    if (err.response?.status === 401 && cfg && !cfg._retry && !isAuthCall) {
      cfg._retry = true;
      try {
        const t = await refreshAccessToken();
        cfg.headers.Authorization = `Bearer ${t}`;
        return api(cfg);
      } catch {
        return Promise.reject(err);
      }
    }
    return Promise.reject(err);
  }
);

export const errMsg = e => {
  if (e.response?.status === 403) return 'Anda tidak punya izin untuk aksi ini.';
  return e.response?.data?.message || e.response?.data?.error || e.message;
};

// Pola pesan dari backend untuk penolakan aturan bisnis, dengan terjemahannya
const BUSINESS_MESSAGES = [
  [/existing transactions/i, 'Data ini sudah dipakai dalam transaksi, sehingga tidak bisa dihapus.'],
];

const BUSINESS_STATUS = [409, 422];

const rawMessage = e =>
  e.response?.data?.message || e.response?.data?.error || e.message || '';

// Penolakan aturan bisnis: status 409/422, atau pesan yang cocok dengan pola di atas
export const isBusinessRule = e =>
  BUSINESS_STATUS.includes(e.response?.status) ||
  BUSINESS_MESSAGES.some(([re]) => re.test(rawMessage(e)));

export function friendlyMessage(e) {
  const raw = rawMessage(e);
  const hit = BUSINESS_MESSAGES.find(([re]) => re.test(raw));
  return hit ? hit[1] : errMsg(e);
}

// Penolakan aturan bisnis ditampilkan sebagai peringatan, error sistem sebagai error
export function notifyError(toast, e, title = 'Gagal') {
  if (isBusinessRule(e)) {
    toast.warning(friendlyMessage(e), { title: 'Tidak bisa diproses' });
    return;
  }
  toast.error(errMsg(e), { title });
}