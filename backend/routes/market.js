const router  = require('express').Router();
const axios   = require('axios');
const auth    = require('../middleware/auth');

// Simple in-memory cache
const cache = {};
const TTL   = 60_000; // 60 seconds

function cached(key, ttl, fetcher) {
  const now = Date.now();
  if (cache[key] && now - cache[key].ts < ttl) return Promise.resolve(cache[key].data);
  return fetcher().then((data) => { cache[key] = { data, ts: now }; return data; });
}

// GET /api/market/crypto
router.get('/crypto', auth, async (req, res) => {
  try {
    const data = await cached('crypto', TTL, () =>
      axios.get('https://api.coingecko.com/api/v3/coins/markets', {
        params: {
          vs_currency: 'usd',
          ids: 'bitcoin,ethereum,solana,binancecoin,cardano,ripple,polkadot,dogecoin',
          order: 'market_cap_desc',
          per_page: 8,
          page: 1,
          sparkline: true,
          price_change_percentage: '24h,7d',
        },
        headers: { 'x-cg-demo-api-key': process.env.COINGECKO_API_KEY },
      }).then((r) => r.data)
    );
    res.json({ data });
  } catch (e) {
    console.error('Crypto error:', e.message);
    res.status(502).json({ error: 'Failed to fetch crypto data' });
  }
});

// GET /api/market/global
router.get('/global', auth, async (req, res) => {
  try {
    const data = await cached('global', TTL * 5, () =>
      axios.get('https://api.coingecko.com/api/v3/global', {
        headers: { 'x-cg-demo-api-key': process.env.COINGECKO_API_KEY },
      }).then((r) => r.data.data)
    );
    res.json({ data });
  } catch (e) {
    res.status(502).json({ error: 'Failed to fetch global market data' });
  }
});

// GET /api/market/forex
router.get('/forex', auth, async (req, res) => {
  try {
    const base = req.query.base || 'USD';
    const data = await cached(`forex_${base}`, TTL * 10, () => {
      const url = process.env.EXCHANGE_RATE_API_KEY
        ? `https://v6.exchangerate-api.com/v6/${process.env.EXCHANGE_RATE_API_KEY}/latest/${base}`
        : `https://open.er-api.com/v6/latest/${base}`;
      return axios.get(url).then((r) => {
        const rates = r.data.rates || r.data.conversion_rates;
        const keys  = ['EUR', 'GBP', 'JPY', 'INR', 'CAD', 'AUD', 'CHF', 'SGD'];
        return { base, rates: Object.fromEntries(keys.map((k) => [k, rates[k]])), time: new Date() };
      });
    });
    res.json({ data });
  } catch (e) {
    res.status(502).json({ error: 'Failed to fetch forex data' });
  }
});

// GET /api/market/feargreed
router.get('/feargreed', auth, async (req, res) => {
  try {
    const data = await cached('feargreed', TTL * 60, () =>
      axios.get('https://api.alternative.me/fng/?limit=7').then((r) => r.data.data)
    );
    res.json({ data });
  } catch (e) {
    res.status(502).json({ error: 'Failed to fetch fear & greed data' });
  }
});

module.exports = router;
