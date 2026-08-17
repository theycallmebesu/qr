import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ChevronLeft, Search, Building2, ShieldCheck, LogOut } from 'lucide-react';
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

  const filteredBanks = banks.filter(bank => 
    bank.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen p-4 sm:p-8 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div className="flex items-center space-x-4">
          {user?.profileImage && (
            <img
              src={user.profileImage}
              alt={user.name}
              className="w-14 h-14 rounded-full object-cover border-2 border-primary shadow-lg shadow-primary/20 shrink-0"
            />
          )}
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Individual Payment Portal
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              {user?.name ? `${user.name}'s Banks` : 'Available Banks'}
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
          {user?.role === 'admin' && (
            <button
              onClick={() => navigate('/admin')}
              className="py-2 px-3.5 bg-gradient-to-r from-purple-600 to-secondary text-white font-medium rounded-xl shadow-lg hover:shadow-secondary/20 transition-all flex items-center space-x-2 text-xs sm:text-sm"
            >
              <ShieldCheck size={16} />
              <span>Admin Panel</span>
            </button>
          )}

          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="p-2.5 text-textSecondary hover:text-red-400 bg-surface/50 rounded-xl hover:bg-red-500/10 transition-colors"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Admin Notice Banner */}
      {user?.role === 'admin' && (
        <div className="mb-6 p-4 glass-panel border-purple-500/30 rounded-2xl flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ShieldCheck size={20} className="text-secondary shrink-0" />
            <span className="text-sm text-textSecondary">
              Logged in as <strong className="text-white">{user.email}</strong> (Admin). You can edit bank details and QR codes in the Admin Panel.
            </span>
          </div>
          <button
            onClick={() => navigate('/admin')}
            className="text-xs font-semibold text-secondary hover:underline ml-3 shrink-0"
          >
            Manage Banks →
          </button>
        </div>
      )}

      {/* Search Input */}
      <div className="relative mb-8">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-textSecondary">
          <Search size={20} />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search banks by name..."
          className="w-full pl-12 pr-4 py-4 rounded-xl bg-surface border border-white/10 text-white placeholder:text-textSecondary focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-lg"
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBanks.map(bank => (
            <button
              key={bank._id}
              onClick={() => navigate(`/banks/${bank._id}`)}
              className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center text-center hover:bg-slate-800/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-primary/20 group"
            >
              <div className="h-16 w-16 mb-4 rounded-full bg-white flex items-center justify-center overflow-hidden shadow-inner p-2 group-hover:scale-110 transition-transform duration-300">
                {bank.logoUrl ? (
                  <img src={bank.logoUrl} alt={bank.name} className="max-h-full max-w-full object-contain" />
                ) : (
                  <Building2 size={32} className="text-slate-800" />
                )}
              </div>
              <h3 className="text-lg font-semibold text-white">{bank.name}</h3>
              {bank.accountName && (
                <p className="text-xs text-textSecondary mt-1">{bank.accountName}</p>
              )}
            </button>
          ))}
          {filteredBanks.length === 0 && (
            <div className="col-span-full text-center py-12 text-textSecondary">
              No banks found matching "{searchQuery}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Banks;
