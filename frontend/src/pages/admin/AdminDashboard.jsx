import React, { useState, useEffect, useContext } from 'react';
import api from '../../api';
import { SocketContext } from '../../context/SocketContext';
import { 
  Shield, 
  Users, 
  UtensilsCrossed, 
  LayoutGrid, 
  History, 
  Plus, 
  Trash2, 
  KeyRound, 
  ToggleLeft, 
  ToggleRight, 
  Edit, 
  Search, 
  CheckCircle,
  X,
  AlertTriangle
} from 'lucide-react';

const AdminDashboard = () => {
  const { socket } = useContext(SocketContext);

  const [activeTab, setActiveTab] = useState('staff'); // 'staff' | 'menu' | 'tables' | 'logs'
  const [loading, setLoading] = useState(true);

  // Staff state
  const [staffList, setStaffList] = useState([]);
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [newStaff, setNewStaff] = useState({ 
    name: '', 
    username: '', 
    position: 'Floor Waiter', 
    password: '', 
    role: 'waiter', 
    phone: '' 
  });
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetStaffTarget, setResetStaffTarget] = useState(null);
  const [newPasswordVal, setNewPasswordVal] = useState('');

  // Menu state
  const [menuList, setMenuList] = useState([]);
  const [menuModalOpen, setMenuModalOpen] = useState(false);
  const [menuEditTarget, setMenuEditTarget] = useState(null);
  const [menuFormData, setMenuFormData] = useState({
    name: '',
    category: 'Mains',
    price: '',
    description: '',
    inStock: true
  });

  // Table state
  const [tableList, setTableList] = useState([]);
  const [tableModalOpen, setTableModalOpen] = useState(false);
  const [newTable, setNewTable] = useState({ tableNumber: '', capacity: 4, section: 'Main Dining' });

  // Audit Logs state
  const [logsList, setLogsList] = useState([]);
  const [logFilter, setLogFilter] = useState('');

  // Initial data load
  const loadAllAdminData = async () => {
    try {
      setLoading(true);
      const [staffRes, menuRes, tablesRes, logsRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/menu'),
        api.get('/tables'),
        api.get('/admin/logs?limit=100')
      ]);
      setStaffList(staffRes.data);
      setMenuList(menuRes.data);
      setTableList(tablesRes.data);
      setLogsList(logsRes.data);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllAdminData();
  }, []);

  // Socket real-time listeners for admin
  useEffect(() => {
    if (!socket) return;

    socket.on('activity:new', (newLog) => {
      setLogsList((prev) => [newLog, ...prev]);
    });

    socket.on('menu:update', ({ action, item, id }) => {
      setMenuList((prev) => {
        if (action === 'delete') return prev.filter((m) => m._id !== id);
        if (action === 'create') return [...prev, item];
        return prev.map((m) => (m._id === item._id ? item : m));
      });
    });

    socket.on('table:update', ({ action, table, id }) => {
      setTableList((prev) => {
        if (action === 'delete') return prev.filter((t) => t._id !== id);
        if (action === 'create') return [...prev, table].sort((a, b) => a.tableNumber - b.tableNumber);
        return prev.map((t) => (t._id === table._id ? table : t));
      });
    });

    return () => {
      socket.off('activity:new');
      socket.off('menu:update');
      socket.off('table:update');
    };
  }, [socket]);

  // --- STAFF ACTIONS ---
  const handleCreateStaff = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/admin/users', newStaff);
      setStaffList([res.data, ...staffList]);
      setStaffModalOpen(false);
      setNewStaff({ name: '', username: '', position: 'Floor Waiter', password: '', role: 'waiter', phone: '' });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create staff');
    }
  };

  const handleToggleStaffStatus = async (user) => {
    try {
      const res = await api.patch(`/admin/users/${user._id}/toggle-status`);
      setStaffList(staffList.map((u) => (u._id === user._id ? { ...u, active: res.data.active } : u)));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to toggle status');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetStaffTarget) return;
    try {
      await api.patch(`/admin/users/${resetStaffTarget._id}/reset-password`, { newPassword: newPasswordVal });
      alert(`Password successfully updated for ${resetStaffTarget.name}`);
      setResetModalOpen(false);
      setNewPasswordVal('');
      setResetStaffTarget(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reset password');
    }
  };

  const handleDeleteStaff = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove staff member: ${name}?`)) return;
    try {
      await api.delete(`/admin/users/${id}`);
      setStaffList(staffList.filter((u) => u._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete staff');
    }
  };

  // --- MENU ACTIONS ---
  const handleSaveMenuDish = async (e) => {
    e.preventDefault();
    try {
      if (menuEditTarget) {
        const res = await api.put(`/menu/${menuEditTarget._id}`, menuFormData);
        setMenuList(menuList.map((m) => (m._id === menuEditTarget._id ? res.data : m)));
      } else {
        const res = await api.post('/menu', menuFormData);
        setMenuList([...menuList, res.data]);
      }
      setMenuModalOpen(false);
      setMenuEditTarget(null);
      setMenuFormData({ name: '', category: 'Mains', price: '', description: '', inStock: true });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save dish');
    }
  };

  const handleDeleteMenuDish = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete dish: "${name}"?`)) return;
    try {
      await api.delete(`/menu/${id}`);
      setMenuList(menuList.filter((m) => m._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete dish');
    }
  };

  const openEditMenuModal = (dish) => {
    setMenuEditTarget(dish);
    setMenuFormData({
      name: dish.name,
      category: dish.category,
      price: dish.price,
      description: dish.description || '',
      inStock: dish.inStock
    });
    setMenuModalOpen(true);
  };

  // --- TABLE ACTIONS ---
  const handleCreateTable = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/tables', newTable);
      setTableList([...tableList, res.data].sort((a, b) => a.tableNumber - b.tableNumber));
      setTableModalOpen(false);
      setNewTable({ tableNumber: '', capacity: 4, section: 'Main Dining' });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create table');
    }
  };

  const handleDeleteTable = async (id, number) => {
    if (!window.confirm(`Delete Table #${number}?`)) return;
    try {
      await api.delete(`/tables/${id}`);
      setTableList(tableList.filter((t) => t._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete table');
    }
  };

  const filteredLogs = logsList.filter((l) => {
    if (!logFilter) return true;
    return (
      l.actionType?.toLowerCase().includes(logFilter.toLowerCase()) ||
      l.userName?.toLowerCase().includes(logFilter.toLowerCase()) ||
      l.details?.toLowerCase().includes(logFilter.toLowerCase())
    );
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center space-x-2">
            <span>System Administration & Audit</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 font-semibold uppercase tracking-wider">
              Admin Portal
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure staff credentials, manage live menu catalog, floor dining tables, and audit logs.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-800 p-1 rounded-xl">
          {[
            { id: 'staff', label: 'Staff Accounts', icon: <Users className="w-3.5 h-3.5" /> },
            { id: 'menu', label: 'Menu Catalog', icon: <UtensilsCrossed className="w-3.5 h-3.5" /> },
            { id: 'tables', label: 'Dining Tables', icon: <LayoutGrid className="w-3.5 h-3.5" /> },
            { id: 'logs', label: 'Audit Logs', icon: <History className="w-3.5 h-3.5" /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: STAFF MANAGEMENT */}
      {activeTab === 'staff' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
            <div>
              <h3 className="text-base font-bold text-white">Staff Roster & Role Permissions</h3>
              <p className="text-xs text-slate-400">Manage user access for Admins, Owners, Waiters, and Chefs</p>
            </div>
            <button
              onClick={() => setStaffModalOpen(true)}
              className="py-2 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Staff Member</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-800">
                <tr>
                  <th className="pb-3">Staff Name</th>
                  <th className="pb-3">Position</th>
                  <th className="pb-3">Username</th>
                  <th className="pb-3">Role</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {staffList.map((user) => (
                  <tr key={user._id} className="hover:bg-slate-950/40">
                    <td className="py-3 font-semibold text-white">{user.name}</td>
                    <td className="py-3 font-medium text-amber-400">{user.position || 'Staff'}</td>
                    <td className="py-3 font-mono text-slate-400">@{user.username}</td>
                    <td className="py-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        user.role === 'admin'
                          ? 'bg-indigo-500/20 text-indigo-400'
                          : user.role === 'owner'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : user.role === 'chef'
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-cyan-500/20 text-cyan-400'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3">
                      <button
                        onClick={() => handleToggleStaffStatus(user)}
                        className={`flex items-center space-x-1 text-xs font-semibold ${
                          user.active !== false ? 'text-emerald-400' : 'text-slate-500'
                        }`}
                      >
                        {user.active !== false ? <ToggleRight className="w-5 h-5 text-emerald-400" /> : <ToggleLeft className="w-5 h-5 text-slate-600" />}
                        <span>{user.active !== false ? 'Active' : 'Disabled'}</span>
                      </button>
                    </td>
                    <td className="py-3 text-right space-x-2">
                      <button
                        onClick={() => {
                          setResetStaffTarget(user);
                          setResetModalOpen(true);
                        }}
                        className="py-1 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-[11px] transition-colors"
                        title="Reset Staff Password"
                      >
                        Reset PW
                      </button>
                      <button
                        onClick={() => handleDeleteStaff(user._id, user.name)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Delete User"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: MENU CATALOG MANAGEMENT */}
      {activeTab === 'menu' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
            <div>
              <h3 className="text-base font-bold text-white">Culinary Menu Dishes & Pricing</h3>
              <p className="text-xs text-slate-400">Add dishes, set prices, update descriptions and availability</p>
            </div>
            <button
              onClick={() => {
                setMenuEditTarget(null);
                setMenuFormData({ name: '', category: 'Mains', price: '', description: '', inStock: true });
                setMenuModalOpen(true);
              }}
              className="py-2 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Dish</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {menuList.map((dish) => (
              <div
                key={dish._id}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-white">{dish.name}</span>
                    <span className="font-mono font-bold text-amber-400 text-sm">
                      ${dish.price.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2">
                    {dish.category}
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {dish.description || 'No description provided.'}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className={`font-bold text-[10px] uppercase px-2 py-0.5 rounded ${
                    dish.inStock ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {dish.inStock ? 'In Stock' : '86 Out'}
                  </span>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => openEditMenuModal(dish)}
                      className="p-1.5 text-slate-400 hover:text-indigo-400 rounded-lg hover:bg-slate-800 transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteMenuDish(dish._id, dish.name)}
                      className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: DINING TABLES LAYOUT */}
      {activeTab === 'tables' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
            <div>
              <h3 className="text-base font-bold text-white">Dining Tables & Seating Configuration</h3>
              <p className="text-xs text-slate-400">Configure floor table numbers, seat capacities, and sections</p>
            </div>
            <button
              onClick={() => setTableModalOpen(true)}
              className="py-2 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Table</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {tableList.map((tbl) => (
              <div
                key={tbl._id}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-black text-white">Table #{tbl.tableNumber}</span>
                    <button
                      onClick={() => handleDeleteTable(tbl._id, tbl.tableNumber)}
                      className="text-slate-600 hover:text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="text-xs text-slate-400">{tbl.capacity} Seats</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{tbl.section}</div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] uppercase font-bold text-slate-400">
                  {tbl.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT LOGS */}
      {activeTab === 'logs' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800 mb-6">
            <div>
              <h3 className="text-base font-bold text-white">System Activity Audit Log</h3>
              <p className="text-xs text-slate-400">Chronological feed of orders placed, kitchen updates, and billing</p>
            </div>
            <div className="w-64">
              <input
                type="text"
                placeholder="Filter by staff, action..."
                value={logFilter}
                onChange={(e) => setLogFilter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
            {filteredLogs.map((log) => (
              <div
                key={log._id}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-start justify-between text-xs hover:border-slate-700 transition-colors"
              >
                <div className="pr-4">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white">{log.userName}</span>
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                      {log.userRole}
                    </span>
                    <span className="font-mono text-[10px] text-indigo-400 font-bold">
                      {log.actionType}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">{log.details}</p>
                </div>
                <span className="text-[10px] font-mono text-slate-500 whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: CREATE STAFF */}
      {staffModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl p-6">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-base font-bold text-white">Create Staff Account</h3>
              <button onClick={() => setStaffModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateStaff} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newStaff.name}
                  onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                  placeholder="e.g. Maria Gonzalez"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Staff Position</label>
                  <input
                    type="text"
                    required
                    value={newStaff.position}
                    onChange={(e) => setNewStaff({ ...newStaff, position: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                    placeholder="e.g. Chief, Floor Waiter, Lead Bartender"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Username (Login ID)</label>
                  <input
                    type="text"
                    required
                    value={newStaff.username}
                    onChange={(e) => setNewStaff({ ...newStaff, username: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                    placeholder="e.g. maria"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Temporary Password</label>
                <input
                  type="password"
                  required
                  value={newStaff.password}
                  onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Assigned Role</label>
                <select
                  value={newStaff.role}
                  onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                >
                  <option value="waiter">Waiter (Worker)</option>
                  <option value="chef">Kitchen Chef</option>
                  <option value="owner">Restaurant Owner</option>
                  <option value="admin">System Admin</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full mt-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-white text-xs shadow-lg shadow-indigo-600/30"
              >
                Confirm & Create User
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RESET PASSWORD */}
      {resetModalOpen && resetStaffTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-2xl shadow-2xl p-6">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-base font-bold text-white">Reset Password</h3>
              <button onClick={() => setResetModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleResetPassword} className="space-y-3 text-xs">
              <p className="text-slate-400">
                Setting new password for <span className="font-bold text-white">{resetStaffTarget.name}</span>
              </p>
              <div>
                <label className="block text-slate-300 font-medium mb-1">New Password (min 6 chars)</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPasswordVal}
                  onChange={(e) => setNewPasswordVal(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                className="w-full mt-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-white text-xs"
              >
                Update Password
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT MENU DISH */}
      {menuModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl p-6">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-base font-bold text-white">
                {menuEditTarget ? 'Edit Menu Dish' : 'Add New Menu Dish'}
              </h3>
              <button onClick={() => setMenuModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveMenuDish} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Dish Name</label>
                <input
                  type="text"
                  required
                  value={menuFormData.name}
                  onChange={(e) => setMenuFormData({ ...menuFormData, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                  placeholder="e.g. Lobster Ravioli"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Category</label>
                  <select
                    value={menuFormData.category}
                    onChange={(e) => setMenuFormData({ ...menuFormData, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                  >
                    <option value="Starters">Starters</option>
                    <option value="Mains">Mains</option>
                    <option value="Pizzas">Pizzas</option>
                    <option value="Desserts">Desserts</option>
                    <option value="Beverages">Beverages</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Price ($)</label>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    required
                    value={menuFormData.price}
                    onChange={(e) => setMenuFormData({ ...menuFormData, price: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                    placeholder="18.50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Description</label>
                <textarea
                  rows={2}
                  value={menuFormData.description}
                  onChange={(e) => setMenuFormData({ ...menuFormData, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                  placeholder="Ingredients and culinary notes..."
                />
              </div>
              <button
                type="submit"
                className="w-full mt-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-white text-xs shadow-lg shadow-indigo-600/30"
              >
                Save Menu Item
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD TABLE */}
      {tableModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-2xl shadow-2xl p-6">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-base font-bold text-white">Add Dining Table</h3>
              <button onClick={() => setTableModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateTable} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Table Number</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={newTable.tableNumber}
                  onChange={(e) => setNewTable({ ...newTable, tableNumber: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                  placeholder="e.g. 9"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Seat Capacity</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  required
                  value={newTable.capacity}
                  onChange={(e) => setNewTable({ ...newTable, capacity: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Section Area</label>
                <select
                  value={newTable.section}
                  onChange={(e) => setNewTable({ ...newTable, section: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                >
                  <option value="Main Dining">Main Dining</option>
                  <option value="Window Booth">Window Booth</option>
                  <option value="Patio Terrace">Patio Terrace</option>
                  <option value="VIP Lounge">VIP Lounge</option>
                  <option value="Family Dining">Family Dining</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full mt-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-white text-xs shadow-lg shadow-indigo-600/30"
              >
                Create Table
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
