import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Category, InventoryItem } from "@/models/inventory";
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Package, XCircle } from "lucide-react";
import { useMemo, useState } from "react";

interface ExtractedItem {
  name: string;
  category: string;
  quantity: number;
  supplier: string;
  model?: string;
  serialNumber?: string;
  warranty?: string;
  purchaseDate?: string;
  location: string;
  description?: string;
}

interface MultiItemSelectorProps {
  items: ExtractedItem[];
  categories: Category[];
  existingItems?: InventoryItem[];
  onAddSelected: (selectedItems: ExtractedItem[]) => void;
  onCancel: () => void;
}

export function MultiItemSelector({ items, categories, existingItems = [], onAddSelected, onCancel }: MultiItemSelectorProps) {
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(
    new Set(items.map((_, index) => index)) // All items selected by default
  );
  const [editedItems, setEditedItems] = useState<ExtractedItem[]>([...items]);
  const [expandedIndices, setExpandedIndices] = useState<Set<number>>(new Set());

  // Check for duplicates for each item
  const duplicateErrors = useMemo(() => {
    const errors = new Map<number, string>();
    
    editedItems.forEach((item, index) => {
      if (!item.serialNumber) return;
      
      const serials = item.serialNumber.split(/[\n,]/).map(s => s.trim()).filter(Boolean);
      if (serials.length === 0) return;

      for (const newSerial of serials) {
        const duplicateItem = existingItems.find(existing => {
           if (!existing.serialNumber) return false;
           const existingSerials = existing.serialNumber.split(/[\n,]/).map(s => s.trim()).filter(Boolean);
           return existingSerials.some(existingSerial => existingSerial.toLowerCase() === newSerial.toLowerCase());
        });

        if (duplicateItem) {
          errors.set(index, `Serial '${newSerial}' exists in '${duplicateItem.name}'`);
          break; // Stop at first error for this item
        }
      }
    });
    return errors;
  }, [editedItems, existingItems]);


  const toggleItem = (index: number) => {
    const newSelected = new Set(selectedIndices);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedIndices(newSelected);
  };

  const toggleExpand = (index: number) => {
    const newExpanded = new Set(expandedIndices);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedIndices(newExpanded);
  };

  const selectAll = () => {
    setSelectedIndices(new Set(items.map((_, index) => index)));
  };

  const deselectAll = () => {
    setSelectedIndices(new Set());
  };

  const expandAll = () => {
    setExpandedIndices(new Set(items.map((_, index) => index)));
  };

  const collapseAll = () => {
    setExpandedIndices(new Set());
  };

  const handleFieldChange = (index: number, field: keyof ExtractedItem, value: string | number) => {
    const newItems = [...editedItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setEditedItems(newItems);
  };

  const handleAddSelected = () => {
    const selectedItems = editedItems.filter((_, index) => selectedIndices.has(index));
    onAddSelected(selectedItems);
  };

  // Check if any SELECTED item has an error
  const hasSelectedErrors = Array.from(selectedIndices).some(index => duplicateErrors.has(index));

  return (
    <div className="w-full">
      <div className="mb-3">
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <Package className="h-5 w-5" />
          {items.length} Item{items.length > 1 ? 's' : ''} Found
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Review and edit items before adding to inventory.
        </p>
      </div>
      <div className="space-y-3">
        <div className="flex gap-2 justify-between items-center flex-wrap mb-3">
          <div className="text-sm text-muted-foreground">
            {selectedIndices.size} of {items.length} item{items.length > 1 ? 's' : ''} selected
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={selectAll}>
              Select All
            </Button>
            <Button variant="outline" size="sm" onClick={deselectAll}>
              Deselect All
            </Button>
            <Button variant="outline" size="sm" onClick={expandAll}>
              Expand All
            </Button>
            <Button variant="outline" size="sm" onClick={collapseAll}>
              Collapse All
            </Button>
          </div>
        </div>

        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {editedItems.map((item, index) => {
              const isExpanded = expandedIndices.has(index);
              const isSelected = selectedIndices.has(index);
              const error = duplicateErrors.get(index);

              return (
                <Card
                  key={index}
                  className={`transition-all ${
                    error 
                      ? 'border-destructive bg-destructive/5' 
                      : isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-muted'
                  }`}
                >
                  <CardContent className="p-4">
                    {/* Header Row */}
                    <div className="flex items-start gap-3 mb-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleItem(index)}
                        className="mt-1"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-base">{item.name || 'Unnamed Item'}</h4>
                                {error && (
                                    <Badge variant="destructive" className="text-xs flex items-center gap-1">
                                        <AlertTriangle className="h-3 w-3" />
                                        Duplicate Serial
                                    </Badge>
                                )}
                            </div>
                            <div className="flex gap-2 mt-1 flex-wrap">
                              {item.category && (
                                <Badge variant="secondary" className="text-xs">
                                  {item.category}
                                </Badge>
                              )}
                              <span className="text-sm text-muted-foreground">
                                Qty: <span className="font-medium">{item.quantity}</span>
                              </span>
                            </div>
                            {error && (
                                <p className="text-xs text-destructive font-medium mt-1">
                                    {error}
                                </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {isSelected ? (
                              <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                            ) : (
                              <XCircle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleExpand(index)}
                              className="h-8 w-8 p-0"
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Editable Fields - Shown when expanded */}
                    {isExpanded && (
                      <div className="ml-8 space-y-4 pt-3 border-t">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor={`name-${index}`} className="text-xs">Item Name *</Label>
                            <Input
                              id={`name-${index}`}
                              value={item.name}
                              onChange={(e) => handleFieldChange(index, 'name', e.target.value)}
                              placeholder="Item name"
                              className="h-9"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`category-${index}`} className="text-xs">Category *</Label>
                            <Select 
                              value={item.category} 
                              onValueChange={(value) => handleFieldChange(index, 'category', value)}
                            >
                              <SelectTrigger id={`category-${index}`} className="h-9">
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                              <SelectContent>
                                {categories.map((cat) => (
                                  <SelectItem key={cat.id} value={cat.name}>
                                    {cat.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`quantity-${index}`} className="text-xs">Quantity *</Label>
                            <Input
                              id={`quantity-${index}`}
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleFieldChange(index, 'quantity', parseInt(e.target.value) || 0)}
                              placeholder="Quantity"
                              min="0"
                              className="h-9"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`supplier-${index}`} className="text-xs">Supplier</Label>
                            <Input
                              id={`supplier-${index}`}
                              value={item.supplier}
                              onChange={(e) => handleFieldChange(index, 'supplier', e.target.value)}
                              placeholder="Supplier name"
                              className="h-9"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`model-${index}`} className="text-xs">Model</Label>
                            <Input
                              id={`model-${index}`}
                              value={item.model || ''}
                              onChange={(e) => handleFieldChange(index, 'model', e.target.value)}
                              placeholder="Model number"
                              className="h-9"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`warranty-${index}`} className="text-xs">Warranty</Label>
                            <Input
                              id={`warranty-${index}`}
                              value={item.warranty || ''}
                              onChange={(e) => handleFieldChange(index, 'warranty', e.target.value)}
                              placeholder="e.g., 1 Year"
                              className="h-9"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`purchaseDate-${index}`} className="text-xs">Purchase Date</Label>
                            <Input
                              id={`purchaseDate-${index}`}
                              type="date"
                              value={item.purchaseDate || ''}
                              onChange={(e) => handleFieldChange(index, 'purchaseDate', e.target.value)}
                              className="h-9"
                            />
                          </div>

                          <div className="space-y-2 md:col-span-2">
                            <Label htmlFor={`serialNumber-${index}`} className="text-xs">Serial Number(s)</Label>
                            <Textarea
                              id={`serialNumber-${index}`}
                              value={item.serialNumber || ''}
                              onChange={(e) => handleFieldChange(index, 'serialNumber', e.target.value)}
                              placeholder="Enter serial numbers (one per line or comma-separated)"
                              className={`min-h-[60px] text-sm ${error ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                            />
                            {error && (
                                <p className="text-xs text-destructive mt-1">{error}</p>
                            )}
                          </div>

                          <div className="space-y-2 md:col-span-2">
                            <Label htmlFor={`location-${index}`} className="text-xs">Storage Location *</Label>
                            <Input
                              id={`location-${index}`}
                              value={item.location}
                              onChange={(e) => handleFieldChange(index, 'location', e.target.value)}
                              placeholder="e.g., Warehouse A, Shelf 12"
                              className="h-9"
                            />
                          </div>

                          {item.description && (
                            <div className="space-y-2 md:col-span-2">
                              <Label htmlFor={`description-${index}`} className="text-xs">Description</Label>
                              <Textarea
                                id={`description-${index}`}
                                value={item.description || ''}
                                onChange={(e) => handleFieldChange(index, 'description', e.target.value)}
                                placeholder="Item description"
                                className="min-h-[60px] text-sm"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>

        <div className="flex gap-3 pt-3 border-t mt-3">
          <Button
            onClick={handleAddSelected}
            disabled={selectedIndices.size === 0 || hasSelectedErrors}
            className="flex-1"
          >
            {hasSelectedErrors ? 'Fix Duplicate Serials to Continue' : `Add ${selectedIndices.size} Item${selectedIndices.size !== 1 ? 's' : ''} to Inventory`}
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
