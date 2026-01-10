// Models - Data structures and types

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  price?: number;
  totalPrice?: number;
  maxStock?: number;
  supplier: string;
  model?: string;
  serialNumber?: string;
  warranty?: string;
  warrantyExpiryDate?: Date;
  purchaseDate: Date;
  location: string;
  status: 'in-stock' | 'low-stock' | 'out-of-stock';
  lastUpdated: Date;
  createdAt?: Date;
  description?: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
}

export interface DashboardStats {
  totalItems: number;
  lowStockItems: number;
  categories: number;
}

export type StockStatus = 'in-stock' | 'low-stock' | 'out-of-stock';

export const getStockStatus = (quantity: number): StockStatus => {
  if (quantity === 0) return 'out-of-stock';
  return 'in-stock';
};
