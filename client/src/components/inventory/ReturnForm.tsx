// View Component - Return Transaction Form
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { InventoryItem } from "@/models/inventory";

interface ReturnFormProps {
  item: (Pick<InventoryItem, 'id' | 'name'> & { 
    quantity: number;
    itemTrackingId?: string;
  }) | null;
  branch: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (transactionData: {
    itemId: string;
    type: 'return';
    quantity: number;
    branch: string;
    itemTrackingId?: string;
  }) => void;
}

export function ReturnForm({ item, branch, isOpen, onClose, onSubmit }: ReturnFormProps) {
  const [quantity, setQuantity] = useState(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;

    onSubmit({
      itemId: item.id,
      type: 'return',
      quantity,
      branch,
      itemTrackingId: item.itemTrackingId,
    });
  };

  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Transfer Back to Main Inventory
          </DialogTitle>
        </DialogHeader>
        <p>Item: <span className="font-semibold">{item.name}</span></p>
        <p>From Branch: <span className="font-semibold">{branch}</span></p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity to Transfer Back</Label>
            <Input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              min="1"
              max={item.quantity}
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Transfer Back
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
