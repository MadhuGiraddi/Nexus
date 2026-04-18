const router = require('express').Router();
const InvestSip = require('../models/InvestSip');
const InvestTrigger = require('../models/InvestTrigger');
const Transaction = require('../models/Transaction');
const StockHolding = require('../models/StockHolding');
const User = require('../models/User');
const auth = require('../middleware/auth');
const jwt  = require('jsonwebtoken');

// ── 1. SIP ROUTES ─────────────────────────────────────────────────────────────
router.get('/sips', auth, async (req, res) => {
  try {
    const sips = await InvestSip.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json({ sips });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch SIPs' });
  }
});

router.post('/sips', auth, async (req, res) => {
  try {
    const sip = await InvestSip.create({ ...req.body, userId: req.userId });
    res.json({ success: true, sip });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create SIP' });
  }
});

router.put('/sips/:id', auth, async (req, res) => {
  try {
    const updatedSip = await InvestSip.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { $set: req.body },
      { new: true }
    );
    res.json({ success: true, sip: updatedSip });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update SIP' });
  }
});

router.delete('/sips/:id', auth, async (req, res) => {
  try {
    await InvestSip.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete SIP' });
  }
});

// ── 2. TRIGGER ROUTES ─────────────────────────────────────────────────────────
router.get('/triggers', auth, async (req, res) => {
  try {
    const triggers = await InvestTrigger.find({ userId: req.userId });
    res.json({ triggers });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch triggers' });
  }
});

router.post('/triggers/:type/toggle', auth, async (req, res) => {
  try {
    const { type } = req.params;
    const { active, config } = req.body;
    
    let trigger = await InvestTrigger.findOne({ userId: req.userId, triggerType: type });
    if (trigger) {
      trigger.active = active;
      if (config) trigger.config = config;
      await trigger.save();
    } else {
      trigger = await InvestTrigger.create({ userId: req.userId, triggerType: type, active, config });
    }
    res.json({ success: true, trigger });
  } catch (e) {
    res.status(500).json({ error: 'Failed to toggle trigger' });
  }
});

// ── 3. ANALYTICS ENGINE (The "Save While You Spend" Magic) ────────────────────
router.get('/analytics', auth, async (req, res) => {
  try {
    // 1. Fetch active triggers config for user
    const triggers = await InvestTrigger.find({ userId: req.userId, active: true });
    
    const triggerConfigs = {};
    triggers.forEach(t => { triggerConfigs[t.triggerType] = t.config });

    // 2. Fetch all expenses (including simulated manual spends!)
    const txns = await Transaction.find({ 
      userId: req.userId, 
      amount: { $gt: 0 }
    }).sort({ date: -1 });

    const analytics = {
      round_up: { totalSaved: 0, items: [] },
      guilt_free: { totalSaved: 0, topApp: '', items: [] },
      entertainment: { totalSaved: 0, items: [] },
      cashback: { totalSaved: 0, items: [] } // Handled via income below
    };

    const guiltFreeApps = ['zomato', 'swiggy', 'blinkit', 'zepto', 'bigbasket'];
    const entertainmentApps = ['netflix', 'prime video', 'hotstar', 'spotify', 'bookmyshow', 'steam'];
    const guiltCounts = {};

    for (const tx of txns) {
      const name = tx.name.toLowerCase();
      const amount = tx.amount;

      // --> Round Up Logic
      if (triggerConfigs.round_up) {
        const ceil = triggerConfigs.round_up.roundTo || 50; // default round to nearest 50
        const remainder = amount % ceil;
        if (remainder > 0) {
          const saved = ceil - remainder;
          analytics.round_up.totalSaved += saved;
          if (analytics.round_up.items.length < 5) {
            analytics.round_up.items.push({ name: tx.name, amount: amount.toFixed(0), saved: saved.toFixed(2), date: tx.date });
          }
        }
      }

      // --> Guilt Free Tax Logic
      if (triggerConfigs.guilt_free) {
        let matched = false;
        let penalty = 0;
        
        for (const app of guiltFreeApps) {
          if (name.includes(app)) {
            // Apply penalty amount mapped from config, default 20
            penalty = triggerConfigs.guilt_free[app] || 20; 
            matched = true;
            guiltCounts[app] = (guiltCounts[app] || 0) + 1;
            break;
          }
        }

        if (matched) {
          analytics.guilt_free.totalSaved += penalty;
          if (analytics.guilt_free.items.length < 5) {
            analytics.guilt_free.items.push({ name: tx.name, penalty: penalty.toFixed(0), date: tx.date });
          }
        }
      }

      // --> Entertainment Sweep
      if (triggerConfigs.entertainment_tax) {
        let matched = false;
        let penalty = 0;
        
        for (const app of entertainmentApps) {
          if (name.includes(app)) {
            penalty = triggerConfigs.entertainment_tax[app] || 30; // default 30
            matched = true;
            break;
          }
        }
        if (matched) {
          analytics.entertainment.totalSaved += penalty;
          if (analytics.entertainment.items.length < 5) {
            analytics.entertainment.items.push({ name: tx.name, penalty: penalty.toFixed(0), date: tx.date });
          }
        }
      }
    }

    // Determine Top App for Guilt Free
    let max = 0, topAppStr = 'None';
    for (const app in guiltCounts) { 
      if (guiltCounts[app] > max) { max = guiltCounts[app]; topAppStr = app; }
    }
    analytics.guilt_free.topApp = topAppStr;

    // // --> Cashback Sweep Logic (Needs negative amount / Income txns)
    if (triggerConfigs.cashback_sweep) {
      const incomeTxns = await Transaction.find({ 
        userId: req.userId, 
        amount: { $lt: 0 }
      }).sort({ date: -1 });

      const cashbackKeywords = ['cashback', 'reward', 'refund', 'amazon pay', 'supercoins'];
      for (const tx of incomeTxns) {
        const name = tx.name.toLowerCase();
        let isCashback = false;
        for (const k of cashbackKeywords) {
          if (name.includes(k)) isCashback = true;
        }
        
        if (isCashback) {
          const val = Math.abs(tx.amount);
          analytics.cashback.totalSaved += val;
          if (analytics.cashback.items.length < 5) {
            analytics.cashback.items.push({ name: tx.name, saved: val.toFixed(0), date: tx.date });
          }
        }
      }
    }

    res.json({ analytics });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to compute analytics' });
  }
});

// ── 4. STOCK BROKERAGE ROUTES ─────────────────────────────────────────────────

// GET /invest/portfolio — returns holdings + walletBalance for the logged-in user
router.get('/portfolio', auth, async (req, res) => {
  try {
    const user     = await User.findById(req.userId).select('walletBalance');
    const holdings = await StockHolding.find({ userId: req.userId }).sort({ updatedAt: -1 });
    res.json({ holdings, walletBalance: user?.walletBalance ?? 0 });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch portfolio' });
  }
});

router.post('/buy', auth, async (req, res) => {
  try {
    const { symbol, quantity, price, broker } = req.body;
    const totalCost = quantity * price;

    const user = await User.findById(req.userId);
    if (user.walletBalance < totalCost) {
      return res.status(400).json({ error: 'Insufficient funds in wallet' });
    }

    // 1. Deduct Balance
    user.walletBalance -= totalCost;
    await user.save();

    // 2. Add to Portfolio
    let holding = await StockHolding.findOne({ userId: req.userId, symbol });
    if (holding) {
      const newTotalQty = holding.quantity + quantity;
      holding.avgPrice = ((holding.avgPrice * holding.quantity) + totalCost) / newTotalQty;
      holding.quantity = newTotalQty;
      holding.updatedAt = Date.now();
      await holding.save();
    } else {
      holding = await StockHolding.create({
        userId: req.userId,
        symbol,
        quantity,
        avgPrice: price,
        lastPrice: price
      });
    }

    // 3. Create Transaction for Core Nexus History
    await Transaction.create({
      userId: req.userId,
      plaidTransactionId: `mock_buy_${Date.now()}`,
      accountId: 'manual_investment_wallet',
      name: `Buy ${symbol} via ${broker}`,
      merchantName: broker,
      amount: totalCost,
      date: new Date(),
      category: ['Investment', 'Stock Buy'],
      paymentChannel: 'brokerage'
    });

    res.json({ success: true, balance: user.walletBalance, holding });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Brokerage order failed' });
  }
});

router.post('/sell', auth, async (req, res) => {
  try {
    const { symbol, quantity, price, broker } = req.body;
    const proceeds = quantity * price;

    const user = await User.findById(req.userId);
    let holding = await StockHolding.findOne({ userId: req.userId, symbol });

    if (!holding || holding.quantity < quantity) {
      return res.status(400).json({ error: 'Insufficient holdings to sell' });
    }

    // 1. Add Proceed to Balance
    user.walletBalance += proceeds;
    await user.save();

    // 2. Update/Delete Holding
    holding.quantity -= quantity;
    if (holding.quantity <= 0) {
      await StockHolding.deleteOne({ _id: holding._id });
    } else {
      await holding.save();
    }

    // 3. Create Transaction for Core Nexus History
    await Transaction.create({
      userId: req.userId,
      plaidTransactionId: `mock_sell_${Date.now()}`,
      accountId: 'manual_investment_wallet',
      name: `Sell ${symbol} via ${broker}`,
      merchantName: broker,
      amount: -proceeds, // Negative amount = Inflow/Income for Nexus history
      date: new Date(),
      category: ['Investment', 'Stock Sale'],
      paymentChannel: 'brokerage'
    });

    res.json({ success: true, balance: user.walletBalance, proceeds });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Brokerage sale failed' });
  }
});

router.post('/refill', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    user.walletBalance = 50000.00;
    await user.save();
    res.json({ success: true, balance: user.walletBalance });
  } catch (e) {
    res.status(500).json({ error: 'Failed to refill wallet' });
  }
});

router.post('/sync', async (req, res) => {
  try {
    const user = await User.findOne();
    if (!user) return res.status(404).json({ error: 'No user to sync' });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    res.json({ success: true, token, user: { name: user.name, email: user.email } });
  } catch (e) {
    res.status(500).json({ error: 'Sync failed' });
  }
});

module.exports = router;
