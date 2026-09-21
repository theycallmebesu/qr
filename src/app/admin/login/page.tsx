'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, Eye, EyeOff, ArrowLeft, ShieldAlert } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        router.push('/admin');
        router.refresh();
      } else {
        setErrorMessage(data.error || 'Invalid admin password');
      }
    } catch {
      setErrorMessage('Network error during login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F5F7] flex flex-col justify-between p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      {/* Back to shop navigation */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-[#D32F2F] bg-white px-3 py-2 rounded-lg border border-gray-200 transition-colors shadow-sm"
        >
          <ArrowLeft size={16} />
          <span>Back to Live Price List</span>
        </Link>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-sm mx-auto my-auto bg-white rounded-2xl border border-gray-200 shadow-xl p-6 sm:p-8 animate-fade-in">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 bg-red-50 text-[#D32F2F] rounded-2xl flex items-center justify-center mb-3 shadow-inner ring-4 ring-red-50">
            <Lock size={28} />
          </div>
          <h1 className="text-xl font-black uppercase tracking-tight text-[#1A1A1A]">
            Admin Control Panel
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Enter your master shop password to manage prices, inventory, and items.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold flex items-start gap-2 animate-fade-in">
            <ShieldAlert size={16} className="shrink-0 mt-0.5 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="admin-password-input"
              className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5"
            >
              Shop Password
            </label>
            <div className="relative">
              <input
                id="admin-password-input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
                autoFocus
                required
                className="w-full pl-3.5 pr-11 py-3 bg-gray-50 focus:bg-white border border-gray-300 focus:border-[#D32F2F] text-sm text-[#1A1A1A] rounded-xl outline-none transition-all focus:ring-2 focus:ring-red-100 font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            id="login-submit-button"
            disabled={loading || !password.trim()}
            className="w-full bg-[#D32F2F] hover:bg-[#B71C1C] active:bg-[#B71C1C] disabled:bg-gray-300 text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition-all text-sm flex items-center justify-center gap-2 min-h-[48px] mt-2 cursor-pointer"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>Unlock Admin Panel</span>
            )}
          </button>
        </form>
      </div>

      {/* Safety notice */}
      <div className="text-center text-[11px] text-gray-400 font-medium">
        Secured with encrypted token authentication & rate limiting.
      </div>
    </div>
  );
}
