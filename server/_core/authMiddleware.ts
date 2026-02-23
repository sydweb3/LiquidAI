import type { Request, Response, NextFunction } from "express";
import * as db from "../db";

/**
 * Development-only middleware - no authentication required
 */
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const devOpenId = "dev_user_123";
  const devName = "Developer";
  const devEmail = "developer@example.com";

  // Create or update dev user in database
  try {
    await db.upsertUser({
      openId: devOpenId,
      name: devName,
      email: devEmail,
      loginMethod: "development",
      lastSignedIn: new Date(),
    });

    // Fetch the full user record with ID
    const user = await db.getUserByOpenId(devOpenId);
    
    if (!user) {
      throw new Error("Failed to fetch user after upsert");
    }

    // Attach full user to request
    (req as any).user = user;

    next();
  } catch (error) {
    console.error("Failed to create dev user:", error);
    next(new Error("Authentication setup failed"));
  }
}