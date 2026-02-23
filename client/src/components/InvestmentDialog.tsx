import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Target } from "lucide-react";

// Investment Dialog
export function InvestmentDialog({ 
  open, 
  onOpenChange, 
  strategy,
  balance,
  onInvest 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  strategy: { id: number; name: string } | null;
  balance?: number;
  onInvest: (amount: number) => void;
}) {
  const [amount, setAmount] = useState("");
  
  const maxInvest = balance || 0;
  const presets = [100, 500, 1000, 5000];

  const handleSubmit = () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (numAmount > maxInvest) {
      toast.error("Insufficient balance");
      return;
    }
    onInvest(numAmount);
    setAmount("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invest in Strategy</DialogTitle>
          <DialogDescription>
            {strategy?.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5">
            <span className="text-sm text-muted-foreground">Available Balance</span>
            <span className="font-semibold">${maxInvest.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>

          <div>
            <Label>Investment Amount (USD)</Label>
            <Input
              type="number"
              placeholder="1000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-2"
            />
          </div>

          <div className="flex gap-2">
            {presets.map(preset => (
              <Button
                key={preset}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAmount(Math.min(preset, maxInvest).toString())}
                className="flex-1"
              >
                ${preset}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-2 p-3 rounded-lg bg-accent/5">
            <Target className="w-4 h-4 text-accent" />
            <div className="text-sm">
              <div className="font-medium">Expected Returns</div>
              <div className="text-muted-foreground">
                {amount ? `~$${(parseFloat(amount) * 0.0003).toFixed(2)} per 5min (est.)` : 'Enter amount to see estimates'}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="bg-transparent">
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="bg-gradient-to-r from-primary to-accent">
            Confirm Investment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
