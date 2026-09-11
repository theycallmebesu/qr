import React, { useState, useEffect, useContext } from 'react';
import { ChefHat, CheckCircle2, Clock, AlertTriangle, Sparkles, RefreshCw } from 'lucide-react';
import StaffHeader from '../../components/StaffHeader';
import { SocketContext } from '../../context/SocketContext';
import { formatNPR } from '../../utils/currency';
import api from '../../api';

const KitchenView = () => {
  const { socket } = useContext(SocketContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState({});

  const fetchKitchenQueue = async () => {
    try {
      setLoading(true);
      const res = await api.get('/orders/kitchen/queue');
      setOrders(res.data);
    } catch (err) {
      console.error('Failed to fetch kitchen orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKitchenQueue();
  }, []);

  // Real-time socket events
  useEffect(() => {
    if (!socket) return;

    const handleNewOrder = (newOrder) => {
      setOrders((prev) => {
        if (prev.some((o) => o._id === newOrder._id)) return prev;
        return [...prev, newOrder];
      });
    };

    const handleStatusUpdate = (updatedOrder) => {
      if (updatedOrder.status === 'Ready' || updatedOrder.status === 'Served' || updatedOrder.status === 'Completed' || updatedOrder.status === 'Cancelled') {
        // Remove from live kitchen queue
        setOrders((prev) => prev.filter((o) => o._id !== updatedOrder._id));
      } else {
        setOrders((prev) =>
          prev.map((o) => (o._id === updatedOrder._id ? updatedOrder : o))
        );
      }
    };

    socket.on('order:new', handleNewOrder);
    socket.on('order:status_update', handleStatusUpdate);

    return () => {
      socket.off('order:new', handleNewOrder);
      socket.off('order:status_update', handleStatusUpdate);
    };
  }, [socket]);

  // One Action: Mark Order READY
  const handleMarkReady = async (orderId) => {
    try {
      setActionInProgress((prev) => ({ ...prev, [orderId]: true }));
      await api.patch(`/orders/${orderId}/ready`);
      // Optimistically remove from queue
      setOrders((prev) => prev.filter((o) => o._id !== orderId));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to mark order as Ready');
    } finally {
      setActionInProgress((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  const getElapsedTime = (placedAt) => {
    if (!placedAt) return 'Just now';
    const mins = Math.floor((new Date() - new Date(placedAt)) / 60000);
    if (mins <= 0) return 'Just now';
    return `${mins}m ago`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans pb-16">
      <StaffHeader />

      <main className="max-w-7xl mx-auto w-full p-4 sm:p-6 flex-1">
        {/* Top Header */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Live Kitchen Order Queue
              </h1>
              <p className="text-xs text-slate-400">
                Incoming food orders • Mark "Ready" to instantly notify waiter
              </p>
            </div>
          </div>

          <button
            onClick={fetchKitchenQueue}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold transition active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* Live Orders Grid */}
        {loading ? (
          <div className="text-center py-24 text-slate-500 text-sm">
            Loading kitchen tickets...
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/60 border border-slate-800/80 rounded-3xl p-8 max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white">All Caught Up!</h3>
            <p className="text-xs text-slate-400 mt-1">
              There are no pending tickets in the kitchen. New waiter orders will appear here in real-time with instant alerts.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {orders.map((order) => {
              const isUrgent = Math.floor((new Date() - new Date(order.placedAt || order.sentAt)) / 60000) > 15;
              const isProcessing = actionInProgress[order._id];

              return (
                <div
                  key={order._id}
                  className={`rounded-3xl border bg-slate-900 overflow-hidden shadow-xl flex flex-col justify-between transition hover:border-slate-700 ${
                    isUrgent
                      ? 'border-rose-500/50 shadow-rose-500/10'
                      : 'border-slate-800'
                  }`}
                >
                  {/* Card Header: Table # & Waiter & Timer */}
                  <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-black text-sm uppercase tracking-wide">
                            {order.tableName || `Table ${order.tableNumber}`}
                          </span>
                          <span className="text-xs font-mono text-slate-400">
                            #{order.orderNumber}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 font-semibold mt-1.5">
                          Waiter: <span className="text-amber-400 font-bold">{order.waiterName || 'Staff'}</span>
                        </p>
                      </div>

                      {/* Elapsed Timer */}
                      <div
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                          isUrgent
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>{getElapsedTime(order.placedAt || order.sentAt)}</span>
                      </div>
                    </div>

                    {/* General Order Instructions */}
                    {order.specialInstructions && (
                      <div className="mt-3 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 flex items-start gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400 mt-0.5" />
                        <span><strong>Table Note:</strong> {order.specialInstructions}</span>
                      </div>
                    )}
                  </div>

                  {/* Card Body: Items List */}
                  <div className="p-4 sm:p-5 flex-1 space-y-3">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Items ({order.items?.length || 0}):
                    </p>
                    <div className="space-y-2.5">
                      {order.items?.map((it, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-start justify-between gap-3"
                        >
                          <div className="flex items-start gap-3">
                            <span className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 font-black text-sm flex items-center justify-center shrink-0">
                              {it.qty}x
                            </span>
                            <div>
                              <p className="text-sm font-bold text-white leading-tight">
                                {it.name}
                              </p>
                              {/* Special Item Notes */}
                              {it.notes && (
                                <p className="text-xs text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md inline-block mt-1 font-semibold">
                                  ⚠️ {it.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Card Footer: ONE ACTION BUTTON -> MARK READY */}
                  <div className="p-4 bg-slate-950 border-t border-slate-800">
                    <button
                      onClick={() => handleMarkReady(order._id)}
                      disabled={isProcessing}
                      className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-base shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      <span>{isProcessing ? 'Notifying Waiter...' : 'MARK READY'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default KitchenView;
