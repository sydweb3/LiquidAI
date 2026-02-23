import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Target } from "lucide-react";

// Arbitrage Configuration Form
export function ArbitrageConfigForm({ config, onChange }: {
  config: {
    minProfitPercent: number;
    maxSlippage: number;
    checkInterval: string;
    maxTradeSize: number;
  };
  onChange: (config: any) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Min Profit (%)</Label>
          <Input
            type="number"
            step="0.1"
            value={config.minProfitPercent}
            onChange={(e) => onChange({ ...config, minProfitPercent: parseFloat(e.target.value) || 0 })}
            className="mt-2"
          />
          <p className="text-xs text-muted-foreground mt-1">Minimum profit after fees</p>
        </div>
        <div>
          <Label>Max Slippage (%)</Label>
          <Input
            type="number"
            step="0.1"
            value={config.maxSlippage}
            onChange={(e) => onChange({ ...config, maxSlippage: parseFloat(e.target.value) || 0 })}
            className="mt-2"
          />
          <p className="text-xs text-muted-foreground mt-1">Maximum price slippage</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Scan Interval</Label>
          <Select 
            value={config.checkInterval} 
            onValueChange={(v) => onChange({ ...config, checkInterval: v })}
          >
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10sec">Every 10 seconds</SelectItem>
              <SelectItem value="30sec">Every 30 seconds</SelectItem>
              <SelectItem value="1min">Every 1 minute</SelectItem>
              <SelectItem value="5min">Every 5 minutes</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Max Trade Size (USD)</Label>
          <Input
            type="number"
            value={config.maxTradeSize}
            onChange={(e) => onChange({ ...config, maxTradeSize: parseInt(e.target.value) || 0 })}
            className="mt-2"
          />
          <p className="text-xs text-muted-foreground mt-1">Maximum per trade</p>
        </div>
      </div>
    </div>
  );
}

// Liquidity Provision Configuration Form
export function LiquidityConfigForm({ config, onChange }: {
  config: {
    tokenA: string;
    tokenB: string;
    priceRangePercent: number;
    autoRebalance: boolean;
    maxImpermanentLoss: number;
  };
  onChange: (config: any) => void;
}) {
  const tokens = ['CRO', 'USDC', 'USDT', 'ETH', 'WBTC', 'VVS'];
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Token A</Label>
          <Select value={config.tokenA} onValueChange={(v) => onChange({ ...config, tokenA: v })}>
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {tokens.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Token B</Label>
          <Select value={config.tokenB} onValueChange={(v) => onChange({ ...config, tokenB: v })}>
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {tokens.filter(t => t !== config.tokenA).map(t => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label>Price Range (±%)</Label>
        <Slider
          value={[config.priceRangePercent]}
          onValueChange={([v]) => onChange({ ...config, priceRangePercent: v })}
          max={100}
          step={5}
          className="mt-2"
        />
        <div className="text-sm text-muted-foreground mt-1">
          ±{config.priceRangePercent}% from current price
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="autoRebalance"
            checked={config.autoRebalance}
            onChange={(e) => onChange({ ...config, autoRebalance: e.target.checked })}
            className="rounded border-border"
          />
          <Label htmlFor="autoRebalance">Auto-Rebalance</Label>
        </div>
        <div>
          <Label>Max IL (%)</Label>
          <Input
            type="number"
            value={config.maxImpermanentLoss}
            onChange={(e) => onChange({ ...config, maxImpermanentLoss: parseFloat(e.target.value) || 0 })}
            className="mt-2"
          />
        </div>
      </div>
    </div>
  );
}

// Yield Farming Configuration Form with DeFi Products
export function YieldConfigForm({ config, onChange }: {
  config: {
    minAPY: number;
    riskTolerance: 'low' | 'medium' | 'high';
    autoCompound: boolean;
    maxPerProtocol: number;
    selectedProduct?: string;
  };
  onChange: (config: any) => void;
}) {
  // Real DeFi products available on Cronos
  const yieldProducts = [
    {
      category: 'VVS Finance',
      products: [
        { id: 'vvs-cro-usdc', name: 'CRO-USDC LP', apy: 24.56, risk: 'medium', type: 'LP Farming' },
        { id: 'vvs-cro-usdt', name: 'CRO-USDT LP', apy: 22.34, risk: 'medium', type: 'LP Farming' },
        { id: 'vvs-cro-eth', name: 'CRO-ETH LP', apy: 31.78, risk: 'medium', type: 'LP Farming' },
        { id: 'vvs-vvs-cro', name: 'VVS-CRO LP', apy: 45.23, risk: 'high', type: 'LP Farming' },
      ]
    },
    {
      category: 'Tectonic Finance',
      products: [
        { id: 'tectonic-usdc', name: 'USDC Lending', apy: 5.87, risk: 'low', type: 'Lending' },
        { id: 'tectonic-usdt', name: 'USDT Lending', apy: 6.12, risk: 'low', type: 'Lending' },
        { id: 'tectonic-cro', name: 'CRO Lending', apy: 3.52, risk: 'low', type: 'Lending' },
        { id: 'tectonic-eth', name: 'ETH Lending', apy: 2.34, risk: 'low', type: 'Lending' },
      ]
    },
    {
      category: 'Beefy Finance',
      products: [
        { id: 'beefy-vvs-cro', name: 'VVS-CRO Vault', apy: 28.5, risk: 'medium', type: 'Auto-Compound' },
        { id: 'beefy-cro-usdc', name: 'CRO-USDC Vault', apy: 26.2, risk: 'medium', type: 'Auto-Compound' },
      ]
    }
  ];

  return (
    <div className="space-y-4">
      <div>
        <Label className="mb-2 block">Select Yield Product</Label>
        <div className="space-y-4 max-h-48 overflow-y-auto pr-2">
          {yieldProducts.map((category) => (
            <div key={category.category}>
              <h4 className="text-sm font-semibold mb-2 text-primary">{category.category}</h4>
              <div className="grid grid-cols-1 gap-2">
                {category.products.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => onChange({ ...config, selectedProduct: product.id })}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      config.selectedProduct === product.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">{product.name}</div>
                        <div className="text-xs text-muted-foreground">{product.type}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-success">{product.apy}% APY</div>
                        <div className={`text-xs ${
                          product.risk === 'low' ? 'text-success' : 
                          product.risk === 'medium' ? 'text-warning' : 'text-destructive'
                        }`}>
                          {product.risk} risk
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Minimum APY (%)</Label>
          <Input
            type="number"
            value={config.minAPY}
            onChange={(e) => onChange({ ...config, minAPY: parseInt(e.target.value) || 0 })}
            className="mt-2"
          />
        </div>
        <div>
          <Label>Risk Tolerance</Label>
          <Select 
            value={config.riskTolerance} 
            onValueChange={(v: any) => onChange({ ...config, riskTolerance: v })}
          >
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low (Stablecoins only)</SelectItem>
              <SelectItem value="medium">Medium (Blue-chip LPs)</SelectItem>
              <SelectItem value="high">High (Max yield)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="autoCompound"
          checked={config.autoCompound}
          onChange={(e) => onChange({ ...config, autoCompound: e.target.checked })}
          className="rounded border-border"
        />
        <Label htmlFor="autoCompound">Auto-Compound Rewards</Label>
      </div>

      <div>
        <Label>Max per Protocol (%)</Label>
        <Input
          type="number"
          value={config.maxPerProtocol}
          onChange={(e) => onChange({ ...config, maxPerProtocol: parseInt(e.target.value) || 0 })}
          className="mt-2"
        />
        <p className="text-xs text-muted-foreground mt-1">Maximum allocation to single protocol</p>
      </div>

      {config.selectedProduct && (
        <div className="p-3 rounded-lg bg-accent/5 border border-accent/20">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-accent" />
            <div className="text-sm">
              <div className="font-medium">Expected Returns</div>
              <div className="text-muted-foreground">
                Rewards distributed every 5 minutes based on selected product APY
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Rebalancing Configuration Form
export function RebalanceConfigForm({ config, onChange }: {
  config: {
    targetAllocations: Array<{ token: string; percent: number }>;
    threshold: number;
    checkInterval: string;
  };
  onChange: (config: any) => void;
}) {
  const totalPercent = config.targetAllocations.reduce((sum, a) => sum + a.percent, 0);

  const updateAllocation = (token: string, percent: number) => {
    const updated = config.targetAllocations.map(a => 
      a.token === token ? { ...a, percent } : a
    );
    onChange({ ...config, targetAllocations: updated });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="mb-2 block">Target Allocations</Label>
        <div className="space-y-2">
          {config.targetAllocations.map((alloc) => (
            <div key={alloc.token} className="flex items-center gap-2">
              <Badge variant="outline" className="w-20 justify-center">{alloc.token}</Badge>
              <Slider
                value={[alloc.percent]}
                onValueChange={([v]) => updateAllocation(alloc.token, v)}
                max={100}
                step={5}
                className="flex-1"
              />
              <span className="w-12 text-right text-sm">{alloc.percent}%</span>
            </div>
          ))}
        </div>
        <div className={`text-sm mt-2 ${totalPercent === 100 ? 'text-success' : 'text-warning'}`}>
          Total: {totalPercent}% {totalPercent !== 100 && '(Should equal 100%)'}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Rebalance Threshold (%)</Label>
          <Input
            type="number"
            value={config.threshold}
            onChange={(e) => onChange({ ...config, threshold: parseInt(e.target.value) || 0 })}
            className="mt-2"
          />
          <p className="text-xs text-muted-foreground mt-1">Deviation to trigger</p>
        </div>
        <div>
          <Label>Check Interval</Label>
          <Select 
            value={config.checkInterval} 
            onValueChange={(v) => onChange({ ...config, checkInterval: v })}
          >
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="15min">Every 15 minutes</SelectItem>
              <SelectItem value="30min">Every 30 minutes</SelectItem>
              <SelectItem value="1hour">Every hour</SelectItem>
              <SelectItem value="4hour">Every 4 hours</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
