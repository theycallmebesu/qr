import { Router, Request, Response } from 'express';
import Item from '../models/Item';
import Tag from '../models/Tag';
import { connectDB } from '../config/db';

const router = Router();

// Full hardware product catalog for Shree Pashupatinath Hardware
export const SAMPLE_HARDWARE_ITEMS = [
  // CEMENT
  {
    name: 'Shivam OPC Cement 53 Grade (50kg)',
    price: 780,
    unit: 'bag',
    tag: 'Cement',
    imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&auto=format&fit=crop&q=80',
    description: 'High strength premium OPC cement for strong construction foundation and RCC pillar casting.',
    inStock: true,
  },
  {
    name: 'Hetauda PPC Cement (50kg)',
    price: 680,
    unit: 'bag',
    tag: 'Cement',
    imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&auto=format&fit=crop&q=80',
    description: 'General purpose Portland Pozzolana Cement for masonry, plastering, and flooring.',
    inStock: true,
  },
  {
    name: 'Maruti OPC Super Cement (50kg)',
    price: 770,
    unit: 'bag',
    tag: 'Cement',
    imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&auto=format&fit=crop&q=80',
    description: 'Fast curing high-strength cement for commercial RCC slabs.',
    inStock: true,
  },
  {
    name: 'Arghakhanchi OPC Cement (50kg)',
    price: 790,
    unit: 'bag',
    tag: 'Cement',
    imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&auto=format&fit=crop&q=80',
    description: 'Top-tier clinker OPC cement with high weather resistance.',
    inStock: true,
  },

  // STEEL ROD
  {
    name: 'Jagdamba Fe 500D TMT Steel Rod (12mm)',
    price: 98,
    unit: 'kg',
    tag: 'Steel Rod',
    imageUrl: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?w=600&auto=format&fit=crop&q=80',
    description: 'Ductile high-yield TMT rebar for earthquake-resistant pillars and beams.',
    inStock: true,
  },
  {
    name: 'Jagdamba Fe 500D TMT Steel Rod (16mm)',
    price: 98,
    unit: 'kg',
    tag: 'Steel Rod',
    imageUrl: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?w=600&auto=format&fit=crop&q=80',
    description: 'Heavy structural reinforcement steel rod for column footing.',
    inStock: true,
  },
  {
    name: 'Laxmi Steels TMT Rod (20mm)',
    price: 99,
    unit: 'kg',
    tag: 'Steel Rod',
    imageUrl: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?w=600&auto=format&fit=crop&q=80',
    description: 'Extra high tensile strength commercial construction rebar.',
    inStock: true,
  },
  {
    name: 'Ambe Steels TMT Bar (10mm)',
    price: 97,
    unit: 'kg',
    tag: 'Steel Rod',
    imageUrl: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?w=600&auto=format&fit=crop&q=80',
    description: 'Ideal for slab mesh wiring and lintel reinforcement.',
    inStock: true,
  },

  // BALUWA (SAND)
  {
    name: 'River Washed Sand (Baluwa) - Local Clean',
    price: 18500,
    unit: 'Tipper (450 cu.ft)',
    tag: 'Baluwa',
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
    description: 'Fine river-washed silica sand for plastering, slab casting, and brickwork.',
    inStock: true,
  },
  {
    name: 'Plastering Fine White Sand (Dhunge Baluwa)',
    price: 19500,
    unit: 'Tipper (450 cu.ft)',
    tag: 'Baluwa',
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
    description: 'Screened super-fine sand for wall putty and smooth internal plastering.',
    inStock: true,
  },
  {
    name: 'Red River Sand (Rato Baluwa)',
    price: 6500,
    unit: 'Tractor (150 cu.ft)',
    tag: 'Baluwa',
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
    description: 'General construction fill and brick laying sand.',
    inStock: true,
  },

  // GITTI (AGGREGATE)
  {
    name: 'Crushed Stone Aggregate (Gitti 20mm)',
    price: 21000,
    unit: 'Tipper (450 cu.ft)',
    tag: 'Gitti',
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
    description: 'High grade machine-crushed blue metal aggregate for pillar & RCC concrete.',
    inStock: true,
  },
  {
    name: 'Fine Aggregate (Gitti 10mm / Bajeri)',
    price: 22000,
    unit: 'Tipper (450 cu.ft)',
    tag: 'Gitti',
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
    description: 'Compact gravel for floor leveling and precast concrete molds.',
    inStock: true,
  },

  // ROD & WIRE
  {
    name: 'Binding Wire / Rod Wire (Annealed Soft)',
    price: 130,
    unit: 'kg',
    tag: 'Rod',
    imageUrl: 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=600&auto=format&fit=crop&q=80',
    description: 'Soft annealed iron wire for binding reinforcement rebar nets and ring ties.',
    inStock: true,
  },
  {
    name: 'Galvanized Barbed Wire (Tarbar Jali)',
    price: 145,
    unit: 'kg',
    tag: 'Rod',
    imageUrl: 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=600&auto=format&fit=crop&q=80',
    description: 'Rustproof high-tensile boundary fencing wire.',
    inStock: true,
  },

  // PIPES
  {
    name: 'Panchakanya CPVC Pipe 1 inch (Class 1)',
    price: 480,
    unit: 'piece (10ft)',
    tag: 'Pipes',
    imageUrl: 'https://images.unsplash.com/photo-1542013936693-884638332954?w=600&auto=format&fit=crop&q=80',
    description: 'Hot & cold potable water supply CPVC pipe, UV-resistant and durable.',
    inStock: true,
  },
  {
    name: 'PVC Drainage Pipe 4 inch (6kg)',
    price: 920,
    unit: 'piece (10ft)',
    tag: 'Pipes',
    imageUrl: 'https://images.unsplash.com/photo-1542013936693-884638332954?w=600&auto=format&fit=crop&q=80',
    description: 'Heavy duty underground soil and wastewater drainage pipe.',
    inStock: true,
  },
  {
    name: 'HDPE Black Water Pipe 32mm (PN 10)',
    price: 65,
    unit: 'meter',
    tag: 'Pipes',
    imageUrl: 'https://images.unsplash.com/photo-1542013936693-884638332954?w=600&auto=format&fit=crop&q=80',
    description: 'Flexible rollable underground main drinking water supply pipe.',
    inStock: true,
  },

  // PAINT
  {
    name: 'Asian Paints Apex Weatherproof Exterior (20L)',
    price: 7400,
    unit: 'bucket (20L)',
    tag: 'Paint',
    imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&auto=format&fit=crop&q=80',
    description: 'Exterior emulsion with silicone additives to prevent algae and moisture peeling.',
    inStock: true,
  },
  {
    name: 'Asian Paints Tractor Emulsion Interior (20L)',
    price: 4800,
    unit: 'bucket (20L)',
    tag: 'Paint',
    imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&auto=format&fit=crop&q=80',
    description: 'Smooth matte finish washable interior wall paint.',
    inStock: true,
  },
  {
    name: 'Birla White Wall Care Putty (40kg)',
    price: 1150,
    unit: 'bag (40kg)',
    tag: 'Paint',
    imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&auto=format&fit=crop&q=80',
    description: 'Water-resistant white cement-based putty for ultra-smooth wall finish.',
    inStock: true,
  },

  // SANITARY
  {
    name: 'Heavy Duty Chrome Brass Bibcock Tap',
    price: 650,
    unit: 'piece',
    tag: 'Sanitary',
    imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&auto=format&fit=crop&q=80',
    description: 'Solid brass quarter-turn water tap with mirror chrome finish.',
    inStock: true,
  },
  {
    name: 'Stainless Steel Double Bowl Kitchen Sink',
    price: 4500,
    unit: 'piece',
    tag: 'Sanitary',
    imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&auto=format&fit=crop&q=80',
    description: 'Grade 304 anti-rust satin finish kitchen washing sink.',
    inStock: true,
  },

  // FITTINGS & TOOLS
  {
    name: 'Stainless Steel Wood Screws Box (3 inch)',
    price: 320,
    unit: 'box (100 pcs)',
    tag: 'Fittings & Tools',
    imageUrl: 'https://images.unsplash.com/photo-1586864387789-628af9feed72?w=600&auto=format&fit=crop&q=80',
    description: 'Rustproof high-torque wood screws for roofing and carpentry framing.',
    inStock: true,
  },
  {
    name: 'Stanley Professional Measuring Tape (5M)',
    price: 450,
    unit: 'piece',
    tag: 'Fittings & Tools',
    imageUrl: 'https://images.unsplash.com/photo-1586864387789-628af9feed72?w=600&auto=format&fit=crop&q=80',
    description: 'Shock-resistant rubber casing measuring tape with lock mechanism.',
    inStock: true,
  }
];

// GET /api/items - Retrieve all items
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

    let items = await Item.find(query).sort({ updatedAt: -1, createdAt: -1 }).lean();

    // Auto-seed if database has 0 items
    if (items.length === 0 && !tag && !search) {
      await Item.insertMany(SAMPLE_HARDWARE_ITEMS);
      for (const item of SAMPLE_HARDWARE_ITEMS) {
        await Tag.findOneAndUpdate(
          { name: item.tag },
          { name: item.tag },
          { upsert: true }
        );
      }
      items = await Item.find({}).sort({ updatedAt: -1 }).lean();
    }

    return res.json({ success: true, count: items.length, items });
  } catch (error) {
    console.error('Error fetching items:', error);
    let filtered = [...SAMPLE_HARDWARE_ITEMS];
    if (req.query.tag && req.query.tag !== 'All') {
      filtered = filtered.filter(i => i.tag.toLowerCase() === String(req.query.tag).toLowerCase());
    }
    if (req.query.search) {
      const q = String(req.query.search).toLowerCase();
      filtered = filtered.filter(i => i.name.toLowerCase().includes(q) || i.tag.toLowerCase().includes(q));
    }
    return res.json({
      success: true,
      count: filtered.length,
      items: filtered.map((item, idx) => ({ ...item, _id: `item-${idx}` })),
    });
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

// POST /api/items - Add a new item
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
    );

    const newItem = await Item.create({
      name: String(name).trim(),
      price: Number(price),
      unit: unit ? String(unit).trim() : 'piece',
      tag: trimmedTag,
      imageUrl: imageUrl || '',
      description: description ? String(description).trim() : '',
      inStock: inStock !== undefined ? Boolean(inStock) : true,
    });

    return res.status(201).json({ success: true, message: 'Item added successfully', item: newItem });
  } catch (error) {
    console.error('Error creating item:', error);
    return res.status(500).json({ success: false, message: 'Failed to create item' });
  }
});

// PUT /api/items/:id - Update item
router.put('/:id', async (req: Request, res: Response) => {
  try {
    await connectDB();
    const { id } = req.params;
    const { name, price, unit, tag, imageUrl, description, inStock } = req.body;

    const updateData: Record<string, any> = {};
    if (name !== undefined) updateData.name = String(name).trim();
    if (price !== undefined) updateData.price = Number(price);
    if (unit !== undefined) updateData.unit = String(unit).trim();
    if (tag !== undefined) {
      updateData.tag = String(tag).trim();
      await Tag.findOneAndUpdate(
        { name: updateData.tag },
        { name: updateData.tag },
        { upsert: true }
      );
    }
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (description !== undefined) updateData.description = String(description).trim();
    if (inStock !== undefined) updateData.inStock = Boolean(inStock);

    let updatedItem = null;
    const mongoose = await import('mongoose');
    if (mongoose.Types.ObjectId.isValid(id)) {
      updatedItem = await Item.findByIdAndUpdate(id, updateData, { new: true });
    } else if (name) {
      updatedItem = await Item.findOneAndUpdate({ name: String(name).trim() }, updateData, { new: true, upsert: true });
    }

    if (!updatedItem) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    return res.json({ success: true, message: 'Item updated successfully', item: updatedItem });
  } catch (error) {
    console.error('Error updating item:', error);
    return res.status(500).json({ success: false, message: 'Failed to update item' });
  }
});

// DELETE /api/items/:id - Delete item
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await connectDB();
    const { id } = req.params;
    const mongoose = await import('mongoose');
    
    if (mongoose.Types.ObjectId.isValid(id)) {
      await Item.findByIdAndDelete(id);
    } else {
      // Try delete by name or treat as successful
      await Item.findOneAndDelete({ name: id });
    }
    return res.json({ success: true, message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting item:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete item' });
  }
});

export default router;
