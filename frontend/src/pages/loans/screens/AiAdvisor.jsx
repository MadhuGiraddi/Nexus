import React, { useEffect, useState } from 'react';
import gsap from 'gsap';
import { motion, AnimatePresence } from 'framer-motion';
import { loansAPI } from '../../../services/api';
import { GlassCard, PrimaryButton, GhostButton } from '../components/UIElements';

function SpinOrb() {
  return (
    <div style={{ position: 'relative', width: 180, height: 180, margin: '0 auto 40px' }}>
      {[0, 10, 20].map((inset, i) => (
        <div key={i} style={{
          position: 'absolute',
          inset,
          borderRadius: '50%',
          border: `2px solid ${i === 0 ? 'rgba(124,58,237,0.4)' : i === 1 ? 'rgba(0,194,255,0.4)' : 'rgba(245,184,0,0.4)'}`,
          borderTopColor: i === 0 ? 'var(--purple)' : i === 1 ? 'var(--blue)' : 'var(--gold)',
          animation: `spin ${3 - i * 0.5}s linear ${i % 2 === 1 ? 'reverse' : ''} infinite`,
        }} />
      ))}
      <div style={{ position: 'absolute', inset: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="material-symbols-rounded" style={{ fontSize: 52, color: 'var(--gold)', filter: 'drop-shadow(0 0 12px rgba(245,184,0,0.5))' }}>neurology</span>
      </div>
    </div>
  );
}

export default function AiAdvisor() {
  const [state, setState] = useState('idle'); // idle | loading | done | error
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');

  const fetchAdvice = () => {
    setState('loading');
    loansAPI.advisor()
      .then(({ data: d }) => { setData(d); setState('done'); })
      .catch(e => { setErr(e?.response?.data?.detail || 'AI Advisor unavailable. Check your OpenAI API key.'); setState('error'); });
  };

  useEffect(() => {
    if (state === 'done') {
      gsap.from('.advisor-result-card', { opacity: 0, y: 30, duration: 0.6, stagger: 0.1, ease: 'power3.out' });
    }
  }, [state]);

  const scoreColor = data
    ? (data.score >= 750 ? '#00E676' : data.score >= 700 ? '#F5B800' : data.score >= 650 ? '#FFB020' : '#FF4C4C')
    : 'var(--gold)';

  return (
    <div className="loan-max-w" style={{ maxWidth: '820px' }}>
      <div style={{ marginBottom: 40 }}>
        <p className="type-micro" style={{ color: 'var(--purple)', marginBottom: 10 }}>
          <span className="material-symbols-rounded" style={{ fontSize: 14, verticalAlign: 'middle', marginRight: 6 }}>smart_toy</span>
          NEXUS AI ADVISOR
        </p>
        <h1 className="type-h1">Your Personalized<br /><span style={{ color: 'var(--gold)' }}>Financial Intelligence.</span></h1>
        <p className="type-body" style={{ color: 'var(--text-secondary)', marginTop: 16 }}>
          Nexus AI analyzes your real Nexus activity — transactions, investments, liquidity — and delivers an expert, personalized loan recommendation.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {state === 'idle' && (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <GlassCard tier={2} style={{ padding: 48, textAlign: 'center' }}>
              <SpinOrb />
              <h3 className="type-h2" style={{ marginBottom: 12 }}>Ready to Analyze</h3>
              <p className="type-body" style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>
                Nexus will scan your financial activity — portfolio, spending patterns, income, and investment habits — then have our core AI explain your score and recommend the perfect loan product for you.
              </p>
              <PrimaryButton onClick={fetchAdvice} icon="arrow_forward" style={{ minWidth: 200 }}>
                Analyze My Finances
              </PrimaryButton>
            </GlassCard>
          </motion.div>
        )}

        {state === 'loading' && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <GlassCard tier={2} style={{ padding: 48, textAlign: 'center' }}>
              <SpinOrb />
              <h3 className="type-h2" style={{ marginBottom: 12 }}>AI is Analyzing...</h3>
              <p className="type-body" style={{ color: 'var(--text-secondary)' }}>
                Scanning transactions, portfolio, SIPs and liquidity.<br />Computing your Nexus Health Score and generating expert advice.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
                {['Scanning Data', 'Computing Score', 'AI Analysis'].map((step, i) => (
                  <span key={step} className="type-micro" style={{ padding: '4px 10px', borderRadius: 'var(--r-full)', background: 'rgba(245,184,0,0.08)', border: '1px solid rgba(245,184,0,0.2)', color: 'var(--gold)', animation: `pulse-glow ${1 + i * 0.3}s ease-in-out infinite` }}>
                    {step}
                  </span>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        )}

        {state === 'error' && (
          <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <GlassCard style={{ padding: 40, borderColor: 'rgba(255,76,76,0.3)', textAlign: 'center' }}>
              <span className="material-symbols-rounded" style={{ fontSize: 48, color: 'var(--error)', marginBottom: 16 }}>error</span>
              <h3 className="type-h3" style={{ marginBottom: 12 }}>Advisor Unavailable</h3>
              <p className="type-small" style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>{err}</p>
              <PrimaryButton onClick={fetchAdvice}>Retry</PrimaryButton>
            </GlassCard>
          </motion.div>
        )}

        {state === 'done' && data && (
          <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Score Banner */}
            <GlassCard tier={3} className="advisor-result-card" style={{ padding: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <p className="type-micro" style={{ color: 'var(--text-muted)', marginBottom: 8 }}>YOUR NEXUS HEALTH SCORE</p>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                    <span className="type-num" style={{ fontSize: '3.5rem', color: scoreColor, lineHeight: 1, filter: `drop-shadow(0 0 20px ${scoreColor})` }}>
                      {data.score}
                    </span>
                    <span className="type-small" style={{ color: 'var(--text-muted)' }}>/ 850</span>
                    <span className="material-symbols-rounded" style={{ color: scoreColor, fontSize: 28 }}>verified</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p className="type-micro" style={{ color: 'var(--text-muted)', marginBottom: 8 }}>PRE-APPROVED OFFER</p>
                  <span className="type-num" style={{ fontSize: '2rem', color: 'var(--gold)' }}>₹{data.maxOffer.toLocaleString()}</span>
                </div>
              </div>
            </GlassCard>

            {/* OpenAI Explanation */}
            <GlassCard tier={2} className="advisor-result-card" style={{ padding: 36 }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, var(--gold), var(--gold-light))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--bg-base)', flexShrink: 0 }}>
                  <span className="material-symbols-rounded">smart_toy</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <p style={{ fontWeight: 700, fontSize: '1rem' }}>Nexus AI Advisor</p>
                    <span className="type-micro" style={{ padding: '2px 8px', borderRadius: 'var(--r-full)', background: 'rgba(124,58,237,0.15)', color: 'var(--purple)', border: '1px solid rgba(124,58,237,0.3)' }}>{data.model || 'Gemini 1.5'}</span>
                  </div>
                  {data.advice && typeof data.advice === 'string' ? data.advice.split('\n\n').map((para, i) => para.trim() && (
                    <p key={i} className="type-body" style={{ color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.8 }}>
                      {para}
                    </p>
                  )) : (
                    <p className="type-body" style={{ color: 'var(--text-secondary)' }}>Analysis report is being finalized...</p>
                  )}
                </div>
              </div>
            </GlassCard>

            {/* Breakdown Metrics */}
            <GlassCard tier={1} className="advisor-result-card" style={{ padding: 28 }}>
              <h4 className="type-h3" style={{ marginBottom: 20 }}>Data Used for This Analysis</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
                {[
                  { label: 'Total Spending', val: `₹${data.breakdown.totalSpend.toLocaleString()}` },
                  { label: 'Income Credits', val: `₹${data.breakdown.totalCredits.toLocaleString()}` },
                  { label: 'Spend Ratio', val: `${(data.breakdown.spendRatio * 100).toFixed(0)}%` },
                  { label: 'Portfolio Value', val: `₹${data.breakdown.portfolioValue.toLocaleString()}` },
                  { label: 'Active SIPs', val: data.breakdown.activeSips },
                  { label: 'Monthly SIP', val: `₹${data.breakdown.sipMonthly.toLocaleString()}` },
                  { label: 'Liquidity', val: `₹${data.breakdown.walletBalance.toLocaleString()}` },
                  { label: 'Transactions', val: data.breakdown.transactionCount },
                ].map(({ label, val }) => (
                  <div key={label} style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--r-md)', border: '1px solid var(--border-subtle)' }}>
                    <p className="type-micro" style={{ color: 'var(--text-muted)', marginBottom: 6 }}>{label}</p>
                    <p className="type-num" style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>{val}</p>
                  </div>
                ))}
              </div>
            </GlassCard>

            <div style={{ textAlign: 'center' }}>
              <GhostButton onClick={() => { setState('idle'); setData(null); }}>Run New Analysis</GhostButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
