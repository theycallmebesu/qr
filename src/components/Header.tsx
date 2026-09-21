'use client';

import React from 'react';
import Link from 'next/link';
import { Phone, Lock } from 'lucide-react';

interface HeaderProps {
  shopName: string;
  phoneNumber: string;
}

export default function Header({ shopName, phoneNumber }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-[#D32F2F] text-white shadow-md pt-[max(0.6rem,env(safe-area-inset-top))] pb-3 px-4">
      {/* Top row: Shop Title and Fixed Admin Lock Button */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-red-100">
              Live Price List
            </span>
          </div>
          <h1 className="text-lg sm:text-xl font-black tracking-tight leading-tight truncate uppercase text-white drop-shadow-sm">
            {shopName || 'HARDWARE & SANITARY'}
          </h1>
        </div>

        {/* Fixed Admin Button */}
        <Link
          href="/admin"
          id="admin-nav-button"
          aria-label="Admin Access"
          className="flex items-center gap-1.5 bg-black/25 active:bg-black/40 hover:bg-black/35 text-white text-xs font-bold px-3 py-2 rounded-full border border-white/25 backdrop-blur-sm transition-all shadow-sm shrink-0 min-h-[40px]"
        >
          <Lock size={14} className="text-red-100" />
          <span>Admin</span>
        </Link>
      </div>

      {/* Tap to dial call shop button */}
      {phoneNumber && (
        <div className="mt-2.5">
          <a
            href={`tel:${phoneNumber.replace(/\s+/g, '')}`}
            id="call-shop-button"
            className="flex items-center justify-center gap-2 w-full bg-white/15 hover:bg-white/20 active:bg-white/30 text-white text-xs font-semibold py-1.5 px-3 rounded-lg border border-white/20 transition-all min-h-[36px]"
          >
            <Phone size={14} className="text-white" />
            <span>Call Shop: <span className="font-bold underline tracking-wide">{phoneNumber}</span></span>
          </a>
        </div>
      )}
    </header>
  );
}
