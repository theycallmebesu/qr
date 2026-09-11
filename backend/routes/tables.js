const express = require('express');
const router = express.Router();
const Table = require('../models/Table');
const Order = require('../models/Order');
const { auth, adminAuth, roleAuth } = require('../middleware/auth');
const { logActivity } = require('../utils/logger');

// Get all tables with current order and active waiter populated
router.get('/', auth, async (req, res) => {
  try {
    const tables = await Table.find()
      .populate({
        path: 'currentOrder',
        select: 'orderNumber status totalPrice items placedAt sentAt waiter waiterName specialInstructions'
      })
      .populate('currentWaiter', 'name username role')
      .sort({ tableNumber: 1 });
    res.json(tables);
  } catch (err) {
    console.error('Fetch tables error:', err);
    res.status(500).json({ message: 'Failed to fetch tables' });
  }
});

// Add new table (Admin only)
router.post('/', adminAuth, async (req, res) => {
  try {
    const { name, tableNumber, capacity, section, photo } = req.body;
    if (!tableNumber) {
      return res.status(400).json({ message: 'Table number is required' });
    }

    const existing = await Table.findOne({ tableNumber: Number(tableNumber) });
    if (existing) {
      return res.status(400).json({ message: `Table #${tableNumber} already exists` });
    }

    const table = new Table({
      name: name ? name.trim() : `Table ${tableNumber}`,
      tableNumber: Number(tableNumber),
      capacity: Number(capacity) || 4,
      section: section || 'Main Dining',
      photo: photo || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80',
      status: 'empty'
    });

    await table.save();

    await logActivity({
      req,
      actionType: 'TABLE_CREATED',
      targetType: 'Table',
      targetId: table._id,
      details: `Created table ${table.name} (#${table.tableNumber})`
    });

    const io = req.app.get('io');
    if (io) io.emit('table:update', { action: 'create', table });

    res.status(201).json(table);
  } catch (err) {
    console.error('Create table error:', err);
    res.status(500).json({ message: 'Failed to create table' });
  }
});

// Update table details (Admin only)
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { name, tableNumber, capacity, section, photo, status } = req.body;
    const table = await Table.findById(req.params.id);
    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    if (tableNumber !== undefined && Number(tableNumber) !== table.tableNumber) {
      const duplicate = await Table.findOne({ tableNumber: Number(tableNumber) });
      if (duplicate && duplicate._id.toString() !== table._id.toString()) {
        return res.status(400).json({ message: `Table #${tableNumber} already exists` });
      }
      table.tableNumber = Number(tableNumber);
    }

    if (name) table.name = name.trim();
    if (capacity !== undefined) table.capacity = Number(capacity);
    if (section !== undefined) table.section = section;
    if (photo !== undefined) table.photo = photo;
    if (status !== undefined) table.status = status.toLowerCase();

    await table.save();

    const io = req.app.get('io');
    if (io) io.emit('table:update', { action: 'update', table });

    res.json(table);
  } catch (err) {
    console.error('Update table error:', err);
    res.status(500).json({ message: 'Failed to update table' });
  }
});

// Update table status (Waiters, Receptionist, Admin)
router.patch('/:id/status', roleAuth(['admin', 'waiter', 'reception']), async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['empty', 'occupied', 'needs bill', 'Empty', 'Occupied', 'Billing'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Choose empty, occupied, or needs bill' });
    }

    const table = await Table.findById(req.params.id);
    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    const cleanStatus = status.toLowerCase() === 'billing' ? 'needs bill' : status.toLowerCase();
    table.status = cleanStatus;

    if (cleanStatus === 'empty') {
      table.currentOrder = null;
      table.currentWaiter = null;
      table.currentWaiterName = '';
    }

    await table.save();

    const populatedTable = await Table.findById(table._id)
      .populate('currentOrder')
      .populate('currentWaiter', 'name username');

    const io = req.app.get('io');
    if (io) io.emit('table:update', { action: 'status_change', table: populatedTable });

    res.json(populatedTable);
  } catch (err) {
    console.error('Update table status error:', err);
    res.status(500).json({ message: 'Failed to update table status' });
  }
});

// Delete table (Admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const table = await Table.findById(req.params.id);
    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    if (table.status !== 'empty') {
      return res.status(400).json({ message: `Cannot delete ${table.name} while it is ${table.status}` });
    }

    await Table.findByIdAndDelete(req.params.id);

    await logActivity({
      req,
      actionType: 'TABLE_DELETED',
      targetType: 'Table',
      targetId: req.params.id,
      details: `Deleted table ${table.name} (#${table.tableNumber})`
    });

    const io = req.app.get('io');
    if (io) io.emit('table:update', { action: 'delete', id: req.params.id });

    res.json({ message: 'Table deleted successfully' });
  } catch (err) {
    console.error('Delete table error:', err);
    res.status(500).json({ message: 'Failed to delete table' });
  }
});

module.exports = router;
