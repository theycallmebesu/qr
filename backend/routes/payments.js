const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const Table = require('../models/Table');
const { auth, roleAuth, adminAuth } = require('../middleware/auth');
const { logActivity } = require('../utils/logger');

// Get payments / invoices history (Receptionist & Admin)
router.get('/', roleAuth(['reception', 'admin']), async (req, res) => {
  try {
    const { date, startDate, endDate, invoiceNumber, tableNumber, waiterId } = req.query;
    const filter = {};

    if (invoiceNumber) {
      filter.invoiceNumber = new RegExp(invoiceNumber.trim(), 'i');
    }

    if (tableNumber) {
      filter.tableNumber = Number(tableNumber);
    }

    if (waiterId) {
      filter.waiter = waiterId;
    }

    if (date) {
      const d = new Date(date);
      const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const endOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
      filter.dateTime = { $gte: startOfDay, $lte: endOfDay };
    } else if (startDate || endDate) {
      filter.dateTime = {};
      if (startDate) filter.dateTime.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.dateTime.$lte = end;
      }
    }

    const payments = await Payment.find(filter)
      .populate('table', 'name tableNumber section')
      .populate('waiter', 'name username')
      .populate('closedBy', 'name username role')
      .sort({ dateTime: -1 });

    res.json(payments);
  } catch (err) {
    console.error('Fetch payments error:', err);
    res.status(500).json({ message: 'Failed to fetch payments' });
  }
});

// Export day's invoices / invoice backup as downloadable JSON file
router.get('/export', roleAuth(['reception', 'admin']), async (req, res) => {
  try {
    const { date, invoiceNumber } = req.query;
    const filter = {};

    if (invoiceNumber) {
      filter.invoiceNumber = invoiceNumber;
    } else if (date) {
      const d = new Date(date);
      const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const endOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
      filter.dateTime = { $gte: startOfDay, $lte: endOfDay };
    }

    const payments = await Payment.find(filter).lean();

    const exportPayload = {
      exportMetadata: {
        exportedAt: new Date().toISOString(),
        exportedBy: req.user.name,
        count: payments.length,
        filterDate: date || 'ALL'
      },
      invoices: payments
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=invoices-backup-${date || 'all'}-${Date.now()}.json`);
    res.send(JSON.stringify(exportPayload, null, 2));
  } catch (err) {
    console.error('Export payments error:', err);
    res.status(500).json({ message: 'Failed to export payments' });
  }
});

// Re-import JSON backup file into MongoDB (Admin only)
router.post('/import', adminAuth, async (req, res) => {
  try {
    const { invoices } = req.body;
    const rawList = Array.isArray(invoices) ? invoices : (Array.isArray(req.body) ? req.body : []);

    if (rawList.length === 0) {
      return res.status(400).json({ message: 'No valid invoice array found to import' });
    }

    let importedCount = 0;
    let skippedCount = 0;

    for (const item of rawList) {
      if (!item.invoiceNumber) continue;

      const existing = await Payment.findOne({ invoiceNumber: item.invoiceNumber });
      if (existing) {
        skippedCount++;
        continue;
      }

      // Create new payment from backup
      const payment = new Payment({
        invoiceNumber: item.invoiceNumber,
        dateTime: item.dateTime ? new Date(item.dateTime) : new Date(),
        tableNumber: Number(item.tableNumber) || 1,
        tableName: item.tableName || `Table ${item.tableNumber || 1}`,
        waiterName: item.waiterName || 'Staff',
        items: item.items || [],
        subtotal: Number(item.subtotal) || 0,
        taxAmount: Number(item.taxAmount) || 0,
        serviceCharge: Number(item.serviceCharge) || 0,
        discountAmount: Number(item.discountAmount) || 0,
        total: Number(item.total) || 0,
        paymentMethod: item.paymentMethod || 'Cash',
        status: item.status || 'Paid',
        closedByName: item.closedByName || req.user.name,
        notes: item.notes || 'Imported from backup'
      });

      await payment.save();
      importedCount++;
    }

    await logActivity({
      req,
      actionType: 'INVOICES_IMPORTED',
      targetType: 'Payment',
      details: `Admin ${req.user.name} imported ${importedCount} backup invoices (${skippedCount} duplicates skipped)`
    });

    res.json({
      message: `Import completed: ${importedCount} new invoices imported, ${skippedCount} existing invoices preserved.`,
      importedCount,
      skippedCount
    });
  } catch (err) {
    console.error('Import payments error:', err);
    res.status(500).json({ message: 'Failed to import invoices from JSON file' });
  }
});

// Process Checkout & Bill Settlement (Receptionist & Admin)
// Checkout is NOT dependent on kitchen ready or waiter served!
router.post('/checkout', roleAuth(['reception', 'admin']), async (req, res) => {
  try {
    const { tableId, orderId, paymentMethod, discountAmount = 0, taxRate = 0.13, serviceChargeRate = 0.10 } = req.body;

    let targetOrder = null;
    let targetTable = null;

    if (orderId) {
      targetOrder = await Order.findById(orderId).populate('table');
      if (targetOrder) {
        targetTable = await Table.findById(targetOrder.table?._id || targetOrder.table);
      }
    } else if (tableId) {
      targetTable = await Table.findById(tableId).populate('currentOrder');
      if (targetTable && targetTable.currentOrder) {
        targetOrder = await Order.findById(targetTable.currentOrder);
      }
    }

    if (!targetOrder && !targetTable) {
      return res.status(404).json({ message: 'Active table or order not found for checkout' });
    }

    // Bill items
    const billItems = (targetOrder?.items || []).map(it => ({
      name: it.name,
      price: it.price,
      qty: it.qty,
      notes: it.notes || '',
      total: it.price * it.qty
    }));

    const subtotal = billItems.reduce((sum, it) => sum + it.total, 0);
    const calculatedTax = Number((subtotal * Number(taxRate)).toFixed(2));
    const calculatedService = Number((subtotal * Number(serviceChargeRate)).toFixed(2));
    const discount = Math.max(0, Number(discountAmount) || 0);
    const finalTotal = Math.max(0, Number((subtotal + calculatedTax + calculatedService - discount).toFixed(2)));

    const tblNum = targetTable?.tableNumber || targetOrder?.tableNumber || 1;
    const tblName = targetTable?.name || targetOrder?.tableName || `Table ${tblNum}`;
    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}-T${tblNum}`;

    const payment = new Payment({
      invoiceNumber,
      dateTime: new Date(),
      table: targetTable?._id,
      tableNumber: tblNum,
      tableName: tblName,
      waiter: targetOrder?.waiter,
      waiterName: targetOrder?.waiterName || targetTable?.currentWaiterName || 'Staff',
      items: billItems,
      subtotal,
      taxRate: Number(taxRate),
      taxAmount: calculatedTax,
      serviceChargeRate: Number(serviceChargeRate),
      serviceCharge: calculatedService,
      discountAmount: discount,
      total: finalTotal,
      paymentMethod: paymentMethod || 'Cash',
      status: 'Paid',
      order: targetOrder?._id,
      closedBy: req.user.id,
      closedByName: req.user.name
    });

    await payment.save();

    // Mark Order as Completed
    if (targetOrder) {
      targetOrder.status = 'Completed';
      targetOrder.completedAt = new Date();
      await targetOrder.save();
    }

    // Mark Table as Free (empty)
    if (targetTable) {
      targetTable.status = 'empty';
      targetTable.currentOrder = null;
      targetTable.currentWaiter = null;
      targetTable.currentWaiterName = '';
      await targetTable.save();
    }

    await logActivity({
      req,
      actionType: 'CHECKOUT_COMPLETED',
      targetType: 'Payment',
      targetId: payment._id,
      details: `${req.user.name} checked out ${tblName} (Rs. ${finalTotal} via ${payment.paymentMethod})`
    });

    const populatedPayment = await Payment.findById(payment._id)
      .populate('table')
      .populate('waiter', 'name username')
      .populate('closedBy', 'name username role');

    const io = req.app.get('io');
    if (io) {
      io.emit('payment:completed', populatedPayment);
      if (targetTable) {
        io.emit('table:update', { action: 'freed', table: targetTable });
      }
      if (targetOrder) {
        io.emit('order:status_update', targetOrder);
      }
    }

    res.status(201).json(populatedPayment);
  } catch (err) {
    console.error('Checkout error:', err);
    res.status(500).json({ message: 'Failed to complete checkout' });
  }
});

// Get single payment
router.get('/:id', roleAuth(['reception', 'admin']), async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('table')
      .populate('waiter')
      .populate('closedBy');

    if (!payment) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    res.json(payment);
  } catch (err) {
    console.error('Fetch payment error:', err);
    res.status(500).json({ message: 'Failed to fetch invoice' });
  }
});

module.exports = router;
