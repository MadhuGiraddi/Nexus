import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const Ctx = createContext(null);

export function SocketProvider({ children }) {
  const ref            = useRef(null);
  const [tick, setTick]    = useState(null);
  const [online, setOnline] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem('nx_token');
    if (!token) return;

    const s = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000');
    ref.current = s;

    s.on('connect',    () => { setOnline(true); s.emit('auth', token); });
    s.on('disconnect', () => setOnline(false));
    s.on('price_tick', (d) => setTick(d));

    return () => {
      s.disconnect();
      ref.current = null;
      setOnline(false);
    };
  }, [user]);

  return <Ctx.Provider value={{ socket: ref.current, tick, online }}>{children}</Ctx.Provider>;
}

export const useSocket = () => useContext(Ctx);
