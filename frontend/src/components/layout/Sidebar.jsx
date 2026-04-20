import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Activity, LayoutDashboard, Bot, TrendingUp,
  Percent, CreditCard, Calendar, Users, LogOut, ChevronRight, BookOpen, Lock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const MotionNavLink = motion(NavLink);

const NAV = [
  { section: 'Core',           items: [{ to: '/', icon: LayoutDashboard, label: 'Nexus', badge: null }] },
  { section: 'Strong Modules', items: [
      { to: '/finagent', icon: Bot, label: 'FinAgent', badge: null }, 
      { to: '/investpro', icon: TrendingUp, label: 'InvestPro', badge: null }
  ] },
  { section: 'Simple Modules', items: [
      { to: '/loans',      icon: Percent,     label: 'Loans',       badge: null },
      { to: '/cards',      icon: CreditCard,  label: 'Card Offers', badge: null },
      { to: '/analyzer',   icon: Activity,    label: 'Sub Analyzer', badge: null },
      { to: '/subscribe',  icon: Calendar,    label: 'Subscriptions', badge: null },
      { to: '/ca',         icon: Users,       label: 'CA Contacts', badge: 'PRO', requiresPro: true },
    ]
  },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  return (
    <motion.nav
      className="sidebar glass-card"
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          <Activity size={20} />
        </div>
        <span className="sidebar-name">Nexus</span>
      </div>

      {/* Nav sections */}
      <div className="sidebar-nav">
        {NAV.map((sec, secIdx) => (
          <div key={sec.section} className="nav-section">
            <motion.p 
              className="nav-section-label"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + (secIdx * 0.1) }}
            >
              {sec.section}
            </motion.p>
             {sec.items.map(({ to, icon: Icon, label, badge, requiresPro }, itemIdx) => {
               const isLocked = requiresPro && !user?.isSubscribed;
               return (
                 <MotionNavLink
                   key={to}
                   to={to}
                   end={to === '/'}
                   className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                   initial={{ opacity: 0, x: -20 }}
                   animate={{ opacity: 1, x: 0 }}
                   transition={{ duration: 0.4, delay: 0.3 + (secIdx * 0.1) + (itemIdx * 0.05), ease: "easeOut" }}
                   whileHover={{ x: 6, scale: 1.02, backgroundColor: "rgba(255,255,255,0.05)" }}
                   whileTap={{ scale: 0.95 }}
                 >
                   {isLocked ? <Lock size={17} className="nav-icon" style={{ color: 'var(--gold)' }} /> : <Icon size={17} className="nav-icon" />}
                   <span className="nav-label">{label}</span>
                   {badge && (
                     <span className="nav-badge" style={badge === 'PRO' ? { background: 'rgba(255,193,7,0.15)', color: '#FFC107', border: '1px solid rgba(255,193,7,0.3)', display: 'flex', alignItems: 'center', gap: '4px' } : {}}>
                       {badge}
                     </span>
                   )}
                   {to === '/' && <ChevronRight size={14} className="nav-arrow" />}
                 </MotionNavLink>
               );
             })}
          </div>
        ))}
      </div>

      {/* User footer */}
      <div className="sidebar-user">
        <div className="user-avatar">
          {user?.name?.[0]?.toUpperCase() || 'U'}
        </div>
        <div className="user-info">
          <p className="user-name">{user?.name || 'User'}</p>
          <p className="user-email">{user?.email || ''}</p>
        </div>
        <button className="btn-icon" onClick={() => { logout(); nav('/auth'); }} title="Logout">
          <LogOut size={16} />
        </button>
      </div>
    </motion.nav>
  );
}
