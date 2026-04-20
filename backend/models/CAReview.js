const mongoose = require('mongoose');

const caReviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  caId: { type: mongoose.Schema.Types.ObjectId, ref: 'CAProfile', required: true },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'CABooking', required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, required: true }
}, { timestamps: true });

// Optionally prevent a user from reviewing the same booking twice
caReviewSchema.index({ user: 1, bookingId: 1 }, { unique: true });

module.exports = mongoose.model('CAReview', caReviewSchema);
