// View - Inventory List Page
import { DirectTransferForm } from "@/components/inventory/DirectTransferForm";
import { InventoryTable } from "@/components/inventory/InventoryTable";
import { ItemForm } from "@/components/inventory/ItemForm";
import { TransactionForm } from "@/components/inventory/TransactionForm";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useInventoryController } from "@/controllers/useInventoryController";
import { InventoryItem } from "@/models/inventory";
import { ArrowLeftRight, Plus, Search } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function InventoryList() {
  const navigate = useNavigate();
  const {
    items,
    allItems,
    categories,
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    updateItem,
    deleteItem,
    createTransaction,
  } = useInventoryController();

  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [transactionItem, setTransactionItem] = useState<InventoryItem | null>(null);
  const [transferSerial, setTransferSerial] = useState<string>("");
  const [viewingItem, setViewingItem] = useState<InventoryItem | null>(null);
  const [isDirectTransferOpen, setIsDirectTransferOpen] = useState(false);

  const handleDirectTransferSubmit = (transactionData: any) => {
    createTransaction(transactionData);
    setIsDirectTransferOpen(false);
  };

  const handleView = (item: InventoryItem) => {
    setViewingItem(item);
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
  };

  const handleUpdate = async (updates: Omit<InventoryItem, 'id' | 'status' | 'lastUpdated'>) => {
    if (editingItem) {
      try {
        await updateItem(editingItem.id, updates);
        setEditingItem(null);
      } catch (error) {
        // Error is handled by controller toast, but we keep dialog open
        console.error("Failed to update item:", error);
      }
    }
  };

  const handleTransaction = (item: InventoryItem) => {
    setTransactionItem(item);
    setTransferSerial(""); // Reset serial when opening generic transaction
  };

  const handleTransferSerial = (item: InventoryItem, serial: string) => {
    setTransactionItem(item);
    setTransferSerial(serial);
  };

  const handleCreateTransaction = (transactionData: {
    itemId: string;
    type: 'in' | 'out' | 'transfer';
    quantity: number;
    branch?: string;
  }) => {
    createTransaction(transactionData);
    setTransactionItem(null);
    setTransferSerial("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Inventory</h1>
          <p className="text-muted-foreground mt-1">Manage all your inventory items</p>
        </div>
        <div className="flex gap-2">
        <Button onClick={() => navigate('/add-item')}>
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
        <Button 
          variant="outline"
          onClick={() => setIsDirectTransferOpen(true)}
          className="ml-2 gap-2"
        >
          <ArrowLeftRight className="h-4 w-4" />
          Direct Transfer
        </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, supplier, or serial number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.name}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <InventoryTable
        items={items}
        onEdit={handleEdit}
        onDelete={deleteItem}
        onTransaction={handleTransaction}
        onView={handleView}
        onTransferSerial={handleTransferSerial}
        searchTerm={searchTerm}
      />

      <Dialog open={!!viewingItem} onOpenChange={() => setViewingItem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Item Details</DialogTitle>
          </DialogHeader>
          {viewingItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Name</p>
                  <p className="text-base font-semibold">{viewingItem.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Category</p>
                  <p className="text-base">{viewingItem.category}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Quantity</p>
                  <p className="text-base font-semibold">{viewingItem.quantity}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Supplier</p>
                  <p className="text-base">{viewingItem.supplier || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Model</p>
                  <p className="text-base">{viewingItem.model || 'N/A'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-medium text-muted-foreground">Serial Number(s)</p>
                  {viewingItem.serialNumber ? (
                    <div className="space-y-1 mt-1">
                      {viewingItem.serialNumber.split(',').map((serial, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <span className="text-xs bg-muted px-2 py-1 rounded font-mono">
                            {serial.trim()}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-base">N/A</p>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Warranty</p>
                  <p className="text-base">{viewingItem.warranty || 'N/A'}</p>
                  {viewingItem.warrantyExpiryDate && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Expires: {new Date(viewingItem.warrantyExpiryDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Purchase Date</p>
                  <p className="text-base">
                    {viewingItem.purchaseDate 
                      ? new Date(viewingItem.purchaseDate).toLocaleDateString() 
                      : 'N/A'}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-medium text-muted-foreground">Location</p>
                  <p className="text-base">{viewingItem.location}</p>
                </div>
                {viewingItem.description && (
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-muted-foreground">Description</p>
                    <p className="text-base">{viewingItem.description}</p>
                  </div>
                )}
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={() => { setViewingItem(null); handleEdit(viewingItem); }} className="flex-1">
                  Edit Item
                </Button>
                <Button variant="outline" onClick={() => setViewingItem(null)} className="flex-1">
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <ItemForm
              item={editingItem}
              categories={categories}
              existingItems={allItems}
              onSubmit={handleUpdate}
              onCancel={() => setEditingItem(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <TransactionForm
        item={transactionItem}
        isOpen={!!transactionItem}
        onClose={() => setTransactionItem(null)}
        initialSerialNumber={transferSerial}
        onSubmit={handleCreateTransaction}
      />

      <DirectTransferForm
        isOpen={isDirectTransferOpen}
        onClose={() => setIsDirectTransferOpen(false)}
        onSubmit={handleDirectTransferSubmit}
        categories={categories}
      />
    </div>
  );
}
