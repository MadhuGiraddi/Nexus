import React, { useEffect, useState } from 'react';
import gsap from 'gsap';
import { motion } from 'framer-motion';
import { loansAPI } from '../../../services/api';
import { GlassCard, Badge, PrimaryButton } from '../components/UIElements';
import { Link } from 'react-router-dom';

const STATUS_CONFIG = {
  pending:  { label: 'Under Review', icon: 'schedule', color: 'var(--warning)', bgDim: 'rgba(255,176,32,0.12)' },
  approved: { label: 'Approved',     icon: 'verified', color: 'var(--success)', bgDim: 'rgba(0,230,118,0.12)' },
  active:   { label: 'Active',       icon: 'payments', color: 'var(--blue)',    bgDim: 'rgba(0,194,255,0.12)' },
  funded:   { label: 'Paid Off',     icon: 'check_circle', color: 'var(--gold)', bgDim: 'rgba(245,184,0,0.12)' },
  rejected: { label: 'Rejected',     icon: 'cancel',   color: 'var(--error)',   bgDim: 'rgba(255,76,76,0.12)' },
};

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function LoanCard({ loan }) {
  const cfg = STATUS_CONFIG[loan.status] || STATUS_CONFIG.pending;
  const r   = loan.interestRate / 12 / 100;
  const totalPaid  = Math.round(loan.emiAmount * loan.durationMonths);
  const totalOwed  = Math.round(loan.principalAmount);
  const repaidPct  = loan.status === 'funded' ? 100 : Math.max(0, Math.min(100, 100 - (totalOwed / (loan.principalAmount)) * 100));

  return (
    <GlassCard tier={2} style={{ padding: 32 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <Badge tier={1} variant={loan.status === 'pending' ? 'gold' : loan.status === 'approved' || loan.status === 'active' ? 'success' : 'error'} icon={cfg.icon}>
            {cfg.label.toUpperCase()}
          </Badge>
          <p className="type-num" style={{ fontSize: '2.2rem', color: 'var(--text-primary)', marginTop: 12 }}>₹{Number(loan.principalAmount).toLocaleString()}</p>
          <p className="type-micro" style={{ color: 'var(--text-muted)', marginTop: 4 }}>{loan.purpose || 'Personal'} Financing Requested</p>
        </div>
        <div style={{ textAlign: 'right' }}>
           <p className="type-micro" style={{ color: 'var(--text-muted)', marginBottom: 4 }}>ID: {loan._id.slice(-8).toUpperCase()}</p>
           <p className="type-small" style={{ color: 'var(--text-secondary)' }}>{formatDate(loan.createdAt)}</p>
        </div>
      </div>

      {/* Matrix */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'EMI Amt', val: `₹${Math.round(loan.emiAmount).toLocaleString()}`, icon: 'payments', color: 'var(--gold)' },
          { label: 'Term', val: `${loan.durationMonths} Mo`, icon: 'calendar_today', color: 'var(--blue)' },
          { label: 'APR Rate', val: `${loan.interestRate}%`, icon: 'percent', color: 'var(--success)' },
        ].map(({ label, val, icon, color }) => (
          <div key={label} style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--r-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span className="material-symbols-rounded" style={{ fontSize: 14, color: 'var(--text-muted)' }}>{icon}</span>
              <p className="type-micro" style={{ color: 'var(--text-muted)' }}>{label}</p>
            </div>
            <p className="type-num" style={{ fontSize: '1.1rem', color }}>{val}</p>
          </div>
        ))}
      </div>

      {/* Progress / Timeline */}
      <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--r-lg)', padding: 24, border: '1px solid var(--border-subtle)' }}>
        <p className="type-micro" style={{ color: 'var(--text-muted)', marginBottom: 20, letterSpacing: 1 }}>JOURNEY STATUS</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {loan.timeline.map((evt, i) => {
            const evtCfg = STATUS_CONFIG[evt.status] || STATUS_CONFIG.pending;
            const isLast = i === loan.timeline.length - 1;
            const isFuture = false; // in current logic all in timeline are past
            return (
              <div key={i} style={{ display: 'flex', gap: 20, position: 'relative' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: 32 }}>
                  <div style={{ 
                    width: 32, height: 32, borderRadius: '50%', 
                    background: isLast ? evtCfg.color : 'rgba(255,255,255,0.05)', 
                    border: `2px solid ${isLast ? evtCfg.color : 'var(--border-strong)'}`, 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    zIndex: 1, boxShadow: isLast ? `0 0 15px ${evtCfg.color}44` : 'none'
                  }}>
                    <span className="material-symbols-rounded" style={{ fontSize: 16, color: isLast ? '#000' : 'var(--text-muted)' }}>{evtCfg.icon}</span>
                  </div>
                  {!isLast && <div style={{ width: 2, flex: 1, minHeight: 24, background: 'var(--border-subtle)', margin: '4px 0' }} />}
                </div>
                <div style={{ paddingBottom: isLast ? 0 : 24, paddingTop: 6 }}>
                  <p style={{ fontWeight: 700, fontSize: '0.9rem', color: isLast ? '#fff' : 'var(--text-secondary)' }}>{evtCfg.label}</p>
                  <p className="type-small" style={{ color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.4 }}>{evt.notes}</p>
                  <p className="type-micro" style={{ color: 'var(--text-muted)', marginTop: 6, fontSize: '0.65rem' }}>{formatDate(evt.timestamp)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </GlassCard>
  );
}

export default function Tracker() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLoans = () => {
    setLoading(true);
    loansAPI.getAll()
      .then(({ data }) => setLoans(Array.isArray(data.loans) ? data.loans : []))
      .catch((err) => {
        console.error('Fetch error:', err);
        setError('Could not load your applications.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  // Poll for updates if there are pending loans
  useEffect(() => {
    const hasPending = loans.some(l => l.status === 'pending');
    if (!hasPending) return;

    const interval = setInterval(() => {
      loansAPI.getAll().then(({ data }) => {
        if (Array.isArray(data.loans)) setLoans(data.loans);
      });
    }, 10000); // 10s polling

    return () => clearInterval(interval);
  }, [loans]);

  useEffect(() => {
    if (!loading && loans.length > 0) {
      gsap.from('.tracker-card', { opacity: 0, y: 30, duration: 0.6, stagger: 0.12, ease: 'power3.out' });
    }
  }, [loading, loans]);

  return (
    <div className="tracker-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40, flexWrap: 'wrap', gap: 24 }}>
        <div>
          <p className="type-micro" style={{ color: 'var(--blue)', marginBottom: 12, letterSpacing: 2 }}>
            <span className="material-symbols-rounded" style={{ fontSize: 14, verticalAlign: 'middle', marginRight: 8 }}>track_changes</span>
            REAL-TIME TRACKER
          </p>
          <h1 className="type-h1">Active Applications</h1>
          <p className="type-body" style={{ color: 'var(--text-secondary)', marginTop: 8 }}>Monitor your credit approvals and disbursement status.</p>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={fetchLoans} 
            className="btn-icon" 
            style={{ height: 48, width: 48, borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', cursor: 'pointer' }}
            disabled={loading}
          >
            <span className={`material-symbols-rounded ${loading ? 'spin' : ''}`} style={{ fontSize: 22 }}>refresh</span>
          </motion.button>
          <Link to="/loans/apply" style={{ textDecoration: 'none' }}>
            <PrimaryButton icon="add">New Application</PrimaryButton>
          </Link>
        </div>
      </div>

      {/* Aggregate Stats */}
      {!loading && loans.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 40 }}>
          {[
            { label: 'Total Principal', val: `₹${loans.reduce((acc, l) => acc + Number(l.principalAmount), 0).toLocaleString()}`, color: 'var(--gold)', icon: 'account_balance' },
            { label: 'Active Plans', val: loans.filter(l => l.status === 'active' || l.status === 'approved').length, color: 'var(--success)', icon: 'check_circle' },
            { label: 'Under Review', val: loans.filter(l => l.status === 'pending').length, color: 'var(--warning)', icon: 'schedule' },
          ].map(({ label, val, color, icon }) => (
            <GlassCard key={label} tier={1} style={{ padding: 24, display: 'flex', gap: 16, alignItems: 'center' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-rounded" style={{ color, fontSize: 20 }}>{icon}</span>
              </div>
              <div>
                <p className="type-micro" style={{ color: 'var(--text-muted)' }}>{label}</p>
                <p className="type-num" style={{ fontSize: '1.2rem', color }}>{val}</p>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {[1, 2].map(i => (
            <div key={i} className="loan-skeleton" style={{ height: 320, borderRadius: 'var(--r-2xl)' }} />
          ))}
        </div>
      )}

      {error && (
        <GlassCard style={{ padding: 48, textAlign: 'center', background: 'rgba(255,76,76,0.02)', borderColor: 'rgba(255,76,76,0.2)' }}>
          <span className="material-symbols-rounded" style={{ fontSize: 56, color: 'var(--error)', marginBottom: 20, filter: 'drop-shadow(0 0 10px var(--error))' }}>error_outline</span>
          <h3 className="type-h3" style={{ marginBottom: 12 }}>Connection Issue</h3>
          <p className="type-body" style={{ color: 'var(--text-secondary)' }}>{error}</p>
          <PrimaryButton onClick={fetchLoans} style={{ marginTop: 24 }}>Retry Connection</PrimaryButton>
        </GlassCard>
      )}

      {!loading && !error && loans.length === 0 && (
        <GlassCard tier={2} style={{ padding: 80, textAlign: 'center', background: 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0) 100%)' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <span className="material-symbols-rounded" style={{ fontSize: 40, color: 'var(--text-muted)' }}>receipt_long</span>
          </div>
          <h3 className="type-h2" style={{ marginBottom: 16 }}>No Active Records</h3>
          <p className="type-body" style={{ color: 'var(--text-secondary)', marginBottom: 32, maxWidth: 400, margin: '0 auto 32px' }}>
            Submit an application to see it tracked here. Our AI review process normally takes less than 60 seconds.
          </p>
          <Link to="/loans/apply" style={{ textDecoration: 'none' }}>
            <PrimaryButton icon="bolt">Get Started Now</PrimaryButton>
          </Link>
        </GlassCard>
      )}

      {!loading && loans.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24 }}>
          {loans.map(loan => (
            <motion.div 
              key={loan._id} 
              className="tracker-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <LoanCard loan={loan} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
