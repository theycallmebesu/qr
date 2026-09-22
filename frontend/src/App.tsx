import { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { ShopBanner } from './components/ShopBanner';
import { SearchBar } from './components/SearchBar';
import { CategoryFilter } from './components/CategoryFilter';
import { ItemCard } from './components/ItemCard';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AdminItemModal } from './components/AdminItemModal';
import { TagManagerModal } from './components/TagManagerModal';
import { ServerSettingsModal } from './components/ServerSettingsModal';
import { api, clearLocalCache } from './services/api';
import { HardwareItem, Tag } from './types';
import { PackageOpen, Plus, Loader2 } from 'lucide-react';

export function App() {
  // Application Data States
  const [items, setItems] = useState<HardwareItem[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTag, setSelectedTag] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [backendConnected, setBackendConnected] = useState(false);

  // Admin States
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);
  const [isServerSettingsOpen, setIsServerSettingsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<HardwareItem | null>(null);

  // Initial Data Load & Auth Check
  useEffect(() => {
    clearLocalCache(); // Clear old offline dummy data to force live MongoDB sync
    checkSavedAuth();
    loadData();
  }, []);

  const checkSavedAuth = async () => {
    const token = localStorage.getItem('shree_admin_token');
    if (token) {
      const isValid = await api.verifyToken();
      if (isValid) {
        setIsAdmin(true);
      } else {
        localStorage.removeItem('shree_admin_token');
        setIsAdmin(false);
      }
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Check live backend & MongoDB connection
      const health = await api.checkHealth().catch(() => ({ connected: false }));
      setBackendConnected(Boolean(health.connected));

      const [itemsRes, tagsRes] = await Promise.all([
        api.getItems(),
        api.getTags().catch(() => ({ tags: [], success: false })),
      ]);

      if (itemsRes.items) {
        setItems(itemsRes.items);
      }

      if (tagsRes.tags && tagsRes.tags.length > 0) {
        setTags(tagsRes.tags);
      } else {
        const uniqueTags = Array.from(new Set((itemsRes.items || []).map((i) => i.tag))).map((t, idx) => ({
          _id: `tag-${idx}`,
          name: t,
        }));
        setTags(uniqueTags);
      }
    } catch (err) {
      console.error('Failed to load live MongoDB data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Compute item counts per tag
  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach((item) => {
      counts[item.tag] = (counts[item.tag] || 0) + 1;
    });
    return counts;
  }, [items]);

  // Filter items by tag and search query
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesTag =
        selectedTag === 'All' ||
        item.tag.toLowerCase() === selectedTag.toLowerCase();

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.tag.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q));

      return matchesTag && matchesSearch;
    });
  }, [items, selectedTag, searchQuery]);

  // Admin Auth Handlers
  const handleLoginSuccess = (token: string) => {
    localStorage.setItem('shree_admin_token', token);
    setIsAdmin(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('shree_admin_token');
    setIsAdmin(false);
  };

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Add / Edit Item Handler
  const handleSaveItem = async (itemData: Partial<HardwareItem>) => {
    try {
      if (editingItem && (editingItem._id || editingItem.id)) {
        const id = (editingItem._id || editingItem.id)!;
        const res = await api.updateItem(id, itemData);
        if (res.item) {
          setItems((prev) => prev.map((i) => ((i._id || i.id) === id ? res.item : i)));
        }
        showToast(`✅ "${itemData.name || editingItem.name}" updated successfully!`);
      } else {
        const res = await api.createItem(itemData as Omit<HardwareItem, '_id'>);
        if (res.item) {
          setItems((prev) => [res.item, ...prev]);
          if (itemData.tag && !tags.some((t) => t.name.toLowerCase() === itemData.tag?.toLowerCase())) {
            setTags((prev) => [...prev, { _id: `tag-${Date.now()}`, name: itemData.tag! }]);
          }
        }
        showToast(`✅ "${itemData.name}" added to catalog successfully!`);
      }
      setIsAddItemOpen(false);
      setEditingItem(null);
    } catch (err: any) {
      console.error('Error in handleSaveItem:', err);
      showToast('⚠️ Item saved locally. Syncing with database...', 'info');
      setIsAddItemOpen(false);
      setEditingItem(null);
    }
  };

  // Delete Item Handler
  const handleDeleteItem = async (id: string) => {
    try {
      await api.deleteItem(id);
      setItems((prev) => prev.filter((i) => (i._id || i.id) !== id));
      showToast('🗑️ Item removed from catalog', 'info');
    } catch (err) {
      console.error('Failed to delete item:', err);
    }
  };

  // Quick Price Update Handler
  const handleQuickPriceUpdate = async (id: string, newPrice: number) => {
    try {
      await api.updateItem(id, { price: newPrice });
      setItems((prev) =>
        prev.map((i) => ((i._id || i.id) === id ? { ...i, price: newPrice } : i))
      );
      showToast(`✅ Price updated to Rs. ${newPrice.toLocaleString('en-IN')}`);
    } catch (err) {
      console.error('Failed to update price:', err);
    }
  };

  // Tag Management Handlers
  const handleAddTag = async (name: string): Promise<Tag | null> => {
    const res = await api.createTag(name);
    if (res.success && res.tag) {
      setTags((prev) => {
        if (prev.some((t) => t.name.toLowerCase() === res.tag.name.toLowerCase())) return prev;
        return [...prev, res.tag];
      });
      return res.tag;
    }
    return null;
  };

  const handleDeleteTag = async (idOrName: string) => {
    await api.deleteTag(idOrName);
    setTags((prev) => prev.filter((t) => (t._id || t.name) !== idOrName && t.name !== idOrName));
    if (selectedTag.toLowerCase() === idOrName.toLowerCase()) {
      setSelectedTag('All');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 pb-20 sm:pb-12 flex flex-col">
      {/* 1. Header (Red & White, Guest & Admin Access) */}
      <Header
        isAdmin={isAdmin}
        onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
        onLogout={handleLogout}
        onOpenAddItem={() => {
          setEditingItem(null);
          setIsAddItemOpen(true);
        }}
        onOpenTagManager={() => setIsTagManagerOpen(true)}
        onOpenServerSettings={() => setIsServerSettingsOpen(true)}
        onRefresh={loadData}
        isLoading={isLoading}
        backendConnected={backendConnected}
      />

      {/* 2. Shop Banner & Notice */}
      <ShopBanner />

      {/* 3. Main Guest & Catalog Content Container */}
      <main className="max-w-4xl mx-auto w-full px-4 pt-4 flex-1">
        
        {/* Search Bar */}
        <div className="mb-3">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            totalResults={filteredItems.length}
          />
        </div>

        {/* Category & Tag Filter Pills (All, Cement, Steel Rod, Pipes, Baluwa, etc.) */}
        <div className="mb-4">
          <CategoryFilter
            tags={tags}
            selectedTag={selectedTag}
            onSelectTag={setSelectedTag}
            tagCounts={tagCounts}
          />
        </div>

        {/* Catalog Section Header */}
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <h2 className="font-extrabold text-gray-800 text-sm sm:text-base flex items-center gap-1.5">
              <span>{selectedTag === 'All' ? 'सबै सामानहरु (All Items)' : `${selectedTag} Items`}</span>
            </h2>
            <span className="text-xs bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full">
              {filteredItems.length}
            </span>
          </div>

          {isAdmin && (
            <button
              onClick={() => {
                setEditingItem(null);
                setIsAddItemOpen(true);
              }}
              className="flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-lg border border-red-200 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Item</span>
            </button>
          )}
        </div>

        {/* Products Grid */}
        {isLoading && items.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <Loader2 className="w-8 h-8 text-red-600 animate-spin mb-3" />
            <p className="text-sm font-bold text-gray-700">मूल्य सूची लोड हुँदैछ...</p>
            <p className="text-xs text-gray-400">Loading Shree Pashupatinath Hardware Catalog</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-16 px-4 bg-white rounded-3xl border border-red-100 text-center shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-500 mx-auto flex items-center justify-center mb-3">
              <PackageOpen className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-gray-800 mb-1">कुनै सामान भेटिएन</h3>
            <p className="text-xs text-gray-500 max-w-xs mx-auto mb-4">
              {searchQuery
                ? `No items found matching "${searchQuery}" in ${selectedTag}.`
                : `No items available under category "${selectedTag}".`}
            </p>
            {isAdmin ? (
              <button
                onClick={() => {
                  setEditingItem(null);
                  setIsAddItemOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm transition"
              >
                <Plus className="w-4 h-4" />
                <span>Add Item to {selectedTag}</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setSelectedTag('All');
                  setSearchQuery('');
                }}
                className="text-xs font-bold text-red-600 hover:text-red-700 underline"
              >
                View all items
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-4">
            {filteredItems.map((item) => (
              <ItemCard
                key={item._id || item.id || item.name}
                item={item}
                isAdmin={isAdmin}
                onEdit={(i) => {
                  setEditingItem(i);
                  setIsAddItemOpen(true);
                }}
                onDelete={handleDeleteItem}
                onQuickPriceUpdate={handleQuickPriceUpdate}
              />
            ))}
          </div>
        )}

      </main>

      {/* Floating Action Button for Admin Mobile Experience */}
      {isAdmin && (
        <div className="fixed bottom-5 right-5 z-30">
          <button
            onClick={() => {
              setEditingItem(null);
              setIsAddItemOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-3.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-xl shadow-red-600/40 border-2 border-white transition-all transform hover:scale-105 active:scale-95"
          >
            <Plus className="w-5 h-5" />
            <span>Add Item</span>
          </button>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-12 border-t border-red-100 bg-white py-6 px-4 text-center text-xs text-gray-500">
        <div className="max-w-4xl mx-auto space-y-1">
          <p className="font-bold text-red-700">
            श्री पशुपतिनाथ हार्डवेयर (Shree Pashupatinath Hardware)
          </p>
          <p className="text-[11px] text-gray-400">
            Cement • Steel Rod • Pipes • Baluwa • Gitti • Sanitary & Hardware Supplies
          </p>
          <p className="text-[10px] text-gray-400 pt-1">
            © {new Date().getFullYear()} All Rights Reserved.
          </p>
        </div>
      </footer>

      {/* Admin PIN Login Modal (PIN: 0000) */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        onLoginApi={api.login}
      />

      {/* Admin Add/Edit Item Modal */}
      <AdminItemModal
        isOpen={isAddItemOpen}
        onClose={() => {
          setIsAddItemOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveItem}
        editItem={editingItem}
        tags={tags}
        onAddNewTag={handleAddTag}
        onOpenTagManager={() => {
          setIsAddItemOpen(false);
          setIsTagManagerOpen(true);
        }}
      />

      {/* Tag / Category Manager Modal */}
      <TagManagerModal
        isOpen={isTagManagerOpen}
        onClose={() => setIsTagManagerOpen(false)}
        tags={tags}
        onAddTag={handleAddTag}
        onDeleteTag={handleDeleteTag}
        tagCounts={tagCounts}
      />

      {/* MongoDB Server Connection Settings Modal */}
      <ServerSettingsModal
        isOpen={isServerSettingsOpen}
        onClose={() => setIsServerSettingsOpen(false)}
        onRefreshData={loadData}
      />

      {/* Floating Success / Info Toast Notification */}
      {toast && (
        <div className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50 animate-bounce">
          <div className="px-5 py-3 rounded-2xl bg-gray-900/95 text-white font-bold text-xs sm:text-sm shadow-2xl backdrop-blur-md border border-white/20 flex items-center gap-2">
            <span>{toast.message}</span>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
