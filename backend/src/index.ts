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
const PORT = Number(process.env.PORT) || 5000;

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

// Health check endpoint (Render pings this)
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

// Start server immediately on 0.0.0.0 so Render detects port binding instantly
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Shree Pashupatinath Hardware API listening on 0.0.0.0:${PORT}`);
  // Connect to database in the background without blocking server startup
  connectDB().catch((err) => {
    console.error('Initial DB connection attempt failed:', err);
  });
});

export default app;
