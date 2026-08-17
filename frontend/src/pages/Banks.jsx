import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ChevronLeft, Search, Building2, ShieldCheck, LogOut, User as UserIcon, QrCode, CreditCard, Mail, Key } from 'lucide-react';
import api from '../api';

const Banks = () => {
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBanks = async () => {
      try {
        const res = await api.get('/banks');
        setBanks(res.data);
      } catch (err) {
        console.error('Error fetching banks', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBanks();
  }, []);

  // Filter banks assigned to logged-in user (or all banks if admin)
  const displayBanks = banks.filter(b => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    const bankUserId = b.userId?._id || b.userId;
    return bankUserId && bankUserId.toString() === user.id.toString();
  });

  const filteredDisplayBanks = displayBanks.filter(bank => 
    bank.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (bank.accountName && bank.accountName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen p-4 sm:p-8 max-w-4xl mx-auto space-y-6">
      {/* Top Navigation & Actions */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
            Personal Bank Account Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
            Welcome, {user?.name || 'User'} 👋
          </h1>
        </div>

        <div className="flex items-center space-x-3">
          {user?.role === 'admin' && (
            <button
              onClick={() => navigate('/admin')}
              className="py-2.5 px-4 bg-gradient-to-r from-purple-600 to-secondary text-white font-medium rounded-xl shadow-lg hover:shadow-secondary/20 transition-all flex items-center space-x-2 text-xs sm:text-sm"
            >
              <ShieldCheck size={16} />
              <span>Admin Panel</span>
            </button>
          )}

          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="p-2.5 text-textSecondary hover:text-red-400 bg-surface/50 rounded-xl hover:bg-red-500/10 transition-colors flex items-center space-x-1.5 text-xs font-semibold"
            title="Logout"
          >
            <LogOut size={18} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>

      {/* User Details & Profile Card */}
      {user && (
        <div className="glass-panel p-6 rounded-2xl border border-white/10 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-12 -mt-12 w-40 h-40 rounded-full bg-primary/10 blur-3xl pointer-events-none"></div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6 relative z-10">
            <div className="h-20 w-20 rounded-full overflow-hidden border-2 border-primary shadow-md shadow-primary/30 shrink-0 bg-slate-800 flex items-center justify-center">
              {user.profileImage ? (
                <img src={user.profileImage} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                <UserIcon size={36} className="text-primary" />
              )}
            </div>

            <div className="flex-1 space-y-1">
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-white">{user.name}</h2>
                <span className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full ${
                  user.role === 'admin' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : 'bg-green-500/20 text-green-300 border border-green-500/40'
                }`}>
                  {user.role || 'User'}
                </span>
              </div>

              <div className="flex flex-wrap gap-y-1 gap-x-4 text-xs text-textSecondary pt-1">
                <div className="flex items-center space-x-1.5">
                  <Mail size={14} className="text-primary" />
                  <span>{user.email}</span>
                </div>
                {user.plainPassword && (
                  <div className="flex items-center space-x-1.5">
                    <Key size={14} className="text-yellow-400" />
                    <span>Password: <strong className="text-white font-mono">{user.plainPassword}</strong></span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Notice Banner */}
      {user?.role === 'admin' && (
        <div className="p-4 glass-panel border-purple-500/30 rounded-2xl flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ShieldCheck size={20} className="text-secondary shrink-0" />
            <span className="text-sm text-textSecondary">
              Logged in as <strong className="text-white">{user.email}</strong> (Admin). Manage banks, users, and edit admin credentials.
            </span>
          </div>
          <button
            onClick={() => navigate('/admin')}
            className="text-xs font-semibold text-secondary hover:underline ml-3 shrink-0"
          >
            Manage Admin Panel →
          </button>
        </div>
      )}

      {/* Search Bar for Assigned Banks */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-textSecondary">
          <Search size={20} />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search your assigned bank accounts..."
          className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-surface border border-white/10 text-white placeholder:text-textSecondary focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-lg text-sm"
        />
      </div>

      {/* YOUR PERSONAL ASSIGNED BANK ACCOUNTS ONLY */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center space-x-2">
          <CreditCard size={20} className="text-green-400" />
          <h2 className="text-lg font-bold text-white">Your Personal Assigned Bank Accounts</h2>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : filteredDisplayBanks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredDisplayBanks.map(bank => (
              <div
                key={bank._id}
                onClick={() => navigate(`/banks/${bank._id}`)}
                className="glass-panel p-5 rounded-2xl border border-green-500/30 hover:border-green-400/60 bg-gradient-to-br from-slate-900/90 to-green-950/30 hover:to-green-900/40 transition-all cursor-pointer group shadow-lg flex items-center space-x-4"
              >
                <div className="h-14 w-14 rounded-2xl bg-white p-2 shrink-0 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                  {bank.logoUrl ? (
                    <img src={bank.logoUrl} alt={bank.name} className="max-h-full max-w-full object-contain" />
                  ) : (
                    <Building2 size={28} className="text-slate-800" />
                  )}
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-white truncate">{bank.name}</h3>
                    <QrCode size={18} className="text-green-400 shrink-0 group-hover:scale-110 transition-transform" />
                  </div>
                  {bank.accountName && (
                    <p className="text-xs text-textSecondary truncate">A/C: {bank.accountName}</p>
                  )}
                  {bank.accountNumber && (
                    <p className="text-xs font-mono text-green-300 mt-0.5 truncate">#{bank.accountNumber}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-panel p-8 rounded-2xl text-center space-y-2 border border-slate-800">
            <Building2 size={36} className="mx-auto text-slate-500 mb-2" />
            <h3 className="text-base font-bold text-white">No Assigned Bank Accounts Found</h3>
            <p className="text-xs text-textSecondary">
              {searchQuery ? `No assigned bank matching "${searchQuery}"` : "You do not have any personal bank accounts assigned yet. Contact Admin to assign bank accounts to your profile."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Banks;
