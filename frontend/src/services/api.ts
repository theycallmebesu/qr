import { HardwareItem, Tag } from '../types';

export const SAMPLE_HARDWARE_ITEMS: HardwareItem[] = [
  // CEMENT
  {
    _id: 'cement-1',
    name: 'Shivam OPC Cement 53 Grade (50kg)',
    price: 780,
    unit: 'bag',
    tag: 'Cement',
    imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&auto=format&fit=crop&q=80',
    description: 'High strength premium OPC cement for strong construction foundation and RCC casting.',
    inStock: true,
  },
  {
    _id: 'cement-2',
    name: 'Hetauda PPC Cement (50kg)',
    price: 680,
    unit: 'bag',
    tag: 'Cement',
    imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&auto=format&fit=crop&q=80',
    description: 'General purpose Portland Pozzolana Cement for masonry, plaster, and flooring.',
    inStock: true,
  },
  {
    _id: 'cement-3',
    name: 'Maruti OPC Super Cement (50kg)',
    price: 770,
    unit: 'bag',
    tag: 'Cement',
    imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&auto=format&fit=crop&q=80',
    description: 'Fast curing high-strength cement for commercial RCC slabs.',
    inStock: true,
  },
  {
    _id: 'cement-4',
    name: 'Arghakhanchi OPC Cement (50kg)',
    price: 790,
    unit: 'bag',
    tag: 'Cement',
    imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&auto=format&fit=crop&q=80',
    description: 'Top-tier clinker OPC cement with high weather resistance.',
    inStock: true,
  },

  // STEEL ROD
  {
    _id: 'steel-1',
    name: 'Jagdamba Fe 500D TMT Steel Rod (12mm)',
    price: 98,
    unit: 'kg',
    tag: 'Steel Rod',
    imageUrl: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?w=600&auto=format&fit=crop&q=80',
    description: 'Ductile high-yield TMT rebar for earthquake-resistant pillars and beams.',
    inStock: true,
  },
  {
    _id: 'steel-2',
    name: 'Jagdamba Fe 500D TMT Steel Rod (16mm)',
    price: 98,
    unit: 'kg',
    tag: 'Steel Rod',
    imageUrl: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?w=600&auto=format&fit=crop&q=80',
    description: 'Heavy structural reinforcement steel rod for column footing.',
    inStock: true,
  },
  {
    _id: 'steel-3',
    name: 'Laxmi Steels TMT Rod (20mm)',
    price: 99,
    unit: 'kg',
    tag: 'Steel Rod',
    imageUrl: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?w=600&auto=format&fit=crop&q=80',
    description: 'Extra high tensile strength commercial construction rebar.',
    inStock: true,
  },
  {
    _id: 'steel-4',
    name: 'Ambe Steels TMT Bar (10mm)',
    price: 97,
    unit: 'kg',
    tag: 'Steel Rod',
    imageUrl: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?w=600&auto=format&fit=crop&q=80',
    description: 'Ideal for slab mesh wiring and lintel reinforcement.',
    inStock: true,
  },

  // BALUWA (SAND)
  {
    _id: 'sand-1',
    name: 'River Washed Sand (Baluwa) - Local Clean',
    price: 18500,
    unit: 'Tipper (450 cu.ft)',
    tag: 'Baluwa',
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
    description: 'Fine river-washed silica sand for plastering, slab casting, and brickwork.',
    inStock: true,
  },
  {
    _id: 'sand-2',
    name: 'Plastering Fine White Sand (Dhunge Baluwa)',
    price: 19500,
    unit: 'Tipper (450 cu.ft)',
    tag: 'Baluwa',
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
    description: 'Screened super-fine sand for wall putty and smooth internal plastering.',
    inStock: true,
  },
  {
    _id: 'sand-3',
    name: 'Red River Sand (Rato Baluwa)',
    price: 6500,
    unit: 'Tractor (150 cu.ft)',
    tag: 'Baluwa',
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
    description: 'General construction fill and brick laying sand.',
    inStock: true,
  },

  // GITTI (AGGREGATE)
  {
    _id: 'gitti-1',
    name: 'Crushed Stone Aggregate (Gitti 20mm)',
    price: 21000,
    unit: 'Tipper (450 cu.ft)',
    tag: 'Gitti',
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
    description: 'High grade machine-crushed blue metal aggregate for pillar & RCC concrete.',
    inStock: true,
  },
  {
    _id: 'gitti-2',
    name: 'Fine Aggregate (Gitti 10mm / Bajeri)',
    price: 22000,
    unit: 'Tipper (450 cu.ft)',
    tag: 'Gitti',
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
    description: 'Compact gravel for floor leveling and precast concrete molds.',
    inStock: true,
  },

  // ROD & WIRE
  {
    _id: 'rod-1',
    name: 'Binding Wire / Rod Wire (Annealed Soft)',
    price: 130,
    unit: 'kg',
    tag: 'Rod',
    imageUrl: 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=600&auto=format&fit=crop&q=80',
    description: 'Soft annealed iron wire for binding reinforcement rebar nets and ring ties.',
    inStock: true,
  },
  {
    _id: 'rod-2',
    name: 'Galvanized Barbed Wire (Tarbar Jali)',
    price: 145,
    unit: 'kg',
    tag: 'Rod',
    imageUrl: 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=600&auto=format&fit=crop&q=80',
    description: 'Rustproof high-tensile boundary fencing wire.',
    inStock: true,
  },

  // PIPES
  {
    _id: 'pipe-1',
    name: 'Panchakanya CPVC Pipe 1 inch (Class 1)',
    price: 480,
    unit: 'piece (10ft)',
    tag: 'Pipes',
    imageUrl: 'https://images.unsplash.com/photo-1542013936693-884638332954?w=600&auto=format&fit=crop&q=80',
    description: 'Hot & cold potable water supply CPVC pipe, UV-resistant and durable.',
    inStock: true,
  },
  {
    _id: 'pipe-2',
    name: 'PVC Drainage Pipe 4 inch (6kg)',
    price: 920,
    unit: 'piece (10ft)',
    tag: 'Pipes',
    imageUrl: 'https://images.unsplash.com/photo-1542013936693-884638332954?w=600&auto=format&fit=crop&q=80',
    description: 'Heavy duty underground soil and wastewater drainage pipe.',
    inStock: true,
  },
  {
    _id: 'pipe-3',
    name: 'HDPE Black Water Pipe 32mm (PN 10)',
    price: 65,
    unit: 'meter',
    tag: 'Pipes',
    imageUrl: 'https://images.unsplash.com/photo-1542013936693-884638332954?w=600&auto=format&fit=crop&q=80',
    description: 'Flexible rollable underground main drinking water supply pipe.',
    inStock: true,
  },

  // PAINT
  {
    _id: 'paint-1',
    name: 'Asian Paints Apex Weatherproof Exterior (20L)',
    price: 7400,
    unit: 'bucket (20L)',
    tag: 'Paint',
    imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&auto=format&fit=crop&q=80',
    description: 'Exterior emulsion with silicone additives to prevent algae and moisture peeling.',
    inStock: true,
  },
  {
    _id: 'paint-2',
    name: 'Asian Paints Tractor Emulsion Interior (20L)',
    price: 4800,
    unit: 'bucket (20L)',
    tag: 'Paint',
    imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&auto=format&fit=crop&q=80',
    description: 'Smooth matte finish washable interior wall paint.',
    inStock: true,
  },
  {
    _id: 'paint-3',
    name: 'Birla White Wall Care Putty (40kg)',
    price: 1150,
    unit: 'bag (40kg)',
    tag: 'Paint',
    imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&auto=format&fit=crop&q=80',
    description: 'Water-resistant white cement-based putty for ultra-smooth wall finish.',
    inStock: true,
  },

  // SANITARY & TOOLS
  {
    _id: 'sanitary-1',
    name: 'Heavy Duty Chrome Brass Bibcock Tap',
    price: 650,
    unit: 'piece',
    tag: 'Sanitary',
    imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&auto=format&fit=crop&q=80',
    description: 'Solid brass quarter-turn water tap with mirror chrome finish.',
    inStock: true,
  },
  {
    _id: 'tools-1',
    name: 'Stainless Steel Wood Screws Box (3 inch)',
    price: 320,
    unit: 'box (100 pcs)',
    tag: 'Fittings & Tools',
    imageUrl: 'https://images.unsplash.com/photo-1586864387789-628af9feed72?w=600&auto=format&fit=crop&q=80',
    description: 'Rustproof high-torque wood screws for roofing and carpentry framing.',
    inStock: true,
  },
  {
    _id: 'tools-2',
    name: 'Stanley Professional Measuring Tape (5M)',
    price: 450,
    unit: 'piece',
    tag: 'Fittings & Tools',
    imageUrl: 'https://images.unsplash.com/photo-1586864387789-628af9feed72?w=600&auto=format&fit=crop&q=80',
    description: 'Shock-resistant rubber casing measuring tape with lock mechanism.',
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
  localStorage.removeItem('shree_cached_items');
  localStorage.removeItem('shree_cached_tags');
}

function getStoredItems(): HardwareItem[] {
  try {
    const raw = localStorage.getItem('shree_live_items');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return SAMPLE_HARDWARE_ITEMS;
}

function saveStoredItems(items: HardwareItem[]) {
  try {
    localStorage.setItem('shree_live_items', JSON.stringify(items));
  } catch (e) {}
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

  // 1. Fetch live items
  async getItems(tag?: string, search?: string): Promise<{ items: HardwareItem[]; count: number; success: boolean }> {
    const baseUrl = getApiBaseUrl();
    let itemsList = getStoredItems();

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
        if (data.items && data.items.length > 0) {
          itemsList = data.items;
          saveStoredItems(itemsList);
        }
      }
    } catch (e) {
      console.warn('Backend fetch failed, using active catalog:', e);
    }

    if (tag && tag !== 'All') {
      itemsList = itemsList.filter((i) => i.tag.toLowerCase() === tag.toLowerCase());
    }
    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      itemsList = itemsList.filter(
        (i) => i.name.toLowerCase().includes(q) || i.tag.toLowerCase().includes(q) || (i.description && i.description.toLowerCase().includes(q))
      );
    }

    return {
      items: itemsList,
      count: itemsList.length,
      success: true,
    };
  },

  // 2. Create item
  async createItem(item: Omit<HardwareItem, '_id'>): Promise<{ success: boolean; item: HardwareItem; message?: string }> {
    const baseUrl = getApiBaseUrl();
    const newItem: HardwareItem = {
      ...item,
      _id: `item-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    // Update active store
    const current = getStoredItems();
    const updated = [newItem, ...current];
    saveStoredItems(updated);

    // Sync to MongoDB in background
    fetch(`${baseUrl}/api/items`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(item),
    }).catch((err) => console.warn('Background MongoDB sync attempt:', err));

    return { success: true, item: newItem, message: 'Item saved successfully' };
  },

  // 3. Update item
  async updateItem(id: string, itemData: Partial<HardwareItem>): Promise<{ success: boolean; item: HardwareItem; message?: string }> {
    const baseUrl = getApiBaseUrl();
    const current = getStoredItems();
    const index = current.findIndex((i) => (i._id || i.id) === id || i.name === itemData.name);
    let updatedItem: HardwareItem;

    if (index !== -1) {
      updatedItem = { ...current[index], ...itemData, updatedAt: new Date().toISOString() };
      current[index] = updatedItem;
      saveStoredItems(current);
    } else {
      updatedItem = { ...(itemData as HardwareItem), _id: id };
    }

    fetch(`${baseUrl}/api/items/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(itemData),
    }).catch(() => {});

    return { success: true, item: updatedItem, message: 'Item updated successfully' };
  },

  // 4. Delete item
  async deleteItem(id: string): Promise<{ success: boolean; message?: string }> {
    const baseUrl = getApiBaseUrl();
    const current = getStoredItems();
    const filtered = current.filter((i) => (i._id || i.id) !== id);
    saveStoredItems(filtered);

    fetch(`${baseUrl}/api/items/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    }).catch(() => {});

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
    const newTag: Tag = { _id: `tag-${Date.now()}`, name: name.trim() };

    fetch(`${baseUrl}/api/tags`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ name }),
    }).catch(() => {});

    return { success: true, tag: newTag };
  },

  async deleteTag(idOrName: string): Promise<{ success: boolean; message?: string }> {
    const baseUrl = getApiBaseUrl();
    fetch(`${baseUrl}/api/tags/${encodeURIComponent(idOrName)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    }).catch(() => {});

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
