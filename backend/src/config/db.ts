import mongoose from 'mongoose';
import dns from 'dns';

// Fix querySrv ECONNREFUSED on Windows only
if (process.platform === 'win32') {
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
  } catch (e) {
    // Ignore
  }
}

const DEFAULT_MONGODB_URI = 'mongodb+srv://bishu1maharjan_db_user:EuCEAgf9I39StGlu@cluster0.gkmyrme.mongodb.net/bankqr?retryWrites=true&w=majority&appName=Cluster0';

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI || DEFAULT_MONGODB_URI;

  try {
    if (mongoose.connection.readyState >= 1) {
      return;
    }
    console.log('🔄 Connecting to MongoDB Atlas...');
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅ Connected to MongoDB Atlas database (bankqr)');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
  }
}
