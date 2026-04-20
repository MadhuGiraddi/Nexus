const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  role:    { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  model:   { type: String, default: '' },
  mode:    { type: String, enum: ['fast', 'thinking'], default: 'thinking' },
  createdAt: { type: Date, default: Date.now },
});

const ChatSessionSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title:     { type: String, default: 'New Conversation' },
  mode:      { type: String, enum: ['fast', 'thinking'], default: 'thinking' },
  messages:  [MessageSchema],
  updatedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

// Auto-update updatedAt
ChatSessionSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Auto-generate title from first user message
ChatSessionSchema.methods.generateTitle = function () {
  const first = this.messages.find(m => m.role === 'user');
  if (first) {
    this.title = first.content.slice(0, 60) + (first.content.length > 60 ? '…' : '');
  }
};

module.exports = mongoose.model('ChatSession', ChatSessionSchema);
