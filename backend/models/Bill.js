const mongoose = require('mongoose');

const billSchema = new mongoose.Schema({
  billNumber: { type: String, required: true, unique: true },
  order: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Order', 
    required: true 
  },
  table: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Table', 
    required: true 
  },
  tableNumber: { type: Number, required: true },
  items: [{
    name: { type: String, required: true },
    price: { type: Number, required: true },
    qty: { type: Number, required: true },
    total: { type: Number, required: true }
  }],
  subtotal: { type: Number, required: true },
  taxRate: { type: Number, default: 0.10 }, // 10% standard tax
  taxAmount: { type: Number, required: true },
  discountAmount: { type: Number, default: 0 },
  total: { type: Number, required: true },
  paymentMethod: { 
    type: String, 
    enum: ['Cash', 'Card', 'Online', 'UPI'], 
    default: 'Cash' 
  },
  status: { 
    type: String, 
    enum: ['Paid', 'Unpaid', 'Cancelled'], 
    default: 'Paid' 
  },
  closedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  closedByName: { type: String, default: '' },
  closedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Bill', billSchema);
