import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ArrowDownLeft, ArrowUpRight, Search, Filter } from 'lucide-react';
import { SkeletonCard } from '../ui/Spinner';

const CATEGORY_COLORS = {
  'Food and Drink': '#F59E0B',
  'Travel':         '#6C3BEE',
  'Shopping':       '#EC4899',
  'Transfer':       '#3B82F6',
  'Payment':        '#10B981',
  'Shops':          '#EC4899',
  'Recreation':     '#8B5CF6',
  'Service':        '#06B6D4',
  'Healthcare':     '#EF4444',
  'default':        '#64748B',
};

function getCategoryColor(categories = []) {
  for (const c of categories) {
    if (CATEGORY_COLORS[c]) return CATEGORY_COLORS[c];
  }
  return CATEGORY_COLORS.default;
}

function TxRow({ tx, index }) {
  const isCredit = tx.amount < 0;
  const color    = getCategoryColor(tx.category);
  const initials = (tx.merchantName || tx.name || 'T').slice(0, 2).toUpperCase();

  return (
    <motion.div
      className="tx-row"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ 
        x: 6, 
        backgroundColor: "rgba(255,255,255,0.04)",
        boxShadow: `0 0 20px ${color}11`
      }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="tx-icon" style={{ 
        background: `${color}22`, 
        color,
        boxShadow: `0 0 10px ${color}33`
      }}>
        {initials}
      </div>
      <div className="tx-details">
        <p className="tx-name">{tx.merchantName || tx.name}</p>
        <p className="tx-meta">
          {tx.category?.[0] || 'Other'} · {format(new Date(tx.date), 'MMM d')}
          {tx.pending && <span className="tx-pending-badge">Pending</span>}
        </p>
      </div>
      <div className={`tx-amount ${isCredit ? 'credit' : 'debit'}`}>
        <span style={{ fontWeight: 700 }}>{isCredit ? '+' : '-'}${Math.abs(tx.amount).toFixed(2)}</span>
        {isCredit
          ? <ArrowDownLeft size={12} className="tx-arrow" />
          : <ArrowUpRight  size={12} className="tx-arrow" />}
      </div>
    </motion.div>
  );
}

export default function TransactionFeed({ transactions, loading }) {
  const [search, setSearch] = useState('');

  const filtered = transactions.filter((tx) =>
    !search
    || (tx.merchantName || tx.name || '').toLowerCase().includes(search.toLowerCase())
    || tx.category?.some((c) => c.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="glass-card widget tx-widget">
      <div className="widget-header">
        <div>
          <p className="widget-label">Transactions</p>
          <p className="widget-count">{transactions.length} recent</p>
        </div>
      </div>

      <motion.div 
        className="tx-search-wrap"
        whileFocusWithin={{ 
          borderColor: "var(--accent)", 
          boxShadow: "0 0 20px var(--accent-glow)",
          scale: 1.01
        }}
        transition={{ duration: 0.2 }}
      >
        <motion.div
          animate={search ? { scale: [1, 1.2, 1], color: "var(--accent-2)" } : {}}
          transition={{ duration: 0.3 }}
        >
          <Search size={15} className="tx-search-icon" />
        </motion.div>
        <input
          className="tx-search"
          placeholder="Search transactions…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <motion.button 
            className="tx-clear" 
            onClick={() => setSearch('')}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.2, color: "var(--red)" }}
          >
            ×
          </motion.button>
        )}
      </motion.div>

      <div className="tx-list">
        {loading
          ? [0,1,2,3,4].map((i) => <SkeletonCard key={i} className="skeleton-sm" />)
          : filtered.length === 0
            ? <p className="empty-sub" style={{ textAlign: 'center', padding: '32px 0' }}>No transactions found</p>
            : filtered.map((tx, i) => <TxRow key={tx._id || tx.plaidTransactionId} tx={tx} index={i} />)
        }
      </div>
    </div>
  );
}
