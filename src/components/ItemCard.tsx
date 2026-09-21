'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Package, Eye } from 'lucide-react';
import { formatNPR } from '@/lib/formatNPR';

export interface ItemType {
  _id: string;
  name: string;
  price: number;
  unit: string;
  category?: string;
  imageUrl?: string;
  imagePublicId?: string;
  priority: number;
  inStock: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface ItemCardProps {
  item: ItemType;
  onOpenDetail: (item: ItemType) => void;
}

export default function ItemCard({ item, onOpenDetail }: ItemCardProps) {
  const [imageError, setImageError] = useState(false);
  const isOutOfStock = item.inStock === false;

  return (
    <div
      onClick={() => onOpenDetail(item)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpenDetail(item);
        }
      }}
      className={`group relative bg-white rounded-xl border transition-all duration-200 overflow-hidden flex flex-col cursor-pointer select-none text-left ${
        isOutOfStock
          ? 'border-gray-200 opacity-75 grayscale-[0.5] bg-gray-50'
          : 'border-gray-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.05)] hover:shadow-md hover:border-red-200 active:scale-[0.98]'
      }`}
    >
      {/* Square Image Container */}
      <div className="relative aspect-square w-full bg-gray-100 overflow-hidden">
        {item.imageUrl && !imageError ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            loading="lazy"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 text-gray-400">
            <Package size={36} strokeWidth={1.5} />
            <span className="text-[10px] uppercase font-semibold mt-1 tracking-wider text-gray-400">
              {item.category || 'Hardware'}
            </span>
          </div>
        )}

        {/* Category Tag (Top Left) */}
        {item.category && item.category !== 'GENERAL' && (
          <span className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
            {item.category}
          </span>
        )}

        {/* OUT OF STOCK Ribbon */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-2">
            <span className="bg-red-600 text-white text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded shadow-lg transform -rotate-6 border border-white">
              OUT OF STOCK
            </span>
          </div>
        )}

        {/* Quick View Hover Indicator */}
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white rounded-full p-1.5 backdrop-blur-sm">
          <Eye size={14} />
        </div>
      </div>

      {/* Content Section */}
      <div className="p-3 flex flex-col flex-1 justify-between gap-1.5">
        {/* UPPERCASE Item Name */}
        <h3 className="font-extrabold text-[13px] sm:text-sm text-[#1A1A1A] leading-snug line-clamp-2 uppercase tracking-tight">
          {item.name}
        </h3>

        {/* Price & Unit */}
        <div className="pt-1 mt-auto border-t border-gray-100">
          <div className="flex items-baseline flex-wrap gap-x-1">
            <span className="text-base sm:text-lg font-black text-[#D32F2F] tracking-tight">
              {formatNPR(item.price)}
            </span>
            <span className="text-[11px] font-bold text-gray-500 uppercase">
              / {item.unit || 'PIECE'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
