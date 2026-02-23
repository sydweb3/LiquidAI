import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  ArbitrageConfigForm,
  LiquidityConfigForm,
  YieldConfigForm,
  RebalanceConfigForm
} from "@/components/StrategyConfigForms";
import { InvestmentDialog } from "@/components/InvestmentDialog";
import { DepositDialog } from "@/components/DepositDialog";
import { WithdrawDialog } from "@/components/WithdrawDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import {
  Zap,
  Bot,
  BarChart3,
  Settings,
  LogOut,
  Plus,
  Play,
  Pause,
  Square,
  TrendingUp,
  Layers,
  RefreshCw,
  AlertTriangle,
  Wallet,
  ArrowRight,
  CheckCircle,
  Clock,
  X,
  Cpu,
  Signal,
  Target,
  PiggyBank,
  ArrowLeftRight
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

const strategyTypeInfo = {
  arbitrage: {
    icon: TrendingUp,
    color: "text-primary",
    bgColor: "bg-primary/20",
    label: "Arbitrage"
  },
  liquidity_provision: {
    icon: Layers,
    color: "text-accent",
    bgColor: "bg-accent/20",
    label: "Liquidity"
  },
  yield_farming: {
    icon: BarChart3,
    color: "text-success",
    bgColor: "bg-success/20",
    label: "Yield Farming"
  },
  rebalancing: {
    icon: RefreshCw,
    color: "text-warning",
    bgColor: "bg-warning/20",
    label: "Rebalancing"
  }
};

// Helper functions for APY
function getAPYForProduct(productId: string): number {
  const products: Record<string, number> = {
    'vvs-cro-usdc': 24.56,
    'vvs-cro-usdt': 22.34,
    'vvs-cro-eth': 31.78,
    'vvs-vvs-cro': 45.23,
    'tectonic-usdc': 5.87,
    'tectonic-usdt': 6.12,
    'tectonic-cro': 3.52,
    'tectonic-eth': 2.34,
    'beefy-vvs-cro': 28.5,
    'beefy-cro-usdc': 26.2
  };
  return products[productId] || 10;
}

function getDefaultAPYForType(type: string): number {
  const apys: Record<string, number> = {
    'arbitrage': 25,
    'liquidity_provision': 30,
    'yield_farming': 15,
    'rebalancing': 12
  };
  return apys[type] || 10;
}

const statusInfo = {
  active: { color: "bg-success", label: "Active" },
  paused: { color: "bg-warning", label: "Paused" },
  stopped: { color: "bg-destructive", label: "Stopped" }
};

interface StrategyFormData {
  name: string;
  type: string;
  threshold: number;
  maxSlippage: number;
  frequency: string;
  depositAmount: string;
}

export default function Strategies() {
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<{ id: number; name: string; type: string; parameters?: any } | null>(null);
  
  // Form state - generic
  const [newStrategyName, setNewStrategyName] = useState("");
  const [strategyDepositAmount, setStrategyDepositAmount] = useState("");

  // Arbitrage-specific
  const [arbitrageConfig, setArbitrageConfig] = useState({
    minProfitPercent: 0.5,
    maxSlippage: 0.3,
    checkInterval: '30sec',
    maxTradeSize: 1000
  });

  // Liquidity-specific
  const [liquidityConfig, setLiquidityConfig] = useState({
    tokenA: 'CRO',
    tokenB: 'USDC',
    priceRangePercent: 20,
    autoRebalance: true,
    maxImpermanentLoss: 5
  });

  // Yield-specific
  const [yieldConfig, setYieldConfig] = useState({
    minAPY: 5,
    riskTolerance: 'medium' as 'low' | 'medium' | 'high',
    autoCompound: true,
    maxPerProtocol: 50,
    selectedProduct: ''
  });

  // Rebalancing-specific
  const [rebalanceConfig, setRebalanceConfig] = useState({
    targetAllocations: [
      { token: 'CRO', percent: 40 },
      { token: 'USDC', percent: 30 },
      { token: 'ETH', percent: 20 },
      { token: 'WBTC', percent: 10 }
    ],
    threshold: 5,
    checkInterval: '1hour'
  });

  // Config form state
  const [configThreshold, setConfigThreshold] = useState([0.5]);
  const [configMaxSlippage, setConfigMaxSlippage] = useState([0.3]);
  const [configFrequency, setConfigFrequency] = useState("5min");

  // API hooks
  const { data: templates } = trpc.strategies.getTemplates.useQuery();
  const { data: userStrategies, refetch: refetchStrategies } = trpc.strategies.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  
  // DeFi engine status
  const { data: engineStatus, refetch: refetchEngineStatus } = trpc.defi.getEngineStatus.useQuery(undefined, {
    refetchInterval: 5000, // Update every 5 seconds
  });

  // Wallet data
  const { data: wallet, refetch: refetchWallet } = trpc.wallet.getBalance.useQuery(undefined, {
    refetchInterval: 5000,
  });
  const { data: transactions } = trpc.wallet.getTransactions.useQuery({ limit: 10 });

  const investMutation = trpc.wallet.invest.useMutation({
    onSuccess: () => {
      toast.success("Investment successful!");
      refetchWallet();
      refetchStrategies();
    },
    onError: (error) => {
      toast.error("Investment failed", { description: error.message });
    }
  });

  const withdrawMutation = trpc.wallet.withdraw.useMutation({
    onSuccess: () => {
      toast.success("Withdrawal successful!");
      refetchWallet();
      refetchStrategies();
    },
    onError: (error) => {
      toast.error("Withdrawal failed", { description: error.message });
    }
  });

  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [selectedStrategyForWithdraw, setSelectedStrategyForWithdraw] = useState<{ id: number; name: string; invested?: number } | null>(null);

  const [investDialogOpen, setInvestDialogOpen] = useState(false);
  const [selectedStrategyForInvest, setSelectedStrategyForInvest] = useState<{ id: number; name: string } | null>(null);
  const [investAmount, setInvestAmount] = useState("");
  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");

  const depositMutation = trpc.wallet.deposit.useMutation({
    onSuccess: () => {
      toast.success("Deposit successful!");
      refetchWallet();
      setDepositDialogOpen(false);
      setDepositAmount("");
    },
    onError: (error) => {
      toast.error("Deposit failed", { description: error.message });
    }
  });
  
  const createMutation = trpc.strategies.create.useMutation({
    onSuccess: () => {
      toast.success("Strategy created successfully!");
      setCreateDialogOpen(false);
      resetForm();
      refetchStrategies();
    },
    onError: (error) => {
      toast.error("Failed to create strategy", {
        description: error.message
      });
    }
  });

  const updateMutation = trpc.strategies.update.useMutation({
    onSuccess: () => {
      toast.success("Strategy updated successfully!");
      setConfigDialogOpen(false);
      refetchStrategies();
    },
    onError: (error) => {
      toast.error("Failed to update strategy", {
        description: error.message
      });
    }
  });

  const setStatusMutation = trpc.strategies.setStatus.useMutation({
    onSuccess: (_, variables) => {
      const statusLabels = { active: "activated", paused: "paused", stopped: "stopped" };
      toast.success(`Strategy ${statusLabels[variables.status] || "updated"}!`);
      refetchStrategies();
    },
    onError: (error) => {
      toast.error("Failed to update strategy status", {
        description: error.message
      });
    }
  });

  const resetForm = () => {
    setSelectedTemplate(null);
    setNewStrategyName("");
    setArbitrageConfig({
      minProfitPercent: 0.5,
      maxSlippage: 0.3,
      checkInterval: '30sec',
      maxTradeSize: 1000
    });
    setLiquidityConfig({
      tokenA: 'CRO',
      tokenB: 'USDC',
      priceRangePercent: 20,
      autoRebalance: true,
      maxImpermanentLoss: 5
    });
    setYieldConfig({
      minAPY: 5,
      riskTolerance: 'medium',
      autoCompound: true,
      maxPerProtocol: 50,
      selectedProduct: ''
    });
    setRebalanceConfig({
      targetAllocations: [
        { token: 'CRO', percent: 40 },
        { token: 'USDC', percent: 30 },
        { token: 'ETH', percent: 20 },
        { token: 'WBTC', percent: 10 }
      ],
      threshold: 5,
      checkInterval: '1hour'
    });
    setStrategyDepositAmount("");
  };

  const handleCreateStrategy = () => {
    if (!selectedTemplate || !newStrategyName) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Build parameters based on strategy type
    let parameters: any = {};
    
    switch (selectedTemplate) {
      case 'arbitrage':
        parameters = {
          minProfitPercent: arbitrageConfig.minProfitPercent,
          maxSlippage: arbitrageConfig.maxSlippage,
          checkInterval: arbitrageConfig.checkInterval,
          maxTradeSizeUSD: arbitrageConfig.maxTradeSize
        };
        break;
      
      case 'liquidity_provision':
        parameters = {
          tokenA: liquidityConfig.tokenA,
          tokenB: liquidityConfig.tokenB,
          priceRangePercent: liquidityConfig.priceRangePercent,
          autoRebalance: liquidityConfig.autoRebalance,
          maxImpermanentLoss: liquidityConfig.maxImpermanentLoss
        };
        break;
      
      case 'yield_farming':
        parameters = {
          minAPY: yieldConfig.minAPY,
          riskTolerance: yieldConfig.riskTolerance,
          autoCompound: yieldConfig.autoCompound,
          maxPerProtocol: yieldConfig.maxPerProtocol,
          selectedProduct: yieldConfig.selectedProduct // Save selected VVS/Tectonic/Beefy product
        };
        break;
      
      case 'rebalancing':
        parameters = {
          targetAllocations: rebalanceConfig.targetAllocations,
          threshold: rebalanceConfig.threshold / 100, // Convert to decimal
          checkInterval: rebalanceConfig.checkInterval
        };
        break;
    }

    createMutation.mutate({
      name: newStrategyName,
      type: selectedTemplate as any,
      parameters,
      allocatedTokens: strategyDepositAmount ? [
        { token: 'CRO', amount: strategyDepositAmount, chain: 'cronos' }
      ] : undefined
    });
  };

  const handleToggleStrategy = (strategyId: number, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "paused" : "active";
    setStatusMutation.mutate({ id: strategyId, status: newStatus as "active" | "paused" | "stopped" });
  };

  const handleStopStrategy = (strategyId: number) => {
    if (confirm("Are you sure you want to stop this strategy? This will withdraw all funds.")) {
      setStatusMutation.mutate({ id: strategyId, status: "stopped" });
    }
  };

  const handleOpenConfig = (strategy: any) => {
    setSelectedStrategy(strategy);
    setConfigThreshold([strategy.parameters?.threshold || 0.5]);
    setConfigMaxSlippage([strategy.parameters?.maxSlippage || 0.3]);
    setConfigFrequency(strategy.parameters?.frequency || "5min");
    setConfigDialogOpen(true);
  };

  const handleSaveConfig = () => {
    if (!selectedStrategy) return;
    
    updateMutation.mutate({
      id: selectedStrategy.id,
      parameters: {
        threshold: configThreshold[0],
        frequency: configFrequency,
        maxSlippage: configMaxSlippage[0],
      }
    });
  };

  // Calculate stats from real data
  const stats = {
    active: userStrategies?.filter(s => s.status === "active").length || 0,
    totalDeposited: userStrategies?.reduce((sum, s) => sum + parseFloat(s.totalDeposited || "0"), 0) || 0,
    totalProfit: userStrategies?.reduce((sum, s) => {
      const invested = parseFloat(s.totalDeposited || "0");
      const apy = (s.parameters as any)?.selectedProduct 
        ? getAPYForProduct((s.parameters as any).selectedProduct)
        : getDefaultAPYForType(s.type);
      // Calculate estimated profit (per 5min cycle)
      return sum + (invested * apy / 100) / (365 * 24 * 12);
    }, 0) || 0,
    avgApy: userStrategies && userStrategies.filter(s => s.status === "active").length > 0
      ? userStrategies
          .filter(s => s.status === "active")
          .reduce((sum, s) => {
            const apy = (s.parameters as any)?.selectedProduct 
              ? getAPYForProduct((s.parameters as any).selectedProduct)
              : getDefaultAPYForType(s.type);
            return sum + apy;
          }, 0) / userStrategies.filter(s => s.status === "active").length
      : 0
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/20 flex items-center justify-center mb-6">
              <Bot className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Access Required</h2>
            <p className="text-muted-foreground mb-6">
              Sign in to configure and manage your AI trading strategies.
            </p>
            <Button className="w-full bg-gradient-to-r from-primary to-accent" onClick={() => {}}>
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-border p-4 flex flex-col">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Zap className="w-5 h-5 text-background" />
          </div>
          <span className="text-xl font-bold">LiquidAI</span>
        </div>

        <nav className="flex-1 space-y-1">
          <Link href="/dashboard">
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer">
              <BarChart3 className="w-5 h-5" />
              <span>Dashboard</span>
            </div>
          </Link>
          <Link href="/strategies">
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/10 text-primary cursor-pointer">
              <Bot className="w-5 h-5" />
              <span className="font-medium">Strategies</span>
            </div>
          </Link>
          <Link href="/portfolio">
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer">
              <PiggyBank className="w-5 h-5" />
              <span>Portfolio</span>
            </div>
          </Link>
          <Link href="/swap-bridge">
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer">
              <ArrowLeftRight className="w-5 h-5" />
              <span>Swap/Bridge</span>
            </div>
          </Link>
        </nav>

        <div className="border-t border-border pt-4 space-y-1">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer">
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </div>
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        {/* Header with Wallet */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">AI Strategies</h1>
            <p className="text-muted-foreground">Configure and manage your automated DeFi strategies</p>
          </div>
          <div className="flex items-center gap-4">
            {/* Wallet Balance Display */}
            <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-primary" />
                    <div>
                      <div className="text-xs text-muted-foreground">Available Balance</div>
                      <div className="text-xl font-bold text-primary">
                        ${wallet?.balanceUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                      </div>
                    </div>
                  </div>
                  <div className="h-8 w-px bg-border" />
                  <div>
                    <div className="text-xs text-muted-foreground">Invested</div>
                    <div className="text-sm font-semibold">
                      ${wallet?.investedUsd.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
                    </div>
                  </div>
                  <div className="h-8 w-px bg-border" />
                  <div>
                    <div className="text-xs text-muted-foreground">Total Rewards</div>
                    <div className="text-sm font-semibold text-success">
                      +${wallet?.totalRewardsUsd.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => setDepositDialogOpen(true)}
                    className="ml-2 bg-gradient-to-r from-primary to-accent"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Deposit
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-primary to-accent">
                <Plus className="w-4 h-4 mr-2" />
                New Strategy
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Strategy</DialogTitle>
                <DialogDescription>
                  Choose a strategy template and configure parameters to get started.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Strategy Templates */}
                <div>
                  <Label className="mb-3 block">Select Strategy Type</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {templates?.map((template) => {
                      const typeInfo = strategyTypeInfo[template.id as keyof typeof strategyTypeInfo];
                      const Icon = typeInfo?.icon || Bot;
                      return (
                        <div
                          key={template.id}
                          onClick={() => setSelectedTemplate(template.id)}
                          className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                            selectedTemplate === template.id
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-lg ${typeInfo?.bgColor} flex items-center justify-center`}>
                              <Icon className={`w-5 h-5 ${typeInfo?.color}`} />
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-sm">{template.name}</div>
                              <div className="text-xs text-muted-foreground mt-1">
                                Est. APY: {template.estimatedApy}
                              </div>
                              <Badge variant="outline" className="mt-2 text-xs">
                                {template.riskLevel}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {selectedTemplate && (
                  <>
                    {/* Strategy Name */}
                    <div>
                      <Label htmlFor="strategyName">Strategy Name</Label>
                      <Input
                        id="strategyName"
                        placeholder="My CRO Arbitrage Bot"
                        value={newStrategyName}
                        onChange={(e) => setNewStrategyName(e.target.value)}
                        className="mt-2"
                      />
                    </div>

                    {/* Strategy-Specific Parameters */}
                    {selectedTemplate === 'arbitrage' && (
                      <ArbitrageConfigForm 
                        config={arbitrageConfig}
                        onChange={setArbitrageConfig}
                      />
                    )}

                    {selectedTemplate === 'liquidity_provision' && (
                      <LiquidityConfigForm
                        config={liquidityConfig}
                        onChange={setLiquidityConfig}
                      />
                    )}

                    {selectedTemplate === 'yield_farming' && (
                      <YieldConfigForm
                        config={yieldConfig}
                        onChange={setYieldConfig}
                      />
                    )}

                    {selectedTemplate === 'rebalancing' && (
                      <RebalanceConfigForm
                        config={rebalanceConfig}
                        onChange={setRebalanceConfig}
                      />
                    )}

                    {/* Initial Deposit */}
                    <div>
                      <Label>Initial Deposit (USD)</Label>
                      <Input
                        type="number"
                        placeholder="1000"
                        value={strategyDepositAmount}
                        onChange={(e) => setStrategyDepositAmount(e.target.value)}
                        className="mt-2"
                      />
                    </div>

                    {/* Warning */}
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-warning/10 border border-warning/20">
                      <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <div className="font-medium text-warning">Risk Warning</div>
                        <div className="text-muted-foreground mt-1">
                          DeFi strategies involve risk. Past performance does not guarantee future results.
                          Only invest what you can afford to lose.
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <DialogFooter className="sticky bottom-0 bg-background pt-4 mt-4 border-t">
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)} className="bg-transparent">
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateStrategy}
                  disabled={!selectedTemplate || !newStrategyName || createMutation.isPending}
                  className="bg-gradient-to-r from-primary to-accent"
                >
                  {createMutation.isPending ? "Creating..." : "Create Strategy"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <Card className="bg-card/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Active Strategies</span>
                <CheckCircle className="w-4 h-4 text-success" />
              </div>
              <div className="text-2xl font-bold">{stats.active}</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Total Deposited</span>
                <Wallet className="w-4 h-4 text-primary" />
              </div>
              <div className="text-2xl font-bold">${stats.totalDeposited.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Total Profit</span>
                <TrendingUp className="w-4 h-4 text-success" />
              </div>
              <div className="text-2xl font-bold text-success">+${stats.totalProfit.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Avg. APY</span>
                <BarChart3 className="w-4 h-4 text-accent" />
              </div>
              <div className="text-2xl font-bold gradient-text">{stats.avgApy.toFixed(2)}%</div>
            </CardContent>
          </Card>
        </div>

        {/* DeFi Engine Status */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Cpu className="w-5 h-5" />
            DeFi Engine Status
          </h2>
          <div className="grid grid-cols-4 gap-4">
            <EngineStatusCard 
              name="Arbitrage" 
              icon={Signal}
              status={engineStatus?.find(e => e.name === 'Arbitrage')}
            />
            <EngineStatusCard 
              name="Liquidity" 
              icon={Layers}
              status={engineStatus?.find(e => e.name === 'Liquidity')}
            />
            <EngineStatusCard 
              name="Yield" 
              icon={TrendingUp}
              status={engineStatus?.find(e => e.name === 'Yield')}
            />
            <EngineStatusCard 
              name="Rebalancing" 
              icon={RefreshCw}
              status={engineStatus?.find(e => e.name === 'Rebalancing')}
            />
          </div>
        </div>

        {/* Strategy Cards */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Your Strategies</h2>

          {userStrategies && userStrategies.filter((s: any) => s.status !== 'stopped').length > 0 ? (
            userStrategies.filter((s: any) => s.status !== 'stopped').map((strategy) => {
              const typeInfo = strategyTypeInfo[strategy.type as keyof typeof strategyTypeInfo];
              const status = statusInfo[strategy.status as keyof typeof statusInfo];
              const Icon = typeInfo?.icon || Bot;
              
              // Calculate profit from rewards (estimate based on totalRewards / strategies)
              const investedAmount = parseFloat(strategy.totalDeposited || '0');
              const estimatedApy = (strategy.parameters as any)?.selectedProduct 
                ? getAPYForProduct((strategy.parameters as any).selectedProduct)
                : getDefaultAPYForType(strategy.type);
              const estimatedProfit = investedAmount > 0 
                ? (investedAmount * estimatedApy / 100) / (365 * 24 * 12) * 1 // ~1 reward cycle
                : 0;

              return (
                <Card key={strategy.id} className="bg-card/50">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className={`w-14 h-14 rounded-xl ${typeInfo?.bgColor} flex items-center justify-center`}>
                          <Icon className={`w-7 h-7 ${typeInfo?.color}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-semibold">{strategy.name}</h3>
                            <Badge variant="outline" className={`${status.color} bg-opacity-20`}>
                              <span className={`w-2 h-2 rounded-full ${status.color} mr-1.5`} />
                              {status.label}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {typeInfo?.label} Strategy • Checks every {strategy.parameters?.frequency || "5min"}
                          </div>

                          {/* Allocated Tokens */}
                          <div className="flex items-center gap-2 mt-3">
                            {strategy.allocatedTokens?.map((token, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-1 px-2 py-1 rounded-md bg-secondary text-xs"
                              >
                                <span className="font-medium">{token.token}</span>
                                <span className="text-muted-foreground">
                                  ${parseFloat(token.amount).toLocaleString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Stats & Actions */}
                      <div className="flex items-center gap-8">
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">Est. APY</div>
                          <div className="text-xl font-bold gradient-text">{estimatedApy.toFixed(2)}%</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">Deposited</div>
                          <div className="text-xl font-bold">${investedAmount.toLocaleString()}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">Profit (est.)</div>
                          <div className="text-xl font-bold text-success">+${estimatedProfit.toFixed(4)}</div>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-transparent hover:bg-primary/10 hover:text-primary hover:border-primary"
                            onClick={() => {
                              setSelectedStrategyForInvest({ id: strategy.id, name: strategy.name });
                              setInvestDialogOpen(true);
                            }}
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Invest
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-transparent hover:bg-accent/10 hover:text-accent hover:border-accent"
                            onClick={() => {
                              setSelectedStrategyForWithdraw({ 
                                id: strategy.id, 
                                name: strategy.name,
                                invested: parseFloat(strategy.totalDeposited || "0")
                              });
                              setWithdrawDialogOpen(true);
                            }}
                          >
                            <ArrowRight className="w-4 h-4 mr-1" />
                            Withdraw
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="bg-transparent"
                            onClick={() => handleToggleStrategy(strategy.id, strategy.status)}
                            disabled={setStatusMutation.isPending}
                          >
                            {strategy.status === "active" ? (
                              <Pause className="w-4 h-4" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="bg-transparent hover:bg-destructive/10 hover:text-destructive hover:border-destructive"
                            onClick={() => handleStopStrategy(strategy.id)}
                            disabled={setStatusMutation.isPending}
                          >
                            <Square className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="bg-transparent"
                            onClick={() => handleOpenConfig(strategy)}
                          >
                            <Settings className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Parameters */}
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Threshold:</span>
                          <span className="font-medium">{strategy.parameters?.threshold || "0.5"}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Max Slippage:</span>
                          <span className="font-medium">{strategy.parameters?.maxSlippage || "0.3"}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Frequency:</span>
                          <span className="font-medium">{strategy.parameters?.frequency || "5min"}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card className="bg-card/50">
              <CardContent className="p-12 text-center">
                <Bot className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  {userStrategies && userStrategies.some((s: any) => s.status === 'stopped') 
                    ? 'No Active Strategies' 
                    : 'No Strategies Yet'}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {userStrategies && userStrategies.some((s: any) => s.status === 'stopped')
                    ? 'Stopped strategies are hidden. Create a new strategy to get started.'
                    : 'Create your first AI-powered trading strategy to get started.'}
                </p>
                <Button
                  onClick={() => setCreateDialogOpen(true)}
                  className="bg-gradient-to-r from-primary to-accent"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Strategy
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Strategy Templates */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold mb-4">Available Strategy Templates</h2>
          <div className="grid grid-cols-2 gap-4">
            {templates?.map((template) => {
              const typeInfo = strategyTypeInfo[template.id as keyof typeof strategyTypeInfo];
              const Icon = typeInfo?.icon || Bot;
              return (
                <Card key={template.id} className="bg-card/50 card-hover">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl ${typeInfo?.bgColor} flex items-center justify-center`}>
                        <Icon className={`w-6 h-6 ${typeInfo?.color}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{template.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                        <div className="flex items-center gap-4 mt-3">
                          <div className="text-sm">
                            <span className="text-muted-foreground">Est. APY: </span>
                            <span className="font-medium text-success">{template.estimatedApy}</span>
                          </div>
                          <div className="text-sm">
                            <span className="text-muted-foreground">Min: </span>
                            <span className="font-medium">${template.minDeposit}</span>
                          </div>
                          <Badge variant="outline">{template.riskLevel}</Badge>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-3">
                          {template.supportedTokens.map((token) => (
                            <span key={token} className="px-2 py-0.5 rounded bg-secondary text-xs">
                              {token}
                            </span>
                          ))}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-transparent"
                        onClick={() => {
                          setSelectedTemplate(template.id);
                          setCreateDialogOpen(true);
                        }}
                      >
                        Use Template
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </main>

      {/* Configuration Dialog */}
      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Configure Strategy</DialogTitle>
            <DialogDescription>
              Adjust parameters for {selectedStrategy?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Parameters */}
            <div>
              <Label>Profit Threshold (%)</Label>
              <div className="mt-3">
                <Slider
                  value={configThreshold}
                  onValueChange={setConfigThreshold}
                  max={5}
                  step={0.1}
                  className="w-full"
                />
                <div className="text-sm text-muted-foreground mt-1">
                  {configThreshold[0]}%
                </div>
              </div>
            </div>

            <div>
              <Label>Max Slippage (%)</Label>
              <div className="mt-3">
                <Slider
                  value={configMaxSlippage}
                  onValueChange={setConfigMaxSlippage}
                  max={2}
                  step={0.1}
                  className="w-full"
                />
                <div className="text-sm text-muted-foreground mt-1">
                  {configMaxSlippage[0]}%
                </div>
              </div>
            </div>

            <div>
              <Label>Check Frequency</Label>
              <Select value={configFrequency} onValueChange={setConfigFrequency}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1min">Every 1 minute</SelectItem>
                  <SelectItem value="5min">Every 5 minutes</SelectItem>
                  <SelectItem value="15min">Every 15 minutes</SelectItem>
                  <SelectItem value="1hour">Every hour</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Warning */}
            <div className="flex items-start gap-3 p-4 rounded-lg bg-warning/10 border border-warning/20">
              <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <div className="font-medium text-warning">Note</div>
                <div className="text-muted-foreground mt-1">
                  Changes to parameters will take effect on the next execution cycle.
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfigDialogOpen(false)} className="bg-transparent">
              Cancel
            </Button>
            <Button
              onClick={handleSaveConfig}
              disabled={updateMutation.isPending}
              className="bg-gradient-to-r from-primary to-accent"
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DeFi Opportunities Panel */}
      <ArbitrageOpportunitiesPanel />

      {/* Investment Dialog */}
      <InvestmentDialog
        open={investDialogOpen}
        onOpenChange={setInvestDialogOpen}
        strategy={selectedStrategyForInvest}
        balance={wallet?.balanceUsd}
        onInvest={(amount: number) => {
          if (selectedStrategyForInvest) {
            investMutation.mutate({
              strategyId: selectedStrategyForInvest.id,
              amount
            });
          }
        }}
      />

      {/* Deposit Dialog */}
      <DepositDialog
        open={depositDialogOpen}
        onOpenChange={setDepositDialogOpen}
        onDeposit={(amount: number) => {
          depositMutation.mutate({ amount });
        }}
      />

      {/* Withdraw Dialog */}
      <WithdrawDialog
        open={withdrawDialogOpen}
        onOpenChange={setWithdrawDialogOpen}
        strategy={selectedStrategyForWithdraw}
        onWithdraw={(amount: number) => {
          if (selectedStrategyForWithdraw) {
            withdrawMutation.mutate({
              strategyId: selectedStrategyForWithdraw.id,
              amount
            });
          }
        }}
      />
    </div>
  );
}

// Engine Status Card Component
function EngineStatusCard({ 
  name, 
  icon: Icon, 
  status 
}: { 
  name: string; 
  icon: any; 
  status?: any;
}) {
  const isRunning = status?.running;
  
  return (
    <Card className="bg-card/50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Icon className={`w-4 h-4 ${isRunning ? 'text-success' : 'text-muted-foreground'}`} />
            <span className="text-sm font-medium">{name}</span>
          </div>
          <Badge variant={isRunning ? "default" : "secondary"} className="text-xs">
            {isRunning ? (
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                Active
              </span>
            ) : 'Inactive'}
          </Badge>
        </div>
        <div className="text-xs text-muted-foreground">
          {name === 'Arbitrage' && status?.stats && (
            <div>
              <div>Opportunities: {status.stats.opportunityCount || 0}</div>
              <div>Min Profit: {status.stats.config?.minProfitPercent || 0.5}%</div>
            </div>
          )}
          {name === 'Liquidity' && status?.stats && (
            <div>
              <div>Positions: {status.stats.totalPositions || 0}</div>
              <div>Value: ${status.stats.totalValueUSD?.toLocaleString() || 0}</div>
            </div>
          )}
          {name === 'Yield' && status?.stats && (
            <div>
              <div>Positions: {status.stats.positionCount || 0}</div>
              <div>APY: {status.stats.avgAPY?.toFixed(2) || 0}%</div>
            </div>
          )}
          {name === 'Rebalancing' && status?.stats && (
            <div>
              <div>Portfolios: {status.stats.totalPortfolios || 0}</div>
              <div>Needs: {status.stats.needsRebalance || 0}</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Arbitrage Opportunities Panel
function ArbitrageOpportunitiesPanel() {
  const { data: opportunities } = trpc.defi.getArbitrageOpportunities.useQuery(undefined, {
    refetchInterval: 10000,
  });

  if (!opportunities || opportunities.length === 0) {
    return null;
  }

  return (
    <Card className="mb-8 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Signal className="w-5 h-5 text-primary" />
          Live Arbitrage Opportunities
        </CardTitle>
        <CardDescription>
          Real-time opportunities detected across DEXes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {opportunities.slice(0, 5).map((opp: any) => (
            <div key={opp.id} className="flex items-center justify-between p-3 rounded-lg bg-card border">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{opp.token}</Badge>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {opp.buyDex?.toUpperCase()} → {opp.sellDex?.toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Profit</div>
                  <div className="text-lg font-bold text-success">
                    +{opp.profitPercent?.toFixed(2)}% (${opp.profitUSD?.toFixed(2)})
                  </div>
                </div>
                <Button size="sm" className="bg-gradient-to-r from-primary to-accent">
                  Execute
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
