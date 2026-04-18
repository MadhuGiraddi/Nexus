import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, PieChart, ArrowUpRight, Wallet, Briefcase } from 'lucide-react';
import { investAPI } from '../../services/api';
import gsap from 'gsap';

export default function PortfolioWidget() {
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const res = await investAPI.getPortfolio();
        setPortfolio(res.data);
      } catch (e) {
        console.error('Failed to fetch portfolio');
      } finally {
        setLoading(false);
      }
    };
    fetchPortfolio();
    window.addEventListener('nexus-reload-data', fetchPortfolio);
    return () => window.removeEventListener('nexus-reload-data', fetchPortfolio);
  }, []);

  useEffect(() => {
    if (!loading) {
      gsap.from(".portfolio-item", {
        scale: 0.95,
        opacity: 0,
        duration: 0.4,
        stagger: 0.08,
        ease: "power2.out"
      });
    }
  }, [loading, portfolio]);

  if (loading) return <div style={{ height: '320px', background: 'rgba(255,255,255,0.02)', borderRadius: '24px', animation: 'pulse 1.5s infinite' }} />;

  const getYield = (ticker) => {
    const hash = ticker.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return 1 + (0.01 + (hash % 15) / 100);
  };

  const totalInvested = portfolio?.holdings?.reduce((acc, h) => acc + (h.quantity * h.avgPrice), 0) || 0;
  const currentVal = portfolio?.holdings?.reduce((acc, h) => acc + (h.quantity * h.avgPrice * getYield(h.symbol)), 0) || 0;
  const profit = currentVal - totalInvested;
  const profitPct = totalInvested > 0 ? (profit / totalInvested) * 100 : 0;

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '24px',
      padding: '24px',
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Briefcase size={20} color="var(--accent)" /> Investments
        </h3>
        <span style={{ fontSize: '12px', color: 'var(--green)', background: 'rgba(0,200,83,0.1)', padding: '4px 8px', borderRadius: '8px', fontWeight: 700 }}>
          LIVE
        </span>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>Total Portfolio Value</span>
        <h2 style={{ margin: '4px 0', fontSize: '32px', fontWeight: 800, fontFamily: "'JetBrains Mono', monospace" }}>
          ${currentVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--green)', fontSize: '14px', fontWeight: 700 }}>
          <TrendingUp size={16} /> +${profit.toFixed(2)} ({profitPct.toFixed(1)}%)
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
        {portfolio?.holdings?.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: 'rgba(255,255,255,0.3)' }}>
            <PieChart size={40} style={{ marginBottom: '12px', opacity: 0.5 }} />
            <p style={{ fontSize: '14px' }}>No stocks bought yet.<br/>Start investing in InvestPro!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {portfolio?.holdings?.map((h) => (
              <div key={h.symbol} className="portfolio-item" style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.05)'
              }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '15px' }}>{h.symbol}</div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>{h.quantity} Shares @ ${h.avgPrice.toFixed(2)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--green)' }}>
                    ${(h.quantity * h.avgPrice * 1.05).toFixed(2)}
                  </div>
                  <ArrowUpRight size={14} color="var(--green)" style={{ marginLeft: 'auto' }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(108,59,238,0.1)', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Wallet size={20} color="var(--accent)" />
        <div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Buying Power</div>
          <div style={{ fontWeight: 700 }}>${portfolio?.walletBalance?.toLocaleString() || '50,000'}</div>
        </div>
      </div>
    </div>
  );
}
