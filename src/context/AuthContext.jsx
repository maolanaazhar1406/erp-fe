import { createContext, useContext, useState } from 'react';
import { api, TOKEN_KEY } from '../api/client';

const AuthContext = createContext(null);

// Decode payload JWT (tanpa verifikasi, hanya untuk menampilkan dan cek izin di UI)
function decodeToken(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const user = token ? decodeToken(token) : null;
  const permissions = new Set(user?.permissions || []);

  // Cek satu permission, misalnya can('purchases:update')
  const can = perm => permissions.has(perm);

  const login = async (username, password) => {
    const { data } = await api.post('/api/v1/auth/login', { username, password });
    localStorage.setItem(TOKEN_KEY, data.data.token);
    setToken(data.data.token);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, can }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);