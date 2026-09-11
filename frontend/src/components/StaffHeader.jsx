import React, { useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Flame, LogOut, Volume2, VolumeX, Wifi, WifiOff, Shield, Users, ChefHat, Receipt } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';

const StaffHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useContext(AuthContext);
  const { connected, soundEnabled, setSoundEnabled } = useContext(SocketContext);

  if (!user) return null;

  const roleColors = {
    admin: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    waiter: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
    kitchen: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    reception: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
  };

  const roleLabels = {
    admin: 'Admin',
    waiter: 'Floor Waiter',
    kitchen: 'Kitchen Chef',
    reception: 'Reception Cashier'
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Left: Brand logo & station */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 via-orange-500 to-red-500 p-0.5 shadow-md shadow-orange-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Flame className="w-5 h-5 text-amber-500 fill-amber-500" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black text-white tracking-tight">
                Himalayan<span className="text-amber-500">POS</span>
              </span>
              <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-md border ${roleColors[user.role] || roleColors.waiter}`}>
                {roleLabels[user.role] || user.role}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate max-w-[140px] sm:max-w-xs">
              {user.name}
            </p>
          </div>
        </div>

        {/* Center: Admin Quick View Switcher (for effortless evaluation) */}
        {user.role === 'admin' && (
          <nav className="hidden md:flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs font-bold">
            {[
              { path: '/admin', label: 'Admin', icon: Shield },
              { path: '/waiter', label: 'Waiter', icon: Users },
              { path: '/kitchen', label: 'Kitchen', icon: ChefHat },
              { path: '/reception', label: 'Reception', icon: Receipt }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = location.pathname === tab.path;
              return (
                <button
                  key={tab.path}
                  onClick={() => navigate(tab.path)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        )}

        {/* Right Actions: Live socket badge, sound toggle & logout */}
        <div className="flex items-center gap-2">
          {/* Socket status badge */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
              connected
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
            }`}
            title={connected ? 'Real-time Socket.IO Connected' : 'Socket Reconnecting...'}
          >
            {connected ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="hidden sm:inline">Live</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span className="hidden sm:inline">Offline</span>
              </>
            )}
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border transition active:scale-95 ${
              soundEnabled
                ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700'
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
            title={soundEnabled ? 'Alert Sounds On' : 'Alert Sounds Muted'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:text-rose-300 text-xs font-bold transition active:scale-95"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default StaffHeader;
