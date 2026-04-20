import React, { useEffect, useState, useRef } from 'react';
import gsap from 'gsap';
import { motion } from 'framer-motion';
import { loansAPI } from '../../../services/api';
import { GlassCard, Badge, PrimaryButton, GhostButton, ProgressBar } from '../components/UIElements';
import { Link } from 'react-router-dom';

const RATES = [
  { label: 'Personal Loan', rate: '11.20%', min: '₹50K', max: '₹40L' },
  { label: 'Portfolio-Backed', rate: '4.20%', min: '₹10L', max: '₹5Cr' },
  { label: 'Home Loan', rate: '7.80%', min: '₹25L', max: '₹2Cr' },
  { label: 'Education Loan', rate: '6.50%', min: '₹1L', max: '₹25L' },
  { label: 'Business Loan', rate: '13.50%', min: '₹5L', max: '₹5Cr' },
];

function ScoreGauge({ score }) {
  const perceivedPct = ((score - 300) / 550) * 100;
  const color = score >= 750 ? '#00E676' : score >= 700 ? '#F5B800' : score >= 650 ? '#FFB020' : '#FF4C4C';
  const grade = score >= 750 ? 'Excellent' : score >= 700 ? 'Good' : score >= 650 ? 'Fair' : 'Needs Work';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
      <div style={{ position: 'relative', width: '90px', height: '90px', flexShrink: 0 }}>
        <svg viewBox="0 0 90 90" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="45" cy="45" r="38" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="8" />
          <circle
            cx="45" cy="45" r="38" fill="none"
            stroke={color}
            strokeWidth="8"
            strokeDasharray={`${2 * Math.PI * 38}`}
            strokeDashoffset={`${2 * Math.PI * 38 * (1 - perceivedPct / 100)}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.2,0.8,0.2,1)', filter: `drop-shadow(0 0 8px ${color})` }}
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          <span className="type-num" style={{ fontSize: '1.3rem', color, lineHeight: 1 }}>{score}</span>
          <span className="type-micro" style={{ color: 'var(--text-muted)', fontSize: '0.6rem' }}>/ 850</span>
        </div>
      </div>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{ fontWeight: 700, fontSize: '1.1rem', color }}>{grade}</span>
          <span className="material-symbols-rounded" style={{ color, fontSize: '18px' }}>verified</span>
        </div>
        <p className="type-small" style={{ color: 'var(--text-muted)' }}>Nexus Health Score</p>
        <p className="type-micro" style={{ color: 'var(--text-muted)', marginTop: 4 }}>Based on your real activity</p>
      </div>
    </div>
  );
}

export default function Home() {
  const [eligibility, setEligibility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const tickerRef = useRef(null);

  useEffect(() => {
    loansAPI.eligibility()
      .then(({ data }) => setEligibility(data))
      .catch(() => setError('Could not load eligibility. Make sure backend is running.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!loading) {
      gsap.from('.loan-home-item', {
        opacity: 0, y: 30, duration: 0.6,
        stagger: 0.1, ease: 'power3.out'
      });
    }
  }, [loading]);

  const stagger = {
    animate: { transition: { staggerChildren: 0.09 } }
  };
  const item = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.4,0,0.2,1] } }
  };

  return (
    <div className="home-container">
      {/* Hero */}
      <motion.div variants={stagger} initial="initial" animate="animate" style={{ margin: '40px 0 48px' }}>
        <motion.p variants={item} className="type-micro" style={{ color: 'var(--gold)', marginBottom: 12 }}>
          <span className="material-symbols-rounded" style={{ fontSize: 14, verticalAlign: 'middle', marginRight: 6 }}>account_balance</span>
          NEXUS LOAN MODULE
        </motion.p>
        <motion.h1 variants={item} className="type-hero">
          Fast, Flexible<br /><span style={{ color: 'var(--gold)' }}>Elite Financing.</span>
        </motion.h1>
        <motion.p variants={item} className="type-body" style={{ color: 'var(--text-secondary)', marginTop: 16, marginBottom: 32 }}>
          Personalized loan offers powered by your Nexus financial activity.<br />
          AI-reviewed. Approved in seconds.
        </motion.p>
        <motion.div variants={item} style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <Link to="/loans/apply"><PrimaryButton icon="arrow_forward">Apply Now</PrimaryButton></Link>
          <Link to="/loans/advisor"><GhostButton>AI Advisor</GhostButton></Link>
        </motion.div>
      </motion.div>

      {/* Rate Ticker */}
      <div style={{ overflow: 'hidden', marginBottom: 40, borderRadius: 'var(--r-md)', border: '1px solid var(--border-subtle)', padding: '10px 0', background: 'rgba(255,255,255,0.02)' }}>
        <div ref={tickerRef} style={{ display: 'flex', gap: 40, animation: 'ticker-scroll 25s linear infinite', width: 'max-content', paddingLeft: 24 }}>
          {[...RATES, ...RATES].map((r, i) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--gold)', display: 'inline-block' }} />
              <span className="type-small" style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{r.label}</span>
              <span className="type-num" style={{ color: 'var(--gold)', fontWeight: 700 }}>{r.rate} APR</span>
              <span className="type-small" style={{ color: 'var(--text-muted)' }}>{r.min}–{r.max}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Main Content Grid with Sidebar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32, marginBottom: 40 }}>
        {/* Core Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
          {/* Score Card */}
          <GlassCard tier={3} className="loan-home-item" style={{ padding: 36, position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
              <div>
                <h3 className="type-h2" style={{ fontSize: '1.8rem' }}>Financial Health</h3>
                <p className="type-small" style={{ color: 'var(--text-secondary)', marginTop: 6 }}>AI-powered credit analysis</p>
              </div>
              <Badge variant="gold" icon="auto_graph">ELITE STATUS</Badge>
            </div>
            {loading ? <div className="loan-skeleton" style={{ height: 120 }} /> : <ScoreGauge score={eligibility?.score || 590} />}
          </GlassCard>

          {/* Pre-Approved Offer */}
          <GlassCard tier={2} className="loan-home-item" style={{ padding: 32, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -20, right: -20, width: 140, height: 140, background: 'var(--gold)', opacity: 0.05, borderRadius: '50%', filter: 'blur(40px)' }} />
            <h3 className="type-h3" style={{ marginBottom: 20 }}>Exclusive Offer</h3>
            {loading ? <div className="loan-skeleton" style={{ height: 120 }} /> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div>
                  <p className="type-micro" style={{ color: 'var(--text-muted)' }}>PRE-APPROVED UP TO</p>
                  <p className="type-num" style={{ fontSize: '2.8rem', color: 'var(--gold)', margin: '8px 0' }}>₹{eligibility?.maxOffer?.toLocaleString() || '15,000'}</p>
                </div>
                <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                  <Link to="/loans/apply" style={{ flex: 1 }}>
                    <PrimaryButton style={{ width: '100%' }} icon="bolt">Instant Apply</PrimaryButton>
                  </Link>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <p className="type-micro" style={{ color: 'var(--success)', fontWeight: 700 }}>4.2% APR</p>
                    <p className="type-micro" style={{ color: 'var(--text-muted)' }}>Fixed Rate</p>
                  </div>
                </div>
              </div>
            )}
          </GlassCard>
        </div>

        {/* Categories / Details */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          {RATES.slice(0, 4).map((r, i) => (
            <GlassCard key={i} tier={1} className="loan-home-item" style={{ padding: 20 }}>
               <p className="type-micro" style={{ color: 'var(--text-muted)', marginBottom: 8 }}>{r.label}</p>
               <p className="type-num" style={{ fontSize: '1.2rem', color: 'var(--gold)' }}>{r.rate}</p>
               <p className="type-small" style={{ color: 'var(--text-secondary)' }}>From {r.min}</p>
            </GlassCard>
          ))}
        </div>
      </div>

    </div>
  );
}
