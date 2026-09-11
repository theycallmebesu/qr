const express = require('express');
const router = express.Router();
const MenuItem = require('../models/MenuItem');
const { auth, adminAuth, roleAuth } = require('../middleware/auth');
const { logActivity } = require('../utils/logger');

// Get all menu items (accessible by all authenticated staff)
router.get('/', auth, async (req, res) => {
  try {
    const { category, inStockOnly } = req.query;
    const filter = {};
    if (category && category !== 'All') {
      filter.category = category;
    }
    if (inStockOnly === 'true') {
      filter.inStock = true;
    }
    const items = await MenuItem.find(filter).sort({ category: 1, name: 1 });
    res.json(items);
  } catch (err) {
    console.error('Fetch menu error:', err);
    res.status(500).json({ message: 'Failed to fetch menu items' });
  }
});

// Add new menu item (Admin only)
router.post('/', adminAuth, async (req, res) => {
  try {
    const { name, category, price, description, image, inStock } = req.body;
    if (!name || price === undefined) {
      return res.status(400).json({ message: 'Item name and price in NPR are required' });
    }

    const item = new MenuItem({
      name: name.trim(),
      category: category || 'Main',
      price: Math.max(0, Number(price)),
      description: description || '',
      image: image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
      inStock: inStock !== undefined ? inStock : true
    });

    await item.save();

    await logActivity({
      req,
      actionType: 'MENU_ITEM_CREATED',
      targetType: 'MenuItem',
      targetId: item._id,
      details: `Added dish "${item.name}" (Rs. ${item.price}) under ${item.category}`
    });

    const io = req.app.get('io');
    if (io) io.emit('menu:update', { action: 'create', item });

    res.status(201).json(item);
  } catch (err) {
    console.error('Create menu item error:', err);
    res.status(500).json({ message: 'Failed to create menu item' });
  }
});

// Update menu item (Admin only)
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { name, category, price, description, image, inStock } = req.body;
    const item = await MenuItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    if (name) item.name = name.trim();
    if (category) item.category = category;
    if (price !== undefined) item.price = Math.max(0, Number(price));
    if (description !== undefined) item.description = description;
    if (image !== undefined) item.image = image;
    if (inStock !== undefined) item.inStock = inStock;

    await item.save();

    await logActivity({
      req,
      actionType: 'MENU_ITEM_UPDATED',
      targetType: 'MenuItem',
      targetId: item._id,
      details: `Updated dish "${item.name}" (Rs. ${item.price})`
    });

    const io = req.app.get('io');
    if (io) io.emit('menu:update', { action: 'update', item });

    res.json(item);
  } catch (err) {
    console.error('Update menu item error:', err);
    res.status(500).json({ message: 'Failed to update menu item' });
  }
});

// Toggle In Stock / Out of Stock (Admin and Kitchen)
router.patch('/:id/toggle-stock', roleAuth(['admin', 'kitchen']), async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    item.inStock = req.body.inStock !== undefined ? req.body.inStock : !item.inStock;
    await item.save();

    await logActivity({
      req,
      actionType: 'MENU_ITEM_STOCK_TOGGLED',
      targetType: 'MenuItem',
      targetId: item._id,
      details: `Toggled "${item.name}" stock: ${item.inStock ? 'IN-STOCK' : 'OUT-OF-STOCK'}`
    });

    const io = req.app.get('io');
    if (io) io.emit('menu:update', { action: 'stock_toggled', item });

    res.json(item);
  } catch (err) {
    console.error('Toggle stock error:', err);
    res.status(500).json({ message: 'Failed to toggle availability' });
  }
});

// Delete menu item (Admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const item = await MenuItem.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    await logActivity({
      req,
      actionType: 'MENU_ITEM_DELETED',
      targetType: 'MenuItem',
      targetId: req.params.id,
      details: `Deleted dish "${item.name}"`
    });

    const io = req.app.get('io');
    if (io) io.emit('menu:update', { action: 'delete', id: req.params.id });

    res.json({ message: 'Menu item deleted successfully' });
  } catch (err) {
    console.error('Delete menu item error:', err);
    res.status(500).json({ message: 'Failed to delete menu item' });
  }
});

module.exports = router;
