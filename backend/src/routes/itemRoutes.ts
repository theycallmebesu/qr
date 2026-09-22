import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import Item from '../models/Item';
import Tag from '../models/Tag';
import { connectDB } from '../config/db';

const router = Router();

// GET /api/items - Retrieve all live items directly from MongoDB Atlas
router.get('/', async (req: Request, res: Response) => {
  try {
    await connectDB();
    const { tag, search } = req.query;

    const query: Record<string, any> = {};
    if (tag && tag !== 'All') {
      query.tag = { $regex: new RegExp(`^${String(tag).trim()}$`, 'i') };
    }
    if (search && String(search).trim()) {
      const searchRegex = new RegExp(String(search).trim(), 'i');
      query.$or = [
        { name: { $regex: searchRegex } },
        { tag: { $regex: searchRegex } },
        { description: { $regex: searchRegex } }
      ];
    }

    const items = await Item.find(query).sort({ updatedAt: -1, createdAt: -1 }).lean();
    return res.json({ success: true, count: items.length, items });
  } catch (error: any) {
    console.error('Error in GET /api/items:', error);
    return res.status(500).json({ success: false, message: error.message || 'Database error', items: [] });
  }
});

// GET /api/items/:id - Retrieve single item
router.get('/:id', async (req: Request, res: Response) => {
  try {
    await connectDB();
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }
    return res.json({ success: true, item });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error retrieving item' });
  }
});

// POST /api/items - Create item directly in MongoDB Atlas
router.post('/', async (req: Request, res: Response) => {
  try {
    await connectDB();
    const { name, price, unit, tag, imageUrl, description, inStock } = req.body;

    if (!name || price === undefined || !tag) {
      return res.status(400).json({
        success: false,
        message: 'Name, price, and tag are required fields',
      });
    }

    const trimmedTag = String(tag).trim();
    await Tag.findOneAndUpdate(
      { name: trimmedTag },
      { name: trimmedTag },
      { upsert: true }
    ).catch(() => {});

    const newItem = await Item.create({
      name: String(name).trim(),
      price: Number(price),
      unit: unit ? String(unit).trim() : 'piece',
      tag: trimmedTag,
      imageUrl: imageUrl || '',
      description: description ? String(description).trim() : '',
      inStock: inStock !== undefined ? Boolean(inStock) : true,
    });

    console.log('✅ Successfully created item in MongoDB Atlas:', newItem._id, newItem.name);
    return res.status(201).json({ success: true, message: 'Item added successfully', item: newItem });
  } catch (error: any) {
    console.error('Error creating item in MongoDB:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to create item in MongoDB' });
  }
});

// PUT /api/items/:id - Update item directly in MongoDB Atlas
router.put('/:id', async (req: Request, res: Response) => {
  try {
    await connectDB();
    const { id } = req.params;
    const { name, price, unit, tag, imageUrl, description, inStock } = req.body;

    const updateData: Record<string, any> = { updatedAt: new Date() };
    if (name !== undefined) updateData.name = String(name).trim();
    if (price !== undefined) updateData.price = Number(price);
    if (unit !== undefined) updateData.unit = String(unit).trim();
    if (tag !== undefined) {
      updateData.tag = String(tag).trim();
      await Tag.findOneAndUpdate({ name: updateData.tag }, { name: updateData.tag }, { upsert: true }).catch(() => {});
    }
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (description !== undefined) updateData.description = String(description).trim();
    if (inStock !== undefined) updateData.inStock = Boolean(inStock);

    let updatedItem = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      updatedItem = await Item.findByIdAndUpdate(id, updateData, { new: true });
    } else if (name) {
      updatedItem = await Item.findOneAndUpdate({ name: String(name).trim() }, updateData, { new: true, upsert: true });
    }

    if (!updatedItem) {
      return res.status(404).json({ success: false, message: 'Item not found in MongoDB' });
    }

    console.log('✅ Successfully updated item in MongoDB Atlas:', id, updateData);
    return res.json({ success: true, message: 'Item updated successfully', item: updatedItem });
  } catch (error: any) {
    console.error('Error updating item in MongoDB:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to update item' });
  }
});

// DELETE /api/items/:id - Delete item directly from MongoDB Atlas
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await connectDB();
    const { id } = req.params;

    if (mongoose.Types.ObjectId.isValid(id)) {
      await Item.findByIdAndDelete(id);
    } else {
      await Item.findOneAndDelete({ name: id });
    }

    console.log('✅ Successfully deleted item from MongoDB Atlas:', id);
    return res.json({ success: true, message: 'Item deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting item from MongoDB:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to delete item' });
  }
});

export default router;
