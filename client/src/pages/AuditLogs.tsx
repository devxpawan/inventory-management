import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { format } from "date-fns";
import { Activity, ChevronLeft, ChevronRight, Loader2, Search, Trash2 } from "lucide-react";
import { useState } from "react";

interface AuditLog {
  id: string;
  _id: string; // Add _id as fallback
  itemId: string;
  itemName: string;
  itemCategory: string;
  type: 'in' | 'out' | 'return' | 'transfer' | 'confirmation' | 
        'create_item' | 'update_item' | 'delete_item' | 
        'create_category' | 'delete_category' | 
        'create_user' | 'delete_user' | 
        'system_change';
  quantity: number;
  branch?: string;
  reason?: string;
  serialNumber?: string;
  itemTrackingId?: string;
  performedBy?: {
    username: string;
    role: string;
  };
  createdAt: string;
}



export default function AuditLogs() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { data: logs, isLoading: isLoadingLogs } = useQuery({
    queryKey: ['auditLogs'],
    queryFn: async () => {
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/transactions/audit-logs`, {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      });
      return response.data as AuditLog[];
    },
  });



  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/transactions/audit-logs/${id}`, {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auditLogs'] });
      toast({
        title: "Log deleted",
        description: "The audit log has been successfully removed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete log",
        variant: "destructive",
      });
    },
  });

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId);
      setIsDeleteDialogOpen(false);
      setDeleteId(null);
    }
  };

  const filteredLogs = logs?.filter(log => 
    log.itemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.performedBy?.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log.branch && log.branch.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (log.serialNumber && log.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (log.itemTrackingId && log.itemTrackingId.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLogs = filteredLogs?.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil((filteredLogs?.length || 0) / itemsPerPage);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page on search
  };

  if (isLoadingLogs) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Activity className="h-8 w-8" />
          Audit Logs
        </h1>
        <p className="text-muted-foreground">
          Track all inventory activities and manage pending confirmations.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentLogs?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No activity logs found.
                    </TableCell>
                  </TableRow>
                ) : (
                  currentLogs?.map((log) => (
                    <TableRow key={log.id || log._id}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(log.createdAt), "MMM d, yyyy HH:mm")}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{log.performedBy?.username || 'Unknown'}</span>
                          <span className="text-xs text-muted-foreground capitalize">{log.performedBy?.role || '-'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            ['in', 'create_item', 'create_category', 'create_user'].includes(log.type) ? 'default' :
                            ['out', 'delete_item', 'delete_category', 'delete_user'].includes(log.type) ? 'destructive' :
                            ['transfer', 'update_item'].includes(log.type) ? 'secondary' : 
                            log.type === 'confirmation' ? 'outline' : 'outline'
                          }
                          className={log.type === 'confirmation' ? 'border-blue-500 text-blue-500' : ''}
                        >
                          {log.type.replace(/_/g, ' ').toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{log.itemName}</span>
                          <span className="text-xs text-muted-foreground">{log.itemCategory}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`font-bold ${
                          ['in', 'return', 'create_item'].includes(log.type) ? 'text-green-600' : 
                          ['confirmation', 'update_item', 'create_category', 'delete_category', 'create_user', 'delete_user'].includes(log.type) ? 'text-blue-600' : 'text-red-600'
                        }`}>
                          {['in', 'return', 'create_item'].includes(log.type) ? '+' : 
                           ['confirmation', 'update_item', 'create_category', 'delete_category', 'create_user', 'delete_user'].includes(log.type) ? '' : '-'}{log.quantity || '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm space-y-1">
                          {log.branch && (
                            <div className="flex items-center gap-1">
                              <span className="text-muted-foreground font-medium">Branch:</span>
                              {log.branch}
                            </div>
                          )}
                          {log.itemTrackingId && (
                            <div className="flex items-center gap-1">
                              <span className="text-muted-foreground font-medium">ID:</span>
                              <span className="font-mono text-xs">{log.itemTrackingId}</span>
                            </div>
                          )}
                          {log.serialNumber && (
                            <div className="flex items-center gap-1">
                              <span className="text-muted-foreground font-medium">S/N:</span>
                              <span className="font-mono text-xs">{log.serialNumber}</span>
                            </div>
                          )}
                          {log.reason && (
                            <div className="text-muted-foreground italic text-xs">
                              "{log.reason}"
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                          onClick={() => handleDeleteClick(log.id || log._id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        {filteredLogs && filteredLogs.length > 0 && (
          <div className="flex items-center justify-between px-4 py-4 border-t">
            <div className="text-sm text-muted-foreground">
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredLogs.length)} of {filteredLogs.length} entries
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum = i + 1;
                  if (totalPages > 5) {
                    if (currentPage > 3) {
                      pageNum = currentPage - 2 + i;
                    }
                    if (pageNum > totalPages) return null;
                  }
                  
                  return (
                     <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      className="w-8 h-8 p-0"
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the audit log entry.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
