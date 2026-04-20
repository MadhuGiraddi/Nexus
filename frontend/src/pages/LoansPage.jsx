import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Legend,
  BarChart, Bar
} from 'recharts';
import {
  Calculator, TrendingDown, AlertTriangle, Zap, Brain,
  ChevronDown, ChevronUp, RefreshCw, Sparkles, Check,
  DollarSign, Calendar, Percent, Info, ArrowRight, Target,
  CreditCard, GraduationCap, Car, Home, ToggleLeft, ToggleRight,
  ExternalLink, Shield, Clock
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
// MAIN LOANS PAGE
// ═══════════════════════════════════════════════════════════════════════════════
const TABS = [
  { id: 'emi',       label: 'EMI Sandbox',     icon: <Calculator size={15} /> },
  { id: 'portfolio', label: 'Loan Portfolio',  icon: <TrendingDown size={15} /> },
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
      {/* Page header */}
      <motion.div
        className="loans-header"
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
      >
        <div className="loans-header-left">
          <div className="loans-icon-wrap">
            <Percent size={20} />
          </div>
          <div>
            <h1 className="loans-title">Loan <span className="loans-title-accent">Intelligence</span></h1>
            <p className="loans-sub">EMI engine · Portfolio management · AI-powered debt strategies</p>
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
              {t.icon}
              {t.label}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Content */}
      <div className="loans-content">
        <AnimatePresence mode="wait">
          {tab === 'emi' ? (
            <motion.div key="emi" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.25 }}>
              <EMISandbox cashflow={cashflow} />
            </motion.div>
          ) : (
            <motion.div key="port" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.25 }}>
              <LoanPortfolio cashflow={cashflow} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
