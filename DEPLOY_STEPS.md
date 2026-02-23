# Render Deployment - Step by Step

## ✅ After Pushing to GitHub

### Step 1: Connect to Render

1. Go to https://render.com
2. Sign in / Create account
3. Click **"New +"** → **"Blueprint"**
4. Connect your GitHub account
5. Select your **liquidai** repository
6. Click **"Apply"**

### Step 2: Wait for Deployment

Render will:
- ✅ Create PostgreSQL database
- ✅ Build your Node.js app  
- ⏳ Deploy the web service

This takes 3-5 minutes.

### Step 3: Run Database Migrations

**IMPORTANT:** First deployment will fail because tables don't exist yet.

1. In Render dashboard, click your service
2. Go to **"Shell"** tab
3. Run:
   ```bash
   pnpm db:push
   ```
4. Wait for "migrations applied successfully"

### Step 4: Restart Service

1. Go to **"Logs"** tab
2. Click **"Restart"**
3. Wait for service to start

### Step 5: Test Your App

1. Copy the URL from top (e.g., `https://liquidai-xxxx.onrender.com`)
2. Open in browser
3. You should see the login page!

---

## 🐛 Troubleshooting

### Error: "Authentication setup failed"

**Cause:** Database tables don't exist

**Fix:**
```bash
# In Render Shell
pnpm db:push
```

### Error: "bad address checksum"

**Cause:** DEX contract addresses are for Cronos chain, but you're not on mainnet

**Fix:** This is a warning, not critical. The app will still work.
To fix properly, update addresses in `server/_core/defi/config.ts`

### Error: "Cannot find module 'postgres'"

**Cause:** Dependencies not installed

**Fix:**
```bash
# In Render Shell
pnpm install
```

### Build Fails

**Check logs for:**
- Missing dependencies → Add to `package.json`
- TypeScript errors → Run `pnpm check` locally first
- Node version → Add `engines` to `package.json`:
  ```json
  "engines": {
    "node": ">=18.0.0"
  }
  ```

---

## 📊 Environment Variables

Render auto-sets these from `render.yaml`:
- `DATABASE_URL` ✅
- `NODE_ENV` ✅

Add these manually in Render dashboard → **Environment**:
- `JWT_SECRET` = (any random string, e.g., `my-super-secret-key-123`)
- `VITE_APP_ID` = `liquidai_app`
- `OWNER_OPEN_ID` = `dev_user_123`

---

## 🎉 Success!

When working, you'll see:
- ✅ Login page loads
- ✅ $10,000 test balance appears
- ✅ Can create strategies
- ✅ Rewards distribute every 5 minutes

---

## 💰 Free Tier Limits

- **Web Service:** 750 hours/month (enough for 1 service)
- **Database:** 90 days free, then $7/month
- **Bandwidth:** 100GB/month

**To keep database free:**
Use Supabase instead (see `DEPLOY_RENDER.md`)
