export interface HardwareItem {
  _id?: string;
  id?: string;
  name: string;
  price: number;
  unit: string;
  tag: string;
  imageUrl: string;
  description?: string;
  inStock: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Tag {
  _id?: string;
  id?: string;
  name: string;
}

export interface AuthState {
  isAdmin: boolean;
  token: string | null;
}
