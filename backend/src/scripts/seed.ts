import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from '../config/db';
import Item from '../models/Item';
import Tag from '../models/Tag';
import { SAMPLE_HARDWARE_ITEMS } from '../routes/itemRoutes';
import { DEFAULT_TAGS } from '../routes/tagRoutes';

async function seed() {
  console.log('🌱 Starting database seeding for Shree Pashupatinath Hardware...');
  await connectDB();

  // Clear existing items and tags
  await Item.deleteMany({});
  await Tag.deleteMany({});

  // Insert Tags
  const tagDocs = DEFAULT_TAGS.map(name => ({ name }));
  await Tag.insertMany(tagDocs);
  console.log(`✅ Seeded ${tagDocs.length} hardware categories/tags.`);

  // Insert Items
  await Item.insertMany(SAMPLE_HARDWARE_ITEMS);
  console.log(`✅ Seeded ${SAMPLE_HARDWARE_ITEMS.length} hardware items with prices and photos.`);

  console.log('🎉 Seeding complete!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
