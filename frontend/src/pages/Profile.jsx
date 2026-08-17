import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LogOut, ChevronRight, User } from 'lucide-react';

const Profile = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen p-4 sm:p-8 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Your Profile</h1>
        <button onClick={handleLogout} className="flex items-center text-red-400 hover:text-red-300 transition-colors">
          <LogOut size={18} className="mr-2" />
          Logout
        </button>
      </div>

      <div className="glass-panel rounded-2xl p-6 sm:p-8 mb-8">
        <div className="flex items-center space-x-6">
          <div className="h-24 w-24 rounded-full bg-slate-700 overflow-hidden border-4 border-surface shadow-lg">
            {user?.profileImage ? (
              <img src={user.profileImage} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-textSecondary">
                <User size={40} />
              </div>
            )}
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-white">{user?.name}</h2>
            <p className="text-textSecondary mt-1">{user?.email}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-textSecondary uppercase tracking-wider mb-4">Quick Actions</h3>
        
        <button 
          onClick={() => navigate('/banks')}
          className="w-full glass-panel rounded-xl p-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors group"
        >
          <div className="flex items-center">
            <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center text-primary mr-4 group-hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
            </div>
            <div className="text-left">
              <div className="text-white font-medium text-lg">Make a Payment</div>
              <div className="text-sm text-textSecondary">View banks and scan QR</div>
            </div>
          </div>
          <ChevronRight className="text-textSecondary group-hover:text-white transition-colors" />
        </button>
      </div>
    </div>
  );
};

export default Profile;
