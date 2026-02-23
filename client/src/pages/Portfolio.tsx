import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import {
  Zap,
  Bot,
  BarChart3,
  Settings,
  LogOut,
  TrendingUp,
  Wallet,
  Clock,
  RefreshCw,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  PiggyBank,
  ArrowLeftRight
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MobileHeader, MobileSidebar } from "@/components/MobileNav";

export default function Portfolio() {
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [lastRewardTime, setLastRewardTime] = useState<Date | null>(null);
  const [nextRewardIn, setNextRewardIn] = useState<number>(300); // 5 minutes in seconds

  // Wallet data - refresh every 5 seconds
  const { data: wallet, refetch: refetchWallet } = trpc.wallet.getBalance.useQuery(undefined, {
    refetchInterval: 5000,
  });

  // Transaction history
  const { data: transactions, refetch: refetchTransactions } = trpc.wallet.getTransactions.useQuery({
    limit: 20
  }, {
    refetchInterval: 5000,
  });

  // User strategies
  const { data: strategies, refetch: refetchStrategies } = trpc.strategies.list.useQuery(undefined, {
    refetchInterval: 5000,
  });

  // Yield portfolio
  const { data: yieldPortfolio } = trpc.defi.getYieldPortfolio.useQuery(undefined, {
    refetchInterval: 5000,
  });

  // Track reward distribution (listen for new transactions)
  useEffect(() => {
    if (transactions && transactions.length > 0) {
      const latestReward = transactions.find(t => t.type === 'reward');
      if (latestReward) {
        const rewardTime = new Date(latestReward.createdAt);
        if (!lastRewardTime || rewardTime > lastRewardTime) {
          setLastRewardTime(rewardTime);
          toast.success("Rewards received!", {
            description: `+$${parseFloat(latestReward.amountUsd).toFixed(4)} added to your wallet`
          });
          refetchWallet();
        }
      }
    }
  }, [transactions]);

  // Countdown to next reward
  useEffect(() => {
    const timer = setInterval(() => {
      setNextRewardIn(prev => {
        if (prev <= 1) {
          refetchWallet();
          refetchTransactions();
          refetchStrategies();
          return 300; // Reset to 5 minutes
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateRewardsPerDay = () => {
    const totalInvested = wallet?.investedUsd || 0;
    // Average APY around 25%
    return (totalInvested * 0.25) / 365;
  };

  const calculateRewardsPer5Min = () => {
    return calculateRewardsPerDay() / (24 * 12);
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
              <Wallet className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Access Required</h2>
            <p className="text-muted-foreground mb-6">
              Sign in to view your portfolio.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalValue = (wallet?.balanceUsd || 0) + (wallet?.investedUsd || 0);
  const totalRewards = wallet?.totalRewardsUsd || 0;

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
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer">
              <Bot className="w-5 h-5" />
              <span>Strategies</span>
            </div>
          </Link>
          <Link href="/portfolio">
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/10 text-primary cursor-pointer">
              <PiggyBank className="w-5 h-5" />
              <span className="font-medium">Portfolio</span>
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
            <h1 className="text-3xl font-bold">My Portfolio</h1>
            <p className="text-muted-foreground">Track your investments and rewards in real-time</p>
          </div>
          <Button onClick={() => {
            refetchWallet();
            refetchTransactions();
            refetchStrategies();
            toast.success("Portfolio refreshed!");
          }} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>

        {/* Live Reward Timer */}
        <Card className="mb-8 bg-gradient-to-br from-success/10 to-success/5 border-success/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-success" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Next Reward Distribution In</div>
                  <div className="text-3xl font-bold text-success font-mono">
                    {formatTime(nextRewardIn)}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Estimated per 5min</div>
                <div className="text-2xl font-bold text-success">
                  +${calculateRewardsPer5Min().toFixed(4)}
                </div>
                <div className="text-xs text-muted-foreground">
                  ~${calculateRewardsPerDay().toFixed(2)} per day
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Portfolio Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <Card className="bg-card/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Total Value</span>
                <Wallet className="w-4 h-4 text-primary" />
              </div>
              <div className="text-2xl font-bold">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Available Balance</span>
                <DollarSign className="w-4 h-4 text-success" />
              </div>
              <div className="text-2xl font-bold text-success">${wallet?.balanceUsd.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Invested</span>
                <TrendingUp className="w-4 h-4 text-accent" />
              </div>
              <div className="text-2xl font-bold text-accent">${wallet?.investedUsd.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Total Rewards Earned</span>
                <PiggyBank className="w-4 h-4 text-warning" />
              </div>
              <div className="text-2xl font-bold text-warning">+${totalRewards.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}</div>
            </CardContent>
          </Card>
        </div>

        {/* Active Strategies */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* Strategies List */}
          <Card className="bg-card/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="w-5 h-5" />
                Active Strategies
              </CardTitle>
              <CardDescription>Your invested strategies</CardDescription>
            </CardHeader>
            <CardContent>
              {strategies && strategies.filter((s: any) => s.status !== 'stopped').length > 0 ? (
                <div className="space-y-3">
                  {strategies.filter((s: any) => s.status !== 'stopped').map((strategy: any) => (
                    <div key={strategy.id} className="p-3 rounded-lg bg-secondary border">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{strategy.name}</div>
                          <div className="text-xs text-muted-foreground capitalize">{strategy.type.replace('_', ' ')}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold">
                            ${parseFloat(strategy.totalDeposited || '0').toLocaleString()}
                          </div>
                          <Badge variant={strategy.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                            {strategy.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Bot className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <div>
                    {strategies && strategies.some((s: any) => s.status === 'stopped')
                      ? 'No active strategies'
                      : 'No active strategies'}
                  </div>
                  <Link href="/strategies">
                    <Button variant="link" className="text-primary">Create one</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Rewards */}
          <Card className="bg-card/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PiggyBank className="w-5 h-5 text-warning" />
                Recent Rewards
              </CardTitle>
              <CardDescription>Rewards distributed every 5 minutes</CardDescription>
            </CardHeader>
            <CardContent>
              {lastRewardTime ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ArrowUpRight className="w-4 h-4 text-success" />
                        <div>
                          <div className="font-medium text-success">Latest Reward</div>
                          <div className="text-xs text-muted-foreground">
                            {lastRewardTime.toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-lg font-bold text-success">
                        +${calculateRewardsPer5Min().toFixed(4)}
                      </div>
                    </div>
                  </div>
                  <div className="text-center text-sm text-muted-foreground">
                    Next distribution in {formatTime(nextRewardIn)}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <div>No rewards yet</div>
                  <div className="text-xs">Rewards distributed every 5 minutes</div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Transaction History */}
        <Card className="bg-card/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Transaction History
            </CardTitle>
            <CardDescription>Recent deposits, investments, and rewards</CardDescription>
          </CardHeader>
          <CardContent>
            {transactions && transactions.length > 0 ? (
              <div className="space-y-2">
                {transactions.map((tx: any) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary border">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        tx.type === 'reward' ? 'bg-success/20' :
                        tx.type === 'deposit' ? 'bg-primary/20' :
                        tx.type === 'invest' ? 'bg-accent/20' :
                        'bg-secondary'
                      }`}>
                        {tx.type === 'reward' ? (
                          <ArrowUpRight className="w-4 h-4 text-success" />
                        ) : tx.type === 'deposit' ? (
                          <ArrowDownRight className="w-4 h-4 text-primary" />
                        ) : tx.type === 'invest' ? (
                          <TrendingUp className="w-4 h-4 text-accent" />
                        ) : (
                          <Wallet className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium capitalize">{tx.type.replace('_', ' ')}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(tx.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-semibold ${
                        tx.type === 'reward' || tx.type === 'deposit' || tx.type === 'withdraw_invest'
                          ? 'text-success' 
                          : tx.type === 'invest'
                          ? 'text-accent'
                          : ''
                      }`}>
                        {tx.type === 'invest' ? '-' : '+'}${parseFloat(tx.amountUsd).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                      {tx.description && (
                        <div className="text-xs text-muted-foreground">{tx.description}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <div>No transactions yet</div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
