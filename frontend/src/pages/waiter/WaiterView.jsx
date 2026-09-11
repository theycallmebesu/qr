import React, { useState, useEffect, useContext, useMemo } from 'react';
import {
  Users,
  Plus,
  Minus,
  Send,
  CheckCircle,
  Clock,
  Search,
  Utensils,
  ChevronRight,
  ArrowLeft,
  X,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import StaffHeader from '../../components/StaffHeader';
import FullScreenReadyAlert from '../../components/FullScreenReadyAlert';
import { AuthContext } from '../../context/AuthContext';
import { SocketContext } from '../../context/SocketContext';
import { formatNPR } from '../../utils/currency';
import api from '../../api';

const WaiterView = () => {
  const { user } = useContext(AuthContext);
  const { socket, readyAlert, dismissReadyAlert } = useContext(SocketContext);

  const [tables, setTables] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter & Navigation states
  const [activeTab, setActiveTab] = useState('tables'); // 'tables' | 'my_orders'
  const [tableFilter, setTableFilter] = useState('all'); // 'all' | 'free' | 'occupied'
  const [selectedTable, setSelectedTable] = useState(null); // Table opened in drawer

  // Order builder state
  const [orderCart, setOrderCart] = useState({}); // { [itemId]: { item, qty, notes } }
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [specialOrderNotes, setSpecialOrderNotes] = useState('');
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  // Fetch initial data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [tblRes, menuRes, ordersRes] = await Promise.all([
        api.get('/tables'),
        api.get('/menu'),
        api.get('/orders?myOrdersOnly=true&status=active')
      ]);
      setTables(tblRes.data);
      setMenuItems(menuRes.data);
      setMyOrders(ordersRes.data);
    } catch (err) {
      console.error('Failed to load waiter data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Listen to real-time socket events
  useEffect(() => {
    if (!socket) return;

    const handleTableUpdate = () => {
      api.get('/tables').then(res => setTables(res.data)).catch(() => {});
    };

    const handleOrderStatusUpdate = (updatedOrder) => {
      setMyOrders(prev => {
        const index = prev.findIndex(o => o._id === updatedOrder._id);
        if (index >= 0) {
          const next = [...prev];
          next[index] = updatedOrder;
          return next;
        }
        return [updatedOrder, ...prev];
      });
      api.get('/tables').then(res => setTables(res.data)).catch(() => {});
    };

    const handleOrderNew = (newOrder) => {
      if (newOrder.waiter === user?.id || newOrder.waiter?._id === user?.id) {
        setMyOrders(prev => [newOrder, ...prev.filter(o => o._id !== newOrder._id)]);
      }
      api.get('/tables').then(res => setTables(res.data)).catch(() => {});
    };

    socket.on('table:update', handleTableUpdate);
    socket.on('order:status_update', handleOrderStatusUpdate);
    socket.on('order:new', handleOrderNew);

    return () => {
      socket.off('table:update', handleTableUpdate);
      socket.off('order:status_update', handleOrderStatusUpdate);
      socket.off('order:new', handleOrderNew);
    };
  }, [socket, user]);

  // Categories extracted from menu items
  const categories = useMemo(() => {
    const list = ['All', 'Starters', 'Main', 'Snacks', 'Drinks', 'Dessert'];
    return list;
  }, []);

  // Filtered menu items
  const filteredMenu = useMemo(() => {
    return menuItems.filter(item => {
      const matchCat = selectedCategory === 'All' || item.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchSearch = !searchQuery.trim() || item.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [menuItems, selectedCategory, searchQuery]);

  // Cart operations
  const handleAddToCart = (item) => {
    if (!item.inStock) return;
    setOrderCart(prev => {
      const existing = prev[item._id];
      const newQty = existing ? existing.qty + 1 : 1;
      return {
        ...prev,
        [item._id]: {
          item,
          qty: newQty,
          notes: existing?.notes || ''
        }
      };
    });
  };

  const handleRemoveFromCart = (itemId) => {
    setOrderCart(prev => {
      const existing = prev[itemId];
      if (!existing) return prev;
      if (existing.qty <= 1) {
        const next = { ...prev };
        delete next[itemId];
        return next;
      }
      return {
        ...prev,
        [itemId]: { ...existing, qty: existing.qty - 1 }
      };
    });
  };

  const handleItemNotesChange = (itemId, notes) => {
    setOrderCart(prev => {
      if (!prev[itemId]) return prev;
      return {
        ...prev,
        [itemId]: { ...prev[itemId], notes }
      };
    });
  };

  // Total cart calculation
  const cartList = Object.values(orderCart);
  const cartTotalNPR = cartList.reduce((sum, entry) => sum + entry.item.price * entry.qty, 0);
  const cartItemsCount = cartList.reduce((sum, entry) => sum + entry.qty, 0);

  // Submit order to kitchen
  const handleSubmitOrder = async () => {
    if (!selectedTable) return;
    if (cartList.length === 0) {
      alert('Please add at least one dish to the order.');
      return;
    }

    try {
      setSubmittingOrder(true);
      const itemsPayload = cartList.map(entry => ({
        menuItemId: entry.item._id,
        name: entry.item.name,
        price: entry.item.price,
        qty: entry.qty,
        notes: entry.notes || ''
      }));

      const res = await api.post('/orders', {
        tableId: selectedTable._id,
        items: itemsPayload,
        specialInstructions: specialOrderNotes
      });

      // Clear cart
      setOrderCart({});
      setSpecialOrderNotes('');
      setSelectedTable(null);
      setFeedbackMsg(`Order #${res.data.orderNumber} sent to kitchen!`);
      setTimeout(() => setFeedbackMsg(''), 4000);

      // Refresh data
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit order to kitchen.');
    } finally {
      setSubmittingOrder(false);
    }
  };

  // Mark food as served
  const handleMarkServed = async (orderId) => {
    try {
      await api.patch(`/orders/${orderId}/served`);
      setMyOrders(prev =>
        prev.map(o => (o._id === orderId ? { ...o, status: 'Served', servedAt: new Date() } : o))
      );
      setFeedbackMsg('Food marked as Served!');
      setTimeout(() => setFeedbackMsg(''), 3000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to mark as served.');
    }
  };

  // Table filter predicate
  const displayedTables = useMemo(() => {
    return tables.filter(t => {
      const isFree = t.status === 'empty';
      if (tableFilter === 'free') return isFree;
      if (tableFilter === 'occupied') return !isFree;
      return true;
    });
  }, [tables, tableFilter]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans pb-20">
      <StaffHeader />

      {/* Full-screen popup for "Food Ready" notification */}
      {readyAlert && (
        <FullScreenReadyAlert
          alert={readyAlert}
          onDismiss={dismissReadyAlert}
          onMarkServed={(orderId) => handleMarkServed(orderId)}
        />
      )}

      {/* Feedback Toast */}
      {feedbackMsg && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-7xl mx-auto w-full p-4 sm:p-6 flex-1">
        {/* Top Controls: Tabs & Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          {/* Main Station Switcher: Floor Tables vs My Active Orders */}
          <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 self-start">
            <button
              onClick={() => setActiveTab('tables')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'tables'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Floor Tables ({tables.length})
            </button>
            <button
              onClick={() => setActiveTab('my_orders')}
              className={`relative px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'my_orders'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>My Active Orders</span>
              {myOrders.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center">
                  {myOrders.length}
                </span>
              )}
            </button>
          </div>

          {/* Quick Table Status Filter */}
          {activeTab === 'tables' && (
            <div className="flex items-center gap-1.5 self-start sm:self-auto">
              {[
                { key: 'all', label: 'All Tables' },
                { key: 'free', label: 'Empty' },
                { key: 'occupied', label: 'Occupied' }
              ].map(flt => (
                <button
                  key={flt.key}
                  onClick={() => setTableFilter(flt.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                    tableFilter === flt.key
                      ? 'bg-slate-800 border-amber-500/50 text-amber-400'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {flt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* TAB 1: TABLES FLOOR VIEW */}
        {activeTab === 'tables' && (
          <div>
            {loading ? (
              <div className="text-center py-20 text-slate-500 text-sm">
                Loading dining tables...
              </div>
            ) : displayedTables.length === 0 ? (
              <div className="text-center py-16 text-slate-500 text-sm">
                No tables found matching this filter.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {displayedTables.map(tbl => {
                  const isFree = tbl.status === 'empty';
                  const isOccupied = tbl.status === 'occupied';
                  const needsBill = tbl.status === 'needs bill';

                  const waiterName = tbl.currentWaiterName || tbl.currentWaiter?.name || tbl.currentOrder?.waiterName;

                  return (
                    <div
                      key={tbl._id}
                      onClick={() => {
                        setSelectedTable(tbl);
                        setOrderCart({});
                      }}
                      className={`group relative rounded-2xl overflow-hidden border transition-all cursor-pointer bg-slate-900 shadow-lg hover:-translate-y-1 active:scale-[0.98] ${
                        isFree
                          ? 'border-slate-800 hover:border-emerald-500/50'
                          : isOccupied
                          ? 'border-amber-500/40 bg-slate-900/90 hover:border-amber-500'
                          : 'border-purple-500/50 hover:border-purple-400'
                      }`}
                    >
                      {/* Table Photo Banner */}
                      <div className="h-32 w-full relative overflow-hidden bg-slate-800">
                        <img
                          src={tbl.photo}
                          alt={tbl.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                        {/* Status Badge */}
                        <div className="absolute top-2.5 right-2.5">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow ${
                              isFree
                                ? 'bg-emerald-500 text-slate-950'
                                : isOccupied
                                ? 'bg-amber-500 text-slate-950'
                                : 'bg-purple-500 text-white'
                            }`}
                          >
                            {isFree ? 'Free' : isOccupied ? 'Occupied' : 'Needs Bill'}
                          </span>
                        </div>

                        {/* Capacity Tag */}
                        <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-md text-[10px] font-bold text-slate-300">
                          {tbl.capacity} Seats • {tbl.section}
                        </div>

                        {/* Table Number Overlay */}
                        <div className="absolute bottom-2.5 left-3">
                          <h3 className="text-base font-black text-white drop-shadow">
                            {tbl.name}
                          </h3>
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="p-3.5 space-y-2">
                        {/* Waiter assignment display: "Table 4 — served by Sita" */}
                        {isOccupied && waiterName ? (
                          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 font-semibold flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                            <span>Served by <strong className="text-white">{waiterName}</strong></span>
                          </div>
                        ) : isFree ? (
                          <p className="text-xs text-slate-400">
                            Table is clean and ready for guests.
                          </p>
                        ) : (
                          <p className="text-xs text-purple-300 font-medium">
                            Customer ready for checkout.
                          </p>
                        )}

                        {/* Order info preview if occupied */}
                        {tbl.currentOrder && (
                          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800">
                            <span>Order #{tbl.currentOrder.orderNumber}</span>
                            <span className="font-bold text-white">
                              {formatNPR(tbl.currentOrder.totalPrice)}
                            </span>
                          </div>
                        )}

                        {/* Action Button */}
                        <div className="pt-2">
                          <div className="w-full py-2 rounded-xl bg-slate-800 group-hover:bg-amber-500 group-hover:text-slate-950 text-slate-300 text-xs font-bold text-center flex items-center justify-center gap-1.5 transition">
                            <span>{isFree ? 'Open & Take Order' : 'Manage / Add Dishes'}</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MY ACTIVE ORDERS TRACKING */}
        {activeTab === 'my_orders' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-black text-white tracking-tight">
                My Active Orders ({myOrders.length})
              </h2>
              <button
                onClick={fetchData}
                className="text-xs text-amber-400 hover:underline font-bold"
              >
                Refresh Queue
              </button>
            </div>

            {myOrders.length === 0 ? (
              <div className="text-center py-20 bg-slate-900 border border-slate-800 rounded-3xl p-6">
                <Utensils className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-white">No Active Orders</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Orders you submit to the kitchen will appear here with live preparation and pick-up alerts.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myOrders.map(order => {
                  const isSent = order.status === 'Sent' || order.status === 'Pending';
                  const isPreparing = order.status === 'Preparing';
                  const isReady = order.status === 'Ready';
                  const isServed = order.status === 'Served';

                  return (
                    <div
                      key={order._id}
                      className={`p-5 rounded-2xl border bg-slate-900 space-y-4 shadow-lg ${
                        isReady
                          ? 'border-emerald-500 shadow-emerald-500/10'
                          : 'border-slate-800'
                      }`}
                    >
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-black text-white">
                              {order.tableName || `Table ${order.tableNumber}`}
                            </h3>
                            <span className="text-xs font-mono text-slate-400">
                              #{order.orderNumber}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Total: <strong className="text-amber-400">{formatNPR(order.totalPrice)}</strong>
                          </p>
                        </div>

                        {/* Status Chip */}
                        <div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                              isReady
                                ? 'bg-emerald-500 text-slate-950 animate-pulse'
                                : isServed
                                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                                : isPreparing
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {order.status}
                          </span>
                        </div>
                      </div>

                      {/* Order Stage Progress Bar */}
                      <div className="grid grid-cols-4 gap-1.5 pt-1">
                        {[
                          { label: 'Sent', active: true },
                          { label: 'Prep', active: isPreparing || isReady || isServed },
                          { label: 'Ready', active: isReady || isServed, highlight: isReady },
                          { label: 'Served', active: isServed }
                        ].map((st, i) => (
                          <div key={i} className="text-center">
                            <div
                              className={`h-2 rounded-full mb-1 transition ${
                                st.highlight
                                  ? 'bg-emerald-400 animate-pulse'
                                  : st.active
                                  ? 'bg-amber-500'
                                  : 'bg-slate-800'
                              }`}
                            />
                            <span className="text-[10px] font-bold text-slate-400">
                              {st.label}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Ordered Items List */}
                      <div className="bg-slate-950/60 rounded-xl p-3 space-y-1.5 text-xs">
                        {order.items.map((it, idx) => (
                          <div key={idx} className="flex items-center justify-between text-slate-300">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded bg-slate-800 text-[10px] font-bold flex items-center justify-center text-amber-400">
                                {it.qty}
                              </span>
                              <span>{it.name}</span>
                            </div>
                            {it.notes && (
                              <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                                {it.notes}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Action for Ready Orders */}
                      {isReady && (
                        <button
                          onClick={() => handleMarkServed(order._id)}
                          className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 active:scale-95 transition"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Food Picked Up — Mark as Served</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODAL / DRAWER: TABLE ORDER BUILDER */}
      {selectedTable && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 backdrop-blur">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedTable(null)}
                  className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h3 className="text-lg font-black text-white tracking-tight">
                    {selectedTable.name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {selectedTable.section} • Waiter: <span className="text-amber-400 font-bold">{user?.name}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTable(null)}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Category Filter Pills & Search */}
            <div className="p-4 border-b border-slate-800 space-y-3 bg-slate-950/40">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search Momo, Chowmein, Chiya..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Horizontal Scroll Categories */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                      selectedCategory === cat
                        ? 'bg-amber-500 text-slate-950 shadow'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Menu Dishes List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {filteredMenu.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-sm">
                  No dishes match your search.
                </div>
              ) : (
                filteredMenu.map(dish => {
                  const inCart = orderCart[dish._id];
                  const qty = inCart ? inCart.qty : 0;

                  return (
                    <div
                      key={dish._id}
                      className={`p-3 rounded-2xl border transition flex flex-col gap-2 ${
                        qty > 0
                          ? 'bg-slate-800/80 border-amber-500/50'
                          : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={dish.image}
                          alt={dish.name}
                          className="w-16 h-16 rounded-xl object-cover bg-slate-800 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-white truncate">
                              {dish.name}
                            </h4>
                            {!dish.inStock && (
                              <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 text-[10px] font-bold uppercase">
                                Out
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-black text-amber-400 mt-0.5">
                            {formatNPR(dish.price)}
                          </p>
                          <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                            {dish.description}
                          </p>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {qty > 0 ? (
                            <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-xl p-1">
                              <button
                                onClick={() => handleRemoveFromCart(dish._id)}
                                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center active:scale-95 transition"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="w-6 text-center font-black text-sm text-white">
                                {qty}
                              </span>
                              <button
                                onClick={() => handleAddToCart(dish)}
                                className="w-7 h-7 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center justify-center active:scale-95 transition"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleAddToCart(dish)}
                              disabled={!dish.inStock}
                              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 text-xs font-bold transition active:scale-95 disabled:opacity-40"
                            >
                              + Add
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Item specific notes input if in cart */}
                      {qty > 0 && (
                        <div className="pt-2 border-t border-slate-800/80">
                          <input
                            type="text"
                            placeholder="Special note (e.g. no onion, extra spicy)..."
                            value={inCart?.notes || ''}
                            onChange={(e) => handleItemNotesChange(dish._id, e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer / Order Summary */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-3">
              {/* Optional general kitchen note */}
              <div>
                <input
                  type="text"
                  placeholder="Order note for kitchen (optional)..."
                  value={specialOrderNotes}
                  onChange={(e) => setSpecialOrderNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Total & Submit Button */}
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                    {cartItemsCount} item{cartItemsCount !== 1 ? 's' : ''} in order
                  </p>
                  <p className="text-xl font-black text-amber-400">
                    {formatNPR(cartTotalNPR)}
                  </p>
                </div>

                <button
                  onClick={handleSubmitOrder}
                  disabled={cartItemsCount === 0 || submittingOrder}
                  className="flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-600 via-orange-500 to-red-500 hover:from-amber-500 hover:to-orange-400 text-slate-950 font-black text-sm shadow-xl shadow-orange-500/25 flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-40"
                >
                  <Send className="w-4 h-4" />
                  <span>{submittingOrder ? 'Sending to Kitchen...' : 'Send Order to Kitchen'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WaiterView;
