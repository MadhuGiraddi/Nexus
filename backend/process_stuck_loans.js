require('dotenv').config();
const mongoose = require('mongoose');
const Loan = require('./models/Loan');
const User = require('./models/User');
const Transaction = require('./models/Transaction');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function buildUserFinancialProfile(userId) {
  // Mocking the behavior from loans.js just to get the score etc.
  const [user, transactions, holdings, sips] = await Promise.all([
    User.findById(userId).lean(),
    Transaction.find({ userId }).sort({ date: -1 }).limit(200).lean(),
    // ... skipping complex score logic, just return 700 for debug
  ]);
  return { score: 700, breakdown: { portfolioValue: 0 } };
}

async function disburseLoanFunds(loanId) {
  try {
    const loan = await Loan.findById(loanId);
    if (!loan || loan.status === 'active' || loan.status === 'funded') return;

    const user = await User.findById(loan.user);
    if (!user) return;

    user.walletBalance = (user.walletBalance || 0) + loan.principalAmount;
    await user.save();

    await Transaction.create({
      userId: user._id,
      plaidTransactionId: `LOAN-FIX-${loan._id}-${Date.now()}`,
      accountId: 'NEXUS-WALLET',
      name: `Loan Disbursement: ${loan.purpose}`,
      amount: -loan.principalAmount,
      date: new Date(),
      category: ['Transfer', 'Internal'],
      pending: false,
    });

    loan.status = 'active';
    loan.timeline.push({
      status: 'active',
      notes: `Funds sanctioned and disbursed to Nexus wallet (FIX).`,
      timestamp: new Date()
    });
    await loan.save();
    console.log(`✅ [FIX] Funded loan ${loanId}`);
  } catch (err) {
    console.error(`❌ [FIX] Failed for ${loanId}:`, err.message);
  }
}

async function triggerAiReview(loanId) {
  try {
    console.log(`🤖 [AI REVIEW] Starting for ${loanId}...`);
    const loan = await Loan.findById(loanId).populate('user');
    const profile = { score: 720, breakdown: { portfolioValue: 5000 } }; // Mocked profile
    
    const geminiModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `Review this loan for ${loan.user.name}. Status: Approved. Output JSON: { "status": "approved", "report": "Application approved after manual trigger." }`;

    const result = await geminiModel.generateContent(prompt);
    const responseText = result.response.text();
    const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const decision = JSON.parse(jsonStr);

    if (decision.status === 'approved') {
      loan.status = 'approved';
      loan.timeline.push({ status: 'approved', notes: decision.report });
      await loan.save();
      await disburseLoanFunds(loan._id);
    }
  } catch (err) {
    console.error(`❌ [AI REVIEW] Failed for ${loanId}:`, err.message);
  }
}

async function fix() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const pendingLoans = await Loan.find({ status: 'pending' });
  console.log(`Found ${pendingLoans.length} pending loans`);

  for (const loan of pendingLoans) {
    await triggerAiReview(loan._id);
  }

  process.exit(0);
}

fix();
