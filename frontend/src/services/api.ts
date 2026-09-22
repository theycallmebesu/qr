import { HardwareItem, Tag } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '';

// Helper to get auth header
function getAuthHeaders() {
  const token = localStorage.getItem('shree_admin_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const api = {
  // Items
  async getItems(tag?: string, search?: string): Promise<{ items: HardwareItem[]; success: boolean }> {
    const params = new URLSearchParams();
    if (tag && tag !== 'All') params.append('tag', tag);
    if (search && search.trim()) params.append('search', search.trim());

    const res = await fetch(`${API_BASE}/api/items?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch items');
    return res.json();
  },

  async createItem(item: Omit<HardwareItem, '_id'>): Promise<{ success: boolean; item: HardwareItem; message?: string }> {
    const res = await fetch(`${API_BASE}/api/items`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(item),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to create item');
    }
    return res.json();
  },

  async updateItem(id: string, item: Partial<HardwareItem>): Promise<{ success: boolean; item: HardwareItem; message?: string }> {
    const res = await fetch(`${API_BASE}/api/items/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(item),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to update item');
    }
    return res.json();
  },

  async deleteItem(id: string): Promise<{ success: boolean; message?: string }> {
    const res = await fetch(`${API_BASE}/api/items/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete item');
    return res.json();
  },

  // Tags
  async getTags(): Promise<{ tags: Tag[]; success: boolean }> {
    const res = await fetch(`${API_BASE}/api/tags`);
    if (!res.ok) throw new Error('Failed to fetch tags');
    return res.json();
  },

  async createTag(name: string): Promise<{ tag: Tag; success: boolean; message?: string }> {
    const res = await fetch(`${API_BASE}/api/tags`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to create tag');
    }
    return res.json();
  },

  async deleteTag(idOrName: string): Promise<{ success: boolean; message?: string }> {
    const res = await fetch(`${API_BASE}/api/tags/${idOrName}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete tag');
    return res.json();
  },

  // Auth
  async login(password: string): Promise<{ success: boolean; token?: string; message?: string }> {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Invalid PIN code');
    }
    return data;
  },

  async verifyToken(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/api/auth/verify`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      return Boolean(data.success && data.authenticated);
    } catch {
      return false;
    }
  },
};
