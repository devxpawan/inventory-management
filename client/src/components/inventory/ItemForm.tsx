import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Category, InventoryItem } from "@/models/inventory";
import axios from "axios";
import { AlertCircle, Building2, Calendar, CheckCircle2, Hash, Loader2, MapPin, Package, Shield, Tag, Upload } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { MultiItemSelector } from "./MultiItemSelector";

interface ItemFormProps {
  item?: InventoryItem;
  categories: Category[];
  existingItems?: InventoryItem[];
  onSubmit: (item: Omit<InventoryItem, 'id' | 'status' | 'lastUpdated'> & { allowDuplicates?: boolean }) => void;
  onSubmitMultiple?: (items: (Omit<InventoryItem, 'id' | 'status' | 'lastUpdated'> & { allowDuplicates?: boolean })[]) => void;
  onCancel?: () => void;
}

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

export function ItemForm({ item, categories, existingItems = [], onSubmit, onSubmitMultiple, onCancel }: ItemFormProps) {
  const [uploading, setUploading] = useState(false);
  const [extractedItems, setExtractedItems] = useState<ExtractedItem[]>([]);
  const [showItemSelector, setShowItemSelector] = useState(false);
  const [formData, setFormData] = useState({
    name: item?.name || '',
    category: item?.category || '',
    quantity: item?.quantity || 0,

    supplier: item?.supplier || '',
    model: item?.model || '',
    serialNumber: item?.serialNumber || '',
    warranty: item?.warranty || '',
    purchaseDate: item?.purchaseDate ? new Date(item.purchaseDate).toISOString().split('T')[0] : '',
    location: item?.location || 'Headoffice',
  });

  const [allowDuplicates, setAllowDuplicates] = useState(false);
  const [isMultiMode, setIsMultiMode] = useState(false);

  const [duplicateError, setDuplicateError] = useState<string | null>(null);

  // Effect to detect multiple serial numbers and check for duplicates
  useEffect(() => {
    const serials = formData.serialNumber.split(/[\n,]/).map(s => s.trim()).filter(Boolean);
    const multi = serials.length > 1;
    setIsMultiMode(multi);
    
    // Update quantity if in multi-mode
    if (multi) {
       setFormData(prev => {
           if (prev.quantity !== serials.length) {
               return { ...prev, quantity: serials.length };
           }
           return prev;
       });
    }

    // Real-time duplicate check
    let error = null;
    if (existingItems.length > 0 && serials.length > 0) {
      for (const newSerial of serials) {
        const duplicateItem = existingItems.find(existing => {
          // Skip the current item if we are editing
          // Check both id and _id to be safe against inconsistencies
          if (item && (existing.id === item.id || (existing as any)._id === item.id || existing.id === (item as any)._id)) return false;
          
          if (!existing.serialNumber) return false;
          
          const existingSerials = existing.serialNumber.split(/[\n,]/).map(s => s.trim()).filter(Boolean);
          
          // Filter out serials that are in the current form (to avoid self-comparison)
          const existingSerialsFiltered = existingSerials.filter(existingSerial => 
            !serials.some(currentSerial => currentSerial.toLowerCase() === existingSerial.toLowerCase())
          );
          
          // Case-insensitive comparison
          return existingSerialsFiltered.some(existingSerial => existingSerial.toLowerCase() === newSerial.toLowerCase());
        });

        if (duplicateItem) {
          error = `Serial number '${newSerial}' already exists in another item: '${duplicateItem.name}'`;
          break;
        }
      }
    }
    setDuplicateError(error);
  }, [formData.serialNumber, existingItems, item]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Trim and filter serial numbers
    const serialNumbers = formData.serialNumber
      .split(/[\n,]/)
      .map(s => s.trim())
      .filter(Boolean);

    // Check for duplicate serial numbers
    if (existingItems.length > 0 && serialNumbers.length > 0) {
      for (const newSerial of serialNumbers) {
        const duplicateItem = existingItems.find(existing => {
          // Skip the current item if we are editing
          // Check both id and _id to be safe against inconsistencies
          if (item && (existing.id === item.id || (existing as any)._id === item.id || existing.id === (item as any)._id)) return false;
          
          if (!existing.serialNumber) return false;
          
          const existingSerials = existing.serialNumber.split(/[\n,]/).map(s => s.trim()).filter(Boolean);
          
          // Filter out serials that are in the current form (to avoid self-comparison)
          const existingSerialsFiltered = existingSerials.filter(existingSerial => 
            !serialNumbers.some(currentSerial => currentSerial.toLowerCase() === existingSerial.toLowerCase())
          );
          
          // Case-insensitive comparison
          return existingSerialsFiltered.some(existingSerial => existingSerial.toLowerCase() === newSerial.toLowerCase());
        });

        if (duplicateItem) {
          toast.error(`Serial number '${newSerial}' already exists in another item: '${duplicateItem.name}'`);
          return; // Stop submission
        }
      }
    }

    // Check if we are in multiple item mode and the callback is available
    if (serialNumbers.length > 1 && onSubmitMultiple) {
      const itemsToCreate = serialNumbers.map(sn => ({
        ...formData,
        purchaseDate: formData.purchaseDate ? new Date(formData.purchaseDate) : new Date(),
        serialNumber: sn,
        quantity: 1, // Each item with a serial number has a quantity of 1
        allowDuplicates,
      }));
      onSubmitMultiple(itemsToCreate);
    } else {
      // Standard single item submission
      onSubmit({
        ...formData,
        purchaseDate: formData.purchaseDate ? new Date(formData.purchaseDate) : new Date(),
        // Ensure quantity is at least 1 if not in multi-mode
        quantity: formData.quantity > 0 ? formData.quantity : 1,
        serialNumber: serialNumbers.join(', '), // Consolidate back to a string
        allowDuplicates,
      });
    }
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const processFiles = async (files: File[]) => {
    if (files.length === 0) return;

    setUploading(true);
    const allExtractedItems: ExtractedItem[] = [];
    let successCount = 0;

    try {
      for (const file of files) {
        const formDataToSend = new FormData();
        formDataToSend.append('invoice', file);

        try {
          const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
          const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/inventory/upload-invoice`, formDataToSend, {
            headers: {
              'Content-Type': 'multipart/form-data',
              Authorization: `Bearer ${userInfo.token}`,
            },
          });

          const { items } = response.data;
          
          if (items && items.length > 0) {
            allExtractedItems.push(...items);
            successCount++;
          }
        } catch (error) {
          console.error(`Error uploading file ${file.name}:`, error);
          toast.error(`Failed to extract data from ${file.name}`);
        }
      }
      
      if (allExtractedItems.length > 0) {
        if (allExtractedItems.length === 1) {
          // Single item - auto-fill the form
          const extractedData = allExtractedItems[0];
          setFormData(prev => ({
            ...prev,
            name: extractedData.name || prev.name,
            category: extractedData.category || prev.category,
            quantity: extractedData.quantity || prev.quantity,

            supplier: extractedData.supplier || prev.supplier,
            model: extractedData.model || prev.model,
            serialNumber: extractedData.serialNumber 
              ? (prev.serialNumber ? prev.serialNumber + ', ' + extractedData.serialNumber : extractedData.serialNumber)
              : prev.serialNumber,
            warranty: extractedData.warranty || prev.warranty,
            purchaseDate: extractedData.purchaseDate || prev.purchaseDate,
            location: extractedData.location || prev.location,
          }));
          toast.success("Invoice data extracted successfully!");
        } else {
          // Multiple items - show selector
          setExtractedItems(allExtractedItems);
          setShowItemSelector(true);
          toast.success(`Found ${allExtractedItems.length} items from ${successCount} invoice(s)!`);
        }
      }
    } catch (error) {
      console.error("Error processing invoices:", error);
      toast.error("An unexpected error occurred while processing invoices.");
    } finally {
      setUploading(false);
    }
  };

  const handleFileDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      processFiles(acceptedFiles);
    }
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await processFiles(Array.from(files));
    // Reset file input
    e.target.value = '';
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFileDrop,
    accept: {
      'image/*': [],
      'application/pdf': []
    },
    multiple: true,
    disabled: uploading,
  });

  const handleAddSelectedItems = (selectedItems: ExtractedItem[]) => {
    setShowItemSelector(false);
    
    if (selectedItems.length === 0) {
      toast.info("No items selected");
      return;
    }

    if (selectedItems.length === 1) {
      // Single item - just fill the form
      const item = selectedItems[0];
      setFormData({
        name: item.name,
        category: item.category,
        quantity: item.quantity,

        supplier: item.supplier,
        model: item.model || '',
        serialNumber: item.serialNumber || '',
        warranty: item.warranty || '',
        purchaseDate: item.purchaseDate || '',
        location: item.location,
      });
      toast.success("Item data loaded! Review and click 'Add Item' to save.");
    } else {
      // Multiple items - use the onSubmitMultiple callback if available
      if (onSubmitMultiple) {
        toast.info(`Adding ${selectedItems.length} items to inventory...`);
        // Transform ExtractedItem to match InventoryItem type
        const transformedItems = selectedItems.map(item => ({
          name: item.name,
          category: item.category,
          quantity: item.quantity,

          supplier: item.supplier,
          model: item.model,
          serialNumber: item.serialNumber,
          warranty: item.warranty,
          purchaseDate: item.purchaseDate ? new Date(item.purchaseDate) : new Date(),
          location: item.location,
          description: item.description,
        }));
        onSubmitMultiple(transformedItems);
      } else {
        toast.error("Multiple item submission is not supported in this context");
      }
    }

    // Clear extracted items
    setExtractedItems([]);
  };

  return (
    <>
      <Dialog open={showItemSelector} onOpenChange={setShowItemSelector}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Select Items to Add</DialogTitle>
            <DialogDescription>
              Multiple items were found in the invoice. Select which ones you want to add to inventory.
            </DialogDescription>
          </DialogHeader>
          <MultiItemSelector
            items={extractedItems}
            categories={categories}
            existingItems={existingItems}
            onAddSelected={handleAddSelectedItems}
            onCancel={() => setShowItemSelector(false)}
          />
        </DialogContent>
      </Dialog>

      <Card className="border-border/50 shadow-lg">
      
      <CardContent className="pt-6">
        {!item && (
          <div 
            {...getRootProps()} 
            className={`mb-8 p-6 border-2 border-dashed rounded-xl bg-gradient-to-br from-muted/30 to-muted/50 cursor-pointer flex flex-col items-center gap-3 transition-all hover:border-primary/50 hover:bg-primary/5 ${isDragActive ? 'border-primary bg-primary/10 scale-[1.02]' : 'border-border'}`}
          >
            <input {...getInputProps()} id="invoice-upload" />
            <div className={`p-4 rounded-full ${uploading ? 'bg-primary/10' : 'bg-background'} transition-colors`}>
              {uploading ? (
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              ) : (
                <Upload className="h-10 w-10 text-primary" />
              )}
            </div>
            <div className="text-center space-y-1">
              <p className="text-base font-semibold text-foreground">
                {uploading ? "Processing Invoice(s)..." : (isDragActive ? "Drop the invoice(s) here" : "Upload Invoice to Auto-Fill")}
              </p>
              <p className="text-sm text-muted-foreground">
                {!uploading && !isDragActive && "Drag & drop invoice(s) here, or click to browse"}
              </p>
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5 mt-2">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Supports Images and PDFs
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b">
              <Package className="h-5 w-5 text-primary" />
              <h3 className="text-base font-bold text-foreground">Basic Information</h3>
              <span className="ml-auto text-xs text-destructive font-medium">* Required</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-semibold flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-primary" />
                  Item Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  required
                  placeholder="e.g., Laptop Dell XPS 15"
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-semibold flex items-center gap-1.5">
                  <Package className="h-3.5 w-3.5 text-primary" />
                  Category <span className="text-destructive">*</span>
                </Label>
                <Select value={formData.category} onValueChange={(value) => handleChange('category', value)}>
                  <SelectTrigger className={`h-11 ${formData.category ? 'border-primary/50 bg-primary/5' : ''}`}>
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
                <Label htmlFor="supplier" className="text-sm font-semibold flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                  Supplier
                </Label>
                <Input
                  id="supplier"
                  value={formData.supplier}
                  onChange={(e) => handleChange('supplier', e.target.value)}
                  placeholder="e.g., Tech Distributors Inc."
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="model" className="text-sm font-semibold flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                  Model
                </Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={(e) => handleChange('model', e.target.value)}
                  placeholder="e.g., XPS 15"
                  className="h-11"
                />
              </div>
            </div>
          </div>

          {/* Serial Numbers & Quantity Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b">
              <Hash className="h-5 w-5 text-primary" />
              <h3 className="text-base font-bold text-foreground">Serial Numbers & Quantity</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="serialNumber" className="text-sm font-semibold flex items-center gap-1.5">
                  <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                  Serial Number(s)
                </Label>
                <Textarea
                  id="serialNumber"
                  value={formData.serialNumber}
                  onChange={(e) => handleChange('serialNumber', e.target.value)}
                  placeholder="Enter each serial number on a new line or separated by commas."
                  className={`min-h-[100px] ${duplicateError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                />
                {duplicateError && (
                  <div className="flex items-center gap-2 mt-1 p-2 bg-destructive/10 border border-destructive/20 rounded-md">
                    <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                    <p className="text-sm font-medium text-destructive">
                      {duplicateError}
                    </p>
                  </div>
                )}
                
                <div className="flex items-center space-x-2 mt-2">
                  <Checkbox 
                    id="allowDuplicates" 
                    checked={allowDuplicates}
                    onCheckedChange={(checked) => setAllowDuplicates(checked as boolean)}
                  />
                  <label
                    htmlFor="allowDuplicates"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Allow duplicate serial numbers (Not recommended)
                  </label>
                </div>

                <p className="text-xs text-muted-foreground mt-1 flex items-start gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                  For multiple items, list each serial number. The quantity will be automatically calculated.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity" className="text-sm font-semibold flex items-center gap-1.5">
                  <Hash className="h-3.5 w-3.5 text-primary" />
                  {item ? 'Current Quantity' : 'Adding Quantity'} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => handleChange('quantity', parseInt(e.target.value) || 0)}
                  required
                  min="0"
                  disabled={isMultiMode}
                  className="h-11"
                />
                {isMultiMode && (
                  <p className="text-xs text-muted-foreground">Auto-calculated from serial numbers</p>
                )}
              </div>



              <div className="space-y-2">
                <Label htmlFor="warranty" className="text-sm font-semibold flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                  Warranty Period
                </Label>
                <Input
                  id="warranty"
                  value={formData.warranty}
                  onChange={(e) => handleChange('warranty', e.target.value)}
                  placeholder="e.g., 3 Years, 12 Months"
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="purchaseDate" className="text-sm font-semibold flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-primary" />
                  Purchase Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="purchaseDate"
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => handleChange('purchaseDate', e.target.value)}
                  required
                  className="h-11"
                />
              </div>
            </div>
          </div>

          {/* Location Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b">
              <MapPin className="h-5 w-5 text-primary" />
              <h3 className="text-base font-bold text-foreground">Storage Location</h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="text-sm font-semibold flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                Storage Location <span className="text-destructive">*</span>
              </Label>
              <Input
                id="location"
                value="Headoffice"
                readOnly
                disabled
                required
                className="h-11 bg-muted cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground">All items are stored at Headoffice by default</p>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button 
              type="submit" 
              className="flex-1 h-11 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-md hover:shadow-lg transition-all" 
              disabled={!!duplicateError && !allowDuplicates}
            >
              <Package className="h-4 w-4 mr-2" />
              {item ? 'Update Item' : 'Add Item'}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} className="h-11 px-6">
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
      </Card>
    </>
  );
}
