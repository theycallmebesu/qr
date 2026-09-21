import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { dbConnect } from '@/lib/dbConnect';
import Item from '@/models/Item';
import { isAuthenticated } from '@/lib/auth';

const ReorderSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      priority: z.number(),
    })
  ),
});

export async function PATCH(req: NextRequest) {
  try {
    const authed = await isAuthenticated();
    if (!authed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const body = await req.json().catch(() => ({}));

    const parsed = ReorderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid reorder payload format' },
        { status: 400 }
      );
    }

    const { items } = parsed.data;

    if (items.length === 0) {
      return NextResponse.json({ success: true, updated: 0 });
    }

    const bulkOps = items.map((it) => ({
      updateOne: {
        filter: { _id: it.id },
        update: { $set: { priority: it.priority } },
      },
    }));

    await Item.bulkWrite(bulkOps);

    return NextResponse.json({
      success: true,
      message: `Updated priority for ${items.length} items`,
    });
  } catch (error) {
    console.error('PATCH /api/items/reorder error:', error);
    return NextResponse.json(
      { error: 'Failed to reorder items' },
      { status: 500 }
    );
  }
}
