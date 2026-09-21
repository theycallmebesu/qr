import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { uploadToCloudinary } from '@/lib/cloudinary';

export async function POST(req: NextRequest) {
  try {
    const authed = await isAuthenticated();
    if (!authed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { image } = body; // Base64 data URL string

    if (!image || typeof image !== 'string') {
      return NextResponse.json({ error: 'Image base64 data is required' }, { status: 400 });
    }

    const { secure_url, public_id } = await uploadToCloudinary(image, 'hardware_items');

    return NextResponse.json({
      imageUrl: secure_url,
      imagePublicId: public_id,
    });
  } catch (error) {
    console.error('Upload route error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Image upload failed' },
      { status: 500 }
    );
  }
}
