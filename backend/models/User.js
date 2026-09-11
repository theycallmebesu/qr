const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  username: { type: String, required: true, unique: true, lowercase: true, trim: true },
  position: { 
    type: String, 
    required: true, 
    trim: true,
    default: 'Floor Waiter'
  },
  passwordHash: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['admin', 'waiter', 'kitchen', 'reception', 'chef', 'receptionist', 'owner'], 
    default: 'waiter',
    required: true 
  },
  active: { type: Boolean, default: true },
  phone: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema, 'users');
