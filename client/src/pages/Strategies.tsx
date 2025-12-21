import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
import { getLoginUrl } from "@/const";
import { Link } from "wouter";
import {
  Zap,
  Bot,
  BarChart3,
  Activity,
  Settings,
  LogOut,
  Plus,
  Play,
  Pause,
  Square,
  TrendingUp,
  Shield,
  Layers,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Wallet,
  ArrowRight
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

// Mock user strategies
const mockStrategies = [
  {
    id: 1,
    name: "CRO Arbitrage Bot",
    type: "arbitrage",
    status: "active",
    parameters: { threshold: 0.5, frequency: "5min", maxSlippage: 0.3 },
    estimatedApy: "28.5",
    totalDeposited: "5000",
    totalProfit: "234.56",
    allocatedTokens: [
      { token: "CRO", amount: "3000", chain: "cronos" },
      { token: "USDC", amount: "2000", chain: "crypto_com" }
    ]
  },
  {
    id: 2,
    name: "VVS LP Strategy",
    type: "liquidity_provision",
    status: "paused",
    parameters: { threshold: 1.0, frequency: "1hour", maxSlippage: 0.5 },
    estimatedApy: "45.2",
    totalDeposited: "10000",
    totalProfit: "892.34",
    allocatedTokens: [
      { token: "CRO", amount: "5000", chain: "cronos" },
      { token: "VVS", amount: "5000", chain: "cronos" }
    ]
  }
];

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

const statusInfo = {
  active: { color: "bg-success", label: "Active" },
  paused: { color: "bg-warning", label: "Paused" },
  stopped: { color: "bg-destructive", label: "Stopped" }
};

export default function Strategies() {
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [newStrategyName, setNewStrategyName] = useState("");
  const [threshold, setThreshold] = useState([0.5]);
  const [maxSlippage, setMaxSlippage] = useState([0.3]);
  const [frequency, setFrequency] = useState("5min");
  const [depositAmount, setDepositAmount] = useState("");

  // Fetch strategy templates
  const { data: templates } = trpc.strategies.getTemplates.useQuery();

  const handleCreateStrategy = () => {
    if (!selectedTemplate || !newStrategyName) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    toast.success("Strategy created successfully!", {
      description: `${newStrategyName} is now ready to be activated.`
    });
    setCreateDialogOpen(false);
    setSelectedTemplate(null);
    setNewStrategyName("");
  };

  const handleToggleStrategy = (strategyId: number, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "paused" : "active";
    toast.success(`Strategy ${newStatus === "active" ? "activated" : "paused"}`);
  };

  const handleStopStrategy = (strategyId: number) => {
    toast.success("Strategy stopped and funds withdrawn");
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
            <a href={getLoginUrl()}>
              <Button className="w-full bg-gradient-to-r from-primary to-accent">
                Sign In
              </Button>
            </a>
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
          <Link href="/activity">
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer">
              <Activity className="w-5 h-5" />
              <span>Activity</span>
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
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">AI Strategies</h1>
            <p className="text-muted-foreground">Configure and manage your automated DeFi strategies</p>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-primary to-accent">
                <Plus className="w-4 h-4 mr-2" />
                New Strategy
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
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

                    {/* Parameters */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Profit Threshold (%)</Label>
                        <div className="mt-3">
                          <Slider
                            value={threshold}
                            onValueChange={setThreshold}
                            max={5}
                            step={0.1}
                            className="w-full"
                          />
                          <div className="text-sm text-muted-foreground mt-1">
                            {threshold[0]}%
                          </div>
                        </div>
                      </div>
                      <div>
                        <Label>Max Slippage (%)</Label>
                        <div className="mt-3">
                          <Slider
                            value={maxSlippage}
                            onValueChange={setMaxSlippage}
                            max={2}
                            step={0.1}
                            className="w-full"
                          />
                          <div className="text-sm text-muted-foreground mt-1">
                            {maxSlippage[0]}%
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Check Frequency</Label>
                        <Select value={frequency} onValueChange={setFrequency}>
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
                      <div>
                        <Label>Initial Deposit (USD)</Label>
                        <Input
                          type="number"
                          placeholder="1000"
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(e.target.value)}
                          className="mt-2"
                        />
                      </div>
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

              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)} className="bg-transparent">
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateStrategy}
                  disabled={!selectedTemplate || !newStrategyName}
                  className="bg-gradient-to-r from-primary to-accent"
                >
                  Create Strategy
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
              <div className="text-2xl font-bold">1</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Total Deposited</span>
                <Wallet className="w-4 h-4 text-primary" />
              </div>
              <div className="text-2xl font-bold">$15,000</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Total Profit</span>
                <TrendingUp className="w-4 h-4 text-success" />
              </div>
              <div className="text-2xl font-bold text-success">+$1,126.90</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Avg. APY</span>
                <BarChart3 className="w-4 h-4 text-accent" />
              </div>
              <div className="text-2xl font-bold gradient-text">36.85%</div>
            </CardContent>
          </Card>
        </div>

        {/* Strategy Cards */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Your Strategies</h2>
          
          {mockStrategies.map((strategy) => {
            const typeInfo = strategyTypeInfo[strategy.type as keyof typeof strategyTypeInfo];
            const status = statusInfo[strategy.status as keyof typeof statusInfo];
            const Icon = typeInfo?.icon || Bot;

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
                          {typeInfo?.label} Strategy • Checks every {strategy.parameters.frequency}
                        </div>
                        
                        {/* Allocated Tokens */}
                        <div className="flex items-center gap-2 mt-3">
                          {strategy.allocatedTokens.map((token, idx) => (
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
                        <div className="text-xl font-bold gradient-text">{strategy.estimatedApy}%</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Deposited</div>
                        <div className="text-xl font-bold">${parseFloat(strategy.totalDeposited).toLocaleString()}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Profit</div>
                        <div className="text-xl font-bold text-success">+${parseFloat(strategy.totalProfit).toLocaleString()}</div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="icon"
                          className="bg-transparent"
                          onClick={() => handleToggleStrategy(strategy.id, strategy.status)}
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
                        >
                          <Square className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="icon" className="bg-transparent">
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
                        <span className="font-medium">{strategy.parameters.threshold}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Max Slippage:</span>
                        <span className="font-medium">{strategy.parameters.maxSlippage}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Frequency:</span>
                        <span className="font-medium">{strategy.parameters.frequency}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
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
    </div>
  );
}
