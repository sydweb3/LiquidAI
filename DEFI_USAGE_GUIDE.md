# LiquidAI DeFi Strategies - Usage Guide

## Quick Start

### 1. Configure Your Wallet (Required for Execution)

Add your private key to `.env.development`:

```bash
# Wallet Configuration
WALLET_PRIVATE_KEY=your_private_key_here
CRONOS_RPC_URL=https://evm.cronos.org
```

⚠️ **Security Warning**: Never commit your private key to git. This is for development only.

### 2. Start the Server

```bash
pnpm dev
```

The server will start at `http://localhost:3000` with all DeFi engines running.

---

## Using the Strategies

### Via API (tRPC)

#### Get Token Prices
```typescript
const prices = await trpc.defi.getPrices.query({
  tokens: ['CRO', 'USDC', 'ETH']
});
```

#### View Arbitrage Opportunities
```typescript
const opportunities = await trpc.defi.getArbitrageOpportunities.query();
// Returns: Array of arbitrage opportunities with profit %, buy/sell DEX, etc.
```

#### Get Yield Opportunities
```typescript
const yieldOpps = await trpc.defi.getYieldOpportunities.query({
  token: 'USDC',
  limit: 10
});
// Returns: Best yield farms sorted by risk-adjusted APY
```

#### Check Engine Status
```typescript
const status = await trpc.defi.getEngineStatus.query();
// Returns: Status of all 4 engines (Arbitrage, Liquidity, Yield, Rebalancing)
```

---

### Via UI (Strategies Page)

1. **Navigate to Strategies** (`/strategies`)

2. **Create a Strategy**:
   - Click "New Strategy"
   - Select strategy type:
     - **Arbitrage** - Auto-detects price differences
     - **Liquidity Provision** - Provides LP to DEXes
     - **Yield Farming** - Farms highest yield
     - **Rebalancing** - Maintains portfolio allocation

3. **Configure Parameters**:
   - Profit threshold (for arbitrage)
   - Price range (for liquidity)
   - Target allocation (for rebalancing)
   - Initial deposit amount

4. **Monitor & Execute**:
   - View real-time opportunities
   - Click "Execute" to run strategies
   - Track profits and performance

---

## Strategy Details

### 1. Cross-Chain Arbitrage

**What it does**: Finds price differences between DEXes and executes profitable trades.

**Supported DEXes**: VVS Finance, MM Finance, CronaSwap

**Configuration**:
```typescript
{
  minProfitPercent: 0.5,  // Minimum 0.5% profit
  maxSlippage: 0.3,       // Max 0.3% slippage
  checkInterval: 30000,   // Scan every 30 seconds
  maxTradeSizeUSD: 10000  // Max $10k per trade
}
```

**Tracked Pairs**: CRO/USDC, CRO/USDT, ETH/USDC, WBTC/USDC, VVS/CRO

---

### 2. Smart Liquidity Provision

**What it does**: Provides concentrated liquidity with auto-rebalancing.

**Features**:
- Auto-rebalance when price moves ±20% from center
- Fee harvesting when >$50 accumulated
- Impermanent loss protection (stops if IL > 5%)

**Configuration**:
```typescript
{
  rebalanceThreshold: 0.1,     // Rebalance at 10% price move
  autoCompound: true,          // Auto-compound fees
  compoundInterval: 86400000,  // Compound daily
  maxImpermanentLoss: 0.05    // Stop if IL > 5%
}
```

**Supported Pairs**: CRO/USDC, CRO/USDT, ETH/CRO, WBTC/CRO, VVS/CRO

---

### 3. Yield Optimization

**What it does**: Finds and manages optimal yield farming opportunities.

**Data Sources**: DefiLlama, Beefy Finance, Tectonic

**Risk Assessment**:
- TVL-based risk scoring
- APY sustainability analysis
- Protocol audit status

**Configuration**:
```typescript
{
  minAPY: 5,                    // Minimum 5% APY
  healthFactorThreshold: 1.5,  // Maintain HF > 1.5
  diversification: {
    maxPerProtocol: 0.5,       // Max 50% in one protocol
    maxPerAsset: 0.3           // Max 30% in one asset
  }
}
```

---

### 4. Portfolio Rebalancing

**What it does**: Maintains target asset allocations.

**Triggers**:
- Time-based (hourly checks)
- Threshold-based (5% deviation)
- Gas-optimized batching

**Configuration**:
```typescript
{
  threshold: 0.05,           // Rebalance at 5% deviation
  checkInterval: 3600000,    // Check hourly
  slippageTolerance: 0.3     // Max 0.3% slippage
}
```

---

## Monitoring

### View Execution History
```typescript
const history = await trpc.defi.getExecutionHistory.query({
  strategyId: 1
});
```

### Get Portfolio Stats
```typescript
const stats = await trpc.defi.getYieldPortfolio.query();
// Returns: totalValueUSD, totalEarnings, avgAPY, positionCount
```

### Check Rebalancing Plans
```typescript
const plans = await trpc.defi.getRebalancePlans.query();
// Returns: Pending rebalance actions with trade details
```

---

## Example: Full Workflow

```typescript
// 1. Check arbitrage opportunities
const opportunities = await trpc.defi.getArbitrageOpportunities.query();
console.log('Found', opportunities.length, 'opportunities');

// 2. Get best yield for USDC
const yields = await trpc.defi.getYieldOpportunities.query({ 
  token: 'USDC', 
  limit: 5 
});
console.log('Best APY:', yields[0]?.apy);

// 3. Create a strategy (via UI or API)
await trpc.strategies.create.mutate({
  name: 'CRO Arbitrage Bot',
  type: 'arbitrage',
  parameters: {
    threshold: 0.5,
    frequency: '5min',
    maxSlippage: 0.3
  }
});

// 4. Monitor execution
const status = await trpc.defi.getEngineStatus.query();
console.log('Engines:', status);
```

---

## Troubleshooting

### "Private key not configured"
Add `WALLET_PRIVATE_KEY` to `.env.development`

### "No opportunities found"
- Increase scan frequency
- Lower `minProfitPercent` threshold
- Check DEX liquidity

### "Transaction failed"
- Check gas balance (need CRO for gas)
- Verify token approvals
- Reduce trade size

### "RPC connection failed"
- Check `CRONOS_RPC_URL` in `.env`
- Try alternative RPC: `https://cronos-evm.publicnode.com`

---

## Security Notes

1. **Never share your private key**
2. **Start with small amounts** for testing
3. **Monitor positions regularly**
4. **Set conservative thresholds** initially
5. **Use a dedicated wallet** for DeFi strategies

---

## Support

For issues or questions:
1. Check server logs: `pnpm dev` output
2. Review execution history via API
3. Verify network connectivity: `trpc.defi.getEngineStatus`
