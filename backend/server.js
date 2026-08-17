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
        const userCount = await User.countDocuments();
        if (userCount > 0) {
            console.log('MongoDB database already populated. Skipping initial seeding.');
            return;
        }
        
        const salt = await bcrypt.genSalt(10);
        
        // 1. Individual Person 1 (John Doe - password: user123)
        const user1Hash = await bcrypt.hash('user123', salt);
        const user1 = new User({
            name: 'John Doe',
            email: 'john.doe@example.com',
            passwordHash: user1Hash,
            role: 'user',
            profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
        });
        await user1.save();

        // 2. Individual Person 2 (Sarah Smith - password: sarah123)
        const user2Hash = await bcrypt.hash('sarah123', salt);
        const user2 = new User({
            name: 'Sarah Smith',
            email: 'sarah.smith@example.com',
            passwordHash: user2Hash,
            role: 'user',
            profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'
        });
        await user2.save();

        // 3. Admin User (Bishu Maharjan - email: bishu1maharjan@gmail.com, password: admin123)
        const adminPasswordHash = await bcrypt.hash('admin123', salt);
        const adminUser = new User({
            name: 'Bishu Maharjan (Admin)',
            email: 'bishu1maharjan@gmail.com',
            passwordHash: adminPasswordHash,
            role: 'admin',
            profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
        });
        await adminUser.save();

        // Seed individual banks for John Doe & Sarah Smith
        const banks = [
            {
                name: 'Chase Bank',
                logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/40/Chase_logo_2007.svg',
                accountName: 'John Chase Savings',
                accountNumber: '1234-5678-9012',
                qrCodeUrl: 'payment://chase?account=123456789012',
                userId: user1._id
            },
            {
                name: 'Wells Fargo',
                logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/b3/Wells_Fargo_Bank.svg',
                accountName: 'John Wells Checking',
                accountNumber: '4567-8912-3456',
                qrCodeUrl: 'payment://wellsfargo?account=456789123456',
                userId: user1._id
            },
            {
                name: 'Bank of America',
                logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/20/Bank_of_America_logo.svg',
                accountName: 'Sarah BoA Premier',
                accountNumber: '9876-5432-1098',
                qrCodeUrl: 'payment://boa?account=987654321098',
                userId: user2._id
            }
        ];
        await Bank.insertMany(banks);

        console.log('--------------------------------------------------');
        console.log('Seeded Users:');
        console.log('1. John Doe - Password: user123');
        console.log('2. Sarah Smith - Password: sarah123');
        console.log('3. Admin Gmail: bishu1maharjan@gmail.com | Password: admin123');
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
