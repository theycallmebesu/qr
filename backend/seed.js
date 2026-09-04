const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const MenuItem = require('./models/MenuItem');
const Table = require('./models/Table');
const Order = require('./models/Order');
const Bill = require('./models/Bill');
const ActivityLog = require('./models/ActivityLog');

const seedDatabase = async () => {
  try {
    console.log('--- Initializing Restaurant Management Seed Data ---');

    // Drop legacy email index if it exists in MongoDB Atlas
    try {
      await User.collection.dropIndex('email_1');
      console.log('Dropped legacy email_1 index from users collection.');
    } catch (e) {
      // Ignore if index does not exist
    }

    // 1. Seed Users with Positions (Admin, Owner, Waiter, Chief/Chef)
    const salt = await bcrypt.genSalt(10);
    const defaultUsers = [
      {
        name: 'Alex Morgan',
        username: 'admin',
        position: 'System Administrator',
        role: 'admin',
        password: 'admin123'
      },
      {
        name: 'Eleanor Vance',
        username: 'owner',
        position: 'Restaurant Owner',
        role: 'owner',
        password: 'owner123'
      },
      {
        name: 'Sam Wilson',
        username: 'waiter',
        position: 'Floor Waiter',
        role: 'waiter',
        password: 'waiter123'
      },
      {
        name: 'Chef Marco Pierre',
        username: 'chef',
        position: 'Chief (Head Chef)',
        role: 'chef',
        password: 'chef123'
      }
    ];

    const seededUsers = {};
    for (const u of defaultUsers) {
      let user = await User.findOne({ username: u.username });
      const passwordHash = await bcrypt.hash(u.password, salt);
      if (!user) {
        user = new User({
          name: u.name,
          username: u.username,
          position: u.position,
          passwordHash,
          plainPassword: u.password,
          role: u.role,
          active: true
        });
        await user.save();
        console.log(`Created staff: ${u.name} | Position: ${u.position} (@${u.username})`);
      } else {
        user.name = u.name;
        user.username = u.username;
        user.position = u.position;
        user.role = u.role;
        user.passwordHash = passwordHash;
        user.plainPassword = u.password;
        user.active = true;
        await user.save();
      }
      seededUsers[u.role] = user;
    }

    // 2. Seed Tables
    const defaultTables = [
      { tableNumber: 1, capacity: 2, section: 'Window Booth' },
      { tableNumber: 2, capacity: 4, section: 'Main Dining' },
      { tableNumber: 3, capacity: 4, section: 'Main Dining' },
      { tableNumber: 4, capacity: 6, section: 'Family Dining' },
      { tableNumber: 5, capacity: 2, section: 'Patio Terrace' },
      { tableNumber: 6, capacity: 8, section: 'VIP Lounge' },
      { tableNumber: 7, capacity: 4, section: 'Main Dining' },
      { tableNumber: 8, capacity: 4, section: 'Window Booth' }
    ];

    const seededTables = {};
    for (const t of defaultTables) {
      let table = await Table.findOne({ tableNumber: t.tableNumber });
      if (!table) {
        table = new Table({ ...t, status: 'Empty' });
        await table.save();
      }
      seededTables[t.tableNumber] = table;
    }
    console.log(`Seeded ${defaultTables.length} dining tables.`);

    // 3. Seed Menu Items
    const sampleMenu = [
      {
        name: 'Truffle Garlic Herb Bread',
        category: 'Starters',
        price: 9.50,
        description: 'Warm artisanal sourdough with black truffle butter, roasted garlic & fresh parsley.',
        inStock: true
      },
      {
        name: 'Crispy Calamari Rings',
        category: 'Starters',
        price: 14.00,
        description: 'Golden fried calamari served with smoked paprika aioli and charred lemon wedges.',
        inStock: true
      },
      {
        name: 'Buffalo Glazed Wings',
        category: 'Starters',
        price: 13.50,
        description: 'Tossed in signature tangy buffalo sauce, served with blue cheese dip & celery.',
        inStock: true
      },
      {
        name: 'Bruschetta Classica',
        category: 'Starters',
        price: 10.00,
        description: 'Vine ripe tomatoes, Genovese basil, aged Modena balsamic, extra virgin olive oil.',
        inStock: true
      },
      {
        name: 'Prime Ribeye Steak 12oz',
        category: 'Mains',
        price: 34.00,
        description: 'Certified Angus ribeye with roasted garlic mash, grilled asparagus & peppercorn jus.',
        inStock: true
      },
      {
        name: 'Pan-Seared Atlantic Salmon',
        category: 'Mains',
        price: 28.50,
        description: 'Crispy skin salmon fillet over saffron risotto and lemon dill reduction.',
        inStock: true
      },
      {
        name: 'Truffled Wild Mushroom Risotto',
        category: 'Mains',
        price: 21.00,
        description: 'Carnaroli rice, foraged forest mushrooms, Parmigiano-Reggiano, white truffle oil.',
        inStock: true
      },
      {
        name: 'Smoked Gouda Brioche Burger',
        category: 'Mains',
        price: 18.00,
        description: 'Double beef patty, smoked bacon jam, aged gouda, arugula on toasted brioche with fries.',
        inStock: true
      },
      {
        name: 'Classic Fettuccine Alfredo',
        category: 'Mains',
        price: 19.50,
        description: 'Handmade fresh egg fettuccine in a rich velvety butter and Parmesan cheese sauce.',
        inStock: true
      },
      {
        name: 'Margherita DOC Pizza',
        category: 'Pizzas',
        price: 16.00,
        description: 'San Marzano tomatoes, buffalo mozzarella, fresh basil & Sicilian extra virgin olive oil.',
        inStock: true
      },
      {
        name: 'Spicy Diavola Pepperoni Pizza',
        category: 'Pizzas',
        price: 19.00,
        description: 'Spicy Calabrian salami, chili oil, shredded mozzarella, fresh oregano.',
        inStock: true
      },
      {
        name: 'Quattro Formaggi Pizza',
        category: 'Pizzas',
        price: 20.50,
        description: 'Gorgonzola, fontina, mozzarella, and Pecorino Romano with wildflower honey drizzle.',
        inStock: true
      },
      {
        name: 'Traditional Venetian Tiramisu',
        category: 'Desserts',
        price: 11.00,
        description: 'Espresso soaked savoiardi biscuits, mascarpone cream, and Dutch cocoa dust.',
        inStock: true
      },
      {
        name: 'Warm Belgian Chocolate Lava Cake',
        category: 'Desserts',
        price: 12.50,
        description: 'Molten dark chocolate center, served with Madagascar vanilla bean gelato.',
        inStock: true
      },
      {
        name: 'Signature Passionfruit Mocktail',
        category: 'Beverages',
        price: 8.00,
        description: 'Fresh passionfruit pulp, mint leaves, lime juice, topped with crushed ice soda.',
        inStock: true
      },
      {
        name: 'Cold Brew Peach Iced Tea',
        category: 'Beverages',
        price: 5.50,
        description: 'Slow brewed Ceylon black tea infused with natural peach nectar.',
        inStock: true
      }
    ];

    const seededMenuItems = [];
    for (const item of sampleMenu) {
      let existing = await MenuItem.findOne({ name: item.name });
      if (!existing) {
        existing = new MenuItem(item);
        await existing.save();
      }
      seededMenuItems.push(existing);
    }
    console.log(`Seeded ${seededMenuItems.length} menu dishes.`);

    // 4. Seed Historical Orders and Bills
    const existingBillsCount = await Bill.countDocuments();
    if (existingBillsCount === 0) {
      const now = new Date();
      const waiter = seededUsers['waiter'];
      const chef = seededUsers['chef'];

      for (let dayOffset = 6; dayOffset >= 1; dayOffset--) {
        const orderDate = new Date(now.getTime() - dayOffset * 24 * 60 * 60 * 1000 + Math.random() * 3600000);
        const prepTimeMinutes = 12 + Math.floor(Math.random() * 8);
        const readyDate = new Date(orderDate.getTime() + prepTimeMinutes * 60000);
        const servedDate = new Date(readyDate.getTime() + 4 * 60000);
        const closedDate = new Date(servedDate.getTime() + 25 * 60000);

        const randomItems = [
          seededMenuItems[Math.floor(Math.random() * 4)],
          seededMenuItems[4 + Math.floor(Math.random() * 4)],
          seededMenuItems[12 + Math.floor(Math.random() * 4)]
        ];

        let subtotal = 0;
        const orderItems = randomItems.map(dish => {
          const qty = 1 + Math.floor(Math.random() * 2);
          const price = dish.price;
          subtotal += price * qty;
          return {
            menuItem: dish._id,
            name: dish.name,
            price,
            qty,
            notes: '',
            status: 'Served'
          };
        });

        const randomTable = seededTables[1 + Math.floor(Math.random() * 6)];
        const orderNum = `ORD-PST00${dayOffset}-T${randomTable.tableNumber}`;

        const historicalOrder = new Order({
          orderNumber: orderNum,
          table: randomTable._id,
          tableNumber: randomTable.tableNumber,
          items: orderItems,
          status: 'Completed',
          waiter: waiter._id,
          waiterName: waiter.name,
          chef: chef._id,
          chefName: chef.name,
          totalPrice: subtotal,
          placedAt: orderDate,
          preparingAt: new Date(orderDate.getTime() + 2 * 60000),
          readyAt: readyDate,
          servedAt: servedDate,
          completedAt: closedDate
        });
        await historicalOrder.save();

        const taxRate = 0.10;
        const taxAmount = Number((subtotal * taxRate).toFixed(2));
        const total = Number((subtotal + taxAmount).toFixed(2));
        const paymentMethods = ['Card', 'Cash', 'Online'];
        const pMethod = paymentMethods[dayOffset % paymentMethods.length];

        const historicalBill = new Bill({
          billNumber: `INV-PST00${dayOffset}-T${randomTable.tableNumber}`,
          order: historicalOrder._id,
          table: randomTable._id,
          tableNumber: randomTable.tableNumber,
          items: orderItems.map(i => ({ name: i.name, price: i.price, qty: i.qty, total: i.price * i.qty })),
          subtotal,
          taxRate,
          taxAmount,
          total,
          paymentMethod: pMethod,
          status: 'Paid',
          closedBy: waiter._id,
          closedByName: waiter.name,
          closedAt: closedDate
        });
        await historicalBill.save();
      }
    }

    // 5. Seed 1 Active Live Order on Table 2
    const activeOrderTable = seededTables[2];
    if (activeOrderTable) {
      let existingActive = await Order.findOne({ table: activeOrderTable._id, status: { $in: ['Pending', 'Preparing', 'Ready'] } });
      if (!existingActive) {
        const item1 = seededMenuItems[0];
        const item2 = seededMenuItems[4];
        const orderItems = [
          { menuItem: item1._id, name: item1.name, price: item1.price, qty: 1, notes: 'Extra crispy on edges', status: 'Pending' },
          { menuItem: item2._id, name: item2.name, price: item2.price, qty: 1, notes: 'Medium rare please', status: 'Pending' }
        ];
        const totalPrice = item1.price + item2.price;
        const liveOrder = new Order({
          orderNumber: `ORD-${Date.now().toString().slice(-6)}-T2`,
          table: activeOrderTable._id,
          tableNumber: 2,
          items: orderItems,
          status: 'Pending',
          waiter: seededUsers['waiter']._id,
          waiterName: seededUsers['waiter'].name,
          specialInstructions: 'Customer celebrating anniversary at Table 2.',
          totalPrice,
          placedAt: new Date()
        });
        await liveOrder.save();

        activeOrderTable.status = 'Occupied';
        activeOrderTable.currentOrder = liveOrder._id;
        await activeOrderTable.save();
      }
    }

    // 6. Seed initial Activity Log entry
    const logCount = await ActivityLog.countDocuments();
    if (logCount === 0) {
      await ActivityLog.create({
        userName: 'Alex Morgan',
        userRole: 'admin',
        actionType: 'STAFF_CREATED',
        targetType: 'System',
        details: 'Restaurant System Initialized with staff positions: Chief (Head Chef), Floor Waiter, Owner, and Admin.',
        timestamp: new Date()
      });
    }

    console.log('------------------------------------------------------------');
    console.log('Restaurant System Staff Positions Ready:');
    console.log('1. Admin:  Alex Morgan       | Position: System Administrator | User: admin');
    console.log('2. Owner:  Eleanor Vance     | Position: Restaurant Owner     | User: owner');
    console.log('3. Waiter: Sam Wilson        | Position: Floor Waiter         | User: waiter');
    console.log('4. Chief:  Chef Marco Pierre | Position: Chief (Head Chef)    | User: chef');
    console.log('------------------------------------------------------------');
  } catch (err) {
    console.error('Error seeding database:', err);
  }
};

module.exports = seedDatabase;
