const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const User = require('../models/User');
const MenuItem = require('../models/MenuItem');
const { adminAuth } = require('../middleware/auth');

// Reports and Analytics Dashboard (Admin only)
router.get('/analytics', adminAuth, async (req, res) => {
  try {
    const { range = 'today', startDate: customStart, endDate: customEnd } = req.query;
    const now = new Date();
    let startDate = new Date(0);
    let endDate = new Date();

    if (customStart || customEnd) {
      if (customStart) startDate = new Date(customStart);
      if (customEnd) {
        endDate = new Date(customEnd);
        endDate.setHours(23, 59, 59, 999);
      }
    } else if (range === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (range === 'week') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (range === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    }

    // Filter payments within the date range
    const paymentFilter = {
      status: 'Paid',
      dateTime: { $gte: startDate, $lte: endDate }
    };

    const payments = await Payment.find(paymentFilter)
      .populate('waiter', 'name username role')
      .populate('table', 'name tableNumber');

    // Overview KPIs
    const totalSales = payments.reduce((sum, p) => sum + (p.total || 0), 0);
    const totalOrders = payments.length;
    const averageTicket = totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0;
    const totalTax = payments.reduce((sum, p) => sum + (p.taxAmount || 0), 0);
    const totalServiceCharge = payments.reduce((sum, p) => sum + (p.serviceCharge || 0), 0);

    // Sales by Waiter
    const waiterStats = {};
    payments.forEach(p => {
      const wName = p.waiterName || p.waiter?.name || 'Staff';
      const wId = p.waiter?._id?.toString() || wName;
      if (!waiterStats[wId]) {
        waiterStats[wId] = { id: wId, name: wName, ordersCount: 0, totalSales: 0 };
      }
      waiterStats[wId].ordersCount += 1;
      waiterStats[wId].totalSales += p.total || 0;
    });

    // Top Selling Menu Items
    const dishSales = {};
    payments.forEach(p => {
      (p.items || []).forEach(it => {
        if (!dishSales[it.name]) {
          dishSales[it.name] = { name: it.name, qty: 0, revenue: 0 };
        }
        dishSales[it.name].qty += it.qty;
        dishSales[it.name].revenue += it.total;
      });
    });

    const topSellingDishes = Object.values(dishSales)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 8);

    // Payment Methods breakdown
    const paymentMethods = {};
    payments.forEach(p => {
      const method = p.paymentMethod || 'Cash';
      paymentMethods[method] = (paymentMethods[method] || 0) + (p.total || 0);
    });

    // Today's specific numbers
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayPayments = await Payment.find({ status: 'Paid', dateTime: { $gte: todayStart } });
    const todaySales = todayPayments.reduce((sum, p) => sum + (p.total || 0), 0);
    const todayOrdersCount = todayPayments.length;

    res.json({
      range,
      startDate,
      endDate,
      today: {
        sales: todaySales,
        ordersCount: todayOrdersCount
      },
      summary: {
        totalSales: Math.round(totalSales * 100) / 100,
        totalOrders,
        averageTicket,
        totalTax: Math.round(totalTax * 100) / 100,
        totalServiceCharge: Math.round(totalServiceCharge * 100) / 100,
        paymentMethods
      },
      waiterPerformance: Object.values(waiterStats).sort((a, b) => b.totalSales - a.totalSales),
      topSellingDishes
    });
  } catch (err) {
    console.error('Reports error:', err);
    res.status(500).json({ message: 'Failed to generate reports' });
  }
});

module.exports = router;
