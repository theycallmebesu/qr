require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Bank = require('./models/Bank');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected for Seeding...');
  } catch (err) {
    console.error('Failed to connect', err.message);
    process.exit(1);
  }
};

const seedData = async () => {
  await connectDB();

  try {
    await User.deleteMany();
    await Bank.deleteMany();

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    const user = new User({
      name: 'Test User',
      email: 'test@example.com',
      passwordHash,
      profileImage: 'https://i.pravatar.cc/150?u=test'
    });

    await user.save();

    const banks = [
      {
        name: 'Chase Bank',
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/40/Chase_logo_2007.svg',
        accountName: 'Chase Account',
        accountNumber: '123456789'
      },
      {
        name: 'Bank of America',
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/20/Bank_of_America_logo.svg',
        accountName: 'BoA Account',
        accountNumber: '987654321'
      },
      {
        name: 'Wells Fargo',
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/b3/Wells_Fargo_Bank.svg',
        accountName: 'Wells Fargo Account',
        accountNumber: '456789123'
      }
    ];

    await Bank.insertMany(banks);

    console.log('Data seeded successfully!');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedData();
