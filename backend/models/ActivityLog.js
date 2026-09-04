const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User'
  },
  userName: { type: String, required: true },
  userRole: { type: String, required: true },
  actionType: { 
    type: String, 
    required: true,
    enum: [
      'ORDER_CREATED',
      'ORDER_STATUS_CHANGED',
      'ORDER_CANCELLED',
      'ITEM_STATUS_CHANGED',
      'BILL_GENERATED',
      'BILL_PAID',
      'BILL_CANCELLED',
      'TABLE_STATUS_CHANGED',
      'TABLE_CREATED',
      'TABLE_DELETED',
      'MENU_ITEM_CREATED',
      'MENU_ITEM_UPDATED',
      'MENU_ITEM_STOCK_TOGGLED',
      'MENU_ITEM_DELETED',
      'STAFF_CREATED',
      'STAFF_UPDATED',
      'STAFF_PASSWORD_RESET',
      'STAFF_STATUS_TOGGLED'
    ]
  },
  targetType: { 
    type: String, 
    enum: ['Order', 'Bill', 'Table', 'MenuItem', 'User', 'System'],
    required: true 
  },
  targetId: { type: String, default: '' },
  details: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ActivityLog', activityLogSchema);
