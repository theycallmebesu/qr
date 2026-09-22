"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = connectDB;
const mongoose_1 = __importDefault(require("mongoose"));
const dns_1 = __importDefault(require("dns"));
// Fix querySrv ECONNREFUSED on Windows only
if (process.platform === 'win32') {
    try {
        dns_1.default.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
    }
    catch (e) {
        // Ignore
    }
}
const DEFAULT_MONGODB_URI = 'mongodb+srv://bishu1maharjan_db_user:EuCEAgf9I39StGlu@cluster0.gkmyrme.mongodb.net/bankqr?retryWrites=true&w=majority&appName=Cluster0';
async function connectDB() {
    const uri = process.env.MONGODB_URI || DEFAULT_MONGODB_URI;
    try {
        if (mongoose_1.default.connection.readyState >= 1) {
            return;
        }
        console.log('🔄 Connecting to MongoDB Atlas...');
        await mongoose_1.default.connect(uri, {
            serverSelectionTimeoutMS: 5000,
        });
        console.log('✅ Connected to MongoDB Atlas database (bankqr)');
    }
    catch (error) {
        console.error('❌ MongoDB connection error:', error);
    }
}
