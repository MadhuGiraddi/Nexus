const router      = require('express').Router();
const { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } = require('plaid');
const mongoose    = require('mongoose');
const User        = require('../models/User');
const Transaction = require('../models/Transaction');
const InvestSip   = require('../models/InvestSip');
const InvestTrigger = require('../models/InvestTrigger');
const auth        = require('../middleware/auth');

// ── Plaid Client ──────────────────────────────────────────────────────────────
const plaid = new PlaidApi(new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET':    process.env.PLAID_SECRET,
    },
  },
}));

// ── Helper: sync transactions for one access token ────────────────────────────
async function syncTransactions(userId, accessToken, daysBack = 90) {
  const start = new Date(); start.setDate(start.getDate() - daysBack);
  const fmt   = (d) => d.toISOString().split('T')[0];
  let count = 0, offset = 0;

  try {
    while (true) {
      const { data } = await plaid.transactionsGet({
        access_token: accessToken,
        start_date: fmt(start),
        end_date:   fmt(new Date()),
        options: { count: 100, offset },
      });

      for (const tx of data.transactions) {
        await Transaction.findOneAndUpdate(
          { plaidTransactionId: tx.transaction_id },
          {
            userId,
            plaidTransactionId:  tx.transaction_id,
            accountId:           tx.account_id,
            name:                tx.name,
            merchantName:        tx.merchant_name || '',
            amount:              tx.amount,
            isoCurrencyCode:     tx.iso_currency_code || 'USD',
            date:                new Date(tx.date),
            category:            tx.category || [],
            categoryId:          tx.category_id || '',
            pending:             tx.pending,
            paymentChannel:      tx.payment_channel || 'other',
            personalFinanceCategory: tx.personal_finance_category?.primary || '',
            logoUrl:             tx.logo_url || '',
            location:            tx.location || {},
          },
          { upsert: true, new: true }
        );
        count++;
      }

      offset += data.transactions.length;
      if (offset >= data.total_transactions) break;
    }
  } catch (e) {
    console.error('Sync error:', e.response?.data || e.message);
  }
  return count;
}

// ── 1. Create Plaid Link Token ────────────────────────────────────────────────
router.post('/link-token', auth, async (req, res) => {
  try {
    const { data } = await plaid.linkTokenCreate({
      client_id:     process.env.PLAID_CLIENT_ID,
      secret:        process.env.PLAID_SECRET,
      user:          { client_user_id: req.userId },
      client_name:   'Nexus Finance',
      products:      ['auth', 'transactions'],
      country_codes: ['US'],
      language:      'en',
    });
    res.json({ linkToken: data.link_token });
  } catch (e) {
    console.error('Link token error:', e.response?.data || e.message);
    res.status(500).json({ error: 'Failed to create link token' });
  }
});

// ── 2. Exchange Public Token ──────────────────────────────────────────────────
router.post('/exchange-token', auth, async (req, res) => {
  try {
    const { publicToken, institution } = req.body;
    const { data } = await plaid.itemPublicTokenExchange({ public_token: publicToken });

    await User.findByIdAndUpdate(req.userId, {
      $push: {
        plaidItems: {
          accessToken:     data.access_token,
          itemId:          data.item_id,
          institutionId:   institution?.institution_id || '',
          institutionName: institution?.name || 'My Bank',
          institutionLogo: institution?.logo || '',
        },
      },
    });

    // Fire-and-forget background sync
    syncTransactions(req.userId, data.access_token, 90).catch(console.error);

    res.json({ success: true, institutionName: institution?.name || 'My Bank' });
  } catch (e) {
    console.error('Exchange error:', e.response?.data || e.message);
    res.status(500).json({ error: 'Failed to link bank account' });
  }
});

// ── 3. Get All Accounts ───────────────────────────────────────────────────────
router.get('/accounts', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || !user.plaidItems.length)
      return res.json({ accounts: [], netWorth: 0, linkedBanks: [] });

    // Fetch all internal simulated spends mapped by accountId
    const simulatedTransactions = await Transaction.find({ userId: req.userId, paymentChannel: 'simulated' });
    const simulatedOffsets = {};
    for (const tx of simulatedTransactions) {
      simulatedOffsets[tx.accountId] = (simulatedOffsets[tx.accountId] || 0) + tx.amount;
    }

    const all = [];
    const linkedBanks = [];

    for (const item of user.plaidItems) {
      try {
        const { data } = await plaid.accountsGet({ access_token: item.accessToken });
        linkedBanks.push({ itemId: item.itemId, name: item.institutionName, logo: item.institutionLogo });
        
        data.accounts.forEach((acc) => {
          // Adjust the live Plaid balance locally via simulated offsets
          const offset = simulatedOffsets[acc.account_id] || 0;
          if (offset > 0) {
            acc.balances.current -= offset;
            if (acc.balances.available != null) acc.balances.available -= offset;
          }

          all.push({ ...acc, institutionName: item.institutionName, institutionLogo: item.institutionLogo, itemId: item.itemId });
        });
      } catch (e) {
        console.error(`Account fetch failed for ${item.institutionName}:`, e.message);
      }
    }

    // ── InvestPro Integration ──
    const triggers = await InvestTrigger.find({ userId: req.userId, active: true });
    const triggerConfigs = {};
    triggers.forEach(t => { triggerConfigs[t.triggerType] = t.config });

    const txns = await Transaction.find({ userId: req.userId, amount: { $ne: 0 } });
    
    let totalInvestProValue = 0;
    const guiltFreeApps = ['zomato', 'swiggy', 'blinkit', 'zepto', 'bigbasket'];
    const entertainmentApps = ['netflix', 'prime video', 'hotstar', 'spotify', 'bookmyshow', 'steam'];

    txns.forEach(tx => {
      const name = tx.name.toLowerCase();
      const amount = tx.amount;

      if (amount > 0) {
        // Round Up
        if (triggerConfigs.round_up) {
          const ceil = triggerConfigs.round_up.roundTo || 50;
          const remainder = amount % ceil;
          if (remainder > 0) totalInvestProValue += (ceil - remainder);
        }
        // Guilt Free
        if (triggerConfigs.guilt_free) {
          for (const app of guiltFreeApps) {
            if (name.includes(app)) {
              totalInvestProValue += (triggerConfigs.guilt_free[app] || 20);
              break;
            }
          }
        }
        // Entertainment
        if (triggerConfigs.entertainment_tax) {
          for (const app of entertainmentApps) {
            if (name.includes(app)) {
              totalInvestProValue += (triggerConfigs.entertainment_tax[app] || 30);
              break;
            }
          }
        }
      } else {
        // Cashback Sweep
        if (triggerConfigs.cashback_sweep) {
          const keywords = ['cashback', 'reward', 'refund', 'amazon pay', 'supercoins'];
          if (keywords.some(k => name.includes(k))) totalInvestProValue += Math.abs(amount);
        }
      }
    });

    // Add Mock SIP growth (for demo purposes, total sum of SIP amounts * 1.05 to show "growth")
    const sips = await InvestSip.find({ userId: req.userId, status: 'Active' });
    const sipContribution = sips.reduce((sum, s) => sum + s.amount, 0);
    totalInvestProValue += sipContribution;

    if (totalInvestProValue > 0) {
      all.push({
        account_id: 'investpro_portfolio',
        name: 'InvestPro Portfolio',
        official_name: 'Aggregated Wealth Management',
        type: 'investment',
        subtype: 'mutual fund',
        balances: {
          current: totalInvestProValue,
          available: totalInvestProValue,
          limit: null,
          iso_currency_code: 'USD'
        },
        institutionName: 'InvestPro AI',
        institutionLogo: null,
        itemId: 'investpro'
      });
    }

    const netWorth = all.reduce((sum, a) => {
      const bal = a.balances.current || 0;
      return (a.type === 'credit' || a.type === 'loan') ? sum - bal : sum + bal;
    }, 0);

    res.json({ accounts: all, netWorth, linkedBanks });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

// ── 4. Get Transactions (from DB) ─────────────────────────────────────────────
router.get('/transactions', auth, async (req, res) => {
  try {
    const { days = 30, limit = 50, skip = 0, category } = req.query;
    const since = new Date(); since.setDate(since.getDate() - Number(days));
    const query = { userId: req.userId, date: { $gte: since } };
    if (category) query.category = { $in: [category] };

    const [txns, total] = await Promise.all([
      Transaction.find(query).sort({ date: -1 }).limit(Number(limit)).skip(Number(skip)),
      Transaction.countDocuments(query),
    ]);
    res.json({ transactions: txns, total, hasMore: Number(skip) + Number(limit) < total });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// ── 5. Force Sync ─────────────────────────────────────────────────────────────
router.post('/sync', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user?.plaidItems.length) return res.json({ synced: 0 });

    let total = 0;
    for (const item of user.plaidItems)
      total += await syncTransactions(req.userId, item.accessToken, 90);

    res.json({ synced: total });
  } catch (e) {
    res.status(500).json({ error: 'Sync failed' });
  }
});

// ── 6. Spending by Category ───────────────────────────────────────────────────
router.get('/spending', auth, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const since = new Date(); since.setDate(since.getDate() - Number(days));

    const txns = await Transaction.find({
      userId: req.userId,
      date: { $gte: since },
      amount: { $gt: 0 },
      pending: false
    });

    const categoryTotals = {};
    for (const tx of txns) {
      let cat = (tx.category && tx.category.length > 0) ? tx.category[0] 
              : tx.personal_finance_category ? tx.personal_finance_category 
              : 'Other';
              
      // Format newer uppercase categories if they exist
      if (cat === 'FOOD_AND_DRINK') cat = 'Food and Drink';
      if (cat === 'TRAVEL') cat = 'Travel';
      if (cat === 'GENERAL_MERCHANDISE') cat = 'Shopping';
      if (cat === 'TRANSFER_OUT') cat = 'Transfer';
      if (cat === 'MEDICAL') cat = 'Healthcare';

      categoryTotals[cat] = (categoryTotals[cat] || 0) + tx.amount;
    }

    const summary = Object.entries(categoryTotals)
      .map(([name, total]) => ({ _id: name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);

    res.json({ summary });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to compute spending' });
  }
});

// ── 7. Daily Cash Flow ────────────────────────────────────────────────────────
router.get('/cashflow', auth, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const since = new Date(); since.setDate(since.getDate() - Number(days));

    const txns = await Transaction.find({
      userId: req.userId,
      date: { $gte: since },
      pending: false
    });

    const daily = {};
    for (const tx of txns) {
      const d = tx.date.toISOString().split('T')[0];
      if (!daily[d]) daily[d] = { _id: d, income: 0, spent: 0, categories: {} };

      if (tx.amount < 0) {
        daily[d].income += Math.abs(tx.amount);
      } else {
        daily[d].spent += tx.amount;
        const cat = tx.category?.[0] || 'Other';
        daily[d].categories[cat] = (daily[d].categories[cat] || 0) + tx.amount;
      }
    }

    const flow = Object.values(daily).sort((a, b) => a._id.localeCompare(b._id));
    res.json({ flow });
  } catch (e) {
    res.status(500).json({ error: 'Failed to compute cash flow' });
  }
});

// ── 8. Unlink Bank ────────────────────────────────────────────────────────────
router.delete('/unlink/:itemId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const item = user?.plaidItems.find((i) => i.itemId === req.params.itemId);
    if (!item) return res.status(404).json({ error: 'Bank not found' });

    await plaid.itemRemove({ access_token: item.accessToken }).catch(() => {});
    await User.findByIdAndUpdate(req.userId, { $pull: { plaidItems: { itemId: req.params.itemId } } });

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to unlink bank' });
  }
});

// ── 9. Simulate Manual Spend ──────────────────────────────────────────────────
router.post('/simulate-spend', auth, async (req, res) => {
  try {
    const { amount, merchantName, category, accountId } = req.body;
    
    await Transaction.create({
      userId:              req.userId,
      plaidTransactionId:  'simulated_' + new mongoose.Types.ObjectId().toHexString(),
      accountId:           accountId,
      name:                merchantName,
      merchantName:        merchantName,
      amount:              Number(amount),
      isoCurrencyCode:     'USD',
      date:                new Date(),
      category:            [category],
      personalFinanceCategory: category,
      pending:             false,
      paymentChannel:      'simulated',
    });

    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to log simulated transaction' });
  }
});

module.exports = router;
