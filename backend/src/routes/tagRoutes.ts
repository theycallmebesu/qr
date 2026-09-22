import { Router, Request, Response } from 'express';
import Tag from '../models/Tag';
import Item from '../models/Item';
import { connectDB } from '../config/db';

const router = Router();

// Default starter tags if database is empty
export const DEFAULT_TAGS = [
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
router.get('/', async (_req: Request, res: Response) => {
  try {
    await connectDB();
    let tags = await Tag.find({}).sort({ name: 1 }).lean();

    if (tags.length === 0) {
      // Seed default tags
      const docs = DEFAULT_TAGS.map((name) => ({ name }));
      await Tag.insertMany(docs);
      tags = await Tag.find({}).sort({ name: 1 }).lean();
    }

    return res.json({ success: true, tags });
  } catch (error) {
    console.error('Error fetching tags:', error);
    // Fallback to default in-memory list if DB temporarily unavailable
    return res.json({
      success: true,
      tags: DEFAULT_TAGS.map((name, index) => ({ _id: `default-${index}`, name })),
      fallback: true
    });
  }
});

// POST /api/tags - Add new tag
router.post('/', async (req: Request, res: Response) => {
  try {
    await connectDB();
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Tag name is required' });
    }

    const trimmedName = name.trim();
    const existing = await Tag.findOne({ name: { $regex: new RegExp(`^${trimmedName}$`, 'i') } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Tag already exists', tag: existing });
    }

    const newTag = await Tag.create({ name: trimmedName });
    return res.status(201).json({ success: true, tag: newTag });
  } catch (error) {
    console.error('Error creating tag:', error);
    return res.status(500).json({ success: false, message: 'Failed to create tag' });
  }
});

// DELETE /api/tags/:id - Delete tag
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await connectDB();
    const { id } = req.params;
    const tag = await Tag.findByIdAndDelete(id);
    if (!tag) {
      // Also try delete by name if id passed was a name
      const tagByName = await Tag.findOneAndDelete({ name: id });
      if (!tagByName) {
        return res.status(404).json({ success: false, message: 'Tag not found' });
      }
    }
    return res.json({ success: true, message: 'Tag deleted successfully' });
  } catch (error) {
    console.error('Error deleting tag:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete tag' });
  }
});

export default router;
