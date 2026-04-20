import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, ArrowUpRight, Wallet2 } from 'lucide-react';
import { AreaChart, Area, Tooltip, ResponsiveContainer } from 'recharts';
import AnimatedNumber from '../ui/AnimatedNumber';
import { SkeletonCard } from '../ui/Spinner';
import { investAPI } from '../../services/api';
import gsap from 'gsap';
import { useEffect, useState, useRef } from 'react';

const SPARK_COLORS = { positive: '#10B981', negative: '#EC4899' };

export default function NetWorthHero({ netWorth: plaidNetWorth, cashflow, loading }) {
  const [portfolioVal, setPortfolioVal] = useState(0);

  const heroRef = useRef(null);

  useEffect(() => {
    const fetchPort = async () => {
      try {
        const res = await investAPI.getPortfolio();
        const holdings = res.data?.holdings || [];
        const total = holdings.reduce((acc, h) => {
          const hash = h.symbol.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
          const yieldPct = 1 + (0.01 + (hash % 15) / 100);
          return acc + (h.quantity * h.avgPrice * yieldPct);
        }, 0);
        setPortfolioVal(total);
      } catch (e) {}
    };

    fetchPort();
    window.addEventListener('nexus-reload-data', fetchPort);
    
    // Floating animation
    gsap.to(".hero-widget", {
      y: -5,
      duration: 2.5,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });

    // 3D Tilt Effect on mouse move
    const handleMouseMove = (e) => {
      if (!heroRef.current) return;
      const { left, top, width, height } = heroRef.current.getBoundingClientRect();
      const x = (e.clientX - left) / width - 0.5;
      const y = (e.clientY - top) / height - 0.5;
      
      gsap.to(heroRef.current, {
        rotationY: x * 10,
        rotationX: -y * 10,
        transformPerspective: 1000,
        duration: 0.5,
        ease: "power2.out"
      });
    };

    const handleMouseLeave = () => {
      gsap.to(heroRef.current, {
        rotationY: 0,
        rotationX: 0,
        duration: 0.8,
        ease: "elastic.out(1, 0.3)"
      });
    };

    const el = heroRef.current;
    if (el) {
      el.addEventListener('mousemove', handleMouseMove);
      el.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      window.removeEventListener('nexus-reload-data', fetchPort);
      if (el) {
        el.removeEventListener('mousemove', handleMouseMove);
        el.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, []);

  const netWorth = plaidNetWorth + portfolioVal;
  // Build sparkline from cashflow data
  const sparkData = (cashflow || []).slice(-14).map((d) => ({
    date: d._id,
    value: d.income - d.spent,
  }));

  // Running total for area chart
  let running = netWorth;
  const areaData = [...sparkData].reverse().map((d) => {
    running -= d.value;
    return { ...d, netWorth: running };
  }).reverse();

  const lastTwo   = cashflow?.slice(-2) || [];
  const change    = lastTwo.length === 2 ? ((lastTwo[1]?.income - lastTwo[1]?.spent) - (lastTwo[0]?.income - lastTwo[0]?.spent)) : 0;
  const isPos     = change >= 0;
  const pct       = netWorth !== 0 ? Math.abs(change / netWorth * 100).toFixed(2) : '0.00';

  if (loading) return <SkeletonCard className="hero-skeleton" />;

  return (
    <motion.div
      ref={heroRef}
      className="glass-card widget hero-widget"
      style={{ overflow: 'hidden' }}
    >
      {/* Scanning Effect */}
      <div 
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, height: '2px',
          background: 'linear-gradient(90deg, transparent, var(--accent-2), transparent)',
          opacity: 0.3,
          zIndex: 5,
          pointerEvents: 'none',
          animation: 'nexus-scan 4s linear infinite'
        }}
      />
      <style>{`
        @keyframes nexus-scan {
          0% { transform: translateY(-100px); opacity: 0; }
          10% { opacity: 0.5; }
          90% { opacity: 0.5; }
          100% { transform: translateY(300px); opacity: 0; }
        }
      `}</style>
      <div className="hero-left">
        <p className="widget-label">Total Managed Assets</p>
        <div className="hero-amount-row">
          <AnimatedNumber
            value={netWorth}
            prefix="$"
            decimals={2}
            className="hero-amount"
          />
          <span className={`change-chip ${isPos ? 'positive' : 'negative'}`}>
            {isPos ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            {isPos ? '+' : '-'}{pct}%
          </span>
        </div>
        <div className="hero-meta">
          <div className="hero-meta-item">
            <ArrowUpRight size={14} className="icon-green" />
            <span>Plaid + Brokerage Linked</span>
          </div>
          <span className="hero-meta-dot">·</span>
          <div className="hero-meta-item">
            <Wallet2 size={14} />
            <span>Wealth Merged</span>
          </div>
        </div>
      </div>

      <div className="hero-chart">
        <ResponsiveContainer width="100%" height={90}>
          <AreaChart data={areaData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={isPos ? '#10B981' : '#EC4899'} stopOpacity={0.3} />
                <stop offset="95%" stopColor={isPos ? '#10B981' : '#EC4899'} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Tooltip
              contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: 8, fontSize: 12 }}
              formatter={(v) => [`$${Number(v).toLocaleString()}`, 'Net Worth']}
              labelStyle={{ color: '#888' }}
            />
            <Area
              type="monotone"
              dataKey="netWorth"
              stroke={isPos ? '#10B981' : '#EC4899'}
              strokeWidth={2}
              fill="url(#nwGrad)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
        <p className="chart-label">14-day trend</p>
      </div>
    </motion.div>
  );
}
