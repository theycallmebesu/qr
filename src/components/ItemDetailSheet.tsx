'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { X, Package, CheckCircle2, AlertCircle, Calendar, Tag, Phone } from 'lucide-react';
import { ItemType } from './ItemCard';
import { formatNPR } from '@/lib/formatNPR';

interface ItemDetailSheetProps {
  item: ItemType | null;
  onClose: () => void;
  phoneNumber?: string;
}

export default function ItemDetailSheet({
  item,
  onClose,
  phoneNumber,
}: ItemDetailSheetProps) {
  const [imgError, setImgError] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!item) return null;

  const formattedDate = item.updatedAt
    ? new Date(item.updatedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-0 sm:p-4">
      {/* Backdrop tap to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal / Bottom Sheet Box */}
      <div className="relative w-full max-w-lg bg-white rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto z-10 shadow-2xl animate-slide-up flex flex-col pb-[max(1rem,env(safe-area-inset-bottom))]">
        {/* Mobile handle indicator */}
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto my-2.5 sm:hidden" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close sheet"
          className="absolute top-3 right-3 z-20 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center backdrop-blur-sm"
        >
          <X size={20} />
        </button>

        {/* Large Photo Section */}
        <div className="relative aspect-video sm:aspect-square w-full bg-gray-100 max-h-[360px]">
          {item.imageUrl && !imgError ? (
            <Image
              src={item.imageUrl}
              alt={item.name}
              fill
              sizes="(max-width: 640px) 100vw, 500px"
              priority
              className="object-contain sm:object-cover bg-gray-900/5"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 text-gray-400 p-6">
              <Package size={56} strokeWidth={1.5} />
              <p className="text-xs uppercase tracking-wider font-bold mt-2 text-gray-400">
                {item.category || 'Hardware Item'}
              </p>
            </div>
          )}

          {/* Out of Stock Overlay */}
          {!item.inStock && (
            <div className="absolute top-3 left-3 bg-red-600 text-white font-black text-xs uppercase tracking-wider px-3 py-1 rounded shadow-md border border-white">
              OUT OF STOCK
            </div>
          )}
        </div>

        {/* Details Content */}
        <div className="p-5 flex flex-col gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-red-50 text-[#D32F2F] border border-red-100">
                <Tag size={12} />
                {item.category || 'GENERAL'}
              </span>

              {item.inStock ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
                  <CheckCircle2 size={12} />
                  In Stock
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                  <AlertCircle size={12} />
                  Currently Unavailable
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-[#1A1A1A] leading-tight uppercase tracking-tight">
              {item.name}
            </h2>
          </div>

          {/* Prominent Price Box */}
          <div className="bg-red-50/70 border border-red-100 rounded-xl p-4 flex items-baseline justify-between">
            <div>
              <span className="text-xs uppercase font-bold text-gray-500 block mb-0.5">
                Current Shop Rate
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-[#D32F2F] tracking-tight">
                  {formatNPR(item.price)}
                </span>
                <span className="text-sm font-bold text-gray-600 uppercase">
                  / {item.unit || 'PIECE'}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] font-bold text-gray-400 block uppercase">
                Per Unit
              </span>
              <span className="text-sm font-extrabold text-[#1A1A1A] uppercase">
                {item.unit || 'PIECE'}
              </span>
            </div>
          </div>

          {/* Last Updated Date */}
          {formattedDate && (
            <div className="flex items-center gap-2 text-xs text-gray-500 border-t border-gray-100 pt-3">
              <Calendar size={14} className="text-gray-400" />
              <span>
                Price verified: <strong className="text-gray-700">{formattedDate}</strong>
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
            {phoneNumber && (
              <a
                href={`tel:${phoneNumber.replace(/\s+/g, '')}`}
                className="flex-1 flex items-center justify-center gap-2 bg-[#D32F2F] hover:bg-[#B71C1C] active:bg-[#B71C1C] text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all text-sm min-h-[48px]"
              >
                <Phone size={16} />
                <span>Call Shop to Order / Inquire</span>
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial py-3 px-5 border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold rounded-xl text-sm transition-all min-h-[48px]"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
