import React, { useState, useEffect, useContext } from 'react';
import api from '../../api';
import { SocketContext } from '../../context/SocketContext';
import { 
  BarChart3, 
  DollarSign, 
  TrendingUp, 
  Receipt, 
  Users, 
  ChefHat, 
  Clock, 
  UtensilsCrossed, 
  Calendar, 
  XCircle, 
  CreditCard,
  Banknote,
  Globe,
  Sparkles,
  ArrowUpRight,
  ShieldAlert
} from 'lucide-react';

const OwnerDashboard = () => {
  const { socket } = useContext(SocketContext);

  const [analytics, setAnalytics] = useState(null);
  const [activeOrders, setActiveOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('all'); // 'today' | 'week' | 'month' | 'all'
  const [cancellingOrderId, setCancellingOrderId] = useState(null);

  // Fetch analytics & active orders
  const fetchOwnerData = async () => {
    try {
      setLoading(true);
      const [analyticsRes, ordersRes] = await Promise.all([
        api.get(`/reports/analytics?range=${range}`),
        api.get('/orders?status=active')
      ]);
      setAnalytics(analyticsRes.data);
      setActiveOrders(ordersRes.data);
    } catch (err) {
      console.error('Error loading owner reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOwnerData();
  }, [range]);

  // Real-time updates for live orders and bills
  useEffect(() => {
    if (!socket) return;

    socket.on('bill:paid', () => {
      // Re-fetch analytics to reflect newly settled bill
      fetchOwnerData();
    });

    socket.on('order:new', (newOrder) => {
      setActiveOrders((prev) => [newOrder, ...prev.filter((o) => o._id !== newOrder._id)]);
    });

    socket.on('order:status_update', (updatedOrder) => {
      setActiveOrders((prev) => {
        if (['Completed', 'Cancelled'].includes(updatedOrder.status)) {
          return prev.filter((o) => o._id !== updatedOrder._id);
        }
        return prev.map((o) => (o._id === updatedOrder._id ? updatedOrder : o));
      });
    });

    return () => {
      socket.off('bill:paid');
      socket.off('order:new');
      socket.off('order:status_update');
    };
  }, [socket, range]);

  // Cancel / Override Order
  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to override and CANCEL this order?')) return;
    setCancellingOrderId(orderId);
    try {
      await api.patch(`/orders/${orderId}/status`, { status: 'Cancelled' });
      setActiveOrders((prev) => prev.filter((o) => o._id !== orderId));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel order');
    } finally {
      setCancellingOrderId(null);
    }
  };

  const summary = analytics?.summary || {
    totalRevenue: 0,
    totalBills: 0,
    avgTicketSize: 0,
    totalTax: 0,
    paymentMethods: {}
  };

  const maxDailyRevenue = Math.max(...(analytics?.dailyTrend?.map((d) => d.revenue) || [1]), 100);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center space-x-2">
            <span>Executive Business Analytics</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold uppercase tracking-wider">
              Owner Overview
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Financial revenue metrics, sales trends, staff KPIs, and floor overrides.
          </p>
        </div>

        {/* Time Range Filter */}
        <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-800 p-1.5 rounded-xl">
          {[
            { id: 'today', label: 'Today' },
            { id: 'week', label: 'Past 7 Days' },
            { id: 'month', label: 'Past 30 Days' },
            { id: 'all', label: 'All Time' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setRange(item.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                range === item.id
                  ? 'bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Total Revenue */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-white mt-3 font-mono">
            ${summary.totalRevenue.toFixed(2)}
          </div>
          <div className="text-[11px] text-emerald-400 mt-2 flex items-center space-x-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Net settled guest dining sales</span>
          </div>
        </div>

        {/* Total Bills Closed */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Bills Settled</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-white mt-3 font-mono">
            {summary.totalBills}
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            Completed dining transactions
          </div>
        </div>

        {/* Average Ticket Size */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Avg Check Size</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-white mt-3 font-mono">
            ${summary.avgTicketSize.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            Average revenue per table
          </div>
        </div>

        {/* Tax Collected */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tax Provision</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-white mt-3 font-mono">
            ${summary.totalTax.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            10% standard restaurant tax
          </div>
        </div>
      </div>

      {/* Main Insights Grid: Sales Trend & Payment Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        
        {/* Daily Revenue Trend Bar Chart */}
        <div className="lg:col-span-8 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-white">Daily Revenue Progression</h3>
              <p className="text-xs text-slate-400">Past 7 days performance comparison</p>
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
              Live Daily Sync
            </span>
          </div>

          <div className="h-48 flex items-end justify-between gap-3 pt-4 px-2 border-b border-slate-800">
            {analytics?.dailyTrend?.map((day, idx) => {
              const heightPercent = Math.max(8, Math.round((day.revenue / maxDailyRevenue) * 100));

              return (
                <div key={idx} className="flex-1 flex flex-col items-center group h-full justify-end">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-mono font-bold text-emerald-400 mb-1">
                    ${day.revenue.toFixed(0)}
                  </div>
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className="w-full max-w-[40px] rounded-t-lg bg-gradient-to-t from-emerald-600 to-teal-400 group-hover:from-emerald-500 group-hover:to-teal-300 transition-all shadow-md shadow-emerald-600/20"
                  />
                  <span className="text-[11px] text-slate-400 mt-2 block font-medium">
                    {day.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment Methods Breakdown */}
        <div className="lg:col-span-4 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white mb-1">Payment Channels</h3>
            <p className="text-xs text-slate-400 mb-6">Revenue split by payment type</p>

            <div className="space-y-4">
              {['Card', 'Cash', 'Online'].map((method) => {
                const amount = summary.paymentMethods[method] || 0;
                const percent = summary.totalRevenue > 0 ? Math.round((amount / summary.totalRevenue) * 100) : 0;

                return (
                  <div key={method} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-300 flex items-center space-x-2">
                        {method === 'Card' && <CreditCard className="w-4 h-4 text-cyan-400" />}
                        {method === 'Cash' && <Banknote className="w-4 h-4 text-emerald-400" />}
                        {method === 'Online' && <Globe className="w-4 h-4 text-purple-400" />}
                        <span>{method}</span>
                      </span>
                      <span className="font-mono text-white font-bold">
                        ${amount.toFixed(2)} ({percent}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-950 overflow-hidden">
                      <div
                        style={{ width: `${percent}%` }}
                        className={`h-full rounded-full ${
                          method === 'Card' ? 'bg-cyan-500' : method === 'Cash' ? 'bg-emerald-500' : 'bg-purple-500'
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-500">
            Settlement audited with zero variance.
          </div>
        </div>

      </div>

      {/* Staff Performance & Top Dishes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        
        {/* Waiter & Chef Staff Performance */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
          <h3 className="text-base font-bold text-white mb-1 flex items-center space-x-2">
            <Users className="w-5 h-5 text-cyan-400" />
            <span>Staff Productivity & Efficiency</span>
          </h3>
          <p className="text-xs text-slate-400 mb-6">Orders taken by floor staff and kitchen preparation speeds</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Waiter Performance */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 block mb-3">
                Floor Waiters Volume
              </span>
              {analytics?.waiterPerformance?.length === 0 ? (
                <div className="text-xs text-slate-500">No waiter data recorded yet</div>
              ) : (
                <div className="space-y-3">
                  {analytics?.waiterPerformance?.map((w) => (
                    <div key={w.id} className="text-xs pb-2 border-b border-slate-800/80 last:border-none">
                      <div className="flex justify-between font-semibold text-slate-200">
                        <span>{w.name}</span>
                        <span className="text-cyan-400 font-mono">${w.totalSales.toFixed(2)}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {w.ordersCount} total orders handled
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Chef Performance */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 block mb-3">
                Kitchen Prep Times
              </span>
              {analytics?.chefPerformance?.length === 0 ? (
                <div className="text-xs text-slate-500">No completed kitchen timings yet</div>
              ) : (
                <div className="space-y-3">
                  {analytics?.chefPerformance?.map((c) => (
                    <div key={c.id} className="text-xs pb-2 border-b border-slate-800/80 last:border-none">
                      <div className="flex justify-between font-semibold text-slate-200">
                        <span>{c.name}</span>
                        <span className="text-amber-400 font-mono font-bold flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>~{c.avgPrepMinutes} mins</span>
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {c.completedOrders} orders marked ready
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Top Selling Dishes */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
          <h3 className="text-base font-bold text-white mb-1 flex items-center space-x-2">
            <UtensilsCrossed className="w-5 h-5 text-amber-400" />
            <span>Top-Selling Menu Dishes</span>
          </h3>
          <p className="text-xs text-slate-400 mb-6">Highest ordered items by quantity</p>

          <div className="space-y-3">
            {analytics?.topDishes?.map((dish, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs"
              >
                <div className="flex items-center space-x-3">
                  <span className="w-6 h-6 rounded-lg bg-slate-800 text-amber-400 font-bold flex items-center justify-center font-mono text-[11px]">
                    #{idx + 1}
                  </span>
                  <div>
                    <div className="font-semibold text-slate-200">{dish.name}</div>
                    <div className="text-[11px] text-slate-500">{dish.qty} orders served</div>
                  </div>
                </div>
                <span className="font-mono font-bold text-emerald-400">
                  ${dish.revenue.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Live Floor Override Controls (Owner privilege) */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 text-red-400" />
              <span>Active Orders Floor Override</span>
            </h3>
            <p className="text-xs text-slate-400">
              Live emergency cancel or override control for any pending/preparing table order.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {activeOrders.length} currently active on floor
          </span>
        </div>

        {activeOrders.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
            No active orders currently running on the restaurant floor.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-800">
                <tr>
                  <th className="pb-3">Table #</th>
                  <th className="pb-3">Order Number</th>
                  <th className="pb-3">Server</th>
                  <th className="pb-3">Dishes</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Total</th>
                  <th className="pb-3 text-right">Owner Override</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {activeOrders.map((ord) => (
                  <tr key={ord._id} className="hover:bg-slate-950/40">
                    <td className="py-3 font-bold text-white">Table #{ord.tableNumber}</td>
                    <td className="py-3 font-mono text-slate-400">{ord.orderNumber}</td>
                    <td className="py-3 text-slate-300">{ord.waiterName || 'Staff'}</td>
                    <td className="py-3 text-slate-300 max-w-xs truncate">
                      {ord.items?.map((i) => `${i.qty}x ${i.name}`).join(', ')}
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        ord.status === 'Ready' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {ord.status}
                      </span>
                    </td>
                    <td className="py-3 font-mono font-bold text-slate-200">
                      ${ord.totalPrice?.toFixed(2)}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        disabled={cancellingOrderId === ord._id}
                        onClick={() => handleCancelOrder(ord._id)}
                        className="py-1 px-3 rounded-lg bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white font-bold text-[11px] transition-colors border border-red-500/30"
                      >
                        Cancel / Void
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default OwnerDashboard;
