const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  principalAmount: { type: Number, required: true },
  durationMonths: { type: Number, required: true },
  interestRate: { type: Number, required: true },
  emiAmount: { type: Number, required: true },
  purpose: { type: String, default: 'Personal' },
  status: { type: String, enum: ['pending', 'approved', 'active', 'funded', 'rejected'], default: 'pending' },
  timeline: [{
    status: { type: String },
    timestamp: { type: Date, default: Date.now },
    notes: { type: String }
  }],
  documents: [{
    name: { type: String },
    url:  { type: String },
    type: { type: String }
  }]
}, { timestamps: true });

// Add a default timeline event on creation
loanSchema.pre('save', function(next) {
  if (this.isNew) {
    this.timeline.push({ status: 'pending', notes: 'Application submitted for AI review.' });
  }
  next();
});

module.exports = mongoose.model('Loan', loanSchema);
