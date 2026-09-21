import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { dbConnect } from '@/lib/dbConnect';
import Item from '@/models/Item';
import Settings from '@/models/Settings';
import { isAuthenticated } from '@/lib/auth';
import { deleteFromCloudinary } from '@/lib/cloudinary';

const UpdateItemSchema = z.object({
  name: z.string().min(1).max(60).optional(),
  price: z.number().min(0).optional(),
  unit: z.string().optional(),
  category: z.string().optional(),
  imageUrl: z.string().optional(),
  imagePublicId: z.string().optional(),
  priority: z.number().optional(),
  inStock: z.boolean().optional(),
});

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect();
    const item = await Item.findById(params.id).lean();

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json({ item });
  } catch (error) {
    console.error('GET /api/items/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch item' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const authed = await isAuthenticated();
    if (!authed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const body = await req.json().catch(() => ({}));

    const parsed = UpdateItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Validation error' },
        { status: 400 }
      );
    }

    const existingItem = await Item.findById(params.id);
    if (!existingItem) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updates: Record<string, any> = { ...parsed.data };

    if (updates.name) {
      updates.name = updates.name.toUpperCase().trim();
    }
    if (updates.unit) {
      updates.unit = updates.unit.toUpperCase().trim();
    }
    if (updates.category) {
      updates.category = updates.category.toUpperCase().trim();
    }

    // If new image replaces old image, delete old asset from Cloudinary
    if (
      updates.imagePublicId &&
      existingItem.imagePublicId &&
      updates.imagePublicId !== existingItem.imagePublicId
    ) {
      await deleteFromCloudinary(existingItem.imagePublicId);
    }

    const updatedItem = await Item.findByIdAndUpdate(params.id, updates, {
      new: true,
      runValidators: true,
    });

    // Update settings pricesLastUpdated timestamp
    await Settings.findOneAndUpdate(
      {},
      { pricesLastUpdated: new Date() },
      { upsert: true, new: true }
    );

    return NextResponse.json({ item: updatedItem });
  } catch (error) {
    console.error('PATCH /api/items/[id] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update item' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const authed = await isAuthenticated();
    if (!authed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const item = await Item.findById(params.id);

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // Delete image from Cloudinary if exists
    if (item.imagePublicId) {
      await deleteFromCloudinary(item.imagePublicId);
    }

    await Item.findByIdAndDelete(params.id);

    // Update settings pricesLastUpdated timestamp
    await Settings.findOneAndUpdate(
      {},
      { pricesLastUpdated: new Date() },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, message: 'Item deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/items/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to delete item' },
      { status: 500 }
    );
  }
}
