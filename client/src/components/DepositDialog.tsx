import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function DepositDialog({
  open,
  onOpenChange,
  onDeposit
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeposit: (amount: number) => void;
}) {
  const [amount, setAmount] = useState("");
  const presets = [1000, 5000, 10000, 50000];

  const handleSubmit = () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    onDeposit(numAmount);
    setAmount("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Deposit Funds</DialogTitle>
          <DialogDescription>
            Add funds to your wallet to start investing in DeFi strategies
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label>Deposit Amount (USD)</Label>
            <Input
              type="number"
              placeholder="10000"
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
                onClick={() => setAmount(preset.toString())}
                className="flex-1"
              >
                ${preset.toLocaleString()}
              </Button>
            ))}
          </div>

          <div className="p-3 rounded-lg bg-primary/5">
            <div className="text-sm text-muted-foreground">
              💡 This is a test environment. Funds are virtual and used for simulation purposes only.
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="bg-transparent">
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="bg-gradient-to-r from-primary to-accent">
            Deposit Funds
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
