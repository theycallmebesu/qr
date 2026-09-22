"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
// POST /api/upload
// Receives image data (base64 or URL) and returns the usable imageUrl
router.post('/', (req, res) => {
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
    }
    catch (error) {
        console.error('Image upload error:', error);
        return res.status(500).json({ success: false, message: 'Failed to upload image' });
    }
});
exports.default = router;
