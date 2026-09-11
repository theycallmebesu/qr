const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  menuItem: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'MenuItem',
    required: true 
  },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  qty: { type: Number, required: true, min: 1 },
  notes: { type: String, default: '' },
  status: { 
    type: String, 
    enum: ['Sent', 'Preparing', 'Ready', 'Served', 'Pending'],
    default: 'Sent'
  }
});

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true },
  table: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Table', 
    required: true 
  },
  tableNumber: { type: Number, required: true },
  tableName: { type: String, default: '' },
  items: [orderItemSchema],
  status: { 
    type: String, 
    enum: ['Sent', 'Preparing', 'Ready', 'Served', 'Completed', 'Cancelled', 'Pending'], 
    default: 'Sent' 
  },
  waiter: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  waiterName: { type: String, required: true },
  specialInstructions: { type: String, default: '' },
  totalPrice: { type: Number, required: true, default: 0 },
  sentAt: { type: Date, default: Date.now },
  placedAt: { type: Date, default: Date.now },
  preparingAt: { type: Date },
  readyAt: { type: Date },
  servedAt: { type: Date },
  completedAt: { type: Date },
  cancelledAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema, 'orders');
