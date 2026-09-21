'use client';

import React, { useEffect, useState, useMemo, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Plus, PackageOpen, AlertTriangle } from 'lucide-react';
import AdminHeader from '@/components/AdminHeader';
import SearchBar from '@/components/SearchBar';
import CategoryChips from '@/components/CategoryChips';
import AdminItemRow from '@/components/AdminItemRow';
import EditItemModal from '@/components/EditItemModal';
import SettingsModal from '@/components/SettingsModal';
import ToastContainer, { ToastMessage } from '@/components/Toast';
import { ItemType } from '@/components/ItemCard';

interface SettingsData {
  shopName: string;
  phoneNumber: string;
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs font-bold text-gray-400">Loading admin panel...</div>}>
      <AdminDashboardContent />
    </Suspense>
  );
}

function AdminDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [items, setItems] = useState<ItemType[]>([]);
  const [settings, setSettings] = useState<SettingsData>({
    shopName: 'KATHMANDU HARDWARE & SANITARY',
    phoneNumber: '+977-9841234567',
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Modals & Active state
  const [editingItem, setEditingItem] = useState<ItemType | null>(null);
  const [deletingItem, setDeletingItem] = useState<ItemType | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Toast notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Date.now().toString() + Math.random().toString();
    setToasts((prev) => [...prev, { id, type, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Check query params for success message
  useEffect(() => {
    const success = searchParams.get('success');
    if (success) {
      addToast('success', success);
      router.replace('/admin');
    }
  }, [searchParams, router]);

  // Fetch Items & Settings
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [itemsRes, settingsRes] = await Promise.all([
        fetch('/api/items', { cache: 'no-store' }),
        fetch('/api/settings', { cache: 'no-store' }),
      ]);

      if (itemsRes.status === 401) {
        router.push('/admin/login');
        return;
      }

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
    } catch {
      addToast('error', 'Failed to load catalog data');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Category listing
  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => {
      if (item.category && item.category.trim() !== '') {
        set.add(item.category.toUpperCase().trim());
      }
    });
    return Array.from(set).sort();
  }, [items]);

  // Filter items
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

  // Quick Price Edit handler
  const handleQuickPriceSave = async (id: string, newPrice: number) => {
    try {
      const res = await fetch(`/api/items/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: newPrice }),
      });

      if (!res.ok) throw new Error('Failed to update price');

      const data = await res.json();
      setItems((prev) =>
        prev.map((it) => (it._id === id ? { ...it, price: data.item.price } : it))
      );
      addToast('success', `Price updated to Rs. ${newPrice}`);
    } catch {
      addToast('error', 'Error updating price');
      throw new Error();
    }
  };

  // Quick Stock Toggle handler
  const handleStockToggle = async (id: string, currentStock: boolean) => {
    const newStock = !currentStock;
    try {
      // Optimistic update
      setItems((prev) =>
        prev.map((it) => (it._id === id ? { ...it, inStock: newStock } : it))
      );

      const res = await fetch(`/api/items/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inStock: newStock }),
      });

      if (!res.ok) throw new Error();

      addToast(
        'info',
        newStock ? 'Item marked In Stock' : 'Item marked Out of Stock'
      );
    } catch {
      // Revert on error
      setItems((prev) =>
        prev.map((it) => (it._id === id ? { ...it, inStock: currentStock } : it))
      );
      addToast('error', 'Failed to toggle stock status');
    }
  };

  // Priority Reorder handler
  const handleMovePriority = async (id: string, direction: 'up' | 'down' | 'top') => {
    const currentIndex = items.findIndex((it) => it._id === id);
    if (currentIndex === -1) return;

    const newItems = [...items];

    if (direction === 'top') {
      const [itemToMove] = newItems.splice(currentIndex, 1);
      newItems.unshift(itemToMove);
    } else if (direction === 'up' && currentIndex > 0) {
      const temp = newItems[currentIndex];
      newItems[currentIndex] = newItems[currentIndex - 1];
      newItems[currentIndex - 1] = temp;
    } else if (direction === 'down' && currentIndex < newItems.length - 1) {
      const temp = newItems[currentIndex];
      newItems[currentIndex] = newItems[currentIndex + 1];
      newItems[currentIndex + 1] = temp;
    } else {
      return;
    }

    // Assign priorities: 10, 20, 30...
    const reorderPayload = newItems.map((it, idx) => ({
      id: it._id,
      priority: (idx + 1) * 10,
    }));

    // Update local state immediately
    const updatedStateItems = newItems.map((it, idx) => ({
      ...it,
      priority: (idx + 1) * 10,
    }));
    setItems(updatedStateItems);

    try {
      const res = await fetch('/api/items/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: reorderPayload }),
      });

      if (!res.ok) throw new Error();
      addToast('success', 'Order updated successfully');
    } catch {
      addToast('error', 'Failed to save new order');
      fetchData(); // Rollback to server state
    }
  };

  // Full Edit Save handler
  const handleEditSave = async (
    updatedFields: Partial<ItemType> & { newImageBase64?: string }
  ) => {
    if (!editingItem) return;

    try {
      let imageUrl = editingItem.imageUrl;
      let imagePublicId = editingItem.imagePublicId;

      if (updatedFields.newImageBase64) {
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: updatedFields.newImageBase64 }),
        });

        if (!uploadRes.ok) throw new Error('Image upload failed');
        const uploadData = await uploadRes.json();
        imageUrl = uploadData.imageUrl;
        imagePublicId = uploadData.imagePublicId;
      }

      const res = await fetch(`/api/items/${editingItem._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: updatedFields.name,
          price: updatedFields.price,
          unit: updatedFields.unit,
          category: updatedFields.category,
          priority: updatedFields.priority,
          inStock: updatedFields.inStock,
          ...(updatedFields.newImageBase64 ? { imageUrl, imagePublicId } : {}),
        }),
      });

      if (!res.ok) throw new Error('Update failed');

      const data = await res.json();
      setItems((prev) =>
        prev.map((it) => (it._id === editingItem._id ? data.item : it))
      );
      addToast('success', 'Item updated successfully');
    } catch (err) {
      throw err;
    }
  };

  // Delete Item handler
  const confirmDelete = async () => {
    if (!deletingItem) return;

    try {
      setIsDeleting(true);
      const res = await fetch(`/api/items/${deletingItem._id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error();

      setItems((prev) => prev.filter((it) => it._id !== deletingItem._id));
      addToast('success', `Deleted "${deletingItem.name}"`);
      setDeletingItem(null);
    } catch {
      addToast('error', 'Failed to delete item');
    } finally {
      setIsDeleting(false);
    }
  };

  // Settings Save handler
  const handleSettingsSave = async (data: {
    shopName: string;
    phoneNumber: string;
    updateTimestamp: boolean;
  }) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error('Settings update failed');
      const updated = await res.json();
      setSettings(updated.settings);
      addToast('success', 'Shop settings updated');
    } catch (err) {
      throw err;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F5F7] pb-24">
      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Admin Header */}
      <AdminHeader
        shopName={settings.shopName}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Sticky Search & Category Bar */}
      <div className="sticky top-[58px] z-30 bg-white border-b border-gray-200 px-4 pt-3 pb-1 shadow-sm">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Filter admin items..."
        />
        <CategoryChips
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
      </div>

      {/* Main Admin List Content */}
      <main className="flex-1 p-3.5 sm:p-4">
        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-28 bg-white rounded-xl border border-gray-200 animate-pulse"
              />
            ))}
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                {filteredItems.length} Products in List
              </span>
              <span className="text-[11px] text-gray-400 font-medium">
                Tip: Tap price for instant edit
              </span>
            </div>

            {filteredItems.map((item, idx) => (
              <AdminItemRow
                key={item._id}
                item={item}
                index={idx}
                totalCount={filteredItems.length}
                onQuickPriceSave={handleQuickPriceSave}
                onStockToggle={handleStockToggle}
                onMovePriority={handleMovePriority}
                onEdit={setEditingItem}
                onDelete={setDeletingItem}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mb-3">
              <PackageOpen size={32} />
            </div>
            <h3 className="text-base font-bold text-[#1A1A1A] uppercase">
              No Items Found
            </h3>
            <p className="text-xs text-gray-500 mt-1 max-w-xs">
              {searchQuery
                ? `No matching items for "${searchQuery}".`
                : 'Your inventory is empty. Tap the red + button below to add your first item!'}
            </p>
          </div>
        )}
      </main>

      {/* Floating Add Item Button (Fixed Bottom-Right, Admin Only) */}
      <div className="fixed safe-bottom-fixed right-4 z-40">
        <Link
          href="/admin/add"
          id="floating-add-item-button"
          aria-label="Add new item"
          className="flex items-center justify-center w-14 h-14 bg-[#D32F2F] hover:bg-[#B71C1C] active:bg-[#B71C1C] text-white rounded-full shadow-[0_4px_16px_rgba(211,47,47,0.4)] transition-all hover:scale-105 active:scale-95 border-2 border-white"
        >
          <Plus size={30} strokeWidth={2.5} />
        </Link>
      </div>

      {/* Edit Modal */}
      {editingItem && (
        <EditItemModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSave={handleEditSave}
        />
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal
          initialShopName={settings.shopName}
          initialPhoneNumber={settings.phoneNumber}
          onClose={() => setIsSettingsOpen(false)}
          onSave={handleSettingsSave}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
          <div className="relative w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl animate-slide-up flex flex-col items-center text-center">
            <div className="w-14 h-14 bg-red-50 text-[#D32F2F] rounded-full flex items-center justify-center mb-3">
              <AlertTriangle size={28} />
            </div>

            <h3 className="text-base font-black uppercase text-[#1A1A1A]">
              Delete Item?
            </h3>
            <p className="text-xs text-gray-600 mt-1 mb-6">
              Are you sure you want to permanently delete{' '}
              <strong className="text-[#1A1A1A] uppercase">&quot;{deletingItem.name}&quot;</strong>? This will also remove the photo from Cloudinary.
            </p>

            <div className="flex gap-2.5 w-full">
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex-1 bg-[#D32F2F] hover:bg-[#B71C1C] text-white font-bold py-3 px-4 rounded-xl shadow-md text-xs transition-all min-h-[44px]"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                disabled={isDeleting}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 px-4 rounded-xl text-xs transition-all min-h-[44px]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
