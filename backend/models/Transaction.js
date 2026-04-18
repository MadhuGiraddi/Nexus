const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  userId:              { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  plaidTransactionId:  { type: String, unique: true, required: true },
  accountId:           { type: String, required: true },
  name:                { type: String, required: true },
  merchantName:        { type: String, default: '' },
  amount:              { type: Number, required: true },
  isoCurrencyCode:     { type: String, default: 'USD' },
  date:                { type: Date, required: true },
  category:            [{ type: String }],
  categoryId:          { type: String, default: '' },
  pending:             { type: Boolean, default: false },
  paymentChannel:      { type: String, default: 'other' },
  personalFinanceCategory: { type: String, default: '' },
  logoUrl:             { type: String, default: '' },
  location: {
    city:    String,
    state:   String,
    country: String,
  },
  syncedAt: { type: Date, default: Date.now },
});

TransactionSchema.index({ userId: 1, date: -1 });
TransactionSchema.index({ userId: 1, 'category': 1 });

module.exports = mongoose.model('Transaction', TransactionSchema);
