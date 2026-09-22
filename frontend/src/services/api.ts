import { HardwareItem, Tag } from '../types';

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

// Default starter items for Shree Pashupatinath Hardware
export const DEFAULT_STARTER_ITEMS: HardwareItem[] = [
  {
    _id: 'default-1',
    name: 'Shivam OPC Cement 53 Grade (50kg)',
    price: 780,
    unit: 'bag',
    tag: 'Cement',
    imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&auto=format&fit=crop&q=80',
    description: 'High strength premium OPC cement for strong construction foundation and RCC casting.',
    inStock: true,
  },
  {
    _id: 'default-2',
    name: 'Hetauda PPC Cement (50kg)',
    price: 680,
    unit: 'bag',
    tag: 'Cement',
    imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&auto=format&fit=crop&q=80',
    description: 'General purpose Portland Pozzolana Cement for masonry, plaster, and flooring.',
    inStock: true,
  },
  {
    _id: 'default-3',
    name: 'Jagdamba Fe 500D TMT Steel Rod (12mm)',
    price: 98,
    unit: 'kg',
    tag: 'Steel Rod',
    imageUrl: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?w=600&auto=format&fit=crop&q=80',
    description: 'Ductile high-yield TMT rebar for earthquake-resistant pillars and beams.',
    inStock: true,
  },
  {
    _id: 'default-4',
    name: 'Laxmi Steels TMT Rod (16mm)',
    price: 99,
    unit: 'kg',
    tag: 'Steel Rod',
    imageUrl: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?w=600&auto=format&fit=crop&q=80',
    description: 'Heavy structural reinforcement steel rod.',
    inStock: true,
  },
  {
    _id: 'default-5',
    name: 'Binding Wire / Rod Wire',
    price: 130,
    unit: 'kg',
    tag: 'Rod',
    imageUrl: 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=600&auto=format&fit=crop&q=80',
    description: 'Soft annealed iron wire for binding reinforcement rebar nets.',
    inStock: true,
  },
  {
    _id: 'default-6',
    name: 'Panchakanya CPVC Pipe 1 inch (Class 1)',
    price: 480,
    unit: 'piece (10ft)',
    tag: 'Pipes',
    imageUrl: 'https://images.unsplash.com/photo-1542013936693-884638332954?w=600&auto=format&fit=crop&q=80',
    description: 'Hot & cold potable water supply CPVC pipe, UV-resistant and durable.',
    inStock: true,
  },
  {
    _id: 'default-7',
    name: 'PVC Drainage Pipe 4 inch (6kg)',
    price: 920,
    unit: 'piece (10ft)',
    tag: 'Pipes',
    imageUrl: 'https://images.unsplash.com/photo-1542013936693-884638332954?w=600&auto=format&fit=crop&q=80',
    description: 'Heavy duty underground soil and wastewater drainage pipe.',
    inStock: true,
  },
  {
    _id: 'default-8',
    name: 'River Washed Sand (Baluwa) - Local Clean',
    price: 18500,
    unit: 'Tipper (450 cu.ft)',
    tag: 'Baluwa',
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
    description: 'Fine river-washed silica sand for plastering, slab casting, and brickwork.',
    inStock: true,
  },
  {
    _id: 'default-9',
    name: 'Crushed Stone Aggregate (Gitti 20mm)',
    price: 21000,
    unit: 'Tipper (450 cu.ft)',
    tag: 'Gitti',
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
    description: 'High grade machine-crushed blue metal aggregate for pillar & RCC concrete.',
    inStock: true,
  },
  {
    _id: 'default-10',
    name: 'Asian Paints Apex Weatherproof Exterior (20L)',
    price: 7400,
    unit: 'bucket (20L)',
    tag: 'Paint',
    imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&auto=format&fit=crop&q=80',
    description: 'Exterior emulsion with silicone additives to prevent algae and moisture peeling.',
    inStock: true,
  },
  {
    _id: 'default-11',
    name: 'Heavy Duty Chrome Brass Bibcock Tap',
    price: 650,
    unit: 'piece',
    tag: 'Sanitary',
    imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&auto=format&fit=crop&q=80',
    description: 'Solid brass quarter-turn water tap with mirror chrome finish.',
    inStock: true,
  },
  {
    _id: 'default-12',
    name: 'Stainless Steel Wood Screws Box (3 inch)',
    price: 320,
    unit: 'box (100 pcs)',
    tag: 'Fittings & Tools',
    imageUrl: 'https://images.unsplash.com/photo-1586864387789-628af9feed72?w=600&auto=format&fit=crop&q=80',
    description: 'Rustproof high-torque wood screws for roofing and carpentry framing.',
    inStock: true,
  }
];

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

function getAuthHeaders() {
  const token = localStorage.getItem('shree_admin_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function getLocalItems(): HardwareItem[] {
  try {
    const raw = localStorage.getItem('shree_cached_items');
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // ignore
  }
  return DEFAULT_STARTER_ITEMS;
}

function saveLocalItems(items: HardwareItem[]) {
  try {
    localStorage.setItem('shree_cached_items', JSON.stringify(items));
  } catch (e) {
    // ignore
  }
}

function getLocalTags(): Tag[] {
  try {
    const raw = localStorage.getItem('shree_cached_tags');
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // ignore
  }
  return DEFAULT_STARTER_TAGS;
}

function saveLocalTags(tags: Tag[]) {
  try {
    localStorage.setItem('shree_cached_tags', JSON.stringify(tags));
  } catch (e) {
    // ignore
  }
}

export const api = {
  // Items
  async getItems(tag?: string, search?: string): Promise<{ items: HardwareItem[]; success: boolean }> {
    try {
      if (API_BASE) {
        const params = new URLSearchParams();
        if (tag && tag !== 'All') params.append('tag', tag);
        if (search && search.trim()) params.append('search', search.trim());

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const res = await fetch(`${API_BASE}/api/items?${params.toString()}`, {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          if (data.items && data.items.length > 0) {
            saveLocalItems(data.items);
            return data;
          }
        }
      }
    } catch (err) {
      console.warn('Backend items fetch failed or waking up, using local cache:', err);
    }

    // Return cached/offline items
    let local = getLocalItems();
    if (tag && tag !== 'All') {
      local = local.filter((i) => i.tag.toLowerCase() === tag.toLowerCase());
    }
    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      local = local.filter(
        (i) => i.name.toLowerCase().includes(q) || i.tag.toLowerCase().includes(q) || (i.description && i.description.toLowerCase().includes(q))
      );
    }
    return { success: true, items: local };
  },

  async createItem(item: Omit<HardwareItem, '_id'>): Promise<{ success: boolean; item: HardwareItem; message?: string }> {
    const newItem: HardwareItem = {
      ...item,
      _id: `item-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    // Update local cache
    const current = getLocalItems();
    const updated = [newItem, ...current];
    saveLocalItems(updated);

    // Sync to backend if available
    if (API_BASE) {
      fetch(`${API_BASE}/api/items`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(item),
      }).catch((e) => console.warn('Background backend sync failed:', e));
    }

    return { success: true, item: newItem };
  },

  async updateItem(id: string, itemData: Partial<HardwareItem>): Promise<{ success: boolean; item: HardwareItem; message?: string }> {
    const current = getLocalItems();
    const index = current.findIndex((i) => (i._id || i.id) === id);
    let updatedItem: HardwareItem;

    if (index !== -1) {
      updatedItem = { ...current[index], ...itemData, updatedAt: new Date().toISOString() };
      current[index] = updatedItem;
      saveLocalItems(current);
    } else {
      updatedItem = { ...(itemData as HardwareItem), _id: id };
    }

    if (API_BASE) {
      fetch(`${API_BASE}/api/items/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(itemData),
      }).catch((e) => console.warn('Background backend sync failed:', e));
    }

    return { success: true, item: updatedItem };
  },

  async deleteItem(id: string): Promise<{ success: boolean; message?: string }> {
    const current = getLocalItems();
    const filtered = current.filter((i) => (i._id || i.id) !== id);
    saveLocalItems(filtered);

    if (API_BASE) {
      fetch(`${API_BASE}/api/items/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      }).catch((e) => console.warn('Background backend delete failed:', e));
    }

    return { success: true, message: 'Item deleted' };
  },

  // Tags
  async getTags(): Promise<{ tags: Tag[]; success: boolean }> {
    try {
      if (API_BASE) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        const res = await fetch(`${API_BASE}/api/tags`, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          if (data.tags && data.tags.length > 0) {
            saveLocalTags(data.tags);
            return data;
          }
        }
      }
    } catch (e) {
      // ignore
    }

    return { success: true, tags: getLocalTags() };
  },

  async createTag(name: string): Promise<{ tag: Tag; success: boolean; message?: string }> {
    const newTag: Tag = { _id: `tag-${Date.now()}`, name: name.trim() };
    const current = getLocalTags();
    if (!current.some((t) => t.name.toLowerCase() === name.trim().toLowerCase())) {
      saveLocalTags([...current, newTag]);
    }

    if (API_BASE) {
      fetch(`${API_BASE}/api/tags`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ name }),
      }).catch(() => {});
    }

    return { success: true, tag: newTag };
  },

  async deleteTag(idOrName: string): Promise<{ success: boolean; message?: string }> {
    const current = getLocalTags();
    const filtered = current.filter((t) => (t._id || t.name) !== idOrName && t.name !== idOrName);
    saveLocalTags(filtered);

    if (API_BASE) {
      fetch(`${API_BASE}/api/tags/${idOrName}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      }).catch(() => {});
    }

    return { success: true, message: 'Tag deleted' };
  },

  // Auth - PIN 0000 Always Validated with Offline & Cloud Sync
  async login(password: string): Promise<{ success: boolean; token?: string; message?: string }> {
    const cleanPin = String(password).trim();

    // Check PIN: 0000
    if (cleanPin === '0000') {
      const fallbackToken = 'pashupatinath-admin-auth-token-0000';
      // Try backend validation in background
      if (API_BASE) {
        fetch(`${API_BASE}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: cleanPin }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.token) {
              localStorage.setItem('shree_admin_token', data.token);
            }
          })
          .catch(() => {});
      }

      return {
        success: true,
        token: fallbackToken,
        message: 'Admin authentication successful',
      };
    }

    // If different PIN entered, try backend
    if (API_BASE) {
      try {
        const res = await fetch(`${API_BASE}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: cleanPin }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          return data;
        }
      } catch (e) {
        // ignore
      }
    }

    throw new Error('Incorrect PIN. Default PIN is 0000');
  },

  async verifyToken(): Promise<boolean> {
    const token = localStorage.getItem('shree_admin_token');
    if (!token) return false;
    if (token === 'pashupatinath-admin-auth-token-0000') return true;

    if (API_BASE) {
      try {
        const res = await fetch(`${API_BASE}/api/auth/verify`, {
          headers: getAuthHeaders(),
        });
        const data = await res.json();
        return Boolean(data.success && data.authenticated);
      } catch {
        return true; // Keep local session active
      }
    }
    return true;
  },
};
