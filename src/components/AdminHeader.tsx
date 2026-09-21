'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut, Settings as SettingsIcon, ExternalLink } from 'lucide-react';

interface AdminHeaderProps {
  shopName: string;
  onOpenSettings: () => void;
}

export default function AdminHeader({ shopName, onOpenSettings }: AdminHeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
      router.refresh();
    } catch (err) {
      console.error('Logout error:', err);
      router.push('/');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#D32F2F] text-white shadow-md pt-[max(0.6rem,env(safe-area-inset-top))] pb-3 px-4">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 pr-2">
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-yellow-300" />
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-red-100">
              Admin Mode
            </span>
          </div>
          <h1 className="text-base sm:text-lg font-black tracking-tight leading-tight truncate uppercase text-white">
            {shopName || 'STORE DASHBOARD'}
          </h1>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onOpenSettings}
            title="Shop Settings"
            aria-label="Open shop settings"
            className="p-2 bg-black/20 hover:bg-black/30 active:bg-black/40 text-white rounded-lg transition-colors border border-white/10 min-h-[40px] min-w-[40px] flex items-center justify-center"
          >
            <SettingsIcon size={18} />
          </button>

          <Link
            href="/"
            title="Customer View"
            aria-label="View public price list"
            className="p-2 bg-black/20 hover:bg-black/30 active:bg-black/40 text-white rounded-lg transition-colors border border-white/10 min-h-[40px] min-w-[40px] flex items-center justify-center"
          >
            <ExternalLink size={18} />
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            title="Logout"
            aria-label="Logout"
            className="flex items-center gap-1 bg-black/35 hover:bg-black/50 active:bg-black/60 text-white text-xs font-bold px-2.5 py-2 rounded-lg transition-colors border border-white/20 min-h-[40px]"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
