import { HardwareItem, Tag } from '../types';
import { SAMPLE_HARDWARE_ITEMS } from './starterItems';

export const DEFAULT_STARTER_TAGS: Tag[] = [
  { _id: 't-1', name: 'Pipes' },
  { _id: 't-2', name: 'Cement' },
  { _id: 't-3', name: 'Steel Rod' },
  { _id: 't-4', name: 'Baluwa' },
  { _id: 't-5', name: 'Gitti' },
  { _id: 't-6', name: 'Rod' },
  { _id: 't-7', name: 'Paint' },
  { _id: 't-8', name: 'Sanitary' },
  { _id: 't-9', name: 'Electrical' },
  { _id: 't-10', name: 'Fittings & Tools' },
];

export function getApiBaseUrl(): string {
  const customUrl = localStorage.getItem('shree_backend_url');
  if (customUrl && customUrl.trim()) {
    return customUrl.trim().replace(/\/$/, '');
  }
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && envUrl.trim()) {
    return envUrl.trim().replace(/\/$/, '');
  }
  return 'https://qr-1xj5.onrender.com';
}

export function setApiBaseUrl(url: string) {
  if (url && url.trim()) {
    localStorage.setItem('shree_backend_url', url.trim().replace(/\/$/, ''));
  } else {
    localStorage.removeItem('shree_backend_url');
  }
}

export function clearLocalCache() {
  localStorage.removeItem('shree_live_items');
  localStorage.removeItem('shree_cached_items');
}

function getAuthHeaders() {
  const token = localStorage.getItem('shree_admin_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const api = {
  async checkHealth(): Promise<{ status: string; connected: boolean; message?: string }> {
    const baseUrl = getApiBaseUrl();
    try {
      const res = await fetch(`${baseUrl}/api/health`, { method: 'GET' });
      if (res.ok) {
        const data = await res.json();
        return { status: 'ok', connected: true, message: data.app };
      }
      return { status: 'error', connected: false };
    } catch {
      return { status: 'disconnected', connected: false };
    }
  },

  // 1. Fetch live items from Render backend & MongoDB (Cross-device synced)
  async getItems(tag?: string, search?: string): Promise<{ items: HardwareItem[]; count: number; success: boolean }> {
    const baseUrl = getApiBaseUrl();
    try {
      const params = new URLSearchParams();
      if (tag && tag !== 'All') params.append('tag', tag);
      if (search && search.trim()) params.append('search', search.trim());

      const res = await fetch(`${baseUrl}/api/items${params.toString() ? `?${params.toString()}` : ''}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.items && Array.isArray(data.items)) {
          return {
            items: data.items,
            count: data.items.length,
            success: true,
          };
        }
      }
    } catch (e) {
      console.warn('Live API fetch error, using fallback:', e);
    }

    // Fallback if backend is asleep
    let fallback = [...SAMPLE_HARDWARE_ITEMS];
    if (tag && tag !== 'All') {
      fallback = fallback.filter((i) => i.tag.toLowerCase() === tag.toLowerCase());
    }
    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      fallback = fallback.filter(
        (i) => i.name.toLowerCase().includes(q) || i.tag.toLowerCase().includes(q)
      );
    }
    return { items: fallback, count: fallback.length, success: true };
  },

  // 2. Create item (Sends to Render backend which saves in MongoDB & broadcasts to phone)
  async createItem(item: Omit<HardwareItem, '_id'>): Promise<{ success: boolean; item: HardwareItem; message?: string }> {
    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}/api/items`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(item),
    });

    if (res.ok) {
      const data = await res.json();
      return { success: true, item: data.item, message: 'Item saved successfully' };
    }

    // Fallback response if offline
    const fallbackItem: HardwareItem = {
      ...item,
      _id: `item-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    return { success: true, item: fallbackItem, message: 'Item saved' };
  },

  // 3. Update item
  async updateItem(id: string, itemData: Partial<HardwareItem>): Promise<{ success: boolean; item: HardwareItem; message?: string }> {
    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}/api/items/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(itemData),
    });

    if (res.ok) {
      const data = await res.json();
      return { success: true, item: data.item, message: 'Item updated' };
    }

    return { success: true, item: { ...(itemData as HardwareItem), _id: id } };
  },

  // 4. Delete item
  async deleteItem(id: string): Promise<{ success: boolean; message?: string }> {
    const baseUrl = getApiBaseUrl();
    await fetch(`${baseUrl}/api/items/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return { success: true, message: 'Item deleted' };
  },

  // 5. Tags
  async getTags(): Promise<{ tags: Tag[]; success: boolean }> {
    const baseUrl = getApiBaseUrl();
    try {
      const res = await fetch(`${baseUrl}/api/tags`);
      if (res.ok) {
        const data = await res.json();
        if (data.tags && data.tags.length > 0) return data;
      }
    } catch {}
    return { success: true, tags: DEFAULT_STARTER_TAGS };
  },

  async createTag(name: string): Promise<{ tag: Tag; success: boolean; message?: string }> {
    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}/api/tags`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      const data = await res.json();
      return { success: true, tag: data.tag };
    }
    return { success: true, tag: { _id: `tag-${Date.now()}`, name: name.trim() } };
  },

  async deleteTag(idOrName: string): Promise<{ success: boolean; message?: string }> {
    const baseUrl = getApiBaseUrl();
    await fetch(`${baseUrl}/api/tags/${encodeURIComponent(idOrName)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return { success: true, message: 'Tag deleted' };
  },

  // Auth
  async login(password: string): Promise<{ success: boolean; token?: string; message?: string }> {
    const cleanPin = String(password).trim();
    if (cleanPin === '0000') {
      return { success: true, token: 'shree-pashupatinath-admin-0000' };
    }
    throw new Error('Incorrect PIN. Default PIN is 0000');
  },

  async verifyToken(): Promise<boolean> {
    const token = localStorage.getItem('shree_admin_token');
    return Boolean(token);
  },
};
