const router   = require('express').Router();
const auth     = require('../middleware/auth');
const mockData = require('../data/ca_mock_data.json');
const { calculateEMI } = require('../utils/financeEngine');

// ═══════════════════════════════════════════════════════════════════════════════
// 1. CA DIRECTORY — with smart matching
// ═══════════════════════════════════════════════════════════════════════════════
router.get('/directory', auth, (req, res) => {
  const { specialty, location, maxFee, available } = req.query;

  let results = mockData.caDirectory;

  if (specialty)  results = results.filter(ca => ca.complexityHandled.includes(specialty.toLowerCase()));
  if (location)   results = results.filter(ca => ca.location.toLowerCase().includes(location.toLowerCase()));
  if (maxFee)     results = results.filter(ca => ca.consultationFee <= parseInt(maxFee));
  if (available === 'true') results = results.filter(ca => ca.available);

  // Sort by rating desc
  results = results.sort((a, b) => b.rating - a.rating);

  res.json({ cas: results, total: results.length });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 2. PRE-FLIGHT BRIEFCASE — AI tax dossier generator
// ═══════════════════════════════════════════════════════════════════════════════
router.get('/preflight', auth, (req, res) => {
  const { taxCategories } = mockData;

  // Compute 80C gap
  const totalGap = taxCategories.deductions.reduce((s, d) => s + d.gap, 0);
  const potentialSavings = Math.round(totalGap * 0.30); // 30% tax bracket

  // Total deductible expenses found
  const deductibleFound = taxCategories.expenseCategories
    .filter(e => e.deductible)
    .reduce((s, e) => s + e.amount, 0);

  // Income estimation (mock open-banking data)
  const incomeStreams = [
    { source: 'Salary (TDS deducted)', amount: 1080000, tdsDeducted: 85000, verified: true },
    { source: 'Freelance Income',      amount: 240000,  tdsDeducted: 0,     verified: true,  note: 'Section 44ADA available' },
    { source: 'Interest Income',       amount: 38400,   tdsDeducted: 3840,  verified: true },
    { source: 'Dividend Income',       amount: 12000,   tdsDeducted: 0,     verified: true },
  ];

  const totalIncome = incomeStreams.reduce((s, i) => s + i.amount, 0);
  const totalTDSPaid= incomeStreams.reduce((s, i) => s + i.tdsDeducted, 0);

  // Estimated tax liability (rough bracket calculation)
  const taxableIncome = totalIncome - 50000; // ₹50K standard deduction
  let estimatedTax = 0;
  if (taxableIncome > 1500000)      estimatedTax = 150000 + (taxableIncome - 1500000) * 0.30;
  else if (taxableIncome > 1200000) estimatedTax = 90000  + (taxableIncome - 1200000) * 0.20;
  else if (taxableIncome > 900000)  estimatedTax = 45000  + (taxableIncome - 900000)  * 0.15;
  else if (taxableIncome > 600000)  estimatedTax = 15000  + (taxableIncome - 600000)  * 0.10;
  else if (taxableIncome > 300000)  estimatedTax = (taxableIncome - 300000) * 0.05;

  const estimatedRefund = totalTDSPaid - estimatedTax;

  // Red flags
  const redFlags = [];
  if (taxCategories.deductions.find(d => d.section === '80C').gap > 50000)
    redFlags.push({ severity: 'high', msg: '₹55,000 of 80C limit unused — invest before March 31st to save ₹16,500' });
  if (taxCategories.deductions.find(d => d.section === '80D').gap > 0)
    redFlags.push({ severity: 'medium', msg: '80D health insurance gap of ₹13,000 — top up policy before FY end' });
  if (incomeStreams.find(i => i.source.includes('Freelance') && !i.tdsDeducted))
    redFlags.push({ severity: 'high', msg: 'Freelance income of ₹2.4L detected with zero TDS — advance tax due!' });

  res.json({
    generatedAt: new Date().toISOString(),
    fyYear: '2025-26',
    incomeStreams,
    totalIncome,
    totalTDSPaid,
    estimatedTax:     +estimatedTax.toFixed(0),
    estimatedRefund:  +estimatedRefund.toFixed(0),
    deductions:       taxCategories.deductions,
    deductibleExpenses: taxCategories.expenseCategories.filter(e => e.deductible),
    totalDeductibleFound: deductibleFound,
    potentialSavings,
    totalGap,
    redFlags,
    dossierScore: redFlags.length === 0 ? 92 : redFlags.filter(f => f.severity === 'high').length > 0 ? 58 : 74,
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 3. TAX-TWIN SCENARIO ENGINE
// ═══════════════════════════════════════════════════════════════════════════════
router.get('/taxtwin/events', auth, (req, res) => {
  res.json({ events: mockData.taxTwinEvents });
});

router.post('/taxtwin/compute', auth, (req, res) => {
  const { selectedEventIds, baseIncome = 1320000 } = req.body;

  if (!selectedEventIds?.length) return res.status(400).json({ error: 'No events selected' });

  const selectedEvents = mockData.taxTwinEvents.filter(e => selectedEventIds.includes(e.id));
  if (!selectedEvents.length) return res.status(400).json({ error: 'Invalid event IDs' });

  // Sum up complexity and tax impact
  const totalComplexity    = selectedEvents.reduce((s, e) => Math.max(s, e.complexityScore), 0);
  const additionalTaxImpact= selectedEvents.reduce((s, e) => s + e.estimatedTaxImpact, 0);
  const additionalIncome   = selectedEvents.filter(e => e.category === 'income').reduce((s, e) => s + 200000, 0);
  const newTotalIncome     = baseIncome + additionalIncome;

  // Recalculate rough tax
  const taxableIncome = newTotalIncome - 50000;
  let newTax = 0;
  if (taxableIncome > 1500000)      newTax = 150000 + (taxableIncome - 1500000) * 0.30;
  else if (taxableIncome > 1200000) newTax = 90000  + (taxableIncome - 1200000) * 0.20;
  else if (taxableIncome > 900000)  newTax = 45000  + (taxableIncome - 900000)  * 0.15;
  else if (taxableIncome > 600000)  newTax = 15000  + (taxableIncome - 600000)  * 0.10;
  else if (taxableIncome > 300000)  newTax = (taxableIncome - 300000) * 0.05;
  newTax += additionalTaxImpact;

  // Penalty risk
  const penaltyRisk = totalComplexity >= 4;
  const needsCAUpsell = totalComplexity >= 4;

  // Recommended CA specializations
  const tags = [...new Set(selectedEvents.flatMap(e =>
    e.id.includes('crypto') ? ['crypto'] :
    e.id.includes('nri')    ? ['international', 'nri'] :
    e.id.includes('esop')   ? ['startup'] :
    e.id.includes('fo')     ? ['derivatives'] :
    ['freelance']
  ))];

  const recommendedCAs = mockData.caDirectory
    .filter(ca => ca.complexityHandled.some(c => tags.includes(c)))
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 2);

  res.json({
    selectedEvents,
    baseIncome,
    newTotalIncome,
    estimatedAdditionalTax: +additionalTaxImpact.toFixed(0),
    newTotalTax:             +newTax.toFixed(0),
    totalComplexityScore:   totalComplexity,
    complexityLabel:
      totalComplexity <= 1 ? 'Simple'  :
      totalComplexity <= 2 ? 'Moderate':
      totalComplexity <= 3 ? 'Complex' : 'Highly Complex',
    penaltyRisk,
    needsCAUpsell,
    upsellMessage: needsCAUpsell
      ? `⚠️ Complex Tax Event Detected. You have ${selectedEvents.length} high-complexity events. Missing documentation could trigger ₹10,000–₹50,000 penalties. Route to a specialist CA now.`
      : null,
    recommendedCAs,
    estimatedPenaltyAvoidance: needsCAUpsell ? 35000 : 0,
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 4. EPHEMERAL DATA VAULT
// ═══════════════════════════════════════════════════════════════════════════════

// Active vaults (in-memory for demo — production: MongoDB collection)
const activeVaults = new Map();

router.get('/vault/templates', auth, (req, res) => {
  res.json({ templates: mockData.vaultTemplates });
});

router.post('/vault/create', auth, (req, res) => {
  const { caId, caName, selectedStreams, durationDays = 7, userId } = req.body;

  if (!caId || !selectedStreams?.length) {
    return res.status(400).json({ error: 'caId and selectedStreams required' });
  }

  const vaultId = `vault_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

  // Generate a time-limited access token (simulated)
  const accessToken = Buffer.from(`${vaultId}:${caId}:${expiresAt.getTime()}`).toString('base64');

  const vault = {
    vaultId,
    caId,
    caName,
    selectedStreams,
    durationDays,
    createdAt: new Date().toISOString(),
    expiresAt: expiresAt.toISOString(),
    accessToken,
    status: 'active',
    accesses: [],
  };

  activeVaults.set(vaultId, vault);

  res.json({
    success: true,
    vaultId,
    accessToken,
    expiresAt: expiresAt.toISOString(),
    durationDays,
    selectedStreams,
    caPortalLink: `https://nexus-ca-portal.app/vault/${vaultId}?token=${accessToken}`,
    selfDestructsIn: `${durationDays} days`,
    message: `Secure data vault created. ${caName} has read-only access for ${durationDays} days. Access auto-revokes on ${expiresAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}.`,
  });
});

router.get('/vault/list', auth, (req, res) => {
  const vaults = Array.from(activeVaults.values()).map(v => ({
    ...v,
    isExpired: new Date(v.expiresAt) < new Date(),
    hoursRemaining: Math.max(0, Math.round((new Date(v.expiresAt) - Date.now()) / 3600000)),
  }));
  res.json({ vaults });
});

router.delete('/vault/:vaultId', auth, (req, res) => {
  const { vaultId } = req.params;
  if (!activeVaults.has(vaultId)) return res.status(404).json({ error: 'Vault not found' });
  activeVaults.delete(vaultId);
  res.json({ success: true, message: 'Vault destroyed. CA access revoked immediately.' });
});

// Book a CA consultation
router.post('/book', auth, (req, res) => {
  const { caId, slot, consultationType, dossierAttached } = req.body;
  const ca = mockData.caDirectory.find(c => c.id === caId);
  if (!ca) return res.status(404).json({ error: 'CA not found' });

  res.json({
    success: true,
    bookingId: `BK${Date.now()}`,
    ca: { id: ca.id, name: ca.name, firm: ca.firm },
    slot,
    consultationType,
    dossierAttached,
    fee: consultationType === 'quick' ? ca.quickConsultFee : ca.consultationFee,
    message: dossierAttached
      ? `Booking confirmed with ${ca.name}. Your Tax Dossier has been shared — the CA has already reviewed your financials and is ready to advise from minute one! 🚀`
      : `Booking confirmed with ${ca.name} at ${slot}.`,
  });
});

module.exports = router;
