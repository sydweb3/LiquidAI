import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function WithdrawDialog({
  open,
  onOpenChange,
  strategy,
  onWithdraw
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  strategy: { id: number; name: string; invested?: number } | null;
  onWithdraw: (amount: number) => void;
}) {
  const [amount, setAmount] = useState("");
  
  const maxWithdraw = strategy?.invested || 0;
  const presets = [100, 500, 1000, maxWithdraw > 1000 ? maxWithdraw : 0].filter((v, i, a) => v > 0 && a.indexOf(v) === i);

  const handleSubmit = () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (numAmount > maxWithdraw) {
      toast.error("Insufficient invested amount");
      return;
    }
    onWithdraw(numAmount);
    setAmount("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Withdraw from Strategy</DialogTitle>
          <DialogDescription>
            {strategy?.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-accent/5">
            <span className="text-sm text-muted-foreground">Invested Amount</span>
            <span className="font-semibold">${maxWithdraw.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>

          <div>
            <Label>Withdrawal Amount (USD)</Label>
            <Input
              type="number"
              placeholder="500"
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
                ${preset >= 1000 ? (preset/1000).toFixed(0) + 'K' : preset}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20">
            <div className="text-sm">
              <div className="font-medium text-warning">Note</div>
              <div className="text-muted-foreground">
                Withdrawing will reduce your active investment and future rewards
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="bg-transparent">
            Cancel
          </Button>
          <Button onClick={handleSubmit} variant="destructive">
            Confirm Withdrawal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
