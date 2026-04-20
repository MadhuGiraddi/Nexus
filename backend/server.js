require('dotenv').config();
const express     = require('express');
const http        = require('http');
const mongoose    = require('mongoose');
const cors        = require('cors');
const helmet      = require('helmet');
const morgan      = require('morgan');
const rateLimit   = require('express-rate-limit');
const { Server }  = require('socket.io');
const jwt         = require('jsonwebtoken');
const axios       = require('axios');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: [process.env.CLIENT_URL || 'http://localhost:5173', 'http://localhost:5174'], methods: ['GET','POST'] },
});

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: [process.env.CLIENT_URL || 'http://localhost:5173', 'http://localhost:5174'], credentials: true }));
app.use(express.json());
app.use(morgan('dev'));
app.use('/uploads', express.static('uploads'));
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true }));

// ── MongoDB ───────────────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅  MongoDB connected'))
  .catch((e) => console.error('❌  MongoDB error:', e.message));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',    require('./routes/auth'));
app.use('/api/banking', require('./routes/banking'));
app.use('/api/market',  require('./routes/market'));
app.use('/api/invest',  require('./routes/invest'));
app.use('/api/loans',   require('./routes/loans'));
app.use('/api/ca',      require('./routes/ca'));

// ── Socket.io ─────────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`🔌  Socket ${socket.id} connected`);

  socket.on('auth', (token) => {
    try {
      jwt.verify(token, process.env.JWT_SECRET);
      socket.join('authenticated');
      socket.emit('auth_ok');
    } catch {
      socket.emit('auth_fail');
    }
  });

  socket.on('disconnect', () => console.log(`🔌  Socket ${socket.id} disconnected`));
});

// Broadcast live crypto prices every 30 s (only when clients connected)
setInterval(async () => {
  if (io.sockets.sockets.size === 0) return;
  try {
    const { data } = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
      params: {
        ids: 'bitcoin,ethereum,solana,binancecoin',
        vs_currencies: 'usd',
        include_24hr_change: true,
      },
      headers: { 'x-cg-demo-api-key': process.env.COINGECKO_API_KEY },
    });
    io.to('authenticated').emit('price_tick', { prices: data, ts: Date.now() });
  } catch { /* silent */ }
}, 30_000);

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀  Nexus backend → http://localhost:${PORT}`));
