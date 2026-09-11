const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Table = require('../models/Table');
const MenuItem = require('../models/MenuItem');
const { auth, roleAuth, normalizeRole } = require('../middleware/auth');
const { logActivity } = require('../utils/logger');

// Get orders list
router.get('/', auth, async (req, res) => {
  try {
    const { status, tableId, myOrdersOnly } = req.query;
    const filter = {};
    const userRole = normalizeRole(req.user.role);

    // If waiter asks for their own active orders
    if (myOrdersOnly === 'true' || userRole === 'waiter') {
      filter.waiter = req.user.id;
    }

    if (status) {
      if (status === 'active') {
        filter.status = { $in: ['Sent', 'Preparing', 'Ready', 'Served', 'Pending'] };
      } else if (status === 'kitchen_queue') {
        filter.status = { $in: ['Sent', 'Preparing', 'Pending'] };
      } else {
        filter.status = status;
      }
    }

    if (tableId) {
      filter.table = tableId;
    }

    const orders = await Order.find(filter)
      .populate('table', 'name tableNumber capacity status section photo')
      .populate('waiter', 'name username role')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    console.error('Fetch orders error:', err);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

// Get kitchen queue (Kitchen role & Admin only)
router.get('/kitchen/queue', roleAuth(['kitchen', 'admin']), async (req, res) => {
  try {
    // Only Sent and Preparing orders waiting in kitchen
    const orders = await Order.find({ status: { $in: ['Sent', 'Preparing', 'Pending'] } })
      .populate('table', 'name tableNumber section')
      .populate('waiter', 'name username')
      .sort({ sentAt: 1, placedAt: 1 });

    res.json(orders);
  } catch (err) {
    console.error('Fetch kitchen queue error:', err);
    res.status(500).json({ message: 'Failed to fetch kitchen queue' });
  }
});

// Get single order by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('table')
      .populate('waiter', 'name username role');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(order);
  } catch (err) {
    console.error('Fetch single order error:', err);
    res.status(500).json({ message: 'Failed to fetch order' });
  }
});

// Create new order (Waiter & Admin)
router.post('/', roleAuth(['waiter', 'admin']), async (req, res) => {
  try {
    const { tableId, items, specialInstructions } = req.body;

    if (!tableId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Table and at least one menu item are required' });
    }

    const table = await Table.findById(tableId);
    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    let totalPrice = 0;
    const processedItems = [];

    for (const it of items) {
      const menuItem = await MenuItem.findById(it.menuItemId || it.menuItem);
      if (!menuItem) {
        return res.status(400).json({ message: `Menu item not found: ${it.name || it.menuItemId}` });
      }
      if (!menuItem.inStock) {
        return res.status(400).json({ message: `"${menuItem.name}" is currently OUT OF STOCK` });
      }

      const qty = Math.max(1, Number(it.qty) || 1);
      const itemTotal = menuItem.price * qty;
      totalPrice += itemTotal;

      processedItems.push({
        menuItem: menuItem._id,
        name: menuItem.name,
        price: menuItem.price,
        qty,
        notes: it.notes || '',
        status: 'Sent'
      });
    }

    const orderNumber = `ORD-${Date.now().toString().slice(-6)}-T${table.tableNumber}`;

    const order = new Order({
      orderNumber,
      table: table._id,
      tableNumber: table.tableNumber,
      tableName: table.name || `Table ${table.tableNumber}`,
      items: processedItems,
      status: 'Sent',
      waiter: req.user.id,
      waiterName: req.user.name,
      specialInstructions: specialInstructions || '',
      totalPrice,
      sentAt: new Date(),
      placedAt: new Date()
    });

    await order.save();

    // Attach to table and mark table occupied with waiter name
    table.status = 'occupied';
    table.currentOrder = order._id;
    table.currentWaiter = req.user.id;
    table.currentWaiterName = req.user.name;
    await table.save();

    const populatedOrder = await Order.findById(order._id)
      .populate('table', 'name tableNumber capacity status section photo')
      .populate('waiter', 'name username role');

    await logActivity({
      req,
      actionType: 'ORDER_SENT_TO_KITCHEN',
      targetType: 'Order',
      targetId: order._id,
      details: `Waiter ${req.user.name} sent order ${order.orderNumber} for ${table.name || 'Table ' + table.tableNumber} (Rs. ${totalPrice})`
    });

    const io = req.app.get('io');
    if (io) {
      // Real-time broadcast to kitchen and all stations
      io.to('kitchen').emit('order:new', populatedOrder);
      io.emit('order:new', populatedOrder);
      io.emit('table:update', { action: 'order_attached', table });
    }

    res.status(201).json(populatedOrder);
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ message: 'Failed to create order' });
  }
});

// Kitchen One-Action: Mark Order "READY"
router.patch('/:id/ready', roleAuth(['kitchen', 'admin']), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('table')
      .populate('waiter', 'name username role');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.status = 'Ready';
    order.readyAt = new Date();
    order.items.forEach(it => { it.status = 'Ready'; });
    await order.save();

    await logActivity({
      req,
      actionType: 'ORDER_MARKED_READY',
      targetType: 'Order',
      targetId: order._id,
      details: `Kitchen marked order ${order.orderNumber} for Table #${order.tableNumber} as READY`
    });

    const alertData = {
      orderId: order._id,
      orderNumber: order.orderNumber,
      tableNumber: order.tableNumber,
      tableName: order.tableName || `Table ${order.tableNumber}`,
      waiterId: order.waiter?._id?.toString() || order.waiter?.toString(),
      waiterName: order.waiterName || order.waiter?.name,
      items: order.items,
      readyAt: order.readyAt
    };

    const io = req.app.get('io');
    if (io) {
      // Instantly notify the specific waiter via their socket room & broadcast
      const waiterRoom = `user_${alertData.waiterId}`;
      io.to(waiterRoom).emit('order:ready_alert', alertData);
      io.emit('order:ready_alert', alertData);
      io.emit('order:status_update', order);
      io.emit('order:ready', order);
    }

    res.json({ message: 'Order marked as Ready and waiter notified', order });
  } catch (err) {
    console.error('Mark ready error:', err);
    res.status(500).json({ message: 'Failed to mark order as Ready' });
  }
});

// Waiter Action: Mark Order "SERVED"
router.patch('/:id/served', roleAuth(['waiter', 'admin']), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('table')
      .populate('waiter', 'name username role');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.status = 'Served';
    order.servedAt = new Date();
    order.items.forEach(it => { it.status = 'Served'; });
    await order.save();

    await logActivity({
      req,
      actionType: 'ORDER_MARKED_SERVED',
      targetType: 'Order',
      targetId: order._id,
      details: `Waiter ${req.user.name} marked order ${order.orderNumber} for Table #${order.tableNumber} as SERVED`
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('order:status_update', order);
    }

    res.json({ message: 'Order marked as Served', order });
  } catch (err) {
    console.error('Mark served error:', err);
    res.status(500).json({ message: 'Failed to mark order as Served' });
  }
});

// General Order Status Update (Admin / Status Transitions)
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Sent', 'Preparing', 'Ready', 'Served', 'Completed', 'Cancelled', 'Pending'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const order = await Order.findById(req.params.id)
      .populate('table')
      .populate('waiter', 'name username role');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const userRole = normalizeRole(req.user.role);

    // Enforce role authorization
    if (userRole === 'kitchen' && status !== 'Ready' && status !== 'Preparing') {
      return res.status(403).json({ message: 'Kitchen can only mark Preparing or Ready' });
    }
    if (userRole === 'waiter' && status !== 'Served') {
      return res.status(403).json({ message: 'Waiters can only mark food as Served' });
    }

    order.status = status;
    const now = new Date();
    if (status === 'Preparing') order.preparingAt = now;
    if (status === 'Ready') order.readyAt = now;
    if (status === 'Served') order.servedAt = now;
    if (status === 'Completed') order.completedAt = now;
    if (status === 'Cancelled') {
      order.cancelledAt = now;
      // If order was cancelled, free the table if it was this order
      const table = await Table.findById(order.table._id || order.table);
      if (table && String(table.currentOrder) === String(order._id)) {
        table.status = 'empty';
        table.currentOrder = null;
        table.currentWaiter = null;
        table.currentWaiterName = '';
        await table.save();
        const io = req.app.get('io');
        if (io) io.emit('table:update', { action: 'freed', table });
      }
    }

    await order.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('order:status_update', order);
      if (status === 'Ready') {
        const alertData = {
          orderId: order._id,
          orderNumber: order.orderNumber,
          tableNumber: order.tableNumber,
          tableName: order.tableName || `Table ${order.tableNumber}`,
          waiterId: order.waiter?._id?.toString() || order.waiter?.toString(),
          waiterName: order.waiterName || order.waiter?.name,
          items: order.items,
          readyAt: order.readyAt
        };
        io.to(`user_${alertData.waiterId}`).emit('order:ready_alert', alertData);
        io.emit('order:ready_alert', alertData);
      }
    }

    res.json(order);
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ message: 'Failed to update order status' });
  }
});

module.exports = router;
