import { Badge } from "@/components/ui/badge";
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
import { useInventoryController } from "@/controllers/useInventoryController";
import { RefreshCw, Search } from "lucide-react";
import { useEffect, useState } from "react";

interface ConfirmedReplacement {
  _id: string;
  itemName: string;
  branch: string;
  itemTrackingId: string;
  reason: string;
  createdAt: string;
  assetNumber?: string;
  serialNumber?: string;
  replacedAssetNumber?: string;
  replacedSerialNumber?: string;
  performedBy?: {
    username: string;
  };
}

export default function ConfirmedReplacementsPage() {
  const { getConfirmedReplacements } = useInventoryController();
  const [replacements, setReplacements] = useState<ConfirmedReplacement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredReplacements = replacements.filter((item) => {
    const term = searchTerm.toLowerCase();
    return (
      (item.assetNumber?.toLowerCase() || "").includes(term) ||
      (item.serialNumber?.toLowerCase() || "").includes(term) ||
      (item.replacedAssetNumber?.toLowerCase() || "").includes(term) ||
      (item.replacedSerialNumber?.toLowerCase() || "").includes(term)
    );
  });

  useEffect(() => {
    const fetchReplacements = async () => {
      setLoading(true);
      const data = await getConfirmedReplacements();
      setReplacements(data);
      setLoading(false);
    };
    fetchReplacements();
  }, [getConfirmedReplacements]);

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Confirmed Replacements</h1>
          <p className="text-muted-foreground mt-2">
            History of confirmed item replacements.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search assets or serials..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Badge variant="secondary" className="px-3 py-1">
            {filteredReplacements.length} Items
          </Badge>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredReplacements.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
              <div className="p-4 rounded-full bg-muted/50">
                <RefreshCw className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <p className="text-lg font-medium text-foreground">No confirmed replacements</p>
                <p className="text-sm text-muted-foreground">
                  Confirmed replacement items will appear here.
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Confirm Date</TableHead>
                    <TableHead>Asset ID</TableHead>
                    <TableHead>Serial Number</TableHead>
                    <TableHead>Replaced Asset ID</TableHead>
                    <TableHead>Replaced Serial Number</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Replacement Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReplacements.map((item) => (
                    <TableRow key={item._id}>
                      <TableCell>
                        {new Date(item.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-mono">
                        {item.assetNumber || '-'}
                      </TableCell>
                      <TableCell className="font-mono">
                        {item.serialNumber || '-'}
                      </TableCell>
                      <TableCell className="font-mono text-muted-foreground">
                        {item.replacedAssetNumber || '-'}
                      </TableCell>
                      <TableCell className="font-mono text-muted-foreground">
                        {item.replacedSerialNumber || '-'}
                      </TableCell>
                      <TableCell>{item.branch}</TableCell>
                      <TableCell className="max-w-md truncate" title={item.reason}>
                        {item.reason
                          .replace('Confirmed replacement: ', '')
                          .replace('Replacement Equipment - ', '')
                          .split(' | Replaced:')[0]}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
