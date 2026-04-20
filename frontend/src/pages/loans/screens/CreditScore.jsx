import React, { useEffect, useState } from 'react';
import gsap from 'gsap';
import { motion } from 'framer-motion';
import { loansAPI } from '../../../services/api';
import { GlassCard, Badge, PrimaryButton } from '../components/UIElements';
import { Link } from 'react-router-dom';

function ArcGauge({ score }) {
  const pct    = (score - 300) / 550; // 0..1
  const R      = 70;
  const sw     = 12;
  const cx     = 90; const cy = 90;
  const startA = Math.PI * 0.8;        // 144° from right
  const endA   = Math.PI * 2.2;        // 396°
  const totalA = endA - startA;
  const fillA  = startA + totalA * pct;

  const arc = (angle) => ({ x: cx + R * Math.cos(angle), y: cy + R * Math.sin(angle) });
  const pTS  = arc(startA); const pTE = arc(endA);
  const pFS  = arc(startA); const pFE = arc(fillA);

  const describeArc = (s, e, large) =>
    `M ${s.x} ${s.y} A ${R} ${R} 0 ${large ? 1 : 0} 1 ${e.x} ${e.y}`;

  const color = score >= 750 ? '#00E676' : score >= 700 ? '#F5B800' : score >= 650 ? '#FFB020' : '#FF4C4C';
  const grade = score >= 750 ? 'Excellent' : score >= 700 ? 'Good' : score >= 650 ? 'Fair' : 'Needs Work';

  return (
    <div style={{ position: 'relative', width: 180, height: 130 }}>
      <svg viewBox="0 0 180 130" width="180" height="130">
        <path d={describeArc(pTS, pTE, true)} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={sw} strokeLinecap="round" />
        {pct > 0.01 && (
          <path d={describeArc(pFS, pFE, pct > 0.5)} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 8px ${color})` }} />
        )}
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 16 }}>
        <span className="type-num" style={{ fontSize: '2.4rem', color, lineHeight: 1 }}>{score}</span>
        <span className="type-micro" style={{ color: 'var(--text-muted)', marginTop: 4 }}>{grade}</span>
      </div>
    </div>
  );
}

export default function CreditScore() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loansAPI.eligibility()
      .then(({ data: d }) => setData(d))
      .catch(() => setError('Could not load credit data.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!loading && data) {
      gsap.from('.score-item', { opacity: 0, x: -20, duration: 0.5, stagger: 0.08, ease: 'power2.out' });
    }
  }, [loading, data]);

  const breakdown = data?.breakdown || {};

  const factors = data ? [
    {
      label: 'Spending Discipline',
      desc: `Spend-to-income ratio of ${(breakdown.spendRatio * 100).toFixed(0)}%. ${breakdown.spendRatio < 0.7 ? 'Excellent control.' : 'Reduce discretionary spend.'}`,
      value: Math.min(100, Math.round((1 - breakdown.spendRatio) * 120)),
      icon: 'account_balance_wallet', color: breakdown.spendRatio < 0.7 ? 'var(--success)' : 'var(--warning)',
    },
    {
      label: 'Investment Activity',
      desc: `Portfolio value ₹${breakdown.portfolioValue?.toLocaleString()} across ${breakdown.activeSips} active SIP plans.`,
      value: Math.min(100, Math.round((breakdown.portfolioValue / 1000) + breakdown.activeSips * 15)),
      icon: 'trending_up', color: 'var(--blue)',
    },
    {
      label: 'Income Consistency',
      desc: `₹${breakdown.sipMonthly?.toLocaleString()}/mo committed in auto-invest plans. Shows financial discipline.`,
      value: Math.min(100, Math.round(breakdown.sipMonthly / 50)),
      icon: 'payments', color: 'var(--gold)',
    },
    {
      label: 'Liquidity Buffer',
      desc: `Wallet balance ₹${breakdown.walletBalance?.toLocaleString()}. ${breakdown.walletBalance > 5000 ? 'Healthy emergency buffer.' : 'Consider building reserves.'}`,
      value: Math.min(100, Math.round(breakdown.walletBalance / 200)),
      icon: 'account_balance', color: 'var(--purple)',
    },
    {
      label: 'Spending Diversity',
      desc: `${breakdown.categoriesDiversified} unique spending categories detected. Diverse spending indicates financial health.`,
      value: Math.min(100, (breakdown.categoriesDiversified || 0) * 12),
      icon: 'donut_small', color: 'var(--info)',
    },
  ] : [];

  return (
    <div className="score-container">
      <div style={{ marginBottom: 36 }}>
        <p className="type-micro" style={{ color: 'var(--success)', marginBottom: 10 }}>
          <span className="material-symbols-rounded" style={{ fontSize: 14, verticalAlign: 'middle', marginRight: 6 }}>credit_score</span>
          NEXUS HEALTH SCORE
        </p>
        <h1 className="type-h1">Your Financial<br /><span style={{ color: 'var(--gold)' }}>Credit Profile.</span></h1>
        <p className="type-body" style={{ color: 'var(--text-secondary)', marginTop: 8 }}>
          Computed in real-time from your Nexus activity — transactions, investments, liquidity and behavioral patterns.
        </p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="loan-skeleton" style={{ height: 300, borderRadius: 'var(--r-2xl)' }} />
          <div className="loan-skeleton" style={{ height: 400, borderRadius: 'var(--r-2xl)' }} />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {/* Main Layout: Score + Activity and Factor Breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
            {/* Score Display Area */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <GlassCard tier={3} style={{ padding: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <ArcGauge score={data?.score || 0} />
                <div style={{ textAlign: 'center', marginTop: 12 }}>
                  <p className="type-micro" style={{ color: 'var(--text-muted)', letterSpacing: 2 }}>CURRENT STANDING</p>
                  <p className="type-num" style={{ fontSize: '1rem', marginTop: 4 }}>Out of 850 · Real-time Update</p>
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                  <Badge variant="gold" icon="verified">MAX LIMIT: ₹{data?.maxOffer?.toLocaleString() || '0'}</Badge>
                </div>
              </GlassCard>

              <GlassCard tier={2} style={{ padding: 32 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <h4 className="type-h3">Activity Snapshot</h4>
                  <span className="material-symbols-rounded" style={{ color: 'var(--text-muted)' }}>bar_chart</span>
                </div>
                {[
                  { label: 'Transactions Analyzed', val: breakdown.transactionCount, icon: 'receipt_long', color: 'var(--blue)' },
                  { label: 'Total Credits', val: `₹${breakdown.totalCredits?.toLocaleString()}`, icon: 'arrow_downward', color: 'var(--success)' },
                  { label: 'Total Spend', val: `₹${breakdown.totalSpend?.toLocaleString()}`, icon: 'arrow_upward', color: 'var(--error)' },
                  { label: 'Active SIP Plans', val: breakdown.activeSips, icon: 'sync', color: 'var(--gold)' },
                ].map(({ label, val, icon, color }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                     <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span className="material-symbols-rounded" style={{ color, fontSize: 16 }}>{icon}</span>
                     </div>
                    <span className="type-small" style={{ flex: 1, color: 'var(--text-secondary)' }}>{label}</span>
                    <span className="type-num" style={{ fontSize: '0.95rem', fontWeight: 600 }}>{val}</span>
                  </div>
                ))}
              </GlassCard>
            </div>
            
            {/* AI Advisor Prompt */}
            <GlassCard tier={1} style={{ padding: 40, background: 'rgba(245,184,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 24 }}>
              <div style={{ width: 64, height: 64, borderRadius: 20, background: 'var(--gold-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-rounded" style={{ fontSize: 32, color: 'var(--gold)' }}>smart_toy</span>
              </div>
              <div>
                <h3 className="type-h2">Optimize Your<br />Health Score.</h3>
                <p className="type-body" style={{ color: 'var(--text-secondary)', marginTop: 12 }}>
                  Our AI engine analyzes your spending patterns and transaction history to provide personalized recommendations.
                </p>
              </div>
              <Link to="/loans/advisor" style={{ textDecoration: 'none' }}>
                <PrimaryButton style={{ width: '100%' }} icon="auto_fix">Analyze with Gemini</PrimaryButton>
              </Link>
            </GlassCard>
          </div>

          {/* Factor Breakdown */}
          <div className="score-breakdown-header" style={{ marginBottom: 28 }}>
            <h3 className="type-h3">Health Factors</h3>
            <p className="type-micro" style={{ color: 'var(--text-muted)' }}>How your score is calculated</p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {factors.map(({ label, desc, value, icon, color }) => (
              <GlassCard key={label} tier={1} className="score-item" style={{ padding: 24, borderLeft: `4px solid ${color}` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span className="material-symbols-rounded" style={{ color, fontSize: 20 }}>{icon}</span>
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{label}</span>
                  </div>
                  <Badge variant={value > 80 ? 'success' : value > 50 ? 'gold' : 'error'}>{value}%</Badge>
                </div>
                
                <p className="type-small" style={{ color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.5, minHeight: 44 }}>{desc}</p>
                
                <div className="progress-track" style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3 }}>
                  <motion.div
                    className="progress-fill"
                    style={{ height: '100%', borderRadius: 3, background: `linear-gradient(90deg, ${color}, ${color}aa)`, boxShadow: `0 0 10px ${color}44` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, value)}%` }}
                    transition={{ duration: 1.2, ease: [0.2, 0.8, 0.2, 1], delay: 0.1 }}
                  />
                </div>
              </GlassCard>
            ))}
          </div>

          <GlassCard tier={1} style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span className="material-symbols-rounded" style={{ fontSize: 28, color: 'var(--gold)' }}>smart_toy</span>
              <div>
                <p style={{ fontWeight: 600, marginBottom: 4 }}>Want a full explanation?</p>
                <p className="type-small" style={{ color: 'var(--text-secondary)' }}>Let Gemini 1.5 Flash analyze these factors and recommend the best loan product for you.</p>
              </div>
            </div>
            <Link to="/loans/advisor" style={{ display: 'block', marginTop: 16 }}>
              <PrimaryButton style={{ width: '100%' }} icon="arrow_forward">Open AI Advisor</PrimaryButton>
            </Link>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
