"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_TAGS = void 0;
const express_1 = require("express");
const Tag_1 = __importDefault(require("../models/Tag"));
const db_1 = require("../config/db");
const router = (0, express_1.Router)();
// Default starter tags if database is empty
exports.DEFAULT_TAGS = [
    'Pipes',
    'Cement',
    'Steel Rod',
    'Baluwa',
    'Gitti',
    'Rod',
    'Paint',
    'Sanitary',
    'Electrical',
    'Fittings & Tools'
];
// GET /api/tags - Fetch all tags
router.get('/', async (_req, res) => {
    try {
        await (0, db_1.connectDB)();
        let tags = await Tag_1.default.find({}).sort({ name: 1 }).lean();
        if (tags.length === 0) {
            // Seed default tags
            const docs = exports.DEFAULT_TAGS.map((name) => ({ name }));
            await Tag_1.default.insertMany(docs);
            tags = await Tag_1.default.find({}).sort({ name: 1 }).lean();
        }
        return res.json({ success: true, tags });
    }
    catch (error) {
        console.error('Error fetching tags:', error);
        // Fallback to default in-memory list if DB temporarily unavailable
        return res.json({
            success: true,
            tags: exports.DEFAULT_TAGS.map((name, index) => ({ _id: `default-${index}`, name })),
            fallback: true
        });
    }
});
// POST /api/tags - Add new tag
router.post('/', async (req, res) => {
    try {
        await (0, db_1.connectDB)();
        const { name } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ success: false, message: 'Tag name is required' });
        }
        const trimmedName = name.trim();
        const existing = await Tag_1.default.findOne({ name: { $regex: new RegExp(`^${trimmedName}$`, 'i') } });
        if (existing) {
            return res.status(409).json({ success: false, message: 'Tag already exists', tag: existing });
        }
        const newTag = await Tag_1.default.create({ name: trimmedName });
        return res.status(201).json({ success: true, tag: newTag });
    }
    catch (error) {
        console.error('Error creating tag:', error);
        return res.status(500).json({ success: false, message: 'Failed to create tag' });
    }
});
// DELETE /api/tags/:id - Delete tag
router.delete('/:id', async (req, res) => {
    try {
        await (0, db_1.connectDB)();
        const { id } = req.params;
        const tag = await Tag_1.default.findByIdAndDelete(id);
        if (!tag) {
            // Also try delete by name if id passed was a name
            const tagByName = await Tag_1.default.findOneAndDelete({ name: id });
            if (!tagByName) {
                return res.status(404).json({ success: false, message: 'Tag not found' });
            }
        }
        return res.json({ success: true, message: 'Tag deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting tag:', error);
        return res.status(500).json({ success: false, message: 'Failed to delete tag' });
    }
});
exports.default = router;
