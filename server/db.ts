import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, 
  strategies, InsertStrategy, Strategy,
  positions, InsertPosition, Position,
  activityLogs, InsertActivityLog, ActivityLog
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============ User Queries ============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserWallets(userId: number, evmAddress: string, cronosAddress?: string) {
  const db = await getDb();
  if (!db) return;

  await db.update(users)
    .set({ 
      evmAddress, 
      cronosAddress: cronosAddress || evmAddress,
      updatedAt: new Date()
    })
    .where(eq(users.id, userId));
}

// ============ Strategy Queries ============

export async function getUserStrategies(userId: number): Promise<Strategy[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select()
    .from(strategies)
    .where(eq(strategies.userId, userId))
    .orderBy(desc(strategies.createdAt));
}

export async function getStrategyById(strategyId: number, userId: number): Promise<Strategy | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select()
    .from(strategies)
    .where(and(eq(strategies.id, strategyId), eq(strategies.userId, userId)))
    .limit(1);
  
  return result[0];
}

export async function createStrategy(strategy: InsertStrategy): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(strategies).values(strategy);
  return result[0].insertId;
}

export async function updateStrategy(
  strategyId: number, 
  userId: number, 
  updates: Partial<InsertStrategy>
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(strategies)
    .set({ ...updates, updatedAt: new Date() })
    .where(and(eq(strategies.id, strategyId), eq(strategies.userId, userId)));
}

export async function updateStrategyStatus(
  strategyId: number, 
  userId: number, 
  status: "active" | "paused" | "stopped"
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(strategies)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(strategies.id, strategyId), eq(strategies.userId, userId)));
}

// ============ Position Queries ============

export async function getUserPositions(userId: number): Promise<Position[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select()
    .from(positions)
    .where(eq(positions.userId, userId))
    .orderBy(desc(positions.valueUsd));
}

export async function getPositionsByChain(userId: number, chain: "crypto_com" | "cronos"): Promise<Position[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select()
    .from(positions)
    .where(and(eq(positions.userId, userId), eq(positions.chain, chain)));
}

export async function upsertPosition(position: InsertPosition): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.insert(positions).values(position).onDuplicateKeyUpdate({
    set: {
      balance: position.balance,
      valueUsd: position.valueUsd,
      updatedAt: new Date()
    }
  });
}

// ============ Activity Log Queries ============

export async function getUserActivityLogs(
  userId: number, 
  limit: number = 50,
  offset: number = 0
): Promise<ActivityLog[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select()
    .from(activityLogs)
    .where(eq(activityLogs.userId, userId))
    .orderBy(desc(activityLogs.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getStrategyActivityLogs(
  strategyId: number,
  limit: number = 20
): Promise<ActivityLog[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select()
    .from(activityLogs)
    .where(eq(activityLogs.strategyId, strategyId))
    .orderBy(desc(activityLogs.createdAt))
    .limit(limit);
}

export async function createActivityLog(log: InsertActivityLog): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(activityLogs).values(log);
  return result[0].insertId;
}

export async function updateActivityLogStatus(
  logId: number,
  status: "pending" | "confirmed" | "failed",
  txHash?: string
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const updates: Record<string, unknown> = { status };
  if (txHash) updates.txHash = txHash;

  await db.update(activityLogs)
    .set(updates)
    .where(eq(activityLogs.id, logId));
}

// ============ Dashboard Aggregation ============

export async function getDashboardData(userId: number) {
  const [userPositions, userStrategies, recentActivity] = await Promise.all([
    getUserPositions(userId),
    getUserStrategies(userId),
    getUserActivityLogs(userId, 10)
  ]);

  // Calculate totals
  const totalValueUsd = userPositions.reduce((sum, p) => sum + parseFloat(p.valueUsd || "0"), 0);
  const cronosValue = userPositions
    .filter(p => p.chain === "cronos")
    .reduce((sum, p) => sum + parseFloat(p.valueUsd || "0"), 0);
  const cryptoComValue = userPositions
    .filter(p => p.chain === "crypto_com")
    .reduce((sum, p) => sum + parseFloat(p.valueUsd || "0"), 0);

  const activeStrategies = userStrategies.filter(s => s.status === "active").length;
  const totalProfit = userStrategies.reduce((sum, s) => sum + parseFloat(s.totalProfit || "0"), 0);
  const avgApy = userStrategies.length > 0
    ? userStrategies.reduce((sum, s) => sum + parseFloat(s.estimatedApy || "0"), 0) / userStrategies.length
    : 0;

  return {
    portfolio: {
      totalValueUsd,
      cronosValue,
      cryptoComValue,
      positions: userPositions
    },
    strategies: {
      total: userStrategies.length,
      active: activeStrategies,
      totalProfit,
      avgApy,
      list: userStrategies
    },
    recentActivity
  };
}
