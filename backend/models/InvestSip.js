const mongoose = require('mongoose');

const InvestSipSchema = new mongoose.Schema({
  userId:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  frequency:       { type: String, enum: ['Daily', 'Monthly', 'Yearly'], required: true },
  assetClass:      { type: String, required: true }, // Mutual Funds, Stocks, ETFs
  assetName:       { type: String, required: true },
  amount:          { type: Number, required: true },
  startDate:       { type: Date, required: true },
  endDate:         { type: Date, default: null }, // Null means "Until I stop"
  deductionDay:    { type: Number, default: 1 }, // E.g., 5th of month
  autoEscalation:  { type: Number, default: 0 }, // Step-up % per year
  expectedReturn:  { type: Number, default: 12 },
  cagr:            { type: String, default: '-' },
  expenseRatio:    { type: String, default: '-' },
  trackingError:   { type: String, default: '-' },
  fundSize:        { type: String, default: '-' },
  status:          { type: String, enum: ['Active', 'Paused', 'Stopped'], default: 'Active' },
  createdAt:       { type: Date, default: Date.now },
});

module.exports = mongoose.model('InvestSip', InvestSipSchema);
