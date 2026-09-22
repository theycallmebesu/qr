import { Router, Request, Response } from 'express';

const router = Router();

// POST /api/upload
// Receives image data (base64 or URL) and returns the usable imageUrl
router.post('/', (req: Request, res: Response) => {
  try {
    const { imageBase64, imageUrl } = req.body;
    if (!imageBase64 && !imageUrl) {
      return res.status(400).json({ success: false, message: 'No image data provided' });
    }

    const finalUrl = imageBase64 || imageUrl;
    return res.json({
      success: true,
      imageUrl: finalUrl,
      message: 'Image processed successfully',
    });
  } catch (error) {
    console.error('Image upload error:', error);
    return res.status(500).json({ success: false, message: 'Failed to upload image' });
  }
});

export default router;
