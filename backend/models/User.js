const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const PlaidItemSchema = new mongoose.Schema({
  accessToken: { type: String, required: true },
  itemId:      { type: String, required: true },
  institutionId:   { type: String, default: '' },
  institutionName: { type: String, default: 'Bank' },
  institutionLogo: { type: String, default: '' },
  linkedAt: { type: Date, default: Date.now },
});

const UserSchema = new mongoose.Schema({
  name:       { type: String, required: true, trim: true },
  email:      { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:   { type: String, required: true, minlength: 6 },
  plaidItems: [PlaidItemSchema],
  walletBalance: { type: Number, default: 50000.00 },
  createdAt:  { type: Date, default: Date.now },
});

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

UserSchema.methods.matchPassword = async function (plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model('User', UserSchema);
