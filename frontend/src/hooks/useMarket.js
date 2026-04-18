import { useState, useEffect } from 'react';
import { marketAPI } from '../services/api';

export function useMarket() {
  const [crypto,    setCrypto]    = useState([]);
  const [forex,     setForex]     = useState(null);
  const [feargreed, setFeargreed] = useState(null);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const [c, f, fg] = await Promise.all([
          marketAPI.crypto(),
          marketAPI.forex(),
          marketAPI.feargreed(),
        ]);
        if (!alive) return;
        setCrypto(c.data.data);
        setForex(f.data.data);
        setFeargreed(fg.data.data?.[0]);
      } catch (e) {
        console.error('Market load error:', e.message);
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    const interval = setInterval(load, 60_000); // refresh every 60s
    return () => { alive = false; clearInterval(interval); };
  }, []);

  return { crypto, forex, feargreed, loading };
}
