const mongoose = require('mongoose');

const caProfileSchema = new mongoose.Schema({
  name: { type: String, required: true },
  photo: { type: String },
  registrationNumber: { type: String, required: true, unique: true }, // ICAI number
  specializations: [{ type: String }],
  experience: { type: Number, required: true },
  location: {
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String }
  },
  languages: [{ type: String }],
  consultationFee: {
    online: { type: Number, required: true },
    offline: { type: Number, required: true }
  },
  rating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  availability: [{
    day: { type: String }, // e.g. "Monday"
    slots: [{ type: String }] // e.g. "10:00 AM"
  }],
  verified: { type: Boolean, default: true },
  contact: {
    email: { type: String, required: true },
    phone: { type: String },
    website: { type: String }
  },
  about: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('CAProfile', caProfileSchema);
