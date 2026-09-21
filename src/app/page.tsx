'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Header from '@/components/Header';
import SearchBar from '@/components/SearchBar';
import CategoryChips from '@/components/CategoryChips';
import ItemCard, { ItemType } from '@/components/ItemCard';
import ItemDetailSheet from '@/components/ItemDetailSheet';
import SkeletonCard from '@/components/SkeletonCard';
import { PackageOpen, Sparkles } from 'lucide-react';

interface SettingsData {
  shopName: string;
  phoneNumber: string;
  pricesLastUpdated?: string;
}

export default function CustomerPriceListPage() {
  const [items, setItems] = useState<ItemType[]>([]);
  const [settings, setSettings] = useState<SettingsData>({
    shopName: 'HARDWARE & SANITARY STORE',
    phoneNumber: '+977-9841234567',
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [activeItem, setActiveItem] = useState<ItemType | null>(null);

  // Fetch items and settings
  const fetchData = async () => {
    try {
      setLoading(true);
      const [itemsRes, settingsRes] = await Promise.all([
        fetch('/api/items', { cache: 'no-store' }),
        fetch('/api/settings', { cache: 'no-store' }),
      ]);

      if (itemsRes.ok) {
        const itemsData = await itemsRes.json();
        setItems(itemsData.items || []);
      }

      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        if (settingsData.settings) {
          setSettings(settingsData.settings);
        }
      }
    } catch (err) {
      console.error('Failed to load shop catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute dynamic category list
  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => {
      if (item.category && item.category.trim() !== '') {
        set.add(item.category.toUpperCase().trim());
      }
    });
    return Array.from(set).sort();
  }, [items]);

  // Filtered items based on search and category
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesCategory =
        selectedCategory === 'ALL' ||
        (item.category && item.category.toUpperCase() === selectedCategory.toUpperCase());

      const matchesSearch =
        !searchQuery.trim() ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase().trim());

      return matchesCategory && matchesSearch;
    });
  }, [items, selectedCategory, searchQuery]);

  const formattedLastUpdated = settings.pricesLastUpdated
    ? new Date(settings.pricesLastUpdated).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : 'Recently';

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA]">
      {/* Top Red Header */}
      <Header
        shopName={settings.shopName}
        phoneNumber={settings.phoneNumber}
      />

      {/* Sticky Search & Category Bar */}
      <div className="sticky top-[76px] z-30 bg-white/95 backdrop-blur-md border-b border-gray-200 px-4 pt-3 pb-1 shadow-sm">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search items, paint, pipes, cement..."
        />
        <CategoryChips
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
      </div>

      {/* Main Grid Content Area */}
      <main className="flex-1 p-3.5 sm:p-4">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filteredItems.length > 0 ? (
          <>
            <div className="flex items-center justify-between px-1 mb-2.5">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Showing {filteredItems.length} {filteredItems.length === 1 ? 'Item' : 'Items'}
              </span>
              {selectedCategory !== 'ALL' && (
                <span className="text-[11px] font-bold text-[#D32F2F] bg-red-50 px-2 py-0.5 rounded uppercase">
                  {selectedCategory}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
              {filteredItems.map((item) => (
                <ItemCard
                  key={item._id}
                  item={item}
                  onOpenDetail={setActiveItem}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-16 h-16 bg-red-50 text-[#D32F2F] rounded-full flex items-center justify-center mb-3">
              <PackageOpen size={32} />
            </div>
            <h3 className="text-base font-bold text-[#1A1A1A] uppercase">
              No Items Found
            </h3>
            <p className="text-xs text-gray-500 mt-1 max-w-xs">
              {searchQuery
                ? `No results matching "${searchQuery}". Try a different keyword.`
                : 'No hardware items available in this category currently.'}
            </p>
            {(searchQuery || selectedCategory !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('ALL');
                }}
                className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-lg transition-colors"
              >
                Reset Filters
              </button>
            )}
          </div>
        )}
      </main>

      {/* Item Detail Bottom Sheet */}
      <ItemDetailSheet
        item={activeItem}
        onClose={() => setActiveItem(null)}
        phoneNumber={settings.phoneNumber}
      />

      {/* Footer */}
      <footer className="mt-auto bg-white border-t border-gray-200 py-3.5 px-4 text-center text-xs text-gray-500">
        <div className="flex items-center justify-center gap-1.5 font-medium">
          <Sparkles size={13} className="text-[#D32F2F]" />
          <span>Prices updated: <strong className="text-gray-700">{formattedLastUpdated}</strong></span>
        </div>
        <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider font-semibold">
          {settings.shopName} • Live Catalog
        </p>
      </footer>
    </div>
  );
}
