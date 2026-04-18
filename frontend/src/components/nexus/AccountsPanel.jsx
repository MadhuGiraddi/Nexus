import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Wallet, Plus } from 'lucide-react';
import AnimatedNumber from '../ui/AnimatedNumber';
import { SkeletonCard } from '../ui/Spinner';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';

const TYPE_COLOR = {
  depository: '#6C3BEE',
  credit:     '#EC4899',
  loan:       '#F59E0B',
  investment: '#10B981',
  other:      '#64748B',
};

const TYPE_LABEL = {
  depository: 'Checking / Savings',
  credit:     'Credit Card',
  loan:       'Loan',
  investment: 'Investment',
  other:      'Other',
};

function AccountCard({ account, index }) {
  const color  = TYPE_COLOR[account.type] || TYPE_COLOR.other;
  const bal    = account.balances.current || 0;
  const avail  = account.balances.available;
  const isDebt = account.type === 'credit' || account.type === 'loan';

  return (
    <motion.div
      className="account-card"
      style={{ '--accent-color': color, position: 'relative' }}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.05 * index, duration: 0.5 }}
      whileHover={{ 
        y: -4, 
        scale: 1.01, 
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderColor: `${color}66`
      }}
    >
      {/* Subtle Scan Glow Overlay */}
      <motion.div 
        className="card-scan-glow"
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(45deg, transparent, ${color}11, transparent)`,
          pointerEvents: 'none',
          zIndex: 0
        }}
      />

      <div className="account-card-top" style={{ position: 'relative', zIndex: 1 }}>
        <div className="account-logo" style={{ background: `${color}22`, border: `1px solid ${color}44` }}>
          <span style={{ color }}>{account.institutionName?.[0] || account.name?.[0] || 'B'}</span>
        </div>
        <div className="account-info">
          <p className="account-name">{account.name}</p>
          <p className="account-institution">{account.institutionName} · {TYPE_LABEL[account.type] || 'Account'}</p>
        </div>
        <div className="account-balance-wrap">
          <p className="account-balance" style={{ color: isDebt ? 'var(--pink)' : 'var(--text)' }}>
            {isDebt ? '-' : ''}${Math.abs(bal).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          {avail != null && (
            <p className="account-available">${avail.toLocaleString('en-US', { minimumFractionDigits: 0 })} available</p>
          )}
        </div>
      </div>
      <div className="account-bar-wrap" style={{ position: 'relative', zIndex: 1 }}>
        <div className="account-bar" style={{ background: `${color}22` }}>
          <motion.div
            className="account-bar-fill"
            style={{ background: `linear-gradient(90deg, ${color}, ${color}99)` }}
            initial={{ width: 0 }}
            animate={{ width: avail != null ? `${Math.min((avail / bal) * 100, 100)}%` : '100%' }}
            transition={{ delay: 0.1 * index + 0.3, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
      </div>
    </motion.div>
  );
}

export default function AccountsPanel({ accounts, netWorth, loading, onConnect, onSpend }) {
  const totalAssets = accounts.filter((a) => a.type !== 'credit' && a.type !== 'loan').reduce((s, a) => s + (a.balances.current || 0), 0);
  const totalDebt   = accounts.filter((a) => a.type === 'credit' || a.type === 'loan').reduce((s, a) => s + (a.balances.current || 0), 0);

  if (loading) return (
    <div className="glass-card widget">
      <div className="widget-header"><span className="widget-title">Accounts</span></div>
      {[0,1,2].map((i) => <SkeletonCard key={i} className="skeleton-sm" />)}
    </div>
  );

  return (
    <div className="glass-card widget accounts-widget">
      <div className="widget-header">
        <div>
          <p className="widget-label">Linked Accounts</p>
          <p className="widget-count">{accounts.length} account{accounts.length !== 1 ? 's' : ''}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-add" onClick={onSpend} style={{ background: 'rgba(236,72,153,0.15)', borderColor: 'rgba(236,72,153,0.3)', color: 'var(--pink)' }}>
             Spend
          </button>
          <button className="btn-add" onClick={onConnect}><Plus size={16} /> Connect Bank</button>
        </div>
      </div>

      {/* Summary row */}
      {accounts.length > 0 && (
        <div className="accounts-summary">
          <div className="summary-item">
            <TrendingUp size={14} className="summary-icon green" />
            <div>
              <p className="summary-label">Assets</p>
              <p className="summary-val">${totalAssets.toLocaleString('en-US', { minimumFractionDigits: 0 })}</p>
            </div>
          </div>
          <div className="summary-divider" />
          <div className="summary-item">
            <TrendingDown size={14} className="summary-icon pink" />
            <div>
              <p className="summary-label">Liabilities</p>
              <p className="summary-val">${totalDebt.toLocaleString('en-US', { minimumFractionDigits: 0 })}</p>
            </div>
          </div>
          <div className="summary-divider" />
          <div className="summary-item">
            <Wallet size={14} className="summary-icon accent" />
            <div>
              <p className="summary-label">Net Worth</p>
              <p className="summary-val">${netWorth.toLocaleString('en-US', { minimumFractionDigits: 0 })}</p>
            </div>
          </div>
        </div>
      )}

      {accounts.length === 0 ? (
        <div className="empty-state">
          <Wallet size={36} className="empty-icon" />
          <p className="empty-title">No accounts linked</p>
          <p className="empty-sub">Connect your bank to see balances and transactions</p>
          <button className="btn-primary" onClick={onConnect}><Plus size={16} /> Connect Bank</button>
        </div>
      ) : (
        <div className="account-list">
          {accounts.map((acc, i) => <AccountCard key={acc.account_id} account={acc} index={i} />)}
        </div>
      )}
    </div>
  );
}
