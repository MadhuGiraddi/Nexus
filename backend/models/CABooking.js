const mongoose = require('mongoose');

const caBookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  caId: { type: mongoose.Schema.Types.ObjectId, ref: 'CAProfile', required: true },
  type: { type: String, enum: ['online', 'offline'], required: true },
  date: { type: Date, required: true }, // Storing the ISO date of the booking
  timeSlot: { type: String, required: true }, // e.g. "10:30 AM"
  topic: { type: String, required: true },
  status: { type: String, enum: ['pending', 'confirmed', 'cancelled', 'completed'], default: 'pending' },
  meetLink: { type: String },
  hasReviewed: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('CABooking', caBookingSchema);
