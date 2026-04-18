const mongoose = require('mongoose');

const StockHoldingSchema = new mongoose.Schema({
  userId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  symbol:       { type: String, required: true },
  quantity:     { type: Number, required: true },
  avgPrice:     { type: Number, required: true },
  sector:       { type: String, default: 'All' },
  lastPrice:    { type: Number, default: 0 },
  updatedAt:    { type: Date, default: Date.now },
});

module.exports = mongoose.model('StockHolding', StockHoldingSchema);
