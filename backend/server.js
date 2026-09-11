require('dotenv').config();
const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {}

const http = require('http');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { Server } = require('socket.io');
const { MongoMemoryServer } = require('mongodb-memory-server');

const seedDatabase = require('./seed');

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
  }
});

// Attach io to express app so routes can broadcast events
app.set('io', io);

// Real-time socket connection handling
io.on('connection', (socket) => {
  // Join staff role room (kitchen, waiter, reception, admin)
  socket.on('join_role', (role) => {
    let cleanRole = role;
    if (role === 'chef') cleanRole = 'kitchen';
    if (role === 'receptionist') cleanRole = 'reception';
    if (role === 'owner') cleanRole = 'admin';
    socket.join(cleanRole);
  });

  // Join individual user room for private waiter alerts
  socket.on('join_user', (userId) => {
    if (userId) {
      socket.join(`user_${userId}`);
    }
  });

  socket.on('disconnect', () => {});
});

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Connect Database
const connectDB = async () => {
  try {
    let mongoUri = process.env.MONGO_URI;

    try {
      if (mongoUri && !mongoUri.includes('127.0.0.1')) {
        console.log('Connecting to MongoDB Atlas...');
        await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
        console.log('MongoDB Atlas Connected successfully!');
      } else {
        throw new Error('Using in-memory database');
      }
    } catch (atlasErr) {
      console.warn('Atlas connection failed or timed out. Falling back to MongoDB Memory Server...', atlasErr.message);
      const mongoServer = await MongoMemoryServer.create();
      mongoUri = mongoServer.getUri();
      await mongoose.connect(mongoUri);
      console.log(`Started memory server at ${mongoUri}`);
    }

    // Run seed data
    await seedDatabase();
  } catch (err) {
    console.error('Failed to initialize database:', err.message);
    process.exit(1);
  }
};

connectDB();

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/menu', require('./routes/menu'));
app.use('/api/tables', require('./routes/tables'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/bills', require('./routes/payments')); // Alias /api/bills to payments
app.use('/api/reports', require('./routes/reports'));
app.use('/api/admin', require('./routes/admin'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'Nepali Restaurant Management API',
    timestamp: new Date()
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Nepali Restaurant API & Socket.io Server running on port ${PORT}`);
});
