const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true }, // e.g. "Table 4", "Rooftop Table 1"
  tableNumber: { type: Number, required: true, unique: true },
  capacity: { type: Number, required: true, default: 4 },
  photo: { 
    type: String, 
    default: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80' 
  },
  status: { 
    type: String, 
    enum: ['empty', 'occupied', 'needs bill', 'Empty', 'Occupied', 'Billing'], 
    default: 'empty',
    set: (v) => (v ? v.toLowerCase() : 'empty')
  },
  currentOrder: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Order',
    default: null 
  },
  currentWaiter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  currentWaiterName: { type: String, default: '' },
  section: { type: String, default: 'Main Dining' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Table', tableSchema, 'tables');
