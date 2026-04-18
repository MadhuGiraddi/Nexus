import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Calendar, CalendarDays, Search, TrendingUp, CheckCircle2, ChevronRight, Ban } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

const ASSETS = {
  'Index Funds': [
    { name: 'UTI Nifty 50 Index Fund', type: 'Equity • Index • Direct Growth', cagr: '14.41%', expense: '0.18%', trkError: '0.05%', size: '15,640 Cr', return: '+14.41%' },
    { name: 'ICICI Prudential Nifty 50 Index Fund', type: 'Equity • Index • Direct Growth', cagr: '14.37%', expense: '0.17%', trkError: '0.04%', size: '12,940 Cr', return: '+14.37%' },
    { name: 'HDFC Index Fund-NIFTY 50 Plan', type: 'Equity • Index • Direct Growth', cagr: '14.37%', expense: '0.20%', trkError: '0.03%', size: '13,290 Cr', return: '+14.37%' },
    { name: 'SBI Nifty Index Fund', type: 'Equity • Index • Direct Growth', cagr: '14.41%', expense: '0.20%', trkError: '0.04%', size: '11,114 Cr', return: '+14.41%' },
    { name: 'Navi Nifty 50 Index Fund', type: 'Equity • Index • Direct Growth', cagr: '14.50%', expense: '0.06%', trkError: '0.03%', size: '3,100 Cr', return: '+14.50%' },
    { name: 'Bandhan Nifty 50 Index Fund', type: 'Equity • Index • Direct Growth', cagr: '14.28%', expense: '0.10%', trkError: '0.06%', size: '1,500 Cr', return: '+14.28%' },
    { name: 'Nippon India Index Fund - Nifty 50', type: 'Equity • Index • Direct Growth', cagr: '14.30%', expense: '0.20%', trkError: '0.05%', size: '2,800 Cr', return: '+14.30%' },
    { name: 'Tata Nifty 50 Index Fund', type: 'Equity • Index • Direct Growth', cagr: '14.25%', expense: '0.15%', trkError: '0.04%', size: '1,200 Cr', return: '+14.25%' },
    { name: 'Motilal Oswal Nifty 50 Index Fund', type: 'Equity • Index • Direct Growth', cagr: '14.39%', expense: '0.14%', trkError: '0.03%', size: '3,800 Cr', return: '+14.39%' },
  ],
  'Flexi Cap': [
    { name: 'Parag Parikh Flexi Cap Fund', type: 'Equity • Flexi Cap • Direct', cagr: '24.50%', expense: '0.55%', trkError: '4.80%', size: '64,120 Cr', return: '+24.50%' },
    { name: 'Quant Flexi Cap Fund', type: 'Equity • Flexi Cap • Direct', cagr: '31.40%', expense: '0.62%', trkError: '6.50%', size: '12,400 Cr', return: '+31.40%' },
    { name: 'HDFC Flexi Cap Fund', type: 'Equity • Flexi Cap • Direct', cagr: '26.80%', expense: '0.84%', trkError: '5.20%', size: '54,000 Cr', return: '+26.80%' },
    { name: 'Kotak Flexicap Fund', type: 'Equity • Flexi Cap • Direct', cagr: '20.10%', expense: '0.60%', trkError: '4.10%', size: '48,000 Cr', return: '+20.10%' },
    { name: 'SBI Flexicap Fund', type: 'Equity • Flexi Cap • Direct', cagr: '22.50%', expense: '0.72%', trkError: '4.50%', size: '42,100 Cr', return: '+22.50%' },
    { name: 'PGIM India Flexi Cap Fund', type: 'Equity • Flexi Cap • Direct', cagr: '21.80%', expense: '0.58%', trkError: '5.60%', size: '6,200 Cr', return: '+21.80%' },
    { name: 'Canara Robeco Flexi Cap Fund', type: 'Equity • Flexi Cap • Direct', cagr: '19.40%', expense: '0.65%', trkError: '4.00%', size: '11,000 Cr', return: '+19.40%' },
    { name: 'DSP Flexi Cap Fund', type: 'Equity • Flexi Cap • Direct', cagr: '23.10%', expense: '0.76%', trkError: '5.10%', size: '15,300 Cr', return: '+23.10%' },
  ],
  'Small Cap': [
    { name: 'Nippon India Small Cap Fund', type: 'Equity • Small Cap • Direct', cagr: '38.20%', expense: '0.66%', trkError: '7.10%', size: '50,140 Cr', return: '+38.20%' },
    { name: 'Quant Small Cap Fund', type: 'Equity • Small Cap • Direct', cagr: '42.10%', expense: '0.78%', trkError: '8.50%', size: '20,800 Cr', return: '+42.10%' },
    { name: 'SBI Small Cap Fund', type: 'Equity • Small Cap • Direct', cagr: '34.80%', expense: '0.68%', trkError: '6.40%', size: '28,150 Cr', return: '+34.80%' },
    { name: 'Tata Small Cap Fund', type: 'Equity • Small Cap • Direct', cagr: '36.50%', expense: '0.60%', trkError: '6.80%', size: '8,200 Cr', return: '+36.50%' },
    { name: 'Axis Small Cap Fund', type: 'Equity • Small Cap • Direct', cagr: '31.20%', expense: '0.52%', trkError: '5.90%', size: '19,500 Cr', return: '+31.20%' },
    { name: 'Kotak Small Cap Fund', type: 'Equity • Small Cap • Direct', cagr: '33.40%', expense: '0.65%', trkError: '6.10%', size: '14,300 Cr', return: '+33.40%' },
    { name: 'HDFC Small Cap Fund', type: 'Equity • Small Cap • Direct', cagr: '35.90%', expense: '0.80%', trkError: '7.00%', size: '29,400 Cr', return: '+35.90%' },
    { name: 'DSP Small Cap Fund', type: 'Equity • Small Cap • Direct', cagr: '32.10%', expense: '0.70%', trkError: '6.50%', size: '13,100 Cr', return: '+32.10%' },
  ]
};

export default function SipStepperModal({ open, onClose, onSubmit }) {
  const [step, setStep] = useState(1); // 1 to 4
  
  // Form State
  const [freq, setFreq] = useState('Monthly SIP');
  const [assetTab, setAssetTab] = useState('Index Funds');
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [amount, setAmount] = useState('2000');
  const [autoEscalate, setAutoEscalate] = useState(10);
  const [deductionDay, setDeductionDay] = useState(5);
  
  // Payment step
  const [otp, setOtp] = useState('');
  const [verifying, setVerifying] = useState(false);

  // Generate projection chart data
  const projectionData = React.useMemo(() => {
    let amt = Number(amount) || 0;
    if (amt <= 0) return [];
    const yearly = freq === 'Monthly SIP' ? amt * 12 : freq === 'Daily SIP' ? amt * 365 : amt;
    
    let invested = 0;
    let wealth = 0;
    let fdWealth = 0;
    const data = [];
    
    for (let year = 1; year <= 10; year++) {
      let currentYearInput = yearly * Math.pow(1 + (autoEscalate/100), year - 1);
      invested += currentYearInput;
      wealth = (wealth + currentYearInput) * 1.12; // 12% mutual fund returns
      fdWealth = (fdWealth + currentYearInput) * 1.07; // 7% Bank FD returns
      data.push({ year: `Year ${year}`, Invested: Math.round(invested), FD: Math.round(fdWealth), Returns: Math.round(wealth) });
    }
    return data;
  }, [amount, freq, autoEscalate]);

  const handleCreate = async () => {
    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      onSubmit({
        frequency: freq.split(' ')[0],
        assetClass: assetTab,
        assetName: selectedAsset.name,
        amount: Number(amount),
        autoEscalate,
        startDate: new Date(),
        deductionDay: freq !== 'Daily SIP' ? deductionDay : new Date().getDate(),
        cagr: selectedAsset.cagr,
        expenseRatio: selectedAsset.expense,
        trackingError: selectedAsset.trkError,
        fundSize: selectedAsset.size
      });
    }, 2000);
  };

  const closeAndReset = () => {
    setStep(1); setSelectedAsset(null); setOtp(''); setVerifying(false); onClose();
  };

  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={closeAndReset}>
      <motion.div className="modal-box glass-card invest-modal" 
        style={{ maxWidth: '800px', width: '90%' }}
        onClick={e => e.stopPropagation()}
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
      >
        <button className="modal-close btn-icon" onClick={closeAndReset}><X size={20}/></button>
        
        {/* Stepper Header */}
        <div className="invest-stepper">
          {[1,2,3,4].map(s => (
            <div key={s} className={`step-orb ${step >= s ? 'active' : ''}`}>
              {s < step ? <CheckCircle2 size={16}/> : s}
            </div>
          ))}
          <div className="step-line" />
        </div>

        <div className="invest-modal-content" style={{ padding: '20px 10px', minHeight: '400px' }}>
          <AnimatePresence mode="wait">
            
            {/* STEP 1: Frequency */}
            {step === 1 && (
              <motion.div key="s1" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }}>
                <h2 style={{ marginBottom: '24px', textAlign: 'center' }}>How often do you want to invest?</h2>
                <div className="freq-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                  {[
                    { title: 'Daily SIP', icon: Clock, desc: 'Small amounts daily. Averages out daily market volatility.', min: '₹100/day' },
                    { title: 'Monthly SIP', icon: CalendarDays, desc: 'The most popular. Fixed deduction on your salary day.', min: '₹500/mo' },
                    { title: 'Yearly SIP', icon: Calendar, desc: 'Great for deploying annual bonuses or tax-saving ELSS.', min: '₹5000/yr' },
                  ].map(f => (
                     <div key={f.title} onClick={() => setFreq(f.title)}
                          className={`glass-card freq-card ${freq === f.title ? 'active' : ''}`}
                          style={{ cursor: 'pointer', padding: '24px', textAlign: 'center', borderColor: freq === f.title ? 'var(--accent)' : '' }}>
                       <f.icon size={32} style={{ color: freq === f.title ? 'var(--accent)' : '#9A9AB0', margin: '0 auto 16px' }} />
                       <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>{f.title}</h3>
                       <p style={{ fontSize: '13px', color: '#B4B4C4', marginBottom: '16px' }}>{f.desc}</p>
                       <span style={{ padding: '4px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', fontSize: '12px' }}>{f.min}</span>
                     </div>
                  ))}
                </div>
                <div style={{ textAlign: 'center', marginTop: '32px' }}>
                  <button className="btn-primary" onClick={() => setStep(2)}>Continue to Select Asset <ChevronRight size={16}/></button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: Select Asset */}
            {step === 2 && (
              <motion.div key="s2" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }}>
                <h2 style={{ marginBottom: '16px' }}>What do you want to invest in?</h2>
                <div className="tabs" style={{ display: 'flex', gap: '8px', marginBottom: '20px', overflowX: 'auto' }}>
                  {Object.keys(ASSETS).map(tab => (
                    <button key={tab} className={`btn-tab ${assetTab === tab ? 'active' : ''}`} onClick={() => setAssetTab(tab)}>{tab}</button>
                  ))}
                </div>
                <div className="asset-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '340px', overflowY: 'auto' }}>
                  {ASSETS[assetTab].map(asset => (
                    <div key={asset.name} className="glass-card" onClick={() => { setSelectedAsset(asset); setTimeout(() => setStep(3), 300); }} 
                         style={{ 
                           display: 'flex', flexDirection: 'column', padding: '16px 20px', 
                           cursor: 'pointer', border: selectedAsset?.name === asset.name ? '1px solid var(--accent)' : '1px solid var(--border)',
                           transition: 'all 0.2s',
                           background: selectedAsset?.name === asset.name ? 'rgba(108,59,238,0.1)' : 'var(--glass)'
                         }}>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ padding: '2px 6px', fontSize: '9px', fontWeight: 'bold', background: 'var(--accent)', color: '#fff', borderRadius: '4px', textTransform: 'uppercase' }}>Top</span>
                            <h4 style={{ margin: 0, fontSize: '15px' }}>{asset.name}</h4>
                          </div>
                          <span style={{ fontSize: '11px', color: '#B4B4C4', marginTop: '4px', display: 'block' }}>{asset.type}</span>
                        </div>
                        <CheckCircle2 size={20} style={{ color: selectedAsset?.name === asset.name ? 'var(--accent)' : 'rgba(255,255,255,0.1)' }} />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', background: 'rgba(0,0,0,0.2)', padding: '12px 16px', borderRadius: '8px' }}>
                        <div style={{ textAlign: 'left' }}>
                          <p style={{ fontSize: '10px', color: '#8A8A9E', margin: '0 0 4px', textTransform: 'uppercase' }}>3Y CAGR</p>
                          <p style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--green)', margin: 0 }}>{asset.cagr}</p>
                        </div>
                        <div style={{ textAlign: 'left' }}>
                          <p style={{ fontSize: '10px', color: '#8A8A9E', margin: '0 0 4px', textTransform: 'uppercase' }}>Expense Ratio</p>
                          <p style={{ fontSize: '13px', margin: 0 }}>{asset.expense}</p>
                        </div>
                        <div style={{ textAlign: 'left' }}>
                          <p style={{ fontSize: '10px', color: '#8A8A9E', margin: '0 0 4px', textTransform: 'uppercase' }}>Tracking Error</p>
                          <p style={{ fontSize: '13px', margin: 0, color: asset.trkError === 'Low' ? 'var(--green)' : 'var(--text)' }}>{asset.trkError}</p>
                        </div>
                        <div style={{ textAlign: 'left' }}>
                          <p style={{ fontSize: '10px', color: '#8A8A9E', margin: '0 0 4px', textTransform: 'uppercase' }}>Fund Size</p>
                          <p style={{ fontSize: '13px', margin: 0 }}>{asset.size}</p>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '20px' }}><button className="btn-text" onClick={() => setStep(1)}>Back</button></div>
              </motion.div>
            )}

            {/* STEP 3: Configure SIP */}
            {step === 3 && (
              <motion.div key="s3" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} style={{ display: 'flex', gap: '24px' }}>
                <div style={{ flex: 1 }}>
                  <h2>Configure SIP</h2>
                  <p style={{ color: 'var(--accent)', marginBottom: '24px' }}>{selectedAsset?.name} ({freq})</p>
                  
                  <label className="field-label">Amount (₹)</label>
                  <input type="number" className="field-input" value={amount} onChange={e => setAmount(e.target.value)} style={{ fontSize: '24px', fontWeight: 'bold' }} />
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px', marginBottom: '24px' }}>
                    {['500','1000','2000','5000'].map(v => (
                      <button key={v} className="btn-tab" style={{ padding: '6px 12px' }} onClick={() => setAmount(v)}>₹{v}</button>
                    ))}
                  </div>

                  {freq !== 'Daily SIP' && (
                    <div style={{ marginBottom: '24px' }}>
                      <label className="field-label">Date to deduct SIP amount</label>
                      <div style={{ display: 'flex', alignItems: 'center', marginTop: '8px' }}>
                        <select className="field-input" value={deductionDay} onChange={e => setDeductionDay(Number(e.target.value))} style={{ maxWidth: '140px', fontSize: '14px' }}>
                          {[...Array(28)].map((_, i) => {
                            const num = i + 1;
                            const suffix = num === 1 || num === 21 ? 'st' : num === 2 || num === 22 ? 'nd' : num === 3 || num === 23 ? 'rd' : 'th';
                            return <option key={num} value={num}>{num}{suffix} of month</option>;
                          })}
                        </select>
                      </div>
                    </div>
                  )}

                  <label className="field-label">Auto-Escalation (Step-up % per year)</label>
                  <input type="range" min="0" max="25" step="5" value={autoEscalate} onChange={e => setAutoEscalate(e.target.value)} style={{ width: '100%', marginBottom: '8px' }} />
                  <p style={{ fontSize: '12px', color: '#B4B4C4' }}>Increase SIP by {autoEscalate}% every year to beat inflation.</p>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px' }}>
                    <button className="btn-text" onClick={() => setStep(2)}>Back</button>
                    <button className="btn-primary" onClick={() => setStep(4)}>Proceed to Pay</button>
                  </div>
                </div>

                {/* Live Projection Chart */}
                <div className="glass-card" style={{ flex: 1, padding: '24px', background: 'linear-gradient(to bottom, rgba(236,72,153,0.05), transparent)' }}>
                  <h3>10-Year Wealth Projection</h3>
                  <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', marginTop: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '10px', height: '10px', background: '#3B82F6', borderRadius: '50%' }}></div>
                      <span style={{ fontSize: '11px', color: '#B4B4C4' }}>Invested</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '10px', height: '10px', background: '#EC4899', borderRadius: '50%' }}></div>
                      <span style={{ fontSize: '11px', color: '#B4B4C4' }}>FD (7%)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '10px', height: '10px', background: '#F59E0B', borderRadius: '50%' }}></div>
                      <span style={{ fontSize: '11px', color: '#B4B4C4' }}>Index Fund (12%)</span>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={180}>
                    <AreaChart data={projectionData}>
                      <XAxis dataKey="year" hide />
                      <RechartsTooltip formatter={(val) => `₹${val.toLocaleString()}`} contentStyle={{ background: '#111', border: '1px solid #333' }} />
                      <Area type="monotone" dataKey="Invested" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
                      <Area type="monotone" dataKey="FD" stackId="2" stroke="#EC4899" fill="#EC4899" fillOpacity={0.3} />
                      <Area type="monotone" dataKey="Returns" stackId="3" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.8} />
                    </AreaChart>
                  </ResponsiveContainer>
                  
                  {projectionData.length > 0 && (
                    <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px' }}>
                      <div>
                        <p style={{ fontSize: '11px', color: '#B4B4C4', margin: 0 }}>Total Invested</p>
                        <p style={{ fontSize: '16px', fontWeight: 'bold', margin: '4px 0 0' }}>₹{projectionData[9].Invested.toLocaleString()}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '11px', color: '#EC4899', margin: 0 }}>If stored in Bank FD</p>
                        <p style={{ fontSize: '14px', fontWeight: 'bold', margin: '4px 0 0' }}>₹{projectionData[9].FD.toLocaleString()}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '11px', color: '#F59E0B', margin: 0 }}>If Mutual Fund (12%)</p>
                        <p style={{ fontSize: '16px', fontWeight: 'bold', margin: '4px 0 0', color: '#F59E0B' }}>₹{projectionData[9].Returns.toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* STEP 4: Checkout */}
            {step === 4 && (
              <motion.div key="s4" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="text-center">
                <div style={{ maxWidth: '300px', margin: '0 auto', textAlign: 'left' }}>
                  <h3 style={{ textAlign: 'center', marginBottom: '24px' }}>Bank e-Mandate</h3>
                  <div className="glass-card" style={{ padding: '16px', marginBottom: '24px', textAlign: 'center' }}>
                    <p style={{ margin: 0, fontSize: '14px', color: '#B4B4C4' }}>Authorizing</p>
                    <p style={{ margin: '8px 0', fontSize: '24px', fontWeight: 'bold' }}>₹{amount} {freq.split(' ')[0]}</p>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--green)' }}>To: {selectedAsset?.name}</p>
                  </div>

                  <p style={{ fontSize: '13px', color: '#B4B4C4', marginBottom: '8px' }}>Enter 6-digit Bank OTP</p>
                  <input type="text" className="field-input" maxLength={6} placeholder="• • • • • •" value={otp} onChange={e => setOtp(e.target.value)} 
                         style={{ fontSize: '24px', letterSpacing: '8px', textAlign: 'center', marginBottom: '24px' }} />
                  
                  <button className="btn-primary btn-full" onClick={handleCreate} disabled={otp.length < 6 || verifying}>
                    {verifying ? 'Verifying Mandate...' : 'Setup AutoPay'}
                  </button>
                  <p style={{ textAlign: 'center', marginTop: '16px' }}><button className="btn-text" onClick={() => setStep(3)}>Cancel</button></p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
