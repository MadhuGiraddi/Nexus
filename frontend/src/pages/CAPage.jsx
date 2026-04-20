import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from 'recharts';
import {
  Users, Star, MapPin, Clock, Shield, Lock, Unlock,
  Briefcase, Zap, AlertTriangle, Check, ChevronDown, ChevronUp,
  Brain, RefreshCw, ArrowRight, Trash2, Eye, Copy,
  FileText, TrendingUp, Plus, X, Calendar, BadgeCheck,
  Building2, Phone, MessageSquare, Sparkles, Target,
  FlaskConical, Vault, ExternalLink
} from 'lucide-react';
import { motion as m } from 'framer-motion';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';
function getToken() { return localStorage.getItem('nx_token'); }

const fmt  = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');
const fmtK = (n) => n >= 100000 ? `₹${(n/100000).toFixed(1)}L` : n >= 1000 ? `₹${(n/1000).toFixed(0)}K` : `₹${n}`;

// ═══════════════════════════════════════════════════════════════════════════════
// CA CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
function CACard({ ca, onBook, onVault, isRecommended }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      className={`ca-card glass-card ${isRecommended ? 'ca-recommended' : ''} ${!ca.available ? 'ca-unavailable' : ''}`}
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: isRecommended ? -3 : -2 }}
    >
      {isRecommended && <div className="ca-rec-strip">🎯 Recommended for Your Tax Events</div>}

      <div className="ca-card-main">
        {/* Avatar & identity */}
        <div className="ca-avatar-col">
          <div className="ca-avatar" style={{ background: `${ca.color}22`, border: `2px solid ${ca.color}44`, color: ca.color }}>
            {ca.avatar}
          </div>
          {ca.verified && <div className="ca-verified-dot"><BadgeCheck size={12} /></div>}
        </div>

        <div className="ca-identity">
          <div className="ca-name-row">
            <span className="ca-name">{ca.name}</span>
            {!ca.available && <span className="ca-unavail-badge">Unavailable</span>}
          </div>
          <span className="ca-firm"><Building2 size={11} /> {ca.firm}</span>
          <div className="ca-badges-row">
            {ca.badges.map(b => <span key={b} className="ca-badge">{b}</span>)}
          </div>
        </div>

        <div className="ca-stats-col">
          <div className="ca-rating">
            <Star size={13} fill="currentColor" />
            <span>{ca.rating}</span>
            <span className="ca-reviews">({ca.reviewCount})</span>
          </div>
          <div className="ca-meta-row"><MapPin size={11} />{ca.location}</div>
          <div className="ca-meta-row"><Clock size={11} />{ca.responseTime}</div>
          <div className="ca-meta-row"><span className="ca-exp">{ca.experience} yrs exp</span></div>
        </div>

        <div className="ca-fee-col">
          <p className="ca-fee-label">Full Consult</p>
          <p className="ca-fee-val">{fmt(ca.consultationFee)}</p>
          <p className="ca-fee-label" style={{ marginTop: 6 }}>Quick Chat</p>
          <p className="ca-fee-quick">{fmt(ca.quickConsultFee)}</p>
        </div>
      </div>

      {/* Specializations */}
      <div className="ca-specs">
        {ca.specializations.map(s => (
          <span key={s} className="ca-spec-tag">{s}</span>
        ))}
      </div>

      {/* Languages */}
      <div className="ca-langs">
        <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Languages:</span>
        {ca.languages.map(l => <span key={l} className="ca-lang">{l}</span>)}
      </div>

      {/* Expandable bio */}
      <div className="ca-expand-btn" onClick={() => setExpanded(v => !v)}>
        {expanded ? 'Hide details' : 'View profile & book'}
        {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            className="ca-detail"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <p className="ca-bio">{ca.bio}</p>

            {/* Slot picker */}
            <div className="ca-slots">
              <p className="ca-slots-label">Available Today:</p>
              <div className="ca-slot-row">
                {ca.calendlySlots.map(slot => (
                  <motion.button
                    key={slot}
                    className="ca-slot-btn"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onBook(ca, slot, 'full')}
                    disabled={!ca.available}
                  >
                    <Calendar size={11} /> {slot}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* CTA buttons */}
            <div className="ca-cta-row">
              <motion.button
                className="ca-book-btn"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onBook(ca, ca.calendlySlots[0], 'full')}
                disabled={!ca.available}
              >
                <Briefcase size={14} />
                Book Consultation
              </motion.button>
              <motion.button
                className="ca-quick-btn"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onBook(ca, 'Quick Chat', 'quick')}
                disabled={!ca.available}
              >
                <MessageSquare size={13} />
                Quick Chat
              </motion.button>
              <motion.button
                className="ca-vault-btn"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onVault(ca)}
              >
                <Lock size={13} />
                Share Vault
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FEATURE 1 — PRE-FLIGHT BRIEFCASE
// ═══════════════════════════════════════════════════════════════════════════════
function PreFlightBriefcase() {
  const [dossier,    setDossier]    = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [showShare,  setShowShare]  = useState(false);
  const [aiSummary,  setAiSummary]  = useState('');
  const [aiLoading,  setAiLoading]  = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/ca/preflight`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then(r => r.json()).then(setDossier).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function generateAISummary() {
    if (!dossier) return;
    setAiLoading(true); setAiSummary('');
    const prompt = `You are FinAgent. Based on the tax dossier for FY ${dossier.fyYear}, analyze this user's financial position:
Income: ₹${(dossier.totalIncome/100000).toFixed(1)}L | TDS Paid: ${fmt(dossier.totalTDSPaid)} | Estimated Tax: ${fmt(dossier.estimatedTax)} | Potential Refund: ${fmt(dossier.estimatedRefund)}
Unused 80C Gap: ₹${(dossier.totalGap/100000).toFixed(1)}L | Potential Savings: ${fmt(dossier.potentialSavings)}
Red Flags: ${dossier.redFlags.map(f => f.msg).join('; ')}
Write a concise 5-bullet executive summary a CA can read in 90 seconds before the consultation. Be specific with numbers. Start with: "## Tax Dossier Summary — FY ${dossier.fyYear}"`;

    try {
      const r = await fetch(`${API_BASE}/finagent/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ message: prompt, mode: 'fast' }),
      });
      const reader = r.body.getReader(); const decoder = new TextDecoder();
      let buf = '', out = '';
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n'); buf = lines.pop();
        for (const line of lines) {
          const t = line.trim(); if (!t.startsWith('data: ')) continue;
          const raw = t.slice(6); if (raw === '[DONE]') continue;
          try { const p = JSON.parse(raw); if (p.content) { out += p.content; setAiSummary(out); } } catch {}
        }
      }
    } catch {} finally { setAiLoading(false); }
  }

  if (loading) return <div className="loan-loading"><RefreshCw size={20} className="spin" /> Scanning 12-month history...</div>;
  if (!dossier) return null;

  const score = dossier.dossierScore;
  const scoreColor = score >= 85 ? '#10B981' : score >= 65 ? '#F59E0B' : '#EF4444';
  const donutData = [
    { name: 'Principal', value: dossier.totalIncome - (dossier.estimatedTax + dossier.totalTDSPaid), color: '#6C3BEE' },
    { name: 'Tax Paid',  value: dossier.totalTDSPaid, color: '#3B82F6' },
    { name: 'Est. Tax',  value: Math.max(dossier.estimatedTax - dossier.totalTDSPaid, 0), color: '#EF4444' },
  ];

  return (
    <div className="pf-root">
      {/* Header strip */}
      <div className="pf-header">
        <div className="pf-header-left">
          <div className="pf-score-ring" style={{ '--score-color': scoreColor }}>
            <span className="pf-score-num">{score}</span>
            <span className="pf-score-sub">Tax Score</span>
          </div>
          <div>
            <h3 className="pf-title">Your Pre-Flight Tax Dossier</h3>
            <p className="pf-sub">FY {dossier.fyYear} · Auto-compiled from Open Banking · Ready to share with CA</p>
            <div className="pf-income-row">
              <span>Total Income: <strong>{fmtK(dossier.totalIncome)}</strong></span>
              <span>TDS Paid: <strong style={{ color: '#3B82F6' }}>{fmtK(dossier.totalTDSPaid)}</strong></span>
              <span style={{ color: dossier.estimatedRefund > 0 ? '#10B981' : '#EF4444' }}>
                {dossier.estimatedRefund > 0 ? `Refund: +${fmtK(dossier.estimatedRefund)}` : `Tax Due: ${fmtK(-dossier.estimatedRefund)}`}
              </span>
            </div>
          </div>
        </div>
        <motion.button
          className="pf-share-btn"
          whileHover={{ scale: 1.04 }}
          onClick={() => setShowShare(v => !v)}
        >
          <Briefcase size={15} /> {showShare ? 'Hide Share' : 'Share with CA'}
        </motion.button>
      </div>

      {/* Red flags */}
      {dossier.redFlags.length > 0 && (
        <div className="pf-flags">
          {dossier.redFlags.map((f, i) => (
            <motion.div
              key={i}
              className={`pf-flag pf-flag-${f.severity}`}
              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <AlertTriangle size={14} />
              <span>{f.msg}</span>
            </motion.div>
          ))}
        </div>
      )}

      <div className="pf-grid">
        {/* Left: income + chart */}
        <div className="pf-left">
          <div className="glass-card pf-card">
            <h4 className="pf-card-title">Income Breakdown</h4>
            <div className="pf-income-list">
              {dossier.incomeStreams.map(s => (
                <div key={s.source} className="pf-income-row-item">
                  <div className="pf-inc-source">
                    <span>{s.source}</span>
                    {s.note && <span className="pf-inc-note">{s.note}</span>}
                  </div>
                  <div className="pf-inc-amounts">
                    <span className="pf-inc-amount">{fmtK(s.amount)}</span>
                    {s.tdsDeducted > 0 && <span className="pf-inc-tds">TDS: {fmtK(s.tdsDeducted)}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card pf-card">
            <h4 className="pf-card-title">Income Allocation</h4>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={donutData} cx="50%" cy="50%" innerRadius={52} outerRadius={76} paddingAngle={3} dataKey="value" animationBegin={0}>
                  {donutData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip formatter={v => fmt(v)} contentStyle={{ background: 'rgba(10,12,20,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pf-chart-legend">
              {donutData.map(d => (
                <div key={d.name} className="donut-leg-item" style={{ fontSize: 11 }}>
                  <span className="donut-dot" style={{ background: d.color }} />
                  <span>{d.name}</span>
                  <span className="donut-leg-val">{fmt(d.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: deductions + expenses */}
        <div className="pf-right">
          <div className="glass-card pf-card">
            <h4 className="pf-card-title">Section-wise Deduction Gaps</h4>
            <div className="pf-deductions">
              {dossier.deductions.map(d => (
                <div key={d.section} className="pf-dedu-row">
                  <div className="pf-dedu-top">
                    <span className="pf-dedu-section">{d.section}</span>
                    <span className="pf-dedu-label">{d.label}</span>
                    {d.gap > 0 && <span className="pf-dedu-gap">Gap: {fmtK(d.gap)}</span>}
                  </div>
                  <div className="pf-dedu-bar-track">
                    <div
                      className="pf-dedu-bar-fill"
                      style={{ width: `${Math.min((d.yourContribution / d.maxLimit) * 100, 100).toFixed(0)}%` }}
                    />
                  </div>
                  <div className="pf-dedu-amounts">
                    <span className="pf-dedu-used">{fmtK(d.yourContribution)} used</span>
                    <span className="pf-dedu-max">of {d.maxLimit >= 999999 ? 'No limit' : fmtK(d.maxLimit)}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="pf-savings-banner">
              <Sparkles size={14} />
              <span>Filling all deduction gaps could save you <strong>{fmt(dossier.potentialSavings)}</strong> in taxes</span>
            </div>
          </div>

          <div className="glass-card pf-card">
            <h4 className="pf-card-title">Auto-Detected Deductible Expenses</h4>
            <div className="pf-expenses">
              {dossier.deductibleExpenses.map(e => (
                <div key={e.category} className="pf-exp-row">
                  <span className="pf-exp-icon">{e.icon}</span>
                  <div className="pf-exp-meta">
                    <span className="pf-exp-cat">{e.category}</span>
                    <span className="pf-exp-note">{e.note}</span>
                  </div>
                  <span className="pf-exp-amount">{fmtK(e.amount)}</span>
                </div>
              ))}
            </div>
            <div className="pf-savings-banner green">
              <Check size={14} />
              <span>Total deductible auto-found: <strong>{fmtK(dossier.totalDeductibleFound)}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Summary Generator */}
      <div className="glass-card pf-ai-section">
        <div className="pf-ai-header">
          <Brain size={16} className="text-accent" />
          <span>FinAgent CA Executive Summary</span>
          <span className="pf-ai-tag">Saves your CA 45 minutes</span>
        </div>
        {!aiSummary ? (
          <motion.button
            className="pf-ai-btn"
            onClick={generateAISummary}
            whileHover={{ scale: 1.02 }}
            disabled={aiLoading}
          >
            {aiLoading ? <><RefreshCw size={14} className="spin" /> Generating dossier...</> : <><Sparkles size={14} /> Generate AI Executive Summary for CA</>}
          </motion.button>
        ) : (
          <div className="pf-ai-output">
            <div
              className="pf-ai-text"
              dangerouslySetInnerHTML={{ __html: aiSummary.replace(/\n/g, '<br/>').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/## (.+)/g, '<h4 style="margin:8px 0 4px;font-size:14px">$1</h4>') }}
            />
            {aiLoading && <RefreshCw size={14} className="spin" style={{ marginTop: 8, color: 'var(--accent-2)' }} />}
            <button className="copy-script-btn" style={{ marginTop: 12 }} onClick={() => navigator.clipboard.writeText(aiSummary)}>
              <Copy size={12} /> Copy Dossier
            </button>
          </div>
        )}
      </div>

      {/* Share panel */}
      <AnimatePresence>
        {showShare && (
          <motion.div
            className="glass-card pf-share-panel"
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
          >
            <p className="pf-share-title"><FileText size={14} /> Attach to CA Booking</p>
            <p className="pf-share-desc">
              When you book a CA below with <strong>Dossier Attached</strong>, they receive this complete financial snapshot instantly.
              No PDFs. No email. No 45-minute discovery call wasted.
            </p>
            <div className="pf-share-items">
              {['12-month bank statement analysis', 'Deduction gap report', 'Auto-detected expenses', 'Income breakdown', 'Red flag alerts', 'AI executive summary'].map(item => (
                <div key={item} className="pf-share-item">
                  <Check size={12} style={{ color: '#10B981' }} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FEATURE 2 — TAX-TWIN SCENARIO SANDBOX
// ═══════════════════════════════════════════════════════════════════════════════
function TaxTwinSandbox({ onUpsellCA }) {
  const [events,        setEvents]        = useState([]);
  const [selected,      setSelected]      = useState([]);
  const [result,        setResult]        = useState(null);
  const [computing,     setComputing]     = useState(false);
  const [showUpsell,    setShowUpsell]    = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/ca/taxtwin/events`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then(r => r.json()).then(d => setEvents(d.events || [])).catch(() => {});
  }, []);

  const toggleEvent = useCallback((eventId) => {
    setSelected(prev => {
      if (prev.includes(eventId)) return prev.filter(id => id !== eventId);
      return [...prev, eventId];
    });
    setResult(null);
  }, []);

  const compute = useCallback(async () => {
    if (!selected.length) return;
    setComputing(true);
    try {
      const r = await fetch(`${API_BASE}/ca/taxtwin/compute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ selectedEventIds: selected }),
      });
      const d = await r.json();
      setResult(d);
      if (d.needsCAUpsell) setShowUpsell(true);
    } catch {} finally { setComputing(false); }
  }, [selected]);

  const complexityColor = (score) =>
    score <= 1 ? '#10B981' : score <= 2 ? '#3B82F6' : score <= 3 ? '#F59E0B' : '#EF4444';

  const categoryColors = { income: '#6C3BEE', capital: '#EF4444', special: '#F59E0B', other: '#3B82F6' };

  return (
    <div className="tt-root">
      <div className="tt-header-strip">
        <FlaskConical size={18} className="text-accent" />
        <div>
          <h3 className="tt-title">Tax-Twin Scenario Sandbox</h3>
          <p className="tt-sub">Simulate life events & instantly see your tax liability change. Complex events trigger expert CA routing.</p>
        </div>
      </div>

      <div className="tt-layout">
        {/* Events palette */}
        <div className="tt-palette">
          <p className="tt-palette-label">📋 Life Events Palette — Click to add to your tax scenario</p>
          <div className="tt-events-grid">
            {events.map(evt => {
              const isSelected = selected.includes(evt.id);
              return (
                <motion.div
                  key={evt.id}
                  className={`tt-event-chip ${isSelected ? 'selected' : ''}`}
                  style={{ '--evt-color': evt.color }}
                  onClick={() => toggleEvent(evt.id)}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  layout
                >
                  <span className="tt-evt-icon">{evt.icon}</span>
                  <div className="tt-evt-meta">
                    <span className="tt-evt-label">{evt.label}</span>
                    <span className="tt-evt-impact">+{fmtK(evt.estimatedTaxImpact)} est. tax</span>
                  </div>
                  <div className="tt-complexity-dot" style={{ background: complexityColor(evt.complexityScore) }} title={`Complexity: ${evt.complexityScore}/5`} />
                  {isSelected && <div className="tt-check-icon"><Check size={12} /></div>}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Right panel: selected events + result */}
        <div className="tt-right-panel">
          {/* Selected timeline */}
          <div className="glass-card tt-active-events">
            <p className="tt-active-label">Your Tax Scenario ({selected.length} events)</p>
            <AnimatePresence>
              {selected.length === 0 ? (
                <div className="tt-empty">
                  <FlaskConical size={28} style={{ color: 'var(--text-3)', marginBottom: 8 }} />
                  <p>Click events from the palette to build your tax scenario</p>
                </div>
              ) : (
                selected.map(id => {
                  const evt = events.find(e => e.id === id);
                  if (!evt) return null;
                  return (
                    <motion.div
                      key={id}
                      className="tt-active-chip"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      style={{ borderLeftColor: evt.color }}
                    >
                      <span>{evt.icon}</span>
                      <div className="tt-active-meta">
                        <span className="tt-active-name">{evt.label}</span>
                        <span className="tt-active-desc">{evt.description}</span>
                      </div>
                      <button className="tt-remove-btn" onClick={() => toggleEvent(id)}>
                        <X size={12} />
                      </button>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>

            {selected.length > 0 && (
              <motion.button
                className="tt-compute-btn"
                onClick={compute}
                disabled={computing}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                {computing
                  ? <><RefreshCw size={14} className="spin" /> Computing tax impact...</>
                  : <><Zap size={14} /> Calculate My Tax Liability</>
                }
              </motion.button>
            )}
          </div>

          {/* Results */}
          <AnimatePresence>
            {result && (
              <motion.div
                className="glass-card tt-result"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {/* Complexity badge */}
                <div className="tt-complexity-strip" style={{ background: `${complexityColor(result.totalComplexityScore)}18`, border: `1px solid ${complexityColor(result.totalComplexityScore)}33` }}>
                  <span style={{ color: complexityColor(result.totalComplexityScore) }}>
                    ● {result.complexityLabel}
                  </span>
                  <span className="tt-complexity-score">Complexity: {result.totalComplexityScore}/5</span>
                </div>

                {/* Tax impact KPIs */}
                <div className="tt-kpis">
                  <div className="tt-kpi">
                    <p className="tt-kpi-label">Additional Tax</p>
                    <p className="tt-kpi-val red">+{fmt(result.estimatedAdditionalTax)}</p>
                  </div>
                  <div className="tt-kpi">
                    <p className="tt-kpi-label">New Total Tax</p>
                    <p className="tt-kpi-val">{fmt(result.newTotalTax)}</p>
                  </div>
                  {result.penaltyRisk && (
                    <div className="tt-kpi">
                      <p className="tt-kpi-label">Penalty Avoidance</p>
                      <p className="tt-kpi-val green">Save {fmt(result.estimatedPenaltyAvoidance)}</p>
                    </div>
                  )}
                </div>

                {/* CA Upsell trigger */}
                <AnimatePresence>
                  {showUpsell && result.needsCAUpsell && (
                    <motion.div
                      className="tt-upsell"
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                    >
                      <div className="tt-upsell-icon">⚠️</div>
                      <p className="tt-upsell-msg">{result.upsellMessage}</p>
                      <div className="tt-upsell-cas">
                        {result.recommendedCAs?.map(ca => (
                          <motion.div
                            key={ca.id}
                            className="tt-upsell-ca"
                            whileHover={{ scale: 1.02 }}
                            onClick={() => onUpsellCA(ca)}
                          >
                            <div className="tt-upsell-ca-avatar" style={{ background: ca.color + '22', color: ca.color }}>
                              {ca.avatar}
                            </div>
                            <div>
                              <p style={{ fontWeight: 700, fontSize: 13 }}>{ca.name}</p>
                              <p style={{ fontSize: 11, color: 'var(--text-3)' }}>{ca.specializations.slice(0, 2).join(', ')}</p>
                            </div>
                            <ArrowRight size={14} style={{ marginLeft: 'auto', color: 'var(--accent-2)' }} />
                          </motion.div>
                        ))}
                      </div>
                      <p className="tt-upsell-note">⚡ One-click routing to a specialist CA. Avoid penalties up to {fmt(result.estimatedPenaltyAvoidance)}.</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* All clear */}
                {!result.needsCAUpsell && (
                  <div className="tt-all-clear">
                    <Check size={16} />
                    <p>These events are manageable for self-filing. Your scenario complexity is within standard ITR limits.</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FEATURE 3 — EPHEMERAL DATA VAULT
// ═══════════════════════════════════════════════════════════════════════════════
function EphemeralVault({ preSelectedCA }) {
  const [templates,    setTemplates]    = useState([]);
  const [vaults,       setVaults]       = useState([]);
  const [selectedCA,   setSelectedCA]   = useState(preSelectedCA || null);
  const [selected,     setSelected]     = useState([]);
  const [duration,     setDuration]     = useState(7);
  const [creating,     setCreating]     = useState(false);
  const [newVault,     setNewVault]     = useState(null);
  const [copied,       setCopied]       = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/ca/vault/templates`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then(r => r.json()).then(d => { setTemplates(d.templates || []); setSelected(d.templates?.map(t => t.stream) || []); }).catch(() => {});
    loadVaults();
  }, []);

  useEffect(() => { if (preSelectedCA) setSelectedCA(preSelectedCA); }, [preSelectedCA]);

  async function loadVaults() {
    try {
      const r = await fetch(`${API_BASE}/ca/vault/list`, { headers: { Authorization: `Bearer ${getToken()}` } });
      const d = await r.json();
      setVaults(d.vaults || []);
    } catch {}
  }

  async function createVault() {
    if (!selectedCA || !selected.length) return;
    setCreating(true);
    try {
      const r = await fetch(`${API_BASE}/ca/vault/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ caId: selectedCA.id, caName: selectedCA.name, selectedStreams: selected, durationDays: duration }),
      });
      const d = await r.json();
      setNewVault(d);
      await loadVaults();
    } catch {} finally { setCreating(false); }
  }

  async function revokeVault(vaultId) {
    try {
      await fetch(`${API_BASE}/ca/vault/${vaultId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` } });
      setVaults(prev => prev.filter(v => v.vaultId !== vaultId));
    } catch {}
  }

  const toggleStream = (stream) =>
    setSelected(prev => prev.includes(stream) ? prev.filter(s => s !== stream) : [...prev, stream]);

  const sensColor = (s) => s === 'high' ? '#EF4444' : s === 'medium' ? '#F59E0B' : '#10B981';

  return (
    <div className="vault-root">
      <div className="vault-header-strip">
        <Lock size={18} className="text-accent" />
        <div>
          <h3 className="vault-title">Ephemeral Data Vault</h3>
          <p className="vault-sub">Enterprise-grade encrypted data room. Grant time-limited read-only access. Auto-destructs after {duration} days.</p>
        </div>
      </div>

      <div className="vault-layout">
        {/* Left: create vault */}
        <div className="vault-create glass-card">
          <h4 className="vault-create-title">
            <Shield size={15} /> Create Secure Data Room
          </h4>

          {/* CA selector */}
          <div className="vault-field">
            <label className="vault-field-label">Sharing with CA</label>
            {selectedCA ? (
              <div className="vault-ca-selected">
                <div className="vault-ca-dot" style={{ background: selectedCA.color + '22', color: selectedCA.color }}>{selectedCA.avatar}</div>
                <span>{selectedCA.name} — {selectedCA.firm}</span>
                <button className="tt-remove-btn" onClick={() => setSelectedCA(null)}><X size={11} /></button>
              </div>
            ) : (
              <p className="vault-no-ca">← Select a CA from the Directory tab to share data with them</p>
            )}
          </div>

          {/* Stream selector */}
          <div className="vault-field">
            <label className="vault-field-label">Data Streams to Share</label>
            <div className="vault-streams">
              {templates.map(t => (
                <div
                  key={t.stream}
                  className={`vault-stream ${selected.includes(t.stream) ? 'selected' : ''}`}
                  onClick={() => toggleStream(t.stream)}
                >
                  <span className="vault-stream-icon">{t.icon}</span>
                  <div className="vault-stream-meta">
                    <span className="vault-stream-name">{t.stream}</span>
                    <span className="vault-stream-desc">{t.description}</span>
                  </div>
                  <span className="vault-sens-dot" style={{ background: sensColor(t.sensitivity) }} title={`${t.sensitivity} sensitivity`} />
                  {selected.includes(t.stream) && <Check size={12} style={{ color: '#10B981', flexShrink: 0 }} />}
                </div>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div className="vault-field">
            <label className="vault-field-label">Auto-Destruct Timer</label>
            <div className="vault-duration-row">
              {[3, 7, 14, 30].map(d => (
                <button
                  key={d}
                  className={`vault-dur-btn ${duration === d ? 'active' : ''}`}
                  onClick={() => setDuration(d)}
                >
                  {d} day{d > 1 ? 's' : ''}
                </button>
              ))}
            </div>
            <p className="vault-dur-note">Access auto-revokes on {new Date(Date.now() + duration * 86400000).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}</p>
          </div>

          <motion.button
            className="vault-create-btn"
            onClick={createVault}
            disabled={creating || !selectedCA || !selected.length}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            {creating ? <><RefreshCw size={14} className="spin" /> Creating vault...</> : <><Lock size={14} /> Create Encrypted Vault</>}
          </motion.button>

          {/* Newly created vault */}
          <AnimatePresence>
            {newVault && (
              <motion.div
                className="vault-success"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              >
                <div className="vault-success-icon">🔐</div>
                <p className="vault-success-title">Vault Created!</p>
                <p className="vault-success-msg">{newVault.message}</p>
                <div className="vault-link-row">
                  <span className="vault-link-text">{newVault.caPortalLink?.slice(0, 44)}...</span>
                  <button
                    className="vault-copy-btn"
                    onClick={() => { navigator.clipboard.writeText(newVault.caPortalLink); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <p className="vault-expire-note">💥 Self-destructs in {newVault.durationDays} days</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: active vaults */}
        <div className="vault-active-panel">
          <h4 className="vault-create-title">Active Vaults ({vaults.length})</h4>

          {vaults.length === 0 ? (
            <div className="vault-empty-state">
              <Lock size={32} style={{ color: 'var(--text-3)', marginBottom: 12 }} />
              <p>No active vaults. Create one to securely share data with a CA.</p>
            </div>
          ) : (
            vaults.map(v => {
              const hoursLeft = v.hoursRemaining;
              const pctLeft = Math.min((hoursLeft / (v.durationDays * 24)) * 100, 100);
              const urgency = hoursLeft < 24 ? 'red' : hoursLeft < 72 ? 'amber' : 'green';
              return (
                <motion.div
                  key={v.vaultId}
                  className="vault-active-card glass-card"
                  layout
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                >
                  <div className="vault-active-top">
                    <div className="vault-active-icon">🔐</div>
                    <div className="vault-active-meta">
                      <p className="vault-active-ca">{v.caName}</p>
                      <p className="vault-active-streams">{v.selectedStreams.length} streams shared</p>
                    </div>
                    <div className={`vault-timer ${urgency}`}>
                      <Clock size={11} />
                      {hoursLeft > 48 ? `${Math.round(hoursLeft / 24)}d left` : `${hoursLeft}h left`}
                    </div>
                  </div>
                  <div className="vault-timer-bar-track">
                    <div className="vault-timer-bar-fill" style={{ width: `${pctLeft}%`, background: urgency === 'red' ? '#EF4444' : urgency === 'amber' ? '#F59E0B' : '#10B981' }} />
                  </div>
                  <div className="vault-active-streams-list">
                    {v.selectedStreams.map(s => (
                      <span key={s} className="vault-stream-mini">{s}</span>
                    ))}
                  </div>
                  <div className="vault-active-btns">
                    <button className="vault-revoke-btn" onClick={() => revokeVault(v.vaultId)}>
                      <Trash2 size={12} /> Revoke Now
                    </button>
                    <button className="vault-view-btn" onClick={() => navigator.clipboard.writeText(v.accessToken)}>
                      <Eye size={12} /> Copy Token
                    </button>
                  </div>
                </motion.div>
              );
            })
          )}

          {/* Security guarantee */}
          <div className="vault-guarantee">
            <Shield size={13} />
            <p>All vaults use AES-256 encryption. Read-only access — CAs cannot download or export data. Access logs permanently recorded.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN CA PAGE
// ═══════════════════════════════════════════════════════════════════════════════
const TABS = [
  { id: 'directory',  label: 'CA Directory',       icon: <Users size={15} /> },
  { id: 'preflight',  label: 'Pre-Flight Briefcase', icon: <Briefcase size={15} /> },
  { id: 'taxtwin',    label: 'Tax-Twin Sandbox',   icon: <FlaskConical size={15} /> },
  { id: 'vault',      label: 'Data Vault',         icon: <Lock size={15} /> },
];

const SPECIALTY_FILTERS = [
  { id: '', label: 'All' },
  { id: 'crypto', label: '₿ Crypto' },
  { id: 'freelance', label: '💻 Freelance' },
  { id: 'startup', label: '🚀 Startup' },
  { id: 'international', label: '🌏 NRI / Intl' },
  { id: 'real_estate', label: '🏠 Real Estate' },
  { id: 'derivatives', label: '📊 F&O' },
];

export default function CAPage() {
  const [tab,           setTab]           = useState('directory');
  const [cas,           setCas]           = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [specialty,     setSpecialty]     = useState('');
  const [bookModal,     setBookModal]     = useState(null);
  const [bookResult,    setBookResult]    = useState(null);
  const [vaultCA,       setVaultCA]       = useState(null);
  const [upsellCA,      setUpsellCA]      = useState(null);

  useEffect(() => {
    setLoading(true);
    const url = specialty
      ? `${API_BASE}/ca/directory?specialty=${specialty}`
      : `${API_BASE}/ca/directory`;
    fetch(url, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then(r => r.json()).then(d => setCas(d.cas || [])).catch(() => {})
      .finally(() => setLoading(false));
  }, [specialty]);

  // When a CA is recommended from Tax-Twin
  useEffect(() => {
    if (upsellCA) { setTab('directory'); }
  }, [upsellCA]);

  async function handleBook(ca, slot, consultationType) {
    setBookModal({ ca, slot, consultationType, dossierAttached: true });
  }

  async function confirmBook() {
    const { ca, slot, consultationType, dossierAttached } = bookModal;
    try {
      const r = await fetch(`${API_BASE}/ca/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ caId: ca.id, slot, consultationType, dossierAttached }),
      });
      const d = await r.json();
      setBookResult(d);
    } catch {}
  }

  function handleVault(ca) { setVaultCA(ca); setTab('vault'); }
  function handleUpsellCA(ca) { setUpsellCA(ca); }

  return (
    <div className="ca-root">
      {/* Page header */}
      <motion.div
        className="loans-header"
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
      >
        <div className="loans-header-left">
          <div className="ca-page-icon"><Users size={20} /></div>
          <div>
            <h1 className="loans-title">CA <span className="loans-title-accent">Contacts</span></h1>
            <p className="loans-sub">AI Tax Dossier · Scenario Sandbox · Encrypted Data Vault · Expert Marketplace</p>
          </div>
        </div>
        <div className="loans-tabs">
          {TABS.map(t => (
            <motion.button
              key={t.id}
              className={`loans-tab ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
            >
              {t.icon}{t.label}
            </motion.button>
          ))}
        </div>
      </motion.div>

      <div className="loans-content">
        <AnimatePresence mode="wait">
          {/* ── DIRECTORY ── */}
          {tab === 'directory' && (
            <motion.div key="dir" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.22 }}>
              <div className="ca-filter-bar">
                <p className="ca-filter-label">Filter by Specialization:</p>
                <div className="ca-filters">
                  {SPECIALTY_FILTERS.map(f => (
                    <motion.button
                      key={f.id}
                      className={`ca-filter-btn ${specialty === f.id ? 'active' : ''}`}
                      onClick={() => setSpecialty(f.id)}
                      whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                    >
                      {f.label}
                    </motion.button>
                  ))}
                </div>
              </div>

              {loading ? (
                <div className="loan-loading"><RefreshCw size={22} className="spin" /> Loading CA directory...</div>
              ) : (
                <div className="ca-directory-grid">
                  {cas.map((ca, i) => (
                    <CACard
                      key={ca.id}
                      ca={ca}
                      onBook={handleBook}
                      onVault={handleVault}
                      isRecommended={upsellCA?.id === ca.id}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ── PRE-FLIGHT ── */}
          {tab === 'preflight' && (
            <motion.div key="pf" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.22 }}>
              <PreFlightBriefcase />
            </motion.div>
          )}

          {/* ── TAX-TWIN ── */}
          {tab === 'taxtwin' && (
            <motion.div key="tt" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.22 }}>
              <TaxTwinSandbox onUpsellCA={handleUpsellCA} />
            </motion.div>
          )}

          {/* ── VAULT ── */}
          {tab === 'vault' && (
            <motion.div key="vault" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.22 }}>
              <EphemeralVault preSelectedCA={vaultCA} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Booking Modal */}
      <AnimatePresence>
        {bookModal && (
          <motion.div className="ai-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="ai-modal glass-card" style={{ maxWidth: 460 }} initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 20 }}>
              {!bookResult ? (
                <>
                  <div className="ai-modal-header">
                    <span>Confirm Booking</span>
                    <button className="ai-modal-close" onClick={() => setBookModal(null)}>×</button>
                  </div>
                  <div className="ai-modal-body" style={{ padding: '20px 24px' }}>
                    <div className="book-modal-ca">
                      <div className="ca-avatar" style={{ background: bookModal.ca.color + '22', color: bookModal.ca.color, width: 52, height: 52, borderRadius: 14, fontSize: 18, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {bookModal.ca.avatar}
                      </div>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: 16 }}>{bookModal.ca.name}</p>
                        <p style={{ fontSize: 12, color: 'var(--text-3)' }}>{bookModal.ca.firm}</p>
                      </div>
                    </div>
                    <div className="book-modal-details">
                      <div><Calendar size={13} /><span>{bookModal.slot}</span></div>
                      <div><Briefcase size={13} /><span>{bookModal.consultationType === 'quick' ? 'Quick Chat' : 'Full Consultation'}</span></div>
                      <div style={{ color: '#10B981' }}><FileText size={13} /><span>Tax Dossier will be attached</span></div>
                    </div>
                    <p className="book-modal-fee">Fee: <strong>{fmt(bookModal.consultationType === 'quick' ? bookModal.ca.quickConsultFee : bookModal.ca.consultationFee)}</strong></p>
                    <div className="book-modal-btns">
                      <button className="rescue-cancel-btn" onClick={() => setBookModal(null)}>Cancel</button>
                      <button className="rescue-execute-btn" style={{ background: 'var(--accent-2)' }} onClick={confirmBook}>
                        <Check size={14} /> Confirm & Pay
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="book-success">
                  <div style={{ fontSize: 40 }}>🎉</div>
                  <h3>Booking Confirmed!</h3>
                  <p className="book-success-msg">{bookResult.message}</p>
                  <p className="book-success-id">Booking ID: {bookResult.bookingId}</p>
                  <button className="rescue-cancel-btn" style={{ marginTop: 14 }} onClick={() => { setBookModal(null); setBookResult(null); }}>Done</button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
