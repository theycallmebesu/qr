const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Table = require('../models/Table');
const MenuItem = require('../models/MenuItem');
const { auth, roleAuth } = require('../middleware/auth');
const { logActivity } = require('../utils/logger');

// Get active orders (for KDS and floor tracking)
router.get('/', auth, async (req, res) => {
  try {
    const { status, tableId } = req.query;
    const filter = {};

    if (status) {
      if (status === 'active') {
        filter.status = { $in: ['Pending', 'Preparing', 'Ready', 'Served'] };
      } else {
        filter.status = status;
      }
    }

    if (tableId) {
      filter.table = tableId;
    }

    const orders = await Order.find(filter)
      .populate('table', 'tableNumber capacity status section')
      .populate('waiter', 'name role')
      .populate('chef', 'name role')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    console.error('Fetch orders error:', err);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

// Get single order by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('table')
      .populate('waiter', 'name role')
      .populate('chef', 'name role');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(order);
  } catch (err) {
    console.error('Fetch single order error:', err);
    res.status(500).json({ message: 'Failed to fetch order' });
  }
});

// Create new order (Waiter, Admin, Owner)
router.post('/', roleAuth(['waiter', 'admin', 'owner']), async (req, res) => {
  try {
    const { tableId, items, specialInstructions } = req.body;

    if (!tableId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Table and at least one item are required' });
    }

    const table = await Table.findById(tableId);
    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    // Verify and calculate total
    let totalPrice = 0;
    const processedItems = [];

    for (const it of items) {
      const menuItem = await MenuItem.findById(it.menuItemId || it.menuItem);
      if (!menuItem) {
        return res.status(400).json({ message: `Menu item not found: ${it.name || it.menuItemId}` });
      }
      if (!menuItem.inStock) {
        return res.status(400).json({ message: `Item "${menuItem.name}" is currently OUT OF STOCK` });
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
        status: 'Pending'
      });
    }

    const orderNumber = `ORD-${Date.now().toString().slice(-6)}-T${table.tableNumber}`;

    const order = new Order({
      orderNumber,
      table: table._id,
      tableNumber: table.tableNumber,
      items: processedItems,
      status: 'Pending',
      waiter: req.user.id,
      waiterName: req.user.name,
      specialInstructions: specialInstructions || '',
      totalPrice,
      placedAt: new Date()
    });

    await order.save();

    // Set Table to Occupied and attach currentOrder
    table.status = 'Occupied';
    table.currentOrder = order._id;
    await table.save();

    // Populate for socket emission
    const populatedOrder = await Order.findById(order._id)
      .populate('table', 'tableNumber capacity status section')
      .populate('waiter', 'name role');

    // Log Activity
    await logActivity({
      req,
      actionType: 'ORDER_CREATED',
      targetType: 'Order',
      targetId: order._id,
      details: `Waiter ${req.user.name} placed order ${order.orderNumber} for Table #${table.tableNumber} ($${totalPrice.toFixed(2)})`
    });

    // Real-time broadcast
    const io = req.app.get('io');
    if (io) {
      io.emit('order:new', populatedOrder);
      io.emit('table:update', { action: 'order_attached', table });
    }

    res.status(201).json(populatedOrder);
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ message: 'Failed to create order' });
  }
});

// Update order status (Chef: Preparing/Ready; Waiter: Served; Owner/Admin: Cancelled)
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status, chefNotes } = req.body;
    const validStatuses = ['Pending', 'Preparing', 'Ready', 'Served', 'Completed', 'Cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid order status' });
    }

    const order = await Order.findById(req.params.id)
      .populate('table')
      .populate('waiter', 'name role')
      .populate('chef', 'name role');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const oldStatus = order.status;
    const userRole = req.user.role;

    // Role-specific verification
    if (userRole === 'chef') {
      if (!['Preparing', 'Ready'].includes(status)) {
        return res.status(403).json({ message: 'Chefs can only change status to Preparing or Ready' });
      }
      order.chef = req.user.id;
      order.chefName = req.user.name;
    } else if (userRole === 'waiter') {
      if (status !== 'Served' && status !== 'Pending') {
        return res.status(403).json({ message: 'Waiters can only mark food as Served' });
      }
    } else if (userRole !== 'admin' && userRole !== 'owner') {
      return res.status(403).json({ message: 'Unauthorized status transition' });
    }

    // Set timestamps accordingly
    order.status = status;
    const now = new Date();
    if (status === 'Preparing') {
      order.preparingAt = now;
      // Mark all items as Preparing
      order.items.forEach(it => { if (it.status === 'Pending') it.status = 'Preparing'; });
    } else if (status === 'Ready') {
      order.readyAt = now;
      order.items.forEach(it => { if (['Pending', 'Preparing'].includes(it.status)) it.status = 'Ready'; });
    } else if (status === 'Served') {
      order.servedAt = now;
      order.items.forEach(it => { it.status = 'Served'; });
    } else if (status === 'Completed') {
      order.completedAt = now;
    } else if (status === 'Cancelled') {
      order.cancelledAt = now;
      // If cancelled, reset table if this was current order
      const table = await Table.findById(order.table._id || order.table);
      if (table && String(table.currentOrder) === String(order._id)) {
        table.status = 'Empty';
        table.currentOrder = null;
        await table.save();
        const io = req.app.get('io');
        if (io) io.emit('table:update', { action: 'freed', table });
      }
    }

    await order.save();

    await logActivity({
      req,
      actionType: status === 'Cancelled' ? 'ORDER_CANCELLED' : 'ORDER_STATUS_CHANGED',
      targetType: 'Order',
      targetId: order._id,
      details: `${req.user.name} (${req.user.role}) changed Order ${order.orderNumber} (Table #${order.tableNumber}) from ${oldStatus} to ${status}`
    });

    const populatedOrder = await Order.findById(order._id)
      .populate('table')
      .populate('waiter', 'name role')
      .populate('chef', 'name role');

    const io = req.app.get('io');
    if (io) {
      io.emit('order:status_update', populatedOrder);
    }

    res.json(populatedOrder);
  } catch (err) {
    console.error('Update order status error:', err);
    res.status(500).json({ message: 'Failed to update order status' });
  }
});

// Update individual item status within an order (Chef checklist)
router.patch('/:id/items/:itemId/status', roleAuth(['chef', 'admin']), async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const item = order.items.id(req.params.itemId);
    if (!item) return res.status(404).json({ message: 'Item not found in order' });

    item.status = status;

    // Check if all items are now Ready
    const allReady = order.items.every(i => i.status === 'Ready');
    if (allReady && order.status !== 'Ready') {
      order.status = 'Ready';
      order.readyAt = new Date();
      order.chef = req.user.id;
      order.chefName = req.user.name;
    } else if (order.status === 'Pending' && status === 'Preparing') {
      order.status = 'Preparing';
      order.preparingAt = new Date();
      order.chef = req.user.id;
      order.chefName = req.user.name;
    }

    await order.save();

    const populatedOrder = await Order.findById(order._id)
      .populate('table')
      .populate('waiter', 'name role')
      .populate('chef', 'name role');

    const io = req.app.get('io');
    if (io) io.emit('order:status_update', populatedOrder);

    res.json(populatedOrder);
  } catch (err) {
    console.error('Update item status error:', err);
    res.status(500).json({ message: 'Failed to update item status' });
  }
});

module.exports = router;
