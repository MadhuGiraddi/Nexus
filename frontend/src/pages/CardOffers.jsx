import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import {
  CreditCard, Sparkles, Calculator, Star, ChevronRight,
  Plane, ShoppingBag, Fuel, Utensils, Wifi, Crown, Check, X,
  Gift, Zap, IndianRupee
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import gsap from 'gsap';

/* ═══════════════════════════════════════════════════════════════════════════
   CARD DATABASE — Real Indian Credit Cards
   ═══════════════════════════════════════════════════════════════════════════ */
const CARDS = [
  {
    id: 'hdfc-infinia',
    name: 'HDFC Infinia',
    bank: 'HDFC Bank',
    category: 'premium',
    tier: 'Ultra Premium',
    annualFee: 12500,
    joiningFee: 12500,
    rewardRate: 3.3,
    welcomeBonus: 12500,
    loungeAccess: 'Unlimited Domestic & International',
    fuelSurcharge: 'Waived',
    interestRate: 42,
    cashbackCap: null,
    gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)',
    accent: '#e94560',
    perks: ['5X rewards on travel & dining', 'Golf privileges', 'Concierge service', 'Milestone benefits ₹5L'],
    rewardRates: { travel: 5, dining: 5, online: 3.3, groceries: 3.3, fuel: 3.3, others: 3.3 },
  },
  {
    id: 'amex-plat',
    name: 'Amex Platinum',
    bank: 'American Express',
    category: 'premium',
    tier: 'Super Premium',
    annualFee: 60000,
    joiningFee: 60000,
    rewardRate: 5,
    welcomeBonus: 25000,
    loungeAccess: 'Unlimited Priority Pass',
    fuelSurcharge: 'N/A',
    interestRate: 42,
    cashbackCap: null,
    gradient: 'linear-gradient(135deg, #434343 0%, #1a1a1a 50%, #2d2d2d 100%)',
    accent: '#C0C0C0',
    perks: ['Taj Epicure membership', 'Marriott Gold Elite', 'Priority Pass', '₹5000 voucher on ₹1.9L spend'],
    rewardRates: { travel: 5, dining: 5, online: 5, groceries: 5, fuel: 2, others: 5 },
  },
  {
    id: 'axis-ace',
    name: 'Axis Ace',
    bank: 'Axis Bank',
    category: 'cashback',
    tier: 'Entry Level',
    annualFee: 0,
    joiningFee: 499,
    rewardRate: 2,
    welcomeBonus: 500,
    loungeAccess: '4 per year',
    fuelSurcharge: '1% waiver',
    interestRate: 40.8,
    cashbackCap: null,
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    accent: '#667eea',
    perks: ['5% cashback on bill payments', '4% on Swiggy/Zomato', '2% on everything else', 'No annual fee'],
    rewardRates: { travel: 2, dining: 4, online: 5, groceries: 2, fuel: 2, others: 2 },
  },
  {
    id: 'sbi-cashback',
    name: 'SBI SimplyCLICK',
    bank: 'SBI Card',
    category: 'cashback',
    tier: 'Mid Range',
    annualFee: 499,
    joiningFee: 499,
    rewardRate: 2.5,
    welcomeBonus: 500,
    loungeAccess: 'None',
    fuelSurcharge: '1% waiver',
    interestRate: 42,
    cashbackCap: null,
    gradient: 'linear-gradient(135deg, #0652DD 0%, #1B1464 100%)',
    accent: '#0652DD',
    perks: ['10X on partner sites', '5X on all online spends', 'Amazon/Cleartrip vouchers', 'No cap on rewards'],
    rewardRates: { travel: 2.5, dining: 2.5, online: 10, groceries: 2.5, fuel: 1, others: 2.5 },
  },
  {
    id: 'icici-amazon',
    name: 'ICICI Amazon Pay',
    bank: 'ICICI Bank',
    category: 'shopping',
    tier: 'Entry Level',
    annualFee: 0,
    joiningFee: 0,
    rewardRate: 2,
    welcomeBonus: 750,
    loungeAccess: 'None',
    fuelSurcharge: '1% waiver',
    interestRate: 40.8,
    cashbackCap: null,
    gradient: 'linear-gradient(135deg, #FF9900 0%, #232F3E 70%)',
    accent: '#FF9900',
    perks: ['5% on Amazon Prime', '2% on Amazon non-Prime', '1% on all other spends', 'Lifetime free'],
    rewardRates: { travel: 1, dining: 1, online: 5, groceries: 1, fuel: 1, others: 1 },
  },
  {
    id: 'hdfc-regalia',
    name: 'HDFC Regalia Gold',
    bank: 'HDFC Bank',
    category: 'travel',
    tier: 'Premium',
    annualFee: 2500,
    joiningFee: 2500,
    rewardRate: 4,
    welcomeBonus: 5000,
    loungeAccess: '12 domestic + 6 international',
    fuelSurcharge: 'Waived',
    interestRate: 42,
    cashbackCap: null,
    gradient: 'linear-gradient(135deg, #B8860B 0%, #8B6914 40%, #654321 100%)',
    accent: '#DAA520',
    perks: ['4X on travel bookings', 'Priority Pass access', 'Low forex markup', 'Free cancellation insurance'],
    rewardRates: { travel: 8, dining: 4, online: 4, groceries: 4, fuel: 2, others: 4 },
  },
  {
    id: 'au-lit',
    name: 'AU LIT Credit Card',
    bank: 'AU Small Finance',
    category: 'cashback',
    tier: 'Entry Level',
    annualFee: 0,
    joiningFee: 0,
    rewardRate: 3,
    welcomeBonus: 500,
    loungeAccess: '4 per year',
    fuelSurcharge: '1% waiver',
    interestRate: 36,
    cashbackCap: null,
    gradient: 'linear-gradient(135deg, #FF416C 0%, #FF4B2B 100%)',
    accent: '#FF416C',
    perks: ['3% on dining & entertainment', '3X reward points', 'No forex markup', 'Lifetime free'],
    rewardRates: { travel: 2, dining: 3, online: 3, groceries: 2, fuel: 1, others: 2 },
  },
  {
    id: 'onecard',
    name: 'OneCard Metal',
    bank: 'OneCard',
    category: 'cashback',
    tier: 'Mid Range',
    annualFee: 0,
    joiningFee: 0,
    rewardRate: 5,
    welcomeBonus: 0,
    loungeAccess: '4 per year',
    fuelSurcharge: 'Waived',
    interestRate: 36,
    cashbackCap: 1000,
    gradient: 'linear-gradient(135deg, #0c0c0c 0%, #1c1c1c 40%, #333 100%)',
    accent: '#FFFFFF',
    perks: ['5X on top spend category', 'Metal card', 'Spend insights AI', 'Smart EMI conversion'],
    rewardRates: { travel: 2, dining: 5, online: 5, groceries: 5, fuel: 1, others: 2 },
  },
];

const CATEGORIES = [
  { id: 'all', label: 'All Cards', icon: CreditCard },
  { id: 'premium', label: 'Premium', icon: Crown },
  { id: 'cashback', label: 'Cashback', icon: IndianRupee },
  { id: 'travel', label: 'Travel', icon: Plane },
  { id: 'shopping', label: 'Shopping', icon: ShoppingBag },
];

const SPEND_CATEGORIES = [
  { id: 'travel',    label: 'Travel',    icon: Plane,       color: '#3B82F6' },
  { id: 'dining',    label: 'Dining',    icon: Utensils,    color: '#F59E0B' },
  { id: 'online',    label: 'Online',    icon: Wifi,        color: '#8B5CF6' },
  { id: 'groceries', label: 'Groceries', icon: ShoppingBag, color: '#10B981' },
  { id: 'fuel',      label: 'Fuel',      icon: Fuel,        color: '#EF4444' },
  { id: 'others',    label: 'Others',    icon: Gift,        color: '#EC4899' },
];

function fmt(n) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}

/* ═══════════════════════════════════════════════════════════════════════════
   3D TILT CARD COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
function CreditCard3D({ card, onClick, selected }) {
  const cardRef = useRef(null);

  const handleMouseMove = (e) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -12;
    const rotateY = ((x - centerX) / centerX) * 12;
    gsap.to(el, {
      rotateX, rotateY,
      duration: 0.4, ease: 'power2.out',
      transformPerspective: 800,
    });
  };

  const handleMouseLeave = () => {
    if (cardRef.current) {
      gsap.to(cardRef.current, { rotateX: 0, rotateY: 0, duration: 0.6, ease: 'elastic.out(1, 0.5)' });
    }
  };

  return (
    <div
      ref={cardRef}
      className="cc-3d-wrap"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={() => onClick?.(card)}
      style={{ cursor: 'pointer' }}
    >
      <div className="cc-3d-card" style={{ background: card.gradient, borderColor: selected ? card.accent : 'transparent' }}>
        {/* Holographic shimmer */}
        <div className="cc-holo" />
        
        {/* Chip */}
        <div className="cc-chip-row">
          <div className="cc-chip">
            <div className="cc-chip-lines">
              <div /><div /><div /><div />
            </div>
          </div>
          <Wifi size={18} style={{ color: 'rgba(255,255,255,0.5)', transform: 'rotate(90deg)' }} />
        </div>

        {/* Card number */}
        <div className="cc-number">
          <span>••••</span><span>••••</span><span>••••</span><span>{Math.floor(1000 + Math.random() * 9000)}</span>
        </div>

        {/* Bottom Row */}
        <div className="cc-bottom">
          <div>
            <div className="cc-label">CARD HOLDER</div>
            <div className="cc-holder-name">{card.name}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="cc-label">BANK</div>
            <div className="cc-holder-name">{card.bank}</div>
          </div>
        </div>

        {/* Tier badge */}
        <div className="cc-tier" style={{ background: `${card.accent}33`, borderColor: `${card.accent}55` }}>
          {card.tier}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   CARD DETAIL MODAL
   ═══════════════════════════════════════════════════════════════════════════ */
function CardDetailModal({ card, onClose }) {
  if (!card) return null;
  return (
    <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div
        className="glass-card"
        initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }}
        onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 540, padding: 36, position: 'relative' }}
      >
        <button className="modal-close btn-icon" onClick={onClose}><X size={18} /></button>

        <div style={{ display: 'flex', gap: 24, marginBottom: 28, alignItems: 'center' }}>
          <div style={{ width: 180, flexShrink: 0 }}>
            <CreditCard3D card={card} />
          </div>
          <div>
            <h2 style={{ fontSize: 22, fontFamily: "'Space Grotesk', sans-serif", margin: '0 0 4px' }}>{card.name}</h2>
            <p style={{ color: 'var(--text-2)', fontSize: 14, margin: '0 0 12px' }}>{card.bank}</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span className="cc-badge" style={{ background: 'rgba(108,59,238,0.12)', color: 'var(--accent-2)' }}>{card.tier}</span>
              <span className="cc-badge" style={{ background: 'rgba(16,185,129,0.12)', color: 'var(--green)' }}>{card.rewardRate}% rewards</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Annual Fee', value: card.annualFee === 0 ? 'FREE' : fmt(card.annualFee) },
            { label: 'Joining Fee', value: card.joiningFee === 0 ? 'FREE' : fmt(card.joiningFee) },
            { label: 'Lounge Access', value: card.loungeAccess },
            { label: 'Fuel Surcharge', value: card.fuelSurcharge },
            { label: 'Welcome Bonus', value: card.welcomeBonus > 0 ? fmt(card.welcomeBonus) : 'None' },
            { label: 'Interest Rate', value: `${card.interestRate}% p.a.` },
          ].map((item, i) => (
            <div key={i} style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 4 }}>{item.label}</div>
              <div style={{ fontSize: 14, fontWeight: 600, fontFamily: "'Space Grotesk', sans-serif" }}>{item.value}</div>
            </div>
          ))}
        </div>

        <h4 style={{ fontSize: 14, marginBottom: 12, color: 'var(--text-2)' }}>Key Benefits</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {card.perks.map((perk, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
              <Check size={14} style={{ color: 'var(--green)', flexShrink: 0 }} />
              <span style={{ color: 'var(--text-2)' }}>{perk}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════════════════ */
export default function CardOffers() {
  const { user } = useAuth();
  const [tab, setTab] = useState('showcase');
  const containerRef = useRef(null);
  const [selectedCard, setSelectedCard] = useState(null);

  /* ── Showcase state ───────────────────────────────────────────────────── */
  const [filter, setFilter] = useState('all');

  /* ── Recommender state ────────────────────────────────────────────────── */
  const [spends, setSpends] = useState({ travel: 5000, dining: 8000, online: 10000, groceries: 6000, fuel: 3000, others: 5000 });
  const [showResults, setShowResults] = useState(false);

  /* ── Calculator state ─────────────────────────────────────────────────── */
  const [calcCard, setCalcCard] = useState(CARDS[0]);
  const [calcSpends, setCalcSpends] = useState({ travel: 5000, dining: 8000, online: 10000, groceries: 6000, fuel: 3000, others: 5000 });

  /* ── GSAP entrance ────────────────────────────────────────────────────── */
  useEffect(() => {
    if (containerRef.current) {
      const q = gsap.utils.selector(containerRef);
      gsap.fromTo(
        q('.glass-card, .cc-3d-wrap, .recommend-card'),
        { opacity: 0, y: 35, scale: 0.96 },
        { opacity: 1, y: 0, scale: 1, duration: 0.55, stagger: 0.04, ease: 'back.out(1.4)', clearProps: 'all' }
      );
    }
  }, [tab, filter, showResults]);

  /* ── Filtered cards ───────────────────────────────────────────────────── */
  const filteredCards = useMemo(() => {
    if (filter === 'all') return CARDS;
    return CARDS.filter(c => c.category === filter);
  }, [filter]);

  /* ── Recommender scoring ──────────────────────────────────────────────── */
  const recommendations = useMemo(() => {
    const totalSpend = Object.values(spends).reduce((a, b) => a + b, 0);
    const scored = CARDS.map(card => {
      let annualReward = 0;
      for (const [cat, amount] of Object.entries(spends)) {
        const rate = card.rewardRates[cat] || 1;
        annualReward += (amount * 12 * rate) / 100;
      }
      annualReward += card.welcomeBonus;
      const netValue = annualReward - card.annualFee;
      return { ...card, annualReward: Math.round(annualReward), netValue: Math.round(netValue), totalSpend };
    });
    scored.sort((a, b) => b.netValue - a.netValue);
    return scored.slice(0, 3);
  }, [spends]);

  /* ── Calculator rewards ───────────────────────────────────────────────── */
  const calcResults = useMemo(() => {
    const breakdown = [];
    let totalReward = 0;
    for (const cat of SPEND_CATEGORIES) {
      const monthlySpend = calcSpends[cat.id] || 0;
      const rate = calcCard.rewardRates[cat.id] || 1;
      const annual = (monthlySpend * 12 * rate) / 100;
      totalReward += annual;
      breakdown.push({ name: cat.label, value: Math.round(annual), color: cat.color, spend: monthlySpend * 12, rate });
    }
    return { breakdown: breakdown.filter(b => b.value > 0), totalReward: Math.round(totalReward), netReward: Math.round(totalReward - calcCard.annualFee) };
  }, [calcCard, calcSpends]);

  const tabs = [
    { id: 'showcase',   icon: CreditCard, label: 'Card Showcase',   desc: 'Browse premium cards' },
    { id: 'recommend',  icon: Sparkles,   label: 'Smart Recommender', desc: 'Find your perfect card' },
    { id: 'calculator', icon: Calculator, label: 'Rewards Calculator', desc: 'Project your earnings' },
  ];

  return (
    <div className="dashboard" style={{ position: 'relative' }}>
      {/* Header */}
      <div className="topbar">
        <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 }}>
          <CreditCard size={22} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8, color: 'var(--accent)' }} />
          Card Offers
        </h2>
        <div className="user-profile">
          <div className="avatar">{user?.name?.charAt(0)}</div>
          <span>{user?.name}</span>
        </div>
      </div>

      {/* Tab selector */}
      <div className="dash-row" style={{ marginBottom: 24, gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {tabs.map(t => (
          <button
            key={t.id}
            className={`glass-card ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
            style={{
              padding: '22px 24px', textAlign: 'center', cursor: 'pointer',
              borderColor: tab === t.id ? 'var(--accent)' : 'transparent'
            }}
          >
            <h3 style={{ fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <t.icon size={20} /> {t.label}
            </h3>
            <p style={{ color: '#B4B4C4', marginTop: 6, fontSize: 13 }}>{t.desc}</p>
          </button>
        ))}
      </div>

      <div ref={containerRef} style={{ position: 'relative' }}>
        <AnimatePresence mode="wait">

          {/* ═════════════════════════════════════════════════════════════════
              TAB 1 — CARD SHOWCASE
              ═════════════════════════════════════════════════════════════════ */}
          {tab === 'showcase' && (
            <motion.div key="showcase" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }}>

              {/* Category filter */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    className="glass-card"
                    onClick={() => setFilter(cat.id)}
                    style={{
                      padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 8,
                      borderColor: filter === cat.id ? 'var(--accent)' : 'transparent',
                      background: filter === cat.id ? 'rgba(108,59,238,0.12)' : undefined,
                      color: filter === cat.id ? 'var(--accent-2)' : 'var(--text-2)'
                    }}
                  >
                    <cat.icon size={14} /> {cat.label}
                  </button>
                ))}
              </div>

              {/* Card grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
                {filteredCards.map(card => (
                  <motion.div
                    key={card.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="glass-card"
                    style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}
                  >
                    <CreditCard3D card={card} onClick={setSelectedCard} />
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <div>
                          <h4 style={{ fontSize: 16, margin: '0 0 2px' }}>{card.name}</h4>
                          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{card.bank}</span>
                        </div>
                        <div className="cc-badge" style={{ background: 'rgba(108,59,238,0.12)', color: 'var(--accent-2)' }}>
                          {card.rewardRate}%
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
                        {[
                          { label: 'Annual Fee', val: card.annualFee === 0 ? 'FREE' : fmt(card.annualFee) },
                          { label: 'Welcome', val: card.welcomeBonus > 0 ? fmt(card.welcomeBonus) : '—' },
                          { label: 'Lounges', val: card.loungeAccess.split(' ')[0] },
                        ].map((s, i) => (
                          <div key={i} style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(0,0,0,0.2)', textAlign: 'center' }}>
                            <div style={{ fontSize: 9, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 3 }}>{s.label}</div>
                            <div style={{ fontSize: 12, fontWeight: 600, fontFamily: "'Space Grotesk', sans-serif" }}>{s.val}</div>
                          </div>
                        ))}
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {card.perks.slice(0, 2).map((p, i) => (
                          <span key={i} style={{ fontSize: 10, color: 'var(--text-2)', background: 'rgba(255,255,255,0.04)', padding: '3px 8px', borderRadius: 6 }}>
                            {p}
                          </span>
                        ))}
                      </div>

                      <button
                        onClick={() => setSelectedCard(card)}
                        style={{
                          marginTop: 14, width: '100%', padding: '10px 16px', borderRadius: 10,
                          background: 'rgba(108,59,238,0.12)', border: '1px solid rgba(108,59,238,0.25)',
                          color: 'var(--accent-2)', fontSize: 13, fontWeight: 600,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                          cursor: 'pointer', transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(108,59,238,0.2)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(108,59,238,0.12)'; }}
                      >
                        View Details <ChevronRight size={14} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ═════════════════════════════════════════════════════════════════
              TAB 2 — SMART RECOMMENDER
              ═════════════════════════════════════════════════════════════════ */}
          {tab === 'recommend' && (
            <motion.div key="recommend" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }}>

              {/* Spend input */}
              <div className="glass-card" style={{ padding: '28px 32px', marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(236,72,153,0.15))', border: '1px solid rgba(139,92,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Sparkles size={22} color="var(--accent-2)" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 18, margin: 0 }}>Tell us your monthly spends</h3>
                    <p style={{ fontSize: 12, color: 'var(--text-2)', margin: 0 }}>We'll find the card that maximizes your rewards</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
                  {SPEND_CATEGORIES.map(cat => (
                    <div key={cat.id} style={{
                      padding: '16px', borderRadius: 12, background: 'rgba(0,0,0,0.2)',
                      border: '1px solid var(--border)', transition: 'border-color 0.2s'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <cat.icon size={16} style={{ color: cat.color }} />
                        <span style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 500 }}>{cat.label}</span>
                      </div>
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', fontSize: 14 }}>₹</span>
                        <input
                          type="number"
                          value={spends[cat.id]}
                          onChange={e => setSpends(prev => ({ ...prev, [cat.id]: Number(e.target.value) || 0 }))}
                          className="field-input"
                          style={{ paddingLeft: 28, width: '100%', fontSize: 15, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 }}>
                  <div style={{ fontSize: 13, color: 'var(--text-2)' }}>
                    Total Monthly: <strong style={{ color: 'var(--text)', fontFamily: "'Space Grotesk', sans-serif" }}>
                      ₹{Object.values(spends).reduce((a, b) => a + b, 0).toLocaleString('en-IN')}
                    </strong>
                  </div>
                  <button
                    className="btn-primary"
                    onClick={() => setShowResults(true)}
                    style={{ padding: '12px 28px' }}
                  >
                    <Sparkles size={16} /> Find Best Cards
                  </button>
                </div>
              </div>

              {/* Results */}
              <AnimatePresence>
                {showResults && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                      <Star size={20} color="var(--amber)" />
                      <h3 style={{ fontSize: 18, margin: 0 }}>Your Top Picks</h3>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                      {recommendations.map((card, i) => (
                        <motion.div
                          key={card.id}
                          className="glass-card recommend-card"
                          initial={{ opacity: 0, y: 20, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ delay: i * 0.1 }}
                          style={{
                            padding: 24, position: 'relative', overflow: 'visible',
                            borderColor: i === 0 ? 'var(--accent)' : 'transparent'
                          }}
                        >
                          {i === 0 && (
                            <div style={{
                              position: 'absolute', top: -12, left: 20,
                              background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
                              padding: '4px 14px', borderRadius: 999, fontSize: 11, fontWeight: 700,
                              color: '#fff', letterSpacing: '0.5px', boxShadow: '0 4px 14px var(--accent-glow)'
                            }}>
                              🏆 Best Match
                            </div>
                          )}

                          <div style={{ marginTop: i === 0 ? 4 : 0 }}>
                            <CreditCard3D card={card} onClick={setSelectedCard} />
                          </div>

                          <div style={{ marginTop: 16 }}>
                            <h4 style={{ fontSize: 16, margin: '0 0 2px' }}>{card.name}</h4>
                            <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '0 0 16px' }}>{card.bank}</p>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                              <div style={{ padding: '12px', borderRadius: 10, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)', textAlign: 'center' }}>
                                <div style={{ fontSize: 9, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 4 }}>Annual Rewards</div>
                                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--green)', fontFamily: "'Space Grotesk', sans-serif" }}>
                                  {fmt(card.annualReward)}
                                </div>
                              </div>
                              <div style={{ padding: '12px', borderRadius: 10, background: 'rgba(108,59,238,0.08)', border: '1px solid rgba(108,59,238,0.15)', textAlign: 'center' }}>
                                <div style={{ fontSize: 9, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 4 }}>Net Value</div>
                                <div style={{ fontSize: 18, fontWeight: 700, color: card.netValue >= 0 ? 'var(--accent-2)' : 'var(--pink)', fontFamily: "'Space Grotesk', sans-serif" }}>
                                  {card.netValue >= 0 ? '+' : ''}{fmt(card.netValue)}
                                </div>
                              </div>
                            </div>

                            <div style={{ fontSize: 11, color: 'var(--text-3)', display: 'flex', justifyContent: 'space-between' }}>
                              <span>Annual fee: {card.annualFee === 0 ? 'FREE' : fmt(card.annualFee)}</span>
                              <span>{card.rewardRate}% base rate</span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Insight callout */}
                    <motion.div
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                      className="glass-card"
                      style={{
                        marginTop: 20, padding: '20px 24px',
                        background: 'linear-gradient(135deg, rgba(16,185,129,0.06), rgba(108,59,238,0.06))',
                        borderColor: 'rgba(16,185,129,0.15)',
                        display: 'flex', alignItems: 'center', gap: 16
                      }}
                    >
                      <Zap size={24} color="var(--amber)" />
                      <div>
                        <p style={{ fontSize: 14, margin: '0 0 4px', fontWeight: 600 }}>
                          💡 {recommendations[0]?.name} saves you {fmt(recommendations[0]?.netValue)}/year
                        </p>
                        <p style={{ fontSize: 12, color: 'var(--text-2)', margin: 0 }}>
                          Based on your monthly spend of ₹{Object.values(spends).reduce((a, b) => a + b, 0).toLocaleString('en-IN')}, 
                          this card maximizes rewards across your top spending categories.
                        </p>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ═════════════════════════════════════════════════════════════════
              TAB 3 — REWARDS CALCULATOR
              ═════════════════════════════════════════════════════════════════ */}
          {tab === 'calculator' && (
            <motion.div key="calculator" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }}>

              {/* Card selector */}
              <div className="glass-card" style={{ padding: '24px 28px', marginBottom: 20 }}>
                <h4 style={{ fontSize: 15, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CreditCard size={18} color="var(--accent-2)" /> Select a Card
                </h4>
                <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 8 }}>
                  {CARDS.map(card => (
                    <button
                      key={card.id}
                      onClick={() => setCalcCard(card)}
                      className="glass-card"
                      style={{
                        padding: '12px 18px', cursor: 'pointer', flexShrink: 0, minWidth: 140,
                        borderColor: calcCard.id === card.id ? 'var(--accent)' : 'transparent',
                        background: calcCard.id === card.id ? 'rgba(108,59,238,0.1)' : undefined,
                        textAlign: 'center'
                      }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{card.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-3)' }}>{card.bank}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {/* Spend inputs */}
                <div className="glass-card" style={{ padding: '24px 28px' }}>
                  <h4 style={{ fontSize: 15, marginBottom: 16 }}>Monthly Spending</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {SPEND_CATEGORIES.map(cat => (
                      <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: `${cat.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <cat.icon size={14} style={{ color: cat.color }} />
                        </div>
                        <span style={{ fontSize: 13, color: 'var(--text-2)', width: 80, flexShrink: 0 }}>{cat.label}</span>
                        <div style={{ flex: 1, position: 'relative' }}>
                          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', fontSize: 13 }}>₹</span>
                          <input
                            type="number"
                            value={calcSpends[cat.id]}
                            onChange={e => setCalcSpends(prev => ({ ...prev, [cat.id]: Number(e.target.value) || 0 }))}
                            className="field-input"
                            style={{ paddingLeft: 24, fontSize: 14, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600 }}
                          />
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--text-3)', width: 40, textAlign: 'right' }}>
                          {calcCard.rewardRates[cat.id]}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Results & chart */}
                <div className="glass-card" style={{ padding: '24px 28px' }}>
                  <h4 style={{ fontSize: 15, marginBottom: 6 }}>Projected Annual Rewards</h4>
                  <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 20 }}>with {calcCard.name}</p>

                  {/* Big reward number */}
                  <div style={{
                    padding: '20px', borderRadius: 14, marginBottom: 20, textAlign: 'center',
                    background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(108,59,238,0.08))',
                    border: '1px solid rgba(16,185,129,0.15)'
                  }}>
                    <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 6 }}>
                      Total Annual Rewards
                    </div>
                    <div style={{ fontSize: 36, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", color: 'var(--green)' }}>
                      ₹{calcResults.totalReward.toLocaleString('en-IN')}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 4 }}>
                      Net after fees: <strong style={{ color: calcResults.netReward >= 0 ? 'var(--green)' : 'var(--pink)' }}>
                        {calcResults.netReward >= 0 ? '+' : ''}₹{calcResults.netReward.toLocaleString('en-IN')}
                      </strong>
                    </div>
                  </div>

                  {/* Pie chart */}
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={calcResults.breakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" strokeWidth={0} paddingAngle={3}>
                        {calcResults.breakdown.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip formatter={v => `₹${v.toLocaleString('en-IN')}`} contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: 8 }} />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Breakdown legend */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                    {calcResults.breakdown.map((item, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                        <span style={{ flex: 1, color: 'var(--text-2)' }}>{item.name}</span>
                        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600 }}>₹{item.value.toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Card detail modal */}
      <AnimatePresence>
        {selectedCard && <CardDetailModal card={selectedCard} onClose={() => setSelectedCard(null)} />}
      </AnimatePresence>
    </div>
  );
}
