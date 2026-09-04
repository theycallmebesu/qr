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
    enum: ['Pending', 'Preparing', 'Ready', 'Served'],
    default: 'Pending'
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
  items: [orderItemSchema],
  status: { 
    type: String, 
    enum: ['Pending', 'Preparing', 'Ready', 'Served', 'Completed', 'Cancelled'], 
    default: 'Pending' 
  },
  waiter: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  waiterName: { type: String, default: '' },
  chef: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    default: null 
  },
  chefName: { type: String, default: '' },
  specialInstructions: { type: String, default: '' },
  totalPrice: { type: Number, required: true, default: 0 },
  placedAt: { type: Date, default: Date.now },
  preparingAt: { type: Date },
  readyAt: { type: Date },
  servedAt: { type: Date },
  completedAt: { type: Date },
  cancelledAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
