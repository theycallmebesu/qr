import mongoose from 'mongoose';
import dns from 'dns';

// Fix querySrv ECONNREFUSED on Windows / ISP DNS resolvers
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {
  // Ignore if not permitted
}

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI is not defined in environment variables.');
    return;
  }

  try {
    if (mongoose.connection.readyState >= 1) {
      return;
    }
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅ Connected to MongoDB Atlas (hardwareshop_db)');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
  }
}
