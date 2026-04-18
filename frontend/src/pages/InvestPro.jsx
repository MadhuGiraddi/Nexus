import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { investAPI } from '../services/api';
import SipStepperModal from '../components/nexus/SipStepperModal';
import EditSipModal    from '../components/nexus/EditSipModal';
import StockExplore    from '../components/nexus/StockExplore';
import { Plus, TrendingUp, Settings2, Play, Pause, Ban, BookOpen, Globe2, Info, Lightbulb, ShieldCheck, Zap, PieChart, ChevronUp } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import gsap from 'gsap';

const sipData = [
  { year: 'Year 1', amount: 120000, fd: 128400, value: 134400 },
  { year: 'Year 2', amount: 240000, fd: 265788, value: 284928 },
  { year: 'Year 3', amount: 360000, fd: 412793, value: 453519 },
  { year: 'Year 4', amount: 480000, fd: 570088, value: 642341 },
  { year: 'Year 5', amount: 600000, fd: 738394, value: 853822 },
  { year: 'Year 6', amount: 720000, fd: 918481, value: 1090680 },
  { year: 'Year 7', amount: 840000, fd: 1111174, value: 1355961 },
  { year: 'Year 8', amount: 960000, fd: 1317356, value: 1653076 },
  { year: 'Year 9', amount: 1080000, fd: 1537970, value: 1985845 },
  { year: 'Year 10', amount: 1200000, fd: 1774027, value: 2358546 },
];

export default function InvestPro() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sips, setSips] = useState([]);
  const [triggers, setTriggers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  
  const [tab, setTab] = useState('sips'); // 'sips' | 'triggers' | 'explore'
  const [sipModalOpen, setSipModalOpen] = useState(false);
  const [editSip, setEditSip] = useState(null); 
  
  const [showSipGuide, setShowSipGuide] = useState(false);
  const [showTriggersGuide, setShowTriggersGuide] = useState(false);

  const containerRef = useRef(null);
  const bgRef = useRef(null);

  useEffect(() => {
    const handleScroll = (e) => {
      if (!bgRef.current) return;
      const target = e.target;
      // Get the scroll position natively without crashing
      const scrollY = target.scrollTop ?? window.scrollY ?? 0;
      if (typeof scrollY === 'number') {
        gsap.to(bgRef.current, { 
          y: scrollY * 0.4, 
          scale: 1 + scrollY * 0.0005, // Slight zoom-in while scrolling
          duration: 0.1, 
          ease: 'none',
          overwrite: 'auto'
        });
      }
    };
    
    // Use capture phase to catch scroll events from any deeply nested scrollable container
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      // Create a staggering fade-up and tilt-in cascade for all cards in the new tab
      const q = gsap.utils.selector(containerRef);
      gsap.fromTo(q(".glass-card, .widget-header"), 
        { opacity: 0, y: 40, scale: 0.95 }, 
        { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.05, ease: "back.out(1.2)", clearProps: 'all' }
      );
    }
  }, [tab]);

  async function fetchData() {
    try {
      const [sRes, tRes, aRes] = await Promise.all([
        investAPI.getSips(),
        investAPI.getTriggers(),
        investAPI.getAnalytics()
      ]);
      setSips(sRes.data.sips || []);
      setTriggers(tRes.data.triggers || []);
      setAnalytics(aRes.data.analytics || null);
    } catch (e) {
      console.error(e);
    }
  }

  const handleSipCreated = async (sipData) => {
    try {
      await investAPI.createSip(sipData);
      setSipModalOpen(false);
      fetchData();
    } catch (e) {
      console.error("Failed to post SIP:", e);
      alert("Error setting up AutoPay. Please try again.");
    }
  };

  const handleToggleTrigger = async (type, active) => {
    let config = {};
    if (type === 'round_up') config = { roundTo: 50 };
    if (type === 'guilt_free') config = { zomato: 20, swiggy: 20, blinkit: 10 };
    if (type === 'entertainment_tax') config = { netflix: 50, spotify: 20 };
    if (type === 'cashback_sweep') config = { threshold: 50 };

    await investAPI.toggleTrigger(type, { active, config });
    fetchData();
  };

  const togglePauseSIP = async (sip) => {
    const newStatus = sip.status === 'Paused' ? 'Active' : 'Paused';
    await investAPI.updateSip(sip._id, { status: newStatus });
    fetchData();
  };

  return (
    <div className="dashboard" style={{ position: 'relative' }}>
      {/* Premium Finance Background with GSAP Parallax */}
      <div 
        ref={bgRef}
        style={{
          position: 'absolute',
          top: -100, // Starts slightly higher to allow downward scrolling
          left: 0,
          right: 0,
          height: '150vh', // Extra height to cover scrolling distances safely
          backgroundImage: 'url("/images/invest_bg.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.35, // Premium transparency
          zIndex: -1,
          pointerEvents: 'none'
        }}
      />
      <div className="topbar">
        <h2>InvestPro</h2>
        <div className="user-profile">
          <div className="avatar">{user.name.charAt(0)}</div>
          <span>{user.name}</span>
        </div>
      </div>

      <div className="dash-row" style={{ marginBottom: '24px' }}>
        <button className={`glass-card ${tab==='sips'?'active':''}`} onClick={()=>setTab('sips')} 
                style={{ flex: 1, padding: '24px', textAlign: 'center', borderColor: tab==='sips'?'var(--accent)':'transparent' }}>
          <h3 style={{ fontSize: '20px' }}>📅 SIP Automation</h3>
          <p style={{ color: '#B4B4C4', marginTop: '8px' }}>Invest regularly, grow steadily</p>
        </button>
        <button className={`glass-card ${tab==='triggers'?'active':''}`} onClick={()=>setTab('triggers')}
                style={{ flex: 1, padding: '24px', textAlign: 'center', borderColor: tab==='triggers'?'var(--accent)':'transparent' }}>
          <h3 style={{ fontSize: '20px' }}>🛒 Save While Spend</h3>
          <p style={{ color: '#B4B4C4', marginTop: '8px' }}>Round-ups & cashback sweeping</p>
        </button>
        <button className={`glass-card ${tab==='explore'?'active':''}`} onClick={()=>setTab('explore')}
                style={{ flex: 1, padding: '24px', textAlign: 'center', borderColor: tab==='explore'?'var(--accent)':'transparent' }}>
          <h3 style={{ fontSize: '20px' }}><Globe2 size={20} style={{display:'inline', verticalAlign:'bottom', marginRight:'6px'}}/>Global Markets</h3>
          <p style={{ color: '#B4B4C4', marginTop: '8px' }}>Explore 27 specific sectors</p>
        </button>
      </div>

      <div ref={containerRef} style={{ position: 'relative' }}>
      {tab === 'sips' && (
        <motion.div className="tab-content" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="widget-header" style={{ marginBottom: '20px' }}>
            <h3>Your Automated SIPs</h3>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn-secondary glass-card" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => setShowSipGuide(!showSipGuide)}>
                <BookOpen size={16} color="var(--accent)" /> 
                <span>{showSipGuide ? 'Close SIP Guidelines' : '📖 SIP Guidelines'}</span>
              </button>
              <button className="btn-add" onClick={() => setSipModalOpen(true)}><Plus size={16}/> Create New SIP</button>
            </div>
          </div>

          {showSipGuide && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ overflow: 'hidden', paddingBottom: '24px' }}>
              <div className="glass-card" style={{ padding: '32px', marginBottom: '20px', background: 'linear-gradient(145deg, rgba(108,59,238,0.1), rgba(0,0,0,0.2))' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                  <div style={{ width: '56px', height: '56px', background: 'var(--accent)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><BookOpen size={28} color="#fff" /></div>
                  <div><h1 style={{ fontSize: '28px', margin: 0 }}>What is a SIP?</h1><p style={{ color: 'var(--accent-2)', margin: 0, fontWeight: '600' }}>Systematic Investment Plan</p></div>
                </div>
                <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#E0E0E0' }}>A SIP allows you to invest a fixed amount regularly (daily, monthly, or yearly) in mutual funds or ETFs. Instead of trying to time the market, SIP ensures you buy more units when the market is low and fewer when the market is high—a concept known as <strong>Rupee Cost Averaging</strong>.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                <div className="glass-card" style={{ padding: '24px' }}><TrendingUp size={32} color="var(--green)" style={{ marginBottom: '16px' }} /><h3 style={{ fontSize: '18px', marginBottom: '8px' }}>Power of Compounding</h3><p style={{ fontSize: '14px', color: '#B4B4C4', lineHeight: '1.5' }}>When you stay invested, your returns start generating their own returns over a 10+ year horizon.</p></div>
                <div className="glass-card" style={{ padding: '24px' }}><ShieldCheck size={32} color="var(--blue)" style={{ marginBottom: '16px' }} /><h3 style={{ fontSize: '18px', marginBottom: '8px' }}>Rupee Cost Averaging</h3><p style={{ fontSize: '14px', color: '#B4B4C4', lineHeight: '1.5' }}>By investing a fixed amount consistently, you automatically buy at an average cost, entirely eliminating the need to "time the market".</p></div>
                <div className="glass-card" style={{ padding: '24px' }}><Zap size={32} color="var(--amber)" style={{ marginBottom: '16px' }} /><h3 style={{ fontSize: '18px', marginBottom: '8px' }}>Discipline First</h3><p style={{ fontSize: '14px', color: '#B4B4C4', lineHeight: '1.5' }}>With auto-pay mandates, the money is invested before you can spend it. Financial discipline becomes automatic.</p></div>
              </div>

              <div className="glass-card" style={{ padding: '32px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
                  <div><h3 style={{ fontSize: '22px', marginBottom: '8px' }}>The Magic of Time</h3><p style={{ color: '#B4B4C4', fontSize: '14px' }}>Investing ₹10,000/month at 12% expected returns</p></div>
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '12px', height: '12px', background: '#3B82F6', borderRadius: '50%' }}></div><span style={{ fontSize: '12px' }}>Total Invested</span></div>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '12px', height: '12px', background: '#EC4899', borderRadius: '50%' }}></div><span style={{ fontSize: '12px' }}>FD Value (7%)</span></div>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '12px', height: '12px', background: '#F59E0B', borderRadius: '50%' }}></div><span style={{ fontSize: '12px' }}>Index Fund (12%)</span></div>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={sipData}>
                    <XAxis dataKey="year" stroke="#B4B4C4" tick={{fontSize: 12}} />
                    <YAxis tickFormatter={(val) => `₹${val/100000}L`} stroke="#B4B4C4" tick={{fontSize: 12}} />
                    <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: '8px' }} />
                    <Area type="monotone" dataKey="amount" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
                    <Area type="monotone" dataKey="fd" stackId="2" stroke="#EC4899" fill="#EC4899" fillOpacity={0.3} />
                    <Area type="monotone" dataKey="value" stackId="3" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.8} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="glass-card" style={{ padding: '32px', marginBottom: '0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                  <PieChart size={24} color="var(--accent)" />
                  <h3 style={{ fontSize: '22px', margin: 0 }}>Understanding Index Funds</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', borderLeft: '4px solid var(--accent)' }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>What is an Index Fund?</h4>
                    <p style={{ margin: 0, fontSize: '14px', color: '#B4B4C4', lineHeight: '1.6' }}>Instead of a human manager guessing which stocks will go up, an Index Fund simply copies a market index (like the Nifty 50, which holds the top 50 companies in India). Because no active research is needed, they are extremely cheap to run.</p>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px' }}><p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#8A8A9E', textTransform: 'uppercase' }}>Expense Ratio</p><p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5' }}>The annual fee charged by the fund. Lower is better. Index funds usually charge around 0.1% to 0.2%.</p></div>
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px' }}><p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#8A8A9E', textTransform: 'uppercase' }}>CAGR</p><p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5' }}>Compound Annual Growth Rate. It represents the smooth average annual return you get over a given period (e.g. 3 years).</p></div>
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px' }}><p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#8A8A9E', textTransform: 'uppercase' }}>Tracking Error</p><p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5' }}>Measures how perfectly the fund copies its index. You always want a "Low" tracking error for an index fund.</p></div>
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'center', marginTop: '24px' }}>
                <button className="btn-secondary" onClick={() => setShowSipGuide(false)} style={{ padding: '10px 24px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                   <ChevronUp size={16} /> Hide SIP Guidelines
                </button>
              </div>
            </motion.div>
          )}
          
          <div className="dash-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
             {sips.map(sip => (
               <div key={sip._id} className="glass-card" style={{ padding: '20px' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                   <div>
                     <h4 style={{ margin: '0 0 4px', fontSize: '16px' }}>{sip.assetName}</h4>
                     <span style={{ fontSize: '11px', color: '#B4B4C4', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>
                       {sip.assetClass} | {sip.frequency}
                     </span>
                   </div>
                   <div style={{ textAlign: 'right' }}>
                     <h4 style={{ margin: '0 0 4px', color: 'var(--green)' }}>₹{sip.amount.toLocaleString()}</h4>
                     <p style={{ margin: 0, fontSize: '11px', color: '#B4B4C4' }}>Escalation: {sip.autoEscalation}%</p>
                   </div>
                 </div>

                 <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', background: 'rgba(0,0,0,0.2)', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px' }}>
                   <div style={{ textAlign: 'left' }}>
                     <p style={{ fontSize: '9px', color: '#8A8A9E', margin: '0 0 4px', textTransform: 'uppercase' }}>3Y CAGR</p>
                     <p style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--green)', margin: 0 }}>{sip.cagr || '-'}</p>
                   </div>
                   <div style={{ textAlign: 'left' }}>
                     <p style={{ fontSize: '9px', color: '#8A8A9E', margin: '0 0 4px', textTransform: 'uppercase' }}>Exp. Ratio</p>
                     <p style={{ fontSize: '12px', margin: 0 }}>{sip.expenseRatio || '-'}</p>
                   </div>
                   <div style={{ textAlign: 'left' }}>
                     <p style={{ fontSize: '9px', color: '#8A8A9E', margin: '0 0 4px', textTransform: 'uppercase' }}>Err. %</p>
                     <p style={{ fontSize: '12px', margin: 0 }}>{sip.trackingError || '-'}</p>
                   </div>
                 </div>
                 
                 <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', marginBottom: '16px', overflow: 'hidden' }}>
                    <div style={{ width: '15%', height: '100%', background: sip.status === 'Paused' ? '#B4B4C4' : 'var(--accent)' }} />
                 </div>
                 
                 <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px' }}>
                    <button className="btn-text" style={{ fontSize: '12px', color: sip.status === 'Paused' ? 'var(--green)' : '' }} onClick={() => togglePauseSIP(sip)}>
                      {sip.status === 'Paused' ? <><Play size={14}/> Resume</> : <><Pause size={14}/> Pause</>}
                    </button>
                    <button className="btn-text" style={{ fontSize: '12px' }} onClick={() => setEditSip(sip)}><Settings2 size={14}/> Edit</button>
                    <button className="btn-text" style={{ fontSize: '12px', color: 'var(--accent)' }} onClick={() => investAPI.deleteSip(sip._id).then(fetchData)}><Ban size={14}/> Stop</button>
                 </div>
               </div>
             ))}
             {sips.length === 0 && (
               <div style={{ gridColumn: '1 / -1', padding: '60px 0', textAlign: 'center', opacity: 0.6 }}>
                 <p>No SIPs active right now.</p>
               </div>
             )}
          </div>
        </motion.div>
      )}

      {tab === 'triggers' && (
        <motion.div className="tab-content" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="widget-header" style={{ marginBottom: '20px' }}>
            <h3>Behavioral Saving Triggers</h3>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <p style={{ color: '#B4B4C4', fontSize: '13px', margin: 0 }}>Evaluated instantly off your actual banking transactions.</p>
              <button className="btn-secondary glass-card" style={{ padding: '6px 16px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }} onClick={() => setShowTriggersGuide(!showTriggersGuide)}>
                <BookOpen size={14} color="var(--green)" /> 
                <span style={{ fontSize: '13px' }}>{showTriggersGuide ? 'Close Guidelines' : '📖 Guidelines'}</span>
              </button>
            </div>
          </div>

          {showTriggersGuide && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ overflow: 'hidden', paddingBottom: '24px' }}>
              <div className="glass-card" style={{ padding: '32px', marginBottom: '0', background: 'linear-gradient(145deg, rgba(16,185,129,0.1), rgba(0,0,0,0.2))' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                  <div style={{ width: '56px', height: '56px', background: 'var(--green)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Zap size={28} color="#fff" /></div>
                  <div><h1 style={{ fontSize: '28px', margin: 0 }}>Behavioral Micro-Investing</h1><p style={{ color: 'var(--green)', margin: 0, fontWeight: '600' }}>Hacking your "Pain of Paying"</p></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '24px' }}>
                  <div>
                    <h4 style={{ fontSize: '18px', marginBottom: '12px', color: '#fff' }}>1. Frictionless Wealth</h4>
                    <p style={{ fontSize: '15px', lineHeight: '1.6', color: '#B4B4C4' }}>The biggest barrier to investing is the psychological friction of moving "large" chunks of money (₹5000+). By saving pennies in the background (₹12 here, ₹20 there) continuously triggered by your actual habits, you bypass this psychological friction completely and quietly build massive wealth.</p>
                  </div>
                  <div>
                    <h4 style={{ fontSize: '18px', marginBottom: '12px', color: '#fff' }}>2. Guilt-Free Taxes</h4>
                    <p style={{ fontSize: '15px', lineHeight: '1.6', color: '#B4B4C4' }}>Do you feel bad ordering junk food on Swiggy? Turn it into a wealth-building event. Set a "Guilt-Free Tax" to instantly sweep ₹20 into an Index Fund. Over 5 years of weekend deliveries, this single habit alone typically extracts and compounds into ₹1,00,000+ without you ever feeling the pinch.</p>
                  </div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(16,185,129,0.2)' }}>
                  <p style={{ margin: 0, color: '#E0E0E0', fontSize: '14px', lineHeight: 1.6 }}><strong>Security Note:</strong> Nexus connects securely directly to your banking data feeds using Plaid. Transactions are processed on the frontend, and amounts are aggregated securely on our Node.js platform.</p>
                </div>
              </div>
              
              <div style={{ textAlign: 'center', marginTop: '24px' }}>
                <button className="btn-secondary" onClick={() => setShowTriggersGuide(false)} style={{ padding: '10px 24px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                   <ChevronUp size={16} /> Hide Triggers Guidelines
                </button>
              </div>
            </motion.div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '20px' }}>
            {[
              { id: 'round_up', icon: '💰', title: 'Round-Up Saver', desc: 'Rounds every purchase to nearest ₹50 and saves the difference.', an: analytics?.round_up },
              { id: 'guilt_free', icon: '🍕', title: 'Guilt-Free Spend Saver', desc: 'Saves ₹20 every time you order from Zomato, Swiggy or Blinkit.', an: analytics?.guilt_free },
              { id: 'entertainment_tax', icon: '🎬', title: 'Entertainment Tax Saver', desc: 'Saves ₹50 whenever you pay for Netflix, Spotify, or Movies.', an: analytics?.entertainment },
              { id: 'cashback_sweep', icon: '🛍️', title: 'Cashback Sweeper', desc: 'Instantly sweeps any cashback or refunds into your mutual funds.', an: analytics?.cashback },
            ].map(trig => {
              const activeInfo = triggers.find(t => t.triggerType === trig.id);
              const isActive = activeInfo?.active;

              return (
                <div key={trig.id} className="glass-card" style={{ padding: '24px', borderColor: isActive ? 'var(--accent)' : 'transparent', position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{trig.icon}</span> {trig.title}
                      </h3>
                      <p style={{ fontSize: '13px', color: '#B4B4C4', marginTop: '8px', marginBottom: '20px', lineHeight: 1.4 }}>
                        {trig.desc}
                      </p>
                    </div>
                    <div className="toggle-switch" style={{ marginLeft: '16px', background: isActive ? 'var(--accent)' : 'rgba(255,255,255,0.1)', width: '44px', height: '24px', borderRadius: '12px', position: 'relative', cursor: 'pointer' }}
                         onClick={() => handleToggleTrigger(trig.id, !isActive)}>
                      <motion.div style={{ background: '#fff', width: '20px', height: '20px', borderRadius: '10px', position: 'absolute', top: '2px' }}
                                  animate={{ left: isActive ? '22px' : '2px' }} transition={{ type: 'spring', stiffness: 500, damping: 30 }} />
                    </div>
                  </div>

                  {isActive && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px', marginTop: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <div>
                          <p style={{ fontSize: '11px', color: '#B4B4C4', margin: 0 }}>Total Saved (30 Days)</p>
                          <p style={{ fontSize: '20px', fontWeight: 'bold', margin: '4px 0 0', color: 'var(--green)' }}>₹{trig.an?.totalSaved?.toLocaleString() || 0}</p>
                        </div>
                      </div>
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px', maxHeight: '120px', overflowY: 'auto' }}>
                        <p style={{ fontSize: '10px', color: '#9A9AB0', textTransform: 'uppercase', marginBottom: '8px' }}>Recent Extractions</p>
                        {trig.an?.items?.length > 0 ? trig.an.items.map((item, i) => (
                           <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '12px' }}>
                             <span style={{ color: '#C8C8D8' }}>{item.name}</span>
                             <span style={{ color: 'var(--green)' }}>+₹{item.saved || item.penalty}</span>
                           </div>
                        )) : <p style={{ fontSize: '12px', color: '#8A8A9E' }}>No matching transactions found recently.</p>}
                      </div>
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      </div>

      {tab === 'explore' && (
        <StockExplore />
      )}


      <SipStepperModal open={sipModalOpen} onClose={() => setSipModalOpen(false)} onSubmit={handleSipCreated} />
      <EditSipModal open={!!editSip} sip={editSip} onClose={() => setEditSip(null)} onSuccess={fetchData} />
    </div>
  );
}
