# Deploying LiquidAI to Render

## Prerequisites
- GitHub account
- Render account (free at https://render.com)
- Your LiquidAI code pushed to GitHub

## Step-by-Step Deployment

### 1. Push Code to GitHub
```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

### 2. Connect to Render

1. Go to https://render.com and sign in
2. Click **"New +"** → **"Blueprint"**
3. Connect your GitHub account
4. Select your `liquidai` repository
5. Render will detect the `render.yaml` file

### 3. Configure Environment Variables

Render will auto-set `DATABASE_URL` from the database. Add these:

```
NODE_ENV=production
VITE_APP_ID=liquidai_app
JWT_SECRET=<generate-a-secure-random-string>
OWNER_OPEN_ID=dev_user_123
```

### 4. Deploy

1. Click **"Apply"**
2. Render will:
   - Create a PostgreSQL database
   - Build your Node.js app
   - Run database migrations
   - Start the web service

### 5. Access Your App

Once deployed, your app will be available at:
```
https://liquidai-<random-id>.onrender.com
```

## Troubleshooting

### Database Migration Errors
```bash
# In Render dashboard → Logs
# Check for migration errors
# If needed, manually run:
pnpm db:push
```

### Build Failures
- Check "Logs" tab for errors
- Ensure all dependencies are in `package.json`
- Verify Node.js version compatibility

### App Not Loading
- Check environment variables are set
- Verify DATABASE_URL is configured
- Check server logs for startup errors

## Cost

**Free Tier Includes:**
- 750 hours/month of web service (enough for 1 service)
- PostgreSQL database (90 days free, then $7/month)
- 100GB bandwidth/month

**To keep database free after 90 days:**
- Upgrade to paid plan, OR
- Use external PostgreSQL (e.g., Supabase free tier)

## Alternative: Use Supabase for Free Database

1. Create free account at https://supabase.com
2. Create new project
3. Get connection string from Settings → Database
4. In Render, set `DATABASE_URL` to Supabase URL
5. Run migrations: `pnpm db:push`

## Support

For issues:
1. Check Render logs (Dashboard → Logs)
2. Check database connection
3. Verify all environment variables
4. Review deployment documentation
