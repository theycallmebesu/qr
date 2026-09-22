"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mongoose_1 = __importDefault(require("mongoose"));
const Item_1 = __importDefault(require("../models/Item"));
const Tag_1 = __importDefault(require("../models/Tag"));
const db_1 = require("../config/db");
const router = (0, express_1.Router)();
// GET /api/items - Retrieve all live items directly from MongoDB Atlas
router.get('/', async (req, res) => {
    try {
        await (0, db_1.connectDB)();
        const { tag, search } = req.query;
        const query = {};
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
        const items = await Item_1.default.find(query).sort({ updatedAt: -1, createdAt: -1 }).lean();
        return res.json({ success: true, count: items.length, items });
    }
    catch (error) {
        console.error('Error in GET /api/items:', error);
        return res.status(500).json({ success: false, message: error.message || 'Database error', items: [] });
    }
});
// GET /api/items/:id - Retrieve single item
router.get('/:id', async (req, res) => {
    try {
        await (0, db_1.connectDB)();
        const item = await Item_1.default.findById(req.params.id);
        if (!item) {
            return res.status(404).json({ success: false, message: 'Item not found' });
        }
        return res.json({ success: true, item });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: 'Error retrieving item' });
    }
});
// POST /api/items - Create item directly in MongoDB Atlas
router.post('/', async (req, res) => {
    try {
        await (0, db_1.connectDB)();
        const { name, price, unit, tag, imageUrl, description, inStock } = req.body;
        if (!name || price === undefined || !tag) {
            return res.status(400).json({
                success: false,
                message: 'Name, price, and tag are required fields',
            });
        }
        const trimmedTag = String(tag).trim();
        await Tag_1.default.findOneAndUpdate({ name: trimmedTag }, { name: trimmedTag }, { upsert: true }).catch(() => { });
        const newItem = await Item_1.default.create({
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
    }
    catch (error) {
        console.error('Error creating item in MongoDB:', error);
        return res.status(500).json({ success: false, message: error.message || 'Failed to create item in MongoDB' });
    }
});
// PUT /api/items/:id - Update item directly in MongoDB Atlas
router.put('/:id', async (req, res) => {
    try {
        await (0, db_1.connectDB)();
        const { id } = req.params;
        const { name, price, unit, tag, imageUrl, description, inStock } = req.body;
        const updateData = { updatedAt: new Date() };
        if (name !== undefined)
            updateData.name = String(name).trim();
        if (price !== undefined)
            updateData.price = Number(price);
        if (unit !== undefined)
            updateData.unit = String(unit).trim();
        if (tag !== undefined) {
            updateData.tag = String(tag).trim();
            await Tag_1.default.findOneAndUpdate({ name: updateData.tag }, { name: updateData.tag }, { upsert: true }).catch(() => { });
        }
        if (imageUrl !== undefined)
            updateData.imageUrl = imageUrl;
        if (description !== undefined)
            updateData.description = String(description).trim();
        if (inStock !== undefined)
            updateData.inStock = Boolean(inStock);
        let updatedItem = null;
        if (mongoose_1.default.Types.ObjectId.isValid(id)) {
            updatedItem = await Item_1.default.findByIdAndUpdate(id, updateData, { new: true });
        }
        else if (name) {
            updatedItem = await Item_1.default.findOneAndUpdate({ name: String(name).trim() }, updateData, { new: true, upsert: true });
        }
        if (!updatedItem) {
            return res.status(404).json({ success: false, message: 'Item not found in MongoDB' });
        }
        console.log('✅ Successfully updated item in MongoDB Atlas:', id, updateData);
        return res.json({ success: true, message: 'Item updated successfully', item: updatedItem });
    }
    catch (error) {
        console.error('Error updating item in MongoDB:', error);
        return res.status(500).json({ success: false, message: error.message || 'Failed to update item' });
    }
});
// DELETE /api/items/:id - Delete item directly from MongoDB Atlas
router.delete('/:id', async (req, res) => {
    try {
        await (0, db_1.connectDB)();
        const { id } = req.params;
        if (mongoose_1.default.Types.ObjectId.isValid(id)) {
            await Item_1.default.findByIdAndDelete(id);
        }
        else {
            await Item_1.default.findOneAndDelete({ name: id });
        }
        console.log('✅ Successfully deleted item from MongoDB Atlas:', id);
        return res.json({ success: true, message: 'Item deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting item from MongoDB:', error);
        return res.status(500).json({ success: false, message: error.message || 'Failed to delete item' });
    }
});
exports.default = router;
