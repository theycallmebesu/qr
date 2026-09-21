import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export { cloudinary };

export async function uploadToCloudinary(
  base64Data: string,
  folder: string = 'hardware_items'
): Promise<{ secure_url: string; public_id: string }> {
  try {
    const result = await cloudinary.uploader.upload(base64Data, {
      folder,
      resource_type: 'image',
      transformation: [
        { width: 1200, height: 1200, crop: 'limit', quality: 'auto:good' },
      ],
    });

    return {
      secure_url: result.secure_url,
      public_id: result.public_id,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload image to Cloudinary');
  }
}

export async function deleteFromCloudinary(publicId: string): Promise<boolean> {
  if (!publicId) return true;
  try {
    const res = await cloudinary.uploader.destroy(publicId);
    return res.result === 'ok' || res.result === 'not found';
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    // Don't crash if deletion fails
    return false;
  }
}
