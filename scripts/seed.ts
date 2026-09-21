import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';
import dns from 'dns';

// Fix for Windows DNS resolution for mongodb+srv
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch {
  // Ignore if not supported
}

// Load environment variables from .env.local or .env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('ERROR: MONGODB_URI environment variable is missing.');
  console.error('Please add MONGODB_URI to .env.local or .env before running this seed script.');
  process.exit(1);
}

const ItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      set: (v: string) => (v ? v.trim().toUpperCase() : v),
    },
    price: { type: Number, required: true },
    unit: { type: String, default: 'PIECE' },
    category: { type: String, default: 'GENERAL' },
    imageUrl: { type: String, default: '' },
    imagePublicId: { type: String, default: '' },
    priority: { type: Number, default: 100 },
    inStock: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const SettingsSchema = new mongoose.Schema(
  {
    shopName: { type: String, default: 'KATHMANDU HARDWARE & SANITARY' },
    phoneNumber: { type: String, default: '+977-9841234567' },
    pricesLastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Item = mongoose.models.Item || mongoose.model('Item', ItemSchema);
const Settings = mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);

const sampleItems = [
  {
    name: 'CPVC PIPE 1/2 INCH (10 FT)',
    price: 450,
    unit: 'PIECE',
    category: 'PIPE',
    imageUrl: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=600&auto=format&fit=crop&q=80',
    priority: 10,
    inStock: true,
  },
  {
    name: 'BALUWA RIVER SAND WASHED (1 TRACTOR)',
    price: 6500,
    unit: 'TRACTOR',
    category: 'BALUWA',
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
    priority: 20,
    inStock: true,
  },
  {
    name: 'SHIVAM OPC CEMENT 50KG',
    price: 780,
    unit: 'BAG',
    category: 'CEMENT',
    imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&auto=format&fit=crop&q=80',
    priority: 30,
    inStock: true,
  },
  {
    name: 'TMT STEEL ROD 12MM FE500D (1 BUNDLE)',
    price: 8200,
    unit: 'BUNDLE',
    category: 'ROD',
    imageUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&auto=format&fit=crop&q=80',
    priority: 40,
    inStock: true,
  },
  {
    name: 'ASIAN PAINTS APCOLITE EMULSION WHITE (4L)',
    price: 2450,
    unit: 'BAG',
    category: 'PAINT',
    imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&auto=format&fit=crop&q=80',
    priority: 50,
    inStock: true,
  },
  {
    name: 'STANLEY STEEL CLAW HAMMER 16OZ',
    price: 950,
    unit: 'PIECE',
    category: 'TOOLS',
    imageUrl: 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=600&auto=format&fit=crop&q=80',
    priority: 60,
    inStock: true,
  },
  {
    name: 'BOSCH IMPACT DRILL GSB 500W',
    price: 5800,
    unit: 'SET',
    category: 'TOOLS',
    imageUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&auto=format&fit=crop&q=80',
    priority: 70,
    inStock: true,
  },
  {
    name: 'BRASS BALL VALVE 1/2 INCH HEAVY',
    price: 320,
    unit: 'PIECE',
    category: 'SANITARY',
    imageUrl: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=600&auto=format&fit=crop&q=80',
    priority: 80,
    inStock: true,
  },
  {
    name: 'PHILIPS 12W LED BULB B22 COOL WHITE',
    price: 240,
    unit: 'PIECE',
    category: 'ELECTRICAL',
    imageUrl: 'https://images.unsplash.com/photo-1550985616-10810253b84d?w=600&auto=format&fit=crop&q=80',
    priority: 90,
    inStock: true,
  },
  {
    name: 'TEFLON THREAD SEAL TAPE (BOX OF 10)',
    price: 250,
    unit: 'BOX',
    category: 'SANITARY',
    imageUrl: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=600&auto=format&fit=crop&q=80',
    priority: 100,
    inStock: false,
  },
];

async function runSeed() {
  try {
    console.log('Connecting to MongoDB Atlas (hardwareshop_db)...');
    await mongoose.connect(MONGODB_URI as string, {
      dbName: 'hardwareshop_db',
    });
    console.log('Connected to database successfully.');

    console.log('Clearing existing items and settings...');
    await Item.deleteMany({});
    await Settings.deleteMany({});

    console.log(`Inserting ${sampleItems.length} sample hardware items...`);
    const createdItems = await Item.insertMany(sampleItems);
    console.log(`Inserted ${createdItems.length} items.`);

    console.log('Creating initial shop settings...');
    await Settings.create({
      shopName: 'KATHMANDU HARDWARE & SANITARY',
      phoneNumber: '+977-9841234567',
      pricesLastUpdated: new Date(),
    });
    console.log('Settings created successfully.');

    console.log('Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seed script error:', error);
    process.exit(1);
  }
}

runSeed();
