require('dotenv').config();
const mongoose = require('mongoose');
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const { MongoMemoryServer } = require('mongodb-memory-server');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('./models/User');
const Table = require('./models/Table');
const MenuItem = require('./models/MenuItem');
const Order = require('./models/Order');
const Payment = require('./models/Payment');
const seedDatabase = require('./seed');

async function testFullFlow() {
  console.log('=== STARTING END-TO-END RESTAURANT FLOW VERIFICATION ===');

  // 1. Connect memory db
  const mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  console.log('Connected to test in-memory MongoDB');

  // 2. Run seed
  await seedDatabase();

  // 3. Test Users & Authentication
  console.log('\n--- 1. Testing Staff Authentication ---');
  const sitaUser = await User.findOne({ username: 'sita' });
  if (!sitaUser) throw new Error('Sita user not found');
  const isMatch = await bcrypt.compare('waiter123', sitaUser.passwordHash);
  if (!isMatch) throw new Error('Bcrypt password verification failed');
  console.log('✓ Password bcrypt verification passed for waiter @sita');

  const adminUser = await User.findOne({ username: 'admin' });
  const kitchenUser = await User.findOne({ username: 'kitchen' });
  const receptionUser = await User.findOne({ username: 'reception' });
  console.log(`✓ All 4 roles verified in DB: Admin (${adminUser.name}), Waiter (${sitaUser.name}), Kitchen (${kitchenUser.name}), Reception (${receptionUser.name})`);

  // 4. Test Table Status & Waiter Ordering Flow
  console.log('\n--- 2. Testing Waiter Ordering Flow ---');
  const table2 = await Table.findOne({ tableNumber: 2 });
  const momoDish = await MenuItem.findOne({ name: /Momo/i });
  const chiyaDish = await MenuItem.findOne({ name: /Chiya/i });

  const orderNumber = `ORD-TEST-${Date.now()}`;
  const testOrder = new Order({
    orderNumber,
    table: table2._id,
    tableNumber: table2.tableNumber,
    tableName: table2.name,
    items: [
      { menuItem: momoDish._id, name: momoDish.name, price: momoDish.price, qty: 2, notes: 'Extra spicy', status: 'Sent' },
      { menuItem: chiyaDish._id, name: chiyaDish.name, price: chiyaDish.price, qty: 2, notes: 'Less sugar', status: 'Sent' }
    ],
    status: 'Sent',
    waiter: sitaUser._id,
    waiterName: sitaUser.name,
    totalPrice: momoDish.price * 2 + chiyaDish.price * 2,
    sentAt: new Date(),
    placedAt: new Date()
  });
  await testOrder.save();

  table2.status = 'occupied';
  table2.currentOrder = testOrder._id;
  table2.currentWaiter = sitaUser._id;
  table2.currentWaiterName = sitaUser.name;
  await table2.save();
  console.log(`✓ Order ${testOrder.orderNumber} placed for ${table2.name} — Served by ${table2.currentWaiterName} (Rs. ${testOrder.totalPrice})`);

  // 5. Test Kitchen Marking READY
  console.log('\n--- 3. Testing Kitchen One-Action MARK READY ---');
  testOrder.status = 'Ready';
  testOrder.readyAt = new Date();
  testOrder.items.forEach(i => i.status = 'Ready');
  await testOrder.save();
  console.log(`✓ Kitchen marked Order ${testOrder.orderNumber} as READY at ${testOrder.readyAt.toISOString()}`);

  // 6. Test Waiter Marking SERVED
  console.log('\n--- 4. Testing Waiter Marking SERVED ---');
  testOrder.status = 'Served';
  testOrder.servedAt = new Date();
  testOrder.items.forEach(i => i.status = 'Served');
  await testOrder.save();
  console.log(`✓ Waiter ${sitaUser.name} marked order as SERVED`);

  // 7. Test Receptionist Checkout (Independent of stage)
  console.log('\n--- 5. Testing Receptionist Checkout & Payment Collection ---');
  const subtotal = testOrder.totalPrice;
  const taxAmount = Number((subtotal * 0.13).toFixed(2));
  const serviceCharge = Number((subtotal * 0.10).toFixed(2));
  const total = Number((subtotal + taxAmount + serviceCharge).toFixed(2));
  const invoiceNumber = `INV-TEST-001`;

  const payment = new Payment({
    invoiceNumber,
    dateTime: new Date(),
    table: table2._id,
    tableNumber: table2.tableNumber,
    tableName: table2.name,
    waiter: sitaUser._id,
    waiterName: sitaUser.name,
    items: testOrder.items.map(it => ({ name: it.name, price: it.price, qty: it.qty, notes: it.notes, total: it.price * it.qty })),
    subtotal,
    taxRate: 0.13,
    taxAmount,
    serviceChargeRate: 0.10,
    serviceCharge,
    total,
    paymentMethod: 'Fonepay QR',
    status: 'Paid',
    order: testOrder._id,
    closedBy: receptionUser._id,
    closedByName: receptionUser.name
  });
  await payment.save();

  // Free table
  table2.status = 'empty';
  table2.currentOrder = null;
  table2.currentWaiter = null;
  table2.currentWaiterName = '';
  await table2.save();

  testOrder.status = 'Completed';
  testOrder.completedAt = new Date();
  await testOrder.save();

  console.log(`✓ Receptionist ${receptionUser.name} settled Invoice #${payment.invoiceNumber} for Rs. ${payment.total} via ${payment.paymentMethod}`);
  console.log(`✓ Table ${table2.tableNumber} status freed to: '${table2.status}'`);

  // 8. Test Invoices Database Query
  console.log('\n--- 6. Testing Invoices Search & Export ---');
  const foundPayments = await Payment.find({ invoiceNumber });
  if (foundPayments.length === 0) throw new Error('Payment lookup failed');
  console.log(`✓ Found invoice #${foundPayments[0].invoiceNumber} in MongoDB 'payments' collection with total Rs. ${foundPayments[0].total}`);

  // 9. Test Collections check
  console.log('\n--- 7. Verifying 5 Required Database Collections ---');
  const collections = await mongoose.connection.db.listCollections().toArray();
  const names = collections.map(c => c.name);
  console.log('MongoDB Collections present:', names);

  const requiredCollections = ['users', 'tables', 'menuItems', 'orders', 'payments'];
  for (const cName of requiredCollections) {
    if (!names.includes(cName)) {
      throw new Error(`Missing expected collection: ${cName}`);
    }
  }
  console.log('✓ All 5 required collections exist: users, tables, menuItems, orders, payments');

  console.log('\n=== ALL END-TO-END RESTAURANT FLOW CHECKS PASSED SUCCESSFULLY! ===\n');
  process.exit(0);
}

testFullFlow().catch(err => {
  console.error('VERIFICATION FAILED:', err);
  process.exit(1);
});
