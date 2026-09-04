import React, { useContext, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import { 
  UtensilsCrossed, 
  ChefHat, 
  UserCheck, 
  BarChart3, 
  Shield, 
  LogOut, 
  Radio, 
  Sparkles,
  RefreshCw,
  ChevronDown
} from 'lucide-react';

const Navbar = () => {
  const { user, logout, quickLogin } = useContext(AuthContext);
  const { connected } = useContext(SocketContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [switching, setSwitching] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleRoleSwitch = async (role) => {
    try {
      setSwitching(true);
      setDropdownOpen(false);
      await quickLogin(role);
      navigate(`/${role}`);
    } catch (e) {
      console.error(e);
    } finally {
      setSwitching(false);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'chef':
        return {
          bg: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
          icon: <ChefHat className="w-3.5 h-3.5 mr-1" />,
          label: 'KITCHEN CHEF'
        };
      case 'waiter':
        return {
          bg: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
          icon: <UserCheck className="w-3.5 h-3.5 mr-1" />,
          label: 'FLOOR WAITER'
        };
      case 'owner':
        return {
          bg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
          icon: <BarChart3 className="w-3.5 h-3.5 mr-1" />,
          label: 'RESTAURANT OWNER'
        };
      case 'admin':
        return {
          bg: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
          icon: <Shield className="w-3.5 h-3.5 mr-1" />,
          label: 'SYSTEM ADMIN'
        };
      default:
        return {
          bg: 'bg-slate-700 text-slate-300 border-slate-600',
          icon: null,
          label: role?.toUpperCase()
        };
    }
  };

  const badge = getRoleBadge(user?.role);

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <Link to={`/${user?.role || 'waiter'}`} className="flex items-center space-x-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:scale-105 transition-transform">
              <UtensilsCrossed className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                SavorFlow
              </span>
              <span className="block text-[10px] uppercase font-semibold tracking-wider text-amber-500 -mt-1">
                Restaurant OS
              </span>
            </div>
          </Link>

          {/* Live Socket indicator */}
          <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-[11px] font-medium">
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
            <span className={connected ? 'text-emerald-400' : 'text-red-400'}>
              {connected ? 'Live Sync' : 'Connecting...'}
            </span>
          </div>
        </div>

        {/* Current Role Badge & Quick Switcher */}
        {user && (
          <div className="flex items-center space-x-3">
            {/* Role Badge */}
            <div className={`hidden md:flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border ${badge.bg}`}>
              {badge.icon}
              {badge.label}
            </div>

            {/* Quick Role Switcher Dropdown (for easy demo testing) */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-200 transition-colors"
                title="Switch role for rapid demo testing"
              >
                <RefreshCw className={`w-3 h-3 text-amber-400 ${switching ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Role Switch:</span>
                <span className="capitalize font-semibold text-amber-400">{user.role}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {dropdownOpen && (
                <div 
                  className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-1.5 z-50 text-xs"
                  onClick={() => setDropdownOpen(false)}
                >
                  <div className="px-3 py-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    Quick Role Switch
                  </div>
                  <button
                    onClick={() => handleRoleSwitch('waiter')}
                    className={`w-full text-left px-3 py-2 flex items-center space-x-2 hover:bg-slate-800 ${user.role === 'waiter' ? 'text-cyan-400 font-bold' : 'text-slate-300'}`}
                  >
                    <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Waiter Floor</span>
                  </button>
                  <button
                    onClick={() => handleRoleSwitch('chef')}
                    className={`w-full text-left px-3 py-2 flex items-center space-x-2 hover:bg-slate-800 ${user.role === 'chef' ? 'text-amber-400 font-bold' : 'text-slate-300'}`}
                  >
                    <ChefHat className="w-3.5 h-3.5 text-amber-400" />
                    <span>Kitchen Chef (KDS)</span>
                  </button>
                  <button
                    onClick={() => handleRoleSwitch('owner')}
                    className={`w-full text-left px-3 py-2 flex items-center space-x-2 hover:bg-slate-800 ${user.role === 'owner' ? 'text-emerald-400 font-bold' : 'text-slate-300'}`}
                  >
                    <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Restaurant Owner</span>
                  </button>
                  <button
                    onClick={() => handleRoleSwitch('admin')}
                    className={`w-full text-left px-3 py-2 flex items-center space-x-2 hover:bg-slate-800 ${user.role === 'admin' ? 'text-indigo-400 font-bold' : 'text-slate-300'}`}
                  >
                    <Shield className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Admin Control</span>
                  </button>
                </div>
              )}
            </div>

            {/* User details & logout */}
            <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
              <div className="hidden lg:block text-right">
                <div className="text-xs font-semibold text-slate-200">{user.name}</div>
                <div className="text-[10px] text-amber-400 font-medium">{user.position || user.role}</div>
              </div>
              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
