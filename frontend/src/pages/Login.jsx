import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
  UtensilsCrossed, 
  ChefHat, 
  UserCheck, 
  BarChart3, 
  Shield, 
  ArrowRight, 
  Lock, 
  User, 
  Sparkles,
  Zap,
  Briefcase
} from 'lucide-react';

const Login = () => {
  const { login, quickLogin } = useContext(AuthContext);
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(username, password);
      navigate(`/${data.user.role}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (role) => {
    setError('');
    setLoading(true);
    try {
      const data = await quickLogin(role);
      navigate(`/${data.user.role}`);
    } catch (err) {
      setError(err.response?.data?.message || `Failed to sign in as ${role}`);
    } finally {
      setLoading(false);
    }
  };

  const demoRoles = [
    {
      role: 'waiter',
      position: 'Floor Waiter',
      title: 'Waiter Staff',
      desc: 'Table floor plan, live order taking, notify food ready & bill checkout',
      icon: <UserCheck className="w-5 h-5 text-cyan-400" />,
      username: 'waiter',
      border: 'hover:border-cyan-500/50 hover:bg-cyan-500/5',
      badge: 'bg-cyan-500/20 text-cyan-300'
    },
    {
      role: 'chef',
      position: 'Chief (Head Chef)',
      title: 'Kitchen Chief',
      desc: 'Real-time Kitchen Display (KDS), ticket workflow, item out-of-stock toggle',
      icon: <ChefHat className="w-5 h-5 text-amber-400" />,
      username: 'chef',
      border: 'hover:border-amber-500/50 hover:bg-amber-500/5',
      badge: 'bg-amber-500/20 text-amber-300'
    },
    {
      role: 'owner',
      position: 'Restaurant Owner',
      title: 'Restaurant Owner',
      desc: 'Sales reports, revenue analytics, staff performance & order overrides',
      icon: <BarChart3 className="w-5 h-5 text-emerald-400" />,
      username: 'owner',
      border: 'hover:border-emerald-500/50 hover:bg-emerald-500/5',
      badge: 'bg-emerald-500/20 text-emerald-300'
    },
    {
      role: 'admin',
      position: 'System Administrator',
      title: 'System Admin',
      desc: 'Staff roster & positions, activity logs, menu catalog & dining tables',
      icon: <Shield className="w-5 h-5 text-indigo-400" />,
      username: 'admin',
      border: 'hover:border-indigo-500/50 hover:bg-indigo-500/5',
      badge: 'bg-indigo-500/20 text-indigo-300'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Decorative Gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 shadow-xl shadow-orange-600/25 mb-4 animate-pulse">
          <UtensilsCrossed className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
          SavorFlow OS
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Real-Time Restaurant Operations & Role-Based Management System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-4xl z-10 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Quick Demo 1-Click Login Cards */}
          <div className="lg:col-span-7 space-y-3 order-2 lg:order-1">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
                <Zap className="w-4 h-4" />
                <span>1-Click Fast Role Sign-In</span>
              </div>
              <span className="text-[11px] text-slate-500">Instant Access for Testing</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {demoRoles.map((item) => (
                <button
                  key={item.role}
                  type="button"
                  disabled={loading}
                  onClick={() => handleQuickLogin(item.role)}
                  className={`text-left p-4 rounded-xl bg-slate-900/80 border border-slate-800 transition-all duration-200 group flex flex-col justify-between ${item.border}`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-2 rounded-lg bg-slate-800 border border-slate-700">
                        {item.icon}
                      </div>
                      <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${item.badge}`}>
                        {item.position}
                      </span>
                    </div>
                    <h3 className="font-semibold text-sm text-slate-100 group-hover:text-amber-400 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 group-hover:text-slate-200">
                    <span className="font-mono text-[11px] text-amber-400/90 font-medium">User: @{item.username}</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Standard Credentials Login Form */}
          <div className="lg:col-span-5 order-1 lg:order-2">
            <div className="bg-slate-900/90 border border-slate-800 py-8 px-6 sm:px-8 rounded-2xl shadow-xl backdrop-blur-xl">
              <h2 className="text-base font-bold text-slate-200 mb-1">Staff Portal Login</h2>
              <p className="text-xs text-slate-400 mb-6">Enter your username / name and password</p>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center space-x-2">
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Staff Username or Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. waiter, chef, admin, owner"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-semibold text-xs shadow-lg shadow-orange-600/20 transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Enter Restaurant OS</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 pt-4 border-t border-slate-800 text-center">
                <span className="text-[11px] text-slate-500">
                  Default passwords: <span className="font-mono text-slate-400">admin123 / owner123 / waiter123 / chef123</span>
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;
