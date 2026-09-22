"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const db_1 = require("../config/db");
const Item_1 = __importDefault(require("../models/Item"));
const Tag_1 = __importDefault(require("../models/Tag"));
const itemRoutes_1 = require("../routes/itemRoutes");
const tagRoutes_1 = require("../routes/tagRoutes");
async function seed() {
    console.log('🌱 Starting database seeding for Shree Pashupatinath Hardware...');
    await (0, db_1.connectDB)();
    // Clear existing items and tags
    await Item_1.default.deleteMany({});
    await Tag_1.default.deleteMany({});
    // Insert Tags
    const tagDocs = tagRoutes_1.DEFAULT_TAGS.map(name => ({ name }));
    await Tag_1.default.insertMany(tagDocs);
    console.log(`✅ Seeded ${tagDocs.length} hardware categories/tags.`);
    // Insert Items
    await Item_1.default.insertMany(itemRoutes_1.SAMPLE_HARDWARE_ITEMS);
    console.log(`✅ Seeded ${itemRoutes_1.SAMPLE_HARDWARE_ITEMS.length} hardware items with prices and photos.`);
    console.log('🎉 Seeding complete!');
    process.exit(0);
}
seed().catch((err) => {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
});
