require('dotenv').config();
const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {}
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { MongoMemoryServer } = require('mongodb-memory-server');
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const Bank = require('./models/Bank');

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

const seedData = async () => {
    try {
        // Remove all sample users and banks to start fresh
        await User.deleteMany({ role: { $ne: 'admin' } });
        await Bank.deleteMany({});

        // Ensure Admin Users exist
        const adminEmails = ['bishu1maharjan@gmail.com', 'np03cy4a250116@heraldcollege.edu.np'];
        for (const email of adminEmails) {
            let adminUser = await User.findOne({ email });
            if (!adminUser) {
                const salt = await bcrypt.genSalt(10);
                const adminPasswordHash = await bcrypt.hash('admin123', salt);
                adminUser = new User({
                    name: `Bishu Maharjan (Admin)`,
                    email,
                    passwordHash: adminPasswordHash,
                    plainPassword: 'admin123',
                    role: 'admin'
                });
                await adminUser.save();
            } else {
                adminUser.plainPassword = 'admin123';
                await adminUser.save();
            }
        }

        console.log('--------------------------------------------------');
        console.log('Clean Database Initialized:');
        console.log('Admin Gmail: bishu1maharjan@gmail.com | Password: admin123');
        console.log('All sample users & banks removed.');
        console.log('--------------------------------------------------');
    } catch (err) {
        console.error('Error seeding data', err);
    }
}

// Connect Database
const connectDB = async () => {
  try {
    let mongoUri = process.env.MONGO_URI;
    
    // For local dev without a real mongodb
    if (!mongoUri || mongoUri.includes('127.0.0.1')) {
        const mongoServer = await MongoMemoryServer.create();
        mongoUri = mongoServer.getUri();
        console.log(`Started memory server at ${mongoUri}`);
    }

    await mongoose.connect(mongoUri);
    console.log('MongoDB Connected...');
    
    // Seed data
    await seedData();
  } catch (err) {
    console.error('Failed to connect to MongoDB', err.message);
    process.exit(1);
  }
};
connectDB();

// Define Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/banks', require('./routes/banks'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
