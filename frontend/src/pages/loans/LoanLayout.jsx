import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { loansAPI } from '../../services/api';
import { GlassCard, Badge } from './components/UIElements';
import './LoanTheme.css';

export default function LoanLayout() {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [healthScore, setHealthScore] = useState(null);

  useEffect(() => {
    loansAPI.eligibility()
      .then(({ data }) => setHealthScore(data.score))
      .catch(() => console.error('Could not fetch global health score'));
    
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const pageVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.25 } }
  };

  const navLinks = [
    { name: 'Home', path: '/loans' },
    { name: 'Apply', path: '/loans/apply' },
    { name: 'Tracker', path: '/loans/tracker' },
    { name: 'Score', path: '/loans/score' },
    { name: 'Advisor', path: '/loans/advisor' },
    { name: 'Calc', path: '/loans/calc' },
  ];

  return (
    <div className="loan-module-root">
      {/* Global Background Layers */}
      <div className="loan-mesh-bg" />
      <div className="loan-grid-bg" />
      <div className="loan-noise-overlay" />
      

      {/* Desktop Top Nav */}
      <nav className={`loan-top-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-brand">
          <div className="nav-brand-logo">
            <span className="material-symbols-rounded">account_balance</span>
          </div>
          Nexus Loans
        </div>

        <div className="nav-tabs">
          {navLinks.map(link => {
            const isActive = location.pathname === link.path || (link.path !== '/loans' && location.pathname.startsWith(link.path));
            return (
              <Link key={link.name} to={link.path} className={`nav-tab ${isActive ? 'active' : ''}`}>
                {link.name}
                {isActive && (
                  <motion.div layoutId="navTabBg" className="nav-tab-bg" transition={{ type: 'spring', stiffness: 300, damping: 30 }} />
                )}
              </Link>
            );
          })}
        </div>

        <div className="nav-right">
          <Link to="/loans/score" className="badge badge-gold" style={{ cursor: 'pointer', textDecoration: 'none' }}>
            <span className="material-symbols-rounded" style={{ fontSize: '14px' }}>verified</span>
            HEALTH: {healthScore || '...'}
          </Link>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--border-strong)', border: '2px solid var(--gold)' }} />
        </div>
      </nav>

      {/* Mobile Bottom Nav */}
      <nav className="loan-bottom-nav">
        {navLinks.slice(0, 5).map((link, idx) => {
          const isActive = location.pathname === link.path || (link.path !== '/loans' && location.pathname.startsWith(link.path));
          
          if (idx === 2) {
            // Apply becomes center FAB
            return (
              <Link key="apply" to="/loans/apply" className="mobile-fab-center">
                <span className="material-symbols-rounded">add</span>
              </Link>
            );
          }
          
          return (
            <Link key={link.name} to={link.path} className={`mobile-tab ${isActive ? 'active' : ''}`}>
              <span className="material-symbols-rounded mobile-tab-icon">
                {link.name === 'Home' ? 'dashboard' : link.name === 'Tracker' ? 'map' : link.name === 'Score' ? 'credit_score' : 'smart_toy'}
              </span>
              {link.name}
            </Link>
          );
        })}
      </nav>

      {/* FABs */}
      <div className="fab-stack">
        <div className="fab fab-ai" title="AI Advisor" onClick={() => window.location.href = '/loans/advisor'}>
          <span className="material-symbols-rounded">smart_toy</span>
        </div>
      </div>

      <div className="loan-content-wrapper" style={{ paddingTop: '100px', paddingBottom: '80px' }}>
        <div className="loan-max-w" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '32px', alignItems: 'start' }}>
          
          <main style={{ minWidth: 0 }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                style={{ width: '100%' }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>

          {/* Global Sticky Sidebar */}
          <aside className="loan-sidebar-desktop" style={{ position: 'sticky', top: '100px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <GlassCard tier={1} style={{ padding: '24px', background: 'rgba(255,255,255,0.02)' }}>
              <p className="type-micro" style={{ color: 'var(--gold)', marginBottom: '20px', letterSpacing: '2px' }}>QUICK HUB</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { label: 'Calculator', icon: 'calculate', path: '/loans/calc', color: 'var(--blue)', sub: 'Simulate' },
                  { label: 'Tracker', icon: 'map', path: '/loans/tracker', color: 'var(--purple)', sub: 'Monitor' },
                  { label: 'Health', icon: 'credit_score', path: '/loans/score', color: 'var(--success)', sub: 'Optimize' },
                  { label: 'Repay', icon: 'payments', path: '/loans/repayment', color: 'var(--warning)', sub: 'Manage' },
                ].map(({ label, icon, path, color, sub }) => (
                  <Link to={path} key={label} style={{ textDecoration: 'none' }}>
                    <motion.div 
                      whileHover={{ x: 5, background: 'rgba(255,255,255,0.04)', borderColor: color }}
                      style={{ 
                        display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', 
                        borderRadius: 'var(--r-md)', border: '1px solid var(--border-subtle)', 
                        cursor: 'pointer', transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span className="material-symbols-rounded" style={{ color, fontSize: '20px' }}>{icon}</span>
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 600, fontSize: '0.85rem', color: '#fff' }}>{label}</p>
                        <p className="type-micro" style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{sub}</p>
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </div>

              <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(245,184,0,0.05)', borderRadius: 'var(--r-md)', border: '1px dashed var(--gold-dim)' }}>
                <p className="type-small" style={{ color: 'var(--gold)', fontWeight: 600, marginBottom: '4px' }}>Need Help?</p>
                <p className="type-micro" style={{ color: 'var(--text-secondary)', lineHeight: 1.4 }}>AI Advisor is ready to assist with your application.</p>
                <Link to="/loans/advisor" style={{ color: 'var(--gold)', fontSize: '0.7rem', fontWeight: 700, textDecoration: 'none', display: 'block', marginTop: '8px' }}>
                  LAUNCH ADVISOR →
                </Link>
              </div>
            </GlassCard>
            
            <GlassCard tier={1} style={{ padding: '20px', textAlign: 'center' }}>
               <p className="type-micro" style={{ color: 'var(--text-muted)' }}>MEMBER SINCE 2024</p>
               <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '12px' }}>
                 <Badge variant="gold">VETERAN</Badge>
                 <Badge variant="success">TRUSTED</Badge>
               </div>
            </GlassCard>
          </aside>
        </div>
      </div>

    </div>
  );
}
