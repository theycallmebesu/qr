import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ChevronLeft, Plus, Edit2, Trash2, Building2, Upload, User, CreditCard, ShieldCheck, CheckCircle2, Lock } from 'lucide-react';
import api from '../api';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('banks'); // 'banks' | 'persons'
  const [banks, setBanks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Bank Modal State
  const [showBankModal, setShowBankModal] = useState(false);
  const [editingBank, setEditingBank] = useState(null);
  const [bankFormData, setBankFormData] = useState({
    name: '',
    logoUrl: '',
    qrCodeImage: '',
    accountName: '',
    accountNumber: '',
    userId: ''
  });

  // User Modal State
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userFormData, setUserFormData] = useState({
    name: '',
    email: '',
    password: '',
    profileImage: ''
  });

  const [actionLoading, setActionLoading] = useState(false);

  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [banksRes, usersRes] = await Promise.all([
        api.get('/banks'),
        api.get('/users')
      ]);
      setBanks(banksRes.data);
      setUsers(usersRes.data);
    } catch (err) {
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // PC Image Upload Handlers
  const handleBankLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image file size should be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setBankFormData(prev => ({ ...prev, logoUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBankQrUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('QR Code image file size should be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setBankFormData(prev => ({ ...prev, qrCodeImage: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUserProfileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image file size should be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserFormData(prev => ({ ...prev, profileImage: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Bank Actions
  const openAddBankModal = () => {
    setEditingBank(null);
    setBankFormData({
      name: '',
      logoUrl: '',
      qrCodeImage: '',
      accountName: '',
      accountNumber: '',
      userId: users[0]?._id || ''
    });
    setError('');
    setShowBankModal(true);
  };

  const openEditBankModal = (bank) => {
    setEditingBank(bank);
    setBankFormData({
      name: bank.name || '',
      logoUrl: bank.logoUrl || '',
      qrCodeImage: bank.qrCodeImage || '',
      accountName: bank.accountName || '',
      accountNumber: bank.accountNumber || '',
      userId: bank.userId?._id || bank.userId || ''
    });
    setError('');
    setShowBankModal(true);
  };

  const handleBankSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      if (editingBank) {
        await api.put(`/banks/${editingBank._id}`, bankFormData);
        setSuccessMsg(`Successfully updated bank ${bankFormData.name}`);
      } else {
        await api.post('/banks', bankFormData);
        setSuccessMsg(`Successfully added bank ${bankFormData.name}`);
      }
      setShowBankModal(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save bank details');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBankDelete = async (bankId, bankName) => {
    if (!window.confirm(`Are you sure you want to delete ${bankName}?`)) return;

    setActionLoading(true);
    try {
      await api.delete(`/banks/${bankId}`);
      setSuccessMsg(`Deleted ${bankName}`);
      fetchData();
    } catch (err) {
      setError('Failed to delete bank');
    } finally {
      setActionLoading(false);
    }
  };

  // User Actions
  const openAddUserModal = () => {
    setEditingUser(null);
    setUserFormData({
      name: '',
      email: '',
      password: '',
      profileImage: ''
    });
    setError('');
    setShowUserModal(true);
  };

  const openEditUserModal = (userItem) => {
    setEditingUser(userItem);
    setUserFormData({
      name: userItem.name || '',
      email: userItem.email || '',
      password: userItem.plainPassword || '',
      profileImage: userItem.profileImage || ''
    });
    setError('');
    setShowUserModal(true);
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      if (editingUser) {
        await api.put(`/users/${editingUser._id}`, userFormData);
        setSuccessMsg(`Successfully updated individual profile for ${userFormData.name}`);
      } else {
        await api.post('/users', userFormData);
        setSuccessMsg(`Successfully created profile for ${userFormData.name}`);
      }
      setShowUserModal(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save user profile');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUserDelete = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete ${userName}?`)) return;

    setActionLoading(true);
    try {
      await api.delete(`/users/${userId}`);
      setSuccessMsg(`Deleted ${userName}`);
      fetchData();
    } catch (err) {
      setError('Failed to delete person profile');
    } finally {
      setActionLoading(false);
    }
  };

  const getUserName = (uId) => {
    if (!uId) return 'All / General Users';
    const idStr = typeof uId === 'object' ? uId._id : uId;
    const found = users.find(u => u._id === idStr);
    return found ? found.name : 'Unknown User';
  };

  const [selectedPersonFilter, setSelectedPersonFilter] = useState('all');

  const openAddBankForPersonModal = (personId = '') => {
    setEditingBank(null);
    setBankFormData({
      name: '',
      logoUrl: '',
      accountName: '',
      accountNumber: '',
      userId: personId || (users[0]?._id || '')
    });
    setError('');
    setShowBankModal(true);
  };

  const filteredBanksByPerson = selectedPersonFilter === 'all'
    ? banks
    : banks.filter(b => {
        const uId = typeof b.userId === 'object' ? b.userId?._id : b.userId;
        return uId === selectedPersonFilter;
      });

  return (
    <div className="min-h-screen p-4 sm:p-8 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/banks')}
            className="p-2 rounded-full hover:bg-surface transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center space-x-2">
              <ShieldCheck className="text-secondary" size={28} />
              <span>Admin Management Panel</span>
            </h1>
            <p className="text-sm text-textSecondary mt-0.5">
              Add, edit, or delete bank options & uploaded PC images for each individual person
            </p>
          </div>
        </div>

        <div className="flex space-x-3 w-full sm:w-auto">
          {activeTab === 'banks' ? (
            <button
              onClick={() => openAddBankForPersonModal(selectedPersonFilter === 'all' ? '' : selectedPersonFilter)}
              className="flex-1 sm:flex-initial py-2.5 px-4 bg-gradient-to-r from-purple-600 to-secondary text-white font-medium rounded-xl shadow-lg hover:shadow-secondary/20 transition-all flex items-center justify-center space-x-2 text-sm"
            >
              <Plus size={18} />
              <span>Add Bank {selectedPersonFilter !== 'all' ? `for ${getUserName(selectedPersonFilter)}` : 'Account'}</span>
            </button>
          ) : (
            <button
              onClick={openAddUserModal}
              className="flex-1 sm:flex-initial py-2.5 px-4 bg-gradient-to-r from-primary to-blue-600 text-white font-medium rounded-xl shadow-lg hover:shadow-primary/20 transition-all flex items-center justify-center space-x-2 text-sm"
            >
              <Plus size={18} />
              <span>Add New Person Profile</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex justify-between items-center border-b border-slate-800 mb-6 flex-wrap gap-4">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('banks')}
            className={`py-3 px-6 font-semibold text-sm transition-all border-b-2 flex items-center space-x-2 ${
              activeTab === 'banks'
                ? 'border-secondary text-secondary'
                : 'border-transparent text-textSecondary hover:text-white'
            }`}
          >
            <Building2 size={18} />
            <span>Bank Accounts ({banks.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('persons')}
            className={`py-3 px-6 font-semibold text-sm transition-all border-b-2 flex items-center space-x-2 ${
              activeTab === 'persons'
                ? 'border-primary text-primary'
                : 'border-transparent text-textSecondary hover:text-white'
            }`}
          >
            <User size={18} />
            <span>Individual Persons ({users.length})</span>
          </button>
        </div>

        {/* Person Filter Selector */}
        {activeTab === 'banks' && (
          <div className="flex items-center space-x-2 pb-2">
            <span className="text-xs text-textSecondary font-medium">Filter by Person:</span>
            <select
              value={selectedPersonFilter}
              onChange={(e) => setSelectedPersonFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-white text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-secondary"
            >
              <option value="all">All Individual Persons</option>
              {users.map(u => (
                <option key={u._id} value={u._id}>{u.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Alert Messages */}
      {successMsg && (
        <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm flex justify-between items-center">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg('')} className="text-green-400 font-bold">✕</button>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-400 font-bold">✕</button>
        </div>
      )}

      {/* Loading Spinner */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-secondary"></div>
        </div>
      ) : (
        activeTab === 'banks' ? (
          /* BANKS GRID */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBanksByPerson.map((bank) => (
              <div
                key={bank._id}
                className="glass-panel rounded-2xl p-6 relative flex flex-col justify-between hover:border-secondary/40 transition-all group"
              >
                <div>
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="h-16 w-16 rounded-xl bg-white p-2 flex items-center justify-center shrink-0 border border-slate-700 shadow-md">
                      {bank.logoUrl ? (
                        <img src={bank.logoUrl} alt={bank.name} className="max-h-full max-w-full object-contain" />
                      ) : (
                        <Building2 size={32} className="text-slate-800" />
                      )}
                    </div>
                    <div className="overflow-hidden">
                      <h3 className="text-lg font-bold text-white truncate">{bank.name}</h3>
                      <p className="text-xs text-textSecondary truncate">{bank.accountName || 'No account name'}</p>
                      <span className="inline-block mt-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                        Belongs to: {getUserName(bank.userId)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs bg-slate-900/60 p-3 rounded-lg border border-slate-800 text-textSecondary mb-6 font-mono">
                    <div className="flex justify-between">
                      <span>Account Holder:</span>
                      <span className="text-white font-semibold truncate max-w-[150px]">{bank.accountName || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Acc No:</span>
                      <span className="text-white font-semibold">{bank.accountNumber || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => openEditBankModal(bank)}
                    className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center space-x-1.5"
                  >
                    <Edit2 size={14} className="text-secondary" />
                    <span>Edit Details</span>
                  </button>
                  <button
                    onClick={() => handleBankDelete(bank._id, bank.name)}
                    className="py-2 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium rounded-lg transition-colors flex items-center justify-center space-x-1.5"
                  >
                    <Trash2 size={14} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
            {filteredBanksByPerson.length === 0 && (
              <div className="col-span-full text-center py-16 text-textSecondary glass-panel rounded-2xl">
                No bank accounts assigned to this person. Click "Add Bank" to add details!
              </div>
            )}
          </div>
        ) : (
          /* INDIVIDUAL PERSONS GRID */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.map((person) => {
              const personBanks = banks.filter(b => {
                const uId = typeof b.userId === 'object' ? b.userId?._id : b.userId;
                return uId === person._id;
              });

              return (
                <div
                  key={person._id}
                  className="glass-panel rounded-2xl p-6 relative flex flex-col justify-between hover:border-primary/40 transition-all group"
                >
                  <div>
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="h-10 w-10 rounded-xl bg-primary/20 border border-primary/40 shrink-0 flex items-center justify-center text-primary">
                        <User size={22} />
                      </div>
                      <div className="overflow-hidden">
                        <h3 className="text-lg font-bold text-white truncate">{person.name}</h3>
                        <p className="text-xs text-textSecondary truncate">{person.email}</p>
                      </div>
                    </div>

                    <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 text-xs text-textSecondary space-y-1.5 mb-6">
                      <div className="flex justify-between items-center font-mono">
                        <span className="text-textSecondary">User Password:</span>
                        <span className="text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">{person.plainPassword || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Assigned Banks:</span>
                        <span className="text-primary font-medium">{personBanks.map(b => b.name).join(', ') || 'None'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-2 pt-2 border-t border-slate-800">
                    <button
                      onClick={() => openEditUserModal(person)}
                      className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center space-x-1.5"
                    >
                      <Edit2 size={14} className="text-primary" />
                      <span>Edit Person</span>
                    </button>
                    <button
                      onClick={() => handleUserDelete(person._id, person.name)}
                      className="py-2 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium rounded-lg transition-colors flex items-center justify-center space-x-1.5"
                    >
                      <Trash2 size={14} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              );
            })}
            {users.length === 0 && (
              <div className="col-span-full text-center py-16 text-textSecondary glass-panel rounded-2xl">
                No individual persons registered yet. Click "Add New Person" above!
              </div>
            )}
          </div>
        )
      )}

      {/* ADD / EDIT BANK MODAL */}
      {showBankModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel max-w-lg w-full p-6 sm:p-8 rounded-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowBankModal(false)}
              className="absolute top-4 right-4 text-textSecondary hover:text-white"
            >
              ✕
            </button>

            <h2 className="text-xl font-bold mb-6 text-white flex items-center space-x-2">
              <Building2 className="text-secondary" size={24} />
              <span>{editingBank ? `Edit ${editingBank.name}` : 'Add New Bank'}</span>
            </h2>

            <form onSubmit={handleBankSubmit} className="space-y-4">
              {/* Assign to Person */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-textSecondary">Assign Bank to Individual Person *</label>
                <select
                  value={bankFormData.userId}
                  onChange={(e) => setBankFormData({ ...bankFormData, userId: e.target.value })}
                  className="input-field text-sm bg-slate-900 text-white"
                >
                  <option value="">-- General / Shared Bank --</option>
                  {users.map(u => (
                    <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                  ))}
                </select>
              </div>

              {/* Bank Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-textSecondary">Bank Name *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-textSecondary">
                    <Building2 size={16} />
                  </div>
                  <input
                    type="text"
                    required
                    value={bankFormData.name}
                    onChange={(e) => setBankFormData({ ...bankFormData, name: e.target.value })}
                    className="input-field !pl-10 text-sm"
                    placeholder="e.g. Chase Bank, Wells Fargo"
                  />
                </div>
              </div>

              {/* Logo Image Uploaded from PC */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-textSecondary">Bank Logo Image (Upload from PC)</label>
                <div className="flex items-center space-x-4 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                  <div className="h-14 w-14 rounded-lg bg-white p-1 flex items-center justify-center shrink-0 border border-slate-700 overflow-hidden">
                    {bankFormData.logoUrl ? (
                      <img src={bankFormData.logoUrl} alt="Bank Logo Preview" className="max-h-full max-w-full object-contain" />
                    ) : (
                      <Building2 size={24} className="text-slate-800" />
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="cursor-pointer inline-flex items-center space-x-2 py-2 px-3 bg-secondary/20 hover:bg-secondary/30 text-secondary border border-secondary/40 rounded-lg text-xs font-semibold transition-all">
                      <Upload size={14} />
                      <span>Upload Logo from PC</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleBankLogoUpload}
                        className="hidden"
                      />
                    </label>
                    {bankFormData.logoUrl && (
                      <button
                        type="button"
                        onClick={() => setBankFormData({ ...bankFormData, logoUrl: '' })}
                        className="block mt-1 text-[11px] text-red-400 hover:underline"
                      >
                        Remove Logo
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Payment QR Image Uploaded from PC */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-textSecondary">Payment QR Code Image (Upload from PC) *</label>
                <div className="flex items-center space-x-4 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                  <div className="h-16 w-16 rounded-lg bg-white p-1 flex items-center justify-center shrink-0 border border-slate-700 overflow-hidden">
                    {bankFormData.qrCodeImage ? (
                      <img src={bankFormData.qrCodeImage} alt="QR Code Preview" className="max-h-full max-w-full object-contain" />
                    ) : (
                      <div className="text-[10px] text-slate-500 font-mono text-center">No QR Image</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="cursor-pointer inline-flex items-center space-x-2 py-2 px-3 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/40 rounded-lg text-xs font-semibold transition-all">
                      <Upload size={14} />
                      <span>Upload QR Image from PC</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleBankQrUpload}
                        className="hidden"
                      />
                    </label>
                    {bankFormData.qrCodeImage && (
                      <button
                        type="button"
                        onClick={() => setBankFormData({ ...bankFormData, qrCodeImage: '' })}
                        className="block mt-1 text-[11px] text-red-400 hover:underline"
                      >
                        Remove QR Image
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Account Holder Name & Account Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-textSecondary">Account Holder Name</label>
                  <input
                    type="text"
                    value={bankFormData.accountName}
                    onChange={(e) => setBankFormData({ ...bankFormData, accountName: e.target.value })}
                    className="input-field text-sm"
                    placeholder="e.g. John Doe"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-textSecondary">Account Number</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-textSecondary">
                      <CreditCard size={16} />
                    </div>
                    <input
                      type="text"
                      value={bankFormData.accountNumber}
                      onChange={(e) => setBankFormData({ ...bankFormData, accountNumber: e.target.value })}
                      className="input-field !pl-10 text-sm font-mono"
                      placeholder="1234-5678-9012"
                    />
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowBankModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 text-textSecondary hover:text-white text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-2.5 px-4 bg-gradient-to-r from-purple-600 to-secondary text-white font-semibold rounded-xl shadow-lg hover:shadow-secondary/30 transition-all text-sm flex items-center justify-center"
                >
                  {actionLoading ? (
                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    editingBank ? 'Save Changes' : 'Create Bank Account'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD / EDIT USER (PERSON) MODAL */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel max-w-lg w-full p-6 sm:p-8 rounded-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowUserModal(false)}
              className="absolute top-4 right-4 text-textSecondary hover:text-white"
            >
              ✕
            </button>

            <h2 className="text-xl font-bold mb-6 text-white flex items-center space-x-2">
              <User className="text-primary" size={24} />
              <span>{editingUser ? `Edit ${editingUser.name}` : 'Add New Individual Person'}</span>
            </h2>

            <form onSubmit={handleUserSubmit} className="space-y-4">

              {/* Person Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-textSecondary">Person Full Name *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-textSecondary">
                    <User size={16} />
                  </div>
                  <input
                    type="text"
                    required
                    value={userFormData.name}
                    onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                    className="input-field !pl-10 text-sm"
                    placeholder="e.g. John Doe, Sarah Smith"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-textSecondary">Email Address</label>
                <input
                  type="email"
                  value={userFormData.email}
                  onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                  className="input-field text-sm"
                  placeholder="e.g. john.doe@example.com"
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-textSecondary">
                  {editingUser ? 'New Password (leave blank to keep current)' : 'Password for Login *'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-textSecondary">
                    <Lock size={16} />
                  </div>
                  <input
                    type="password"
                    required={!editingUser}
                    value={userFormData.password}
                    onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                    className="input-field !pl-10 text-sm"
                    placeholder="Enter password (e.g. user123)"
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 text-textSecondary hover:text-white text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-2.5 px-4 bg-gradient-to-r from-primary to-blue-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-primary/30 transition-all text-sm flex items-center justify-center"
                >
                  {actionLoading ? (
                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    editingUser ? 'Save Changes' : 'Create Person Profile'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;

