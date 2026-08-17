const mongoose = require('mongoose');

const bankSchema = new mongoose.Schema({
  name: { type: String, required: true },
  logoUrl: { type: String },
  qrCodeUrl: { type: String },
  qrCodeImage: { type: String },
  accountName: { type: String },
  accountNumber: { type: String },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Bank', bankSchema);
