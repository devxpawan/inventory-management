// View - Transferred Items List Page (Excel-like Sheet View)

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useInventoryController } from "@/controllers/useInventoryController";
import { InventoryItem } from "@/models/inventory";
import { ArrowUpDown, Calendar, Download, Filter, Hash, MapPin, Package, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import fedBranchesData from "../fed_branches.json";

interface TransferredItemGroup {
  branch: string;
  items: (Pick<InventoryItem, 'id' | 'name' | 'category'> & { 
    quantity: number;
    assetNumber?: string;
    model?: string;
    serialNumber?: string;
    itemTrackingId?: string;
    reason?: string;
    transferDate?: string;
  })[];
}

type FlatTransferredItem = Pick<InventoryItem, 'id' | 'name' | 'category'> & {
  quantity: number;
  assetNumber?: string;
  model?: string;
  serialNumber?: string;
  itemTrackingId?: string;
  reason?: string;
  transferDate?: string;
  branch: string;
};



type SortField = 'name' | 'category' | 'branch' | 'transferDate' | 'quantity' | 'itemTrackingId' | 'reason';
type SortDirection = 'asc' | 'desc';

export default function TransferredItemsList() {
  const { getTransferredItems, createTransaction, loading, categories } = useInventoryController();
  const [groupedItems, setGroupedItems] = useState<TransferredItemGroup[]>([]);

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('branch');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  
  // Filter states
  const [filterBranch, setFilterBranch] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [showFilters, setShowFilters] = useState<boolean>(false);

  const fetchItems = async () => {
    const items = await getTransferredItems();
    setGroupedItems(items);
  };

  useEffect(() => {
    fetchItems();
  }, [getTransferredItems]);



  // Flatten grouped items into a single array
  const flattenedItems = useMemo<FlatTransferredItem[]>(() => {
    return groupedItems.flatMap(group => 
      group.items.map(item => ({
        ...item,
        branch: group.branch
      }))
    );
  }, [groupedItems]);

  // Get ALL branches from system (fed_branches.json)
  const allBranches = useMemo(() => {
    return fedBranchesData.fed_branches.sort();
  }, []);

  // Get ALL categories from database
  const allCategories = useMemo(() => {
    return categories.map(cat => cat.name).sort();
  }, [categories]);


  // Apply filters
  const filteredByFilters = useMemo(() => {
    let items = flattenedItems;

    // Branch filter
    if (filterBranch !== 'all') {
      items = items.filter(item => item.branch === filterBranch);
    }

    // Category filter
    if (filterCategory !== 'all') {
      items = items.filter(item => item.category === filterCategory);
    }

    // Date range filter
    if (filterDateFrom) {
      const fromDate = new Date(filterDateFrom);
      fromDate.setHours(0, 0, 0, 0);
      items = items.filter(item => {
        if (!item.transferDate) return false;
        const itemDate = new Date(item.transferDate);
        itemDate.setHours(0, 0, 0, 0);
        return itemDate >= fromDate;
      });
    }

    if (filterDateTo) {
      const toDate = new Date(filterDateTo);
      toDate.setHours(23, 59, 59, 999);
      items = items.filter(item => {
        if (!item.transferDate) return false;
        const itemDate = new Date(item.transferDate);
        return itemDate <= toDate;
      });
    }

    return items;
  }, [flattenedItems, filterBranch, filterCategory, filterDateFrom, filterDateTo]);

  // Filter items based on search term
  const filteredItems = useMemo(() => {
    if (!searchTerm) {
      return filteredByFilters;
    }
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    
    return filteredByFilters.filter(item => 
      (item.name && item.name.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (item.branch && item.branch.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (item.itemTrackingId && item.itemTrackingId.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (item.assetNumber && item.assetNumber.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (item.serialNumber && item.serialNumber.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (item.model && item.model.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (item.category && item.category.toLowerCase().includes(lowerCaseSearchTerm))
    );
  }, [filteredByFilters, searchTerm]);

  // Sort items
  const sortedItems = useMemo(() => {
    const sorted = [...filteredItems].sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      // Handle undefined values
      if (aValue === undefined) aValue = '';
      if (bValue === undefined) bValue = '';

      // Handle dates
      if (sortField === 'transferDate') {
        aValue = aValue ? new Date(aValue).getTime() : 0;
        bValue = bValue ? new Date(bValue).getTime() : 0;
      }

      // Handle numbers
      if (sortField === 'quantity') {
        aValue = Number(aValue) || 0;
        bValue = Number(bValue) || 0;
      }

      // String comparison
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [filteredItems, sortField, sortDirection]);

  // Handle column sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Clear all filters
  const handleClearFilters = () => {
    setFilterBranch('all');
    setFilterCategory('all');
    setFilterDateFrom('');
    setFilterDateTo('');
    setSearchTerm('');
  };

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filterBranch !== 'all') count++;
    if (filterCategory !== 'all') count++;
    if (filterDateFrom) count++;
    if (filterDateTo) count++;
    return count;
  }, [filterBranch, filterCategory, filterDateFrom, filterDateTo]);

  // Export to CSV functionality
  const handleExportToCSV = () => {
    const headers = ['Branch', 'Item Name', 'Category', 'Model', 'Tracking ID', 'Serial Number', 'Asset Number', 'Quantity', 'Transfer Date', 'Reason'];
    const csvData = sortedItems.map(item => [
      item.branch || '',
      item.name || '',
      item.category || '',
      item.model || '',
      item.itemTrackingId || '',
      item.serialNumber || '',
      item.assetNumber || '',
      item.quantity || '',
      item.transferDate ? new Date(item.transferDate).toLocaleDateString() : '',
      item.reason || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `transferred-items-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate total items for summary
  const totalItems = useMemo(() => {
    return groupedItems.reduce((acc, group) => acc + group.items.reduce((sum, item) => sum + item.quantity, 0), 0);
  }, [groupedItems]);

  const totalBranches = groupedItems.length;

  // Render sort icon
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3.5 w-3.5 ml-1 opacity-50" />;
    }
    return (
      <ArrowUpDown 
        className={`h-3.5 w-3.5 ml-1 ${sortDirection === 'desc' ? 'rotate-180' : ''}`} 
      />
    );
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Transferred Items</h1>
          <p className="text-muted-foreground mt-1">
            Excel-like view of all items currently located at external branches.
          </p>
        </div>
        <div className="flex gap-4">
           <Card className="p-4 flex items-center gap-4 bg-primary/5 border-primary/20">
             <div className="p-2 bg-primary/10 rounded-full">
               <MapPin className="h-5 w-5 text-primary" />
             </div>
             <div>
               <p className="text-sm font-medium text-muted-foreground">Active Branches</p>
               <h3 className="text-2xl font-bold">{totalBranches}</h3>
             </div>
           </Card>
           <Card className="p-4 flex items-center gap-4 bg-orange-500/5 border-orange-500/20">
             <div className="p-2 bg-orange-500/10 rounded-full">
               <Package className="h-5 w-5 text-orange-600" />
             </div>
             <div>
               <p className="text-sm font-medium text-muted-foreground">Total Items</p>
               <h3 className="text-2xl font-bold text-orange-600">{totalItems}</h3>
             </div>
           </Card>
        </div>
      </div>

      {/* Filters Section - Compact & Collapsible */}
      <Card className="border-dashed">
        <CardHeader className="py-2 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="h-7 px-2 gap-1.5"
              >
                <Filter className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">Filters</span>
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="h-4 px-1.5 text-xs">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </div>
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="h-7 px-2 gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
                Clear
              </Button>
            )}
          </div>
          
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2 mt-2 pt-2 border-t">
              {/* Branch Filter */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Branch</label>
                <Select value={filterBranch} onValueChange={setFilterBranch}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="All Branches" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Branches</SelectItem>
                    {allBranches.map(branch => (
                      <SelectItem key={branch} value={branch}>{branch}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Category Filter */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Category</label>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {allCategories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date From Filter */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Date From</label>
                <Input
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              {/* Date To Filter */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Date To</label>
                <Input
                  type="date"
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              {/* Clear Filters Button */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground invisible">Actions</label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearFilters}
                  className="h-8 w-full gap-1.5 text-xs"
                  disabled={activeFiltersCount === 0 && !searchTerm}
                >
                  <X className="h-3 w-3" />
                  Clear All
                </Button>
              </div>
            </div>
          )}
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search items, branches, serials..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleExportToCSV}
              className="gap-2"
              disabled={sortedItems.length === 0}
            >
              <Download className="h-4 w-4" />
              Export to CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading && groupedItems.length === 0 ? (
            <div className="space-y-2 p-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : sortedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-4 rounded-full bg-muted mb-4">
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">No items found</h3>
              <p className="text-muted-foreground mt-1 max-w-sm">
                {searchTerm || activeFiltersCount > 0
                  ? "No items match your search or filter criteria. Try adjusting your filters." 
                  : "No items have been transferred to any branches yet."}
              </p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <Table>
                  <TableHeader className="bg-muted/50 sticky top-0 z-10">
                    <TableRow>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/80 select-none bg-muted/50"
                        onClick={() => handleSort('branch')}
                      >
                        <div className="flex items-center">
                          Branch
                          <SortIcon field="branch" />
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/80 select-none bg-muted/50"
                        onClick={() => handleSort('name')}
                      >
                        <div className="flex items-center">
                          Item Name
                          <SortIcon field="name" />
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/80 select-none bg-muted/50"
                        onClick={() => handleSort('category')}
                      >
                        <div className="flex items-center">
                          Category
                          <SortIcon field="category" />
                        </div>
                      </TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/80 select-none bg-muted/50"
                        onClick={() => handleSort('itemTrackingId')}
                      >
                        <div className="flex items-center">
                          Tracking ID
                          <SortIcon field="itemTrackingId" />
                        </div>
                      </TableHead>
                      <TableHead>Serial Number</TableHead>
                      <TableHead>Asset Number</TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/80 select-none text-right bg-muted/50"
                        onClick={() => handleSort('quantity')}
                      >
                        <div className="flex items-center justify-end">
                          Qty
                          <SortIcon field="quantity" />
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/80 select-none bg-muted/50"
                        onClick={() => handleSort('transferDate')}
                      >
                        <div className="flex items-center">
                          Transfer Date
                          <SortIcon field="transferDate" />
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/80 select-none bg-muted/50"
                        onClick={() => handleSort('reason')}
                      >
                        <div className="flex items-center">
                          Transfer Reason
                          <SortIcon field="reason" />
                        </div>
                      </TableHead>

                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedItems.map((item, index) => (
                      <TableRow 
                        key={`${item.id}-${item.branch}-${index}`} 
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded">
                              <MapPin className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                            </div>
                            {item.branch}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-normal">
                            {item.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {item.model || '-'}
                        </TableCell>
                        <TableCell>
                          {item.itemTrackingId ? (
                            <div className="flex items-center gap-1 text-xs font-mono bg-muted/50 w-fit px-2 py-1 rounded">
                              <Hash className="h-3 w-3 text-muted-foreground" />
                              {item.itemTrackingId}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground font-mono">
                          {item.serialNumber || '-'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {item.assetNumber || '-'}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {item.quantity}
                        </TableCell>
                        <TableCell>
                          {item.transferDate ? (
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              <Calendar className="h-3.5 w-3.5" />
                              {new Date(item.transferDate).toLocaleDateString()}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                           {item.reason || '-'}
                        </TableCell>

                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="border-t bg-muted/20 px-4 py-2 text-sm text-muted-foreground">
                Showing {sortedItems.length} item{sortedItems.length !== 1 ? 's' : ''} 
                {activeFiltersCount > 0 && ` (filtered from ${flattenedItems.length} total)`}
              </div>
            </div>
          )}
        </CardContent>
      </Card>


    </div>
  );
}
