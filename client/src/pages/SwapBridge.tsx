import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import {
  Zap,
  Bot,
  BarChart3,
  Activity,
  Settings,
  LogOut,
  ArrowLeftRight,
  Wallet,
  RefreshCw,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowRightLeft,
  PiggyBank
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { MobileHeader, MobileSidebar } from "@/components/MobileNav";

// Token configurations
const TOKENS = [
  { symbol: 'CRO', name: 'Cronos', decimals: 18, icon: '₮' },
  { symbol: 'USDC', name: 'USD Coin', decimals: 6, icon: '$' },
  { symbol: 'USDT', name: 'Tether', decimals: 6, icon: '₮' },
  { symbol: 'ETH', name: 'Ethereum', decimals: 18, icon: 'Ξ' },
  { symbol: 'WBTC', name: 'Wrapped BTC', decimals: 8, icon: '₿' },
  { symbol: 'VVS', name: 'VVS Finance', decimals: 18, icon: 'V' },
];

// Bridge destinations
const BRIDGE_DESTINATIONS = [
  { id: 'ethereum', name: 'Ethereum', type: 'DEX', icon: '⟠' },
  { id: 'bsc', name: 'BNB Chain', type: 'DEX', icon: '⬡' },
  { id: 'polygon', name: 'Polygon', type: 'DEX', icon: '⬢' },
  { id: 'arbitrum', name: 'Arbitrum', type: 'DEX', icon: '◈' },
  { id: 'binance', name: 'Binance', type: 'CEX', icon: 'B' },
  { id: 'coinbase', name: 'Coinbase', type: 'CEX', icon: 'C' },
];

export default function SwapBridge() {
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Wallet data
  const { data: wallet, refetch: refetchWallet } = trpc.wallet.getBalance.useQuery(undefined, {
    refetchInterval: 5000,
  });

  // Swap state
  const [swapFromToken, setSwapFromToken] = useState('CRO');
  const [swapToToken, setSwapToToken] = useState('USDC');
  const [swapAmount, setSwapAmount] = useState('');
  const [swapRate, setSwapRate] = useState(0);

  // Bridge state
  const [bridgeFromToken, setBridgeFromToken] = useState('CRO');
  const [bridgeToChain, setBridgeToChain] = useState('ethereum');
  const [bridgeAmount, setBridgeAmount] = useState('');
  const [bridgeType, setBridgeType] = useState<'DEX' | 'CEX'>('DEX');

  // Swap handlers
  const handleSwapTokens = () => {
    const temp = swapFromToken;
    setSwapFromToken(swapToToken);
    setSwapToToken(temp);
  };

  const handleSwap = () => {
    if (!swapAmount || parseFloat(swapAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    toast.success("Swap executed!", {
      description: `Swapped ${swapAmount} ${swapFromToken} to ${(parseFloat(swapAmount) * swapRate).toFixed(2)} ${swapToToken}`
    });
    setSwapAmount('');
    refetchWallet();
  };

  // Bridge handlers
  const handleBridge = () => {
    if (!bridgeAmount || parseFloat(bridgeAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    const dest = BRIDGE_DESTINATIONS.find(d => d.id === bridgeToChain);
    toast.success("Bridge initiated!", {
      description: `Bridging ${bridgeAmount} ${bridgeFromToken} to ${dest?.name} via ${bridgeType}`
    });
    setBridgeAmount('');
    refetchWallet();
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
              <ArrowLeftRight className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Access Required</h2>
            <p className="text-muted-foreground mb-6">
              Sign in to swap and bridge tokens.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Sidebar */}
      <MobileSidebar
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      >
        <div className="space-y-1">
          <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer">
              <BarChart3 className="w-5 h-5" />
              <span>Dashboard</span>
            </div>
          </Link>
          <Link href="/strategies" onClick={() => setMobileMenuOpen(false)}>
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer">
              <Bot className="w-5 h-5" />
              <span>Strategies</span>
            </div>
          </Link>
          <Link href="/portfolio" onClick={() => setMobileMenuOpen(false)}>
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer">
              <PiggyBank className="w-5 h-5" />
              <span>Portfolio</span>
            </div>
          </Link>
          <Link href="/swap-bridge" onClick={() => setMobileMenuOpen(false)}>
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/10 text-primary cursor-pointer">
              <ArrowLeftRight className="w-5 h-5" />
              <span className="font-medium">Swap/Bridge</span>
            </div>
          </Link>
          <div className="pt-4 border-t border-border mt-4">
            <button
              onClick={() => {
                logout();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </MobileSidebar>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-border p-4 flex-col">
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
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer">
              <Bot className="w-5 h-5" />
              <span>Strategies</span>
            </div>
          </Link>
          <Link href="/portfolio">
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer">
              <PiggyBank className="w-5 h-5" />
              <span>Portfolio</span>
            </div>
          </Link>
          <Link href="/swap-bridge">
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/10 text-primary cursor-pointer">
              <ArrowLeftRight className="w-5 h-5" />
              <span className="font-medium">Swap/Bridge</span>
            </div>
          </Link>
        </nav>

        <div className="border-t border-border pt-4 space-y-1">
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
      <main className="lg:ml-64 p-4 sm:p-8 pt-20 lg:pt-8">
        {/* Mobile Header */}
        <MobileHeader
          title="Swap & Bridge"
          subtitle="Swap tokens and bridge across chains"
          onMenuClick={() => setMobileMenuOpen(true)}
          rightElement={
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
                <Wallet className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">${wallet?.balanceUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</span>
              </div>
            </div>
          }
        />

        {/* Desktop Header */}
        <div className="hidden lg:flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Swap & Bridge</h1>
            <p className="text-muted-foreground">Swap tokens and bridge across chains</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-2">
              <Wallet className="w-4 h-4" />
              ${wallet?.balanceUsd.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Token Swap */}
          <Card className="bg-card/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-primary" />
                Token Swap
              </CardTitle>
              <CardDescription>Swap tokens on Cronos chain</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* From */}
              <div className="space-y-2">
                <Label>From</Label>
                <div className="flex gap-2">
                  <Select value={swapFromToken} onValueChange={setSwapFromToken}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TOKENS.map(token => (
                        <SelectItem key={token.symbol} value={token.symbol}>
                          {token.symbol}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={swapAmount}
                    onChange={(e) => setSwapAmount(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>

              {/* Swap Button */}
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleSwapTokens}
                  className="rounded-full"
                >
                  <ArrowLeftRight className="w-4 h-4" />
                </Button>
              </div>

              {/* To */}
              <div className="space-y-2">
                <Label>To</Label>
                <div className="flex gap-2">
                  <Select value={swapToToken} onValueChange={setSwapToToken}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TOKENS.filter(t => t.symbol !== swapFromToken).map(token => (
                        <SelectItem key={token.symbol} value={token.symbol}>
                          {token.symbol}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={swapAmount ? (parseFloat(swapAmount) * swapRate).toFixed(2) : ''}
                    readOnly
                    className="flex-1 bg-secondary"
                  />
                </div>
              </div>

              {/* Rate Info */}
              {swapAmount && (
                <div className="p-3 rounded-lg bg-secondary text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rate</span>
                    <span>1 {swapFromToken} = {swapRate || '0.00'} {swapToToken}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Network Fee</span>
                    <span>~$0.50</span>
                  </div>
                </div>
              )}

              <Button 
                onClick={handleSwap}
                className="w-full bg-gradient-to-r from-primary to-accent"
                disabled={!swapAmount || parseFloat(swapAmount) <= 0}
              >
                Swap Tokens
              </Button>
            </CardContent>
          </Card>

          {/* Bridge */}
          <Card className="bg-card/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-accent" />
                Bridge Assets
              </CardTitle>
              <CardDescription>Transfer tokens across chains</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Bridge Type */}
              <div className="flex gap-2">
                <Button
                  variant={bridgeType === 'DEX' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setBridgeType('DEX')}
                  className="flex-1"
                >
                  DEX Bridge
                </Button>
                <Button
                  variant={bridgeType === 'CEX' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setBridgeType('CEX')}
                  className="flex-1"
                >
                  CEX Bridge
                </Button>
              </div>

              {/* From Token */}
              <div className="space-y-2">
                <Label>From (Cronos)</Label>
                <div className="flex gap-2">
                  <Select value={bridgeFromToken} onValueChange={setBridgeFromToken}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TOKENS.map(token => (
                        <SelectItem key={token.symbol} value={token.symbol}>
                          {token.symbol} - {token.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <Label>Amount</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={bridgeAmount}
                  onChange={(e) => setBridgeAmount(e.target.value)}
                />
              </div>

              {/* To Chain */}
              <div className="space-y-2">
                <Label>To Destination</Label>
                <div className="grid grid-cols-3 gap-2">
                  {BRIDGE_DESTINATIONS.filter(d => d.type === bridgeType).map(dest => (
                    <Button
                      key={dest.id}
                      variant={bridgeToChain === dest.id ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setBridgeToChain(dest.id)}
                      className="flex flex-col h-auto py-3"
                    >
                      <span className="text-lg">{dest.icon}</span>
                      <span className="text-xs">{dest.name}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Bridge Info */}
              {bridgeAmount && (
                <div className="p-3 rounded-lg bg-secondary text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bridge Fee</span>
                    <span>~${(parseFloat(bridgeAmount) * 0.01).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Est. Time</span>
                    <span>{bridgeType === 'DEX' ? '5-15 min' : '30-60 min'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">You Receive</span>
                    <span>≈{(parseFloat(bridgeAmount) * 0.99).toFixed(2)} {bridgeFromToken}</span>
                  </div>
                </div>
              )}

              <Button 
                onClick={handleBridge}
                className="w-full bg-gradient-to-r from-primary to-accent"
                disabled={!bridgeAmount || parseFloat(bridgeAmount) <= 0}
              >
                <ArrowRightLeft className="w-4 h-4 mr-2" />
                Bridge to {BRIDGE_DESTINATIONS.find(d => d.id === bridgeToChain)?.name}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions */}
        <Card className="mt-6 bg-card/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Recent Transactions
            </CardTitle>
            <CardDescription>Your swap and bridge history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <div>No recent transactions</div>
              <div className="text-xs">Your swap and bridge transactions will appear here</div>
            </div>
          </CardContent>
        </Card>

        {/* Supported Networks */}
        <div className="mt-6 grid grid-cols-2 gap-6">
          <Card className="bg-card/50">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Supported DEX Bridges
              </h3>
              <div className="flex flex-wrap gap-2">
                {['Ethereum', 'BNB Chain', 'Polygon', 'Arbitrum', 'Optimism', 'Avalanche'].map(chain => (
                  <Badge key={chain} variant="outline">{chain}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Supported CEX Bridges
              </h3>
              <div className="flex flex-wrap gap-2">
                {['Binance', 'Coinbase', 'Kraken', 'OKX', 'Bybit'].map(exchange => (
                  <Badge key={exchange} variant="outline">{exchange}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info Cards */}
        <div className="mt-6 p-4 rounded-lg bg-warning/10 border border-warning/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <div className="font-medium text-warning">Important Notice</div>
              <div className="text-muted-foreground mt-1">
                Bridge transactions are irreversible. Always verify the destination address and network before confirming. 
                DEX bridges are faster (5-15 min) while CEX bridges may take 30-60 minutes for confirmation.
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
