const express = require('express');
const router = express.Router();
const Table = require('../models/Table');
const Order = require('../models/Order');
const { auth, adminAuth, roleAuth } = require('../middleware/auth');
const { logActivity } = require('../utils/logger');

// Get all tables with current order populated
router.get('/', auth, async (req, res) => {
  try {
    const tables = await Table.find()
      .populate({
        path: 'currentOrder',
        select: 'orderNumber status totalPrice items placedAt waiterName'
      })
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
    const { tableNumber, capacity, section } = req.body;
    if (!tableNumber || !capacity) {
      return res.status(400).json({ message: 'Table number and capacity are required' });
    }

    const existing = await Table.findOne({ tableNumber });
    if (existing) {
      return res.status(400).json({ message: `Table #${tableNumber} already exists` });
    }

    const table = new Table({
      tableNumber: Number(tableNumber),
      capacity: Number(capacity),
      section: section || 'Main Dining',
      status: 'Empty'
    });

    await table.save();

    await logActivity({
      req,
      actionType: 'TABLE_CREATED',
      targetType: 'Table',
      targetId: table._id,
      details: `Created Table #${table.tableNumber} (Capacity: ${table.capacity} seats, Section: ${table.section})`
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
    const { tableNumber, capacity, section } = req.body;
    const table = await Table.findById(req.params.id);
    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    if (tableNumber !== undefined && Number(tableNumber) !== table.tableNumber) {
      const duplicate = await Table.findOne({ tableNumber: Number(tableNumber) });
      if (duplicate) {
        return res.status(400).json({ message: `Table #${tableNumber} already exists` });
      }
      table.tableNumber = Number(tableNumber);
    }

    if (capacity !== undefined) table.capacity = Number(capacity);
    if (section !== undefined) table.section = section;

    await table.save();

    const io = req.app.get('io');
    if (io) io.emit('table:update', { action: 'update', table });

    res.json(table);
  } catch (err) {
    console.error('Update table error:', err);
    res.status(500).json({ message: 'Failed to update table' });
  }
});

// Update table status manually (Waiters, Admin, Owner)
router.patch('/:id/status', roleAuth(['admin', 'waiter', 'owner']), async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Empty', 'Occupied', 'Billing'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const table = await Table.findById(req.params.id);
    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    const oldStatus = table.status;
    table.status = status;
    if (status === 'Empty') {
      table.currentOrder = null;
    }
    await table.save();

    await logActivity({
      req,
      actionType: 'TABLE_STATUS_CHANGED',
      targetType: 'Table',
      targetId: table._id,
      details: `Table #${table.tableNumber} status changed from ${oldStatus} to ${status}`
    });

    const io = req.app.get('io');
    if (io) io.emit('table:update', { action: 'status_change', table });

    res.json(table);
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

    if (table.status !== 'Empty') {
      return res.status(400).json({ message: `Cannot delete Table #${table.tableNumber} while it is ${table.status}` });
    }

    await Table.findByIdAndDelete(req.params.id);

    await logActivity({
      req,
      actionType: 'TABLE_DELETED',
      targetType: 'Table',
      targetId: req.params.id,
      details: `Deleted Table #${table.tableNumber}`
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
