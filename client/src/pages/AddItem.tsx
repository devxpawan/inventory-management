// View - Add Item Page
import { ItemForm } from "@/components/inventory/ItemForm";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useInventoryController } from "@/controllers/useInventoryController";
import { InventoryItem } from "@/models/inventory";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AddItem() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { categories, allItems, addItem } = useInventoryController();

  const handleSubmit = async (item: Omit<InventoryItem, 'id' | 'status' | 'lastUpdated'>) => {
    try {
      await addItem(item);
      navigate('/inventory');
    } catch (error) {
      // Error is already handled/toasted in useInventoryController
      console.error("Failed to add item:", error);
    }
  };

  const handleSubmitMultiple = async (items: Omit<InventoryItem, 'id' | 'status' | 'lastUpdated'>[]) => {
    try {
      const categoryCounts: Record<string, number> = {};

      // Add all items without navigating
      for (const item of items) {
        await addItem(item, { silent: true });
        const cat = item.category || 'Uncategorized';
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      }

      // Show summary toast(s)
      Object.entries(categoryCounts).forEach(([cat, count]) => {
        toast({
          title: 'Items added',
          description: `Successfully added ${count} items to ${cat} category.`,
        });
      });

      // Navigate only after all items are added successfully
      navigate('/inventory');
    } catch (error) {
      // Error is already handled/toasted in useInventoryController
      console.error("Failed to add multiple items:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Add New Item</h1>
          <p className="text-muted-foreground mt-1">Add a new item to your inventory</p>
        </div>
      </div>

      <ItemForm
        categories={categories}
        existingItems={allItems}
        onSubmit={handleSubmit}
        onSubmitMultiple={handleSubmitMultiple}
        onCancel={() => navigate('/inventory')}
      />
    </div>
  );
}
