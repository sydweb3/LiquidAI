import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { Link, useLocation } from "wouter";
import {
  Zap,
  Wallet,
  TrendingUp,
  TrendingDown,
  Layers,
  BarChart3,
  Activity,
  Settings,
  LogOut,
  RefreshCw,
  ExternalLink,
  ArrowUpRight,
  ArrowDownRight,
  Bot,
  Clock
} from "lucide-react";
import { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

// Mock portfolio history data for chart
const portfolioHistory = [
  { date: "Dec 15", value: 45000 },
  { date: "Dec 16", value: 47200 },
  { date: "Dec 17", value: 46800 },
  { date: "Dec 18", value: 49500 },
  { date: "Dec 19", value: 51200 },
  { date: "Dec 20", value: 50800 },
  { date: "Dec 21", value: 52400 },
  { date: "Dec 22", value: 54890 },
];

// Mock positions data
const mockPositions = [
  { id: 1, chain: "cronos", tokenSymbol: "CRO", balance: "125000", valueUsd: "11150.00" },
  { id: 2, chain: "cronos", tokenSymbol: "USDC", balance: "15000", valueUsd: "15000.00" },
  { id: 3, chain: "cronos", tokenSymbol: "VVS", balance: "50000000", valueUsd: "117.00" },
  { id: 4, chain: "crypto_com", tokenSymbol: "CRO", balance: "200000", valueUsd: "17840.00" },
  { id: 5, chain: "crypto_com", tokenSymbol: "USDT", balance: "8500", valueUsd: "8500.00" },
  { id: 6, chain: "cronos", tokenSymbol: "ETH", balance: "0.5", valueUsd: "1728.39" },
];

const COLORS = ["#38bdf8", "#a78bfa", "#34d399", "#fbbf24", "#f87171", "#fb923c"];

export default function Dashboard() {
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");

  // Fetch market prices
  const { data: prices } = trpc.market.getPrices.useQuery();
  const { data: poolData } = trpc.market.getPoolData.useQuery();

  // Calculate totals from mock data
  const totalValue = useMemo(() => {
    return mockPositions.reduce((sum, p) => sum + parseFloat(p.valueUsd), 0);
  }, []);

  const cronosValue = useMemo(() => {
    return mockPositions
      .filter(p => p.chain === "cronos")
      .reduce((sum, p) => sum + parseFloat(p.valueUsd), 0);
  }, []);

  const cryptoComValue = useMemo(() => {
    return mockPositions
      .filter(p => p.chain === "crypto_com")
      .reduce((sum, p) => sum + parseFloat(p.valueUsd), 0);
  }, []);

  // Pie chart data
  const pieData = useMemo(() => {
    return mockPositions.map(p => ({
      name: p.tokenSymbol,
      value: parseFloat(p.valueUsd),
      chain: p.chain
    }));
  }, []);

  // Simulated wallet connection
  const connectWallet = async () => {
    // Simulate wallet connection
    setWalletConnected(true);
    setWalletAddress("0x1234...5678");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
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
            <h2 className="text-2xl font-bold mb-2">Connect to Continue</h2>
            <p className="text-muted-foreground mb-6">
              Please sign in to access your LiquidAI dashboard and manage your cross-chain portfolio.
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
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/10 text-primary cursor-pointer">
              <BarChart3 className="w-5 h-5" />
              <span className="font-medium">Dashboard</span>
            </div>
          </Link>
          <Link href="/strategies">
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer">
              <Bot className="w-5 h-5" />
              <span>Strategies</span>
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
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user?.name || "User"}</p>
          </div>
          <div className="flex items-center gap-3">
            {walletConnected ? (
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-success/10 border border-success/20">
                <div className="w-2 h-2 rounded-full bg-success" />
                <span className="text-sm font-medium text-success">{walletAddress}</span>
              </div>
            ) : (
              <Button onClick={connectWallet} variant="outline" className="bg-transparent">
                <Wallet className="w-4 h-4 mr-2" />
                Connect Wallet
              </Button>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <Card className="bg-card/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Total Portfolio</span>
                <TrendingUp className="w-4 h-4 text-success" />
              </div>
              <div className="text-2xl font-bold">${totalValue.toLocaleString()}</div>
              <div className="flex items-center gap-1 mt-1">
                <ArrowUpRight className="w-3 h-3 text-success" />
                <span className="text-xs text-success">+2.34%</span>
                <span className="text-xs text-muted-foreground">24h</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Cronos Balance</span>
                <div className="chain-badge-cronos">Cronos</div>
              </div>
              <div className="text-2xl font-bold">${cronosValue.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {((cronosValue / totalValue) * 100).toFixed(1)}% of portfolio
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Crypto.com Balance</span>
                <div className="chain-badge-crypto">Crypto.com</div>
              </div>
              <div className="text-2xl font-bold">${cryptoComValue.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {((cryptoComValue / totalValue) * 100).toFixed(1)}% of portfolio
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Estimated APY</span>
                <BarChart3 className="w-4 h-4 text-primary" />
              </div>
              <div className="text-2xl font-bold gradient-text">32.5%</div>
              <div className="text-xs text-muted-foreground mt-1">
                Across all strategies
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          {/* Portfolio Chart */}
          <Card className="col-span-2 bg-card/50">
            <CardHeader>
              <CardTitle className="text-lg">Portfolio Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={portfolioHistory}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="date" stroke="#666" fontSize={12} />
                    <YAxis stroke="#666" fontSize={12} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1a1a2e",
                        border: "1px solid #333",
                        borderRadius: "8px"
                      }}
                      formatter={(value: number) => [`$${value.toLocaleString()}`, "Value"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#38bdf8"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorValue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Allocation Pie Chart */}
          <Card className="bg-card/50">
            <CardHeader>
              <CardTitle className="text-lg">Asset Allocation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1a1a2e",
                        border: "1px solid #333",
                        borderRadius: "8px"
                      }}
                      formatter={(value: number) => [`$${value.toLocaleString()}`, ""]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {pieData.slice(0, 4).map((item, index) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index] }}
                    />
                    <span className="text-xs text-muted-foreground">{item.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Positions & Market Data */}
        <div className="grid grid-cols-2 gap-6">
          {/* Positions Table */}
          <Card className="bg-card/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Your Positions</CardTitle>
              <Button variant="ghost" size="sm" className="text-primary">
                <RefreshCw className="w-4 h-4 mr-1" />
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockPositions.map((position) => (
                  <div
                    key={position.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-sm font-bold">{position.tokenSymbol.slice(0, 2)}</span>
                      </div>
                      <div>
                        <div className="font-medium">{position.tokenSymbol}</div>
                        <div className={position.chain === "cronos" ? "chain-badge-cronos" : "chain-badge-crypto"}>
                          {position.chain === "cronos" ? "Cronos" : "Crypto.com"}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">${parseFloat(position.valueUsd).toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">
                        {parseFloat(position.balance).toLocaleString()} {position.tokenSymbol}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Market Data */}
          <Card className="bg-card/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Market Overview</CardTitle>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                Live
                <span className="w-2 h-2 rounded-full bg-success pulse-live ml-1" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {prices && Object.entries(prices).slice(0, 5).map(([symbol, data]) => (
                  <div
                    key={symbol}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                        <span className="text-sm font-bold">{symbol.slice(0, 2)}</span>
                      </div>
                      <div className="font-medium">{symbol}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        ${data.price < 0.01 ? data.price.toExponential(2) : data.price.toLocaleString()}
                      </div>
                      <div className={`flex items-center gap-1 text-xs ${data.change24h >= 0 ? "text-success" : "text-destructive"}`}>
                        {data.change24h >= 0 ? (
                          <ArrowUpRight className="w-3 h-3" />
                        ) : (
                          <ArrowDownRight className="w-3 h-3" />
                        )}
                        {Math.abs(data.change24h).toFixed(2)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pool Data */}
              <div className="mt-6">
                <h4 className="text-sm font-medium mb-3">Top Pools (VVS Finance)</h4>
                <div className="space-y-2">
                  {poolData?.slice(0, 3).map((pool) => (
                    <div
                      key={pool.pair}
                      className="flex items-center justify-between p-2 rounded-lg bg-secondary/30"
                    >
                      <span className="text-sm">{pool.pair}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-muted-foreground">
                          TVL: ${(pool.tvl / 1000000).toFixed(1)}M
                        </span>
                        <span className="text-xs text-success font-medium">
                          {pool.apr.toFixed(2)}% APR
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
