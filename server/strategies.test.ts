import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-123",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

function createPublicContext(): { ctx: TrpcContext } {
  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("strategies.getTemplates", () => {
  it("returns strategy templates for public users", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const templates = await caller.strategies.getTemplates();

    expect(templates).toBeDefined();
    expect(Array.isArray(templates)).toBe(true);
    expect(templates.length).toBe(4);
    
    // Check first template structure
    const arbitrageTemplate = templates.find(t => t.id === "arbitrage");
    expect(arbitrageTemplate).toBeDefined();
    expect(arbitrageTemplate?.name).toBe("Cross-Chain Arbitrage");
    expect(arbitrageTemplate?.riskLevel).toBe("medium");
    expect(arbitrageTemplate?.supportedTokens).toContain("CRO");
  });

  it("includes all required strategy types", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const templates = await caller.strategies.getTemplates();
    const templateIds = templates.map(t => t.id);

    expect(templateIds).toContain("arbitrage");
    expect(templateIds).toContain("liquidity_provision");
    expect(templateIds).toContain("yield_farming");
    expect(templateIds).toContain("rebalancing");
  });
});

describe("market.getPrices", () => {
  it("returns market prices for public users", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const prices = await caller.market.getPrices();

    expect(prices).toBeDefined();
    expect(prices.CRO).toBeDefined();
    expect(prices.CRO.price).toBeGreaterThan(0);
    expect(typeof prices.CRO.change24h).toBe("number");
    
    // Check other tokens
    expect(prices.USDC).toBeDefined();
    expect(prices.ETH).toBeDefined();
    expect(prices.BTC).toBeDefined();
  });
});

describe("market.getPoolData", () => {
  it("returns VVS Finance pool data", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const pools = await caller.market.getPoolData();

    expect(pools).toBeDefined();
    expect(Array.isArray(pools)).toBe(true);
    expect(pools.length).toBeGreaterThan(0);
    
    // Check pool structure
    const firstPool = pools[0];
    expect(firstPool.pair).toBeDefined();
    expect(firstPool.tvl).toBeGreaterThan(0);
    expect(firstPool.apr).toBeGreaterThan(0);
    expect(firstPool.volume24h).toBeGreaterThan(0);
  });
});

describe("auth.me", () => {
  it("returns user data for authenticated users", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const user = await caller.auth.me();

    expect(user).toBeDefined();
    expect(user?.id).toBe(1);
    expect(user?.email).toBe("test@example.com");
    expect(user?.name).toBe("Test User");
  });

  it("returns null for unauthenticated users", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const user = await caller.auth.me();

    expect(user).toBeNull();
  });
});
