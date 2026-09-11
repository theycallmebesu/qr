const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const MenuItem = require('./models/MenuItem');
const Table = require('./models/Table');
const Order = require('./models/Order');
const Payment = require('./models/Payment');

const seedDatabase = async () => {
  try {
    console.log('--- Initializing Nepali Restaurant Management Database ---');

    // 1. Seed Staff Users with bcrypt hashed passwords
    const salt = await bcrypt.genSalt(10);
    const staffList = [
      {
        name: 'Birat Shrestha',
        username: 'admin',
        position: 'General Manager',
        role: 'admin',
        password: 'admin123',
        phone: '+977-9841234567'
      },
      {
        name: 'Sita Sharma',
        username: 'sita',
        position: 'Senior Waiter',
        role: 'waiter',
        password: 'waiter123',
        phone: '+977-9851122334'
      },
      {
        name: 'Ram Bahadur',
        username: 'ram',
        position: 'Floor Waiter',
        role: 'waiter',
        password: 'waiter123',
        phone: '+977-9861234455'
      },
      {
        name: 'Kancha Dai',
        username: 'kitchen',
        position: 'Head Kitchen Chef',
        role: 'kitchen',
        password: 'kitchen123',
        phone: '+977-9801998877'
      },
      {
        name: 'Pooja Gurung',
        username: 'reception',
        position: 'Front Desk & Billing Cashier',
        role: 'reception',
        password: 'reception123',
        phone: '+977-9812345678'
      }
    ];

    const seededUsers = {};
    for (const s of staffList) {
      const passwordHash = await bcrypt.hash(s.password, salt);
      let user = await User.findOne({ username: s.username });
      if (!user) {
        user = new User({
          name: s.name,
          username: s.username,
          position: s.position,
          role: s.role,
          passwordHash,
          phone: s.phone,
          active: true
        });
        await user.save();
        console.log(`[Seed] Created staff user: ${s.name} (@${s.username}) -> Role: ${s.role}`);
      } else {
        user.name = s.name;
        user.position = s.position;
        user.role = s.role;
        user.passwordHash = passwordHash;
        user.active = true;
        await user.save();
      }
      seededUsers[s.username] = user;
    }

    // 2. Seed Nepali Restaurant Tables
    const defaultTables = [
      {
        tableNumber: 1,
        name: 'Table 1 - Mt. Everest Booth',
        capacity: 2,
        section: 'Window View',
        photo: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80'
      },
      {
        tableNumber: 2,
        name: 'Table 2 - Pokhara Lakeside',
        capacity: 4,
        section: 'Main Dining',
        photo: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=600&q=80'
      },
      {
        tableNumber: 3,
        name: 'Table 3 - Annapurna Dining',
        capacity: 4,
        section: 'Main Dining',
        photo: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=600&q=80'
      },
      {
        tableNumber: 4,
        name: 'Table 4 - Patan Durbar Lounge',
        capacity: 6,
        section: 'Family Dining',
        photo: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=600&q=80'
      },
      {
        tableNumber: 5,
        name: 'Table 5 - Mustang VIP Cabin',
        capacity: 8,
        section: 'VIP Lounge',
        photo: 'https://images.unsplash.com/photo-1578474846511-04ba529f0b88?auto=format&fit=crop&w=600&q=80'
      },
      {
        tableNumber: 6,
        name: 'Table 6 - Kathmandu Balcony',
        capacity: 4,
        section: 'Rooftop Terrace',
        photo: 'https://images.unsplash.com/photo-1525610553991-2bede1a236e2?auto=format&fit=crop&w=600&q=80'
      },
      {
        tableNumber: 7,
        name: 'Table 7 - Langtang Corner',
        capacity: 2,
        section: 'Terrace Garden',
        photo: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80'
      },
      {
        tableNumber: 8,
        name: 'Table 8 - Chitwan Family Table',
        capacity: 6,
        section: 'Family Dining',
        photo: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=600&q=80'
      }
    ];

    const seededTables = {};
    for (const t of defaultTables) {
      let tbl = await Table.findOne({ tableNumber: t.tableNumber });
      if (!tbl) {
        tbl = new Table({ ...t, status: 'empty' });
        await tbl.save();
      } else {
        tbl.name = t.name;
        tbl.capacity = t.capacity;
        tbl.section = t.section;
        tbl.photo = t.photo;
        await tbl.save();
      }
      seededTables[t.tableNumber] = tbl;
    }
    console.log(`[Seed] Seeded ${defaultTables.length} dining tables.`);

    // 3. Seed Authentic Nepali Menu Items
    const nepaliMenu = [
      // Starters
      {
        name: 'Steamed Chicken Momo (10 pcs)',
        category: 'Starters',
        price: 280,
        description: 'Juicy Himalayan minced chicken dumplings served with spicy tomato-sesame golbheda achar.',
        image: 'https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9?auto=format&fit=crop&w=600&q=80',
        inStock: true
      },
      {
        name: 'Crispy Fried Chilli Buff C-Momo',
        category: 'Starters',
        price: 320,
        description: 'Pan-tossed crispy dumplings in spicy wok sauce with bell peppers, onions and fresh chillies.',
        image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=600&q=80',
        inStock: true
      },
      {
        name: 'Sadheko Bhatmas (Roasted Soybeans)',
        category: 'Starters',
        price: 180,
        description: 'Crunchy roasted Nepali soybeans tossed with mustard oil, green chillies, ginger and fresh coriander.',
        image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
        inStock: true
      },
      {
        name: 'Sukuti Sandheko (Spiced Dry Meat)',
        category: 'Starters',
        price: 420,
        description: 'Traditional smoked air-dried buff strips marinated with roasted spices, garlic and lemon juice.',
        image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
        inStock: true
      },
      {
        name: 'Buff Chhoila with Baji (Beaten Rice)',
        category: 'Starters',
        price: 380,
        description: 'Charcoal grilled buffalo meat tossed in aromatic fenugreek and mustard seed oil.',
        image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=600&q=80',
        inStock: true
      },
      {
        name: 'Pangra Fry (Crispy Spiced Gizzards)',
        category: 'Starters',
        price: 260,
        description: 'Crisp deep-fried seasoned gizzards with timur (Sichuan pepper) and black salt.',
        image: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=600&q=80',
        inStock: true
      },

      // Main Courses
      {
        name: 'Thakali Mutton Khana Set (Thali)',
        category: 'Main',
        price: 650,
        description: 'Tender slow-cooked goat curry, Jimbu scented black dal, basmati rice, gundruk saag, mula ko achar, karkalo papad & ghee.',
        image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=600&q=80',
        inStock: true
      },
      {
        name: 'Authentic Nepali Dal Bhat Tarkari Thali',
        category: 'Main',
        price: 450,
        description: 'Fragrant steamed rice, mixed yellow lentils, seasonal vegetable tarkari, potato bamboo shoot curry & fresh chutney.',
        image: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=600&q=80',
        inStock: true
      },
      {
        name: 'Gundruk Dheedo Traditional Set',
        category: 'Main',
        price: 420,
        description: 'Organic buckwheat/millet dheedo served with fermented gundruk bhatmas soup, local ghee and timur chhop.',
        image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80',
        inStock: true
      },
      {
        name: 'Newari Samay Baji Heritage Platter',
        category: 'Main',
        price: 550,
        description: 'Baji (beaten rice), chhoila, kachila, spicy bhate bhatmas, boiled egg, wo (lentil pancake), and spicy potato salad.',
        image: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=600&q=80',
        inStock: true
      },

      // Snacks
      {
        name: 'Kathmandu Chicken Chowmein',
        category: 'Snacks',
        price: 260,
        description: 'Wok-tossed noodles with shredded chicken, crunchy cabbage, carrots and home-blended spices.',
        image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=600&q=80',
        inStock: true
      },
      {
        name: 'Buff Keema Thukpa Soup',
        category: 'Snacks',
        price: 280,
        description: 'Hearty Himalayan noodle soup simmered in bone broth with spiced minced buffalo meat and spring greens.',
        image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80',
        inStock: true
      },
      {
        name: 'Sekuwa Char-Grilled Pork Skewers',
        category: 'Snacks',
        price: 440,
        description: 'Skewered pork cubes marinated in roasted cumin, garlic and Himalayan wood-fire spices.',
        image: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=600&q=80',
        inStock: true
      },
      {
        name: 'Aalu Tama Bodi (Potato Bamboo Shoot)',
        category: 'Snacks',
        price: 220,
        description: 'Classic tangy and savoury curry prepared with fermented bamboo shoots, black-eyed beans and diced potatoes.',
        image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80',
        inStock: true
      },
      {
        name: 'Spicy Wai Wai Sandheko',
        category: 'Snacks',
        price: 150,
        description: 'Crushed crisp Wai-Wai noodles mixed with finely chopped onion, tomato, fresh chilli and tangy mustard oil.',
        image: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=600&q=80',
        inStock: true
      },

      // Drinks
      {
        name: 'Himalayan Masala Chiya',
        category: 'Drinks',
        price: 100,
        description: 'Fresh cow milk boiled with ginger, green cardamom, cloves, cinnamon and Ilam tea leaves.',
        image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80',
        inStock: true
      },
      {
        name: 'Sweet Mango Lassi',
        category: 'Drinks',
        price: 180,
        description: 'Thick creamy yoghurt blended with Alphonso mango pulp and saffron essence.',
        image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80',
        inStock: true
      },
      {
        name: 'Traditional Tongba Millet Brew',
        category: 'Drinks',
        price: 350,
        description: 'Fermented whole-grain finger millet served in a wooden vessel with hot water and bamboo pipe (Pipsing).',
        image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=600&q=80',
        inStock: true
      },
      {
        name: 'Khukri Rum Hot Toddy',
        category: 'Drinks',
        price: 450,
        description: 'Legendary Nepali dark rum infused with wild honey, cinnamon stick, lemon juice and boiling water.',
        image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80',
        inStock: true
      },

      // Dessert
      {
        name: 'Bhaktapur Juju Dhau (King Curd)',
        category: 'Dessert',
        price: 180,
        description: 'Authentic royal sweet yoghurt from Bhaktapur set in porous terracotta clay pots.',
        image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=600&q=80',
        inStock: true
      },
      {
        name: 'Hot Gulab Jamun with Rabdi (2 pcs)',
        category: 'Dessert',
        price: 150,
        description: 'Melt-in-mouth milk dumplings soaked in cardamom and rose sugar syrup.',
        image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=600&q=80',
        inStock: true
      },
      {
        name: 'Warm Sel Roti with Haluwa',
        category: 'Dessert',
        price: 160,
        description: 'Traditional ring-shaped sweet rice bread with crispy exterior, accompanied by saffron semolina haluwa.',
        image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80',
        inStock: true
      }
    ];

    const seededMenuItems = [];
    for (const item of nepaliMenu) {
      let existing = await MenuItem.findOne({ name: item.name });
      if (!existing) {
        existing = new MenuItem(item);
        await existing.save();
      } else {
        existing.price = item.price;
        existing.category = item.category;
        existing.description = item.description;
        existing.image = item.image;
        existing.inStock = item.inStock;
        await existing.save();
      }
      seededMenuItems.push(existing);
    }
    console.log(`[Seed] Seeded ${seededMenuItems.length} authentic Nepali dishes with NPR pricing.`);

    // 4. Seed Historical Payments for Analytics & Past Invoices Lookup
    const existingPaymentsCount = await Payment.countDocuments();
    if (existingPaymentsCount === 0) {
      console.log('[Seed] Seeding historical payments for reports and invoice search...');
      const sita = seededUsers['sita'];
      const ram = seededUsers['ram'];
      const reception = seededUsers['reception'];
      const now = new Date();

      const samplePaymentRecords = [
        {
          daysAgo: 4,
          table: seededTables[1],
          waiter: sita,
          items: [
            { name: 'Steamed Chicken Momo (10 pcs)', price: 280, qty: 2, total: 560 },
            { name: 'Himalayan Masala Chiya', price: 100, qty: 2, total: 200 }
          ],
          method: 'Cash'
        },
        {
          daysAgo: 3,
          table: seededTables[3],
          waiter: ram,
          items: [
            { name: 'Thakali Mutton Khana Set (Thali)', price: 650, qty: 2, total: 1300 },
            { name: 'Sweet Mango Lassi', price: 180, qty: 2, total: 360 },
            { name: 'Sadheko Bhatmas (Roasted Soybeans)', price: 180, qty: 1, total: 180 }
          ],
          method: 'Fonepay QR'
        },
        {
          daysAgo: 2,
          table: seededTables[5],
          waiter: sita,
          items: [
            { name: 'Newari Samay Baji Heritage Platter', price: 550, qty: 3, total: 1650 },
            { name: 'Sekuwa Char-Grilled Pork Skewers', price: 440, qty: 2, total: 880 },
            { name: 'Traditional Tongba Millet Brew', price: 350, qty: 2, total: 700 }
          ],
          method: 'Card'
        },
        {
          daysAgo: 1,
          table: seededTables[2],
          waiter: ram,
          items: [
            { name: 'Kathmandu Chicken Chowmein', price: 260, qty: 2, total: 520 },
            { name: 'Buff Keema Thukpa Soup', price: 280, qty: 1, total: 280 },
            { name: 'Bhaktapur Juju Dhau (King Curd)', price: 180, qty: 2, total: 360 }
          ],
          method: 'eSewa'
        },
        {
          daysAgo: 0,
          table: seededTables[6],
          waiter: sita,
          items: [
            { name: 'Steamed Chicken Momo (10 pcs)', price: 280, qty: 2, total: 560 },
            { name: 'Sukuti Sandheko (Spiced Dry Meat)', price: 420, qty: 1, total: 420 },
            { name: 'Khukri Rum Hot Toddy', price: 450, qty: 2, total: 900 }
          ],
          method: 'Fonepay QR'
        }
      ];

      for (let i = 0; i < samplePaymentRecords.length; i++) {
        const p = samplePaymentRecords[i];
        const payDate = new Date(now.getTime() - p.daysAgo * 24 * 3600 * 1000 - Math.random() * 7200 * 1000);
        const subtotal = p.items.reduce((s, it) => s + it.total, 0);
        const taxRate = 0.13;
        const taxAmount = Number((subtotal * taxRate).toFixed(2));
        const serviceCharge = Number((subtotal * 0.10).toFixed(2));
        const total = Number((subtotal + taxAmount + serviceCharge).toFixed(2));
        const invoiceNumber = `INV-2026-${String(i + 1).padStart(4, '0')}`;

        const payment = new Payment({
          invoiceNumber,
          dateTime: payDate,
          table: p.table._id,
          tableNumber: p.table.tableNumber,
          tableName: p.table.name,
          waiter: p.waiter._id,
          waiterName: p.waiter.name,
          items: p.items,
          subtotal,
          taxRate,
          taxAmount,
          serviceChargeRate: 0.10,
          serviceCharge,
          discountAmount: 0,
          total,
          paymentMethod: p.method,
          status: 'Paid',
          closedBy: reception._id,
          closedByName: reception.name
        });
        await payment.save();
      }
      console.log(`[Seed] Seeded ${samplePaymentRecords.length} completed payment invoices.`);
    }

    // 5. Seed 1 Live Order on Table 4 served by Sita: "Table 4 — served by Sita"
    const liveTable = seededTables[4];
    if (liveTable) {
      const existingLive = await Order.findOne({ table: liveTable._id, status: { $in: ['Sent', 'Preparing', 'Ready'] } });
      if (!existingLive) {
        const item1 = seededMenuItems[0]; // Chicken Momo
        const item2 = seededMenuItems[10]; // Chicken Chowmein
        const item3 = seededMenuItems[15]; // Masala Chiya

        const orderItems = [
          { menuItem: item1._id, name: item1.name, price: item1.price, qty: 2, notes: 'Extra hot tomato achar', status: 'Sent' },
          { menuItem: item2._id, name: item2.name, price: item2.price, qty: 1, notes: 'No onion, mild spice', status: 'Sent' },
          { menuItem: item3._id, name: item3.name, price: item3.price, qty: 2, notes: 'Less sugar', status: 'Sent' }
        ];

        const totalPrice = 2 * item1.price + item2.price + 2 * item3.price;
        const liveOrder = new Order({
          orderNumber: `ORD-${Date.now().toString().slice(-6)}-T4`,
          table: liveTable._id,
          tableNumber: 4,
          tableName: liveTable.name,
          items: orderItems,
          status: 'Sent',
          waiter: seededUsers['sita']._id,
          waiterName: seededUsers['sita'].name,
          specialInstructions: 'Customer requested quick service for children.',
          totalPrice,
          sentAt: new Date(),
          placedAt: new Date()
        });

        await liveOrder.save();

        liveTable.status = 'occupied';
        liveTable.currentOrder = liveOrder._id;
        liveTable.currentWaiter = seededUsers['sita']._id;
        liveTable.currentWaiterName = seededUsers['sita'].name;
        await liveTable.save();

        console.log(`[Seed] Created live order on ${liveTable.name} (Served by ${seededUsers['sita'].name}).`);
      }
    }

    console.log('------------------------------------------------------------');
    console.log('Nepali Restaurant Management System Seed Complete:');
    console.log('1. Admin:        admin     / admin123     (Birat Shrestha)');
    console.log('2. Waiter:       sita      / waiter123    (Sita Sharma)');
    console.log('3. Waiter:       ram       / waiter123    (Ram Bahadur)');
    console.log('4. Kitchen:      kitchen   / kitchen123   (Kancha Dai)');
    console.log('5. Receptionist: reception / reception123 (Pooja Gurung)');
    console.log('------------------------------------------------------------');
  } catch (err) {
    console.error('[Seed Error]:', err);
  }
};

module.exports = seedDatabase;

if (require.main === module) {
  require('dotenv').config();
  const { MongoMemoryServer } = require('mongodb-memory-server');
  (async () => {
    try {
      let mongoUri = process.env.MONGO_URI;
      try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 4000 });
        console.log('Connected to MongoDB Atlas');
      } catch (e) {
        console.warn('MongoDB Atlas connection failed. Falling back to local MongoMemoryServer for seed...');
        const mongoServer = await MongoMemoryServer.create();
        await mongoose.connect(mongoServer.getUri());
        console.log('Connected to MongoDB Memory Server');
      }
      await seedDatabase();
      console.log('Seed completed successfully.');
      process.exit(0);
    } catch (err) {
      console.error('Fatal seed failure:', err);
      process.exit(1);
    }
  })();
}
