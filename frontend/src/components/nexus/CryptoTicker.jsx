import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Zap } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';

const COIN_IDS = ['bitcoin', 'ethereum', 'solana', 'binancecoin'];
const COIN_LABELS = { bitcoin: 'BTC', ethereum: 'ETH', solana: 'SOL', binancecoin: 'BNB' };

function CryptoChip({ coin, livePrice }) {
  const live = livePrice?.[coin.id];
  const price  = live?.usd ?? coin.current_price;
  const change = live?.usd_24h_change ?? coin.price_change_percentage_24h;
  const isPos  = change >= 0;

  return (
    <div className="crypto-chip">
      <img src={coin.image} alt={coin.symbol} className="crypto-img" />
      <div className="crypto-info">
        <span className="crypto-sym">{coin.symbol?.toUpperCase()}</span>
        <span className="crypto-name">{coin.name}</span>
      </div>
      <div className="crypto-right">
        <span className="crypto-price">${price?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        <span className={`crypto-chg ${isPos ? 'positive' : 'negative'}`}>
          {isPos ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
          {Math.abs(change).toFixed(2)}%
        </span>
      </div>
    </div>
  );
}

export default function CryptoTicker({ crypto, loading }) {
  const { tick } = useSocket();
  const livePrice = tick?.prices;

  const trackRef = useRef(null);

  // Auto-scroll animation via CSS
  useEffect(() => {
    const el = trackRef.current;
    if (!el || loading || !crypto?.length) return;
    // Duplicate the items for seamless loop
    el.innerHTML += el.innerHTML;
  }, [crypto, loading]);

  if (loading) return (
    <div className="glass-card widget ticker-widget">
      <div className="widget-header">
        <p className="widget-label">Live Crypto</p>
        <span className="live-dot" />
      </div>
      <div className="ticker-loading">Loading prices…</div>
    </div>
  );

  return (
    <div className="glass-card widget ticker-widget">
      <div className="widget-header">
        <div className="ticker-title-row">
          <Zap size={14} className="zap-icon" />
          <p className="widget-label">Live Crypto</p>
        </div>
        <span className="live-pill">LIVE</span>
      </div>

      <div className="ticker-scroll-wrap">
        <div className="ticker-track" ref={trackRef}>
          {(crypto || []).map((coin) => (
            <CryptoChip key={coin.id} coin={coin} livePrice={livePrice} />
          ))}
        </div>
      </div>
    </div>
  );
}
