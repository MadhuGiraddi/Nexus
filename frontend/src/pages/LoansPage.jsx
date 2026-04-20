import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Legend,
  BarChart, Bar, ReferenceLine
} from 'recharts';
import {
  Calculator, TrendingDown, AlertTriangle, Zap, Brain,
  ChevronDown, ChevronUp, RefreshCw, Sparkles, Check,
  DollarSign, Calendar, Percent, Info, ArrowRight, Target,
  CreditCard, GraduationCap, Car, Home, ToggleLeft, ToggleRight,
  ExternalLink, Shield, Clock, Bomb, MapPin, TrendingUp,
  Wallet, Lock, Unlock, Building2, Star, Navigation
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';
function getToken() { return localStorage.getItem('nx_token'); }

// ── Formatters ─────────────────────────────────────────────────────────────────
const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');
const fmtK = (n) => n >= 100000 ? `₹${(n/100000).toFixed(1)}L` : n >= 1000 ? `₹${(n/1000).toFixed(0)}K` : `₹${n}`;

// ── Lifestyle equivalents ──────────────────────────────────────────────────────
const LIFESTYLE = [
  { icon: '✈️', label: 'International vacations', unit: 115000 },
  { icon: '🍕', label: 'years of Zomato orders', unit: 36000 },
  { icon: '☕', label: 'cups of premium coffee', unit: 350 },
  { icon: '📱', label: 'flagship smartphones', unit: 80000 },
  { icon: '🎬', label: 'OTT subscriptions (years)', unit: 1200 },
];

// ── Custom Recharts Tooltip ────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="loan-tooltip">
      <p className="loan-tt-label">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: {fmt(p.value)}
        </p>
      ))}
    </div>
  );
}

// ── Donut label ────────────────────────────────────────────────────────────────
function DonutLabel({ cx, cy, value, label }) {
  return (
    <text x={cx} y={cy} textAnchor="middle" fill="white" fontSize={13}>
      <tspan x={cx} dy="-0.4em" fontWeight="700" fontSize={18}>{fmtK(value)}</tspan>
      <tspan x={cx} dy="1.5em" fill="#9ca3af" fontSize={11}>{label}</tspan>
    </text>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 1 — EMI SANDBOX
// ═══════════════════════════════════════════════════════════════════════════════
function EMISandbox({ cashflow }) {
  const [principal,     setPrincipal]     = useState(1000000);
  const [annualRate,    setAnnualRate]     = useState(8.5);
  const [tenureYears,   setTenureYears]    = useState(5);
  const [extraMonthly,  setExtraMonthly]   = useState(0);
  const [showExtra,     setShowExtra]      = useState(false);
  const [showLifestyle, setShowLifestyle]  = useState(false);
  const [result,        setResult]         = useState(null);
  const [loading,       setLoading]        = useState(false);
  const debounceRef = useRef(null);

  const compute = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/loans/compute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ principal, annualRate, tenureMonths: tenureYears * 12, extraMonthly: showExtra ? extraMonthly : 0 }),
      });
      const d = await r.json();
      setResult(d);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [principal, annualRate, tenureYears, extraMonthly, showExtra]);

  // Debounced recompute on slider change
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(compute, 300);
    return () => clearTimeout(debounceRef.current);
  }, [compute]);

  // DTI assessment from live cashflow
  const monthlyIncome = cashflow?.avgMonthlyInflow || 80000;
  const emiAmt        = result?.emi || 0;
  const dtiPct        = monthlyIncome > 0 ? ((emiAmt / monthlyIncome) * 100).toFixed(1) : 0;
  const dtiStatus     = dtiPct <= 20 ? 'safe' : dtiPct <= 36 ? 'caution' : 'danger';

  const donutData = result ? [
    { name: 'Principal', value: result.principal, color: '#6C3BEE' },
    { name: 'Interest',  value: result.totalInterest, color: '#EF4444' },
  ] : [];

  // Amortization chart data — aggregated yearly
  const amortData = result?.schedule
    ? Array.from({ length: Math.ceil(result.schedule.length / 12) }, (_, y) => {
        const slice = result.schedule.slice(y * 12, (y + 1) * 12);
        return {
          year: `Yr ${y + 1}`,
          Principal: +slice.reduce((s, m) => s + m.principal, 0).toFixed(0),
          Interest:  +slice.reduce((s, m) => s + m.interest, 0).toFixed(0),
          Balance:   +slice[slice.length - 1]?.balance?.toFixed(0) || 0,
        };
      })
    : [];

  return (
    <div className="loan-section">
      {/* Section header */}
      <div className="loan-sec-header">
        <div className="loan-sec-icon violet"><Calculator size={20} /></div>
        <div>
          <h2 className="loan-sec-title">EMI Sandbox</h2>
          <p className="loan-sec-sub">Server-computed EMI engine · Pre-payment accelerator · Live DTI check</p>
        </div>
      </div>

      <div className="emi-grid">
        {/* ── Left: Controls ────────────────────────────────────────────── */}
        <div className="emi-controls glass-card">

          {/* Principal */}
          <div className="slider-group">
            <div className="slider-label-row">
              <span>Loan Amount</span>
              <span className="slider-value">{fmtK(principal)}</span>
            </div>
            <input type="range" min={50000} max={10000000} step={50000}
              value={principal} onChange={e => setPrincipal(+e.target.value)}
              className="loan-slider violet-slider" />
            <div className="slider-ticks"><span>₹50K</span><span>₹1Cr</span></div>
          </div>

          {/* Interest Rate */}
          <div className="slider-group">
            <div className="slider-label-row">
              <span>Annual Interest Rate</span>
              <span className="slider-value">{annualRate}%</span>
            </div>
            <input type="range" min={4} max={36} step={0.1}
              value={annualRate} onChange={e => setAnnualRate(+e.target.value)}
              className="loan-slider" />
            <div className="slider-ticks"><span>4%</span><span>36%</span></div>
          </div>

          {/* Tenure */}
          <div className="slider-group">
            <div className="slider-label-row">
              <span>Loan Tenure</span>
              <span className="slider-value">{tenureYears} Yr</span>
            </div>
            <input type="range" min={1} max={30} step={1}
              value={tenureYears} onChange={e => setTenureYears(+e.target.value)}
              className="loan-slider green-slider" />
            <div className="slider-ticks"><span>1 Yr</span><span>30 Yr</span></div>
          </div>

          {/* Pre-Payment Hyper-Drive toggle */}
          <div className="extra-toggle-bar" onClick={() => setShowExtra(v => !v)}>
            <div className="extra-toggle-left">
              <Zap size={14} className="text-amber" />
              <span>Pre-Payment Hyper-Drive</span>
            </div>
            {showExtra
              ? <ToggleRight size={20} className="text-accent" />
              : <ToggleLeft size={20} className="text-muted" />
            }
          </div>

          <AnimatePresence>
            {showExtra && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ overflow: 'hidden' }}
              >
                <div className="slider-group" style={{ marginTop: 12 }}>
                  <div className="slider-label-row">
                    <span>Extra Monthly Payment</span>
                    <span className="slider-value amber">{fmtK(extraMonthly)}</span>
                  </div>
                  <input type="range" min={0} max={50000} step={500}
                    value={extraMonthly} onChange={e => setExtraMonthly(+e.target.value)}
                    className="loan-slider amber-slider" />
                  <div className="slider-ticks"><span>₹0</span><span>₹50K</span></div>
                </div>

                {/* Pre-payment result card */}
                {result?.extraResult && (
                  <motion.div
                    className="prepay-card"
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="prepay-stat">
                      <Clock size={14} />
                      <span>Finish <strong>{result.extraResult.yearsSaved} years early</strong></span>
                    </div>
                    <div className="prepay-stat green">
                      <Shield size={14} />
                      <span>Save <strong>{fmt(result.extraResult.interestSaved)}</strong> in interest</span>
                    </div>
                    <div className="prepay-stat amber">
                      <Target size={14} />
                      <span>New tenure: <strong>{result.extraResult.newTenureMonths} months</strong></span>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* DTI Check */}
          {result && (
            <div className={`dti-card dti-${dtiStatus}`}>
              <div className="dti-header">
                {dtiStatus === 'safe'
                  ? <Check size={14} />
                  : dtiStatus === 'caution'
                  ? <Info size={14} />
                  : <AlertTriangle size={14} />}
                <span>DTI Check: <strong>{dtiPct}%</strong></span>
                <span className="dti-badge">{dtiStatus.toUpperCase()}</span>
              </div>
              <p className="dti-desc">
                {dtiStatus === 'safe'
                  ? `This EMI uses ${dtiPct}% of your ₹${fmtK(monthlyIncome)} take-home. You're in the safe zone (under 20%).`
                  : dtiStatus === 'caution'
                  ? `This EMI consumes ${dtiPct}% of your income. Manageable, but leaves limited buffer for savings.`
                  : `At ${dtiPct}% of income, this loan is risky. Most banks reject DTI above 40%. Consider reducing the loan.`}
              </p>
              <div className="dti-bar-track">
                <div className="dti-bar-fill" style={{ width: `${Math.min(dtiPct, 100)}%` }} />
                <div className="dti-bar-safe-mark" />
              </div>
            </div>
          )}
        </div>

        {/* ── Right: Results ────────────────────────────────────────────── */}
        <div className="emi-results">
          {/* KPI strip */}
          {result && (
            <div className="emi-kpis">
              <div className="emi-kpi glass-card">
                <p className="emi-kpi-label">Monthly EMI</p>
                <p className="emi-kpi-value violet">{fmt(result.emi)}</p>
              </div>
              <div className="emi-kpi glass-card">
                <p className="emi-kpi-label">Total Interest</p>
                <p className="emi-kpi-value red">{fmt(result.totalInterest)}</p>
              </div>
              <div className="emi-kpi glass-card">
                <p className="emi-kpi-label">Total Payable</p>
                <p className="emi-kpi-value">{fmt(result.totalPayable)}</p>
              </div>
            </div>
          )}

          {/* Donut chart */}
          {result && (
            <div className="emi-donut glass-card">
              <h3 className="loan-card-title">Principal vs Interest</h3>
              <div className="donut-wrap">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%" cy="50%"
                      innerRadius={68} outerRadius={96}
                      paddingAngle={2}
                      dataKey="value"
                      animationBegin={0}
                      animationDuration={800}
                    >
                      {donutData.map((d, i) => (
                        <Cell key={i} fill={d.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => fmt(v)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="donut-legend">
                  {donutData.map(d => (
                    <div key={d.name} className="donut-leg-item">
                      <span className="donut-dot" style={{ background: d.color }} />
                      <span>{d.name}</span>
                      <span className="donut-leg-val">{fmt(d.value)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Lifestyle toggle */}
              <div className="lifestyle-toggle" onClick={() => setShowLifestyle(v => !v)}>
                <span>🤔 What does this interest actually cost?</span>
                {showLifestyle ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </div>
              <AnimatePresence>
                {showLifestyle && result && (
                  <motion.div
                    className="lifestyle-grid"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{ overflow: 'hidden' }}
                  >
                    {LIFESTYLE.map(l => (
                      <div key={l.label} className="lifestyle-item">
                        <span className="lifestyle-emoji">{l.icon}</span>
                        <span className="lifestyle-count">
                          {(result.totalInterest / l.unit).toFixed(1)}×
                        </span>
                        <span className="lifestyle-label">{l.label}</span>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Amortization chart */}
          {amortData.length > 0 && (
            <div className="glass-card emi-amort">
              <h3 className="loan-card-title">Yearly Amortization Breakdown</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={amortData} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="year" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} tickFormatter={v => fmtK(v)} width={52} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Principal" fill="#6C3BEE" radius={[3,3,0,0]} />
                  <Bar dataKey="Interest"  fill="#EF4444" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 2 — LOAN PORTFOLIO DEEP-DIVE
// ═══════════════════════════════════════════════════════════════════════════════

function AmortScrubChart({ loan, scrubMonth }) {
  const P = loan.outstanding;
  const R = loan.annualRate / 100 / 12;
  const N = loan.tenureMonths - loan.completedMonths;

  // Compute balance at scrubMonth
  const monthsElapsed = Math.min(scrubMonth, N);
  let principalPaid = 0;
  let interestPaid  = 0;
  let balance       = P;
  const emi = R === 0 ? P / N : (P * R * Math.pow(1+R, N)) / (Math.pow(1+R, N) - 1);

  for (let i = 0; i < monthsElapsed; i++) {
    const int = balance * R;
    const pri = emi - int;
    interestPaid  += int;
    principalPaid += pri;
    balance       -= pri;
  }
  balance = Math.max(balance, 0);

  const data = [
    { name: 'Paid Principal', value: +principalPaid.toFixed(0), color: '#10B981' },
    { name: 'Paid Interest',  value: +interestPaid.toFixed(0),  color: '#EF4444' },
    { name: 'Remaining',      value: +balance.toFixed(0),       color: '#374151' },
  ];

  return (
    <ResponsiveContainer width="100%" height={160}>
      <PieChart>
        <Pie
          data={data} cx="50%" cy="50%"
          innerRadius={50} outerRadius={72}
          paddingAngle={2} dataKey="value"
          animationBegin={0} animationDuration={400}
        >
          {data.map((d, i) => <Cell key={i} fill={d.color} />)}
        </Pie>
        <Tooltip formatter={(v) => fmt(v)} />
      </PieChart>
    </ResponsiveContainer>
  );
}

const LOAN_ICONS = { education: <GraduationCap size={18} />, credit_card: <CreditCard size={18} />, car: <Car size={18} />, home: <Home size={18} /> };

function LoanCard({ loan, isSnowballTarget, onFinAgent }) {
  const [expanded,   setExpanded]   = useState(false);
  const [scrubMonth, setScrubMonth] = useState(0);
  const remaining = loan.tenureMonths - loan.completedMonths;

  return (
    <motion.div
      className={`loan-card glass-card ${loan.flagged ? 'flagged' : ''} ${isSnowballTarget ? 'snowball-target' : ''}`}
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* Loan top strip */}
      <div className="loan-card-top" onClick={() => setExpanded(v => !v)}>
        <div className="loan-card-icon" style={{ background: loan.color + '22', border: `1px solid ${loan.color}44` }}>
          <span style={{ color: loan.color }}>{LOAN_ICONS[loan.type] || '💰'}</span>
        </div>
        <div className="loan-card-meta">
          <div className="loan-card-name-row">
            <span className="loan-card-name">{loan.emoji} {loan.name}</span>
            {isSnowballTarget && <span className="snowball-badge">🎯 Snowball Target</span>}
            {loan.overpaying && <span className="refin-badge">💡 Refinance Alert</span>}
          </div>
          <span className="loan-card-lender">{loan.lender}</span>
        </div>
        <div className="loan-card-stats">
          <div className="loan-stat">
            <span className="loan-stat-label">Outstanding</span>
            <span className="loan-stat-val">{fmt(loan.outstanding)}</span>
          </div>
          <div className="loan-stat">
            <span className="loan-stat-label">Rate</span>
            <span className={`loan-stat-val ${loan.annualRate > 20 ? 'red' : loan.annualRate > 10 ? 'amber' : 'green'}`}>
              {loan.annualRate}%
            </span>
          </div>
          <div className="loan-stat">
            <span className="loan-stat-label">EMI</span>
            <span className="loan-stat-val">{fmt(loan.emiAmount)}</span>
          </div>
        </div>
        <div className="loan-expand-btn">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>

      {/* Progress bar */}
      <div className="loan-progress-track">
        <div className="loan-progress-fill" style={{ width: `${loan.debtProgress}%`, background: loan.color }} />
      </div>
      <div className="loan-progress-row">
        <span>{loan.debtProgress}% paid off</span>
        <span>{loan.completedMonths}/{loan.tenureMonths} months</span>
      </div>

      {/* Expanded detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            className="loan-detail"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden' }}
          >
            {/* Amortization Scrub Bar */}
            <div className="scrub-section">
              <h4 className="scrub-title">⏱ Amortization Scrubber</h4>
              <p className="scrub-sub">Drag to see how your debt composition changes over time</p>
              <div className="scrub-bar-row">
                <span className="scrub-month-label">Month {scrubMonth}</span>
                <input
                  type="range" min={0} max={remaining} step={1}
                  value={scrubMonth}
                  onChange={e => setScrubMonth(+e.target.value)}
                  className="loan-slider violet-slider"
                  style={{ flex: 1 }}
                />
                <span className="scrub-month-label">Month {remaining}</span>
              </div>
              <div className="scrub-chart-row">
                <AmortScrubChart loan={loan} scrubMonth={scrubMonth} />
                <div className="scrub-legend">
                  <div className="scrub-leg-item green"><span className="scrub-dot" style={{ background: '#10B981' }} />Paid Principal</div>
                  <div className="scrub-leg-item red"><span className="scrub-dot" style={{ background: '#EF4444' }} />Paid Interest</div>
                  <div className="scrub-leg-item muted"><span className="scrub-dot" style={{ background: '#374151' }} />Remaining</div>
                  <p className="scrub-tip">
                    {scrubMonth < remaining * 0.3
                      ? '🔴 Early phase: most of your payment is interest!'
                      : scrubMonth < remaining * 0.7
                      ? '🟡 Mid-phase: interest is reducing.'
                      : '🟢 Late phase: most payments are pure principal!'}
                  </p>
                </div>
              </div>
            </div>

            {/* Refinance alert */}
            {loan.overpaying && (
              <motion.div
                className="refin-alert"
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
              >
                <AlertTriangle size={16} />
                <div>
                  <p><strong>Refinance Opportunity Detected</strong></p>
                  <p>Current rate: <strong>{loan.annualRate}%</strong> · Market rate: <strong>{loan.marketRate}%</strong></p>
                  <p>Switching today could save you <strong className="green">{fmt(loan.refinanceSavings)}</strong> over the remaining tenure.</p>
                </div>
              </motion.div>
            )}

            {/* AI Negotiation Script */}
            <button className="ai-neg-btn" onClick={() => onFinAgent(loan)}>
              <Brain size={14} />
              Generate AI Negotiation Email for Rate Reduction
              <ArrowRight size={13} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function LoanPortfolio({ cashflow }) {
  const [portfolio,         setPortfolio]         = useState(null);
  const [loading,           setLoading]           = useState(true);
  const [showSnowball,      setShowSnowball]       = useState(false);
  const [aiPrompt,          setAiPrompt]           = useState('');
  const [showAiModal,       setShowAiModal]        = useState(false);
  const [aiLoading,         setAiLoading]          = useState(false);
  const [aiScript,          setAiScript]           = useState('');

  useEffect(() => {
    async function load() {
      try {
        const r = await fetch(`${API_BASE}/loans/portfolio`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        const d = await r.json();
        setPortfolio(d);
      } catch { /* ignore */ } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function triggerAINegotiation(loan) {
    setShowAiModal(true);
    setAiScript('');
    setAiLoading(true);
    const prompt = `You are FinAgent. Generate a highly professional email from a bank customer to their bank manager requesting an interest rate reduction on their ${loan.name} (current rate: ${loan.annualRate}%, market rate: ${loan.marketRate}%). The customer has a flawless on-time payment history. The loan outstanding is ${fmt(loan.outstanding)}. Reference their good credit behaviour and provide compelling financial arguments. Format it as a formal letter.`;
    setAiPrompt(prompt);

    try {
      const r = await fetch(`${API_BASE}/finagent/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ message: prompt, mode: 'thinking' }),
      });
      const reader = r.body.getReader();
      const decoder = new TextDecoder();
      let buf = '', script = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop();
        for (const line of lines) {
          const t = line.trim();
          if (!t.startsWith('data: ')) continue;
          const raw = t.slice(6);
          if (raw === '[DONE]') continue;
          try {
            const p = JSON.parse(raw);
            if (p.content) { script += p.content; setAiScript(script); }
          } catch {}
        }
      }
    } catch { /* ignore */ } finally { setAiLoading(false); }
  }

  if (loading || !portfolio) {
    return (
      <div className="loan-section">
        <div className="loan-loading"><RefreshCw size={24} className="spin" /> Loading portfolio...</div>
      </div>
    );
  }

  const { loans, sortedByRate, summary } = portfolio;
  const displayLoans = showSnowball
    ? sortedByRate.map(id => loans.find(l => l.id === id))
    : loans;
  const snowballTarget = sortedByRate[0];

  return (
    <div className="loan-section">
      {/* Section header */}
      <div className="loan-sec-header">
        <div className="loan-sec-icon red"><TrendingDown size={20} /></div>
        <div>
          <h2 className="loan-sec-title">Loan Portfolio</h2>
          <p className="loan-sec-sub">Debt Snowball engine · Amortization scrubber · Refinance scanner · AI negotiation</p>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="port-kpis">
        {[
          { label: 'Total Outstanding', value: fmt(summary.totalOutstanding), color: 'red' },
          { label: 'Monthly EMI Drain', value: fmt(summary.totalEMI), color: 'amber' },
          { label: 'Avg Interest Rate', value: `${summary.avgRate}%`, color: 'violet' },
          { label: 'Active Loans', value: summary.loanCount, color: 'green' },
        ].map(k => (
          <div key={k.label} className="port-kpi glass-card">
            <p className="port-kpi-label">{k.label}</p>
            <p className={`port-kpi-val ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Snowball toggle */}
      <div className="snowball-bar">
        <div className="snowball-info">
          <Target size={16} className="text-amber" />
          <div>
            <p className="snowball-title">Debt Snowball Auto-Router</p>
            <p className="snowball-sub">Re-orders your loans by highest rate first. Attack the most expensive debt first.</p>
          </div>
        </div>
        <div className="snowball-actions">
          <button
            className={`snowball-toggle-btn ${showSnowball ? 'active' : ''}`}
            onClick={() => setShowSnowball(v => !v)}
          >
            {showSnowball ? <><ToggleRight size={16} />Snowball ON</> : <><ToggleLeft size={16} />Snowball OFF</>}
          </button>
        </div>
      </div>

      {/* Loan cards */}
      <div className="loan-list">
        {displayLoans.map(loan => (
          <LoanCard
            key={loan.id}
            loan={loan}
            isSnowballTarget={showSnowball && loan.id === snowballTarget}
            onFinAgent={triggerAINegotiation}
          />
        ))}
      </div>

      {/* AI Negotiation Modal */}
      <AnimatePresence>
        {showAiModal && (
          <motion.div className="ai-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div
              className="ai-modal glass-card"
              initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 20 }}
            >
              <div className="ai-modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Brain size={18} className="text-accent" />
                  <span>AI Negotiation Script</span>
                </div>
                <button className="ai-modal-close" onClick={() => setShowAiModal(false)}>×</button>
              </div>
              <div className="ai-modal-body">
                {aiLoading && !aiScript && <div className="ai-modal-loading"><RefreshCw size={18} className="spin" /> Generating your negotiation email...</div>}
                {aiScript && (
                  <>
                    <div className="ai-script-text" dangerouslySetInnerHTML={{ __html: aiScript.replace(/\n/g, '<br/>').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') }} />
                    <button className="copy-script-btn" onClick={() => navigator.clipboard.writeText(aiScript)}>
                      <Check size={13} /> Copy to Clipboard
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FEATURE 3 — BNPL MICRO-DEBT DETONATOR
// ═══════════════════════════════════════════════════════════════════════════════

function BNPLDebtCard({ debt, onDetonate }) {
  const urgency = new Date(debt.dueDate) < new Date(Date.now() + 7 * 86400000);
  const overdue  = new Date(debt.dueDate) < new Date();

  return (
    <motion.div
      className={`bnpl-card glass-card ${overdue ? 'bnpl-overdue' : urgency ? 'bnpl-urgent' : ''}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, boxShadow: `0 8px 32px ${debt.color}22` }}
    >
      <div className="bnpl-card-top">
        <div className="bnpl-logo" style={{ background: debt.color + '22', border: `1px solid ${debt.color}44` }}>
          <span style={{ fontSize: 20 }}>{debt.logo}</span>
        </div>
        <div className="bnpl-meta">
          <div className="bnpl-name-row">
            <span className="bnpl-provider">{debt.provider}</span>
            {overdue  && <span className="bnpl-status-badge overdue">OVERDUE</span>}
            {urgency && !overdue && <span className="bnpl-status-badge urgent">DUE SOON</span>}
          </div>
          <span className="bnpl-category">{debt.category}</span>
        </div>
        <div className="bnpl-amounts">
          <span className="bnpl-outstanding">{fmt(debt.outstanding)}</span>
          <span className="bnpl-interest-badge" style={{ color: debt.implicitAnnualRate > 30 ? '#EF4444' : '#F59E0B' }}>
            {debt.implicitAnnualRate}% p.a.
          </span>
        </div>
      </div>
      <div className="bnpl-card-bottom">
        <div className="bnpl-detail">
          <span>Last: {debt.lastTransaction.merchant} ({fmt(debt.lastTransaction.amount)})</span>
          <span>Due: {new Date(debt.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
          <span>Late fee: {fmt(debt.lateFeePerMonth)}/mo</span>
        </div>
      </div>
    </motion.div>
  );
}

function BNPLDetonator({ cashflow }) {
  const [data,           setData]           = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [selectedOffer,  setSelectedOffer]  = useState(null);
  const [rescueState,    setRescueState]    = useState('idle'); // idle | confirming | executing | done
  const [rescueResult,   setRescueResult]   = useState(null);
  const [showFinAgent,   setShowFinAgent]   = useState(false);
  const [aiLockText,     setAiLockText]     = useState('');
  const [aiLoading,      setAiLoading]      = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/loans/bnpl`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then(r => r.json())
      .then(d => { setData(d); if (d.rescueOffers?.length) setSelectedOffer(d.rescueOffers[0].id); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function executeRescue() {
    if (!selectedOffer) return;
    setRescueState('executing');
    try {
      const r = await fetch(`${API_BASE}/loans/bnpl/rescue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ offerId: selectedOffer }),
      });
      const d = await r.json();
      setRescueResult(d);
      setRescueState('done');
    } catch { setRescueState('idle'); }
  }

  async function activateFinAgentLock(prompt) {
    setShowFinAgent(true);
    setAiLoading(true);
    setAiLockText('');
    try {
      const r = await fetch(`${API_BASE}/finagent/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ message: prompt, mode: 'thinking' }),
      });
      const reader = r.body.getReader();
      const decoder = new TextDecoder();
      let buf = '', out = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop();
        for (const line of lines) {
          const t = line.trim();
          if (!t.startsWith('data: ')) continue;
          const raw = t.slice(6);
          if (raw === '[DONE]') continue;
          try { const p = JSON.parse(raw); if (p.content) { out += p.content; setAiLockText(out); } } catch {}
        }
      }
    } catch {} finally { setAiLoading(false); }
  }

  if (loading) return <div className="loan-section"><div className="loan-loading"><RefreshCw size={24} className="spin" /> Scanning BNPL accounts...</div></div>;
  if (!data)   return null;

  const { debts, summary, rescueOffers } = data;
  const bestOffer = rescueOffers.find(o => o.id === selectedOffer);

  // Blended rate donut
  const rateDonut = debts.slice(0, 4).map(d => ({
    name: d.provider,
    value: d.outstanding,
    color: d.color,
  }));

  return (
    <div className="loan-section">
      {/* Header */}
      <div className="loan-sec-header">
        <div className="loan-sec-icon" style={{ background: 'linear-gradient(135deg, #EF4444, #dc2626)' }}>
          <Bomb size={20} />
        </div>
        <div>
          <h2 className="loan-sec-title">Micro-Debt Detonator</h2>
          <p className="loan-sec-sub">BNPL aggregator · Blended interest exposure · One-tap rescue arbitrage · FinAgent behavioral lock</p>
        </div>
      </div>

      {/* Crisis KPIs */}
      <div className="bnpl-kpis">
        <div className="bnpl-kpi glass-card crisis">
          <p className="bnpl-kpi-label">Total BNPL Debt</p>
          <p className="bnpl-kpi-val red">{fmt(summary.totalOutstanding)}</p>
        </div>
        <div className="bnpl-kpi glass-card">
          <p className="bnpl-kpi-label">Blended Interest Rate</p>
          <p className="bnpl-kpi-val amber">{summary.blendedRate}%</p>
          <p className="bnpl-kpi-sub">Weighted avg across all BNPL</p>
        </div>
        <div className="bnpl-kpi glass-card">
          <p className="bnpl-kpi-label">Annual Cost of BNPL</p>
          <p className="bnpl-kpi-val red">{fmt(summary.annualBNPLCost)}</p>
          <p className="bnpl-kpi-sub">{fmt(summary.monthlyBNPLCost)}/month in hidden costs</p>
        </div>
        <div className="bnpl-kpi glass-card">
          <p className="bnpl-kpi-label">Active BNPL Apps</p>
          <p className="bnpl-kpi-val violet">{summary.debtCount}</p>
          {summary.overdueCount > 0 && <p className="bnpl-kpi-overdue">{summary.overdueCount} OVERDUE ⚠️</p>}
        </div>
      </div>

      {/* Alert banner */}
      <motion.div
        className="bnpl-alert-banner"
        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
      >
        <AlertTriangle size={16} />
        <p>
          You are paying a blended <strong>{summary.blendedRate}% annual interest</strong> — equivalent to a credit card — across {summary.debtCount} fragmented apps.
          A single personal loan at ~11% would save you <strong>{fmt(bestOffer?.annualSavings || 0)}</strong> every year.
        </p>
      </motion.div>

      <div className="bnpl-main-grid">
        {/* Left: debt list */}
        <div className="bnpl-debt-list">
          <h3 className="bnpl-section-label">📊 Your BNPL Exposure (sorted by urgency)</h3>
          {debts.map(d => <BNPLDebtCard key={d.id} debt={d} />)}
        </div>

        {/* Right: rescue panel */}
        <div className="bnpl-rescue-panel">
          {/* Donut chart */}
          <div className="glass-card bnpl-donut-card">
            <h3 className="loan-card-title">Debt Distribution</h3>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={rateDonut} cx="50%" cy="50%" innerRadius={55} outerRadius={78} paddingAngle={3} dataKey="value" animationBegin={0}>
                  {rateDonut.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip formatter={v => fmt(v)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="bnpl-donut-legend">
              {rateDonut.map(d => (
                <div key={d.name} className="donut-leg-item" style={{ fontSize: 11 }}>
                  <span className="donut-dot" style={{ background: d.color }} />
                  <span>{d.name}</span>
                  <span className="donut-leg-val">{fmt(d.value)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Rescue Offers */}
          {rescueState === 'idle' || rescueState === 'confirming' ? (
            <div className="glass-card bnpl-rescue-card">
              <div className="rescue-header">
                <Zap size={16} className="text-amber" />
                <h3>One-Tap Rescue</h3>
              </div>
              <p className="rescue-sub">Select a partner bank loan to instantly wipe out all {summary.debtCount} BNPL debts</p>

              <div className="rescue-offers">
                {rescueOffers.map(offer => (
                  <motion.div
                    key={offer.id}
                    className={`rescue-offer ${selectedOffer === offer.id ? 'selected' : ''} ${offer.highlighted ? 'highlighted' : ''}`}
                    onClick={() => setSelectedOffer(offer.id)}
                    whileHover={{ scale: 1.02 }}
                  >
                    {offer.highlighted && <span className="rescue-best-tag">⭐ Best Deal</span>}
                    <div className="rescue-offer-top">
                      <span className="rescue-bank">{offer.logo} {offer.bank}</span>
                      <span className="rescue-rate">{offer.annualRate}%</span>
                    </div>
                    <div className="rescue-offer-stats">
                      <span>EMI: <strong>{fmt(offer.rescueEMI)}/mo</strong></span>
                      <span>Save: <strong className="green">{fmt(offer.annualSavings)}/yr</strong></span>
                      <span>⚡ {offer.disbursalTime}</span>
                    </div>
                    {selectedOffer === offer.id && <div className="rescue-check"><Check size={12} /></div>}
                  </motion.div>
                ))}
              </div>

              {rescueState === 'confirming' ? (
                <div className="rescue-confirm-row">
                  <p className="rescue-confirm-text">⚠️ Confirm: Consolidate <strong>{fmt(summary.totalOutstanding)}</strong> into one loan at <strong>{bestOffer?.annualRate}%</strong>?</p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="rescue-cancel-btn" onClick={() => setRescueState('idle')}>Cancel</button>
                    <button className="rescue-execute-btn" onClick={executeRescue}>
                      <Bomb size={14} /> Detonate Debt
                    </button>
                  </div>
                </div>
              ) : (
                <motion.button
                  className="rescue-trigger-btn"
                  onClick={() => setRescueState('confirming')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Zap size={16} />
                  Take {bestOffer?.annualRate}% Loan · Wipe {summary.debtCount} BNPL Debts · Save {fmt(bestOffer?.annualSavings || 0)}/yr
                </motion.button>
              )}
            </div>
          ) : rescueState === 'executing' ? (
            <div className="glass-card rescue-executing">
              <RefreshCw size={28} className="spin" style={{ color: '#6C3BEE' }} />
              <p>Executing debt consolidation...</p>
            </div>
          ) : (
            /* DONE STATE */
            <AnimatePresence>
              <motion.div
                className="glass-card rescue-done"
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              >
                <div className="rescue-done-icon">💥</div>
                <h3 className="rescue-done-title">BNPL Debts Detonated!</h3>
                <p className="rescue-done-msg">{rescueResult?.message}</p>
                <div className="rescue-done-stats">
                  <div><span>New single EMI</span><strong>{fmt(rescueResult?.savings?.rescueEMI)}/mo</strong></div>
                  <div><span>Annual savings</span><strong className="green">{fmt(rescueResult?.savings?.annualSavings)}</strong></div>
                </div>

                {!showFinAgent ? (
                  <motion.button
                    className="finagent-lock-btn"
                    onClick={() => activateFinAgentLock(rescueResult.finagentPrompt)}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Lock size={14} />
                    Activate FinAgent Behavioral Lock
                  </motion.button>
                ) : (
                  <div className="finagent-lock-response">
                    <div className="finagent-lock-header">
                      <Brain size={14} className="text-accent" />
                      <span>FinAgent Behavioral Analysis</span>
                      {aiLoading && <RefreshCw size={12} className="spin" />}
                    </div>
                    {aiLockText && (
                      <div className="finagent-lock-text" dangerouslySetInnerHTML={{
                        __html: aiLockText.replace(/\n/g, '<br/>').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                      }} />
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FEATURE 4 — MORTGAGE HORIZON (RENT vs BUY ENGINE)
// ═══════════════════════════════════════════════════════════════════════════════

function PropertyCard({ prop, isAffordable }) {
  return (
    <motion.div
      className={`prop-card glass-card ${isAffordable ? 'prop-affordable' : 'prop-stretch'}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4, boxShadow: `0 16px 40px ${prop.color}22` }}
    >
      {prop.tag && (
        <div className="prop-tag" style={{ background: prop.color + '22', color: prop.color, border: `1px solid ${prop.color}44` }}>
          {prop.tag}
        </div>
      )}
      <div className="prop-emoji">{prop.emoji}</div>
      <div className="prop-location">
        <MapPin size={12} />
        {prop.location}
      </div>
      <div className="prop-type">{prop.type}</div>
      <div className="prop-price">{fmtK(prop.price)}</div>
      <div className="prop-meta">
        <span>📈 {prop.appreciationRate}% appreciation</span>
        <span>🏠 Rent: {fmtK(prop.avgRent)}/mo</span>
      </div>
      <div className="prop-amenities">
        {prop.amenities.map(a => <span key={a} className="prop-amenity">{a}</span>)}
      </div>
      {!isAffordable && <div className="prop-stretch-badge">Stretch Zone</div>}
    </motion.div>
  );
}

function MortgageHorizon({ cashflow }) {
  const [lifestyle,      setLifestyle]      = useState(null);
  const [income,         setIncome]         = useState(95000);
  const [varExpenses,    setVarExpenses]    = useState({});
  const [annualRate,     setAnnualRate]     = useState(8.5);
  const [tenureYears,    setTenureYears]    = useState(20);
  const [currentRent,    setCurrentRent]    = useState(22000);
  const [affordResult,   setAffordResult]   = useState(null);
  const [properties,     setProperties]     = useState([]);
  const [chartData,      setChartData]      = useState([]);
  const [crossoverYear,  setCrossoverYear]  = useState(null);
  const [selectedProp,   setSelectedProp]   = useState(null);
  const [aiAnalysis,     setAiAnalysis]     = useState('');
  const [aiLoading,      setAiLoading]      = useState(false);
  const [step,           setStep]           = useState(1); // 1=lifestyle, 2=results, 3=properties, 4=crossover
  const [loading,        setLoading]        = useState(true);
  const debounceRef = useRef(null);

  // Load lifestyle seed data
  useEffect(() => {
    fetch(`${API_BASE}/loans/lifestyle`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then(r => r.json())
      .then(d => {
        setLifestyle(d);
        setIncome(d.monthlyIncome);
        const init = {};
        d.variableExpenses.forEach(e => { init[e.category] = e.amount; });
        setVarExpenses(init);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const fixedTotal = lifestyle?.fixedOverheads?.reduce((s, e) => s + e.amount, 0) || 0;
  const varTotal   = Object.values(varExpenses).reduce((s, v) => s + v, 0);

  const computeAffordability = useCallback(async () => {
    if (!income) return;
    try {
      const r = await fetch(`${API_BASE}/loans/mortgage/affordability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ monthlyIncome: income, lockedExpenses: fixedTotal, lifestyleExpenses: varTotal, annualRate, tenureYears }),
      });
      const d = await r.json();
      setAffordResult(d);

      // Fetch matching properties
      const pr = await fetch(`${API_BASE}/loans/mortgage/properties?maxBudget=${d.maxPropertyValue}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const pd = await pr.json();
      setProperties(pd.properties || []);
    } catch {}
  }, [income, fixedTotal, varTotal, annualRate, tenureYears]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(computeAffordability, 500);
    return () => clearTimeout(debounceRef.current);
  }, [computeAffordability]);

  async function loadCrossover(propValue) {
    try {
      const r = await fetch(`${API_BASE}/loans/mortgage/rentvsbuychart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ currentRent, propertyValue: propValue, loanRate: annualRate, tenureYears, years: 15 }),
      });
      const d = await r.json();
      setChartData(d.data || []);
      setCrossoverYear(d.crossoverYear);
      setStep(4);
    } catch {}
  }

  async function runAIAnalysis(prop) {
    setAiLoading(true);
    setAiAnalysis('');
    const prompt = `You are FinAgent analyzing a rent vs. buy decision. The user pays ₹${currentRent.toLocaleString('en-IN')} rent/month. They can afford a property up to ₹${fmtK(affordResult?.maxPropertyValue)} with a max EMI of ₹${fmtK(affordResult?.safeEMI)}/month at ${annualRate}% for ${tenureYears} years. The property being considered is "${prop.type} in ${prop.location}" valued at ₹${fmtK(prop.price)} with ${prop.appreciationRate}% annual appreciation. Their DTI will be ${affordResult?.dtiPct}%. Provide a punchy, data-driven rent vs. buy verdict. Should they buy now or wait? What is the optimal strategy? Keep it concise and impact-ful.`;

    try {
      const r = await fetch(`${API_BASE}/finagent/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ message: prompt, mode: 'fast' }),
      });
      const reader = r.body.getReader();
      const decoder = new TextDecoder();
      let buf = '', out = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop();
        for (const line of lines) {
          const t = line.trim();
          if (!t.startsWith('data: ')) continue;
          const raw = t.slice(6);
          if (raw === '[DONE]') continue;
          try { const p = JSON.parse(raw); if (p.content) { out += p.content; setAiAnalysis(out); } } catch {}
        }
      }
    } catch {} finally { setAiLoading(false); }
  }

  if (loading) return <div className="loan-section"><div className="loan-loading"><RefreshCw size={24} className="spin" /> Loading your financial profile...</div></div>;

  return (
    <div className="loan-section">
      {/* Header */}
      <div className="loan-sec-header">
        <div className="loan-sec-icon" style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
          <Building2 size={20} />
        </div>
        <div>
          <h2 className="loan-sec-title">Mortgage Horizon</h2>
          <p className="loan-sec-sub">Lifestyle-first affordability · Geo-targeted properties · Live Rent vs Buy crossover · FinAgent AI verdict</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="mort-steps">
        {['Lifestyle', 'Affordability', 'Properties', 'Crossover'].map((s, i) => (
          <div key={s} className={`mort-step ${step > i ? 'done' : step === i + 1 ? 'active' : ''}`} onClick={() => i < step && setStep(i + 1)}>
            <div className="mort-step-dot">{step > i + 1 ? <Check size={11} /> : i + 1}</div>
            <span>{s}</span>
          </div>
        ))}
      </div>

      <div className="mort-layout">
        {/* LEFT: Inputs */}
        <div className="mort-inputs glass-card">
          <h3 className="mort-input-title">
            <Wallet size={15} /> Lifestyle Commitment
          </h3>
          <p className="mort-input-sub">Lock in your non-negotiables. The engine determines your true surplus.</p>

          {/* Income */}
          <div className="slider-group" style={{ marginBottom: 16 }}>
            <div className="slider-label-row">
              <span>Monthly Take-Home</span>
              <span className="slider-value" style={{ color: '#10B981' }}>{fmtK(income)}</span>
            </div>
            <input type="range" min={30000} max={500000} step={5000}
              value={income} onChange={e => setIncome(+e.target.value)}
              className="loan-slider green-slider" />
            <div className="slider-ticks"><span>₹30K</span><span>₹5L</span></div>
          </div>

          {/* Fixed overheads (locked) */}
          <div className="mort-expense-group">
            <p className="mort-expense-label"><Lock size={11} /> Fixed Overheads (Locked)</p>
            {lifestyle?.fixedOverheads?.map(e => (
              <div key={e.category} className="mort-expense-row locked">
                <span>{e.icon} {e.category}</span>
                <span className="mort-exp-val">{fmtK(e.amount)}</span>
              </div>
            ))}
          </div>

          {/* Variable expenses (editable sliders) */}
          <div className="mort-expense-group">
            <p className="mort-expense-label"><Unlock size={11} /> Lifestyle Spend (Adjustable)</p>
            {lifestyle?.variableExpenses?.map(e => (
              <div key={e.category} className="mort-var-row">
                <div className="mort-var-label-row">
                  <span>{e.icon} {e.category}</span>
                  <span className="mort-var-val">{fmtK(varExpenses[e.category] || 0)}</span>
                </div>
                <input type="range" min={0} max={e.amount * 2} step={500}
                  value={varExpenses[e.category] || 0}
                  onChange={ev => setVarExpenses(prev => ({ ...prev, [e.category]: +ev.target.value }))}
                  className="loan-slider violet-slider" style={{ marginTop: 4 }} />
              </div>
            ))}
          </div>

          {/* Loan params */}
          <div className="mort-divider" />
          <div className="slider-group">
            <div className="slider-label-row">
              <span>Home Loan Rate</span>
              <span className="slider-value">{annualRate}%</span>
            </div>
            <input type="range" min={6} max={14} step={0.1}
              value={annualRate} onChange={e => setAnnualRate(+e.target.value)}
              className="loan-slider amber-slider" />
          </div>
          <div className="slider-group">
            <div className="slider-label-row">
              <span>Loan Tenure</span>
              <span className="slider-value">{tenureYears} Yr</span>
            </div>
            <input type="range" min={5} max={30} step={1}
              value={tenureYears} onChange={e => setTenureYears(+e.target.value)}
              className="loan-slider green-slider" />
          </div>
          <div className="slider-group">
            <div className="slider-label-row">
              <span>Current Monthly Rent</span>
              <span className="slider-value" style={{ color: '#EF4444' }}>{fmtK(currentRent)}</span>
            </div>
            <input type="range" min={5000} max={100000} step={1000}
              value={currentRent} onChange={e => setCurrentRent(+e.target.value)}
              className="loan-slider red-slider" />
          </div>
        </div>

        {/* RIGHT: Results */}
        <div className="mort-results">
          {/* Affordability KPIs */}
          {affordResult && (
            <>
              <div className="mort-kpis">
                <div className="mort-kpi glass-card">
                  <p className="mort-kpi-label">True Surplus</p>
                  <p className="mort-kpi-val" style={{ color: affordResult.remainingCashflow > 20000 ? '#10B981' : '#F59E0B' }}>{fmt(affordResult.remainingCashflow)}</p>
                  <p className="mort-kpi-sub">after all expenses</p>
                </div>
                <div className="mort-kpi glass-card">
                  <p className="mort-kpi-label">Safe Max EMI</p>
                  <p className="mort-kpi-val violet">{fmt(affordResult.safeEMI)}</p>
                  <p className="mort-kpi-sub">DTI: {affordResult.dtiPct}%</p>
                </div>
                <div className="mort-kpi glass-card">
                  <p className="mort-kpi-label">Max Loan</p>
                  <p className="mort-kpi-val">{fmtK(affordResult.maxLoan)}</p>
                  <p className="mort-kpi-sub">at {annualRate}%, {tenureYears} yr</p>
                </div>
                <div className="mort-kpi glass-card gold">
                  <p className="mort-kpi-label">Max Property Value</p>
                  <p className="mort-kpi-val amber">{fmtK(affordResult.maxPropertyValue)}</p>
                  <p className="mort-kpi-sub">With 20% down: {fmtK(affordResult.downPayment)}</p>
                </div>
              </div>

              {/* Budget breakdown bar */}
              <div className="glass-card mort-breakdown">
                <h3 className="loan-card-title">Income Allocation Breakdown</h3>
                <div className="mort-alloc-bar">
                  <div className="mort-alloc-seg" style={{ width: `${(fixedTotal/income*100).toFixed(1)}%`, background: '#EF4444' }} title="Fixed" />
                  <div className="mort-alloc-seg" style={{ width: `${(varTotal/income*100).toFixed(1)}%`, background: '#F59E0B' }} title="Lifestyle" />
                  <div className="mort-alloc-seg" style={{ width: `${(affordResult.safeEMI/income*100).toFixed(1)}%`, background: '#6C3BEE' }} title="EMI" />
                  <div className="mort-alloc-seg" style={{ flex: 1, background: '#10B981' }} title="Buffer" />
                </div>
                <div className="mort-alloc-legend">
                  {[
                    { label: 'Fixed Overheads', color: '#EF4444', val: fmtK(fixedTotal) },
                    { label: 'Lifestyle', color: '#F59E0B', val: fmtK(varTotal) },
                    { label: 'Home EMI', color: '#6C3BEE', val: fmtK(affordResult.safeEMI) },
                    { label: 'Buffer', color: '#10B981', val: fmtK(Math.max(income - fixedTotal - varTotal - affordResult.safeEMI, 0)) },
                  ].map(l => (
                    <div key={l.label} className="mort-alloc-item">
                      <span className="donut-dot" style={{ background: l.color }} />
                      <span>{l.label}</span>
                      <span style={{ marginLeft: 'auto', fontWeight: 600 }}>{l.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* GEO PROPERTY CARDS */}
          {properties.length > 0 && (
            <div className="glass-card mort-properties">
              <h3 className="loan-card-title"><Navigation size={14} /> Neighborhoods You Can Buy In Right Now</h3>
              <p className="mort-prop-sub">Properties matched to your max budget of <strong>{fmtK(affordResult?.maxPropertyValue)}</strong></p>
              <div className="prop-grid">
                {properties.map(prop => (
                  <div key={prop.id} onClick={() => { setSelectedProp(prop); loadCrossover(prop.price); setStep(4); }}>
                    <PropertyCard prop={prop} isAffordable={prop.price <= affordResult?.maxPropertyValue} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* RENT VS BUY CROSSOVER CHART */}
          {chartData.length > 0 && (
            <div className="glass-card mort-crossover">
              <h3 className="loan-card-title">
                <TrendingUp size={15} style={{ color: '#10B981' }} /> Rent vs Buy Crossover
                {selectedProp && <span style={{ fontSize: 12, color: '#9ca3af', marginLeft: 8 }}>— {selectedProp.location}</span>}
              </h3>
              {crossoverYear && (
                <div className="crossover-badge">
                  <Target size={13} />
                  Buying becomes cheaper than renting in <strong>Year {crossoverYear} ({new Date().getFullYear() + crossoverYear})</strong>
                </div>
              )}
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="rentGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="buyGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="year" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} tickFormatter={v => fmtK(v)} width={58} />
                  <Tooltip formatter={v => fmt(v)} contentStyle={{ background: 'rgba(10,12,20,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="cumulativeRent" name="Cumulative Rent" stroke="#EF4444" fill="url(#rentGrad)" strokeWidth={2} />
                  <Area type="monotone" dataKey="netOwnership" name="Net Ownership Cost" stroke="#10B981" fill="url(#buyGrad)" strokeWidth={2} />
                  {crossoverYear && (
                    <ReferenceLine x={String(new Date().getFullYear() + crossoverYear)} stroke="#F59E0B" strokeDasharray="6 3" label={{ value: 'Crossover', fill: '#F59E0B', fontSize: 11 }} />
                  )}
                </AreaChart>
              </ResponsiveContainer>

              {/* FinAgent AI analysis */}
              {selectedProp && (
                !aiAnalysis ? (
                  <motion.button
                    className="ai-neg-btn" style={{ marginTop: 14 }}
                    onClick={() => runAIAnalysis(selectedProp)}
                    whileHover={{ scale: 1.02 }}
                  >
                    <Brain size={14} />
                    {aiLoading ? 'FinAgent is thinking...' : 'Get FinAgent Rent vs Buy Verdict'}
                    {aiLoading && <RefreshCw size={12} className="spin" />}
                  </motion.button>
                ) : (
                  <div className="mort-ai-verdict glass-card">
                    <div className="mort-ai-header">
                      <Brain size={14} className="text-accent" />
                      <span>FinAgent Verdict</span>
                      {aiLoading && <RefreshCw size={12} className="spin" />}
                    </div>
                    <div className="mort-ai-text" dangerouslySetInnerHTML={{
                      __html: aiAnalysis.replace(/\n/g, '<br/>').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                    }} />
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN LOANS PAGE
// ═══════════════════════════════════════════════════════════════════════════════
const TABS = [
  { id: 'emi',       label: 'EMI Sandbox',        icon: <Calculator size={15} /> },
  { id: 'portfolio', label: 'Loan Portfolio',     icon: <TrendingDown size={15} /> },
  { id: 'bnpl',      label: 'Debt Detonator',     icon: <Bomb size={15} /> },
  { id: 'mortgage',  label: 'Mortgage Horizon',   icon: <Building2 size={15} /> },
];

export default function LoansPage() {
  const [tab,       setTab]       = useState('emi');
  const [cashflow,  setCashflow]  = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/banking/cashflow?days=30`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then(r => r.json()).then(d => setCashflow(d)).catch(() => {});
  }, []);

  return (
    <div className="loans-root">
      <motion.div
        className="loans-header"
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
      >
        <div className="loans-header-left">
          <div className="loans-icon-wrap"><Percent size={20} /></div>
          <div>
            <h1 className="loans-title">Loan <span className="loans-title-accent">Intelligence</span></h1>
            <p className="loans-sub">EMI engine · Portfolio · BNPL Detonator · Mortgage Horizon</p>
          </div>
        </div>
        <div className="loans-tabs">
          {TABS.map(t => (
            <motion.button
              key={t.id}
              className={`loans-tab ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
            >
              {t.icon}{t.label}
            </motion.button>
          ))}
        </div>
      </motion.div>

      <div className="loans-content">
        <AnimatePresence mode="wait">
          {tab === 'emi' && (
            <motion.div key="emi" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.22 }}>
              <EMISandbox cashflow={cashflow} />
            </motion.div>
          )}
          {tab === 'portfolio' && (
            <motion.div key="port" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.22 }}>
              <LoanPortfolio cashflow={cashflow} />
            </motion.div>
          )}
          {tab === 'bnpl' && (
            <motion.div key="bnpl" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.22 }}>
              <BNPLDetonator cashflow={cashflow} />
            </motion.div>
          )}
          {tab === 'mortgage' && (
            <motion.div key="mort" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.22 }}>
              <MortgageHorizon cashflow={cashflow} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
