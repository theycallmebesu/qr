import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, Lock, User, ArrowRight, Shield, Users, ChefHat, Receipt, AlertCircle } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { user, login, sessionExpiredMsg, clearSessionExpiredMsg } = useContext(AuthContext);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // If already authenticated, redirect to appropriate role screen
  useEffect(() => {
    if (user && user.role) {
      navigate(`/${user.role}`);
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Please enter both username and password.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      if (clearSessionExpiredMsg) clearSessionExpiredMsg();
      const res = await login(username.trim(), password);
      const role = res.role || res.user?.role || 'waiter';
      navigate(`/${role}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = (u, p) => {
    setUsername(u);
    setPassword(p);
    setError('');
    if (clearSessionExpiredMsg) clearSessionExpiredMsg();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 font-sans">
      {/* Top Header */}
      <header className="max-w-md w-full mx-auto flex items-center justify-between py-2">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-600 via-orange-500 to-red-500 p-0.5 shadow-lg shadow-orange-500/30 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Flame className="w-5 h-5 text-amber-500 fill-amber-500" />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white">
              Himalayan<span className="text-amber-500">POS</span>
            </h1>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Nepali Restaurant Management
            </p>
          </div>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="max-w-md w-full mx-auto my-auto py-6">
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-black text-white tracking-tight">Staff Sign In</h2>
            <p className="text-xs text-slate-400 mt-1">
              Sign in with your assigned username and password
            </p>
          </div>

          {/* Session Expired Banner */}
          {sessionExpiredMsg && (
            <div className="mb-4 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{sessionExpiredMsg}</span>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="mb-4 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Username + Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. sita, admin, kitchen"
                  autoComplete="username"
                  autoCapitalize="none"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Station'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Credentials Fill Section */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center mb-3">
              1-Tap Demo Credentials:
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { role: 'Admin', user: 'admin', pass: 'admin123', icon: Shield, color: 'text-amber-400 hover:border-amber-500/50' },
                { role: 'Waiter', user: 'sita', pass: 'waiter123', icon: Users, color: 'text-sky-400 hover:border-sky-500/50' },
                { role: 'Kitchen', user: 'kitchen', pass: 'kitchen123', icon: ChefHat, color: 'text-emerald-400 hover:border-emerald-500/50' },
                { role: 'Reception', user: 'reception', pass: 'reception123', icon: Receipt, color: 'text-purple-400 hover:border-purple-500/50' }
              ].map(demo => {
                const Icon = demo.icon;
                return (
                  <button
                    key={demo.role}
                    type="button"
                    onClick={() => handleDemoFill(demo.user, demo.pass)}
                    className={`p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-left transition ${demo.color} active:scale-95`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold">
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span>{demo.role}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      user: <span className="text-white font-mono">{demo.user}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-500 py-3">
        Mobile-First Nepali Restaurant Management System • Handcrafted for Speed
      </footer>
    </div>
  );
};

export default Login;
