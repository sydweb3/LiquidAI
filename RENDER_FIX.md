# Render Deployment Fix

## Problem
The `better-sqlite3` native module cannot be built on Render. 

## Solution Options

### Option 1: Use Pre-built SQLite (Quick Fix)

Add to your `render.yaml`:

```yaml
services:
  - type: web
    name: liquidai
    env: node
    buildCommand: |
      pnpm install
      # Skip better-sqlite3 build, use pre-built binary
      export BETTER_SQLITE3_FORCE_BUILD=0
      pnpm build
    startCommand: pnpm start
```

And add `.npmrc` file:

```
better-sqlite3:force-build=false
```

### Option 2: Switch to PostgreSQL (Recommended for Production)

Files already created for you:
- `drizzle/schema.pg.ts` - PostgreSQL schema
- `render.yaml` - Render configuration
- `DEPLOY_RENDER.md` - Deployment guide

**Steps:**

1. **Update imports in server files:**
   ```bash
   # Already done in latest commit
   ```

2. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Switch to PostgreSQL for Render deployment"
   git push origin main
   ```

3. **Deploy on Render:**
   - Go to https://render.com
   - New → Blueprint
   - Connect your GitHub repo
   - Apply

4. **Run migrations:**
   In Render dashboard → Shell:
   ```bash
   pnpm db:push
   ```

## Quick Test Locally

To test PostgreSQL locally before deploying:

1. Install PostgreSQL locally or use Docker:
   ```bash
   docker run -d --name postgres \
     -e POSTGRES_PASSWORD=postgres \
     -p 5432:5432 \
     postgres:15
   ```

2. Set environment:
   ```bash
   export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres
   ```

3. Run migrations:
   ```bash
   pnpm db:push
   ```

4. Start server:
   ```bash
   pnpm dev
   ```

## Alternative: Use Supabase (Free PostgreSQL)

1. Create account at https://supabase.com
2. Create new project
3. Get connection string
4. Set in Render: `DATABASE_URL=postgresql://...`
5. Deploy!

---

**For immediate deployment, use Option 1 (SQLite with pre-built binary).**
**For production, use Option 2 (PostgreSQL via Render or Supabase).**
