import React, { useState, useEffect, useContext } from 'react';
import api from '../../api';
import { SocketContext } from '../../context/SocketContext';
import { AuthContext } from '../../context/AuthContext';
import { 
  ChefHat, 
  Flame, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ShieldAlert, 
  ToggleLeft, 
  ToggleRight, 
  Filter, 
  Sparkles,
  Search,
  Check
} from 'lucide-react';

const ChefKDS = () => {
  const { socket } = useContext(SocketContext);
  const { user } = useContext(AuthContext);

  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All'); // 'All' | 'Pending' | 'Preparing' | 'Ready'
  const [eightySixDrawerOpen, setEightySixDrawerOpen] = useState(false);
  const [eightySixSearch, setEightySixSearch] = useState('');
  const [nowTime, setNowTime] = useState(Date.now());

  // Update timer ticks every 10 seconds for elapsed time badges
  useEffect(() => {
    const timer = setInterval(() => setNowTime(Date.now()), 10000);
    return () => clearInterval(timer);
  }, []);

  // Fetch orders and menu items
  const fetchKdsData = async () => {
    try {
      setLoading(true);
      const [ordersRes, menuRes] = await Promise.all([
        api.get('/orders?status=active'),
        api.get('/menu')
      ]);
      setOrders(ordersRes.data);
      setMenuItems(menuRes.data);
    } catch (err) {
      console.error('Error loading KDS data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKdsData();
  }, []);

  // Socket real-time listeners for KDS
  useEffect(() => {
    if (!socket) return;

    socket.on('order:new', (newOrder) => {
      setOrders((prev) => [newOrder, ...prev.filter((o) => o._id !== newOrder._id)]);
    });

    socket.on('order:status_update', (updatedOrder) => {
      setOrders((prev) => {
        if (['Completed', 'Cancelled'].includes(updatedOrder.status)) {
          return prev.filter((o) => o._id !== updatedOrder._id);
        }
        const exists = prev.some((o) => o._id === updatedOrder._id);
        if (exists) {
          return prev.map((o) => (o._id === updatedOrder._id ? updatedOrder : o));
        }
        return [updatedOrder, ...prev];
      });
    });

    socket.on('menu:update', ({ action, item, id }) => {
      setMenuItems((prev) => {
        if (action === 'delete') return prev.filter((m) => m._id !== id);
        if (action === 'create') return [...prev, item];
        return prev.map((m) => (m._id === item._id ? item : m));
      });
    });

    return () => {
      socket.off('order:new');
      socket.off('order:status_update');
      socket.off('menu:update');
    };
  }, [socket]);

  // Status transitions
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update order');
    }
  };

  // Item checklist toggle
  const updateItemStatus = async (orderId, itemId, currentStatus) => {
    try {
      const nextStatus = currentStatus === 'Ready' ? 'Preparing' : 'Ready';
      await api.patch(`/orders/${orderId}/items/${itemId}/status`, { status: nextStatus });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update item status');
    }
  };

  // Toggle dish stock (86 item)
  const toggleStock = async (itemId, currentInStock) => {
    try {
      await api.patch(`/menu/${itemId}/toggle-stock`, { inStock: !currentInStock });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to toggle dish availability');
    }
  };

  // Filter orders
  const filteredOrders = orders.filter((o) => {
    if (statusFilter === 'All') return o.status !== 'Served';
    return o.status === statusFilter;
  });

  // Calculate elapsed time in minutes
  const getElapsedMinutes = (dateStr) => {
    if (!dateStr) return 0;
    const diff = Math.max(0, nowTime - new Date(dateStr).getTime());
    return Math.floor(diff / 60000);
  };

  const pendingCount = orders.filter((o) => o.status === 'Pending').length;
  const preparingCount = orders.filter((o) => o.status === 'Preparing').length;
  const readyCount = orders.filter((o) => o.status === 'Ready').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8">
      {/* Top Banner & KDS Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center space-x-2">
            <span>Kitchen Display System (KDS)</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-semibold uppercase tracking-wider">
              Live Station
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time ticket display sorted by urgency. Manage item prep states and toggle dish availability.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick 86 Button */}
          <button
            onClick={() => setEightySixDrawerOpen(!eightySixDrawerOpen)}
            className="py-2 px-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-xs font-bold text-slate-200 transition-all flex items-center space-x-2 shadow-sm"
          >
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>86 / Stock Manager</span>
            <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] text-amber-400">
              {menuItems.filter((m) => !m.inStock).length} Out
            </span>
          </button>

          {/* Filter Pills */}
          <div className="flex items-center space-x-1 bg-slate-900 border border-slate-800 p-1 rounded-xl">
            {[
              { id: 'All', label: 'All Active', count: orders.length },
              { id: 'Pending', label: 'Pending', count: pendingCount, color: 'text-amber-400' },
              { id: 'Preparing', label: 'Cooking', count: preparingCount, color: 'text-blue-400' },
              { id: 'Ready', label: 'Ready', count: readyCount, color: 'text-emerald-400' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                  statusFilter === tab.id
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                <span className="text-[10px] font-mono px-1 rounded bg-slate-950/40">{tab.count}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 86 / OUT OF STOCK QUICK DRAWER */}
      {eightySixDrawerOpen && (
        <div className="mb-6 p-4 rounded-2xl bg-slate-900 border border-amber-500/30 shadow-2xl animate-fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Live Kitchen Stock (86'd Dishes)</h3>
            </div>
            <div className="w-64">
              <input
                type="text"
                placeholder="Filter dishes to 86..."
                value={eightySixSearch}
                onChange={(e) => setEightySixSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <p className="text-xs text-slate-400 mb-3">
            Toggle any dish "Out of Stock" below to immediately hide/disable it from Waiters' live ordering pads in real time.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-48 overflow-y-auto pr-1">
            {menuItems
              .filter((m) => !eightySixSearch || m.name.toLowerCase().includes(eightySixSearch.toLowerCase()))
              .map((item) => (
                <div
                  key={item._id}
                  onClick={() => toggleStock(item._id, item.inStock)}
                  className={`p-2.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between select-none ${
                    item.inStock
                      ? 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                      : 'bg-red-950/30 border-red-500/50 shadow-sm shadow-red-900/30'
                  }`}
                >
                  <div className="text-xs font-semibold text-slate-200 truncate">{item.name}</div>
                  <div className="mt-2 flex items-center justify-between text-[10px]">
                    <span className="font-mono text-slate-400">${item.price.toFixed(2)}</span>
                    <span
                      className={`font-bold px-1.5 py-0.5 rounded ${
                        item.inStock
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-red-500/20 text-red-400 uppercase tracking-wider'
                      }`}
                    >
                      {item.inStock ? 'In Stock' : '86 OUT'}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* TICKETS GRID */}
      {filteredOrders.length === 0 ? (
        <div className="p-16 text-center bg-slate-900/50 rounded-2xl border border-slate-800">
          <ChefHat className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-300">Kitchen Display is Clear</h3>
          <p className="text-xs text-slate-500 mt-1">
            No incoming orders pending in this queue. When waiters submit an order, it will appear here in real time.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredOrders.map((ord) => {
            const elapsed = getElapsedMinutes(ord.placedAt);
            const isUrgent = elapsed >= 15;
            const isPending = ord.status === 'Pending';
            const isPreparing = ord.status === 'Preparing';
            const isReady = ord.status === 'Ready';

            return (
              <div
                key={ord._id}
                className={`rounded-2xl border flex flex-col justify-between transition-all duration-200 overflow-hidden ${
                  isUrgent && !isReady
                    ? 'border-red-500 bg-red-950/20 shadow-xl shadow-red-950/30'
                    : isPending
                      ? 'border-amber-500/60 bg-slate-900 shadow-lg shadow-amber-950/20'
                      : isPreparing
                        ? 'border-blue-500/60 bg-slate-900 shadow-lg shadow-blue-950/20'
                        : 'border-emerald-500/60 bg-emerald-950/20 shadow-lg shadow-emerald-950/20'
                }`}
              >
                {/* Ticket Header */}
                <div
                  className={`p-3.5 border-b flex items-center justify-between ${
                    isPending
                      ? 'bg-amber-500/10 border-amber-500/30'
                      : isPreparing
                        ? 'bg-blue-500/10 border-blue-500/30'
                        : 'bg-emerald-500/10 border-emerald-500/30'
                  }`}
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xl font-black text-white">Table #{ord.tableNumber}</span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          isPending
                            ? 'bg-amber-500 text-slate-950'
                            : isPreparing
                              ? 'bg-blue-500 text-white'
                              : 'bg-emerald-500 text-slate-950'
                        }`}
                      >
                        {ord.status}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">
                      {ord.orderNumber} • Server: {ord.waiterName || 'Waiter'}
                    </span>
                  </div>

                  {/* Elapsed Timer */}
                  <div
                    className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-mono font-bold ${
                      isUrgent && !isReady
                        ? 'bg-red-500 text-white animate-pulse'
                        : 'bg-slate-950 border border-slate-800 text-slate-300'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>{elapsed}m</span>
                  </div>
                </div>

                {/* Special Instructions Note */}
                {ord.specialInstructions && (
                  <div className="mx-3 mt-3 p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-medium flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-400" />
                    <div>
                      <span className="font-bold">Table Note: </span>
                      <span>{ord.specialInstructions}</span>
                    </div>
                  </div>
                )}

                {/* Dishes Checklist */}
                <div className="p-3.5 space-y-2 flex-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Dishes Checklist ({ord.items?.length || 0})
                  </div>
                  {ord.items?.map((item) => {
                    const itemIsReady = item.status === 'Ready';

                    return (
                      <div
                        key={item._id}
                        onClick={() => updateItemStatus(ord._id, item._id, item.status)}
                        className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-start justify-between select-none ${
                          itemIsReady
                            ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-200'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start space-x-2.5 flex-1 pr-2">
                          <div
                            className={`w-5 h-5 rounded-md flex items-center justify-center text-xs flex-shrink-0 mt-0.5 ${
                              itemIsReady ? 'bg-emerald-500 text-slate-950 font-bold' : 'border border-slate-700 bg-slate-900'
                            }`}
                          >
                            {itemIsReady && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                          <div>
                            <div className="flex items-center space-x-1.5">
                              <span className="font-black text-amber-400 text-xs">{item.qty}x</span>
                              <span className={`text-xs font-bold ${itemIsReady ? 'line-through text-slate-400' : 'text-slate-100'}`}>
                                {item.name}
                              </span>
                            </div>
                            {item.notes && (
                              <div className="mt-1 text-[11px] text-amber-300/90 font-medium bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 inline-block">
                                Note: {item.notes}
                              </div>
                            )}
                          </div>
                        </div>

                        <span className="text-[10px] uppercase font-mono font-bold text-slate-500">
                          {item.status}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Workflow Buttons */}
                <div className="p-3.5 bg-slate-950/60 border-t border-slate-800">
                  {isPending && (
                    <button
                      onClick={() => updateOrderStatus(ord._id, 'Preparing')}
                      className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center space-x-2"
                    >
                      <Flame className="w-4 h-4" />
                      <span>Start Preparing Ticket</span>
                    </button>
                  )}

                  {isPreparing && (
                    <button
                      onClick={() => updateOrderStatus(ord._id, 'Ready')}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center space-x-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Mark Ticket READY For Waiter</span>
                    </button>
                  )}

                  {isReady && (
                    <div className="text-center py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs font-bold flex items-center justify-center space-x-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Order Ready (Awaiting Server)</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ChefKDS;
