const router = require('express').Router();
const jwt    = require('jsonwebtoken');
const User   = require('../models/User');
const auth   = require('../middleware/auth');

const sign = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: 'All fields required' });
    
    const existing = await User.findOne({ email });
    if (existing)
      return res.status(409).json({ error: 'Email already in use' });

    const user = new User({ name, email, password });
    await user.save();

    console.log(`[AUTH] New user registered: ${email}`);
    
    res.status(201).json({
      token: sign(user._id),
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        isSubscribed: user.isSubscribed ?? false 
      },
    });
  } catch (e) {
    console.error('[AUTH] Registration error:', e.message);
    res.status(500).json({ error: `Server error: ${e.message}` });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`[AUTH] Login attempt for: ${email}`);
    
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`[AUTH] User not found: ${email}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      console.log(`[AUTH] Password mismatch for: ${email}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log(`[AUTH] Login success: ${email}`);
    res.json({
      token: sign(user._id),
      user: { id: user._id, name: user.name, email: user.email, isSubscribed: user.isSubscribed },
    });
  } catch (e) {
    console.error(`[AUTH] Login error:`, e);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/subscribe (Mock Premium Upgrade)
router.post('/subscribe', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    user.isSubscribed = true;
    await user.save();
    
    res.json({ success: true, user });
  } catch (e) {
    res.status(500).json({ error: 'Upgrade failed' });
  }
});

module.exports = router;
