# 🚀 GETTING STARTED - Quick Setup Guide

## What You Have Now

A complete starter codebase for Electoral Strategy web game with:
- ✅ Backend structure (Node.js + Express + Socket.io)
- ✅ Frontend structure (React + TypeScript + Vite)
- ✅ Database schema (PostgreSQL)
- ✅ Game data (Cards and States JSON)
- ✅ Complete README with instructions

## Next Steps (15 minutes)

### Step 1: Install Dependencies (5 min)

```bash
cd ~/Workspace/election_game

# Backend
cd backend
npm install

# Frontend  
cd ../frontend
npm create vite@latest . -- --template react-ts
npm install socket.io-client axios zustand react-router-dom
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### Step 2: Set up Database (5 min)

**Option A - Supabase (Easiest):**
1. Go to https://supabase.com
2. Create free account + new project
3. Go to Settings → Database → Connection string
4. Copy it

**Option B - Local PostgreSQL:**
```bash
createdb electoral_strategy
```

### Step 3: Configure Environment (2 min)

```bash
# Backend
cd ~/Workspace/election_game/backend
cp .env.example .env

# Edit .env - paste your database URL
nano .env  # or use any editor
```

### Step 4: Create Database Tables (1 min)

Copy the schema from the technical spec or run:
```bash
cd ~/Workspace/election_game/backend
npm run db:setup  # (when schema.sql is created)
```

### Step 5: Start Everything (2 min)

```bash
# Terminal 1 - Backend
cd ~/Workspace/election_game/backend
npm run dev

# Terminal 2 - Frontend
cd ~/Workspace/election_game/frontend  
npm run dev
```

Open: http://localhost:5173

## What to Build First

Week 1-2 focus (see Implementation Roadmap):
1. ✅ Project setup (done!)
2. Game creation endpoint
3. Game joining endpoint
4. WebSocket connection
5. Lobby UI

All starter code is in the Technical Spec document!

## Important Files

Created for you:
- ✅ `backend/package.json` - Dependencies
- ✅ `backend/tsconfig.json` - TypeScript config
- ✅ `backend/.env.example` - Environment template
- ✅ `backend/src/server.ts` - Main server
- ✅ `backend/src/db/connection.ts` - Database connection
- ✅ `backend/src/data/` - Game data (cards & states)
- ✅ `README.md` - Complete documentation
- ✅ `setup.sh` - Setup script

Need to create (follow roadmap):
- `backend/src/db/schema.sql` - Database tables
- `backend/src/routes/games.ts` - API endpoints
- `backend/src/socket/handlers.ts` - WebSocket handlers
- `backend/src/lib/gameCode.ts` - Game code generator
- `frontend/src/pages/*.tsx` - React pages
- `frontend/src/lib/api.ts` - API client

## Copy/Paste Ready Code

All the code you need is in:
- `~/Electoral_Strategy_Web_Implementation_Roadmap.md`

It has complete, working code for:
- Database schema
- API endpoints
- React components
- WebSocket handlers

Just copy sections from the roadmap as you build!

## Stuck?

1. Read: `README.md` (comprehensive guide)
2. Reference: `Electoral_Strategy_Web_Game_Technical_Spec.md` (complete architecture)
3. Follow: `Electoral_Strategy_Web_Implementation_Roadmap.md` (week-by-week plan)

## Your Next 30 Minutes

1. Install dependencies (above)
2. Set up database (above)
3. Copy schema from technical spec to `backend/src/db/schema.sql`
4. Run `npm run db:setup`
5. Copy game creation code from roadmap to `backend/src/routes/games.ts`
6. Test: `curl http://localhost:3000/health`

Then you'll have a working backend!

---

**You've got this! Build something awesome! 🎮**
