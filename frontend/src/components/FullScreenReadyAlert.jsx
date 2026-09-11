import React from 'react';
import { Bell, CheckCircle, Flame, X, Sparkles } from 'lucide-react';
import { formatNPR } from '../utils/currency';
import api from '../api';

const FullScreenReadyAlert = ({ alert, onDismiss, onMarkServed }) => {
  if (!alert) return null;

  const handleMarkServed = async () => {
    try {
      if (alert.orderId) {
        await api.patch(`/orders/${alert.orderId}/served`);
      }
      if (onMarkServed) onMarkServed(alert.orderId);
      onDismiss();
    } catch (err) {
      console.error('Failed to mark served:', err);
      onDismiss();
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex flex-col items-center justify-between p-6 animate-in fade-in zoom-in-95 duration-200">
      {/* Top Dismiss Button */}
      <div className="w-full max-w-md flex items-center justify-between pt-2">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold uppercase tracking-wider animate-pulse">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Kitchen Notification</span>
        </div>
        <button
          onClick={onDismiss}
          className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition active:scale-95"
          title="Dismiss Alert"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Main Alert Card */}
      <div className="w-full max-w-md my-auto text-center space-y-6">
        {/* Pulsing Bell Icon */}
        <div className="relative mx-auto w-24 h-24 sm:w-28 sm:h-28">
          <div className="absolute inset-0 rounded-full bg-emerald-500/30 animate-ping" />
          <div className="relative w-full h-full rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 p-1 shadow-2xl shadow-emerald-500/50 flex items-center justify-center">
            <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center">
              <Bell className="w-12 h-12 sm:w-14 sm:h-14 text-emerald-400 animate-bounce" />
            </div>
          </div>
        </div>

        {/* Big Alert Heading */}
        <div className="space-y-2">
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            FOOD IS <span className="text-emerald-400">READY!</span>
          </h2>
          <div className="inline-block px-4 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
            <p className="text-lg sm:text-xl font-extrabold text-white">
              {alert.tableName || `Table ${alert.tableNumber}`}
            </p>
            <p className="text-xs font-medium text-emerald-300">
              Order #{alert.orderNumber}
            </p>
          </div>
        </div>

        {/* Ready Dishes Checklist */}
        {alert.items && alert.items.length > 0 && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 text-left max-h-48 overflow-y-auto space-y-2">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Dishes to pick up from kitchen:
            </p>
            {alert.items.map((it, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-sm py-1 border-b border-slate-800/60 last:border-0"
              >
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center">
                    {it.qty}x
                  </span>
                  <span className="text-white font-medium">{it.name}</span>
                </div>
                {it.notes && (
                  <span className="text-[11px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                    {it.notes}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="w-full max-w-md space-y-3 pb-4">
        <button
          onClick={handleMarkServed}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-lg shadow-xl shadow-emerald-600/40 flex items-center justify-center gap-3 transition transform active:scale-95"
        >
          <CheckCircle className="w-6 h-6" />
          <span>Pick Up & Mark Served</span>
        </button>

        <button
          onClick={onDismiss}
          className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-sm transition"
        >
          Acknowledge / Dismiss Alert
        </button>
      </div>
    </div>
  );
};

export default FullScreenReadyAlert;
