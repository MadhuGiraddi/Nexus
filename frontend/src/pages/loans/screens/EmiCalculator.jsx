import React, { useState, useEffect } from 'react';
import gsap from 'gsap';
import { motion } from 'framer-motion';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { GlassCard, RangeSlider, PrimaryButton, Badge } from '../components/UIElements';
import { Link } from 'react-router-dom';

const PURPOSE_RATES = {
  'Personal': 11.2,
  'Home': 7.8,
  'Education': 6.5,
  'Business': 13.5,
  'Portfolio-Backed': 4.2
};

export default function EmiCalculator() {
  const [principal, setPrincipal] = useState(500000);
  const [months, setMonths] = useState(36);
  const [rate, setRate] = useState(PURPOSE_RATES['Personal']);
  const [category, setCategory] = useState('Personal');

  const r = rate / 12 / 100;
  // Precise Monthly Reducing Balance EMI formula
  const emi = r > 0 
    ? (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1)
    : principal / months;
    
  const totalAmount = emi * months;
  const totalInterest = totalAmount - principal;

  const data = [
    { name: 'Principal', value: principal, color: '#F5B800' },
    { name: 'Interest', value: totalInterest, color: '#3B82F6' },
  ];

  const handleCategoryChange = (cat) => {
    setCategory(cat);
    setRate(PURPOSE_RATES[cat]);
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: '#0D1120', border: '1px solid #374151', padding: '8px 12px', borderRadius: '8px' }}>
          <p className="type-small" style={{ color: '#A0AABE' }}>{payload[0].name}</p>
          <p className="type-num" style={{ color: payload[0].payload.color, fontSize: '1.2rem' }}>
            ₹{Math.round(payload[0].value).toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="calc-container">
      <h1 className="type-h1" style={{ marginBottom: '8px', color: '#FFFFFF' }}>EMI Calculator</h1>
      <p className="type-body" style={{ color: '#D1D5DB', marginBottom: '32px' }}>Simulate your loan outgo instantly.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
        
        {/* Left Side: Inputs */}
        <div style={{ padding: '32px', background: '#111827', borderRadius: '24px', border: '1px solid #374151' }}>
          <div style={{ marginBottom: '32px' }}>
            <label className="type-micro" style={{ color: '#F5B800', display: 'block', marginBottom: '16px', fontWeight: 800 }}>LOAN CATEGORY</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '8px' }}>
              {Object.keys(PURPOSE_RATES).map(cat => (
                <button
                  key={cat}
                  onClick={() => handleCategoryChange(cat)}
                  style={{
                    padding: '12px 8px',
                    borderRadius: '12px',
                    background: category === cat ? 'rgba(245,184,0,0.3)' : '#1F2937',
                    border: `1px solid ${category === cat ? '#F5B800' : '#4B5563'}`,
                    color: category === cat ? '#FFFFFF' : '#D1D5DB',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <span className="material-symbols-rounded" style={{ 
                    display: 'block', 
                    marginBottom: '4px', 
                    fontSize: '20px', 
                    color: category === cat ? '#F5B800' : '#9CA3AF' 
                  }}>
                    {cat === 'Personal' ? 'person' : cat === 'Home' ? 'home' : cat === 'Education' ? 'school' : cat === 'Business' ? 'business_center' : 'account_balance'}
                  </span>
                  {cat.split('-')[0]}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span className="type-small" style={{ fontWeight: 800, color: '#FFFFFF', fontSize: '0.9rem' }}>Loan Amount</span>
              <span className="type-num" style={{ color: '#F5B800', fontSize: '1.3rem' }}>₹{principal.toLocaleString()}</span>
            </div>
            <RangeSlider min={50000} max={5000000} value={principal} onChange={(e) => setPrincipal(Number(e.target.value))} />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span className="type-small" style={{ fontWeight: 800, color: '#FFFFFF', fontSize: '0.9rem' }}>Duration (Months)</span>
              <span className="type-num" style={{ color: '#F5B800', fontSize: '1.3rem' }}>{months}</span>
            </div>
            <RangeSlider min={12} max={120} value={months} onChange={(e) => setMonths(Number(e.target.value))} />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span className="type-small" style={{ fontWeight: 800, color: '#FFFFFF', fontSize: '0.9rem' }}>Interest Rate (% p.a.)</span>
              <span className="type-num" style={{ color: '#F5B800', fontSize: '1.3rem' }}>{rate.toFixed(1)}%</span>
            </div>
            <RangeSlider min={4} max={18} value={rate} onChange={(e) => setRate(Number(e.target.value))} />
          </div>
        </div>

        {/* Right Side: Breakdown */}
        <div style={{ padding: '32px', background: '#111827', borderRadius: '24px', border: '1px solid #374151', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h3 className="type-h3" style={{ color: '#FFFFFF', fontWeight: 800 }}>Repayment Breakdown</h3>
            <Badge variant="gold" icon="analytics">DYNAMIC</Badge>
          </div>
          
          <div style={{ width: '100%', height: '260px', position: 'relative', marginBottom: 20 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip content={<CustomTooltip />} />
                <Pie 
                  data={data} 
                  innerRadius="75%" 
                  outerRadius="95%" 
                  paddingAngle={5} 
                  dataKey="value" 
                  stroke="none"
                  animationBegin={0}
                  animationDuration={800}
                >
                  {data.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              <span className="type-micro" style={{ color: '#D1D5DB', fontWeight: 800, letterSpacing: '1px' }}>MONTHLY EMI</span>
              <span className="type-num" style={{ fontSize: '2.5rem', color: '#FFFFFF', fontWeight: 900, textShadow: '0 0 20px rgba(255,255,255,0.1)' }}>
                ₹{Math.round(emi).toLocaleString()}
              </span>
            </div>
          </div>

          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'TOTAL PRINCIPAL', val: `₹${Math.round(principal).toLocaleString()}`, color: '#F5B800', icon: 'payments' },
              { label: 'TOTAL INTEREST', val: `₹${Math.round(totalInterest).toLocaleString()}`, color: '#3B82F6', icon: 'percent' },
              { label: 'TOTAL PAYABLE', val: `₹${Math.round(totalAmount).toLocaleString()}`, color: '#FFFFFF', icon: 'account_balance_wallet' },
            ].map(({ label, val, color, icon }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', background: '#1F2937', borderRadius: '16px', border: '1px solid #374151' }}>
                <div style={{ width: 42, height: 42, borderRadius: '12px', background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${color}40` }}>
                  <span className="material-symbols-rounded" style={{ color, fontSize: 24 }}>{icon}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <p className="type-micro" style={{ color: '#D1D5DB', fontWeight: 900, fontSize: '0.7rem' }}>{label}</p>
                  <p className="type-num" style={{ fontSize: '1.5rem', color, fontWeight: 800, letterSpacing: '0.5px' }}>{val}</p>
                </div>
              </div>
            ))}
          </div>

          <Link to="/loans/apply" style={{ width: '100%', marginTop: 28, textDecoration: 'none' }}>
            <PrimaryButton style={{ width: '100%', padding: '16px' }} icon="bolt">Instant Loan Access</PrimaryButton>
          </Link>
        </div>

      </div>
    </div>
  );
}
