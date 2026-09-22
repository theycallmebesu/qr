import React from 'react';
import { Shield, ShieldCheck, LogOut, Plus, Tags, RefreshCw, Database } from 'lucide-react';

interface HeaderProps {
  isAdmin: boolean;
  onOpenAdminLogin: () => void;
  onLogout: () => void;
  onOpenAddItem: () => void;
  onOpenTagManager: () => void;
  onOpenServerSettings: () => void;
  onRefresh: () => void;
  isLoading: boolean;
  backendConnected: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  isAdmin,
  onOpenAdminLogin,
  onLogout,
  onOpenAddItem,
  onOpenTagManager,
  onRefresh,
  isLoading,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-red-600 via-red-600 to-red-700 text-white shadow-lg border-b-2 border-red-800">
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white text-red-600 flex items-center justify-center font-bold shadow-md ring-2 ring-red-200/50">
              <span className="text-xl">🕉️</span>
            </div>
            <div>
              <h1 className="font-extrabold text-lg sm:text-xl tracking-tight leading-tight flex items-center gap-1.5 text-white">
                <span>श्री पशुपतिनाथ हार्डवेयर</span>
              </h1>
              <p className="text-xs text-red-100 font-medium tracking-wide">
                Shree Pashupatinath Hardware • Price List
              </p>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-1.5">
            {/* MongoDB / Server Settings Button */}
            <button
              onClick={onOpenServerSettings}
              title={backendConnected ? "MongoDB Atlas Connected" : "Configure MongoDB Backend URL"}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition flex items-center gap-1"
            >
              <Database className="w-4 h-4 text-emerald-300" />
            </button>

            {/* Refresh Button */}
            <button
              onClick={onRefresh}
              title="Refresh price list from MongoDB"
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 active:bg-white/30 text-white transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            {isAdmin ? (
              <div className="flex items-center gap-1.5">
                {/* Add Item Quick Button */}
                <button
                  onClick={onOpenAddItem}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white text-red-700 hover:bg-red-50 text-xs font-bold shadow-sm transition"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Add Item</span>
                </button>

                {/* Tag Manager Button */}
                <button
                  onClick={onOpenTagManager}
                  title="Manage Tags"
                  className="p-2 rounded-lg bg-white/15 hover:bg-white/25 text-white transition"
                >
                  <Tags className="w-4 h-4" />
                </button>

                {/* Logout Button */}
                <button
                  onClick={onLogout}
                  title="Exit Admin"
                  className="p-2 rounded-lg bg-red-950/40 hover:bg-red-950/60 text-red-200 hover:text-white transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* Admin Panel Entry Button (Top Right) */
              <button
                onClick={onOpenAdminLogin}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 active:bg-white/30 text-white text-xs font-semibold backdrop-blur-sm border border-white/20 transition-all shadow-sm"
              >
                <Shield className="w-3.5 h-3.5 text-red-200" />
                <span>Admin</span>
              </button>
            )}
          </div>
        </div>

        {/* Admin Mode Status Banner */}
        {isAdmin && (
          <div className="mt-2.5 pt-2 border-t border-red-500/60 flex items-center justify-between text-xs text-red-100">
            <div className="flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span className="bg-white/20 px-2 py-0.5 rounded-full font-semibold text-white">
                Admin Mode Active
              </span>
            </div>
            <span className="text-[11px] text-red-200">You can add, edit prices & remove items</span>
          </div>
        )}

      </div>
    </header>
  );
};
