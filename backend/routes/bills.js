const express = require('express');
const router = express.Router();
const Bill = require('../models/Bill');
const Order = require('../models/Order');
const Table = require('../models/Table');
const { auth, roleAuth } = require('../middleware/auth');
const { logActivity } = require('../utils/logger');

// Get all bills (with optional date range or table filter)
router.get('/', auth, async (req, res) => {
  try {
    const { startDate, endDate, tableNumber } = req.query;
    const filter = {};

    if (startDate || endDate) {
      filter.closedAt = {};
      if (startDate) filter.closedAt.$gte = new Date(startDate);
      if (endDate) filter.closedAt.$lte = new Date(endDate);
    }

    if (tableNumber) {
      filter.tableNumber = Number(tableNumber);
    }

    const bills = await Bill.find(filter)
      .populate('order')
      .populate('table', 'tableNumber section')
      .populate('closedBy', 'name role')
      .sort({ closedAt: -1 });

    res.json(bills);
  } catch (err) {
    console.error('Fetch bills error:', err);
    res.status(500).json({ message: 'Failed to fetch bills' });
  }
});

// Generate and close bill (Waiter, Admin, Owner)
router.post('/close', roleAuth(['waiter', 'admin', 'owner']), async (req, res) => {
  try {
    const { orderId, paymentMethod, discountAmount } = req.body;

    if (!orderId) {
      return res.status(400).json({ message: 'Order ID is required' });
    }

    const order = await Order.findById(orderId).populate('table');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Prepare bill items
    const billItems = order.items.map(item => ({
      name: item.name,
      price: item.price,
      qty: item.qty,
      total: item.price * item.qty
    }));

    const subtotal = billItems.reduce((acc, curr) => acc + curr.total, 0);
    const taxRate = 0.10; // 10%
    const taxAmount = Number((subtotal * taxRate).toFixed(2));
    const discount = Number(discountAmount) || 0;
    const total = Number(Math.max(0, subtotal + taxAmount - discount).toFixed(2));

    const billNumber = `INV-${Date.now().toString().slice(-6)}-T${order.tableNumber}`;

    const bill = new Bill({
      billNumber,
      order: order._id,
      table: order.table._id || order.table,
      tableNumber: order.tableNumber,
      items: billItems,
      subtotal,
      taxRate,
      taxAmount,
      discountAmount: discount,
      total,
      paymentMethod: paymentMethod || 'Cash',
      status: 'Paid',
      closedBy: req.user.id,
      closedByName: req.user.name,
      closedAt: new Date()
    });

    await bill.save();

    // Update order status to Completed
    order.status = 'Completed';
    order.completedAt = new Date();
    await order.save();

    // Reset table to Empty
    const table = await Table.findById(order.table._id || order.table);
    if (table) {
      table.status = 'Empty';
      table.currentOrder = null;
      await table.save();
    }

    // Log Activity
    await logActivity({
      req,
      actionType: 'BILL_PAID',
      targetType: 'Bill',
      targetId: bill._id,
      details: `${req.user.name} settled bill ${bill.billNumber} for Table #${order.tableNumber} ($${bill.total.toFixed(2)} via ${bill.paymentMethod})`
    });

    const populatedBill = await Bill.findById(bill._id)
      .populate('order')
      .populate('table')
      .populate('closedBy', 'name role');

    // Real-time broadcast
    const io = req.app.get('io');
    if (io) {
      io.emit('bill:paid', populatedBill);
      io.emit('order:status_update', order);
      if (table) {
        io.emit('table:update', { action: 'freed', table });
      }
    }

    res.status(201).json(populatedBill);
  } catch (err) {
    console.error('Close bill error:', err);
    res.status(500).json({ message: 'Failed to generate and settle bill' });
  }
});

// Cancel / Override bill (Owner, Admin only)
router.patch('/:id/cancel', roleAuth(['owner', 'admin']), async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    bill.status = 'Cancelled';
    await bill.save();

    await logActivity({
      req,
      actionType: 'BILL_CANCELLED',
      targetType: 'Bill',
      targetId: bill._id,
      details: `${req.user.name} (${req.user.role}) cancelled Bill #${bill.billNumber} ($${bill.total.toFixed(2)})`
    });

    const io = req.app.get('io');
    if (io) io.emit('bill:update', { action: 'cancelled', bill });

    res.json(bill);
  } catch (err) {
    console.error('Cancel bill error:', err);
    res.status(500).json({ message: 'Failed to cancel bill' });
  }
});

module.exports = router;
