const express = require('express');
const router = express.Router();
const Bill = require('../models/Bill');
const Order = require('../models/Order');
const User = require('../models/User');
const MenuItem = require('../models/MenuItem');
const { ownerAuth } = require('../middleware/auth');

// Owner Analytics & Reports Endpoint
router.get('/analytics', ownerAuth, async (req, res) => {
  try {
    const { range = 'all' } = req.query; // 'today', 'week', 'month', 'all'
    const now = new Date();
    let startDate = new Date(0);

    if (range === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (range === 'week') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (range === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    }

    // Bills within range
    const billFilter = {
      status: 'Paid',
      closedAt: { $gte: startDate }
    };

    const bills = await Bill.find(billFilter).populate('closedBy', 'name role');

    // Overview KPIs
    const totalRevenue = bills.reduce((sum, b) => sum + (b.total || 0), 0);
    const totalBills = bills.length;
    const avgTicketSize = totalBills > 0 ? totalRevenue / totalBills : 0;
    const totalTax = bills.reduce((sum, b) => sum + (b.taxAmount || 0), 0);

    // Payment Methods Breakdown
    const paymentMethods = {};
    bills.forEach(b => {
      paymentMethods[b.paymentMethod] = (paymentMethods[b.paymentMethod] || 0) + b.total;
    });

    // Orders within range
    const orderFilter = {
      createdAt: { $gte: startDate }
    };
    const orders = await Order.find(orderFilter)
      .populate('waiter', 'name')
      .populate('chef', 'name');

    // Waiter Performance (Orders handled & Revenue)
    const waiterStats = {};
    orders.forEach(ord => {
      const wId = ord.waiter?._id?.toString() || 'unknown';
      const wName = ord.waiter?.name || ord.waiterName || 'Staff';
      if (!waiterStats[wId]) {
        waiterStats[wId] = { id: wId, name: wName, ordersCount: 0, totalSales: 0 };
      }
      waiterStats[wId].ordersCount += 1;
      if (ord.status !== 'Cancelled') {
        waiterStats[wId].totalSales += ord.totalPrice || 0;
      }
    });

    // Chef Performance (Prep times)
    const chefStats = {};
    orders.forEach(ord => {
      if (ord.readyAt && ord.placedAt) {
        const cId = ord.chef?._id?.toString() || 'kitchen';
        const cName = ord.chef?.name || ord.chefName || 'Kitchen Staff';
        const prepMinutes = Math.max(1, Math.round((new Date(ord.readyAt) - new Date(ord.placedAt)) / 60000));

        if (!chefStats[cId]) {
          chefStats[cId] = { id: cId, name: cName, completedOrders: 0, totalPrepMinutes: 0 };
        }
        chefStats[cId].completedOrders += 1;
        chefStats[cId].totalPrepMinutes += prepMinutes;
      }
    });

    const chefPerformance = Object.values(chefStats).map(c => ({
      ...c,
      avgPrepMinutes: c.completedOrders > 0 ? Math.round(c.totalPrepMinutes / c.completedOrders) : 0
    }));

    // Top Selling Dishes
    const dishSales = {};
    bills.forEach(b => {
      b.items.forEach(it => {
        if (!dishSales[it.name]) {
          dishSales[it.name] = { name: it.name, qty: 0, revenue: 0 };
        }
        dishSales[it.name].qty += it.qty;
        dishSales[it.name].revenue += it.total;
      });
    });
    const topDishes = Object.values(dishSales)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 6);

    // Sales Trend by day (Last 7 days)
    const dailyTrend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStr = d.toISOString().slice(5, 10); // MM-DD
      const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const endOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);

      const dayBills = bills.filter(b => b.closedAt >= startOfDay && b.closedAt <= endOfDay);
      const dayRev = dayBills.reduce((acc, b) => acc + b.total, 0);

      dailyTrend.push({
        date: dayStr,
        label: d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' }),
        revenue: Math.round(dayRev * 100) / 100,
        orders: dayBills.length
      });
    }

    res.json({
      summary: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalBills,
        avgTicketSize: Math.round(avgTicketSize * 100) / 100,
        totalTax: Math.round(totalTax * 100) / 100,
        paymentMethods
      },
      waiterPerformance: Object.values(waiterStats),
      chefPerformance,
      topDishes,
      dailyTrend
    });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ message: 'Failed to generate analytics report' });
  }
});

module.exports = router;
