const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema({
  tableNumber: { type: Number, required: true, unique: true },
  capacity: { type: Number, required: true, default: 4 },
  status: { 
    type: String, 
    enum: ['Empty', 'Occupied', 'Billing'], 
    default: 'Empty' 
  },
  currentOrder: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Order',
    default: null 
  },
  section: { type: String, default: 'Main Dining' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Table', tableSchema);
