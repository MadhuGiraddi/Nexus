/**
 * financeEngine.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Isolated financial math engine. All heavy calculations live here.
 * Import this in routes — DO NOT duplicate logic in React components.
 */

// ── Standard EMI Formula: E = P × r × (1+r)^n / ((1+r)^n - 1) ───────────────
function calculateEMI(principal, annualRate, tenureMonths) {
  if (!principal || !annualRate || !tenureMonths) return 0;
  const r = annualRate / 100 / 12;
  if (r === 0) return principal / tenureMonths;
  const factor = Math.pow(1 + r, tenureMonths);
  return (principal * r * factor) / (factor - 1);
}

// ── Reverse EMI: Given max EMI, what principal can you afford? ────────────────
function reversePrincipalFromEMI(maxEMI, annualRate, tenureMonths) {
  const r = annualRate / 100 / 12;
  if (r === 0) return maxEMI * tenureMonths;
  const factor = Math.pow(1 + r, tenureMonths);
  return (maxEMI * (factor - 1)) / (r * factor);
}

// ── Full amortization schedule with optional extra monthly payment ─────────────
function generateAmortizationSchedule(principal, annualRate, tenureMonths, extraMonthly = 0) {
  const r = annualRate / 100 / 12;
  const baseEMI = calculateEMI(principal, annualRate, tenureMonths);
  const totalPayment = baseEMI + extraMonthly;
  const schedule = [];
  let balance = principal;
  let month = 0;

  while (balance > 0.01 && month < tenureMonths + 600) {
    month++;
    const interest = balance * r;
    let principalPaid = totalPayment - interest;
    if (principalPaid > balance) principalPaid = balance;
    balance = Math.max(balance - principalPaid, 0);
    schedule.push({
      month,
      payment:       +(totalPayment).toFixed(2),
      interest:      +interest.toFixed(2),
      principal:     +principalPaid.toFixed(2),
      balance:       +balance.toFixed(2),
    });
  }

  let cum = 0;
  schedule.forEach(m => { cum += m.interest; m.totalInterest = +cum.toFixed(2); });
  return schedule;
}

// ── Blended / Weighted average interest rate across BNPL debts ───────────────
// Formula: Σ(outstanding_i × rate_i) / Σ(outstanding_i)
function calculateBlendedInterestRate(bnplArray) {
  const totalOutstanding = bnplArray.reduce((s, b) => s + b.outstanding, 0);
  if (totalOutstanding === 0) return 0;
  const weightedSum = bnplArray.reduce((s, b) => s + (b.outstanding * b.implicitAnnualRate), 0);
  return +(weightedSum / totalOutstanding).toFixed(2);
}

// ── Annual interest cost of BNPL debts ────────────────────────────────────────
function calculateAnnualBNPLCost(bnplArray) {
  return bnplArray.reduce((s, b) => {
    const annualInterest = b.outstanding * (b.implicitAnnualRate / 100);
    const annualLateFee  = b.lateFeePerMonth * 12;
    return s + annualInterest + annualLateFee;
  }, 0);
}

// ── Rescue loan arbitrage savings ─────────────────────────────────────────────
// Savings = current BNPL annual cost - new loan annual interest cost
function calculateRescueSavings(totalBnplOutstanding, blendedRate, rescueLoanRate, tenureMonths = 24) {
  const currentAnnualCost   = totalBnplOutstanding * (blendedRate / 100);
  const rescueEMI           = calculateEMI(totalBnplOutstanding, rescueLoanRate, tenureMonths);
  const rescueTotalInterest = (rescueEMI * tenureMonths) - totalBnplOutstanding;
  const rescueAnnualCost    = rescueTotalInterest / (tenureMonths / 12);
  const annualSavings       = currentAnnualCost - rescueAnnualCost;
  return {
    currentAnnualCost:   +currentAnnualCost.toFixed(0),
    rescueAnnualCost:    +rescueAnnualCost.toFixed(0),
    annualSavings:       +annualSavings.toFixed(0),
    rescueEMI:           +rescueEMI.toFixed(0),
    rescueTotalInterest: +rescueTotalInterest.toFixed(0),
  };
}

// ── Rent-vs-Buy crossover projection ──────────────────────────────────────────
// Projects N years of cumulative rent paid vs cumulative home ownership cost
function calculateRentVsBuyCrossover(currentRent, propertyValue, loanRate, tenureYears, years = 15) {
  const downPayment     = propertyValue * 0.2;
  const loanAmount      = propertyValue - downPayment;
  const tenureMonths    = tenureYears * 12;
  const emi             = calculateEMI(loanAmount, loanRate, tenureMonths);
  const RENT_INFLATION  = 0.07; // 7% annual rent inflation
  const PROP_APPRECIATION = 0.085; // 8.5% annual appreciation

  const data = [];
  let cumulativeRent      = 0;
  let cumulativeOwnership = downPayment; // includes down payment as sunk cost
  let currentRentMonth    = currentRent;
  let propertyVal         = propertyValue;

  let crossoverYear = null;

  for (let y = 1; y <= years; y++) {
    // Annual figures
    const annualRent  = currentRentMonth * 12;
    const annualEMI   = Math.min(emi * 12, loanAmount + (loanAmount * loanRate / 100)); // cap at loan done

    cumulativeRent      += annualRent;
    cumulativeOwnership += annualEMI;
    propertyVal         *= (1 + PROP_APPRECIATION);

    // Net ownership cost = cumulative EMI + maintenance - property value gained
    const propertyGain  = propertyVal - propertyValue;
    const netOwnership  = cumulativeOwnership - propertyGain;

    if (!crossoverYear && netOwnership < cumulativeRent) crossoverYear = y;

    data.push({
      year:           `${new Date().getFullYear() + y}`,
      cumulativeRent: +cumulativeRent.toFixed(0),
      netOwnership:   +Math.max(netOwnership, 0).toFixed(0),
      propertyValue:  +propertyVal.toFixed(0),
    });

    currentRentMonth *= (1 + RENT_INFLATION / 12) * 12; // step up annually
  }

  return { data, crossoverYear };
}

// ── Max property value from safe EMI ─────────────────────────────────────────
function maxPropertyFromSafeEMI(safeEMI, annualRate, tenureYears, downPaymentRatio = 0.2) {
  const loanAmount    = reversePrincipalFromEMI(safeEMI, annualRate, tenureYears * 12);
  const propertyValue = loanAmount / (1 - downPaymentRatio);
  return {
    maxLoan:          +loanAmount.toFixed(0),
    maxPropertyValue: +propertyValue.toFixed(0),
    downPayment:      +(propertyValue * downPaymentRatio).toFixed(0),
    emi:              +safeEMI.toFixed(0),
  };
}

module.exports = {
  calculateEMI,
  reversePrincipalFromEMI,
  generateAmortizationSchedule,
  calculateBlendedInterestRate,
  calculateAnnualBNPLCost,
  calculateRescueSavings,
  calculateRentVsBuyCrossover,
  maxPropertyFromSafeEMI,
};
