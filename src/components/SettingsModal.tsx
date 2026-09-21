'use client';

import React, { useState } from 'react';
import { X, Store, Phone, Clock, Save } from 'lucide-react';

interface SettingsModalProps {
  initialShopName: string;
  initialPhoneNumber: string;
  onClose: () => void;
  onSave: (data: { shopName: string; phoneNumber: string; updateTimestamp: boolean }) => Promise<void>;
}

export default function SettingsModal({
  initialShopName,
  initialPhoneNumber,
  onClose,
  onSave,
}: SettingsModalProps) {
  const [shopName, setShopName] = useState(initialShopName);
  const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber);
  const [updateTimestamp, setUpdateTimestamp] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName.trim()) {
      setError('Shop name is required');
      return;
    }

    try {
      setSaving(true);
      setError('');
      await onSave({
        shopName: shopName.trim(),
        phoneNumber: phoneNumber.trim(),
        updateTimestamp,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl z-10 overflow-hidden animate-slide-up">
        <div className="bg-[#D32F2F] text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Store size={20} />
            <h2 className="text-base font-black uppercase tracking-tight">
              Shop Configuration
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-white/80 hover:text-white rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mx-5 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5 flex items-center gap-1.5">
              <Store size={14} />
              <span>Shop Name</span>
            </label>
            <input
              type="text"
              required
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="e.g. KATHMANDU HARDWARE & SANITARY"
              className="w-full px-3.5 py-2.5 bg-gray-50 focus:bg-white border border-gray-300 focus:border-[#D32F2F] text-sm text-[#1A1A1A] rounded-xl outline-none font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5 flex items-center gap-1.5">
              <Phone size={14} />
              <span>Phone Number (Tap-to-call)</span>
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="e.g. +977-9841234567"
              className="w-full px-3.5 py-2.5 bg-gray-50 focus:bg-white border border-gray-300 focus:border-[#D32F2F] text-sm text-[#1A1A1A] rounded-xl outline-none font-medium"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="timestamp-refresh-checkbox"
              checked={updateTimestamp}
              onChange={(e) => setUpdateTimestamp(e.target.checked)}
              className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
            />
            <label
              htmlFor="timestamp-refresh-checkbox"
              className="text-xs font-semibold text-gray-700 select-none flex items-center gap-1"
            >
              <Clock size={12} className="text-gray-400" />
              <span>Refresh &quot;Prices Last Updated&quot; timestamp now</span>
            </label>
          </div>

          <div className="pt-3 border-t border-gray-100 flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-[#D32F2F] hover:bg-[#B71C1C] active:bg-[#B71C1C] text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all text-sm flex items-center justify-center gap-2 min-h-[48px]"
            >
              <Save size={16} />
              <span>{saving ? 'Saving...' : 'Save Settings'}</span>
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
