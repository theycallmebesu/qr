import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { dbConnect } from '@/lib/dbConnect';
import Item from '@/models/Item';
import Settings from '@/models/Settings';
import { isAuthenticated } from '@/lib/auth';

const CreateItemSchema = z.object({
  name: z.string().min(1, 'Name is required').max(60, 'Name max 60 chars'),
  price: z.number().min(0, 'Price must be >= 0'),
  unit: z.string().default('PIECE'),
  category: z.string().optional().default('GENERAL'),
  imageUrl: z.string().optional().default(''),
  imagePublicId: z.string().optional().default(''),
  priority: z.number().optional().default(100),
  inStock: z.boolean().optional().default(true),
});

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim();
    const category = searchParams.get('category')?.trim();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {};

    if (category && category !== 'ALL') {
      filter.category = category.toUpperCase();
    }

    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    // Sorted by priority ascending, then name ascending
    const items = await Item.find(filter)
      .sort({ priority: 1, name: 1 })
      .lean();

    return NextResponse.json({ items });
  } catch (error) {
    console.error('GET /api/items error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch items' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authed = await isAuthenticated();
    if (!authed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const body = await req.json().catch(() => ({}));

    const parsed = CreateItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Validation error' },
        { status: 400 }
      );
    }

    const { name, price, unit, category, imageUrl, imagePublicId, priority, inStock } =
      parsed.data;

    const newItem = await Item.create({
      name: name.toUpperCase().trim(),
      price,
      unit: unit.toUpperCase().trim(),
      category: category ? category.toUpperCase().trim() : 'GENERAL',
      imageUrl,
      imagePublicId,
      priority,
      inStock,
    });

    // Update settings pricesLastUpdated timestamp
    await Settings.findOneAndUpdate(
      {},
      { pricesLastUpdated: new Date() },
      { upsert: true, new: true }
    );

    return NextResponse.json({ item: newItem }, { status: 201 });
  } catch (error) {
    console.error('POST /api/items error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create item' },
      { status: 500 }
    );
  }
}
