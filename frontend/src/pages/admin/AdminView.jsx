import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart3,
  UtensilsCrossed,
  LayoutGrid,
  Users,
  Database,
  Plus,
  Trash2,
  Edit2,
  Key,
  Download,
  Upload,
  Search,
  CheckCircle,
  XCircle,
  Calendar,
  X,
  RefreshCw,
  Eye,
  DollarSign
} from 'lucide-react';
import StaffHeader from '../../components/StaffHeader';
import { formatNPR } from '../../utils/currency';
import api from '../../api';

const AdminView = () => {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'tables' | 'menu' | 'users' | 'invoices'

  // Loading & feedback
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('');

  // Dashboard / Reports states
  const [reportData, setReportData] = useState(null);
  const [dateRange, setDateRange] = useState('today'); // 'today' | 'week' | 'month' | 'custom'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Tables state
  const [tables, setTables] = useState([]);
  const [editingTable, setEditingTable] = useState(null);
  const [tableModalOpen, setTableModalOpen] = useState(false);
  const [tableForm, setTableForm] = useState({ name: '', tableNumber: '', capacity: 4, section: 'Main Dining', photo: '' });

  // Menu state
  const [menuItems, setMenuItems] = useState([]);
  const [editingMenuItem, setEditingMenuItem] = useState(null);
  const [menuModalOpen, setMenuModalOpen] = useState(false);
  const [menuForm, setMenuForm] = useState({ name: '', category: 'Main', price: '', description: '', image: '', inStock: true });
  const [menuFilterCategory, setMenuFilterCategory] = useState('All');

  // Users state
  const [staffUsers, setStaffUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [userForm, setUserForm] = useState({ name: '', username: '', position: 'Floor Waiter', password: '', role: 'waiter', phone: '' });
  const [passwordResetModal, setPasswordResetModal] = useState(null); // userId to reset
  const [newPasswordInput, setNewPasswordInput] = useState('');

  // Invoices & JSON Backup state
  const [invoices, setInvoices] = useState([]);
  const [importingJson, setImportingJson] = useState(false);

  // Fetch Reports
  const fetchReports = async () => {
    try {
      const params = { range: dateRange };
      if (dateRange === 'custom') {
        if (customStartDate) params.startDate = customStartDate;
        if (customEndDate) params.endDate = customEndDate;
      }
      const res = await api.get('/reports/analytics', { params });
      setReportData(res.data);
    } catch (e) {
      console.error('Reports fetch failed:', e);
    }
  };

  // Fetch Tables
  const fetchTables = async () => {
    try {
      const res = await api.get('/tables');
      setTables(res.data);
    } catch (e) {
      console.error('Tables fetch failed:', e);
    }
  };

  // Fetch Menu
  const fetchMenu = async () => {
    try {
      const res = await api.get('/menu');
      setMenuItems(res.data);
    } catch (e) {
      console.error('Menu fetch failed:', e);
    }
  };

  // Fetch Users
  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users');
      setStaffUsers(res.data);
    } catch (e) {
      console.error('Users fetch failed:', e);
    }
  };

  // Fetch Invoices
  const fetchInvoices = async () => {
    try {
      const res = await api.get('/payments');
      setInvoices(res.data);
    } catch (e) {
      console.error('Invoices fetch failed:', e);
    }
  };

  // Initial tab loading
  useEffect(() => {
    if (activeTab === 'dashboard') fetchReports();
    else if (activeTab === 'tables') fetchTables();
    else if (activeTab === 'menu') fetchMenu();
    else if (activeTab === 'users') fetchUsers();
    else if (activeTab === 'invoices') fetchInvoices();
  }, [activeTab, dateRange, customStartDate, customEndDate]);

  const showFeedback = (msg) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(''), 4000);
  };

  // ----------------------------------------------------
  // TABLE ACTIONS
  // ----------------------------------------------------
  const handleSaveTable = async (e) => {
    e.preventDefault();
    try {
      if (editingTable) {
        await api.put(`/tables/${editingTable._id}`, tableForm);
        showFeedback(`Table updated successfully.`);
      } else {
        await api.post('/tables', tableForm);
        showFeedback(`Table created successfully.`);
      }
      setTableModalOpen(false);
      setEditingTable(null);
      fetchTables();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save table.');
    }
  };

  const handleDeleteTable = async (tbl) => {
    if (!window.confirm(`Delete ${tbl.name}?`)) return;
    try {
      await api.delete(`/tables/${tbl._id}`);
      showFeedback(`Table deleted.`);
      fetchTables();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete table.');
    }
  };

  // ----------------------------------------------------
  // MENU ACTIONS
  // ----------------------------------------------------
  const handleSaveMenuItem = async (e) => {
    e.preventDefault();
    try {
      if (editingMenuItem) {
        await api.put(`/menu/${editingMenuItem._id}`, menuForm);
        showFeedback(`Dish updated.`);
      } else {
        await api.post('/menu', menuForm);
        showFeedback(`New dish created.`);
      }
      setMenuModalOpen(false);
      setEditingMenuItem(null);
      fetchMenu();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save menu item.');
    }
  };

  const handleToggleStock = async (item) => {
    try {
      await api.patch(`/menu/${item._id}/toggle-stock`, { inStock: !item.inStock });
      setMenuItems(prev => prev.map(m => m._id === item._id ? { ...m, inStock: !m.inStock } : m));
    } catch (err) {
      alert('Failed to toggle stock.');
    }
  };

  const handleDeleteMenuItem = async (item) => {
    if (!window.confirm(`Delete "${item.name}" from menu?`)) return;
    try {
      await api.delete(`/menu/${item._id}`);
      showFeedback(`Dish removed.`);
      fetchMenu();
    } catch (err) {
      alert('Failed to delete dish.');
    }
  };

  // ----------------------------------------------------
  // USER ACTIONS
  // ----------------------------------------------------
  const handleSaveUser = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await api.put(`/admin/users/${editingUser._id}`, userForm);
        showFeedback(`Staff details updated.`);
      } else {
        await api.post('/admin/users', userForm);
        showFeedback(`New user created.`);
      }
      setUserModalOpen(false);
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save user.');
    }
  };

  const handleToggleUserStatus = async (usr) => {
    try {
      const res = await api.patch(`/admin/users/${usr._id}/toggle-status`);
      setStaffUsers(prev => prev.map(u => u._id === usr._id ? { ...u, active: res.data.active } : u));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to toggle status.');
    }
  };

  const handleResetPassword = async () => {
    if (!newPasswordInput || newPasswordInput.length < 4) {
      alert('Password must be at least 4 characters.');
      return;
    }
    try {
      await api.patch(`/admin/users/${passwordResetModal._id}/reset-password`, { newPassword: newPasswordInput });
      showFeedback(`Password reset for ${passwordResetModal.name}`);
      setPasswordResetModal(null);
      setNewPasswordInput('');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reset password.');
    }
  };

  const handleDeleteUser = async (usr) => {
    if (!window.confirm(`Delete user "${usr.name}"?`)) return;
    try {
      await api.delete(`/admin/users/${usr._id}`);
      showFeedback(`User deleted.`);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user.');
    }
  };

  // ----------------------------------------------------
  // JSON EXPORT & RE-IMPORT
  // ----------------------------------------------------
  const handleExportJson = () => {
    api.get('/payments/export', { responseType: 'blob' })
      .then(res => {
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `mongodb-invoices-backup-${Date.now()}.json`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        showFeedback('Invoices exported successfully.');
      })
      .catch(() => alert('Export failed.'));
  };

  const handleImportJsonFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setImportingJson(true);
        const parsed = JSON.parse(event.target.result);
        const list = parsed.invoices || parsed;
        const res = await api.post('/payments/import', { invoices: list });
        alert(res.data.message);
        fetchInvoices();
      } catch (err) {
        alert('Invalid JSON file format.');
      } finally {
        setImportingJson(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans pb-16">
      <StaffHeader />

      {/* Feedback Banner */}
      {feedback && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-xl flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      <main className="max-w-7xl mx-auto w-full p-4 sm:p-6 flex-1">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 no-scrollbar">
          {[
            { id: 'dashboard', label: 'Reports & Dashboard', icon: BarChart3 },
            { id: 'tables', label: 'Manage Tables', icon: LayoutGrid },
            { id: 'menu', label: 'Manage Menu', icon: UtensilsCrossed },
            { id: 'users', label: 'Manage Users', icon: Users },
            { id: 'invoices', label: 'Invoices & JSON Backup', icon: Database }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ==================================================== */}
        {/* TAB 1: REPORTS & ANALYTICS DASHBOARD */}
        {/* ==================================================== */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Header with Date Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-4 rounded-3xl border border-slate-800">
              <div>
                <h2 className="text-xl font-black text-white tracking-tight">
                  Business Performance & Reports
                </h2>
                <p className="text-xs text-slate-400">
                  Sales metrics, top-selling dishes, waiter performance & date range filters
                </p>
              </div>

              {/* Date Filters */}
              <div className="flex flex-wrap items-center gap-2">
                {['today', 'week', 'month', 'all'].map(rng => (
                  <button
                    key={rng}
                    onClick={() => setDateRange(rng)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition ${
                      dateRange === rng
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {rng === 'today' ? "Today's Sales" : rng === 'week' ? 'Last 7 Days' : rng === 'month' ? 'This Month' : 'All Time'}
                  </button>
                ))}
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Today's Sales
                </p>
                <h3 className="text-2xl font-black text-amber-400">
                  {formatNPR(reportData?.today?.sales || 0)}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {reportData?.today?.ordersCount || 0} completed orders today
                </p>
              </div>

              <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Selected Range Sales
                </p>
                <h3 className="text-2xl font-black text-white">
                  {formatNPR(reportData?.summary?.totalSales || 0)}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {reportData?.summary?.totalOrders || 0} total invoices
                </p>
              </div>

              <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Average Ticket Size
                </p>
                <h3 className="text-2xl font-black text-emerald-400">
                  {formatNPR(reportData?.summary?.averageTicket || 0)}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Per customer table spend
                </p>
              </div>

              <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Tax Collected (VAT)
                </p>
                <h3 className="text-2xl font-black text-sky-400">
                  {formatNPR(reportData?.summary?.totalTax || 0)}
                </h3>
                <p className="text-[11px] text-slate-500">
                  13% Government VAT
                </p>
              </div>
            </div>

            {/* Two Column Grid: Top-Selling Items & Sales By Waiter */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Selling Items */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
                <h3 className="text-base font-black text-white tracking-tight flex items-center gap-2">
                  <UtensilsCrossed className="w-4 h-4 text-amber-500" />
                  <span>Top-Selling Nepali Dishes</span>
                </h3>

                {(!reportData?.topSellingDishes || reportData.topSellingDishes.length === 0) ? (
                  <p className="text-xs text-slate-500 italic py-6 text-center">No sales records in this date range.</p>
                ) : (
                  <div className="space-y-2">
                    {reportData.topSellingDishes.map((dish, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800/80 text-xs">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 font-black text-xs flex items-center justify-center">
                            #{idx + 1}
                          </span>
                          <div>
                            <p className="font-bold text-white">{dish.name}</p>
                            <p className="text-[11px] text-slate-400">{dish.qty} orders served</p>
                          </div>
                        </div>
                        <span className="font-bold text-amber-400 text-sm">
                          {formatNPR(dish.revenue)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sales By Waiter */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
                <h3 className="text-base font-black text-white tracking-tight flex items-center gap-2">
                  <Users className="w-4 h-4 text-sky-400" />
                  <span>Sales by Waiter Performance</span>
                </h3>

                {(!reportData?.waiterPerformance || reportData.waiterPerformance.length === 0) ? (
                  <p className="text-xs text-slate-500 italic py-6 text-center">No waiter sales recorded yet.</p>
                ) : (
                  <div className="space-y-2">
                    {reportData.waiterPerformance.map((w, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800/80 text-xs">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-sky-500/20 text-sky-400 font-bold flex items-center justify-center">
                            {w.name?.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-white">{w.name}</p>
                            <p className="text-[11px] text-slate-400">{w.ordersCount} tables served</p>
                          </div>
                        </div>
                        <span className="font-bold text-emerald-400 text-sm">
                          {formatNPR(w.totalSales)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 2: MANAGE TABLES */}
        {/* ==================================================== */}
        {activeTab === 'tables' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-white tracking-tight">
                  Dining Tables Setup
                </h2>
                <p className="text-xs text-slate-400">
                  Add, edit, or remove restaurant dining tables with photo and live status
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingTable(null);
                  setTableForm({ name: '', tableNumber: tables.length + 1, capacity: 4, section: 'Main Dining', photo: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80' });
                  setTableModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/25 active:scale-95 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Table</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {tables.map(tbl => (
                <div key={tbl._id} className="rounded-3xl border border-slate-800 bg-slate-900 overflow-hidden shadow-lg flex flex-col justify-between">
                  <div className="h-32 w-full relative overflow-hidden bg-slate-800">
                    <img src={tbl.photo} alt={tbl.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                    <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-slate-950/80 text-white border border-slate-700">
                      {tbl.status}
                    </div>
                    <div className="absolute bottom-2.5 left-3">
                      <h4 className="text-base font-black text-white">{tbl.name}</h4>
                      <p className="text-[11px] text-slate-300">{tbl.capacity} Seats • {tbl.section}</p>
                    </div>
                  </div>

                  <div className="p-4 flex items-center justify-between border-t border-slate-800">
                    <button
                      onClick={() => {
                        setEditingTable(tbl);
                        setTableForm({ name: tbl.name, tableNumber: tbl.tableNumber, capacity: tbl.capacity, section: tbl.section, photo: tbl.photo });
                        setTableModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => handleDeleteTable(tbl)}
                      disabled={tbl.status !== 'empty'}
                      className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 disabled:opacity-30"
                      title={tbl.status !== 'empty' ? 'Cannot delete occupied table' : 'Delete table'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 3: MANAGE MENU */}
        {/* ==================================================== */}
        {activeTab === 'menu' && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-white tracking-tight">
                  Nepali Restaurant Menu Management
                </h2>
                <p className="text-xs text-slate-400">
                  Item name, Nepali categories, price in NPR, availability in-stock toggle & photos
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingMenuItem(null);
                  setMenuForm({ name: '', category: 'Main', price: '', description: '', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80', inStock: true });
                  setMenuModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/25 active:scale-95 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Add Menu Item</span>
              </button>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {['All', 'Starters', 'Main', 'Snacks', 'Drinks', 'Dessert'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setMenuFilterCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                    menuFilterCategory === cat
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Menu Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {menuItems
                .filter(it => menuFilterCategory === 'All' || it.category?.toLowerCase() === menuFilterCategory.toLowerCase())
                .map(item => (
                  <div key={item._id} className="p-4 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col justify-between gap-3 shadow-lg">
                    <div className="flex items-start gap-3">
                      <img src={item.image} alt={item.name} className="w-20 h-20 rounded-2xl object-cover bg-slate-800 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
                            {item.category}
                          </span>
                          <span className="font-mono font-black text-white text-sm">
                            {formatNPR(item.price)}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white truncate mt-1">
                          {item.name}
                        </h4>
                        <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    {/* Stock Toggle & Edit/Delete Controls */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                      {/* Availability Toggle */}
                      <button
                        onClick={() => handleToggleStock(item)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                          item.inStock
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {item.inStock ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        <span>{item.inStock ? 'In Stock' : 'Out of Stock'}</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setEditingMenuItem(item);
                            setMenuForm({
                              name: item.name,
                              category: item.category,
                              price: item.price,
                              description: item.description,
                              image: item.image,
                              inStock: item.inStock
                            });
                            setMenuModalOpen(true);
                          }}
                          className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteMenuItem(item)}
                          className="p-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
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

        {/* ==================================================== */}
        {/* TAB 4: MANAGE USERS */}
        {/* ==================================================== */}
        {activeTab === 'users' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-white tracking-tight">
                  Staff & Role Management
                </h2>
                <p className="text-xs text-slate-400">
                  Assign roles (Admin, Waiter, Kitchen, Reception), reset passwords, and deactivate accounts
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingUser(null);
                  setUserForm({ name: '', username: '', position: 'Floor Waiter', password: '', role: 'waiter', phone: '' });
                  setUserModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/25 active:scale-95 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Add Staff User</span>
              </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-4">Name</th>
                    <th className="p-4">Username</th>
                    <th className="p-4">Assigned Role</th>
                    <th className="p-4">Position</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {staffUsers.map(usr => (
                    <tr key={usr._id} className="hover:bg-slate-800/40 transition">
                      <td className="p-4 font-bold text-white">{usr.name}</td>
                      <td className="p-4 font-mono text-amber-400">@{usr.username}</td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-slate-800 text-slate-300 border border-slate-700">
                          {usr.role}
                        </span>
                      </td>
                      <td className="p-4 text-slate-300">{usr.position}</td>
                      <td className="p-4">
                        <button
                          onClick={() => handleToggleUserStatus(usr)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            usr.active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                          }`}
                        >
                          {usr.active ? 'Active' : 'Deactivated'}
                        </button>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => {
                            setPasswordResetModal(usr);
                            setNewPasswordInput('');
                          }}
                          className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                          title="Reset Password"
                        >
                          <Key className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingUser(usr);
                            setUserForm({ name: usr.name, username: usr.username, position: usr.position, role: usr.role, phone: usr.phone || '' });
                            setUserModalOpen(true);
                          }}
                          className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(usr)}
                          className="p-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
                          title="Delete"
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

        {/* ==================================================== */}
        {/* TAB 5: INVOICES & JSON BACKUP */}
        {/* ==================================================== */}
        {activeTab === 'invoices' && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-3xl border border-slate-800">
              <div>
                <h2 className="text-xl font-black text-white tracking-tight">
                  Offline JSON Backup & Restoration
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Export past payment records to a JSON file or re-import historical backups. MongoDB stays the single source of truth.
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Export Button */}
                <button
                  onClick={handleExportJson}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 active:scale-95 transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Backup (JSON)</span>
                </button>

                {/* Import File Picker */}
                <label className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer border border-slate-700 transition active:scale-95">
                  <Upload className="w-4 h-4" />
                  <span>{importingJson ? 'Importing...' : 'Re-Import Backup JSON'}</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportJsonFile}
                    className="hidden"
                    disabled={importingJson}
                  />
                </label>
              </div>
            </div>

            {/* Invoices List */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">
                  Database Payment Records ({invoices.length})
                </h3>
              </div>
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-4">Invoice #</th>
                    <th className="p-4">Date & Time</th>
                    <th className="p-4">Table</th>
                    <th className="p-4">Waiter</th>
                    <th className="p-4">Method</th>
                    <th className="p-4 text-right">Total (NPR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {invoices.map(inv => (
                    <tr key={inv._id} className="hover:bg-slate-800/40 transition">
                      <td className="p-4 font-mono font-bold text-amber-400">{inv.invoiceNumber}</td>
                      <td className="p-4 text-slate-300">{new Date(inv.dateTime).toLocaleString()}</td>
                      <td className="p-4 font-semibold text-white">{inv.tableName || `Table ${inv.tableNumber}`}</td>
                      <td className="p-4 text-slate-300">{inv.waiterName || 'Staff'}</td>
                      <td className="p-4 text-slate-300">{inv.paymentMethod}</td>
                      <td className="p-4 text-right font-black text-white">{formatNPR(inv.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* ==================================================== */}
      {/* MODAL: ADD / EDIT TABLE */}
      {/* ==================================================== */}
      {tableModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-black text-white">
                {editingTable ? 'Edit Table' : 'Add New Table'}
              </h3>
              <button onClick={() => setTableModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTable} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Table Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Table 4 - Patan Lounge"
                  value={tableForm.name}
                  onChange={e => setTableForm({ ...tableForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Table Number</label>
                  <input
                    type="number"
                    required
                    value={tableForm.tableNumber}
                    onChange={e => setTableForm({ ...tableForm, tableNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Seats Capacity</label>
                  <input
                    type="number"
                    min="1"
                    value={tableForm.capacity}
                    onChange={e => setTableForm({ ...tableForm, capacity: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Section</label>
                <input
                  type="text"
                  value={tableForm.section}
                  onChange={e => setTableForm({ ...tableForm, section: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Photo URL</label>
                <input
                  type="url"
                  value={tableForm.photo}
                  onChange={e => setTableForm({ ...tableForm, photo: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase"
              >
                Save Table
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: ADD / EDIT MENU ITEM */}
      {/* ==================================================== */}
      {menuModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-black text-white">
                {editingMenuItem ? 'Edit Dish' : 'Add Menu Item'}
              </h3>
              <button onClick={() => setMenuModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMenuItem} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Dish Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Steamed Chicken Momo"
                  value={menuForm.name}
                  onChange={e => setMenuForm({ ...menuForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Category</label>
                  <select
                    value={menuForm.category}
                    onChange={e => setMenuForm({ ...menuForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  >
                    <option value="Starters">Starters</option>
                    <option value="Main">Main</option>
                    <option value="Snacks">Snacks</option>
                    <option value="Drinks">Drinks</option>
                    <option value="Dessert">Dessert</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Price (NPR)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="e.g. 280"
                    value={menuForm.price}
                    onChange={e => setMenuForm({ ...menuForm, price: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Description</label>
                <textarea
                  rows="2"
                  value={menuForm.description}
                  onChange={e => setMenuForm({ ...menuForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Photo Image URL</label>
                <input
                  type="url"
                  value={menuForm.image}
                  onChange={e => setMenuForm({ ...menuForm, image: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="inStockCheck"
                  checked={menuForm.inStock}
                  onChange={e => setMenuForm({ ...menuForm, inStock: e.target.checked })}
                  className="rounded bg-slate-950 text-amber-500"
                />
                <label htmlFor="inStockCheck" className="text-slate-300 font-bold">In Stock / Available</label>
              </div>

              <button
                type="submit"
                className="w-full mt-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase"
              >
                Save Menu Item
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: ADD / EDIT STAFF USER */}
      {/* ==================================================== */}
      {userModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-black text-white">
                {editingUser ? 'Edit Staff User' : 'Add Staff Member'}
              </h3>
              <button onClick={() => setUserModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sita Sharma"
                  value={userForm.name}
                  onChange={e => setUserForm({ ...userForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Username</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. sita"
                  value={userForm.username}
                  onChange={e => setUserForm({ ...userForm, username: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              {!editingUser && (
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={userForm.password}
                    onChange={e => setUserForm({ ...userForm, password: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Role</label>
                  <select
                    value={userForm.role}
                    onChange={e => setUserForm({ ...userForm, role: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  >
                    <option value="admin">Admin</option>
                    <option value="waiter">Waiter</option>
                    <option value="kitchen">Kitchen</option>
                    <option value="reception">Reception</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Position Title</label>
                  <input
                    type="text"
                    value={userForm.position}
                    onChange={e => setUserForm({ ...userForm, position: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase"
              >
                Save User
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: RESET PASSWORD */}
      {/* ==================================================== */}
      {passwordResetModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-black text-white">
                Reset Password for {passwordResetModal.name}
              </h3>
              <button onClick={() => setPasswordResetModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-slate-400">
              Enter a new secure password. It will be bcrypt hashed immediately before saving.
            </p>

            <input
              type="password"
              placeholder="New password..."
              value={newPasswordInput}
              onChange={e => setNewPasswordInput(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm"
            />

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setPasswordResetModal(null)}
                className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleResetPassword}
                className="flex-1 py-2 rounded-xl bg-amber-500 text-slate-950 font-black"
              >
                Save Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminView;
