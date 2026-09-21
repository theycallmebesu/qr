import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { dbConnect } from '@/lib/dbConnect';
import Settings from '@/models/Settings';
import { isAuthenticated } from '@/lib/auth';

const UpdateSettingsSchema = z.object({
  shopName: z.string().min(1, 'Shop name cannot be empty').optional(),
  phoneNumber: z.string().min(1, 'Phone number cannot be empty').optional(),
  updateTimestamp: z.boolean().optional(),
});

export async function GET() {
  try {
    await dbConnect();
    let settings = await Settings.findOne();

    if (!settings) {
      settings = await Settings.create({
        shopName: 'KATHMANDU HARDWARE & SANITARY',
        phoneNumber: '+977-9841234567',
        pricesLastUpdated: new Date(),
      });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('GET /api/settings error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authed = await isAuthenticated();
    if (!authed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const body = await req.json().catch(() => ({}));

    const parsed = UpdateSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid settings data' },
        { status: 400 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updates: Record<string, any> = {};
    if (parsed.data.shopName) updates.shopName = parsed.data.shopName.trim();
    if (parsed.data.phoneNumber) updates.phoneNumber = parsed.data.phoneNumber.trim();
    if (parsed.data.updateTimestamp) updates.pricesLastUpdated = new Date();

    const settings = await Settings.findOneAndUpdate({}, updates, {
      upsert: true,
      new: true,
    });

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('PATCH /api/settings error:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
