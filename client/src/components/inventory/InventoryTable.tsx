// View Component - Inventory Items Table
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { InventoryItem } from "@/models/inventory";
import { ArrowRightLeft, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";

interface InventoryTableProps {
  items: InventoryItem[];
  onEdit: (item: InventoryItem) => void;
  onDelete: (id: string, serialNumber?: string | string[], options?: { silent?: boolean }) => Promise<void>;
  onTransaction: (item: InventoryItem) => void;
  onView: (item: InventoryItem) => void;
  onTransferSerial?: (item: InventoryItem, serialNumber: string) => void;
  searchTerm?: string;
}

export function InventoryTable({ items, onEdit, onDelete, onTransaction, onView, onTransferSerial, searchTerm = "" }: InventoryTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const itemsPerPage = 10;

  // Flatten items: separate by serial number
  const displayItems = items.flatMap((item) => {
    if (item.serialNumber) {
      const serials = item.serialNumber.split(',').map(s => s.trim()).filter(s => s);
      
      if (serials.length > 0) {
        const rows = serials.map((serial, index) => ({
          ...item,
          // Create a unique ID for the key, but keep original ID for actions
          displayId: `${item.id}-${index}`,
          quantity: 1, // Display as single unit
          serialNumber: serial,
          isSplit: true
        }));

        // If there are more items than serial numbers, add a remainder row
        if (item.quantity > serials.length) {
          rows.push({
            ...item,
            displayId: `${item.id}-remainder`,
            quantity: item.quantity - serials.length,
            serialNumber: '',
            isSplit: true
          });
        }
        return rows;
      }
    }
    // Return original item if no serials
    return [{ ...item, displayId: item.id, isSplit: false }];
  }).filter(item => {
      // If no search term, show all
      if (!searchTerm) return true;
      
      const term = searchTerm.toLowerCase().trim();
      if (!term) return true;

      // Check if this specific row matches
      // 1. Name match (always show if name matches)
      if (item.name.toLowerCase().includes(term)) return true;
      
      // 2. Supplier match
      if (item.supplier && item.supplier.toLowerCase().includes(term)) return true;

      // 3. Serial Number match (Partial match for this specific row)
      // If this row has a serial number, check if it matches the search term partially
      if (item.serialNumber && item.serialNumber.toLowerCase().includes(term)) return true;

      // If the row has a serial number but it DOESN'T match the term, 
      // AND the name/supplier didn't match (checked above), then hide this row.
      // This ensures that if I search for "SN123", I only see the row with "SN123", 
      // not "SN456" even if they belong to the same parent item.
      
      return false;
  });

  // Pagination calculations
  const totalPages = Math.ceil(displayItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = displayItems.slice(startIndex, endIndex);

  // Reset to page 1 if current page exceeds total pages
  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(1);
  }

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(paginatedItems.map(item => item.displayId));
      setSelectedItems(allIds);
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectItem = (displayId: string, checked: boolean) => {
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(displayId);
    } else {
      newSelected.delete(displayId);
    }
    setSelectedItems(newSelected);
  };

  const { toast } = useToast();

  const handleBulkDelete = async () => {
    // Group selected items by ID
    const itemsToDelete = new Map<string, string[]>();
    const fullDeletes = new Set<string>();

    selectedItems.forEach(displayId => {
      const item = displayItems.find(i => i.displayId === displayId);
      if (item) {
        if (item.isSplit && item.serialNumber) {
           // If it's a split item (specific serial), add to list of serials to delete for this ID
           if (!itemsToDelete.has(item.id)) {
             itemsToDelete.set(item.id, []);
           }
           itemsToDelete.get(item.id)?.push(item.serialNumber);
        } else {
           // If it's not split (or no serial), it's a full delete
           fullDeletes.add(item.id);
        }
      }
    });

    let deletedCount = 0;

    const deletePromises: Promise<void>[] = [];

    // Process full deletes
    for (const id of fullDeletes) {
        deletePromises.push(onDelete(id, undefined, { silent: true }).then(() => {
            deletedCount++;
        }).catch(() => {}));
    }

    // Process partial deletes (specific serials)
    for (const [id, serials] of itemsToDelete) {
        // Only delete specific serials if the item wasn't already fully deleted
        if (!fullDeletes.has(id)) {
            deletePromises.push(onDelete(id, serials, { silent: true }).then(() => {
                deletedCount += serials.length;
            }).catch(() => {}));
        }
    }

    await Promise.all(deletePromises);

    toast({
      title: 'Items deleted',
      description: `Successfully deleted ${deletedCount} item(s).`,
      variant: 'destructive',
    });

    // Clear selection after delete
    setSelectedItems(new Set());
  };

  // Check if all items on current page are selected
  const allPageItemsSelected = paginatedItems.length > 0 && 
    paginatedItems.every(item => selectedItems.has(item.displayId));
  
  // Check if some items on current page are selected (for indeterminate state)
  const somePageItemsSelected = paginatedItems.some(item => selectedItems.has(item.displayId)) && 
    !allPageItemsSelected;

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push('ellipsis');
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('ellipsis');
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="space-y-4">
      {/* Bulk Actions Bar */}
      {selectedItems.size > 0 && (
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border-2 border-primary/30 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
              {selectedItems.size}
            </div>
            <div>
              <div className="text-sm font-semibold">
                {selectedItems.size} item{selectedItems.size > 1 ? 's' : ''} selected
              </div>
              <div className="text-xs text-muted-foreground">
                Ready for bulk action
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setSelectedItems(new Set())}
            >
              Clear Selection
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Multiple Items?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete {selectedItems.size} item{selectedItems.size > 1 ? 's' : ''}? 
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete {selectedItems.size} Item{selectedItems.size > 1 ? 's' : ''}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-muted/50">
              <TableHead className="w-12">
                <Checkbox
                  checked={allPageItemsSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all items on this page"
                  className="data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground"
                  {...(somePageItemsSelected ? { 'data-state': 'indeterminate' } : {})}
                />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Serial Number</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Model</TableHead>
              <TableHead>Purchase Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No items found. Add your first inventory item to get started.
                </TableCell>
              </TableRow>
            ) : (
              paginatedItems.map((item) => {
                const isSelected = selectedItems.has(item.displayId);
                return (
                  <TableRow 
                    key={item.displayId} 
                    className={`hover:bg-muted/30 cursor-pointer transition-colors ${
                      isSelected ? 'bg-primary/5 border-l-2 border-l-primary' : ''
                    }`}
                    onClick={() => onView(item)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => handleSelectItem(item.displayId, checked as boolean)}
                        aria-label={`Select ${item.name}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>
                    {item.serialNumber ? (
                      <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                        {item.serialNumber}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>
                    <span className="font-semibold">{item.quantity}</span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{item.model || 'N/A'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {item.purchaseDate ? new Date(item.purchaseDate).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    }) : item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    }) : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          // Find the original item to ensure we edit the full data (all serials), not just the split row
                          const originalItem = items.find(i => i.id === item.id);
                          if (originalItem) onEdit(originalItem);
                        }}
                        className="hover:bg-primary/10 hover:text-primary"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (item.isSplit && item.serialNumber && onTransferSerial) {
                            onTransferSerial(item, item.serialNumber);
                          } else {
                            onTransaction(item);
                          }
                        }}
                        className="hover:bg-blue-500/10 hover:text-blue-500"
                      >
                        <ArrowRightLeft className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              {item.isSplit && item.serialNumber
                                ? `This will remove the item with serial number "${item.serialNumber}" from the inventory.` 
                                : "This action cannot be undone. This will permanently delete the item."}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => {
                              if (item.isSplit && item.serialNumber) {
                                onDelete(item.id, item.serialNumber);
                              } else {
                                onDelete(item.id);
                              }
                            }}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {displayItems.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to {Math.min(endIndex, displayItems.length)} of {displayItems.length} items
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              
              {getPageNumbers().map((page, index) => (
                <PaginationItem key={index}>
                  {page === 'ellipsis' ? (
                    <PaginationEllipsis />
                  ) : (
                    <PaginationLink
                      onClick={() => setCurrentPage(page)}
                      isActive={currentPage === page}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  )}
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext 
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
