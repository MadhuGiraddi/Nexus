import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

function Clock() {
  const [t, setT] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setT(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="topbar-clock">
      {t.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
    </span>
  );
}

function greeting(name) {
  const h = new Date().getHours();
  const g = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  return `${g}, ${name?.split(' ')[0] || 'there'} 👋`;
}

export default function TopBar({ onSync, syncing }) {
  const { user }   = useAuth();
  const { online } = useSocket();

  return (
    <motion.header
      className="topbar glass-card"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="topbar-left">
        <motion.h2 
          className="topbar-greeting"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {greeting(user?.name)}
        </motion.h2>
        <motion.p 
          className="topbar-sub"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          Here's your financial overview
        </motion.p>
      </div>

      <div className="topbar-right">
        <motion.div 
          className={`live-badge ${online ? 'live' : 'offline'}`}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          {online ? <Wifi size={12} /> : <WifiOff size={12} />}
          <span>{online ? 'Live' : 'Offline'}</span>
        </motion.div>

        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Clock />
        </motion.div>

        <motion.button 
          className={`btn-icon ${syncing ? 'spinning' : ''}`} 
          onClick={() => {
            onSync();
            window.dispatchEvent(new CustomEvent('nexus-reload-data'));
          }} 
          disabled={syncing} 
          title="Sync data"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
          whileHover={{ scale: 1.1, backgroundColor: "var(--glass-hover)" }}
          whileTap={{ scale: 0.9 }}
        >
          <RefreshCw size={16} className={syncing ? 'spin' : ''} />
        </motion.button>



        <motion.div 
          className="topbar-avatar"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.8 }}
          whileHover={{ scale: 1.1, boxShadow: "0 0 15px var(--accent-glow)" }}
        >
          {user?.name?.[0]?.toUpperCase() || 'U'}
        </motion.div>
      </div>
    </motion.header>
  );
}
