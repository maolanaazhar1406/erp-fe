import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, getToken, setToken, refreshAccessToken } from '../api/client';
import { useToast } from './FeedbackContext';

const AuthContext = createContext(null);

function decodeToken(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

// Anggap habis jika kurang dari 30 detik lagi
const expiresSoon = token => {
  const p = decodeToken(token);
  return !p?.exp || p.exp * 1000 - 30000 < Date.now();
};

export function AuthProvider({ children }) {
  const toast = useToast();
  const [token, setTok] = useState(() => getToken());
  const [ready, setReady] = useState(false);
  const user = token ? decodeToken(token) : null;
  const permissions = new Set(user?.permissions || []);
  const can = perm => permissions.has(perm);

  // Saat aplikasi dibuka: jika access token sudah habis, minta yang baru
  useEffect(() => {
    let cancelled = false;
    const t = getToken();
    if (!t || !expiresSoon(t)) {
      setReady(true);
      return;
    }
    refreshAccessToken()
      .then(n => { if (!cancelled) setTok(n); })
      .catch(() => { if (!cancelled) setTok(null); })
      .finally(() => { if (!cancelled) setReady(true); });
    return () => { cancelled = true; };
  }, []);

  // Refresh gagal di tengah pemakaian: kembali ke login dengan pemberitahuan
  useEffect(() => {
    const onExpired = () => {
      setTok(null);
      toast.warning('Sesi Anda telah berakhir. Silakan login kembali.', { title: 'Sesi berakhir' });
    };
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, [toast]);

  const login = async (username, password) => {
    const { data } = await api.post('/api/v1/auth/login', { username, password });
    setToken(data.data.token);
    setTok(data.data.token);
  };

  // Hapus sesi lokal dulu agar UI langsung berpindah, lalu beri tahu server
  const logout = useCallback(() => {
    setToken(null);
    setTok(null);
    api.post('/api/v1/auth/logout').catch(() => { });
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, ready, login, logout, can }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);