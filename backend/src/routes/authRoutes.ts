import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const router = Router();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '0000';
const JWT_SECRET = process.env.JWT_SECRET || 'hardware-shop-secret-key';

// POST /api/auth/login
router.post('/login', (req: Request, res: Response) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ success: false, message: 'PIN / Password is required' });
    }

    if (String(password).trim() === ADMIN_PASSWORD) {
      const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
      return res.json({
        success: true,
        message: 'Admin authentication successful',
        token,
      });
    }

    return res.status(401).json({ success: false, message: 'Invalid PIN. Please try again.' });
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/auth/verify
router.get('/verify', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, authenticated: false });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return res.json({ success: true, authenticated: true, user: decoded });
  } catch {
    return res.status(401).json({ success: false, authenticated: false });
  }
});

export default router;
