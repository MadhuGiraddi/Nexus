<<<<<<< HEAD
const express        = require('express');
const router         = express.Router();
const auth           = require('../middleware/auth');
const User           = require('../models/User');
const Loan           = require('../models/Loan');
const Transaction    = require('../models/Transaction');
const StockHolding   = require('../models/StockHolding');
const InvestSip      = require('../models/InvestSip');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const multer             = require('multer');
const path               = require('path');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ── Multer Config (Real Doc Uploads) ──────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// ── Currency Conversion Rate: Plaid data is in USD, display in INR ────────────
const USD_TO_INR = 83.5;

// ── Helper: Build a Nexus Health Score from real user activity ────────────────
// Returns a score (300–850) and a raw breakdown object for OpenAI to explain.
async function buildUserFinancialProfile(userId) {
  const [user, transactions, holdings, sips] = await Promise.all([
    User.findById(userId).lean(),
    Transaction.find({ userId }).sort({ date: -1 }).limit(200).lean(),
    StockHolding.find({ userId }).lean(),
    InvestSip.find({ userId }).lean(),
  ]);

  // 1. Spending behaviour (raw USD from Plaid) — lower debit-to-balance ratio is better
  const totalSpend   = transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const totalCredits = transactions.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  const spendRatio   = totalCredits > 0 ? totalSpend / totalCredits : 1; // < 0.8 is healthy

  // 2. Investment activity (raw USD)
  const portfolioValue = holdings.reduce((s, h) => s + h.quantity * (h.lastPrice || h.avgPrice), 0);
  const activeSips     = sips.filter(s => s.status === 'Active').length;
  const sipMonthly     = sips.filter(s => s.frequency === 'Monthly' && s.status === 'Active').reduce((s, sip) => s + sip.amount, 0);

  // 3. Account longevity
  const ageMonths = Math.floor((Date.now() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24 * 30));

  // 4. Wallet liquidity (raw USD)
  const walletBalance = user.walletBalance || 0;

  // 5. Category diversification
  const categories = [...new Set(transactions.map(t => t.personalFinanceCategory || (t.category && t.category[0]) || 'unknown'))];

  // ── Score Calculation (out of 850) — thresholds in USD since Plaid data is USD ─
  let score = 300;

  // Spend ratio (max 150 pts — lower ratio = more pts)
  if (spendRatio < 0.5)       score += 150;
  else if (spendRatio < 0.7)  score += 100;
  else if (spendRatio < 0.9)  score += 60;
  else if (spendRatio < 1.0)  score += 25;

  // Portfolio value USD thresholds (max 200 pts)
  if (portfolioValue > 100000)      score += 200;
  else if (portfolioValue > 25000)  score += 150;
  else if (portfolioValue > 5000)   score += 80;
  else if (portfolioValue > 0)      score += 30;

  // Active SIPs (max 100 pts)
  score += Math.min(activeSips * 30, 100);

  // Monthly SIP USD thresholds (max 80 pts)
  if (sipMonthly > 5000)      score += 80;
  else if (sipMonthly > 1000) score += 50;
  else if (sipMonthly > 0)    score += 20;

  // Account age (max 60 pts)
  if (ageMonths >= 12)       score += 60;
  else if (ageMonths >= 6)   score += 35;
  else if (ageMonths >= 3)   score += 15;

  // Wallet liquidity USD thresholds (max 60 pts)
  if (walletBalance > 20000)      score += 60;
  else if (walletBalance > 5000)  score += 35;
  else if (walletBalance > 1000)  score += 15;

  // Category diversity (max 50 pts)
  score += Math.min(categories.length * 10, 50);

  // Clamp to valid FICO range
  score = Math.max(300, Math.min(850, Math.round(score)));

  // ── Convert USD → INR for all display values (Plaid returns USD) ─────────────
  const annualIncomeProxy = totalCredits > 0 ? totalCredits * 4 : walletBalance * 2;
  
  // Risk Multiplier based on score (300-850)
  // Below 600: 5% of income proxy | Above 750: 100% of income proxy
  let riskMultiplier = 0.05;
  if (score >= 750)      riskMultiplier = 1.00;
  else if (score >= 700) riskMultiplier = 0.60;
  else if (score >= 650) riskMultiplier = 0.30;
  else if (score >= 600) riskMultiplier = 0.15;

  const baseOfferINR = (annualIncomeProxy * 0.4 * USD_TO_INR) * riskMultiplier;
  
  // Final clamping: Min ₹10k, Max ₹50L
  const maxOfferINR = Math.min(5000000, Math.max(10000,
    Math.round(baseOfferINR / 5000) * 5000
  ));

  return {
    user: { name: user.name, email: user.email, ageMonths },
    score,
    maxOffer: maxOfferINR,                                    // ₹ INR
    breakdown: {
      totalSpend:            Math.round(totalSpend   * USD_TO_INR), // ₹
      totalCredits:          Math.round(totalCredits * USD_TO_INR), // ₹
      spendRatio:            spendRatio.toFixed(2),                 // ratio (no currency)
      portfolioValue:        Math.round(portfolioValue * USD_TO_INR), // ₹
      activeSips,
      sipMonthly:            Math.round(sipMonthly   * USD_TO_INR), // ₹
      walletBalance:         Math.round(walletBalance * USD_TO_INR), // ₹
      transactionCount:      transactions.length,
      categoriesDiversified: categories.length,
    }
  };
}

// ── GET /api/loans/eligibility ─────────────────────────────────────────────────
// Returns computed score + max offer — NO OpenAI, fast response for dashboard
router.get('/eligibility', auth, async (req, res) => {
  try {
    const profile = await buildUserFinancialProfile(req.userId);

    const grade = profile.score >= 750 ? 'Excellent' :
                  profile.score >= 700 ? 'Good' :
                  profile.score >= 650 ? 'Fair' :
                  profile.score >= 600 ? 'Needs Work' : 'Poor';

    res.json({
      score: profile.score,
      grade,
      maxOffer: profile.maxOffer,
      breakdown: profile.breakdown,
    });
  } catch (err) {
    console.error('Eligibility error:', err);
    res.status(500).json({ error: 'Could not compute eligibility' });
  }
});

// ── Smart Fallback Advisor (when OpenAI is unavailable) ───────────────────────
function generateFallbackAdvice(score, maxOffer, breakdown, userName) {
  const grade   = score >= 750 ? 'Excellent' : score >= 700 ? 'Good' : score >= 650 ? 'Fair' : 'Needs Improvement';
  const ratio   = parseFloat(breakdown.spendRatio);
  const hasPortfolio = breakdown.portfolioValue > 0;
  const hasSips = breakdown.activeSips > 0;
  const hasLiquidity = breakdown.walletBalance > 5000;

  // Loan recommendation logic
  let loanType, loanReason;
  if (breakdown.portfolioValue > 50000) {
    loanType   = 'Portfolio-Backed Loan';
    loanReason = `With a portfolio valued at ₹${breakdown.portfolioValue.toLocaleString()}, you qualify to use your investments as collateral, securing a significantly lower interest rate — typically 3.5%–5% APR compared to a standard personal loan rate.`;
  } else if (breakdown.sipMonthly > 3000) {
    loanType   = 'Personal Loan';
    loanReason = `Your consistent monthly SIP commitment of ₹${breakdown.sipMonthly.toLocaleString()} demonstrates strong financial discipline, making you an ideal personal loan candidate with a projected rate of 6%–8% APR.`;
  } else if (breakdown.totalCredits > 50000) {
    loanType   = 'Business or Personal Loan';
    loanReason = `Your income credits of ₹${breakdown.totalCredits.toLocaleString()} indicate healthy cash flow. This makes you eligible for a flexible personal or business loan depending on your purpose.`;
  } else {
    loanType   = 'Personal Loan';
    loanReason = `Based on your current profile, a standard personal loan is the most accessible product. As you build your investment portfolio and SIP activity, larger and cheaper financing options will open up.`;
  }

  // Strengths
  const strengths = [];
  if (ratio < 0.7) strengths.push(`Your spend-to-income ratio of ${(ratio * 100).toFixed(0)}% is well below the 80% threshold — this signals strong financial control and is one of the most positive indicators in your profile.`);
  if (hasPortfolio) strengths.push(`An active investment portfolio worth ₹${breakdown.portfolioValue.toLocaleString()} demonstrates wealth-building intent, which significantly boosts your creditworthiness.`);
  if (hasSips) strengths.push(`You have ${breakdown.activeSips} active SIP plan${breakdown.activeSips > 1 ? 's' : ''} — automated investing is a hallmark of financially disciplined individuals and lenders reward this.`);
  if (hasLiquidity) strengths.push(`Your liquidity buffer of ₹${breakdown.walletBalance.toLocaleString()} provides a safety net that reduces lender risk.`);
  if (strengths.length === 0) strengths.push(`You have a growing financial profile on Nexus. Each month of consistent activity improves your score substantially.`);

  // Improvement areas
  const improvements = [];
  if (ratio >= 0.8) improvements.push(`Your spending ratio of ${(ratio * 100).toFixed(0)}% is above the ideal 70% threshold. Reducing discretionary expenses by even 10% could add 40–60 points to your score over three months.`);
  if (!hasSips) improvements.push(`Starting even one automated SIP plan — as low as ₹100/month in a diversified ETF — would immediately signal financial intent to Nexus's scoring engine.`);
  if (!hasPortfolio) improvements.push(`Building an investment portfolio, even a small one, unlocks the highest-value loan products including Portfolio-Backed loans at sub-5% rates.`);
  if (improvements.length === 0) improvements.push(`To push into the 780+ range, consider diversifying into new asset classes or increasing your monthly SIP contributions by 20%.`);

  const intro = `${userName}, your Nexus Health Score of ${score} places you in the ${grade} range — ${
    score >= 700 ? 'a strong position that opens up the best financing products on the platform' :
    score >= 650 ? 'a solid foundation with clear pathways to unlock premium loan rates' :
    'an early stage that we can improve meaningfully within 60–90 days'
  }. Based on an analysis of ${breakdown.transactionCount} transactions, your investment activity, and liquidity position, here is a complete picture of your financial standing.`;

  const advice = [
    intro,
    `Your key strength${strengths.length > 1 ? 's are' : ' is'}: ${strengths.slice(0, 2).join(' Additionally, ')}`,
    `${improvements.length > 0 ? `The primary area to address is: ${improvements[0]}` : ''}`,
    `Recommendation: The ideal product for your current profile is a **${loanType}**. ${loanReason} Your maximum pre-approved offer stands at ₹${maxOffer.toLocaleString()}.`,
    `Quickest 30-day score improvement action: ${
      !hasSips ? 'Set up one automated monthly SIP investment of any amount — this single action adds a recurring positive signal to your profile.' :
      ratio >= 0.8 ? 'Set a spending cap alert on your top spending category and aim to reduce it by 15% this month.' :
      'Continue your current SIP commitments without interruption — consistency is the highest-value behaviour in your profile right now.'
    }`
  ].filter(Boolean).join('\n\n');

  return advice;
}

// ── GET /api/loans/advisor ─────────────────────────────────────────────────────
// Gemini 1.5 Flash explains the score and recommends the best loan product
router.get('/advisor', auth, async (req, res) => {
  try {
    const profile = await buildUserFinancialProfile(req.userId);
    const { score, breakdown, maxOffer, user } = profile;

    let advice, aiModel;

    try {
      const geminiModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `You are the Nexus AI Financial Advisor for an Indian fintech platform. All currency values are in Indian Rupees (₹ INR). Analyse this user's real financial data and provide exactly 5 short paragraphs explaining their score (${score}/850), strengths, and recommendations. Always use ₹ (Indian Rupees) for any currency amounts — never use $ or USD.

      Financial Data:
      - Nexus Health Score: ${score}/850
      - Pre-Approved Loan Limit: ₹${maxOffer.toLocaleString()}
      - Total Spending: ₹${breakdown.totalSpend.toLocaleString()}
      - Total Income Credits: ₹${breakdown.totalCredits.toLocaleString()}
      - Portfolio Value: ₹${breakdown.portfolioValue.toLocaleString()}
      - Monthly SIP: ₹${breakdown.sipMonthly.toLocaleString()}
      - Wallet Balance: ₹${breakdown.walletBalance.toLocaleString()}
      - Active SIPs: ${breakdown.activeSips}
      - Transactions Analyzed: ${breakdown.transactionCount}`;

      const result = await geminiModel.generateContent(prompt);
      advice  = result.response.text();
      aiModel = 'Gemini 1.5 Flash';

    } catch (aiErr) {
      advice  = generateFallbackAdvice(score, maxOffer, breakdown, user.name);
      aiModel = 'Nexus Advisor Engine v1';
    }

    res.json({ score, maxOffer, breakdown, advice, model: aiModel });
  } catch (err) {
    res.status(500).json({ error: 'AI Advisor unavailable' });
  }
});

// ── Helper: Disburse Funds ───────────────────────────────────────────────────
async function disburseLoanFunds(loanId) {
  try {
    const loan = await Loan.findById(loanId);
    if (!loan || loan.status === 'active' || loan.status === 'funded') return;

    const user = await User.findById(loan.user);
    if (!user) return;

    // 1. Update Wallet
    user.walletBalance = (user.walletBalance || 0) + (loan.principalAmount / 83.5);
    await user.save();

    // 2. Record Transaction
    await Transaction.create({
      userId: user._id,
      plaidTransactionId: `LOAN-${loan._id}-${Date.now()}`,
      accountId: 'NEXUS-WALLET',
      name: `Loan Disbursement: ${loan.purpose}`,
      amount: -(loan.principalAmount / 83.5), // Safely scaled to USD for Dashboard Transaction feed
      date: new Date(),
      category: ['Transfer', 'Internal'],
      pending: false,
      paymentChannel: 'other'
    });

    // 3. Update Loan
    loan.status = 'active';
    loan.timeline.push({
      status: 'active',
      notes: `Funds sanctioned and disbursed to Nexus wallet. Ready for repayment.`,
      timestamp: new Date()
    });
    await loan.save();
    console.log(`[DISBURSE] Successfully funded loan ${loanId} for user ${user.name}`);
  } catch (err) {
    console.error(`[DISBURSE] Failed for ${loanId}:`, err.message);
  }
}


// ── POST /api/loans/upload ───────────────────────────────────────────────────
router.post('/upload', auth, upload.array('docs', 5), async (req, res) => {
  try {
    const files = req.files.map(f => ({
      name: f.originalname,
      url: `/uploads/${f.filename}`,
      type: f.mimetype
    }));
    res.json({ files });
  } catch (err) {
    res.status(500).json({ error: 'Upload failed' });
  }
});

// ── Helper: Trigger AI Review ─────────────────────────────────────────────────
async function triggerAiReview(loanId) {
  try {
    const loan = await Loan.findById(loanId).populate('user');
    const profile = await buildUserFinancialProfile(loan.user._id);
    
    const geminiModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const docManifest = loan.documents.map(d => d.name).join(', ');

    const prompt = `You are the Nexus Elite Credit Analyst. Sanction or Reject this loan based on the data and documents.
    
    APPLICANT: ${loan.user.name}
    LOAN: ₹${loan.principalAmount} (${loan.purpose})
    FINANCIAL HEALTH SCORE: ${profile.score}/850
    PORTFOLIO STRENGTH: ₹${profile.breakdown.portfolioValue}
    UPLOADED DOCUMENTS: ${docManifest || 'None'}
    
    Decision Rules:
    1. If the applicant lacks Tax Returns, look for "Bank Statement" or "Wealth Proof" in the documents. 
    2. If Health Score > 750 (Elite), you can sanction even with minimal docs.
    3. If important docs (ID, Income Proof) are missing and score < 700, REJECT or stay PENDING.
    4. If approved, use the status "approved". If rejected, "rejected".
    
    Output exactly this JSON: { "status": "approved" | "rejected" | "pending", "report": "2-paragraph analyst verdict" }`;

    const result = await geminiModel.generateContent(prompt);
    const responseText = result.response.text();
    
    const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    let decision;
    try {
      decision = JSON.parse(jsonStr);
    } catch {
      // Fallback if AI output is slightly malformed
      if (responseText.toLowerCase().includes('approved')) decision = { status: 'approved', report: 'Approved via analysis.' };
      else decision = { status: 'pending', report: 'Further review required.' };
    }

    if (decision.status === 'approved') {
      loan.status = 'approved';
      loan.timeline.push({ 
        status: 'approved', 
        notes: decision.report,
        timestamp: new Date()
      });
      await loan.save();
      await disburseLoanFunds(loan._id);
    } else if (decision.status === 'rejected') {
      loan.status = 'rejected';
      loan.timeline.push({ 
        status: 'rejected', 
        notes: decision.report,
        timestamp: new Date()
      });
      await loan.save();
    }
  } catch (err) {
    console.error(`[AI REVIEW] Failed for ${loanId}:`, err.message);
    // Fallback Approval Logic — Ensure user isn't stuck if AI fails
    try {
      const loan = await Loan.findById(loanId);
      if (loan && loan.status === 'pending') {
         loan.status = 'approved';
         loan.timeline.push({ 
           status: 'approved', 
           notes: 'Automatic approval via Nexus Safety Protocol (AI Fallback).',
           timestamp: new Date()
         });
         await loan.save();
         await disburseLoanFunds(loan._id);
         console.log(`[AI FALLBACK] Automatically approved loan ${loanId}`);
      }
    } catch (fallbackErr) {
      console.error(`[AI FALLBACK] Failed:`, fallbackErr.message);
    }
  }
}


// ── POST /api/loans/apply ──────────────────────────────────────────────────────
// Creates a new loan application, auto-approves if score >= 650
router.post('/apply', auth, async (req, res) => {
  try {
    const { principalAmount, durationMonths, interestRate, emiAmount, purpose, documents } = req.body;

    if (!principalAmount || !durationMonths || !interestRate || !emiAmount) {
      return res.status(400).json({ error: 'Missing required loan parameters' });
    }

    const profile = await buildUserFinancialProfile(req.userId);

    // Dynamic max offer check
    if (principalAmount > profile.maxOffer * 1.5) {
      return res.status(400).json({
        error: `Requested amount exceeds your maximum pre-approved offer of ₹${profile.maxOffer.toLocaleString()}`,
        maxOffer: profile.maxOffer,
      });
    }

    const autoApprove = profile.score >= 750; // Auto-approve only for very high scores now
    const status      = autoApprove ? 'approved' : 'pending';

    const loan = await Loan.create({
      user: req.userId,
      principalAmount,
      durationMonths,
      interestRate,
      emiAmount,
      purpose: purpose || 'Personal',
      status,
      documents: documents || [],
    });

    if (autoApprove) {
      loan.timeline.push({ 
        status: 'approved', 
        notes: `Instant approval granted based on Nexus Elite Health Score (${profile.score}). Funds will be disbursed shortly.`,
        timestamp: new Date()
      });
      await loan.save();
      // Auto-disbursement for elite scores
      await disburseLoanFunds(loan._id); 
    } else {
      // Trigger AI Review cycle faster
      setTimeout(() => triggerAiReview(loan._id), 1000); 
    }

    res.status(201).json({ loan, score: profile.score, autoApproved: autoApprove });
  } catch (err) {
    console.error('Apply error:', err);
    res.status(500).json({ error: 'Could not submit loan application' });
  }
});

// ── GET /api/loans ─────────────────────────────────────────────────────────────
// Returns all loans for the authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.userId;
    console.log(`[GET LOANS] Fetching for user: ${userId}`);
    const loans = await Loan.find({ user: userId }).sort({ createdAt: -1 }).lean();
    console.log(`[GET LOANS] Found ${loans.length} loans`);
    res.json({ loans });
  } catch (err) {
    console.error('[GET LOANS] Error:', err);
    res.status(500).json({ error: 'Could not fetch loans' });
  }
});

// ── GET /api/loans/:id ─────────────────────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const loan = await Loan.findOne({ _id: req.params.id, user: req.userId }).lean();
    if (!loan) return res.status(404).json({ error: 'Loan not found' });
    res.json({ loan });
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch loan' });
  }
});

// ── POST /api/loans/:id/repay ──────────────────────────────────────────────────
router.post('/:id/repay', auth, async (req, res) => {
  try {
    const loan = await Loan.findOne({ _id: req.params.id, user: req.userId });
    if (!loan) return res.status(404).json({ error: 'Loan not found' });

    const payment = req.body.amount || loan.emiAmount;
    loan.principalAmount = Math.max(0, loan.principalAmount - payment);
    loan.timeline.push({ status: loan.principalAmount === 0 ? 'funded' : loan.status, notes: `Payment of ₹${payment} received.` });
    if (loan.principalAmount === 0) loan.status = 'funded';

    await loan.save();
    res.json({ loan, message: 'Payment recorded successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Could not process repayment' });
  }
=======
const router      = require('express').Router();
const auth        = require('../middleware/auth');
const engine      = require('../utils/financeEngine');
const mockData    = require('../data/mock_financial_data.json');

// ═══════════════════════════════════════════════════════════════════════════════
// FEATURE 1 — EMI Compute (uses financeEngine)
// ═══════════════════════════════════════════════════════════════════════════════
router.post('/compute', auth, (req, res) => {
  const { principal, annualRate, tenureMonths, extraMonthly = 0 } = req.body;

  if (!principal || !annualRate || !tenureMonths)
    return res.status(400).json({ error: 'principal, annualRate, tenureMonths are required' });

  const P = parseFloat(principal);
  const R = parseFloat(annualRate);
  const N = parseInt(tenureMonths);
  const extra = parseFloat(extraMonthly) || 0;

  if (P <= 0 || R < 0 || N <= 0)
    return res.status(400).json({ error: 'Invalid input values' });

  const emi           = engine.calculateEMI(P, R, N);
  const totalPayable  = emi * N;
  const totalInterest = totalPayable - P;
  const schedule      = engine.generateAmortizationSchedule(P, R, N, 0);

  let extraResult = null;
  if (extra > 0) {
    const xs = engine.generateAmortizationSchedule(P, R, N, extra);
    const saved = totalInterest - xs[xs.length - 1].totalInterest;
    const monthsSaved = N - xs.length;
    extraResult = {
      newTenureMonths: xs.length,
      monthsSaved,
      yearsSaved:   +(monthsSaved / 12).toFixed(1),
      totalInterestWithExtra: +xs[xs.length - 1].totalInterest.toFixed(0),
      interestSaved: +saved.toFixed(0),
    };
  }

  res.json({ emi: +emi.toFixed(2), totalPayable: +totalPayable.toFixed(2), totalInterest: +totalInterest.toFixed(2), principal: P, schedule, extraResult });
});

// ═══════════════════════════════════════════════════════════════════════════════
// FEATURE 2 — Loan Portfolio
// ═══════════════════════════════════════════════════════════════════════════════
router.get('/portfolio', auth, (req, res) => {
  const loans = [
    { id: 'loan_1', name: 'Education Loan',   type: 'education',   emoji: '🎓', lender: 'SBI Education', principal: 1200000, outstanding: 890000,  annualRate: 10.5, emiAmount: 16500, tenureMonths: 96, completedMonths: 24, startDate: '2023-01-15', color: '#6C3BEE' },
    { id: 'loan_2', name: 'Credit Card Debt', type: 'credit_card', emoji: '💳', lender: 'HDFC Bank',     principal: 85000,   outstanding: 72000,   annualRate: 36,   emiAmount: 4200,  tenureMonths: 24, completedMonths: 4,  startDate: '2024-09-01', color: '#EF4444', flagged: true },
    { id: 'loan_3', name: 'Car Loan',         type: 'car',         emoji: '🚗', lender: 'ICICI Bank',   principal: 650000,  outstanding: 420000,  annualRate: 8.5,  emiAmount: 14200, tenureMonths: 60, completedMonths: 22, startDate: '2023-05-10', color: '#3B82F6' },
  ];

  const marketRates = { education: 8.0, car: 7.2, credit_card: 18.0, home: 8.5 };
  const sorted      = [...loans].sort((a, b) => b.annualRate - a.annualRate);

  const withAlerts = loans.map(loan => {
    const marketRate = marketRates[loan.type];
    const overpaying = loan.annualRate - marketRate;
    const monthsLeft = loan.tenureMonths - loan.completedMonths;
    let refinanceSavings = 0;
    if (overpaying > 1) {
      const newEMI = engine.calculateEMI(loan.outstanding, marketRate, monthsLeft);
      refinanceSavings = Math.round((loan.emiAmount - newEMI) * monthsLeft);
    }
    return { ...loan, marketRate, overpaying: overpaying > 1, refinanceSavings, debtProgress: Math.round(((loan.principal - loan.outstanding) / loan.principal) * 100) };
  });

  res.json({
    loans: withAlerts,
    sortedByRate: sorted.map(l => l.id),
    summary: {
      totalOutstanding: loans.reduce((s, l) => s + l.outstanding, 0),
      totalEMI:         loans.reduce((s, l) => s + l.emiAmount, 0),
      avgRate:          +(loans.reduce((s, l) => s + l.annualRate, 0) / loans.length).toFixed(2),
      loanCount:        loans.length,
    },
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// FEATURE 3 — BNPL Micro-Debt Detonator
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/loans/bnpl — return BNPL debts + blended rate + rescue offers
router.get('/bnpl', auth, (req, res) => {
  const { bnplDebts, rescueLoanOffers } = mockData;

  const totalOutstanding = bnplDebts.reduce((s, b) => s + b.outstanding, 0);
  const blendedRate      = engine.calculateBlendedInterestRate(bnplDebts);
  const annualBNPLCost   = engine.calculateAnnualBNPLCost(bnplDebts);

  // Enriched rescue offers with computed savings
  const offers = rescueLoanOffers.map(offer => {
    const savings = engine.calculateRescueSavings(totalOutstanding, blendedRate, offer.annualRate, 24);
    return { ...offer, ...savings };
  });

  // Sort debts by due date (most urgent first)
  const sorted = [...bnplDebts].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  res.json({
    debts: sorted,
    summary: {
      totalOutstanding,
      blendedRate,
      annualBNPLCost:       +annualBNPLCost.toFixed(0),
      monthlyBNPLCost:      +((annualBNPLCost) / 12).toFixed(0),
      debtCount:            bnplDebts.length,
      overdueCount:         bnplDebts.filter(b => new Date(b.dueDate) < new Date()).length,
    },
    rescueOffers: offers,
  });
});

// POST /api/loans/bnpl/rescue — simulate executing the rescue
router.post('/bnpl/rescue', auth, (req, res) => {
  const { offerId } = req.body;
  const offer = mockData.rescueLoanOffers.find(o => o.id === offerId);
  if (!offer) return res.status(404).json({ error: 'Offer not found' });

  const totalBnpl    = mockData.bnplDebts.reduce((s, b) => s + b.outstanding, 0);
  const blendedRate  = engine.calculateBlendedInterestRate(mockData.bnplDebts);
  const savings      = engine.calculateRescueSavings(totalBnpl, blendedRate, offer.annualRate, 24);

  res.json({
    success:   true,
    message:   `Rescue activated! ${offer.bank} will disburse ₹${totalBnpl.toLocaleString('en-IN')} in ${offer.disbursalTime}.`,
    loanAmount: totalBnpl,
    offer,
    savings,
    nextStep:  'OPEN_FINAGENT',
    finagentPrompt: `I just consolidated ₹${totalBnpl.toLocaleString('en-IN')} of BNPL debt into a single ${offer.annualRate}% personal loan from ${offer.bank}. Please set a behavioral lock to warn me before any future purchases on Simpl, LazyPay, Amazon Pay Later, ZestMoney, or HDFC FlexiPay until this rescue loan is cleared. My monthly EMI is now ₹${savings.rescueEMI.toLocaleString('en-IN')}. What strategy should I follow to pay this off early?`,
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// FEATURE 4 — Mortgage Horizon (Rent vs. Buy Engine)
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/loans/lifestyle — return lifestyle burn rate + income
router.get('/lifestyle', auth, (req, res) => {
  res.json(mockData.lifestyleBurnRate);
});

// POST /api/loans/mortgage/affordability — compute max EMI, property, and safe margin
router.post('/mortgage/affordability', auth, (req, res) => {
  const {
    monthlyIncome,
    lockedExpenses,     // total fixed overheads user has confirmed
    lifestyleExpenses,  // total variable user keeps (can edit)
    annualRate   = 8.5,
    tenureYears  = 20,
  } = req.body;

  if (!monthlyIncome) return res.status(400).json({ error: 'monthlyIncome required' });

  const P = parseFloat(monthlyIncome);
  const locked   = parseFloat(lockedExpenses)  || 0;
  const lifestyle = parseFloat(lifestyleExpenses) || 0;
  const remainingCashflow = P - locked - lifestyle;

  // Apply DTI guardrail: keep max EMI at 40% of income (central-bank recommended)
  const maxEMIByDTI  = P * 0.40;
  const safeEMI      = Math.min(remainingCashflow * 0.85, maxEMIByDTI); // 85% of remaining (15% buffer)

  const { maxLoan, maxPropertyValue, downPayment } = engine.maxPropertyFromSafeEMI(safeEMI, annualRate, tenureYears);
  const dtiPct = ((safeEMI / P) * 100).toFixed(1);

  res.json({
    monthlyIncome:   P,
    lockedExpenses:  locked,
    lifestyleExpenses: lifestyle,
    remainingCashflow: +remainingCashflow.toFixed(0),
    safeEMI:         +safeEMI.toFixed(0),
    maxLoan:         +maxLoan.toFixed(0),
    maxPropertyValue:+maxPropertyValue.toFixed(0),
    downPayment:     +downPayment.toFixed(0),
    dtiPct,
    annualRate,
    tenureYears,
  });
});

// GET /api/loans/mortgage/properties — geo-targeted properties within budget
router.get('/mortgage/properties', auth, (req, res) => {
  const maxBudget = parseInt(req.query.maxBudget) || 10000000;
  const minBudget = maxBudget * 0.5;

  const affordable = mockData.geoProperties.filter(
    p => p.price >= minBudget && p.price <= maxBudget * 1.15 // allow 15% stretch
  );

  res.json({ properties: affordable, maxBudget });
});

// POST /api/loans/mortgage/rentvsbuychart — rent vs buy crossover data
router.post('/mortgage/rentvsbuychart', auth, (req, res) => {
  const {
    currentRent = 22000,
    propertyValue,
    loanRate    = 8.5,
    tenureYears = 20,
    years       = 15,
  } = req.body;

  if (!propertyValue) return res.status(400).json({ error: 'propertyValue required' });

  const result = engine.calculateRentVsBuyCrossover(
    currentRent, propertyValue, loanRate, tenureYears, years
  );

  res.json(result);
>>>>>>> features
});

module.exports = router;
