// View Component - Direct Transfer Form
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
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
import { AlertCircle, ArrowRightLeft, Barcode, Building2, Calendar, CheckCircle2, FileText, Hash, MessageSquare, Tag } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import branchesData from "../../fed_branches.json";

interface DirectTransferFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (transactionData: {
    itemId: string; // Will be empty for direct transfer
    itemName?: string;
    itemCategory?: string;
    type: "transfer";
    quantity: number;
    branch?: string;
    assetNumber?: string;
    model?: string;
    serialNumber?: string;
    itemTrackingId?: string;
    reason?: string;
    transferDate?: string;
  }) => void;
  categories: { id: string; name: string }[];
}

export function DirectTransferForm({
  isOpen,
  onClose,
  onSubmit,
  categories,
}: DirectTransferFormProps) {

  const [itemName, setItemName] = useState("");
  const [itemCategory, setItemCategory] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [branch, setBranch] = useState("");
  const [assetNumber, setAssetNumber] = useState("");
  const [model, setModel] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [itemTrackingId, setItemTrackingId] = useState("");
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [trackingIdError, setTrackingIdError] = useState("");
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split('T')[0]);

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setItemName("");
      setItemCategory("");
      setQuantity(1);
      setBranch("");
      setAssetNumber("");
      setModel("");
      setSerialNumber("");
      setItemTrackingId("");
      setReason("");
      setNote("");
      setTrackingIdError("");
      setTransferDate(new Date().toISOString().split('T')[0]);
    }
  }, [isOpen]);

  // Validate tracking ID
  const validateTrackingId = (value: string) => {
    if (!value) {
      setTrackingIdError("Tracking ID is required");
      return false;
    }
    if (!value.startsWith("CRE")) {
      setTrackingIdError("Tracking ID must start with 'CRE'");
      return false;
    }
    if (value === "CRE") {
      setTrackingIdError("Please enter a complete tracking ID (e.g., CRE123)");
      return false;
    }
    if (value.length < 4) {
      setTrackingIdError("Tracking ID is too short");
      return false;
    }
    setTrackingIdError("");
    return true;
  };

  const handleTrackingIdChange = (value: string) => {
    // Auto-add CRE prefix if user starts typing without it
    if (value && !value.startsWith("CRE")) {
      value = "CRE" + value;
    }
    setItemTrackingId(value);
    validateTrackingId(value);
  };

  const handleAssetNumberChange = (value: string) => {
    // Auto-add FDE/IT/ prefix if user starts typing without it
    if (value && !value.startsWith("FDE/IT/")) {
      value = "FDE/IT/" + value;
    }
    setAssetNumber(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate tracking ID
    if (!validateTrackingId(itemTrackingId)) {
      toast.error("Please enter a valid Item Tracking ID");
      return;
    }

    let finalReason = reason;
    if (reason === "Replacement Equipment" && note) {
      finalReason = `${reason} - ${note}`;
    }

    onSubmit({
      itemId: "", // Empty for direct transfer
      itemName,
      itemCategory,
      type: "transfer",
      quantity,
      branch,
      assetNumber: assetNumber && assetNumber !== "FDE/IT/" ? assetNumber : undefined,
      model: model || undefined,
      serialNumber: serialNumber || undefined,
      itemTrackingId: itemTrackingId,
      reason: finalReason || undefined,
      transferDate: transferDate,
    });

    handleClose();
  };

  const handleClose = () => {
    onClose();
  };

  const isFormValid = itemName && itemCategory && branch && reason && itemTrackingId && transferDate && !trackingIdError;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl h-[92vh] p-0 gap-0 bg-gradient-to-br from-background via-background to-muted/20 flex flex-col">
        {/* Header - Fixed */}
        <DialogHeader className="flex-shrink-0 p-6 pb-5 border-b bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-br from-primary to-primary/80 rounded-xl shadow-lg">
              <ArrowRightLeft className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Direct Transfer
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Transfer an item that is not in the current active inventory.
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Form Content - Scrollable */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-6">
            {/* Required Fields Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <Building2 className="h-5 w-5 text-primary" />
                <h3 className="text-base font-bold text-foreground">Item Details</h3>
                <span className="ml-auto text-xs text-destructive font-medium">* Required</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Item Name */}
                <div className="space-y-2">
                  <Label htmlFor="itemName" className="text-sm font-semibold flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5 text-primary" />
                    Item Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="itemName"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    required
                    placeholder="Enter item name"
                    className="h-11"
                  />
                </div>

                {/* Category */}
                 <div className="space-y-2">
                  <Label htmlFor="category" className="text-sm font-semibold flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-primary" />
                    Category <span className="text-destructive">*</span>
                  </Label>
                  <Select value={itemCategory} onValueChange={setItemCategory} required>
                    <SelectTrigger className="h-11">
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

                {/* Destination Branch */}
                <div className="space-y-2">
                  <Label htmlFor="branch" className="text-sm font-semibold flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-primary" />
                    Destination Branch <span className="text-destructive">*</span>
                  </Label>
                  <Select value={branch} onValueChange={setBranch} required>
                    <SelectTrigger className={`h-11 transition-all ${branch ? 'border-primary/50 bg-primary/5' : ''}`}>
                      <SelectValue placeholder="Select destination branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branchesData.fed_branches.map((branchName) => (
                        <SelectItem key={branchName} value={branchName}>
                          {branchName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Quantity */}
                <div className="space-y-2">
                  <Label htmlFor="quantity" className="text-sm font-semibold flex items-center gap-1.5">
                    <Hash className="h-3.5 w-3.5 text-primary" />
                    Quantity <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    min="1"
                    required
                    className="h-11"
                  />
                </div>

                {/* Transfer Date */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="transferDate" className="text-sm font-semibold flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-primary" />
                    Transfer Date <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="transferDate"
                      type="date"
                      value={transferDate}
                      onChange={(e) => setTransferDate(e.target.value)}
                      required
                      className="pl-10 h-11 text-base"
                    />
                  </div>
                </div>

                {/* Item Tracking ID */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="itemTrackingId" className="text-sm font-semibold flex items-center gap-1.5">
                    <Barcode className="h-3.5 w-3.5 text-primary" />
                    Item Tracking ID <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Barcode className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="itemTrackingId"
                      value={itemTrackingId}
                      onChange={(e) => handleTrackingIdChange(e.target.value)}
                      onBlur={(e) => validateTrackingId(e.target.value)}
                      placeholder="CRE123456"
                      required
                      className={`pl-10 pr-10 h-11 text-base font-mono ${
                        trackingIdError ? 'border-destructive focus-visible:ring-destructive' : 
                        itemTrackingId && !trackingIdError ? 'border-green-500 focus-visible:ring-green-500' : ''
                      }`}
                    />
                    {itemTrackingId && !trackingIdError && (
                      <CheckCircle2 className="absolute right-3 top-3 h-5 w-5 text-green-500" />
                    )}
                    {trackingIdError && (
                      <AlertCircle className="absolute right-3 top-3 h-5 w-5 text-destructive" />
                    )}
                  </div>
                  {trackingIdError ? (
                    <p className="text-xs text-destructive font-medium flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {trackingIdError}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Scan barcode or enter tracking ID (must start with "CRE")
                    </p>
                  )}
                </div>

                {/* Reason */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="reason" className="text-sm font-semibold flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5 text-primary" />
                    Transfer Reason <span className="text-destructive">*</span>
                  </Label>
                  <Select value={reason} onValueChange={setReason} required>
                    <SelectTrigger className={`h-11 transition-all ${reason ? 'border-primary/50 bg-primary/5' : ''}`}>
                      <SelectValue placeholder="Select transfer reason" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="New Equipment">🆕 New Equipment</SelectItem>
                      <SelectItem value="Replacement Equipment">🔄 Replacement Equipment</SelectItem>
                      <SelectItem value="Repaired">🔧 Repaired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Replacement Note */}
                {reason === "Replacement Equipment" && (
                  <div className="space-y-2 md:col-span-2 animate-in slide-in-from-top-2">
                    <Label htmlFor="note" className="text-sm font-semibold flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5 text-primary" />
                      Replacement Note <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <MessageSquare className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="note"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Describe what is being replaced..."
                        required
                        className="pl-10 h-11"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Optional Fields Section */}
            <div className="space-y-4">
               <div className="flex items-center gap-2 pb-2 border-b">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-base font-bold text-foreground">Additional Information</h3>
                <span className="ml-auto text-xs text-muted-foreground font-medium">Optional</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Serial Number */}
                <div className="space-y-2">
                  <Label htmlFor="serialNumber" className="text-sm font-semibold flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                    Serial Number
                  </Label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="serialNumber"
                      value={serialNumber}
                      onChange={(e) => setSerialNumber(e.target.value)}
                      placeholder="SN98765"
                      className="pl-10 h-11 font-mono"
                    />
                  </div>
                </div>

                {/* Model */}
                <div className="space-y-2">
                  <Label htmlFor="model" className="text-sm font-semibold flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                    Model
                  </Label>
                  <Input
                    id="model"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="XYZ-Pro"
                    className="h-11"
                  />
                </div>

                {/* Asset Number */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="assetNumber" className="text-sm font-semibold flex items-center gap-1.5">
                    <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                    Asset Number
                  </Label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="assetNumber"
                      value={assetNumber}
                      onChange={(e) => handleAssetNumberChange(e.target.value)}
                      placeholder="FDE/IT/12345"
                      className="pl-10 h-11 font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer - Fixed */}
          <DialogFooter className="p-6 pt-4 border-t bg-muted/30 flex-shrink-0">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose} 
                className="h-11 px-6 flex-1 sm:flex-initial"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={!isFormValid}
                className="h-11 px-8 flex-1 sm:flex-initial bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]"
              >
                <ArrowRightLeft className="h-4 w-4 mr-2" />
                Confirm Direct Transfer
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
