import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";
import {
  Zap,
  Bot,
  BarChart3,
  Activity as ActivityIcon,
  Settings,
  LogOut,
  Search,
  Filter,
  ExternalLink,
  ArrowRightLeft,
  ArrowUpRight,
  ArrowDownRight,
  Droplets,
  Link2,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useState } from "react";

// Mock activity data
const mockActivities = [
  {
    id: 1,
    type: "swap",
    status: "confirmed",
    chain: "cronos",
    txHash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    fromToken: "CRO",
    toToken: "USDC",
    fromAmount: "5000",
    toAmount: "446.00",
    valueUsd: "446.00",
    createdAt: new Date(Date.now() - 1000 * 60 * 15), // 15 mins ago
    strategyName: "CRO Arbitrage Bot"
  },
  {
    id: 2,
    type: "bridge",
    status: "confirmed",
    chain: "crypto_com",
    txHash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
    fromToken: "CRO",
    toToken: "CRO",
    fromAmount: "10000",
    toAmount: "10000",
    valueUsd: "892.00",
    createdAt: new Date(Date.now() - 1000 * 60 * 45), // 45 mins ago
    strategyName: null
  },
  {
    id: 3,
    type: "add_liquidity",
    status: "confirmed",
    chain: "cronos",
    txHash: "0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba",
    fromToken: "CRO/VVS",
    toToken: "LP",
    fromAmount: "5000",
    toAmount: "1",
    valueUsd: "5000.00",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    strategyName: "VVS LP Strategy"
  },
  {
    id: 4,
    type: "strategy_execution",
    status: "confirmed",
    chain: "cronos",
    txHash: "0xfedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210",
    fromToken: "USDC",
    toToken: "CRO",
    fromAmount: "500",
    toAmount: "5600",
    valueUsd: "500.00",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
    strategyName: "CRO Arbitrage Bot"
  },
  {
    id: 5,
    type: "swap",
    status: "pending",
    chain: "cronos",
    txHash: "0x1111222233334444555566667777888899990000aaaabbbbccccddddeeeefffff",
    fromToken: "VVS",
    toToken: "CRO",
    fromAmount: "10000000",
    toAmount: "234",
    valueUsd: "23.40",
    createdAt: new Date(Date.now() - 1000 * 60 * 2), // 2 mins ago
    strategyName: null
  },
  {
    id: 6,
    type: "remove_liquidity",
    status: "confirmed",
    chain: "cronos",
    txHash: "0xaaaa1111bbbb2222cccc3333dddd4444eeee5555ffff6666000077778888999",
    fromToken: "LP",
    toToken: "CRO/USDC",
    fromAmount: "0.5",
    toAmount: "2500",
    valueUsd: "2500.00",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    strategyName: "VVS LP Strategy"
  },
  {
    id: 7,
    type: "deposit",
    status: "confirmed",
    chain: "cronos",
    txHash: "0xbbbb2222cccc3333dddd4444eeee5555ffff66660000777788889999aaaa1111",
    fromToken: "USDC",
    toToken: null,
    fromAmount: "2000",
    toAmount: null,
    valueUsd: "2000.00",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
    strategyName: "CRO Arbitrage Bot"
  },
  {
    id: 8,
    type: "approval",
    status: "confirmed",
    chain: "cronos",
    txHash: "0xcccc3333dddd4444eeee5555ffff66660000777788889999aaaa1111bbbb2222",
    fromToken: "CRO",
    toToken: null,
    fromAmount: "Unlimited",
    toAmount: null,
    valueUsd: "0",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72), // 3 days ago
    strategyName: null
  }
];

const activityTypeInfo: Record<string, { icon: typeof ArrowRightLeft; label: string; color: string; bgColor: string }> = {
  swap: { icon: ArrowRightLeft, label: "Swap", color: "text-primary", bgColor: "bg-primary/20" },
  bridge: { icon: Link2, label: "Bridge", color: "text-accent", bgColor: "bg-accent/20" },
  add_liquidity: { icon: Droplets, label: "Add Liquidity", color: "text-success", bgColor: "bg-success/20" },
  remove_liquidity: { icon: Droplets, label: "Remove Liquidity", color: "text-warning", bgColor: "bg-warning/20" },
  deposit: { icon: ArrowDownRight, label: "Deposit", color: "text-success", bgColor: "bg-success/20" },
  withdraw: { icon: ArrowUpRight, label: "Withdraw", color: "text-destructive", bgColor: "bg-destructive/20" },
  strategy_execution: { icon: Bot, label: "Strategy", color: "text-primary", bgColor: "bg-primary/20" },
  approval: { icon: CheckCircle, label: "Approval", color: "text-muted-foreground", bgColor: "bg-muted" }
};

const statusInfo: Record<string, { icon: typeof CheckCircle; label: string; color: string }> = {
  confirmed: { icon: CheckCircle, label: "Confirmed", color: "text-success" },
  pending: { icon: Clock, label: "Pending", color: "text-warning" },
  failed: { icon: XCircle, label: "Failed", color: "text-destructive" }
};

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

function getExplorerUrl(chain: string, txHash: string): string {
  if (chain === "cronos") {
    return `https://cronoscan.com/tx/${txHash}`;
  }
  return `https://crypto.org/explorer/tx/${txHash}`;
}

function truncateHash(hash: string): string {
  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
}

export default function Activity() {
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [chainFilter, setChainFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter activities
  const filteredActivities = mockActivities.filter((activity) => {
    if (typeFilter !== "all" && activity.type !== typeFilter) return false;
    if (chainFilter !== "all" && activity.chain !== chainFilter) return false;
    if (statusFilter !== "all" && activity.status !== statusFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        activity.txHash.toLowerCase().includes(query) ||
        activity.fromToken?.toLowerCase().includes(query) ||
        activity.toToken?.toLowerCase().includes(query) ||
        activity.strategyName?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredActivities.length / itemsPerPage);
  const paginatedActivities = filteredActivities.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
              <ActivityIcon className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Access Required</h2>
            <p className="text-muted-foreground mb-6">
              Sign in to view your transaction history and activity log.
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
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer">
              <Bot className="w-5 h-5" />
              <span>Strategies</span>
            </div>
          </Link>
          <Link href="/activity">
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/10 text-primary cursor-pointer">
              <ActivityIcon className="w-5 h-5" />
              <span className="font-medium">Activity</span>
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
            <h1 className="text-3xl font-bold">Activity Log</h1>
            <p className="text-muted-foreground">Track all your cross-chain transactions and strategy executions</p>
          </div>
          <Button variant="outline" className="bg-transparent">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <Card className="bg-card/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Total Transactions</span>
                <ActivityIcon className="w-4 h-4 text-primary" />
              </div>
              <div className="text-2xl font-bold">{mockActivities.length}</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Swaps</span>
                <ArrowRightLeft className="w-4 h-4 text-primary" />
              </div>
              <div className="text-2xl font-bold">
                {mockActivities.filter(a => a.type === "swap").length}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Bridges</span>
                <Link2 className="w-4 h-4 text-accent" />
              </div>
              <div className="text-2xl font-bold">
                {mockActivities.filter(a => a.type === "bridge").length}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Strategy Executions</span>
                <Bot className="w-4 h-4 text-success" />
              </div>
              <div className="text-2xl font-bold">
                {mockActivities.filter(a => a.type === "strategy_execution").length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-card/50 mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by hash, token, or strategy..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="swap">Swaps</SelectItem>
                  <SelectItem value="bridge">Bridges</SelectItem>
                  <SelectItem value="add_liquidity">Add Liquidity</SelectItem>
                  <SelectItem value="remove_liquidity">Remove Liquidity</SelectItem>
                  <SelectItem value="deposit">Deposits</SelectItem>
                  <SelectItem value="withdraw">Withdrawals</SelectItem>
                  <SelectItem value="strategy_execution">Strategy</SelectItem>
                  <SelectItem value="approval">Approvals</SelectItem>
                </SelectContent>
              </Select>
              <Select value={chainFilter} onValueChange={setChainFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Chain" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Chains</SelectItem>
                  <SelectItem value="cronos">Cronos</SelectItem>
                  <SelectItem value="crypto_com">Crypto.com</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Activity List */}
        <Card className="bg-card/50">
          <CardHeader>
            <CardTitle className="text-lg">Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {paginatedActivities.map((activity) => {
                const typeInfo = activityTypeInfo[activity.type];
                const status = statusInfo[activity.status];
                const Icon = typeInfo?.icon || ActivityIcon;
                const StatusIcon = status?.icon || Clock;

                return (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl ${typeInfo?.bgColor} flex items-center justify-center`}>
                        <Icon className={`w-6 h-6 ${typeInfo?.color}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{typeInfo?.label}</span>
                          <Badge variant="outline" className={status?.color}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {status?.label}
                          </Badge>
                          <span className={activity.chain === "cronos" ? "chain-badge-cronos" : "chain-badge-crypto"}>
                            {activity.chain === "cronos" ? "Cronos" : "Crypto.com"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                          {activity.fromToken && (
                            <>
                              <span>{activity.fromAmount} {activity.fromToken}</span>
                              {activity.toToken && (
                                <>
                                  <ArrowRightLeft className="w-3 h-3" />
                                  <span>{activity.toAmount} {activity.toToken}</span>
                                </>
                              )}
                            </>
                          )}
                        </div>
                        {activity.strategyName && (
                          <div className="flex items-center gap-1 mt-1">
                            <Bot className="w-3 h-3 text-primary" />
                            <span className="text-xs text-primary">{activity.strategyName}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="font-medium">
                          {parseFloat(activity.valueUsd) > 0 ? `$${parseFloat(activity.valueUsd).toLocaleString()}` : "-"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatTimeAgo(activity.createdAt)}
                        </div>
                      </div>
                      <a
                        href={getExplorerUrl(activity.chain, activity.txHash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
                      >
                        <span className="text-xs font-mono">{truncateHash(activity.txHash)}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                );
              })}

              {filteredActivities.length === 0 && (
                <div className="text-center py-12">
                  <ActivityIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Activity Found</h3>
                  <p className="text-muted-foreground">
                    {searchQuery || typeFilter !== "all" || chainFilter !== "all" || statusFilter !== "all"
                      ? "Try adjusting your filters"
                      : "Your transaction history will appear here"}
                  </p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-border">
                <div className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                  {Math.min(currentPage * itemsPerPage, filteredActivities.length)} of{" "}
                  {filteredActivities.length} transactions
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-transparent"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      className={currentPage === page ? "bg-primary" : "bg-transparent"}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-transparent"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
