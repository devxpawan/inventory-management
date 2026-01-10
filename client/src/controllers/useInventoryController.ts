import { useCallback, useEffect, useMemo, useState } from 'react';
import { useToast } from '../components/ui/use-toast'; // Assuming this is the correct path
import { Category, DashboardStats, InventoryItem } from '../models/inventory';

// Utility for API calls
async function api(endpoint: string, method: string = 'GET', data?: any) {
  const userInfoString = localStorage.getItem('userInfo');
  const userInfo = userInfoString ? JSON.parse(userInfoString) : null;
  const token = userInfo?.token;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    method,
    headers,
  };

  if (data) {
    config.body = JSON.stringify(data);
  }

  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}${endpoint}`, config);

  if (response.status === 401) {
    localStorage.removeItem('userInfo');
    window.location.href = '/login';
    throw new Error('Session expired. Please login again.');
  }

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Something went wrong');
  }

  return response.json();
}

export const useInventoryController = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const fetchItemsAndCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [itemsData, categoriesData] = await Promise.all([
        api('/inventory'), // GET /api/inventory
        api('/categories'), // GET /api/categories
      ]);
      setItems(itemsData);
      setCategories(categoriesData);
    } catch (err: any) {
      setError(err.message);
      toast({
        title: 'Error fetching data',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItemsAndCategories();
  }, [fetchItemsAndCategories]);

  // Filtered items based on search and category
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const term = searchTerm.toLowerCase().trim();
      
      // If search term is empty, standard behavior (name check will pass)
      // But we want to ensure we don't filter out everything if term is empty string due to trim
      if (!term && searchTerm.trim() === '') {
         // If the original search term was just whitespace or empty, we might want to match everything
         // or let the name check handle it (includes('') is true).
         // However, let's rely on the checks below.
      }

      const matchesSearch = 
        (item.name?.toLowerCase() || '').includes(term) ||
        (item.supplier?.toLowerCase() || '').includes(term) ||
        (item.serialNumber?.toLowerCase() || '').includes(term);
      
      const matchesCategory = 
        selectedCategory === 'all' || item.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [items, searchTerm, selectedCategory]);

  // Dashboard statistics
  const stats: DashboardStats = useMemo(() => {
    const lowStockItemsCount = items.filter(item => item.status === 'low-stock' || item.status === 'out-of-stock').length;
    
    const categoryTotals = items.reduce((acc, item) => {
        const cat = item.category || 'Uncategorized';
        acc[cat] = (acc[cat] || 0) + item.quantity;
        return acc;
    }, {} as Record<string, number>);
    
    const lowStockCategoriesCount = Object.values(categoryTotals).filter(total => total <= 3).length;

    return {
      totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
      lowStockItems: lowStockItemsCount + lowStockCategoriesCount,
      categories: categories.length,
    };
  }, [items, categories]);

  // Add new item
  const addItem = useCallback(async (item: Omit<InventoryItem, 'id' | 'status' | 'lastUpdated'>, options?: { silent?: boolean }) => {
    try {
      const newItem = await api('/inventory', 'POST', item); // POST /api/inventory
      setItems(prev => [...prev, newItem]);
      
      if (!options?.silent) {
        toast({
          title: 'Item added',
          description: `${newItem.name} has been added to inventory.`,
        });
      }
      
      // Re-fetch all data to update categories and ensure data consistency
      fetchItemsAndCategories();
      return newItem;
    } catch (err: any) {
      setError(err.message);
      toast({
        title: 'Error adding item',
        description: err.message,
        variant: 'destructive',
      });
      throw err; // Re-throw to let caller know it failed
    }
  }, [fetchItemsAndCategories]);

  // Update item
  const updateItem = useCallback(async (id: string, updates: Partial<InventoryItem>, options?: { silent?: boolean }) => {
    try {
      const updatedItem = await api(`/inventory/${id}`, 'PUT', updates); // PUT /api/inventory/:id
      setItems(prev => prev.map(item => (item.id === id ? updatedItem : item)));
      setItems(prev => prev.map(item => (item.id === id ? updatedItem : item)));
      
      if (!options?.silent) {
        toast({
          title: 'Item updated',
          description: 'Inventory item has been updated successfully.',
        });
      }
      // Re-fetch all data to update categories and ensure data consistency
      fetchItemsAndCategories();
      return updatedItem;
    } catch (err: any) {
      setError(err.message);
      toast({
        title: 'Error updating item',
        description: err.message,
        variant: 'destructive',
      });
      throw err; // Re-throw to let caller know it failed
    }
  }, [fetchItemsAndCategories]);

  // Delete item
  const deleteItem = useCallback(async (id: string, serialNumber?: string | string[], options?: { silent?: boolean }) => {
    try {
      const itemToDelete = items.find(i => i.id === id);
      if (!itemToDelete) return;

      if (serialNumber) {
        const serialsToRemove = Array.isArray(serialNumber) ? serialNumber : [serialNumber];
        
        // Logic to remove specific serial
        const currentSerials = itemToDelete.serialNumber ? itemToDelete.serialNumber.split(',').map(s => s.trim()) : [];
        const newSerials = currentSerials.filter(s => !serialsToRemove.includes(s));
        
        // Decrement quantity
        const quantityToRemove = serialsToRemove.length;
        const newQuantity = itemToDelete.quantity - quantityToRemove;
        
        if (newQuantity <= 0) {
            // If quantity hits 0 (or less), delete the item completely
             await api(`/inventory/${id}`, 'DELETE');
             setItems(prev => prev.filter(item => item.id !== id));
             toast({
               title: 'Item deleted',
               description: `${itemToDelete.name} has been removed from inventory.`,
               variant: 'destructive',
             });
        } else {
            // Update item with removed serial and decremented quantity
            const updates = {
                quantity: newQuantity,
                serialNumber: newSerials.join(', ')
            };
            
            // We call updateItem here. Note: updateItem will trigger its own toast and state update.
            // To avoid double toasts or state conflicts, we can call the API directly here or reuse updateItem.
            // Reusing updateItem is safer for consistency.
            await updateItem(id, updates, options);
            return; 
        }
      } else {
        // Original full delete
        await api(`/inventory/${id}`, 'DELETE');
        setItems(prev => prev.filter(item => item.id !== id));
        
        if (!options?.silent) {
          toast({
            title: 'Item deleted',
            description: `${itemToDelete?.name} has been removed from inventory.`,
            variant: 'destructive',
          });
        }
      }
      // Re-fetch all data to update categories and ensure data consistency
      fetchItemsAndCategories();
    } catch (err: any) {
      setError(err.message);
      toast({
        title: 'Error deleting item',
        description: err.message,
        variant: 'destructive',
      });
      throw err;
    }
  }, [items, fetchItemsAndCategories, updateItem]);

  // Add new category
  const addCategory = useCallback(async (categoryName: string) => {
    try {
      const newCategory = await api('/categories', 'POST', { name: categoryName }); // POST /api/categories
      setCategories(prev => [...prev, newCategory]);
      toast({
        title: 'Category added',
        description: `${newCategory.name} has been added as a new category.`,
      });
      return newCategory;
    } catch (err: any) {
      setError(err.message);
      toast({
        title: 'Error adding category',
        description: err.message,
        variant: 'destructive',
      });
      throw err;
    }
  }, []);

  // Delete category
  const deleteCategory = useCallback(async (id: string) => {
    try {
      const categoryToDelete = categories.find(c => c.id === id);
      await api(`/categories/${id}`, 'DELETE'); // DELETE /api/categories/:id
      setCategories(prev => prev.filter(category => category.id !== id));
      toast({
        title: 'Category deleted',
        description: `${categoryToDelete?.name} has been removed.`,
        variant: 'destructive',
      });
      // Re-fetch all data to update categories and ensure data consistency
      fetchItemsAndCategories();
    } catch (err: any) {
      setError(err.message);
      toast({
        title: 'Error deleting category',
        description: err.message,
        variant: 'destructive',
      });
    }
  }, [categories, fetchItemsAndCategories]);

  // Create a new transaction
  const createTransaction = useCallback(async (transactionData: {
    itemId: string;
    itemName?: string;
    itemCategory?: string;
    type: 'in' | 'out' | 'return' | 'transfer';
    quantity: number;
    branch?: string;
    assetNumber?: string;
    model?: string;
    serialNumber?: string;
    itemTrackingId?: string;
    reason?: string;
  }) => {
    try {
      let response;
      if (transactionData.type === 'transfer') {
        response = await api('/transactions/transfer', 'POST', transactionData); // POST /api/transactions/transfer
      } else {
        response = await api('/transactions', 'POST', transactionData); // POST /api/transactions
      }
      
      const { item: updatedItem, itemDeleted } = response;
      
      // If item was deleted (quantity reached 0), remove it from state
      if (itemDeleted) {
        setItems(prev => prev.filter(item => item.id !== updatedItem.id));
        toast({
          title: 'Transaction successful',
          description: `Item has been transferred and removed from inventory.`,
        });
      } else {
        // Otherwise, update the item in state
        setItems(prev => prev.map(item => (item.id === updatedItem.id ? updatedItem : item)));
        toast({
          title: 'Transaction successful',
          description: `${updatedItem.name} stock has been updated and transaction recorded.`,
        });
      }
      
      // Refetch to ensure consistency
      fetchItemsAndCategories();
    } catch (err: any) {
      setError(err.message);
      toast({
        title: 'Transaction failed',
        description: err.message,
        variant: 'destructive',
      });
    }
  }, [fetchItemsAndCategories]);

  // Get all transferred items
  const getTransferredItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const transferredItems = await api('/transactions/transferred-items'); // GET /api/transactions/transferred-items
      return transferredItems;
    } catch (err: any) {
      setError(err.message);
      toast({
        title: 'Error fetching transferred items',
        description: err.message,
        variant: 'destructive',
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Get all pending replacements
  const getPendingReplacements = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const pendingReplacements = await api('/transactions/pending-replacements'); // GET /api/transactions/pending-replacements
      return pendingReplacements;
    } catch (err: any) {
      setError(err.message);
      toast({
        title: 'Error fetching pending replacements',
        description: err.message,
        variant: 'destructive',
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Confirm pending replacement
  const confirmPendingReplacement = useCallback(async (
    id: string, 
    replacementDetails?: { 
      replacementAssetNumber?: string; 
      replacementSerialNumber?: string; 
    }
  ) => {
    setLoading(true);
    setError(null);
    try {
      await api(`/transactions/pending-replacements/${id}/confirm`, 'PUT', replacementDetails); // PUT /api/transactions/pending-replacements/:id/confirm
      toast({
        title: 'Replacement Confirmed',
        description: 'The pending replacement has been confirmed and removed from the list.',
      });
      // Refresh the list
      return await getPendingReplacements();
    } catch (err: any) {
      setError(err.message);
      toast({
        title: 'Error confirming replacement',
        description: err.message,
        variant: 'destructive',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getPendingReplacements]);
  
  // Get all confirmed replacements
  const getConfirmedReplacements = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const confirmedReplacements = await api('/transactions/confirmed-replacements'); // GET /api/transactions/confirmed-replacements
      return confirmedReplacements;
    } catch (err: any) {
      setError(err.message);
      toast({
        title: 'Error fetching confirmed replacements',
        description: err.message,
        variant: 'destructive',
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    items: filteredItems,
    allItems: items,
    categories,
    stats,
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    addItem,
    updateItem,
    deleteItem,
    addCategory,
    deleteCategory,
    createTransaction,
    getTransferredItems,
    getPendingReplacements,
    confirmPendingReplacement,
    getConfirmedReplacements,
    loading,
    error,
  };
};
