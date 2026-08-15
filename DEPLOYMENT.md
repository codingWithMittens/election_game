# Deployment Guide

This guide explains how to deploy the Electoral Strategy game to Render.

## Quick Deploy to Render

### Option 1: One-Click Deploy (Recommended)

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New" → "Blueprint"
3. Connect your GitHub repository: `https://github.com/codingWithMittens/election_game`
4. Render will automatically detect `render.yaml` and set up:
   - PostgreSQL database
   - Backend API server
   - Frontend static site
5. Click "Apply" and wait for deployment (5-10 minutes)

### Option 2: Manual Setup

#### 1. Create PostgreSQL Database
1. Go to Render Dashboard → "New" → "PostgreSQL"
2. Name: `election-game-db`
3. Database: `electoral_strategy`
4. Plan: Free
5. Click "Create Database"
6. Copy the "Internal Database URL" (starts with `postgresql://`)

#### 2. Deploy Backend
1. Go to Render Dashboard → "New" → "Web Service"
2. Connect GitHub repo: `election_game`
3. Settings:
   - **Name**: `election-game-backend`
   - **Root Directory**: `backend`
   - **Environment**: Node
   - **Region**: Oregon (or closest to you)
   - **Branch**: `main`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free
4. Environment Variables:
   - `DATABASE_URL`: [paste Internal Database URL from step 1]
   - `NODE_ENV`: `production`
   - `PORT`: `3000`
   - `CORS_ORIGIN`: `https://election-game-frontend.onrender.com` (update after frontend deploy)
5. Click "Create Web Service"
6. Copy the service URL (e.g., `https://election-game-backend.onrender.com`)

#### 3. Deploy Frontend
1. Go to Render Dashboard → "New" → "Static Site"
2. Connect GitHub repo: `election_game`
3. Settings:
   - **Name**: `election-game-frontend`
   - **Root Directory**: `frontend`
   - **Branch**: `main`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. Environment Variables:
   - `VITE_API_URL`: `https://election-game-backend.onrender.com` (from step 2)
   - `VITE_SOCKET_URL`: `https://election-game-backend.onrender.com` (from step 2)
5. Click "Create Static Site"

#### 4. Update Backend CORS
1. Go to backend service settings
2. Update `CORS_ORIGIN` environment variable with your frontend URL
3. Save and redeploy

## Verification

After deployment:

1. Visit your frontend URL (e.g., `https://election-game-frontend.onrender.com`)
2. Click "Create Game" - should work without errors
3. Open another browser/incognito window
4. Join the game using the code
5. Test gameplay

## Troubleshooting

### Database Connection Issues
- Check that `DATABASE_URL` in backend matches the Internal Database URL
- Ensure database is in "Available" status

### CORS Errors
- Verify `CORS_ORIGIN` in backend matches your frontend URL exactly
- Include `https://` protocol

### WebSocket Connection Failed
- Check that `VITE_SOCKET_URL` points to your backend URL
- Ensure backend is deployed and healthy (check `/api/health`)

### Build Failures
- Check build logs in Render dashboard
- Verify all dependencies are in `package.json`
- Check Node version compatibility

## Free Tier Limitations

Render free tier includes:
- ✅ 750 hours/month of backend runtime
- ✅ Unlimited static site bandwidth
- ✅ 1GB PostgreSQL storage
- ⚠️ Services spin down after 15 minutes of inactivity
- ⚠️ First request after spindown takes ~30 seconds

### Note on Spindown
The free tier backend spins down when inactive. The first visitor after spindown will experience a ~30 second delay. Consider upgrading to paid tier ($7/month) for 24/7 availability if needed.

## Custom Domain (Optional)

To use a custom domain:

1. Go to your static site settings
2. Click "Custom Domain"
3. Add your domain (e.g., `electoral-strategy.com`)
4. Follow DNS configuration instructions
5. Update backend `CORS_ORIGIN` to match your custom domain

## Updating the App

To deploy updates:

```bash
git add .
git commit -m "Your update message"
git push origin main
```

Render automatically detects the push and redeploys both services.

## Monitoring

- **Backend Health**: `https://your-backend.onrender.com/api/health`
- **Logs**: View in Render Dashboard → Service → Logs
- **Metrics**: Render Dashboard shows CPU, memory, and request metrics

## Support

- Render Docs: https://render.com/docs
- Render Community: https://community.render.com/
- GitHub Issues: https://github.com/codingWithMittens/election_game/issues
