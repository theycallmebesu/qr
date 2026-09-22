import React, { useState } from 'react';
import { Edit2, Trash2, CheckCircle2, XCircle, Tag as TagIcon, Check, X, Image as ImageIcon } from 'lucide-react';
import { HardwareItem } from '../types';

interface ItemCardProps {
  item: HardwareItem;
  isAdmin: boolean;
  onEdit: (item: HardwareItem) => void;
  onDelete: (id: string) => void;
  onQuickPriceUpdate: (id: string, newPrice: number) => Promise<void>;
}

export const ItemCard: React.FC<ItemCardProps> = ({
  item,
  isAdmin,
  onEdit,
  onDelete,
  onQuickPriceUpdate,
}) => {
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [quickPrice, setQuickPrice] = useState(String(item.price));
  const [isSavingPrice, setIsSavingPrice] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleSavePrice = async () => {
    const num = parseFloat(quickPrice);
    if (!isNaN(num) && num >= 0 && item._id) {
      setIsSavingPrice(true);
      await onQuickPriceUpdate(item._id, num);
      setIsSavingPrice(false);
      setIsEditingPrice(false);
    }
  };

  const itemId = item._id || item.id || '';

  return (
    <div className="bg-white rounded-2xl border border-red-100/80 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between group">
      <div>
        {/* Top: Image & Tag Header */}
        <div className="relative aspect-[16/10] bg-gray-100 overflow-hidden">
          {item.imageUrl && !imageError ? (
            <img
              src={item.imageUrl}
              alt={item.name}
              onError={() => setImageError(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 text-red-300">
              <ImageIcon className="w-10 h-10 mb-1" />
              <span className="text-[11px] font-semibold text-red-400">श्री पशुपतिनाथ</span>
            </div>
          )}

          {/* Tag Pill */}
          <div className="absolute top-2.5 left-2.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white/95 text-red-700 shadow-sm backdrop-blur-md border border-red-100">
              <TagIcon className="w-3 h-3 text-red-500" />
              {item.tag}
            </span>
          </div>

          {/* Stock Status Badge */}
          <div className="absolute top-2.5 right-2.5">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm backdrop-blur-md ${
                item.inStock
                  ? 'bg-emerald-500/90 text-white'
                  : 'bg-red-500/90 text-white'
              }`}
            >
              {item.inStock ? (
                <>
                  <CheckCircle2 className="w-3 h-3" /> In Stock
                </>
              ) : (
                <>
                  <XCircle className="w-3 h-3" /> Out of Stock
                </>
              )}
            </span>
          </div>
        </div>

        {/* Content: Title & Description */}
        <div className="p-3.5 sm:p-4">
          <h3 className="font-bold text-gray-900 text-sm sm:text-base leading-snug line-clamp-2 mb-1 group-hover:text-red-600 transition-colors">
            {item.name}
          </h3>

          {item.description && (
            <p className="text-xs text-gray-500 line-clamp-2 mb-2 font-normal">
              {item.description}
            </p>
          )}
        </div>
      </div>

      {/* Bottom: Price Box & Admin Actions */}
      <div className="p-3.5 sm:p-4 pt-0">
        <div className="bg-red-50/70 border border-red-100 rounded-xl p-2.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-red-500 block">
              Current Rate / Price
            </span>
            
            {isEditingPrice ? (
              <div className="flex items-center gap-1 mt-1">
                <span className="text-xs font-bold text-red-700">Rs.</span>
                <input
                  type="number"
                  value={quickPrice}
                  onChange={(e) => setQuickPrice(e.target.value)}
                  className="w-20 px-1.5 py-0.5 text-xs font-bold bg-white border border-red-300 rounded focus:ring-1 focus:ring-red-500 outline-none"
                  autoFocus
                />
                <button
                  onClick={handleSavePrice}
                  disabled={isSavingPrice}
                  className="p-1 rounded bg-red-600 text-white hover:bg-red-700"
                >
                  <Check className="w-3 h-3" />
                </button>
                <button
                  onClick={() => {
                    setQuickPrice(String(item.price));
                    setIsEditingPrice(false);
                  }}
                  className="p-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-base sm:text-lg font-extrabold text-red-700">
                  Rs. {Number(item.price).toLocaleString('en-IN')}
                </span>
                <span className="text-[11px] font-semibold text-gray-600">
                  / {item.unit || 'piece'}
                </span>
              </div>
            )}
          </div>

          {/* Admin Controls */}
          {isAdmin && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsEditingPrice(!isEditingPrice)}
                title="Quick price edit"
                className="p-1.5 rounded-lg bg-white hover:bg-red-100 text-red-600 border border-red-200 transition"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onEdit(item)}
                title="Edit item details"
                className="px-2 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs transition"
              >
                Edit
              </button>
              <button
                onClick={() => {
                  if (confirm(`Are you sure you want to delete "${item.name}"?`)) {
                    onDelete(itemId);
                  }
                }}
                title="Delete item"
                className="p-1.5 rounded-lg bg-white hover:bg-rose-100 text-rose-600 border border-rose-200 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
