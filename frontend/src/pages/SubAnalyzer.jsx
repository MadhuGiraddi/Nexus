import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import {
  Activity, LayoutDashboard, Skull, TrendingDown, Bell,
  Plus, X, Check, Edit3, Trash2, Calendar, IndianRupee,
  AlertTriangle, Zap, ArrowRight, ChevronRight, Clock,
  Tv, Music, Cloud, Dumbbell, Gamepad2, BookOpen, ShoppingBag,
  Smartphone, Wifi, Shield, BarChart3, PieChart as PieIcon,
  ArrowUpRight, ArrowDownRight, Users, Repeat, Pause, Play,
  Search, Filter, TrendingUp, RefreshCw
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  LineChart, Line, AreaChart, Area
} from 'recharts';
import gsap from 'gsap';

/* ═══════════════════════════════════════════════════════════════════════════
   CONSTANTS & SEED DATA
   ═══════════════════════════════════════════════════════════════════════════ */
const SUB_CATEGORIES = [
  { id: 'entertainment', label: 'Entertainment', icon: Tv,          color: '#8B5CF6' },
  { id: 'music',         label: 'Music',         icon: Music,       color: '#EC4899' },
  { id: 'cloud',         label: 'Cloud/Storage',  icon: Cloud,       color: '#3B82F6' },
  { id: 'fitness',       label: 'Fitness',        icon: Dumbbell,    color: '#10B981' },
  { id: 'gaming',        label: 'Gaming',         icon: Gamepad2,    color: '#F59E0B' },
  { id: 'learning',      label: 'Learning',       icon: BookOpen,    color: '#06B6D4' },
  { id: 'productivity',  label: 'Productivity',   icon: Smartphone,  color: '#F97316' },
  { id: 'other',         label: 'Other',          icon: ShoppingBag, color: '#6B7280' },
];

const BILLING_CYCLES = ['monthly', 'quarterly', 'yearly'];

const DEFAULT_SUBS = [
  { id: '1', name: 'Netflix',         category: 'entertainment', cost: 649,   billing: 'monthly', status: 'active', usageScore: 85, startDate: '2024-01-15', lastUsed: '2026-04-18', icon: '🎬', priceHistory: [{ date: '2024-01', price: 499 }, { date: '2024-07', price: 549 }, { date: '2025-03', price: 649 }] },
  { id: '2', name: 'Spotify Premium',  category: 'music',         cost: 119,   billing: 'monthly', status: 'active', usageScore: 92, startDate: '2023-06-10', lastUsed: '2026-04-20', icon: '🎵', priceHistory: [{ date: '2023-06', price: 119 }] },
  { id: '3', name: 'YouTube Premium',  category: 'entertainment', cost: 149,   billing: 'monthly', status: 'active', usageScore: 70, startDate: '2024-03-01', lastUsed: '2026-04-19', icon: '📺', priceHistory: [{ date: '2024-03', price: 129 }, { date: '2025-01', price: 149 }] },
  { id: '4', name: 'iCloud+ 200GB',    category: 'cloud',         cost: 219,   billing: 'monthly', status: 'active', usageScore: 45, startDate: '2023-09-20', lastUsed: '2026-04-10', icon: '☁️', priceHistory: [{ date: '2023-09', price: 219 }] },
  { id: '5', name: 'Hotstar',          category: 'entertainment', cost: 1499,  billing: 'yearly',  status: 'active', usageScore: 30, startDate: '2025-09-10', lastUsed: '2026-02-14', icon: '⭐', priceHistory: [{ date: '2024-09', price: 899 }, { date: '2025-09', price: 1499 }] },
  { id: '6', name: 'Cult.fit',         category: 'fitness',       cost: 1200,  billing: 'monthly', status: 'paused', usageScore: 10, startDate: '2025-01-05', lastUsed: '2025-11-20', icon: '💪', priceHistory: [{ date: '2025-01', price: 999 }, { date: '2025-07', price: 1200 }] },
  { id: '7', name: 'ChatGPT Plus',     category: 'productivity',  cost: 1650,  billing: 'monthly', status: 'active', usageScore: 95, startDate: '2024-06-01', lastUsed: '2026-04-20', icon: '🤖', priceHistory: [{ date: '2024-06', price: 1650 }] },
  { id: '8', name: 'Amazon Prime',     category: 'entertainment', cost: 1499,  billing: 'yearly',  status: 'active', usageScore: 55, startDate: '2024-04-12', lastUsed: '2026-04-15', icon: '📦', priceHistory: [{ date: '2023-04', price: 999 }, { date: '2024-04', price: 1499 }] },
  { id: '9', name: 'Coursera Plus',    category: 'learning',      cost: 3399,  billing: 'monthly', status: 'cancelled', usageScore: 5, startDate: '2025-08-01', lastUsed: '2025-10-12', icon: '📚', priceHistory: [{ date: '2025-08', price: 3399 }] },
  { id: '10', name: 'Xbox Game Pass',  category: 'gaming',        cost: 499,   billing: 'monthly', status: 'active', usageScore: 40, startDate: '2025-03-15', lastUsed: '2026-03-28', icon: '🎮', priceHistory: [{ date: '2025-03', price: 449 }, { date: '2026-01', price: 499 }] },
];

const SIMILAR_SERVICES = {
  entertainment: [
    { name: 'Netflix',      cost: 649,  billing: 'monthly', features: ['4K', 'Multiple screens', 'Downloads'] },
    { name: 'Hotstar',      cost: 125,  billing: 'monthly', features: ['Sports', 'Disney+', 'Hindi content'] },
    { name: 'Amazon Prime', cost: 125,  billing: 'monthly', features: ['Delivery', 'Music', 'Video'] },
    { name: 'JioCinema',    cost: 29,   billing: 'monthly', features: ['Sports', 'Movies', 'Budget pick'] },
  ],
  music: [
    { name: 'Spotify',       cost: 119, billing: 'monthly', features: ['Podcasts', 'Discover', 'Global library'] },
    { name: 'YouTube Music', cost: 99,  billing: 'monthly', features: ['Music videos', 'Ad-free YT', 'Bundled'] },
    { name: 'Apple Music',   cost: 99,  billing: 'monthly', features: ['Lossless', 'Spatial Audio', 'Apple eco'] },
    { name: 'JioSaavn Pro',  cost: 99,  billing: 'monthly', features: ['Indian music', 'Podcasts', 'Budget'] },
  ],
  cloud: [
    { name: 'iCloud+ 200GB', cost: 219, billing: 'monthly', features: ['Apple sync', 'Family sharing', 'Privacy'] },
    { name: 'Google One 200GB', cost: 210, billing: 'monthly', features: ['Drive', 'Photos', 'VPN included'] },
    { name: 'OneDrive 100GB',   cost: 140, billing: 'monthly', features: ['Office suite', 'PC backup', 'Share'] },
  ],
};

function fmt(n) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}

function toMonthly(cost, billing) {
  if (billing === 'yearly') return Math.round(cost / 12);
  if (billing === 'quarterly') return Math.round(cost / 3);
  return cost;
}

function getNextRenewal(startDate, billing) {
  const start = new Date(startDate);
  const now = new Date();
  const d = new Date(start);
  while (d <= now) {
    if (billing === 'monthly') d.setMonth(d.getMonth() + 1);
    else if (billing === 'quarterly') d.setMonth(d.getMonth() + 3);
    else d.setFullYear(d.getFullYear() + 1);
  }
  return d;
}

function daysBetween(d1, d2) {
  return Math.ceil(Math.abs(d2 - d1) / (1000 * 60 * 60 * 24));
}

/* ═══════════════════════════════════════════════════════════════════════════
   STORAGE HELPERS
   ═══════════════════════════════════════════════════════════════════════════ */
function loadSubs() {
  try {
    const raw = localStorage.getItem('nexus_subs');
    return raw ? JSON.parse(raw) : DEFAULT_SUBS;
  } catch { return DEFAULT_SUBS; }
}

function saveSubs(subs) {
  localStorage.setItem('nexus_subs', JSON.stringify(subs));
}

/* ═══════════════════════════════════════════════════════════════════════════
   ADD / EDIT SUBSCRIPTION MODAL
   ═══════════════════════════════════════════════════════════════════════════ */
function SubModal({ sub, onSave, onClose }) {
  const [form, setForm] = useState(sub || {
    name: '', category: 'entertainment', cost: '', billing: 'monthly',
    status: 'active', usageScore: 50, startDate: new Date().toISOString().split('T')[0],
    lastUsed: new Date().toISOString().split('T')[0], icon: '📱',
    priceHistory: [],
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div
        className="glass-card"
        initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }}
        onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 500, padding: 32, position: 'relative' }}
      >
        <button className="modal-close btn-icon" onClick={onClose}><X size={18} /></button>
        <h3 style={{ fontSize: 20, fontFamily: "'Space Grotesk', sans-serif", marginBottom: 24 }}>
          {sub ? 'Edit Subscription' : 'Add Subscription'}
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Name */}
          <div className="field-group">
            <label className="field-label">Name</label>
            <input className="field-input" placeholder="e.g. Netflix" value={form.name} onChange={e => set('name', e.target.value)} />
          </div>

          {/* Icon + Category */}
          <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 12 }}>
            <div className="field-group">
              <label className="field-label">Icon</label>
              <input className="field-input" value={form.icon} onChange={e => set('icon', e.target.value)} style={{ textAlign: 'center', fontSize: 20 }} maxLength={2} />
            </div>
            <div className="field-group">
              <label className="field-label">Category</label>
              <select className="field-input" value={form.category} onChange={e => set('category', e.target.value)}>
                {SUB_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
          </div>

          {/* Cost + Billing */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field-group">
              <label className="field-label">Cost (₹)</label>
              <input className="field-input" type="number" placeholder="499" value={form.cost} onChange={e => set('cost', Number(e.target.value))} />
            </div>
            <div className="field-group">
              <label className="field-label">Billing Cycle</label>
              <select className="field-input" value={form.billing} onChange={e => set('billing', e.target.value)}>
                {BILLING_CYCLES.map(b => <option key={b} value={b}>{b.charAt(0).toUpperCase() + b.slice(1)}</option>)}
              </select>
            </div>
          </div>

          {/* Status + Usage */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field-group">
              <label className="field-label">Status</label>
              <select className="field-input" value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="field-group">
              <label className="field-label">Usage Score ({form.usageScore}%)</label>
              <input type="range" min={0} max={100} value={form.usageScore} onChange={e => set('usageScore', Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent-2)', marginTop: 8 }} />
            </div>
          </div>

          {/* Dates */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field-group">
              <label className="field-label">Start Date</label>
              <input className="field-input" type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} />
            </div>
            <div className="field-group">
              <label className="field-label">Last Used</label>
              <input className="field-input" type="date" value={form.lastUsed} onChange={e => set('lastUsed', e.target.value)} />
            </div>
          </div>

          <button
            className="btn-primary btn-full"
            style={{ marginTop: 8 }}
            onClick={() => {
              if (!form.name || !form.cost) return;
              const saved = {
                ...form,
                id: form.id || Date.now().toString(),
                priceHistory: form.priceHistory?.length ? form.priceHistory : [{ date: form.startDate?.slice(0, 7), price: form.cost }],
              };
              onSave(saved);
            }}
          >
            <Check size={16} /> {sub ? 'Save Changes' : 'Add Subscription'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   USAGE METER COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
function UsageMeter({ score, size = 48 }) {
  const color = score >= 70 ? 'var(--green)' : score >= 40 ? 'var(--amber)' : 'var(--red)';
  const circumference = 2 * Math.PI * 18;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox="0 0 44 44" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
        <circle cx="22" cy="22" r="18" fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
      </svg>
      <span style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 10, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", color
      }}>
        {score}%
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
export default function SubAnalyzer() {
  const { user } = useAuth();
  const [tab, setTab] = useState('dashboard');
  const [subs, setSubs] = useState(loadSubs);
  const [modal, setModal] = useState(null); // null | 'add' | sub object
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const containerRef = useRef(null);

  // Persist
  useEffect(() => { saveSubs(subs); }, [subs]);

  // GSAP entrance
  useEffect(() => {
    if (containerRef.current) {
      const q = gsap.utils.selector(containerRef);
      gsap.fromTo(
        q('.glass-card, .sa-stat-card, .sa-sub-row'),
        { opacity: 0, y: 30, scale: 0.97 },
        { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.03, ease: 'back.out(1.4)', clearProps: 'all' }
      );
    }
  }, [tab]);

  // Handlers
  const handleSave = useCallback((sub) => {
    setSubs(prev => {
      const idx = prev.findIndex(s => s.id === sub.id);
      if (idx >= 0) { const copy = [...prev]; copy[idx] = sub; return copy; }
      return [...prev, sub];
    });
    setModal(null);
  }, []);

  const handleDelete = useCallback((id) => {
    setSubs(prev => prev.filter(s => s.id !== id));
    setDeleteConfirm(null);
  }, []);

  const handleStatusToggle = useCallback((id) => {
    setSubs(prev => prev.map(s => {
      if (s.id !== id) return s;
      const next = s.status === 'active' ? 'paused' : s.status === 'paused' ? 'active' : s.status;
      return { ...s, status: next };
    }));
  }, []);

  /* ── Computed ──────────────────────────────────────────────────────────── */
  const activeSubs = useMemo(() => subs.filter(s => s.status === 'active'), [subs]);
  const pausedSubs = useMemo(() => subs.filter(s => s.status === 'paused'), [subs]);

  const totalMonthly = useMemo(() =>
    activeSubs.reduce((sum, s) => sum + toMonthly(s.cost, s.billing), 0),
    [activeSubs]
  );

  const totalYearly = useMemo(() => totalMonthly * 12, [totalMonthly]);

  const categoryBreakdown = useMemo(() => {
    const map = {};
    activeSubs.forEach(s => {
      const monthly = toMonthly(s.cost, s.billing);
      map[s.category] = (map[s.category] || 0) + monthly;
    });
    return SUB_CATEGORIES
      .filter(c => map[c.id])
      .map(c => ({ name: c.label, value: map[c.id], color: c.color, id: c.id }));
  }, [activeSubs]);

  const upcomingRenewals = useMemo(() => {
    const now = new Date();
    return activeSubs
      .map(s => ({ ...s, nextRenewal: getNextRenewal(s.startDate, s.billing) }))
      .filter(s => daysBetween(now, s.nextRenewal) <= 30)
      .sort((a, b) => a.nextRenewal - b.nextRenewal);
  }, [activeSubs]);

  // Dead subs: usage < 30% or not used in 30+ days
  const deadSubs = useMemo(() => {
    const now = new Date();
    return subs.filter(s => {
      if (s.status === 'cancelled') return false;
      const daysSinceUse = daysBetween(new Date(s.lastUsed), now);
      return s.usageScore < 30 || daysSinceUse > 30;
    });
  }, [subs]);

  const potentialSavings = useMemo(() =>
    deadSubs.reduce((sum, s) => sum + toMonthly(s.cost, s.billing), 0),
    [deadSubs]
  );

  // Annual vs monthly comparison
  const billingOptimization = useMemo(() => {
    return activeSubs
      .filter(s => s.billing === 'monthly')
      .map(s => {
        const monthlyTotal = s.cost * 12;
        const estimatedYearly = Math.round(s.cost * 10); // ~17% discount estimate
        return { ...s, monthlyTotal, estimatedYearly, savings: monthlyTotal - estimatedYearly };
      })
      .filter(s => s.savings > 0)
      .sort((a, b) => b.savings - a.savings);
  }, [activeSubs]);

  // Duplicate detection
  const duplicates = useMemo(() => {
    const catGroups = {};
    activeSubs.forEach(s => {
      if (!catGroups[s.category]) catGroups[s.category] = [];
      catGroups[s.category].push(s);
    });
    return Object.entries(catGroups)
      .filter(([, arr]) => arr.length > 1)
      .map(([cat, arr]) => ({ category: cat, services: arr, totalMonthly: arr.reduce((s, v) => s + toMonthly(v.cost, v.billing), 0) }));
  }, [activeSubs]);

  // Price change alerts
  const priceAlerts = useMemo(() => {
    return subs.filter(s => s.priceHistory && s.priceHistory.length > 1).map(s => {
      const hist = s.priceHistory;
      const latest = hist[hist.length - 1];
      const prev = hist[hist.length - 2];
      const change = latest.price - prev.price;
      const pct = ((change / prev.price) * 100).toFixed(1);
      return { ...s, latestPrice: latest.price, prevPrice: prev.price, change, pct: Number(pct) };
    }).filter(s => s.change !== 0).sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct));
  }, [subs]);

  // Forecast for chart
  const forecastData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    return Array.from({ length: 12 }, (_, i) => {
      const m = (now.getMonth() + i) % 12;
      return { name: months[m], spend: totalMonthly + Math.round((Math.random() - 0.5) * 200) };
    });
  }, [totalMonthly]);

  const tabs = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard',    desc: 'Overview & manage' },
    { id: 'dead',      icon: Skull,           label: 'Dead Detector', desc: 'Find unused subs' },
    { id: 'optimizer', icon: TrendingDown,    label: 'Cost Optimizer', desc: 'Save money' },
    { id: 'alerts',    icon: Bell,            label: 'Price Alerts',   desc: 'Track changes' },
  ];

  return (
    <div className="dashboard" style={{ position: 'relative' }}>
      {/* Header */}
      <div className="topbar">
        <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 }}>
          <Activity size={22} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8, color: 'var(--accent)' }} />
          Subscription Analyzer
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn-add" onClick={() => setModal('add')}>
            <Plus size={14} /> Add Sub
          </button>
          <div className="user-profile" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="avatar" style={{
              width: 34, height: 34, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent), var(--pink))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 700
            }}>{user?.name?.charAt(0)}</div>
            <span>{user?.name}</span>
          </div>
        </div>
      </div>

      {/* Tab selector */}
      <div className="dash-row" style={{ marginBottom: 24, gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {tabs.map(t => (
          <button
            key={t.id}
            className={`glass-card ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
            style={{
              padding: '18px 20px', textAlign: 'center', cursor: 'pointer',
              borderColor: tab === t.id ? 'var(--accent)' : 'transparent'
            }}
          >
            <h3 style={{ fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <t.icon size={18} /> {t.label}
            </h3>
            <p style={{ color: '#B4B4C4', marginTop: 4, fontSize: 12 }}>{t.desc}</p>
          </button>
        ))}
      </div>

      <div ref={containerRef} style={{ position: 'relative' }}>
        <AnimatePresence mode="wait">

          {/* ═══════════════════════════════════════════════════════════════
              TAB 1 — DASHBOARD
              ═══════════════════════════════════════════════════════════════ */}
          {tab === 'dashboard' && (
            <motion.div key="dashboard" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }}>

              {/* Stat cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
                {[
                  { label: 'Monthly Spend', value: fmt(totalMonthly), icon: IndianRupee, color: 'var(--accent-2)', bg: 'rgba(108,59,238,0.12)' },
                  { label: 'Yearly Spend', value: fmt(totalYearly), icon: Calendar, color: 'var(--pink)', bg: 'rgba(236,72,153,0.12)' },
                  { label: 'Active Subs', value: activeSubs.length, icon: Repeat, color: 'var(--green)', bg: 'rgba(16,185,129,0.12)' },
                  { label: 'Potential Savings', value: `${fmt(potentialSavings)}/mo`, icon: TrendingDown, color: 'var(--amber)', bg: 'rgba(245,158,11,0.12)' },
                ].map((stat, i) => (
                  <div key={i} className="glass-card sa-stat-card" style={{ padding: '20px 22px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 12, background: stat.bg,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <stat.icon size={20} color={stat.color} />
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{stat.label}</span>
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>{stat.value}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 20, marginBottom: 24 }}>
                {/* Subscription list */}
                <div className="glass-card" style={{ padding: '24px 28px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                    <h4 style={{ fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Repeat size={18} color="var(--accent-2)" /> All Subscriptions
                    </h4>
                    <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{subs.length} total</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 420, overflowY: 'auto' }}>
                    {subs.map(s => {
                      const cat = SUB_CATEGORIES.find(c => c.id === s.category);
                      return (
                        <div key={s.id} className="sa-sub-row" style={{
                          display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px',
                          borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)',
                          transition: 'all 0.2s'
                        }}>
                          <span style={{ fontSize: 24, flexShrink: 0 }}>{s.icon}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                              {s.name}
                              <span style={{
                                fontSize: 9, padding: '2px 8px', borderRadius: 999, fontWeight: 600, letterSpacing: '0.5px',
                                background: s.status === 'active' ? 'rgba(16,185,129,0.12)' : s.status === 'paused' ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)',
                                color: s.status === 'active' ? 'var(--green)' : s.status === 'paused' ? 'var(--amber)' : 'var(--red)',
                                textTransform: 'uppercase'
                              }}>{s.status}</span>
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{cat?.label} · {s.billing}</div>
                          </div>
                          <UsageMeter score={s.usageScore} size={38} />
                          <div style={{ textAlign: 'right', minWidth: 70 }}>
                            <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>
                              {fmt(s.cost)}
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--text-3)' }}>/{s.billing === 'yearly' ? 'yr' : s.billing === 'quarterly' ? 'qtr' : 'mo'}</div>
                          </div>
                          <div style={{ display: 'flex', gap: 4 }}>
                            {s.status !== 'cancelled' && (
                              <button className="btn-icon" style={{ width: 28, height: 28, borderRadius: 8 }} onClick={() => handleStatusToggle(s.id)} title={s.status === 'active' ? 'Pause' : 'Resume'}>
                                {s.status === 'active' ? <Pause size={12} /> : <Play size={12} />}
                              </button>
                            )}
                            <button className="btn-icon" style={{ width: 28, height: 28, borderRadius: 8 }} onClick={() => setModal(s)} title="Edit">
                              <Edit3 size={12} />
                            </button>
                            <button className="btn-icon" style={{ width: 28, height: 28, borderRadius: 8, color: 'var(--red)' }} onClick={() => setDeleteConfirm(s.id)} title="Delete">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right panel: Category chart + renewals */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div className="glass-card" style={{ padding: '24px 28px' }}>
                    <h4 style={{ fontSize: 15, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <PieIcon size={16} color="var(--accent-2)" /> By Category
                    </h4>
                    {categoryBreakdown.length > 0 ? (
                      <>
                        <ResponsiveContainer width="100%" height={180}>
                          <PieChart>
                            <Pie data={categoryBreakdown} cx="50%" cy="50%" innerRadius={45} outerRadius={72} dataKey="value" strokeWidth={0} paddingAngle={3}>
                              {categoryBreakdown.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                            </Pie>
                            <Tooltip formatter={v => `₹${v.toLocaleString('en-IN')}/mo`} contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: 8, fontSize: 12 }} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                          {categoryBreakdown.map((item, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12 }}>
                              <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                              <span style={{ flex: 1, color: 'var(--text-2)' }}>{item.name}</span>
                              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600 }}>{fmt(item.value)}/mo</span>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>No active subscriptions</div>
                    )}
                  </div>

                  {/* Upcoming renewals */}
                  <div className="glass-card" style={{ padding: '24px 28px' }}>
                    <h4 style={{ fontSize: 15, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Clock size={16} color="var(--amber)" /> Upcoming Renewals
                    </h4>
                    {upcomingRenewals.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {upcomingRenewals.slice(0, 5).map(s => {
                          const days = daysBetween(new Date(), s.nextRenewal);
                          return (
                            <div key={s.id} style={{
                              display: 'flex', alignItems: 'center', gap: 12,
                              padding: '10px 12px', borderRadius: 10,
                              background: days <= 3 ? 'rgba(239,68,68,0.06)' : 'rgba(255,255,255,0.02)',
                              border: `1px solid ${days <= 3 ? 'rgba(239,68,68,0.15)' : 'var(--border)'}`
                            }}>
                              <span style={{ fontSize: 20 }}>{s.icon}</span>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13, fontWeight: 600 }}>{s.name}</div>
                                <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                                  {s.nextRenewal.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                </div>
                              </div>
                              <div style={{
                                fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999,
                                background: days <= 3 ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)',
                                color: days <= 3 ? 'var(--red)' : 'var(--amber)',
                              }}>
                                {days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `${days}d`}
                              </div>
                              <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>{fmt(s.cost)}</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>No renewals in the next 30 days</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Spend forecast */}
              <div className="glass-card" style={{ padding: '24px 28px' }}>
                <h4 style={{ fontSize: 15, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <BarChart3 size={16} color="var(--accent-2)" /> 12-Month Spend Forecast
                </h4>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={forecastData}>
                    <defs>
                      <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" tick={{ fill: '#55556B', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#55556B', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(1)}k`} />
                    <Tooltip formatter={v => `₹${v.toLocaleString('en-IN')}`} contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: 8 }} />
                    <Area type="monotone" dataKey="spend" stroke="#8B5CF6" fill="url(#spendGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              TAB 2 — DEAD SUBSCRIPTION DETECTOR
              ═══════════════════════════════════════════════════════════════ */}
          {tab === 'dead' && (
            <motion.div key="dead" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }}>

              {/* Summary banner */}
              <div className="glass-card" style={{
                padding: '24px 28px', marginBottom: 24,
                background: deadSubs.length > 0
                  ? 'linear-gradient(135deg, rgba(239,68,68,0.06), rgba(245,158,11,0.06))'
                  : 'linear-gradient(135deg, rgba(16,185,129,0.06), rgba(108,59,238,0.06))',
                borderColor: deadSubs.length > 0 ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
                display: 'flex', alignItems: 'center', gap: 20,
              }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 16,
                  background: deadSubs.length > 0 ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {deadSubs.length > 0 ? <Skull size={28} color="var(--red)" /> : <Check size={28} color="var(--green)" />}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: 20, marginBottom: 4, fontFamily: "'Space Grotesk', sans-serif" }}>
                    {deadSubs.length > 0
                      ? `🧟 ${deadSubs.length} zombie subscription${deadSubs.length > 1 ? 's' : ''} found!`
                      : '✅ All subscriptions are well-utilized!'
                    }
                  </h3>
                  <p style={{ fontSize: 13, color: 'var(--text-2)' }}>
                    {deadSubs.length > 0
                      ? `You could save ${fmt(potentialSavings)}/month by cancelling unused services.`
                      : 'Great job! You\'re getting value from all your subscriptions.'
                    }
                  </p>
                </div>
                {deadSubs.length > 0 && (
                  <div style={{
                    padding: '14px 20px', borderRadius: 14, textAlign: 'center',
                    background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)'
                  }}>
                    <div style={{ fontSize: 9, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>
                      Annual Savings Potential
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", color: 'var(--green)' }}>
                      {fmt(potentialSavings * 12)}
                    </div>
                  </div>
                )}
              </div>

              {/* Dead sub cards */}
              {deadSubs.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                  {deadSubs.map((s, i) => {
                    const daysSinceUse = daysBetween(new Date(s.lastUsed), new Date());
                    const monthlyWaste = toMonthly(s.cost, s.billing);
                    const cat = SUB_CATEGORIES.find(c => c.id === s.category);
                    return (
                      <motion.div
                        key={s.id}
                        className="glass-card"
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                        style={{ padding: 24, borderColor: 'rgba(239,68,68,0.15)' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                          <span style={{ fontSize: 32 }}>{s.icon}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 16, fontWeight: 700 }}>{s.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{cat?.label}</div>
                          </div>
                          <UsageMeter score={s.usageScore} size={50} />
                        </div>

                        {/* Warning reasons */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                          {s.usageScore < 30 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--red)', padding: '6px 10px', borderRadius: 8, background: 'rgba(239,68,68,0.06)' }}>
                              <AlertTriangle size={14} /> Usage only {s.usageScore}% — barely used
                            </div>
                          )}
                          {daysSinceUse > 30 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--amber)', padding: '6px 10px', borderRadius: 8, background: 'rgba(245,158,11,0.06)' }}>
                              <Clock size={14} /> Last used {daysSinceUse} days ago
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                          <div style={{ padding: 10, borderRadius: 10, background: 'rgba(239,68,68,0.06)', textAlign: 'center' }}>
                            <div style={{ fontSize: 9, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 4 }}>Monthly Waste</div>
                            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--red)', fontFamily: "'Space Grotesk', sans-serif" }}>{fmt(monthlyWaste)}</div>
                          </div>
                          <div style={{ padding: 10, borderRadius: 10, background: 'rgba(16,185,129,0.06)', textAlign: 'center' }}>
                            <div style={{ fontSize: 9, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 4 }}>Yearly Save</div>
                            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--green)', fontFamily: "'Space Grotesk', sans-serif" }}>{fmt(monthlyWaste * 12)}</div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            onClick={() => handleStatusToggle(s.id)}
                            style={{
                              flex: 1, padding: '10px 14px', borderRadius: 10,
                              background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)',
                              color: 'var(--amber)', fontSize: 12, fontWeight: 600,
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer'
                            }}
                          >
                            <Pause size={14} /> Pause
                          </button>
                          <button
                            onClick={() => {
                              setSubs(prev => prev.map(sub => sub.id === s.id ? { ...sub, status: 'cancelled' } : sub));
                            }}
                            style={{
                              flex: 1, padding: '10px 14px', borderRadius: 10,
                              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                              color: 'var(--red)', fontSize: 12, fontWeight: 600,
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer'
                            }}
                          >
                            <X size={14} /> Cancel
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              TAB 3 — COST OPTIMIZER
              ═══════════════════════════════════════════════════════════════ */}
          {tab === 'optimizer' && (
            <motion.div key="optimizer" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }}>

              {/* Annual vs Monthly */}
              <div className="glass-card" style={{ padding: '28px 32px', marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 14,
                    background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(108,59,238,0.15))',
                    border: '1px solid rgba(16,185,129,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <RefreshCw size={22} color="var(--green)" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 18, margin: 0, fontFamily: "'Space Grotesk', sans-serif" }}>Annual vs Monthly Billing</h3>
                    <p style={{ fontSize: 12, color: 'var(--text-2)', margin: 0 }}>Switch to yearly plans to save more</p>
                  </div>
                </div>

                {billingOptimization.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {billingOptimization.map((s, i) => (
                      <div key={s.id} style={{
                        display: 'flex', alignItems: 'center', gap: 16, padding: '16px 18px',
                        borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)'
                      }}>
                        <span style={{ fontSize: 28 }}>{s.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 600 }}>{s.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>Currently ₹{s.cost}/mo × 12 = {fmt(s.monthlyTotal)}/yr</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Estimated Annual</div>
                          <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>{fmt(s.estimatedYearly)}/yr</div>
                        </div>
                        <div style={{
                          padding: '10px 16px', borderRadius: 10,
                          background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
                          textAlign: 'center'
                        }}>
                          <div style={{ fontSize: 9, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 2 }}>You Save</div>
                          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--green)', fontFamily: "'Space Grotesk', sans-serif" }}>{fmt(s.savings)}</div>
                        </div>
                      </div>
                    ))}
                    <div style={{
                      padding: '16px 20px', borderRadius: 12,
                      background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(108,59,238,0.08))',
                      border: '1px solid rgba(16,185,129,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                    }}>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>💰 Total potential annual savings</span>
                      <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--green)', fontFamily: "'Space Grotesk', sans-serif" }}>
                        {fmt(billingOptimization.reduce((s, v) => s + v.savings, 0))}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
                    All your subscriptions are already on optimal billing cycles! 🎉
                  </div>
                )}
              </div>

              {/* Duplicate detector */}
              <div className="glass-card" style={{ padding: '28px 32px', marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 14,
                    background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(236,72,153,0.15))',
                    border: '1px solid rgba(245,158,11,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <AlertTriangle size={22} color="var(--amber)" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 18, margin: 0, fontFamily: "'Space Grotesk', sans-serif" }}>Duplicate Service Detector</h3>
                    <p style={{ fontSize: 12, color: 'var(--text-2)', margin: 0 }}>Multiple services in the same category</p>
                  </div>
                </div>

                {duplicates.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {duplicates.map((grp, i) => {
                      const cat = SUB_CATEGORIES.find(c => c.id === grp.category);
                      return (
                        <div key={i} style={{
                          padding: '18px 20px', borderRadius: 12,
                          background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.1)'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                            {cat && <cat.icon size={16} color={cat.color} />}
                            <span style={{ fontSize: 14, fontWeight: 600 }}>{cat?.label}</span>
                            <span style={{ fontSize: 11, color: 'var(--amber)', fontWeight: 600, marginLeft: 'auto' }}>
                              {grp.services.length} services · {fmt(grp.totalMonthly)}/mo
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                            {grp.services.map(s => (
                              <div key={s.id} style={{
                                padding: '10px 14px', borderRadius: 10,
                                background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)',
                                display: 'flex', alignItems: 'center', gap: 10, minWidth: 160
                              }}>
                                <span style={{ fontSize: 20 }}>{s.icon}</span>
                                <div>
                                  <div style={{ fontSize: 13, fontWeight: 600 }}>{s.name}</div>
                                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{fmt(toMonthly(s.cost, s.billing))}/mo · {s.usageScore}% used</div>
                                </div>
                              </div>
                            ))}
                          </div>
                          <p style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 10 }}>
                            💡 Consider keeping only the one you use most and save {fmt(grp.totalMonthly - Math.min(...grp.services.map(s => toMonthly(s.cost, s.billing))))}/mo
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
                    No duplicate services detected! 🎯
                  </div>
                )}
              </div>

              {/* Comparison table */}
              {Object.entries(SIMILAR_SERVICES).slice(0, 2).map(([catId, services]) => {
                const cat = SUB_CATEGORIES.find(c => c.id === catId);
                return (
                  <div key={catId} className="glass-card" style={{ padding: '24px 28px', marginBottom: 20 }}>
                    <h4 style={{ fontSize: 15, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                      {cat && <cat.icon size={16} color={cat.color} />} {cat?.label} — Compare Alternatives
                    </h4>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border)' }}>
                            <th style={{ textAlign: 'left', padding: '10px 12px', color: 'var(--text-3)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Service</th>
                            <th style={{ textAlign: 'right', padding: '10px 12px', color: 'var(--text-3)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Cost/mo</th>
                            <th style={{ textAlign: 'left', padding: '10px 12px', color: 'var(--text-3)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Key Features</th>
                          </tr>
                        </thead>
                        <tbody>
                          {services.map((svc, j) => (
                            <tr key={j} style={{ borderBottom: '1px solid var(--border)' }}>
                              <td style={{ padding: '12px', fontWeight: 600 }}>{svc.name}</td>
                              <td style={{ padding: '12px', textAlign: 'right', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 }}>{fmt(svc.cost)}</td>
                              <td style={{ padding: '12px' }}>
                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                  {svc.features.map((f, k) => (
                                    <span key={k} style={{
                                      fontSize: 10, padding: '2px 8px', borderRadius: 6,
                                      background: 'rgba(255,255,255,0.04)', color: 'var(--text-2)'
                                    }}>{f}</span>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              TAB 4 — PRICE ALERTS & TRENDS
              ═══════════════════════════════════════════════════════════════ */}
          {tab === 'alerts' && (
            <motion.div key="alerts" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }}>

              {/* Price change alerts */}
              <div className="glass-card" style={{ padding: '28px 32px', marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 14,
                    background: 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(245,158,11,0.15))',
                    border: '1px solid rgba(239,68,68,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Bell size={22} color="var(--red)" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 18, margin: 0, fontFamily: "'Space Grotesk', sans-serif" }}>Price Change Alerts</h3>
                    <p style={{ fontSize: 12, color: 'var(--text-2)', margin: 0 }}>Subscriptions that changed their pricing</p>
                  </div>
                </div>

                {priceAlerts.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {priceAlerts.map((s, i) => (
                      <motion.div
                        key={s.id}
                        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.06 }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 16, padding: '16px 18px',
                          borderRadius: 12,
                          background: s.change > 0 ? 'rgba(239,68,68,0.04)' : 'rgba(16,185,129,0.04)',
                          border: `1px solid ${s.change > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)'}`
                        }}
                      >
                        <span style={{ fontSize: 28 }}>{s.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{s.name}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-2)' }}>
                            <span>{fmt(s.prevPrice)}</span>
                            <ArrowRight size={12} />
                            <span style={{ fontWeight: 700, color: s.change > 0 ? 'var(--red)' : 'var(--green)' }}>{fmt(s.latestPrice)}</span>
                          </div>
                        </div>
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px',
                          borderRadius: 999, fontSize: 13, fontWeight: 700,
                          background: s.change > 0 ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)',
                          color: s.change > 0 ? 'var(--red)' : 'var(--green)',
                          fontFamily: "'Space Grotesk', sans-serif"
                        }}>
                          {s.change > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                          {s.change > 0 ? '+' : ''}{s.pct}%
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
                    No recent price changes detected
                  </div>
                )}
              </div>

              {/* Price history charts */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 20, marginBottom: 24 }}>
                {subs.filter(s => s.priceHistory && s.priceHistory.length > 1).map(s => (
                  <div key={s.id} className="glass-card" style={{ padding: '24px 28px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                      <span style={{ fontSize: 24 }}>{s.icon}</span>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{s.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Price History</div>
                      </div>
                      <div style={{ marginLeft: 'auto', fontSize: 16, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>
                        {fmt(s.cost)}
                      </div>
                    </div>
                    <ResponsiveContainer width="100%" height={120}>
                      <LineChart data={s.priceHistory}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="date" tick={{ fill: '#55556B', fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#55556B', fontSize: 10 }} axisLine={false} tickLine={false} domain={['auto', 'auto']} tickFormatter={v => `₹${v}`} />
                        <Tooltip formatter={v => `₹${v}`} contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: 8, fontSize: 12 }} />
                        <Line type="monotone" dataKey="price" stroke="#EC4899" strokeWidth={2} dot={{ fill: '#EC4899', r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ))}
              </div>

              {/* Smart insights */}
              <div className="glass-card" style={{
                padding: '24px 28px',
                background: 'linear-gradient(135deg, rgba(108,59,238,0.06), rgba(236,72,153,0.06))',
                borderColor: 'rgba(108,59,238,0.15)'
              }}>
                <h4 style={{ fontSize: 15, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Zap size={16} color="var(--amber)" /> Smart Insights
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
                  {[
                    {
                      icon: '📊', title: 'Subscription Inflation',
                      desc: `Your subscriptions have increased an average of ${priceAlerts.length > 0 ? (priceAlerts.reduce((s, v) => s + v.pct, 0) / priceAlerts.length).toFixed(1) : '0'}% since you subscribed.`,
                      color: 'var(--amber)'
                    },
                    {
                      icon: '💸', title: 'Monthly Burn Rate',
                      desc: `You spend ${fmt(totalMonthly)} monthly on ${activeSubs.length} active subscriptions. That's ${fmt(Math.round(totalMonthly / (activeSubs.length || 1)))} per service.`,
                      color: 'var(--accent-2)'
                    },
                    {
                      icon: '🎯', title: 'Best Value',
                      desc: activeSubs.length > 0
                        ? `${activeSubs.sort((a, b) => b.usageScore - a.usageScore)[0]?.name} gives you the best value with ${activeSubs.sort((a, b) => b.usageScore - a.usageScore)[0]?.usageScore}% usage.`
                        : 'Add subscriptions to see insights.',
                      color: 'var(--green)'
                    },
                  ].map((insight, i) => (
                    <div key={i} style={{
                      padding: '16px 18px', borderRadius: 12,
                      background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span style={{ fontSize: 20 }}>{insight.icon}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: insight.color }}>{insight.title}</span>
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--text-2)', margin: 0, lineHeight: 1.6 }}>{insight.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {modal && (
          <SubModal
            sub={typeof modal === 'object' ? modal : null}
            onSave={handleSave}
            onClose={() => setModal(null)}
          />
        )}
      </AnimatePresence>

      {/* Delete confirmation */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div className="glass-card"
              initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              style={{ padding: 32, maxWidth: 380, textAlign: 'center' }}
            >
              <Trash2 size={32} color="var(--red)" style={{ marginBottom: 16 }} />
              <h3 style={{ fontSize: 18, marginBottom: 8, fontFamily: "'Space Grotesk', sans-serif" }}>Delete Subscription?</h3>
              <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 24 }}>This action cannot be undone.</p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button className="btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                <button className="btn-primary" style={{ background: 'var(--red)' }} onClick={() => handleDelete(deleteConfirm)}>
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
