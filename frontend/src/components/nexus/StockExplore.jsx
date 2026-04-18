import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Search, ChevronRight, ArrowLeft, Star, TrendingUp, ShieldCheck, CheckCircle, Bookmark, Wallet, Lightbulb, BookOpen, ChevronUp, BarChart2 } from 'lucide-react';
import gsap from 'gsap';
import confetti from 'canvas-confetti';
import axios from 'axios';
import { investAPI } from '../../services/api';

const FINNHUB_KEY = import.meta.env.VITE_FINNHUB_API_KEY || 'd7finm9r01qpjqqkv9l0d7finm9r01qpjqqkv9lg';

// --- SECTORS MAPPING ---
const SECTORS = {
  "Tech Giants":      ["AAPL", "MSFT", "GOOGL", "NVDA", "AMZN", "META", "AVGO", "CSCO", "ORCL", "ADBE"],
  "Software & SaaS":  ["CRM", "INTU", "NOW", "SNOW", "WDAY", "TEAM", "ADSK", "PANW", "FTNT", "DDOG"],
  "Semiconductors":   ["NVDA", "AMD", "INTC", "TSM", "ARM", "AVGO", "QCOM", "AMAT", "MU", "LRCX"],
  "Fintech":          ["V", "MA", "PYPL", "SQ", "COIN", "HOOD", "AFRM", "SOFI", "GPN", "FIS"],
  "E-commerce":       ["AMZN", "MELI", "EBAY", "ETSY", "SHOP", "PDD", "JD", "BABA", "SE", "CHWY"],
  "AI & Robotics":    ["NVDA", "PLTR", "PATH", "GOOGL", "MSFT", "AMD", "TSLA", "ISRG", "TER", "MZ"],
  "Cloud Computing":  ["AMZN", "MSFT", "GOOGL", "SNOW", "MDB", "NET", "DDOG", "OKTA", "ZS", "CRWD"],
  "Social Media":     ["META", "SNAP", "PINS", "GOOGL", "MTCH", "GRPN", "YELP", "RDDT", "BILI", "TME"],
  "EV Future":        ["TSLA", "RIVN", "LCID", "NIO", "XPEV", "LI", "BYDDF", "F", "GM", "STLA"],
  "Clean Energy":     ["ENPH", "FSLR", "SEDG", "RUN", "PLUG", "BE", "NEE", "CSIQ", "CHPT", "BLNK"],
  "Aerospace":        ["BA", "LMT", "RTX", "GD", "NOC", "LHX", "TDG", "TXT", "BWXT", "SPCE"],
  "Global Banking":   ["JPM", "BAC", "WFC", "C", "GS", "MS", "HSBC", "UBS", "RY", "TD"],
  "Big Pharma":       ["PFE", "JNJ", "MRK", "ABBV", "LLY", "NVO", "AZN", "SNY", "GSK", "BMY"],
  "Biotech":          ["AMGN", "GILD", "BIIB", "REGN", "VRTX", "MRNA", "BNTX", "ILMN", "SGEN", "ALNY"],
  "Healthcare":       ["UNH", "CVS", "ELV", "CI", "HCA", "HUM", "MCK", "ABC", "CAH", "ISRG"],
  "Consumer Goods":   ["PG", "KO", "PEP", "PM", "MO", "UL", "EL", "CL", "KMB", "GIS"],
  "Retail Leaders":   ["WMT", "COST", "TGT", "HD", "LOW", "TJX", "ROSS", "DLTR", "DG", "LULU"],
  "Streaming":        ["NFLX", "DIS", "WBD", "PARA", "SPOT", "ROKU", "AMZN", "AAPL", "GOOGL", "LYV"],
  "Luxury Goods":     ["LVMHF", "RMSFR", "CPRI", "TPR", "RL", "EL", "TIF", "VFC", "SNA", "SIG"],
  "Travel":           ["BKNG", "ABNB", "MAR", "HLT", "EXPE", "DAL", "UAL", "AAL", "LUV", "CCL"],
  "Food & Bev":       ["SBUX", "MCD", "CMG", "YUM", "DPZ", "DRI", "KHC", "MDLZ", "STZ", "BUD"],
  "Energy & Oil":     ["XOM", "CVX", "SHEL", "TTE", "BP", "COP", "EOG", "SLB", "HAL", "MPC"],
  "REITs":            ["PLD", "AMT", "EQIX", "DLR", "CCI", "PSA", "O", "VICI", "WELL", "AVB"],
  "Insurance":        ["BRK-B", "UNH", "PGR", "MET", "PRU", "AIG", "ALL", "TRV", "CB", "AFL"],
  "Logistics":        ["UPS", "FDX", "UNP", "CSX", "NSC", "ODFL", "EXPD", "HUBG", "CHRW", "JBHT"],
  "Analyst Picks":    ["AAPL", "NVDA", "MSFT", "AMZN", "META", "TSLA", "GOOGL", "AVGO", "LLY", "TSM"],
  "Top Gainers":       ["NVDA", "AMD", "SMCI", "ARM", "PLTR", "META", "TSLA", "MSTR", "COIN", "MARA"]
};

// --- DATA LAYER ---
const getMockPrice = (ticker) => {
  const hash = ticker.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const base = 50 + (hash % 400); 
  const change = ((hash % 100) / 10) - 4; 
  return { c: base, d: base * (change/100), dp: change };
};

const fetchQuote = async (ticker) => {
  try {
    const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${FINNHUB_KEY}`);
    const data = await res.json();
    if (data.c === 0) throw new Error();
    return { c: data.c, d: data.d, dp: data.dp };
  } catch (err) {
    return getMockPrice(ticker);
  }
};

const fetchCandles = async (ticker, resolution, from, to) => {
  try {
    const res = await fetch(`https://finnhub.io/api/v1/stock/candle?symbol=${ticker}&resolution=${resolution}&from=${from}&to=${to}&token=${FINNHUB_KEY}`);
    const data = await res.json();
    if (data.s !== 'ok' || !data.c) throw new Error('Invalid candle data');
    return data.c.map((price, i) => ({ time: data.t[i], price }));
  } catch (e) {
    console.warn(`Falling back to mock candles for ${ticker}`);
    const mock = [];
    const hash = ticker.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    let cur = (50 + (hash % 400)) * 0.95; 
    for (let i = 0; i < 60; i++) {
      cur *= (1 + (Math.random() * 0.03 - 0.012));
      mock.push({ time: i, price: cur });
    }
    return mock;
  }
};

const fetchFinancials = async (ticker) => {
  try {
    const res = await fetch(`https://finnhub.io/api/v1/stock/metric?symbol=${ticker}&metric=all&token=${FINNHUB_KEY}`);
    const data = await res.json();
    return data.metric;
  } catch (e) {
    const p = getMockPrice(ticker);
    return { '52WeekHigh': p.c * 1.2, '52WeekLow': p.c * 0.8, 'marketCapitalization': 150000, 'peNormalizedAnnual': 22.5 };
  }
};

const colors = {
  bg: 'transparent',
  card: 'rgba(255,255,255,0.03)',
  text: '#FFFFFF',
  subText: '#B4B4C4',
  green: '#10B981',
  red: '#FF3B30',
  gold: '#F0B429',
  cta: 'var(--accent)',
  border: 'rgba(255,255,255,0.1)'
};

const typography = {
  mono: "'Space Grotesk', sans-serif"
};

const SparklineSVG = ({ data, isPositive }) => {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 30 - ((d - min) / (max - min || 1)) * 30;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width="100" height="30" viewBox="0 0 100 30">
      <polyline fill="none" stroke={isPositive ? colors.green : colors.red} strokeWidth="2" points={points} />
    </svg>
  );
};

export default function StockExplore() {
  const [activeTab, setActiveTab] = useState("My Portfolio");
  const [prices, setPrices] = useState({});
  const [portfolio, setPortfolio] = useState({ holdings: [], walletBalance: 0 });
  const [loading, setLoading] = useState(true);
  const [detailTicker, setDetailTicker] = useState(null);
  const [showMarketGuide, setShowMarketGuide] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!loading && portfolio.holdings) {
      gsap.fromTo(".stock-card", 
        { opacity: 0, y: 30, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.05, ease: "back.out(1.4)", clearProps: 'all' }
      );
    }
  }, [activeTab, loading, portfolio]);

  const fetchPortfolio = async () => {
    try {
      const res = await investAPI.getPortfolio();
      setPortfolio(res.data);
    } catch (e) {
      console.error('Portfolio fetch failed');
    }
  };

  useEffect(() => {
    fetchPortfolio();
    window.addEventListener('nexus-reload-data', fetchPortfolio);
    return () => window.removeEventListener('nexus-reload-data', fetchPortfolio);
  }, []);

  const currentTabStocks = useMemo(() => {
    if (activeTab === "My Portfolio") {
      return portfolio.holdings.map(h => h.symbol);
    }
    return SECTORS[activeTab] || [];
  }, [activeTab, portfolio]);

  useEffect(() => {
    const loadPrices = async () => {
      setLoading(true);
      const results = await Promise.all(currentTabStocks.map(async t => ({ ticker: t, quote: await fetchQuote(t) })));
      const newPrices = {};
      results.forEach(r => newPrices[r.ticker] = r.quote);
      setPrices(newPrices);
      setLoading(false);
    };
    if (currentTabStocks.length > 0) loadPrices();
    else setLoading(false);
  }, [activeTab, currentTabStocks]);

  const tabs = ["My Portfolio", ...Object.keys(SECTORS)];

  const portfolioStats = useMemo(() => {
    let totalValue = 0;
    let totalPnL = 0;
    portfolio.holdings.forEach(h => {
      const price = (prices[h.symbol]?.c || h.avgPrice);
      totalValue += price * h.quantity;
      totalPnL += (price - h.avgPrice) * h.quantity;
    });
    return { totalValue, totalPnL, wallet: portfolio.walletBalance };
  }, [portfolio, prices]);

  return (
    <div style={{ color: colors.text, display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      <div style={{ padding: '24px 20px', background: 'rgba(10,10,15,0.8)', backdropFilter: 'blur(10px)', zIndex: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 800, margin: 0 }}>InvestPro</h2>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '10px', color: colors.subText, display: 'block' }}>BUYING POWER</span>
            <span style={{ fontSize: '18px', fontWeight: 800, color: colors.green }}>${(portfolio.walletBalance || 0).toLocaleString()}</span>
          </div>
        </div>
        <div style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '16px', top: '14px', color: colors.subText }} />
          <input type="text" placeholder="Search 5,000+ symbols..." style={{
            width: '100%', padding: '14px 16px 14px 44px', background: 'rgba(255,255,255,0.05)', border: `1px solid ${colors.border}`, borderRadius: '12px', color: '#fff', outline: 'none'
          }}/>
        </div>
      </div>

      <div ref={containerRef} style={{ padding: '0 20px 24px', overflowY: 'auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', marginBottom: '16px' }}>
          <p style={{ color: colors.subText, fontSize: '13px', margin: 0 }}></p>
          <button className="btn-secondary glass-card" style={{ padding: '6px 16px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', border: '1px solid #3B82F6' }} onClick={() => setShowMarketGuide(!showMarketGuide)}>
            <BookOpen size={14} color="#3B82F6" /> 
            <span style={{ fontSize: '13px' }}>{showMarketGuide ? 'Close Market Guidelines' : '📖 Market Guidelines'}</span>
          </button>
        </div>

        {showMarketGuide && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ overflow: 'hidden', paddingBottom: '24px' }}>
              <div className="glass-card" style={{ padding: '32px', marginBottom: '0', background: 'linear-gradient(145deg, rgba(59,130,246,0.1), rgba(0,0,0,0.2))' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                  <div style={{ width: '56px', height: '56px', background: '#3B82F6', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><BarChart2 size={28} color="#fff" /></div>
                  <div><h1 style={{ fontSize: '28px', margin: 0 }}>Stock Brokerage 101</h1><p style={{ color: '#3B82F6', margin: 0, fontWeight: '600' }}>Master the Global Markets</p></div>
                </div>
                
                <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#E0E0E0', marginBottom: '32px' }}>Welcome to the Nexus Brokerage. Here, you can actively invest your Buying Power directly into individual companies. Unlike SIP index funds which run on autopilot, this module gives you direct control over your asset allocation.</p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '24px' }}>
                  <div>
                    <h4 style={{ fontSize: '18px', marginBottom: '12px', color: '#fff' }}>1. Fractional Shares</h4>
                    <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#B4B4C4' }}>You don't need huge capital to buy premium stocks. Even if AAPL trades at $300, Nexus allows you to buy exactly $10 worth (resulting in e.g. 0.033 shares) smoothly using fractional trading algorithms. Democratized access for all.</p>
                  </div>
                  <div>
                    <h4 style={{ fontSize: '18px', marginBottom: '12px', color: '#fff' }}>2. Market Dynamics (Bid/Ask)</h4>
                    <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#B4B4C4' }}>A stock price isn't set by the company; it's set by matching buyers (Bids) with sellers (Asks). If there are more buyers than sellers, the price rises. That's why prices update dynamically by the millisecond.</p>
                  </div>
                  <div>
                    <h4 style={{ fontSize: '18px', marginBottom: '12px', color: '#fff' }}>3. Diversification is Key</h4>
                    <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#B4B4C4' }}>Never put all your eggs in one basket. By browsing our 27 different sectors (Tech, Pharma, Green Energy, Retail, AI), you can ensure that a crash in one industry doesn't wipe out your whole portfolio.</p>
                  </div>
                </div>
                
                <h4 style={{ fontSize: '18px', marginBottom: '12px', color: '#fff', marginTop: '32px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>Key Metrics Explained</h4>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '150px', background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(59,130,246,0.2)' }}>
                     <p style={{ fontSize: '11px', color: '#8A8A9E', margin: '0 0 6px', textTransform: 'uppercase', fontWeight: 700 }}>Unrealized P&L</p>
                     <p style={{ fontSize: '13px', color: '#E0E0E0', margin: 0, lineHeight: 1.4 }}>The profit or loss you <em>would</em> execute if you sold all your current holdings immediately. It isn't "real" until you hit Sell.</p>
                  </div>
                  <div style={{ flex: 1, minWidth: '150px', background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(59,130,246,0.2)' }}>
                     <p style={{ fontSize: '11px', color: '#8A8A9E', margin: '0 0 6px', textTransform: 'uppercase', fontWeight: 700 }}>P/E Ratio</p>
                     <p style={{ fontSize: '13px', color: '#E0E0E0', margin: 0, lineHeight: 1.4 }}>Price-to-Earnings Ratio. Tells you how much you are paying for $1 of company earnings. High P/E usually means high future growth expectations.</p>
                  </div>
                  <div style={{ flex: 1, minWidth: '150px', background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(59,130,246,0.2)' }}>
                     <p style={{ fontSize: '11px', color: '#8A8A9E', margin: '0 0 6px', textTransform: 'uppercase', fontWeight: 700 }}>52-Week High</p>
                     <p style={{ fontSize: '13px', color: '#E0E0E0', margin: 0, lineHeight: 1.4 }}>The highest price the stock has fetched in the last calendar year. Helps map how 'expensive' it is historically.</p>
                  </div>
                </div>
              </div>
              
              <div style={{ textAlign: 'center', marginTop: '24px' }}>
                <button className="btn-secondary" onClick={() => setShowMarketGuide(false)} style={{ padding: '10px 24px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                   <ChevronUp size={16} /> Hide Market Guidelines
                </button>
              </div>
            </motion.div>
        )}

        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', margin: '24px 0', scrollbarWidth: 'none' }}>
          {tabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              whiteSpace: 'nowrap', padding: '8px 16px', borderRadius: '20px', border: `1px solid ${activeTab === tab ? colors.cta : colors.border}`,
              background: activeTab === tab ? colors.cta : 'transparent', color: '#fff', fontWeight: 600, cursor: 'pointer'
            }}>{tab}</button>
          ))}
        </div>

        {activeTab === "My Portfolio" && !loading && portfolio.holdings.length > 0 && (
          <div style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(10,10,15,0) 100%)', padding: '20px', borderRadius: '16px', border: `1px solid ${colors.green}44`, marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '12px', color: colors.subText }}>TOTAL PORTFOLIO VALUE</div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#fff' }}>${portfolioStats.totalValue.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '12px', color: colors.subText }}>UNREALIZED P&L</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: portfolioStats.totalPnL >= 0 ? colors.green : colors.red }}>
                {portfolioStats.totalPnL >= 0 ? '+' : ''}${Math.abs(portfolioStats.totalPnL).toLocaleString(undefined, {minimumFractionDigits: 2})}
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px' }}>
            {[1,2,3,4,5,6].map(i => <div key={i} style={{ height: '150px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', animation: 'pulse 1.5s infinite' }} />)}
          </div>
        ) : currentTabStocks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', opacity: 0.5 }}>No holdings found. Start investing in Global Markets!</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px' }}>
            {currentTabStocks.map(ticker => {
              const p = prices[ticker] || getMockPrice(ticker);
              const isUp = p.dp >= 0;
              const holding = portfolio.holdings.find(h => h.symbol === ticker);
              const pnl = holding ? (p.c - holding.avgPrice) * holding.quantity : 0;
              
              return (
                <motion.div key={ticker} className="stock-card" whileHover={{ y: -5, scale: 1.02 }} 
                  onClick={() => setDetailTicker(ticker)} 
                  style={{
                    background: colors.card, border: `1px solid ${colors.border}`, borderRadius: '16px', padding: '16px', cursor: 'pointer', backdropFilter: 'blur(10px)', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
                  }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `hsl(${ticker.charCodeAt(0)*25}, 40%, 20%)`, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>{ticker.slice(0,2)}</div>
                    {holding && <div style={{ background: colors.green + '22', color: colors.green, fontSize: '10px', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>{holding.quantity} SHARES</div>}
                  </div>
                  <h4 style={{ margin: '0 0 4px', fontWeight: 700 }}>{ticker}</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '12px' }}>
                    <h5 style={{ margin: 0, fontFamily: typography.mono, fontSize: '15px' }}>
                      ${p.c.toFixed(2)} 
                      <span style={{ color: isUp ? colors.green : colors.red, fontSize: '11px', marginLeft: '6px' }}>{isUp?'+':''}{p.dp.toFixed(1)}%</span>
                    </h5>
                    {holding && (
                      <div style={{ fontSize: '10px', color: pnl >= 0 ? colors.green : colors.red, fontWeight: 700 }}>
                        {pnl >= 0 ? 'Profit: +' : 'Loss: -'}${Math.abs(pnl).toFixed(2)}
                      </div>
                    )}
                  </div>
                  <SparklineSVG data={[p.c*0.95, p.c*1.02, p.c*0.98, p.c*1.01, p.c]} isPositive={isUp} />
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {detailTicker && createPortal(
        <StockDetailSheet 
          ticker={detailTicker} 
          quote={prices[detailTicker]} 
          portfolio={portfolio} 
          fetchPortfolio={fetchPortfolio}
          onClose={() => setDetailTicker(null)} 
        />,
        document.body
      )}
    </div>
  );
}

function StockDetailSheet({ ticker, quote, portfolio, fetchPortfolio, onClose }) {
  const [tf, setTf] = useState('1Y');
  const [history, setHistory] = useState([]);
  const [financials, setFinancials] = useState(null);
  const [tradeMode, setTradeMode] = useState(null); // 'buy' | 'sell' | null
  const [buyStep, setBuyStep] = useState(0); 
  const [qty, setQty] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchFinancials(ticker).then(setFinancials);
  }, [ticker]);

  useEffect(() => {
    const to = Math.floor(Date.now() / 1000);
    const intervals = { '1D': [24*3600, '5'], '1W': [7*24*3600, '15'], '1M': [30*24*3600, '60'], '1Y': [365*24*3600, 'D'], '5Y': [1825*24*3600, 'W'] };
    const [diff, res] = intervals[tf] || intervals['1Y'];
    fetchCandles(ticker, res, to - diff, to).then(setHistory);
  }, [ticker, tf]);

  const p = quote || getMockPrice(ticker);
  const isUp = p.dp >= 0;
  const holding = portfolio.holdings.find(h => h.symbol === ticker);

  const [errorStatus, setErrorStatus] = useState(null);

  const handleTrade = async () => {
    if (qty <= 0) return;
    setIsProcessing(true);
    setErrorStatus(null);
    try {
      const orderPrice = parseFloat(p.c);
      const orderQty   = parseInt(qty);
      const payload    = { symbol: ticker, quantity: orderQty, price: orderPrice, broker: 'Nexus Direct' };

      const res = tradeMode === 'buy'
        ? await investAPI.buy(payload)
        : await investAPI.sell(payload);

      if (res.data.success) {
        setBuyStep(3);
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
        // Refresh portfolio card + transaction feed on Dashboard
        window.dispatchEvent(new CustomEvent('nexus-reload-data'));
        if (fetchPortfolio) fetchPortfolio(); // also refresh inline so "My Portfolio" tab updates immediately
      }
    } catch (e) {
      console.error('NEXUS TRANSACTION ERROR:', e.response?.data || e.message);
      const msg = e.response?.data?.error || 'Connection failure. Please try again.';
      setErrorStatus(msg);
      setBuyStep(4);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: '#0a0a0f', zIndex: 9999, display: 'flex', flexDirection: 'column', color: '#fff' }}>
      {tradeMode && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', color: '#fff' }}>
          <div style={{ width: '100%', maxWidth: '380px', background: '#1e1e2d', borderRadius: '24px', padding: '32px', border: `1px solid rgba(255,255,255,0.2)`, boxShadow: '0 50px 100px -20px rgba(0,0,0,1)', pointerEvents: 'auto' }}>
              {buyStep === 0 && (
                <div>
                   <h2 style={{ margin: '0 0 8px', textAlign: 'center', color: '#fff' }}>{tradeMode === 'buy' ? 'Buy' : 'Sell'} {ticker}</h2>
                   <p style={{ color: colors.subText, marginBottom: '24px', textAlign: 'center', fontSize: '13px' }}>
                     {tradeMode === 'buy' ? `Buying Power: $${(portfolio.walletBalance || 0).toLocaleString()}` : `Available: ${holding?.quantity || 0} shares`}
                   </p>
                   
                   <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', marginBottom: '32px' }}>
                      <button onClick={() => setQty(Math.max(1, qty-1))} style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer' }}>-</button>
                      <span style={{ fontSize: '36px', fontWeight: 800, fontFamily: typography.mono, color: '#fff' }}>{qty}</span>
                      <button onClick={() => setQty(Math.min(tradeMode === 'sell' ? (holding?.quantity || 1) : 9999, qty+1))} style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer' }}>+</button>
                   </div>
                   
                   <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '16px', marginBottom: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px', color: colors.subText }}>
                        <span>Est. Price</span>
                        <span style={{ color: '#fff', fontWeight: 600 }}>${p.c.toFixed(2)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>
                        <span style={{ fontSize: '14px', color: '#fff' }}>Total {tradeMode === 'buy' ? 'Cost' : 'Proceeds'}</span>
                        <span style={{ fontSize: '18px', fontWeight: 800, color: colors.green }}>${(p.c * qty).toFixed(2)}</span>
                      </div>
                   </div>

                   <div style={{ display: 'flex', gap: '12px' }}>
                      <button onClick={() => setTradeMode(null)} style={{ flex: 1, padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>Cancel</button>
                      <button 
                        onClick={async (e) => { e.stopPropagation(); console.log('NEXUS: Confirm Pressed'); await handleTrade(); }} 
                        disabled={isProcessing} 
                        style={{ flex: 2, padding: '14px', borderRadius: '12px', background: tradeMode === 'buy' ? colors.cta : colors.red, color: '#fff', fontWeight: 800, border: 'none', cursor: 'pointer', opacity: isProcessing ? 0.6 : 1 }}
                      >
                        {isProcessing ? 'Executing...' : `Confirm Order`}
                      </button>
                   </div>
                </div>
              )}
              {buyStep === 3 && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: colors.green, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}><CheckCircle size={32} color="#fff"/></div>
                  <h2 style={{ fontSize: '24px', marginBottom: '8px', color: '#fff' }}>Success!</h2>
                  <p style={{ color: colors.subText, marginBottom: '24px', fontSize: '14px' }}>Completed {tradeMode === 'buy' ? 'buy' : 'sell'} order of {qty} {ticker}.</p>
                  <button onClick={() => { setTradeMode(null); setBuyStep(0); onClose(); }} style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', fontWeight: 700, cursor: 'pointer' }}>Dismiss</button>
                </div>
              )}
              {buyStep === 4 && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: colors.red, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                    <ShieldCheck size={32} color="#fff"/>
                  </div>
                  <h2 style={{ fontSize: '20px', marginBottom: '8px', color: '#fff' }}>Transaction Halted</h2>
                  <p style={{ color: colors.subText, marginBottom: '24px', fontSize: '13px', lineHeight: 1.5 }}>
                    {errorStatus}<br/>
                    <span style={{ fontSize: '11px', opacity: 0.7 }}>Secure Nexus Node rejected the signature.</span>
                  </p>
                  <div style={{ display: 'flex', gap: '12px', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button onClick={() => setTradeMode(null)} style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: colors.subText, border: 'none', cursor: 'pointer' }}>Cancel</button>
                      <button onClick={() => setBuyStep(0)} style={{ flex: 2, padding: '12px', borderRadius: '12px', background: colors.red, color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer' }}>Try Again</button>
                    </div>
                    <button 
                      onClick={async () => {
                        try {
                          const res = await axios.post(`${import.meta.env.VITE_API_BASE}/invest/sync`);
                          if (res.data.success) {
                            localStorage.setItem('nx_token', res.data.token);
                            setBuyStep(0);
                            alert('Session Re-Synced Successfully');
                          }
                        } catch (e) { alert('Sync Failed'); }
                      }}
                      style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'transparent', color: colors.cta, border: `1px solid ${colors.cta}`, fontWeight: 600, cursor: 'pointer', fontSize: '12px' }}
                    >
                      Secure Session Sync
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '20px', borderBottom: `1px solid ${colors.border}`, alignItems: 'center' }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff' }}><ArrowLeft size={24}/></button>
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontWeight: 800, fontSize: '18px', display: 'block' }}>{ticker}</span>
          <span style={{ fontSize: '10px', color: colors.subText }}>NEXUS DIRECT BROKERAGE</span>
        </div>
        <div style={{ width: '24px' }}/>
      </div>

      <div style={{ padding: '20px', flex: 1, overflowY: 'auto' }}>
        <div className="detail-card" style={{ background: colors.card, padding: '24px', borderRadius: '24px', border: `1px solid ${colors.border}`, marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 style={{ fontSize: '40px', fontWeight: 800, margin: '0 0 8px', fontFamily: typography.mono }}>${p.c.toFixed(2)}</h1>
              <p style={{ color: isUp ? colors.green : colors.red, fontWeight: 700 }}>{isUp?'+':''}{p.dp.toFixed(2)}% Today</p>
            </div>
            {holding && (
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '11px', color: colors.subText, margin: '0 0 4px' }}>POSITION</p>
                <p style={{ fontSize: '18px', fontWeight: 800 }}>{holding.quantity} Shares</p>
                <p style={{ fontSize: '12px', color: colors.green }}>Avg cost: ${holding.avgPrice.toFixed(2)}</p>
              </div>
            )}
          </div>

          <div style={{ marginTop: '24px', height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                <defs><linearGradient id="c" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={isUp ? colors.green : colors.red} stopOpacity={0.3}/><stop offset="95%" stopColor={isUp ? colors.green : colors.red} stopOpacity={0}/></linearGradient></defs>
                <Area type="monotone" dataKey="price" stroke={isUp ? colors.green : colors.red} strokeWidth={3} fill="url(#c)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '12px', marginTop: '20px' }}>
            {['1D','1W','1M','1Y','5Y'].map(t => (
               <button key={t} onClick={() => setTf(t)} style={{ flex: 1, padding: '10px 0', border: 'none', background: tf === t ? 'rgba(255,255,255,0.1)' : 'transparent', borderRadius: '8px', color: '#fff', fontWeight: 700 }}>{t}</button>
            ))}
          </div>
        </div>

        <div className="detail-card" style={{ background: colors.card, padding: '24px', borderRadius: '24px', border: `1px solid ${colors.border}` }}>
             <h3 style={{ margin: '0 0 16px' }}>Market Stats</h3>
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {[ ['52W High', financials?.['52WeekHigh']], ['52W Low', financials?.['52WeekLow']], ['Market Cap', financials?.marketCapitalization], ['P/E Ratio', financials?.peNormalizedAnnual] ].map(([l,v]) => (
                  <div key={l}><span style={{ color: colors.subText, fontSize: '12px' }}>{l}</span><div style={{ fontWeight: 700, fontFamily: typography.mono }}>{typeof v === 'number' ? v.toLocaleString() : 'N/A'}</div></div>
                ))}
             </div>
        </div>
      </div>

      <div style={{ padding: '20px 24px 40px', borderTop: `1px solid ${colors.border}`, display: 'flex', gap: '16px' }}>
        {holding && (
          <button onClick={() => { setTradeMode('sell'); setQty(holding.quantity); }} style={{ flex: 1, padding: '18px', borderRadius: '16px', background: 'rgba(239, 68, 68, 0.15)', color: colors.red, border: `1px solid ${colors.red}44`, fontWeight: 800, fontSize: '16px' }}>Sell Shares</button>
        )}
        <button onClick={() => { setTradeMode('buy'); setQty(1); }} style={{ flex: 2, padding: '18px', borderRadius: '16px', background: colors.cta, color: '#fff', fontWeight: 800, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '16px' }}>
          Buy {ticker} <TrendingUp size={18}/>
        </button>
      </div>
    </div>
  );
}
