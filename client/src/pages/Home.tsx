import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";
import {
  ArrowRight,
  Zap,
  Shield,
  BarChart3,
  Layers,
  Bot,
  Workflow,
  Globe,
  TrendingUp,
  Lock,
  RefreshCw,
  ChevronRight,
  ExternalLink,
  Github,
  Twitter,
  MessageCircle
} from "lucide-react";

export default function Home() {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border/50">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Zap className="w-5 h-5 text-background" />
            </div>
            <span className="text-xl font-bold">LiquidAI</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">How It Works</a>
            <a href="#technology" className="text-muted-foreground hover:text-foreground transition-colors">Technology</a>
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity">
                  Dashboard
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            ) : (
              <a href={getLoginUrl()}>
                <Button className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity">
                  Launch App
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 animated-gradient opacity-50" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
        
        <div className="container relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
              <span className="w-2 h-2 rounded-full bg-success pulse-live" />
              <span className="text-sm text-primary">Powered by Crypto.com AI Agent SDK</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="gradient-text">AI-Powered</span>
              <br />
              Cross-Chain Liquidity
            </h1>
            
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Automate your DeFi strategies across Crypto.com and Cronos chains with intelligent 
              AI agents. Maximize yields, minimize risks, and manage everything from one unified dashboard.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {isAuthenticated ? (
                <Link href="/dashboard">
                  <Button size="lg" className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity text-lg px-8 py-6">
                    Go to Dashboard
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              ) : (
                <a href={getLoginUrl()}>
                  <Button size="lg" className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity text-lg px-8 py-6">
                    Start Managing
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </a>
              )}
              <a href="#how-it-works">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 bg-transparent">
                  Learn More
                </Button>
              </a>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 mt-16 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold gradient-text">$2.4M+</div>
                <div className="text-sm text-muted-foreground mt-1">Total Value Managed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold gradient-text">24/7</div>
                <div className="text-sm text-muted-foreground mt-1">AI Monitoring</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold gradient-text">45%</div>
                <div className="text-sm text-muted-foreground mt-1">Avg. APY</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Floating Dashboard Preview */}
        <div className="container relative z-10 mt-16">
          <div className="max-w-5xl mx-auto">
            <div className="gradient-border rounded-2xl overflow-hidden glow">
              <div className="bg-card p-1">
                <div className="bg-background rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-3 h-3 rounded-full bg-destructive" />
                    <div className="w-3 h-3 rounded-full bg-warning" />
                    <div className="w-3 h-3 rounded-full bg-success" />
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="col-span-1 space-y-4">
                      <div className="h-8 bg-secondary rounded-lg" />
                      <div className="h-8 bg-secondary/50 rounded-lg" />
                      <div className="h-8 bg-secondary/50 rounded-lg" />
                      <div className="h-8 bg-secondary/50 rounded-lg" />
                    </div>
                    <div className="col-span-3 space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="h-24 bg-secondary rounded-xl flex items-center justify-center">
                          <TrendingUp className="w-8 h-8 text-success" />
                        </div>
                        <div className="h-24 bg-secondary rounded-xl flex items-center justify-center">
                          <BarChart3 className="w-8 h-8 text-primary" />
                        </div>
                        <div className="h-24 bg-secondary rounded-xl flex items-center justify-center">
                          <Layers className="w-8 h-8 text-accent" />
                        </div>
                      </div>
                      <div className="h-48 bg-secondary rounded-xl" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem & Solution Section */}
      <section className="py-24 relative">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">The Challenge & Our Solution</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Managing DeFi portfolios across multiple chains is complex and time-consuming. 
              LiquidAI transforms this experience.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Problem */}
            <Card className="bg-destructive/5 border-destructive/20">
              <CardContent className="p-8">
                <div className="w-12 h-12 rounded-xl bg-destructive/20 flex items-center justify-center mb-6">
                  <span className="text-2xl">😰</span>
                </div>
                <h3 className="text-2xl font-semibold mb-4 text-destructive">The Problem</h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-destructive text-sm">✕</span>
                    </div>
                    <span className="text-muted-foreground">Manually tracking positions across multiple chains and protocols</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-destructive text-sm">✕</span>
                    </div>
                    <span className="text-muted-foreground">Missing arbitrage opportunities due to slow manual execution</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-destructive text-sm">✕</span>
                    </div>
                    <span className="text-muted-foreground">Complex bridging processes between Crypto.com and Cronos</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-destructive text-sm">✕</span>
                    </div>
                    <span className="text-muted-foreground">No unified view of total portfolio value and performance</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
            
            {/* Solution */}
            <Card className="bg-success/5 border-success/20">
              <CardContent className="p-8">
                <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center mb-6">
                  <span className="text-2xl">🚀</span>
                </div>
                <h3 className="text-2xl font-semibold mb-4 text-success">Our Solution</h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-success text-sm">✓</span>
                    </div>
                    <span className="text-muted-foreground">Unified dashboard showing all positions across both chains</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-success text-sm">✓</span>
                    </div>
                    <span className="text-muted-foreground">AI agents that automatically detect and execute opportunities</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-success text-sm">✓</span>
                    </div>
                    <span className="text-muted-foreground">Seamless x402 integration for instant cross-chain transfers</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-success text-sm">✓</span>
                    </div>
                    <span className="text-muted-foreground">Real-time analytics with profit/loss tracking and APY estimates</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
        <div className="container relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Core Features</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need to manage your cross-chain DeFi portfolio with intelligence and ease.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <Card className="bg-card/50 border-border/50 card-hover">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-4">
                  <Bot className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">AI Strategy Engine</h3>
                <p className="text-muted-foreground">
                  Intelligent agents monitor markets 24/7 and execute optimized strategies automatically based on your parameters.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-card/50 border-border/50 card-hover">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center mb-4">
                  <Globe className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Cross-Chain Bridge</h3>
                <p className="text-muted-foreground">
                  Seamlessly move assets between Crypto.com mainnet and Cronos using the x402 settlement rail.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-card/50 border-border/50 card-hover">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center mb-4">
                  <BarChart3 className="w-6 h-6 text-success" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Real-Time Analytics</h3>
                <p className="text-muted-foreground">
                  Track your portfolio value, positions, and performance with live data from the Crypto.com MCP Server.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-card/50 border-border/50 card-hover">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl bg-warning/20 flex items-center justify-center mb-4">
                  <RefreshCw className="w-6 h-6 text-warning" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Auto-Rebalancing</h3>
                <p className="text-muted-foreground">
                  Maintain your target allocations with intelligent rebalancing that minimizes gas costs and slippage.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-card/50 border-border/50 card-hover">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-4">
                  <Layers className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">VVS Finance Integration</h3>
                <p className="text-muted-foreground">
                  Direct integration with VVS Finance for swaps, liquidity provision, and yield farming on Cronos.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-card/50 border-border/50 card-hover">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Security First</h3>
                <p className="text-muted-foreground">
                  Non-custodial design with signature verification and emergency withdrawal mechanisms.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 relative">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our system architecture enables seamless cross-chain operations powered by AI.
            </p>
          </div>
          
          {/* Architecture Diagram */}
          <div className="max-w-5xl mx-auto mb-16">
            <div className="gradient-border rounded-2xl overflow-hidden">
              <div className="bg-card p-8">
                <div className="grid grid-cols-5 gap-4 items-center">
                  {/* User */}
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/20 flex items-center justify-center mb-3">
                      <span className="text-3xl">👤</span>
                    </div>
                    <div className="font-medium">User</div>
                    <div className="text-xs text-muted-foreground">Wallet Connected</div>
                  </div>
                  
                  <div className="flex items-center justify-center">
                    <ChevronRight className="w-8 h-8 text-primary" />
                  </div>
                  
                  {/* Frontend + AI Engine */}
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-accent/20 flex items-center justify-center mb-3">
                      <Bot className="w-8 h-8 text-accent" />
                    </div>
                    <div className="font-medium">AI Engine</div>
                    <div className="text-xs text-muted-foreground">+ MCP Server</div>
                  </div>
                  
                  <div className="flex items-center justify-center">
                    <ChevronRight className="w-8 h-8 text-primary" />
                  </div>
                  
                  {/* Cronos Contracts */}
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-success/20 flex items-center justify-center mb-3">
                      <Layers className="w-8 h-8 text-success" />
                    </div>
                    <div className="font-medium">Cronos EVM</div>
                    <div className="text-xs text-muted-foreground">via x402 → VVS</div>
                  </div>
                </div>
                
                {/* Data Flow Description */}
                <div className="mt-8 pt-8 border-t border-border">
                  <div className="grid md:grid-cols-4 gap-6 text-sm">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <span className="font-bold text-primary">1</span>
                      </div>
                      <div>
                        <div className="font-medium mb-1">Connect & Configure</div>
                        <div className="text-muted-foreground">User connects wallet and sets strategy parameters</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <span className="font-bold text-primary">2</span>
                      </div>
                      <div>
                        <div className="font-medium mb-1">AI Analysis</div>
                        <div className="text-muted-foreground">Engine fetches market data via MCP and analyzes opportunities</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <span className="font-bold text-primary">3</span>
                      </div>
                      <div>
                        <div className="font-medium mb-1">Cross-Chain Execution</div>
                        <div className="text-muted-foreground">Assets bridged via x402 to Cronos for DeFi operations</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <span className="font-bold text-primary">4</span>
                      </div>
                      <div>
                        <div className="font-medium mb-1">DeFi Actions</div>
                        <div className="text-muted-foreground">Smart contracts execute swaps and liquidity on VVS Finance</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Steps */}
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4">
                <Lock className="w-8 h-8 text-background" />
              </div>
              <h3 className="text-xl font-semibold mb-2">1. Connect Wallet</h3>
              <p className="text-muted-foreground">
                Link your MetaMask, Crypto.com DeFi Wallet, or use WalletConnect to get started.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4">
                <Workflow className="w-8 h-8 text-background" />
              </div>
              <h3 className="text-xl font-semibold mb-2">2. Configure Strategy</h3>
              <p className="text-muted-foreground">
                Choose from pre-built strategies or customize parameters to match your risk profile.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4">
                <TrendingUp className="w-8 h-8 text-background" />
              </div>
              <h3 className="text-xl font-semibold mb-2">3. Watch It Grow</h3>
              <p className="text-muted-foreground">
                Our AI agents work 24/7 to optimize your positions and maximize returns.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Technology / Hackathon Alignment Section */}
      <section id="technology" className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/5 to-transparent" />
        <div className="container relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-4">
              <span className="text-sm text-accent">Hackathon Track Alignment</span>
            </div>
            <h2 className="text-4xl font-bold mb-4">Built on Crypto.com Technology</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              LiquidAI leverages the full stack of Crypto.com developer tools to deliver a seamless cross-chain experience.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            <Card className="gradient-border overflow-hidden">
              <CardContent className="p-6 bg-card">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <BarChart3 className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Crypto.com MCP Server</h3>
                    <p className="text-muted-foreground mb-3">
                      Real-time market data integration for price feeds, pool analytics, and portfolio tracking across the Crypto.com ecosystem.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-1 rounded-md bg-primary/10 text-primary text-xs">Price Feeds</span>
                      <span className="px-2 py-1 rounded-md bg-primary/10 text-primary text-xs">Pool Data</span>
                      <span className="px-2 py-1 rounded-md bg-primary/10 text-primary text-xs">Real-time Updates</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="gradient-border overflow-hidden">
              <CardContent className="p-6 bg-card">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-accent/20 flex items-center justify-center flex-shrink-0">
                    <Globe className="w-7 h-7 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">x402 Settlement Rail</h3>
                    <p className="text-muted-foreground mb-3">
                      Secure and efficient cross-chain asset bridging between Crypto.com mainnet and Cronos EVM for seamless liquidity movement.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-1 rounded-md bg-accent/10 text-accent text-xs">Cross-Chain</span>
                      <span className="px-2 py-1 rounded-md bg-accent/10 text-accent text-xs">Fast Settlement</span>
                      <span className="px-2 py-1 rounded-md bg-accent/10 text-accent text-xs">Low Fees</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="gradient-border overflow-hidden">
              <CardContent className="p-6 bg-card">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-success/20 flex items-center justify-center flex-shrink-0">
                    <Layers className="w-7 h-7 text-success" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Cronos EVM</h3>
                    <p className="text-muted-foreground mb-3">
                      Smart contract deployment on Cronos for strategy execution, integrating with VVS Finance for swaps and liquidity operations.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-1 rounded-md bg-success/10 text-success text-xs">Smart Contracts</span>
                      <span className="px-2 py-1 rounded-md bg-success/10 text-success text-xs">VVS Finance</span>
                      <span className="px-2 py-1 rounded-md bg-success/10 text-success text-xs">EVM Compatible</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="gradient-border overflow-hidden">
              <CardContent className="p-6 bg-card">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-warning/20 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-7 h-7 text-warning" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">AI Agent SDK</h3>
                    <p className="text-muted-foreground mb-3">
                      Autonomous agents powered by Crypto.com AI Agent SDK that monitor conditions, analyze opportunities, and execute strategies.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-1 rounded-md bg-warning/10 text-warning text-xs">Autonomous</span>
                      <span className="px-2 py-1 rounded-md bg-warning/10 text-warning text-xs">24/7 Monitoring</span>
                      <span className="px-2 py-1 rounded-md bg-warning/10 text-warning text-xs">Smart Decisions</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center">
            <div className="gradient-border rounded-3xl overflow-hidden glow">
              <div className="bg-card p-12">
                <h2 className="text-4xl font-bold mb-4">Ready to Optimize Your DeFi?</h2>
                <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                  Join the future of cross-chain liquidity management. Connect your wallet and let AI work for you.
                </p>
                {isAuthenticated ? (
                  <Link href="/dashboard">
                    <Button size="lg" className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity text-lg px-8 py-6">
                      Go to Dashboard
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                ) : (
                  <a href={getLoginUrl()}>
                    <Button size="lg" className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity text-lg px-8 py-6">
                      Get Started Now
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="container">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Zap className="w-5 h-5 text-background" />
                </div>
                <span className="text-xl font-bold">LiquidAI</span>
              </div>
              <p className="text-sm text-muted-foreground">
                AI-powered cross-chain liquidity management for the Crypto.com ecosystem.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a></li>
                <li><a href="#technology" className="hover:text-foreground transition-colors">Technology</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="https://crypto.com/developers" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors flex items-center gap-1">
                    Documentation <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
                <li>
                  <a href="https://cronos.org" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors flex items-center gap-1">
                    Cronos Chain <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
                <li>
                  <a href="https://vvs.finance" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors flex items-center gap-1">
                    VVS Finance <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Connect</h4>
              <div className="flex items-center gap-3">
                <a href="#" className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors">
                  <Github className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors">
                  <MessageCircle className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © 2024 LiquidAI. Built for the Crypto.com Hackathon.
            </p>
            <p className="text-sm text-muted-foreground">
              Powered by Crypto.com MCP Server, x402, Cronos EVM & AI Agent SDK
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
