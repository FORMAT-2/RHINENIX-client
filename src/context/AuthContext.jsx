import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('rhinenix_user'));
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tokens = JSON.parse(localStorage.getItem('rhinenix_tokens') || 'null');
    if (tokens?.accessToken && !user) {
      api.get('/users/me')
        .then(({ data }) => {
          setUser(data.data);
          localStorage.setItem('rhinenix_user', JSON.stringify(data.data));
        })
        .catch(() => {
          localStorage.removeItem('rhinenix_tokens');
          localStorage.removeItem('rhinenix_user');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback((userData, tokens) => {
    setUser(userData);
    localStorage.setItem('rhinenix_user', JSON.stringify(userData));
    localStorage.setItem('rhinenix_tokens', JSON.stringify(tokens));
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {}
    setUser(null);
    localStorage.removeItem('rhinenix_user');
    localStorage.removeItem('rhinenix_tokens');
  }, []);

  const updateUser = useCallback((updates) => {
    setUser((prev) => {
      const updated = { ...prev, ...updates };
      localStorage.setItem('rhinenix_user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const isAdmin = user?.role === 'super_admin';
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser, isAdmin, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}
