const mongoose = require('mongoose');

const InvestTriggerSchema = new mongoose.Schema({
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  triggerType: { 
    type: String, 
    enum: ['round_up', 'guilt_free', 'entertainment_tax', 'cashback_sweep'],
    required: true 
  },
  active:      { type: Boolean, default: false },
  config:      { type: mongoose.Schema.Types.Mixed, default: {} },
  // Example config: 
  // round_up: { roundTo: 10, targetAsset: 'Liquid Fund' }
  // guilt_free: { Zomato: 20, Swiggy: 20, targetAsset: 'Gold ETF' }
  createdAt:   { type: Date, default: Date.now },
});

module.exports = mongoose.model('InvestTrigger', InvestTriggerSchema);
