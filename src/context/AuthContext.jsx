import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('adminToken'));
  const [isAdmin, setIsAdmin] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  const refresh = useCallback(async () => {
    const t = localStorage.getItem('adminToken');
    setToken(t);
    try {
      if (!t) {
        setIsAdmin(false);
        return;
      }
      const res = await fetch('/api/admin/me', {
        headers: { Authorization: `Bearer ${t}` },
      });
      const data = await res.json();
      setIsAdmin(!!data.admin);
    } catch {
      setIsAdmin(false);
    } finally {
      setAuthReady(true);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback((newToken) => {
    localStorage.setItem('adminToken', newToken);
    setToken(newToken);
    setIsAdmin(true);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('adminToken');
    setToken(null);
    setIsAdmin(false);
  }, []);

  return (
    <AuthContext.Provider value={{ token, isAdmin, authReady, login, logout, refreshAuth: refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
