import type { Express, Request, Response } from "express";

/**
 * OAuth callback - simplified for development (no-op)
 */
export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", async (_req: Request, res: Response) => {
    // Development mode - no OAuth needed
    res.redirect(302, "/");
  });
}
