const mongoose = require('mongoose');

const paymentItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  qty: { type: Number, required: true },
  notes: { type: String, default: '' },
  total: { type: Number, required: true }
});

const paymentSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  dateTime: { type: Date, default: Date.now, required: true },
  table: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Table'
  },
  tableNumber: { type: Number, required: true },
  tableName: { type: String, default: '' },
  waiter: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User'
  },
  waiterName: { type: String, default: 'Staff' },
  items: [paymentItemSchema],
  subtotal: { type: Number, required: true },
  taxRate: { type: Number, default: 0.13 }, // 13% Nepal VAT
  taxAmount: { type: Number, default: 0 },
  serviceChargeRate: { type: Number, default: 0.10 }, // 10% Service Charge
  serviceCharge: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  total: { type: Number, required: true },
  paymentMethod: { 
    type: String, 
    enum: ['Cash', 'Card', 'Fonepay QR', 'eSewa', 'Online', 'UPI'], 
    default: 'Cash' 
  },
  status: { 
    type: String, 
    enum: ['Paid', 'Refunded', 'Cancelled'], 
    default: 'Paid' 
  },
  order: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Order'
  },
  closedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User'
  },
  closedByName: { type: String, default: 'Receptionist' },
  notes: { type: String, default: '' }
}, { timestamps: true });

// Index for fast search by date and table
paymentSchema.index({ dateTime: -1 });
paymentSchema.index({ tableNumber: 1 });

module.exports = mongoose.model('Payment', paymentSchema, 'payments');
