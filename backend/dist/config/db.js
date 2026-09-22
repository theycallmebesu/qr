"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = connectDB;
const mongoose_1 = __importDefault(require("mongoose"));
const dns_1 = __importDefault(require("dns"));
// Fix querySrv ECONNREFUSED on Windows / ISP DNS resolvers
try {
    dns_1.default.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
}
catch (e) {
    // Ignore if not permitted
}
async function connectDB() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('❌ MONGODB_URI is not defined in environment variables.');
        return;
    }
    try {
        if (mongoose_1.default.connection.readyState >= 1) {
            return;
        }
        await mongoose_1.default.connect(uri, {
            serverSelectionTimeoutMS: 5000,
        });
        console.log('✅ Connected to MongoDB Atlas (hardwareshop_db)');
    }
    catch (error) {
        console.error('❌ MongoDB connection error:', error);
    }
}
