// View - Branch Inventory List Page
import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useInventoryController } from "@/controllers/useInventoryController";
import { InventoryTable } from "@/components/inventory/InventoryTable";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function BranchInventoryList() {
  const { branchName } = useParams<{ branchName: string }>();
  const navigate = useNavigate();
  const { items, getItemsByBranch, loading } = useInventoryController();

  useEffect(() => {
    if (branchName) {
      getItemsByBranch(branchName);
    }
  }, [branchName, getItemsByBranch]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Inventory at: <span className="text-primary">{branchName}</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Items that have been transferred to this location.
          </p>
        </div>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <InventoryTable items={items} onEdit={() => {}} onDelete={() => {}} onTransaction={() => {}} />
      )}
    </div>
  );
}
