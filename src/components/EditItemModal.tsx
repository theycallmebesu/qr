'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { X, Camera, Image as ImageIcon, Save, Package } from 'lucide-react';
import { ItemType } from './ItemCard';
import { compressImage } from '@/lib/ImageCompressor';

interface EditItemModalProps {
  item: ItemType | null;
  onClose: () => void;
  onSave: (updatedItem: Partial<ItemType> & { newImageBase64?: string }) => Promise<void>;
}

const COMMON_UNITS = ['PIECE', 'KG', 'FT', 'BAG', 'BUNDLE', 'ROLL', 'SET', 'BOX', 'LITER', 'METER'];
const COMMON_CATEGORIES = ['PAINT', 'PIPE', 'TOOLS', 'CEMENT', 'ELECTRICAL', 'SANITARY', 'HARDWARE', 'FASTENERS'];

export default function EditItemModal({ item, onClose, onSave }: EditItemModalProps) {
  const [name, setName] = useState(item?.name || '');
  const [price, setPrice] = useState(item?.price.toString() || '');
  const [unit, setUnit] = useState(item?.unit || 'PIECE');
  const [category, setCategory] = useState(item?.category || 'GENERAL');
  const [priority, setPriority] = useState(item?.priority.toString() || '100');
  const [inStock, setInStock] = useState(item?.inStock ?? true);

  const [previewImage, setPreviewImage] = useState<string | null>(item?.imageUrl || null);
  const [newImageBase64, setNewImageBase64] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  if (!item) return null;

  const handleImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { dataUrl } = await compressImage(file, 1200, 0.8);
      setPreviewImage(dataUrl);
      setNewImageBase64(dataUrl);
    } catch {
      setError('Failed to process image');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Item name is required');
      return;
    }
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setError('Please enter a valid price (>= 0)');
      return;
    }

    try {
      setSaving(true);
      setError('');

      await onSave({
        name: name.toUpperCase().trim(),
        price: parsedPrice,
        unit: unit.toUpperCase().trim(),
        category: category.toUpperCase().trim(),
        priority: parseInt(priority, 10) || 100,
        inStock,
        ...(newImageBase64 ? { newImageBase64 } : {}),
      });

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-0 sm:p-4">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white rounded-t-2xl sm:rounded-2xl max-h-[92vh] overflow-y-auto z-10 shadow-2xl animate-slide-up flex flex-col">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-4 flex items-center justify-between z-10">
          <h2 className="text-base font-black uppercase tracking-tight text-[#1A1A1A]">
            Edit Item Details
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mx-5 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl">
            {error}
          </div>
        )}

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          {/* Photo Preview & Replacement */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
              Item Photo
            </label>
            <div className="flex items-center gap-4">
              <div className="relative w-24 h-24 rounded-xl bg-gray-100 overflow-hidden border border-gray-300 shrink-0">
                {previewImage ? (
                  <Image
                    src={previewImage}
                    alt={name || 'Item'}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <Package size={32} />
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <input
                  type="file"
                  ref={cameraInputRef}
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleImageFile}
                />
                <input
                  type="file"
                  ref={galleryInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageFile}
                />

                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-2 bg-[#D32F2F] text-white text-xs font-bold rounded-lg hover:bg-[#B71C1C] transition-colors"
                >
                  <Camera size={14} />
                  <span>Take New Photo</span>
                </button>

                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-200 transition-colors border border-gray-200"
                >
                  <ImageIcon size={14} />
                  <span>Choose from Gallery</span>
                </button>
              </div>
            </div>
          </div>

          {/* Item Name (forced uppercase) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
              Item Name *
            </label>
            <input
              type="text"
              required
              maxLength={60}
              style={{ textTransform: 'uppercase' }}
              value={name}
              onChange={(e) => setName(e.target.value.toUpperCase())}
              className="w-full px-3.5 py-2.5 bg-gray-50 focus:bg-white border border-gray-300 focus:border-[#D32F2F] text-sm text-[#1A1A1A] rounded-xl outline-none transition-all font-bold"
            />
          </div>

          {/* Price and Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                Price (NPR) *
              </label>
              <input
                type="number"
                step="any"
                min="0"
                inputMode="decimal"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 focus:bg-white border border-gray-300 focus:border-[#D32F2F] text-sm text-[#1A1A1A] rounded-xl outline-none font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                Unit
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value.toUpperCase())}
                className="w-full px-3 py-2.5 bg-gray-50 focus:bg-white border border-gray-300 focus:border-[#D32F2F] text-sm text-[#1A1A1A] rounded-xl outline-none font-bold"
              >
                {COMMON_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tag / Category and Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                Tag / Category *
              </label>
              <input
                type="text"
                list="category-suggestions"
                style={{ textTransform: 'uppercase' }}
                value={category}
                onChange={(e) => setCategory(e.target.value.toUpperCase())}
                placeholder="PIPE, BALUWA, CEMENT..."
                className="w-full px-3.5 py-2.5 bg-gray-50 focus:bg-white border border-gray-300 focus:border-[#D32F2F] text-sm text-[#1A1A1A] rounded-xl outline-none font-bold"
              />
              <datalist id="category-suggestions">
                {['PIPE', 'BALUWA', 'CEMENT', 'ROD', 'PAINT', 'TOOLS', 'SANITARY', 'ELECTRICAL', 'HARDWARE', 'BRICK', 'FASTENERS'].map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                Priority Rank
              </label>
              <input
                type="number"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                placeholder="100"
                className="w-full px-3.5 py-2.5 bg-gray-50 focus:bg-white border border-gray-300 focus:border-[#D32F2F] text-sm text-[#1A1A1A] rounded-xl outline-none font-medium"
              />
              <span className="text-[10px] text-gray-400">Lower = shown higher</span>
            </div>
          </div>

          {/* In Stock Checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="edit-instock-checkbox"
              checked={inStock}
              onChange={(e) => setInStock(e.target.checked)}
              className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
            />
            <label
              htmlFor="edit-instock-checkbox"
              className="text-xs font-bold text-gray-700 select-none uppercase"
            >
              Item is In Stock & Available
            </label>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-gray-200 flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-[#D32F2F] hover:bg-[#B71C1C] active:bg-[#B71C1C] text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all text-sm flex items-center justify-center gap-2 min-h-[48px]"
            >
              <Save size={16} />
              <span>{saving ? 'Saving...' : 'Save Item Changes'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-5 py-3 border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold rounded-xl text-sm transition-all min-h-[48px]"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
