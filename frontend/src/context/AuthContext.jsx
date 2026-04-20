import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(() => { try { return JSON.parse(localStorage.getItem('nx_user')); } catch { return null; } });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('nx_token');
    if (!token) { setLoading(false); return; }
    authAPI.me()
      .then(({ data }) => {
        localStorage.setItem('nx_user', JSON.stringify(data.user));
        setUser(data.user);
      })
      .catch(() => localStorage.clear())
      .finally(() => setLoading(false));
  }, []);

  const persist = (token, usr) => {
    localStorage.setItem('nx_token', token);
    localStorage.setItem('nx_user', JSON.stringify(usr));
    setUser(usr);
  };

  const login     = useCallback(async (e, p)    => { const { data } = await authAPI.login({ email: e, password: p }); persist(data.token, data.user); return data.user; }, []);
  const register  = useCallback(async (n, e, p) => { const { data } = await authAPI.register({ name: n, email: e, password: p }); persist(data.token, data.user); return data.user; }, []);
  const logout    = useCallback(() => { localStorage.clear(); setUser(null); }, []);
  const subscribe = useCallback(async () => { 
    const { data } = await authAPI.subscribe();
    // Use the user data returned by the backend to update everything
    persist(localStorage.getItem('nx_token'), data.user);
    return data.user;
  }, []);

  return <Ctx.Provider value={{ user, login, register, logout, subscribe, loading }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
