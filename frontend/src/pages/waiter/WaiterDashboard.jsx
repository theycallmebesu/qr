import React, { useState, useEffect, useContext } from 'react';
import api from '../../api';
import { SocketContext } from '../../context/SocketContext';
import { AuthContext } from '../../context/AuthContext';
import { 
  Users, 
  Utensils, 
  Receipt, 
  CheckCircle, 
  Clock, 
  Plus, 
  Minus, 
  Search, 
  AlertCircle,
  CreditCard,
  Banknote,
  Send,
  Sparkles,
  ShoppingBag,
  BellRing,
  X
} from 'lucide-react';

const WaiterDashboard = () => {
  const { socket } = useContext(SocketContext);
  const { user } = useContext(AuthContext);

  const [tables, setTables] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [activeOrders, setActiveOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Ordering modal state
  const [selectedTable, setSelectedTable] = useState(null);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState({}); // { [menuItemId]: { item, qty, notes } }
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [submittingOrder, setSubmittingOrder] = useState(false);

  // Billing modal state
  const [billingModalOpen, setBillingModalOpen] = useState(false);
  const [tableToBill, setTableToBill] = useState(null);
  const [orderToBill, setOrderToBill] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [settlingBill, setSettlingBill] = useState(false);

  // Active orders drawer tab
  const [activeTab, setActiveTab] = useState('floor'); // 'floor' | 'orders'

  // Fetch initial data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [tablesRes, menuRes, ordersRes] = await Promise.all([
        api.get('/tables'),
        api.get('/menu'),
        api.get('/orders?status=active')
      ]);
      setTables(tablesRes.data);
      setMenuItems(menuRes.data);
      setActiveOrders(ordersRes.data);
    } catch (err) {
      console.error('Error fetching waiter data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Socket real-time listeners
  useEffect(() => {
    if (!socket) return;

    // When a table is updated (status change or order attached)
    socket.on('table:update', ({ action, table, id }) => {
      setTables((prev) => {
        if (action === 'delete') return prev.filter((t) => t._id !== id);
        if (action === 'create') return [...prev, table].sort((a, b) => a.tableNumber - b.tableNumber);
        return prev.map((t) => (t._id === table._id ? table : t));
      });
    });

    // When an order is created or status updated
    socket.on('order:new', (order) => {
      setActiveOrders((prev) => [order, ...prev.filter((o) => o._id !== order._id)]);
    });

    socket.on('order:status_update', (updatedOrder) => {
      setActiveOrders((prev) => {
        if (['Completed', 'Cancelled'].includes(updatedOrder.status)) {
          return prev.filter((o) => o._id !== updatedOrder._id);
        }
        const exists = prev.some((o) => o._id === updatedOrder._id);
        if (exists) {
          return prev.map((o) => (o._id === updatedOrder._id ? updatedOrder : o));
        }
        return [updatedOrder, ...prev];
      });

      // Also update table currentOrder if relevant
      setTables((prev) =>
        prev.map((t) => {
          if (t._id === updatedOrder.table?._id || t._id === updatedOrder.table) {
            return { ...t, currentOrder: updatedOrder };
          }
          return t;
        })
      );
    });

    // When menu item stock changes (Chef 86'd an item)
    socket.on('menu:update', ({ action, item, id }) => {
      setMenuItems((prev) => {
        if (action === 'delete') return prev.filter((m) => m._id !== id);
        if (action === 'create') return [...prev, item];
        return prev.map((m) => (m._id === item._id ? item : m));
      });
    });

    // When bill is paid, table is freed
    socket.on('bill:paid', (bill) => {
      setActiveOrders((prev) => prev.filter((o) => o._id !== (bill.order?._id || bill.order)));
    });

    return () => {
      socket.off('table:update');
      socket.off('order:new');
      socket.off('order:status_update');
      socket.off('menu:update');
      socket.off('bill:paid');
    };
  }, [socket]);

  // Cart operations
  const addToCart = (item) => {
    if (!item.inStock) return;
    setCart((prev) => {
      const existing = prev[item._id];
      if (existing) {
        return {
          ...prev,
          [item._id]: { ...existing, qty: existing.qty + 1 }
        };
      }
      return {
        ...prev,
        [item._id]: { item, qty: 1, notes: '' }
      };
    });
  };

  const removeFromCart = (itemId) => {
    setCart((prev) => {
      const existing = prev[itemId];
      if (!existing) return prev;
      if (existing.qty <= 1) {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      }
      return {
        ...prev,
        [itemId]: { ...existing, qty: existing.qty - 1 }
      };
    });
  };

  const updateItemNote = (itemId, note) => {
    setCart((prev) => {
      if (!prev[itemId]) return prev;
      return {
        ...prev,
        [itemId]: { ...prev[itemId], notes: note }
      };
    });
  };

  const cartItemsList = Object.values(cart);
  const cartSubtotal = cartItemsList.reduce((sum, entry) => sum + entry.item.price * entry.qty, 0);

  // Open Order Modal for Table
  const handleOpenOrder = (table) => {
    setSelectedTable(table);
    setCart({});
    setSpecialInstructions('');
    setOrderModalOpen(true);
  };

  // Submit Order to Kitchen
  const handleSubmitOrder = async () => {
    if (!selectedTable || cartItemsList.length === 0) return;
    setSubmittingOrder(true);
    try {
      const payload = {
        tableId: selectedTable._id,
        items: cartItemsList.map((entry) => ({
          menuItemId: entry.item._id,
          qty: entry.qty,
          notes: entry.notes
        })),
        specialInstructions
      };

      await api.post('/orders', payload);
      setOrderModalOpen(false);
      setCart({});
      setSelectedTable(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit order');
    } finally {
      setSubmittingOrder(false);
    }
  };

  // Mark food as Served
  const handleMarkServed = async (orderId) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status: 'Served' });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update order status');
    }
  };

  // Open Billing Modal
  const handleOpenBilling = async (table) => {
    setTableToBill(table);
    // Find active order for this table
    let order = activeOrders.find(
      (o) => (o.table?._id === table._id || o.table === table._id) && o.status !== 'Completed' && o.status !== 'Cancelled'
    );
    if (!order && table.currentOrder) {
      try {
        const res = await api.get(`/orders/${table.currentOrder._id || table.currentOrder}`);
        order = res.data;
      } catch (e) {}
    }
    setOrderToBill(order);
    setPaymentMethod('Cash');
    setDiscountAmount(0);
    setBillingModalOpen(true);
  };

  // Close & Pay Bill
  const handleSettleBill = async () => {
    if (!orderToBill) return;
    setSettlingBill(true);
    try {
      await api.post('/bills/close', {
        orderId: orderToBill._id,
        paymentMethod,
        discountAmount: Number(discountAmount) || 0
      });
      setBillingModalOpen(false);
      setTableToBill(null);
      setOrderToBill(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to settle bill');
    } finally {
      setSettlingBill(false);
    }
  };

  // Categories list
  const categories = ['All', 'Starters', 'Mains', 'Pizzas', 'Desserts', 'Beverages'];
  const filteredMenuItems = menuItems.filter((item) => {
    const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesQuery = !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  // Count orders ready to serve
  const readyOrdersCount = activeOrders.filter((o) => o.status === 'Ready').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8">
      {/* Top Header & Tab Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center space-x-2">
            <span>Waiter Floor Management</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 font-semibold uppercase tracking-wider">
              Floor Station
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Select tables to take orders, track real-time kitchen status, and settle bills.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('floor')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
              activeTab === 'floor'
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>Dining Floor Plan</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`relative px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
              activeTab === 'orders'
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BellRing className="w-3.5 h-3.5" />
            <span>Active Orders ({activeOrders.length})</span>
            {readyOrdersCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping absolute -top-1 -right-1" />
            )}
          </button>
        </div>
      </div>

      {/* Ready Alert Bar if kitchen marked food ready */}
      {readyOrdersCount > 0 && (
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-950/80 to-slate-900 border border-emerald-500/40 shadow-xl flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center animate-bounce">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-emerald-300">
                {readyOrdersCount} Order(s) Ready For Pickup!
              </h3>
              <p className="text-xs text-slate-300">
                Chef has prepared the food. Head to the kitchen to deliver to the table.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('orders')}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-colors"
          >
            View Ready Orders
          </button>
        </div>
      )}

      {/* TAB 1: DINING FLOOR PLAN */}
      {activeTab === 'floor' && (
        <div>
          {/* Table Legend */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-400 mb-4 bg-slate-900/50 p-3 rounded-xl border border-slate-800/80">
            <span className="text-slate-500 uppercase font-bold text-[10px] tracking-wider">Status Legend:</span>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span>Empty (Available)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span>Occupied (Active Order)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
              <span>Billing (Ready to Settle)</span>
            </div>
          </div>

          {/* Tables Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {tables.map((table) => {
              const isEmpty = table.status === 'Empty';
              const isOccupied = table.status === 'Occupied';
              const isBilling = table.status === 'Billing';

              const tableActiveOrder = activeOrders.find(
                (o) => (o.table?._id === table._id || o.table === table._id)
              );

              return (
                <div
                  key={table._id}
                  className={`rounded-2xl border p-5 transition-all duration-200 flex flex-col justify-between relative overflow-hidden ${
                    isEmpty
                      ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                      : isOccupied
                        ? 'bg-amber-950/20 border-amber-500/40 shadow-lg shadow-amber-900/10'
                        : 'bg-purple-950/20 border-purple-500/40 shadow-lg shadow-purple-900/10'
                  }`}
                >
                  {/* Top Bar */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-xl font-black text-white">Table #{table.tableNumber}</span>
                      </div>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                          isEmpty
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : isOccupied
                              ? 'bg-amber-500/15 text-amber-400 border-amber-500/30 animate-pulse'
                              : 'bg-purple-500/15 text-purple-400 border-purple-500/30'
                        }`}
                      >
                        {table.status}
                      </span>
                    </div>

                    <div className="text-xs text-slate-400 flex items-center justify-between pb-3 border-b border-slate-800">
                      <span className="flex items-center space-x-1">
                        <Users className="w-3.5 h-3.5 text-slate-500" />
                        <span>{table.capacity} Seats</span>
                      </span>
                      <span className="text-[11px] text-slate-500">{table.section}</span>
                    </div>

                    {/* Order Information if Occupied */}
                    {tableActiveOrder && (
                      <div className="mt-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs">
                        <div className="flex items-center justify-between text-slate-300 font-semibold mb-1">
                          <span className="truncate">#{tableActiveOrder.orderNumber}</span>
                          <span className="text-amber-400">${tableActiveOrder.totalPrice?.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span>{tableActiveOrder.items?.length || 0} items</span>
                          <span className={`font-bold ${
                            tableActiveOrder.status === 'Ready' ? 'text-emerald-400 font-black' : 'text-slate-300'
                          }`}>
                            {tableActiveOrder.status}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 pt-3 flex items-center space-x-2">
                    {isEmpty ? (
                      <button
                        onClick={() => handleOpenOrder(table)}
                        className="w-full py-2 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors shadow-lg shadow-cyan-600/20"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Take Order</span>
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => handleOpenOrder(table)}
                          className="flex-1 py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors"
                        >
                          + Add Dishes
                        </button>
                        <button
                          onClick={() => handleOpenBilling(table)}
                          className="flex-1 py-2 px-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center space-x-1 transition-colors shadow-lg shadow-purple-600/20"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          <span>Close Bill</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: ACTIVE ORDERS TRACKER */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {activeOrders.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/50 rounded-2xl border border-slate-800">
              <Utensils className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-300">No Active Orders on the Floor</h3>
              <p className="text-xs text-slate-500 mt-1">
                Select an empty table on the floor plan to start taking guest orders.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeOrders.map((ord) => {
                const isReady = ord.status === 'Ready';
                const isPreparing = ord.status === 'Preparing';
                const isPending = ord.status === 'Pending';
                const isServed = ord.status === 'Served';

                return (
                  <div
                    key={ord._id}
                    className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                      isReady
                        ? 'bg-emerald-950/30 border-emerald-500 shadow-xl shadow-emerald-950/40 ring-1 ring-emerald-500'
                        : 'bg-slate-900 border-slate-800'
                    }`}
                  >
                    <div>
                      {/* Header */}
                      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                        <div>
                          <span className="text-lg font-black text-white">Table #{ord.tableNumber}</span>
                          <span className="block text-[11px] font-mono text-slate-400">#{ord.orderNumber}</span>
                        </div>
                        <span
                          className={`text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full border ${
                            isReady
                              ? 'bg-emerald-500 text-slate-950 border-emerald-400 animate-pulse'
                              : isPreparing
                                ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                                : isServed
                                  ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                                  : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                        >
                          {ord.status}
                        </span>
                      </div>

                      {/* Items Checklist */}
                      <div className="py-3 space-y-2">
                        {ord.items?.map((item, idx) => (
                          <div key={idx} className="flex items-start justify-between text-xs">
                            <div className="flex items-start space-x-2">
                              <span className="font-bold text-amber-400">{item.qty}x</span>
                              <div>
                                <span className="font-medium text-slate-200">{item.name}</span>
                                {item.notes && (
                                  <span className="block text-[11px] text-amber-400/90 italic">
                                    Note: {item.notes}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className="text-slate-400 font-mono">${(item.price * item.qty).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>

                      {ord.specialInstructions && (
                        <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 italic mb-2">
                          Special: {ord.specialInstructions}
                        </div>
                      )}
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block">Total Bill</span>
                        <span className="text-base font-black text-white">${ord.totalPrice?.toFixed(2)}</span>
                      </div>

                      {isReady && (
                        <button
                          onClick={() => handleMarkServed(ord._id)}
                          className="py-2 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/30 transition-all flex items-center space-x-1.5"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Mark Food Served</span>
                        </button>
                      )}

                      {isServed && (
                        <span className="text-xs font-semibold text-blue-400 flex items-center space-x-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Served to Table</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: TAKE ORDER MODAL */}
      {orderModalOpen && selectedTable && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-5xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-600/20 text-cyan-400 flex items-center justify-center font-bold">
                  #{selectedTable.tableNumber}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Order For Table #{selectedTable.tableNumber}</h2>
                  <span className="text-xs text-slate-400">{selectedTable.section} • {selectedTable.capacity} Seats</span>
                </div>
              </div>
              <button
                onClick={() => setOrderModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Left Menu, Right Cart */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
              
              {/* Menu Column */}
              <div className="lg:col-span-7 p-4 flex flex-col overflow-hidden border-r border-slate-800">
                {/* Search & Categories */}
                <div className="space-y-3 mb-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search dish name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  {/* Category Pill Filters */}
                  <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                          selectedCategory === cat
                            ? 'bg-cyan-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dish Cards List */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {filteredMenuItems.map((item) => {
                    const inCartQty = cart[item._id]?.qty || 0;
                    const isOutOfStock = !item.inStock;

                    return (
                      <div
                        key={item._id}
                        className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                          isOutOfStock
                            ? 'bg-slate-950/40 border-slate-800/40 opacity-50'
                            : inCartQty > 0
                              ? 'bg-cyan-950/20 border-cyan-500/40'
                              : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex-1 pr-3">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-xs text-slate-100">{item.name}</span>
                            {isOutOfStock && (
                              <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.2 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                                86 / OUT OF STOCK
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{item.description}</p>
                          <span className="text-xs font-bold text-amber-400 mt-1 block">
                            ${item.price.toFixed(2)}
                          </span>
                        </div>

                        {/* Quantity Controls */}
                        {!isOutOfStock && (
                          <div className="flex items-center space-x-1.5">
                            {inCartQty > 0 && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => removeFromCart(item._id)}
                                  className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center text-xs"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <span className="w-6 text-center font-bold text-xs text-white">
                                  {inCartQty}
                                </span>
                              </>
                            )}
                            <button
                              type="button"
                              onClick={() => addToCart(item)}
                              className="w-7 h-7 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white flex items-center justify-center text-xs transition-colors shadow-md shadow-cyan-600/30"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Cart Summary Column */}
              <div className="lg:col-span-5 p-4 flex flex-col justify-between bg-slate-900/40">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
                    <span>Order Cart ({cartItemsList.length} items)</span>
                    <span className="text-amber-400 font-mono font-bold">${cartSubtotal.toFixed(2)}</span>
                  </h3>

                  {cartItemsList.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                      Select items from the menu on the left to add to Table #{selectedTable.tableNumber}'s order.
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[35vh] overflow-y-auto pr-1">
                      {cartItemsList.map(({ item, qty, notes }) => (
                        <div key={item._id} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-200">
                              {qty}x {item.name}
                            </span>
                            <span className="font-mono text-amber-400">${(item.price * qty).toFixed(2)}</span>
                          </div>
                          {/* Note input per item */}
                          <input
                            type="text"
                            placeholder="Special request (e.g. no garlic)..."
                            value={notes}
                            onChange={(e) => updateItemNote(item._id, e.target.value)}
                            className="mt-1.5 w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-[11px] text-slate-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* General order notes */}
                  <div className="mt-4">
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Kitchen Special Instructions
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Guest celebrating anniversary, rush order..."
                      value={specialInstructions}
                      onChange={(e) => setSpecialInstructions(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                {/* Submit button */}
                <div className="pt-4 border-t border-slate-800 mt-4">
                  <div className="flex items-center justify-between text-xs mb-3">
                    <span className="text-slate-400">Total Order Amount:</span>
                    <span className="text-base font-black text-white">${cartSubtotal.toFixed(2)}</span>
                  </div>

                  <button
                    disabled={cartItemsList.length === 0 || submittingOrder}
                    onClick={handleSubmitOrder}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-xl shadow-cyan-600/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-40"
                  >
                    {submittingOrder ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Send Order Directly to Chef</span>
                      </>
                    )}
                  </button>
                </div>

              </div>

            </div>

          </div>
        </div>
      )}

      {/* MODAL 2: BILLING & CHECKOUT MODAL */}
      {billingModalOpen && tableToBill && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl shadow-2xl p-6">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white">Settle Bill: Table #{tableToBill.tableNumber}</h3>
                <span className="text-xs text-slate-400">Generate receipt and free dining table</span>
              </div>
              <button
                onClick={() => setBillingModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {orderToBill ? (
              <div className="py-4 space-y-4">
                {/* Items breakdown */}
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 bg-slate-950 p-3 rounded-xl border border-slate-800">
                  {orderToBill.items?.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <span className="text-slate-300">
                        {item.qty}x {item.name}
                      </span>
                      <span className="text-slate-400 font-mono">
                        ${(item.price * item.qty).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Subtotal, Tax, and Total calculation */}
                {(() => {
                  const subtotal = orderToBill.totalPrice || 0;
                  const tax = Number((subtotal * 0.10).toFixed(2));
                  const discount = Number(discountAmount) || 0;
                  const total = Math.max(0, subtotal + tax - discount);

                  return (
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between text-slate-400">
                        <span>Subtotal:</span>
                        <span className="font-mono">${subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Standard Tax (10%):</span>
                        <span className="font-mono">${tax.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-400">
                        <span>Discount ($):</span>
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          value={discountAmount}
                          onChange={(e) => setDiscountAmount(e.target.value)}
                          className="w-20 bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-right font-mono text-white text-xs"
                        />
                      </div>
                      <div className="pt-2 border-t border-slate-800 flex justify-between text-base font-black text-white">
                        <span>Final Total:</span>
                        <span className="text-purple-400 font-mono">${total.toFixed(2)}</span>
                      </div>
                    </div>
                  );
                })()}

                {/* Payment Method Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Cash', 'Card', 'Online'].map((pm) => (
                      <button
                        key={pm}
                        type="button"
                        onClick={() => setPaymentMethod(pm)}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                          paymentMethod === pm
                            ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-600/30'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {pm}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Complete Payment Button */}
                <button
                  disabled={settlingBill}
                  onClick={handleSettleBill}
                  className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-xl shadow-purple-600/30 transition-all flex items-center justify-center space-x-2"
                >
                  {settlingBill ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Confirm Paid & Free Table #{tableToBill.tableNumber}</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="py-8 text-center text-slate-500 text-xs">
                No active orders found on this table to bill.
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};

export default WaiterDashboard;
