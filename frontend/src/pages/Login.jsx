import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Lock, Mail, ShieldCheck, User, ArrowLeft, KeyRound, CheckCircle2 } from 'lucide-react';
import api from '../api';

const Login = () => {
  const [activeTab, setActiveTab] = useState('user'); // 'user' | 'admin'
  const [password, setPassword] = useState('');
  const [adminEmail, setAdminEmail] = useState('np03cy4a250116@heraldcollege.edu.np');
  const [adminPassword, setAdminPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: Email, 2: Code & New Password
  const [resetEmail, setResetEmail] = useState('np03cy4a250116@heraldcollege.edu.np');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetMsg, setResetMsg] = useState('');
  const [devCodeHint, setDevCodeHint] = useState('');

  const { loginUser, loginAdmin } = useContext(AuthContext);
  const navigate = useNavigate();

  const [authenticatedPerson, setAuthenticatedPerson] = useState(null);
  const [availablePersons, setAvailablePersons] = useState([]);

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await loginUser(password);
      if (data.requirePersonSelection) {
        setAvailablePersons(data.persons);
      } else if (data.user) {
        navigate('/banks');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid user password');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPerson = async (personId) => {
    setError('');
    setLoading(true);
    try {
      await loginUser(password, personId);
      navigate('/banks');
    } catch (err) {
      setError('Failed to select individual person profile');
      setLoading(false);
    }
  };

  const proceedToBanks = () => {
    navigate('/banks');
  };

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await loginAdmin(adminEmail, adminPassword);
      navigate('/banks');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid admin credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleSendCode = async (e) => {
    e.preventDefault();
    setError('');
    setResetMsg('');
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email: resetEmail });
      setResetMsg(res.data.message || `Verification code sent to ${resetEmail}! Check your Gmail inbox.`);
      setVerificationCode('');
      setForgotStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setResetMsg('');
    setLoading(true);
    try {
      const res = await api.post('/auth/reset-password', {
        email: resetEmail,
        code: verificationCode,
        newPassword: newPassword
      });
      setResetMsg(res.data.message);
      setTimeout(() => {
        setShowForgotModal(false);
        setForgotStep(1);
        setResetMsg('');
        setVerificationCode('');
        setNewPassword('');
        setAdminPassword('');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-panel max-w-md w-full p-8 rounded-2xl relative overflow-hidden">
        {/* Decorative ambient glows */}
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-primary/20 blur-2xl"></div>
        <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-32 h-32 rounded-full bg-secondary/20 blur-2xl"></div>

        <div className="relative z-10">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
              Bank QR Payment
            </h1>
            <p className="text-textSecondary mt-2">Select your portal to continue</p>
          </div>

          {/* Login Type Tabs */}
          <div className="flex bg-slate-900/60 p-1.5 rounded-xl mb-6 border border-slate-700/50">
            <button
              type="button"
              onClick={() => { setActiveTab('user'); setError(''); setAvailablePersons([]); setAuthenticatedPerson(null); }}
              className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-all duration-300 flex items-center justify-center space-x-2 ${
                activeTab === 'user'
                  ? 'bg-gradient-to-r from-primary to-blue-600 text-white shadow-md'
                  : 'text-textSecondary hover:text-white'
              }`}
            >
              <User size={16} />
              <span>User Panel</span>
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('admin'); setError(''); setAvailablePersons([]); setAuthenticatedPerson(null); }}
              className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-all duration-300 flex items-center justify-center space-x-2 ${
                activeTab === 'admin'
                  ? 'bg-gradient-to-r from-purple-600 to-secondary text-white shadow-md'
                  : 'text-textSecondary hover:text-white'
              }`}
            >
              <ShieldCheck size={16} />
              <span>Admin Panel</span>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-4 rounded-lg bg-red-500/10 border border-red-500/50 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          {/* USER LOGIN FORM / INDIVIDUAL PERSON SELECTION */}
          {activeTab === 'user' && (
            availablePersons.length > 0 ? (
              <div className="space-y-4 animate-fadeIn">
                <div className="text-center mb-4">
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 uppercase tracking-wider">
                    Password Verified ✓
                  </span>
                  <h3 className="text-lg font-bold text-white mt-2">Select Individual Person</h3>
                  <p className="text-xs text-textSecondary mt-1">Click a person to directly open their bank options</p>
                </div>

                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {availablePersons.map(person => (
                    <button
                      key={person._id}
                      type="button"
                      onClick={() => handleSelectPerson(person._id)}
                      className="w-full p-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 hover:border-primary/50 transition-all flex items-center space-x-4 text-left group shadow-sm hover:shadow-md"
                    >
                      <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-primary/50 group-hover:border-primary shrink-0 bg-slate-800">
                        {person.profileImage ? (
                          <img src={person.profileImage} alt={person.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-primary">
                            <User size={24} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <h4 className="text-base font-bold text-white group-hover:text-primary transition-colors truncate">{person.name}</h4>
                        <p className="text-xs text-textSecondary truncate">{person.email}</p>
                      </div>
                      <span className="text-primary font-bold text-lg group-hover:translate-x-1 transition-transform">→</span>
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setAvailablePersons([])}
                  className="w-full text-xs text-center text-textSecondary hover:text-white py-2"
                >
                  ← Back to Password
                </button>
              </div>
            ) : (
              <form onSubmit={handleUserSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-textSecondary flex items-center space-x-1">
                    <span>Enter User Password</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-textSecondary">
                      <Lock size={18} />
                    </div>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input-field !pl-11"
                      placeholder="Enter password (e.g. user123)"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary mt-6 flex items-center justify-center"
                >
                  {loading ? (
                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    "Verify Password & View Persons"
                  )}
                </button>
              </form>
            )
          )}

          {/* ADMIN LOGIN FORM (Gmail + Password) */}
          {activeTab === 'user' ? null : (
            <form onSubmit={handleAdminSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-textSecondary">Admin Gmail</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-textSecondary">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="input-field !pl-11"
                    placeholder="Enter Admin Gmail"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-textSecondary">Password</label>
                  <button
                    type="button"
                    onClick={() => { setShowForgotModal(true); setError(''); setResetMsg(''); }}
                    className="text-xs text-secondary hover:underline transition-all"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-textSecondary">
                    <Lock size={18} />
                  </div>
                  <input
                    type="password"
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="input-field !pl-11"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-secondary text-white font-semibold rounded-lg shadow-lg hover:shadow-secondary/30 transition-all duration-300 mt-6 flex items-center justify-center"
              >
                {loading ? (
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  "Login to Admin Panel"
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* FORGOT PASSWORD MODAL */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel max-w-md w-full p-6 rounded-2xl relative">
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 text-textSecondary hover:text-white"
            >
              ✕
            </button>

            <h2 className="text-xl font-bold mb-1 text-white flex items-center space-x-2">
              <KeyRound className="text-secondary" size={22} />
              <span>Admin Password Recovery</span>
            </h2>
            <p className="text-sm text-textSecondary mb-6">
              A 6-digit verification code will be sent to your Gmail.
            </p>

            {resetMsg && (
              <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/40 text-green-400 text-sm flex items-start space-x-2">
                <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                <span>{resetMsg}</span>
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/40 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* STEP 1: Enter Email */}
            {forgotStep === 1 && (
              <form onSubmit={handleSendCode} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-textSecondary">Target Gmail Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-textSecondary">
                      <Mail size={18} />
                    </div>
                    <input
                      type="email"
                      required
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="input-field !pl-11"
                      placeholder="np03cy4a250116@heraldcollege.edu.np"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-secondary text-white font-semibold rounded-lg shadow-lg hover:shadow-secondary/30 transition-all flex items-center justify-center"
                >
                  {loading ? (
                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    "Send Verification Code"
                  )}
                </button>
              </form>
            )}

            {/* STEP 2: Enter Verification Code & New Password */}
            {forgotStep === 2 && (
              <form onSubmit={handleResetPassword} className="space-y-4">

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-textSecondary">6-Digit Verification Code</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className="input-field text-center font-mono text-xl tracking-widest"
                    placeholder="123456"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-textSecondary">New Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="input-field"
                    placeholder="Enter new admin password"
                  />
                </div>

                <div className="flex space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotStep(1)}
                    className="px-4 py-2.5 rounded-lg border border-slate-700 text-textSecondary hover:text-white transition-colors text-sm"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2.5 px-4 bg-gradient-to-r from-purple-600 to-secondary text-white font-semibold rounded-lg shadow-lg hover:shadow-secondary/30 transition-all text-sm flex items-center justify-center"
                  >
                    {loading ? (
                      <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      "Reset Password"
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
