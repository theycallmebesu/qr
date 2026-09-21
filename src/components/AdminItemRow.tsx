'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  ArrowUp,
  ArrowDown,
  ArrowUpToLine,
  Edit2,
  Trash2,
  Package,
  Check,
  X,
} from 'lucide-react';
import { ItemType } from './ItemCard';
import { formatNPR } from '@/lib/formatNPR';

interface AdminItemRowProps {
  item: ItemType;
  index: number;
  totalCount: number;
  onQuickPriceSave: (id: string, newPrice: number) => Promise<void>;
  onStockToggle: (id: string, currentStock: boolean) => Promise<void>;
  onMovePriority: (id: string, direction: 'up' | 'down' | 'top') => Promise<void>;
  onEdit: (item: ItemType) => void;
  onDelete: (item: ItemType) => void;
}

export default function AdminItemRow({
  item,
  index,
  totalCount,
  onQuickPriceSave,
  onStockToggle,
  onMovePriority,
  onEdit,
  onDelete,
}: AdminItemRowProps) {
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [priceInput, setPriceInput] = useState(item.price.toString());
  const [savingPrice, setSavingPrice] = useState(false);
  const [imgError, setImgError] = useState(false);

  const handlePriceSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const parsed = parseFloat(priceInput);
    if (isNaN(parsed) || parsed < 0) {
      setPriceInput(item.price.toString());
      setIsEditingPrice(false);
      return;
    }

    if (parsed === item.price) {
      setIsEditingPrice(false);
      return;
    }

    try {
      setSavingPrice(true);
      await onQuickPriceSave(item._id, parsed);
      setIsEditingPrice(false);
    } catch {
      setPriceInput(item.price.toString());
    } finally {
      setSavingPrice(false);
    }
  };

  return (
    <div
      className={`bg-white rounded-xl border transition-all p-3 flex flex-col gap-2.5 shadow-sm ${
        item.inStock ? 'border-gray-200' : 'border-amber-200 bg-amber-50/20'
      }`}
    >
      {/* Top Part: Thumbnail, Name, Priority Badge, Stock Toggle */}
      <div className="flex items-start gap-3">
        {/* Thumbnail */}
        <div className="relative w-14 h-14 rounded-lg bg-gray-100 overflow-hidden shrink-0 border border-gray-200">
          {item.imageUrl && !imgError ? (
            <Image
              src={item.imageUrl}
              alt={item.name}
              fill
              sizes="56px"
              className="object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <Package size={24} />
            </div>
          )}
        </div>

        {/* Name & Metadata */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="bg-gray-100 text-gray-700 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">
              #{item.priority}
            </span>
            {item.category && (
              <span className="bg-red-50 text-[#D32F2F] text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">
                {item.category}
              </span>
            )}
            {!item.inStock && (
              <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">
                Out of Stock
              </span>
            )}
          </div>

          <h3 className="font-extrabold text-sm text-[#1A1A1A] uppercase tracking-tight truncate mt-1">
            {item.name}
          </h3>

          <span className="text-[11px] font-medium text-gray-500 uppercase">
            Unit: <strong>{item.unit || 'PIECE'}</strong>
          </span>
        </div>

        {/* Stock Toggle */}
        <div className="flex flex-col items-end shrink-0">
          <label
            htmlFor={`stock-toggle-${item._id}`}
            className="flex items-center gap-1.5 cursor-pointer select-none"
            title="Toggle in-stock status"
          >
            <span className="text-[10px] font-bold text-gray-500 uppercase hidden sm:inline">
              {item.inStock ? 'In Stock' : 'Stock Out'}
            </span>
            <input
              id={`stock-toggle-${item._id}`}
              type="checkbox"
              checked={item.inStock}
              onChange={() => onStockToggle(item._id, item.inStock)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
          </label>
        </div>
      </div>

      {/* Middle: Quick Inline Price Edit */}
      <div className="flex items-center justify-between bg-gray-50 p-2 rounded-lg border border-gray-100">
        <div className="flex items-center gap-2 flex-1">
          <span className="text-xs font-semibold text-gray-500">Price:</span>
          {isEditingPrice ? (
            <form onSubmit={handlePriceSubmit} className="flex items-center gap-1.5 flex-1 max-w-[200px]">
              <span className="text-xs font-bold text-gray-600">Rs.</span>
              <input
                type="number"
                step="any"
                min="0"
                inputMode="decimal"
                value={priceInput}
                onChange={(e) => setPriceInput(e.target.value)}
                autoFocus
                disabled={savingPrice}
                className="w-full px-2 py-1 bg-white border border-[#D32F2F] rounded text-sm font-bold text-[#1A1A1A] outline-none"
              />
              <button
                type="submit"
                disabled={savingPrice}
                className="p-1.5 bg-green-600 text-white rounded hover:bg-green-700 min-h-[32px] min-w-[32px] flex items-center justify-center"
                title="Save Price"
              >
                <Check size={14} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setPriceInput(item.price.toString());
                  setIsEditingPrice(false);
                }}
                disabled={savingPrice}
                className="p-1.5 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 min-h-[32px] min-w-[32px] flex items-center justify-center"
                title="Cancel"
              >
                <X size={14} />
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => {
                setPriceInput(item.price.toString());
                setIsEditingPrice(true);
              }}
              title="Tap to edit price quickly"
              className="flex items-baseline gap-1 group/price px-2 py-0.5 rounded hover:bg-white hover:border hover:border-red-200 transition-all text-left"
            >
              <span className="text-sm font-black text-[#D32F2F] tracking-tight group-hover/price:underline">
                {formatNPR(item.price)}
              </span>
              <span className="text-[10px] text-gray-400 font-bold uppercase">
                / {item.unit} (Tap to change)
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Bottom Controls: Priority Arrows, Move to Top, Edit, Delete */}
      <div className="flex items-center justify-between pt-1 border-t border-gray-100 gap-1">
        {/* Priority Reordering Buttons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={index === 0}
            onClick={() => onMovePriority(item._id, 'up')}
            title="Move Priority Up"
            aria-label="Move item priority up"
            className="p-2 text-gray-600 hover:text-black hover:bg-gray-100 active:bg-gray-200 disabled:opacity-30 disabled:hover:bg-transparent rounded-lg border border-gray-200 min-h-[36px] min-w-[36px] flex items-center justify-center"
          >
            <ArrowUp size={16} />
          </button>

          <button
            type="button"
            disabled={index === totalCount - 1}
            onClick={() => onMovePriority(item._id, 'down')}
            title="Move Priority Down"
            aria-label="Move item priority down"
            className="p-2 text-gray-600 hover:text-black hover:bg-gray-100 active:bg-gray-200 disabled:opacity-30 disabled:hover:bg-transparent rounded-lg border border-gray-200 min-h-[36px] min-w-[36px] flex items-center justify-center"
          >
            <ArrowDown size={16} />
          </button>

          <button
            type="button"
            disabled={index === 0}
            onClick={() => onMovePriority(item._id, 'top')}
            title="Move to Top"
            aria-label="Move item to very top"
            className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-gray-700 hover:text-black hover:bg-gray-100 active:bg-gray-200 disabled:opacity-30 disabled:hover:bg-transparent rounded-lg border border-gray-200 min-h-[36px]"
          >
            <ArrowUpToLine size={14} />
            <span className="hidden sm:inline">Top</span>
          </button>
        </div>

        {/* Edit & Delete */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onEdit(item)}
            className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-800 text-xs font-bold rounded-lg transition-colors min-h-[36px]"
          >
            <Edit2 size={14} />
            <span>Edit</span>
          </button>

          <button
            type="button"
            onClick={() => onDelete(item)}
            className="p-2 bg-red-50 hover:bg-red-100 active:bg-red-200 text-[#D32F2F] rounded-lg transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
            title="Delete item"
            aria-label="Delete item"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
