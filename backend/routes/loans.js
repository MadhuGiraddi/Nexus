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
});

module.exports = router;
