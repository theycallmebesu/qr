import React, { useContext } from 'react';
import { SocketContext } from '../context/SocketContext';
import { Bell, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

const LiveAlertToast = () => {
  const { liveAlert, clearAlert } = useContext(SocketContext);

  if (!liveAlert) return null;

  const isReady = liveAlert.type === 'ready';
  const isWarning = liveAlert.type === 'warning';

  return (
    <div className="fixed top-20 right-4 z-50 max-w-md w-full animate-bounce-short">
      <div className={`p-4 rounded-2xl shadow-2xl border backdrop-blur-xl flex items-start space-x-3.5 ${
        isReady 
          ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-100 shadow-emerald-900/30' 
          : isWarning 
            ? 'bg-red-950/90 border-red-500/40 text-red-100 shadow-red-900/30'
            : 'bg-slate-900/90 border-amber-500/40 text-slate-100 shadow-amber-900/20'
      }`}>
        <div className={`p-2 rounded-xl flex-shrink-0 ${
          isReady ? 'bg-emerald-500/20 text-emerald-400' : isWarning ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
        }`}>
          {isReady ? <CheckCircle2 className="w-6 h-6 animate-pulse" /> : isWarning ? <AlertTriangle className="w-6 h-6" /> : <Bell className="w-6 h-6" />}
        </div>

        <div className="flex-1 pr-2">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm tracking-tight">{liveAlert.title}</h4>
            <span className="text-[10px] text-slate-400 font-mono">Just now</span>
          </div>
          <p className="text-xs text-slate-300 mt-1">{liveAlert.message}</p>
        </div>

        <button 
          onClick={clearAlert}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default LiveAlertToast;
