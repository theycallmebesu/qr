"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = require("./config/db");
const itemRoutes_1 = __importDefault(require("./routes/itemRoutes"));
const tagRoutes_1 = __importDefault(require("./routes/tagRoutes"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const uploadRoutes_1 = __importDefault(require("./routes/uploadRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = Number(process.env.PORT) || 5000;
// Enable CORS for frontend (Vercel & Local development)
app.use((0, cors_1.default)({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
// Body parser with 50mb limit for mobile camera uploads
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '50mb' }));
// Health check endpoint (Render pings this)
app.get('/api/health', (_req, res) => {
    res.json({
        status: 'ok',
        app: 'Shree Pashupatinath Hardware API',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    });
});
app.get('/', (_req, res) => {
    res.send('🔥 Shree Pashupatinath Hardware API is live. Use /api/items, /api/tags, /api/auth');
});
// API Routes
app.use('/api/items', itemRoutes_1.default);
app.use('/api/tags', tagRoutes_1.default);
app.use('/api/auth', authRoutes_1.default);
app.use('/api/upload', uploadRoutes_1.default);
// Start server immediately on 0.0.0.0 so Render detects port binding instantly
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Shree Pashupatinath Hardware API listening on 0.0.0.0:${PORT}`);
    // Connect to database in the background without blocking server startup
    (0, db_1.connectDB)().catch((err) => {
        console.error('Initial DB connection attempt failed:', err);
    });
});
exports.default = app;
