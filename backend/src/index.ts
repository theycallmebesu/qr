import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import itemRoutes from './routes/itemRoutes';
import tagRoutes from './routes/tagRoutes';
import authRoutes from './routes/authRoutes';
import uploadRoutes from './routes/uploadRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend (Vercel & Local development)
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parser with 50mb limit for mobile camera uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    app: 'Shree Pashupatinath Hardware API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.get('/', (_req: Request, res: Response) => {
  res.send('🔥 Shree Pashupatinath Hardware API is live. Use /api/items, /api/tags, /api/auth');
});

// API Routes
app.use('/api/items', itemRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);

// Connect to MongoDB & Start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Shree Pashupatinath Hardware API running on port ${PORT}`);
  });
});

export default app;
