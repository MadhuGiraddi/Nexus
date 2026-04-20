const router = require('express').Router();
const auth   = require('../middleware/auth');

// ── EMI Formula: E = P × r × (1+r)^n / ((1+r)^n - 1) ─────────────────────
function calcEMI(principal, annualRate, tenureMonths) {
  const r = annualRate / 100 / 12;
  if (r === 0) return principal / tenureMonths;
  const factor = Math.pow(1 + r, tenureMonths);
  return (principal * r * factor) / (factor - 1);
}

// ── Build full amortization schedule ──────────────────────────────────────────
function buildSchedule(principal, annualRate, tenureMonths, extraMonthly = 0) {
  const r = annualRate / 100 / 12;
  const baseEMI = calcEMI(principal, annualRate, tenureMonths);
  const totalPayment = baseEMI + extraMonthly;

  const schedule = [];
  let balance = principal;
  let month   = 0;

  while (balance > 0.01 && month < tenureMonths + 600) {
    month++;
    const interest  = balance * r;
    let   principal_paid = totalPayment - interest;
    if (principal_paid > balance) principal_paid = balance;
    balance -= principal_paid;
    if (balance < 0) balance = 0;

    schedule.push({
      month,
      payment:       +(totalPayment).toFixed(2),
      interest:      +interest.toFixed(2),
      principal:     +principal_paid.toFixed(2),
      balance:       +balance.toFixed(2),
      totalInterest: 0, // filled below
    });
  }

  // Cumulative total interest
  let cum = 0;
  schedule.forEach(m => { cum += m.interest; m.totalInterest = +cum.toFixed(2); });

  return schedule;
}

// ── 1. Compute EMI ────────────────────────────────────────────────────────────
router.post('/compute', auth, (req, res) => {
  const {
    principal,
    annualRate,
    tenureMonths,
    extraMonthly = 0,
  } = req.body;

  if (!principal || !annualRate || !tenureMonths) {
    return res.status(400).json({ error: 'principal, annualRate, tenureMonths are required' });
  }

  const P = parseFloat(principal);
  const R = parseFloat(annualRate);
  const N = parseInt(tenureMonths);
  const extra = parseFloat(extraMonthly) || 0;

  if (P <= 0 || R < 0 || N <= 0) {
    return res.status(400).json({ error: 'Invalid input values' });
  }

  const emi           = calcEMI(P, R, N);
  const totalPayable  = emi * N;
  const totalInterest = totalPayable - P;

  // Schedule without extra
  const baseSchedule  = buildSchedule(P, R, N, 0);

  // Schedule with extra payment
  let extraResult = null;
  if (extra > 0) {
    const xSchedule = buildSchedule(P, R, N, extra);
    const saved     = totalInterest - xSchedule[xSchedule.length - 1].totalInterest;
    const monthsSaved = N - xSchedule.length;
    extraResult = {
      newTenureMonths: xSchedule.length,
      monthsSaved,
      yearsSaved:   +(monthsSaved / 12).toFixed(1),
      totalInterestWithExtra: +xSchedule[xSchedule.length - 1].totalInterest.toFixed(0),
      interestSaved: +saved.toFixed(0),
    };
  }

  res.json({
    emi:           +emi.toFixed(2),
    totalPayable:  +totalPayable.toFixed(2),
    totalInterest: +totalInterest.toFixed(2),
    principal:      P,
    schedule: baseSchedule,
    extraResult,
  });
});

// ── 2. Loan Portfolio (mock data — would connect to Plaid in production) ──────
router.get('/portfolio', auth, (req, res) => {
  // Realistic demo portfolio with different loan types
  const loans = [
    {
      id: 'loan_1',
      name: 'Education Loan',
      type: 'education',
      emoji: '🎓',
      lender: 'SBI Education',
      principal: 1200000,
      outstanding: 890000,
      annualRate: 10.5,
      emiAmount: 16500,
      tenureMonths: 96,
      completedMonths: 24,
      startDate: '2023-01-15',
      color: '#6C3BEE',
    },
    {
      id: 'loan_2',
      name: 'Credit Card Debt',
      type: 'credit_card',
      emoji: '💳',
      lender: 'HDFC Bank',
      principal: 85000,
      outstanding: 72000,
      annualRate: 36,
      emiAmount: 4200,
      tenureMonths: 24,
      completedMonths: 4,
      startDate: '2024-09-01',
      color: '#EF4444',
      flagged: true,
    },
    {
      id: 'loan_3',
      name: 'Car Loan',
      type: 'car',
      emoji: '🚗',
      lender: 'ICICI Bank',
      principal: 650000,
      outstanding: 420000,
      annualRate: 8.5,
      emiAmount: 14200,
      tenureMonths: 60,
      completedMonths: 22,
      startDate: '2023-05-10',
      color: '#3B82F6',
    },
  ];

  // Sort by highest interest rate for Debt Snowball strategy
  const sorted = [...loans].sort((a, b) => b.annualRate - a.annualRate);

  // Market rate comparison (simulated scanner)
  const marketRates = {
    education: 8.0,
    car: 7.2,
    credit_card: 18.0,
    home: 8.5,
  };

  const withAlerts = loans.map(loan => {
    const marketRate = marketRates[loan.type];
    const overpaying = loan.annualRate - marketRate;
    const monthsLeft = loan.tenureMonths - loan.completedMonths;
    let refinanceSavings = 0;
    if (overpaying > 1) {
      const currentEMI = loan.emiAmount;
      const newEMI = calcEMI(loan.outstanding, marketRate, monthsLeft);
      refinanceSavings = Math.round((currentEMI - newEMI) * monthsLeft);
    }

    return {
      ...loan,
      marketRate,
      overpaying: overpaying > 1,
      refinanceSavings,
      debtProgress: Math.round(((loan.principal - loan.outstanding) / loan.principal) * 100),
    };
  });

  const totalOutstanding = loans.reduce((s, l) => s + l.outstanding, 0);
  const totalEMI         = loans.reduce((s, l) => s + l.emiAmount, 0);
  const avgRate          = loans.reduce((s, l) => s + l.annualRate, 0) / loans.length;

  res.json({
    loans: withAlerts,
    sortedByRate: sorted.map(l => l.id),
    summary: {
      totalOutstanding,
      totalEMI,
      avgRate: +avgRate.toFixed(2),
      loanCount: loans.length,
    },
  });
});

module.exports = router;
