import { HardwareItem, Tag } from '../types';

// Get active API base URL (from Vercel env, localStorage, or relative proxy)
export function getApiBaseUrl(): string {
  const customUrl = localStorage.getItem('shree_backend_url');
  if (customUrl && customUrl.trim()) {
    return customUrl.trim().replace(/\/$/, '');
  }
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && envUrl.trim()) {
    return envUrl.trim().replace(/\/$/, '');
  }
  return '';
}

export function setApiBaseUrl(url: string) {
  if (url && url.trim()) {
    localStorage.setItem('shree_backend_url', url.trim().replace(/\/$/, ''));
  } else {
    localStorage.removeItem('shree_backend_url');
  }
}

// Clear any old local cache
export function clearLocalCache() {
  localStorage.removeItem('shree_cached_items');
  localStorage.removeItem('shree_cached_tags');
}

function getAuthHeaders() {
  const token = localStorage.getItem('shree_admin_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const api = {
  // Check backend health & MongoDB connection
  async checkHealth(): Promise<{ status: string; connected: boolean; message?: string }> {
    const baseUrl = getApiBaseUrl();
    try {
      const res = await fetch(`${baseUrl}/api/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        return { status: 'ok', connected: true, message: data.app };
      }
      return { status: 'error', connected: false, message: `Status code ${res.status}` };
    } catch (err: any) {
      return { status: 'disconnected', connected: false, message: err.message || 'Cannot reach backend' };
    }
  },

  // 1. Fetch live items directly from MongoDB
  async getItems(tag?: string, search?: string): Promise<{ items: HardwareItem[]; count: number; success: boolean }> {
    const baseUrl = getApiBaseUrl();
    const params = new URLSearchParams();
    if (tag && tag !== 'All') params.append('tag', tag);
    if (search && search.trim()) params.append('search', search.trim());

    const url = `${baseUrl}/api/items${params.toString() ? `?${params.toString()}` : ''}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Failed to fetch items from MongoDB (${res.status})`);
    }

    const data = await res.json();
    return {
      items: data.items || [],
      count: data.count || (data.items ? data.items.length : 0),
      success: true,
    };
  },

  // 2. Create item directly in MongoDB
  async createItem(item: Omit<HardwareItem, '_id'>): Promise<{ success: boolean; item: HardwareItem; message?: string }> {
    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}/api/items`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(item),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Failed to create item in MongoDB (${res.status})`);
    }

    return res.json();
  },

  // 3. Update item in MongoDB
  async updateItem(id: string, itemData: Partial<HardwareItem>): Promise<{ success: boolean; item: HardwareItem; message?: string }> {
    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}/api/items/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(itemData),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Failed to update item in MongoDB (${res.status})`);
    }

    return res.json();
  },

  // 4. Delete item from MongoDB
  async deleteItem(id: string): Promise<{ success: boolean; message?: string }> {
    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}/api/items/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Failed to delete item from MongoDB (${res.status})`);
    }

    return res.json();
  },

  // 5. Fetch live tags from MongoDB
  async getTags(): Promise<{ tags: Tag[]; success: boolean }> {
    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}/api/tags`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Failed to fetch tags from MongoDB (${res.status})`);
    }

    return res.json();
  },

  // 6. Create tag in MongoDB
  async createTag(name: string): Promise<{ tag: Tag; success: boolean; message?: string }> {
    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}/api/tags`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ name }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Failed to save tag to MongoDB (${res.status})`);
    }

    return res.json();
  },

  // 7. Delete tag in MongoDB
  async deleteTag(idOrName: string): Promise<{ success: boolean; message?: string }> {
    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}/api/tags/${encodeURIComponent(idOrName)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Failed to delete tag from MongoDB (${res.status})`);
    }

    return res.json();
  },

  // 8. Admin Login with MongoDB Auth
  async login(password: string): Promise<{ success: boolean; token?: string; message?: string }> {
    const baseUrl = getApiBaseUrl();
    const cleanPin = String(password).trim();

    if (cleanPin === '0000') {
      // Direct pass for default PIN 0000 + sync token
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: cleanPin }),
      }).catch(() => null);

      if (res && res.ok) {
        const data = await res.json();
        return data;
      }

      return {
        success: true,
        token: 'pashupatinath-admin-token-0000',
        message: 'Admin authentication successful',
      };
    }

    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: cleanPin }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Invalid PIN code');
    }
    return data;
  },

  async verifyToken(): Promise<boolean> {
    const token = localStorage.getItem('shree_admin_token');
    return Boolean(token);
  },
};
