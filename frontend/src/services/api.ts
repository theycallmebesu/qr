import { HardwareItem, Tag } from '../types';

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

  // 1. Fetch live items directly from MongoDB Atlas
  async getItems(tag?: string, search?: string): Promise<{ items: HardwareItem[]; count: number; success: boolean }> {
    const baseUrl = getApiBaseUrl();
    const params = new URLSearchParams();
    if (tag && tag !== 'All') params.append('tag', tag);
    if (search && search.trim()) params.append('search', search.trim());

    const res = await fetch(`${baseUrl}/api/items${params.toString() ? `?${params.toString()}` : ''}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      throw new Error(`Server returned status ${res.status}`);
    }

    const data = await res.json();
    return {
      items: data.items || [],
      count: data.count || (data.items ? data.items.length : 0),
      success: true,
    };
  },

  // 2. Create item directly in MongoDB Atlas
  async createItem(item: Omit<HardwareItem, '_id'>): Promise<{ success: boolean; item: HardwareItem; message?: string }> {
    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}/api/items`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(item),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Failed to create item in database (${res.status})`);
    }

    const data = await res.json();
    return data;
  },

  // 3. Update item directly in MongoDB Atlas
  async updateItem(id: string, itemData: Partial<HardwareItem>): Promise<{ success: boolean; item: HardwareItem; message?: string }> {
    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}/api/items/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(itemData),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Failed to update item in database (${res.status})`);
    }

    const data = await res.json();
    return data;
  },

  // 4. Delete item directly from MongoDB Atlas
  async deleteItem(id: string): Promise<{ success: boolean; message?: string }> {
    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}/api/items/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error(`Failed to delete item (${res.status})`);
    }

    return { success: true, message: 'Item deleted successfully' };
  },

  // 5. Tags
  async getTags(): Promise<{ tags: Tag[]; success: boolean }> {
    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}/api/tags`);
    if (res.ok) {
      const data = await res.json();
      if (data.tags) return data;
    }
    return { success: true, tags: [] };
  },

  async createTag(name: string): Promise<{ tag: Tag; success: boolean; message?: string }> {
    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}/api/tags`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      throw new Error('Failed to create tag');
    }
    const data = await res.json();
    return data;
  },

  async deleteTag(idOrName: string): Promise<{ success: boolean; message?: string }> {
    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}/api/tags/${encodeURIComponent(idOrName)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      throw new Error('Failed to delete tag');
    }
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
