# Electoral Strategy - Web Game

A browser-based multiplayer implementation of Electoral Strategy, where 2-4 players campaign for the presidency using the Electoral College system.

## 🎮 Game Features

- **Multiplayer**: 2-4 players join with a 6-character game code
- **Real-time**: All players see actions instantly via WebSockets
- **Automated**: No manual tracking - state lean, electoral votes, and dice rolls handled automatically
- **Remote Play**: Play with friends anywhere in the world

## 🏗️ Tech Stack

### Backend
- **Node.js** + **Express** - REST API server
- **Socket.io** - Real-time WebSocket communication
- **PostgreSQL** - Game state database
- **TypeScript** - Type safety

### Frontend
- **React** + **TypeScript** - UI framework
- **Vite** - Build tool and dev server
- **TailwindCSS** - Styling
- **Socket.io-client** - Real-time updates
- **React Router** - Navigation

## 📦 Project Structure

```
election_game/
├── backend/                 # Node.js server
│   ├── src/
│   │   ├── server.ts       # Main server file
│   │   ├── db/             # Database connection and queries
│   │   ├── routes/         # API endpoints
│   │   ├── socket/         # WebSocket handlers
│   │   ├── lib/            # Game logic and utilities
│   │   ├── types/          # TypeScript types
│   │   └── data/           # Cards and states JSON files
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/               # React app
│   ├── src/
│   │   ├── App.tsx         # Main app component
│   │   ├── pages/          # Page components (Home, Game, etc.)
│   │   ├── components/     # Reusable UI components
│   │   ├── lib/            # API client and utilities
│   │   ├── hooks/          # Custom React hooks
│   │   ├── types/          # TypeScript types
│   │   └── data/           # Cards and states JSON files
│   ├── package.json
│   └── vite.config.ts
│
├── docker-compose.yml      # Docker setup (optional)
└── README.md              # This file
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** v18+ ([Download](https://nodejs.org))
- **PostgreSQL** 14+ ([Download](https://www.postgresql.org/download/))
  - OR use [Supabase](https://supabase.com) free tier (recommended for beginners)
- **Git** (for version control)

### 1. Clone / Setup

```bash
cd ~/Workspace/election_game
chmod +x setup.sh
./setup.sh
```

### 2. Database Setup

#### Option A: Local PostgreSQL

```bash
# Create database
createdb electoral_strategy

# Copy environment file
cd backend
cp .env.example .env

# Edit .env and set:
# DATABASE_URL=postgresql://yourusername@localhost:5432/electoral_strategy

# Run schema
npm run db:setup

# Seed with game data (optional)
npm run db:seed
```

#### Option B: Supabase (Easier!)

1. Go to [supabase.com](https://supabase.com) and create a project
2. Get your connection string from Settings → Database
3. Update `backend/.env`:
   ```
   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@[YOUR-HOST]:5432/postgres
   ```
4. Run the schema SQL in Supabase SQL Editor (copy from `backend/src/db/schema.sql`)

### 3. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Start development server
npm run dev

# You should see:
# 🎮 Electoral Strategy Server Running!
# 📡 Server: http://localhost:3000
```

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev

# Open browser to: http://localhost:5173
```

## 🎮 How to Play

### Creating a Game

1. Open http://localhost:5173
2. Click "Create New Game"
3. Enter your name
4. You'll get a 6-character code (e.g., "ABC123")
5. Share this code with friends

### Joining a Game

1. Open http://localhost:5173
2. Click "Join Existing Game"
3. Enter the game code
4. Enter your name
5. Wait in lobby for host to start

### Gameplay

1. **Choose Running Mate** - Select your VP at game start
2. **Take Turns** - Play cards on your turn
3. **Win States** - Get state lean to ±7 to control electoral votes
4. **Victory** - First to 270 electoral votes wins!

## 📚 Development Guide

### Running in Development

**Backend:**
```bash
cd backend
npm run dev  # Runs with nodemon (auto-restart on changes)
```

**Frontend:**
```bash
cd frontend
npm run dev  # Runs with Vite HMR (hot module replacement)
```

### Building for Production

**Backend:**
```bash
cd backend
npm run build  # Compiles TypeScript to dist/
npm start      # Runs compiled code
```

**Frontend:**
```bash
cd frontend
npm run build  # Creates optimized build in dist/
npm run preview  # Preview production build locally
```

### Database Commands

```bash
# Setup database (creates all tables)
npm run db:setup

# Seed database (loads cards and states data)
npm run db:seed

# Reset database (careful!)
psql $DATABASE_URL -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
npm run db:setup
```

## 🐳 Docker Setup (Optional)

If you prefer Docker:

```bash
# Start everything (database + backend + frontend)
docker-compose up

# Backend will be at: http://localhost:3000
# Frontend will be at: http://localhost:5173
# PostgreSQL will be at: localhost:5432
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

### Manual Testing Checklist
- [ ] Create game and get code
- [ ] Join game from different browser/tab
- [ ] See other players in lobby
- [ ] Start game as host
- [ ] Play a card
- [ ] See state lean update
- [ ] End turn
- [ ] Next player's turn begins
- [ ] Electoral votes calculate correctly
- [ ] Victory at 270+ votes

## 📁 Key Files

### Backend

| File | Purpose |
|------|---------|
| `src/server.ts` | Main server setup |
| `src/db/connection.ts` | PostgreSQL connection |
| `src/db/schema.sql` | Database schema |
| `src/routes/games.ts` | Game API endpoints |
| `src/socket/handlers.ts` | WebSocket event handlers |
| `src/lib/gameCode.ts` | Game code generation |
| `src/lib/gameLogic.ts` | Core game rules |
| `src/data/cards.json` | All 85 cards |
| `src/data/states.json` | All 51 states |

### Frontend

| File | Purpose |
|------|---------|
| `src/App.tsx` | Main app and routing |
| `src/pages/Home.tsx` | Home page |
| `src/pages/CreateGame.tsx` | Create game flow |
| `src/pages/JoinGame.tsx` | Join game flow |
| `src/pages/Game.tsx` | Main game board |
| `src/lib/api.ts` | API client (axios) |
| `src/lib/socket.ts` | Socket.io client |
| `src/hooks/useGameState.ts` | Game state management |

## 🚀 Deployment

### Recommended: Vercel (Frontend) + Railway (Backend)

**Frontend (Vercel):**
```bash
cd frontend
vercel deploy

# Follow prompts, then:
# Set environment variable: VITE_API_URL=https://your-backend.railway.app
```

**Backend (Railway):**
1. Push code to GitHub
2. Go to [railway.app](https://railway.app)
3. Create new project from GitHub repo
4. Add PostgreSQL database
5. Set environment variables from `.env.example`
6. Deploy!

**Cost:** Free tier handles ~500 games/month

### Alternative: Single VPS (DigitalOcean, etc.)

Use Docker Compose on a VPS:
```bash
# On server:
git clone your-repo
cd election_game
docker-compose up -d
```

**Cost:** $6/month for small droplet

## 🐛 Troubleshooting

### "Cannot connect to database"
- Check DATABASE_URL in backend/.env
- Ensure PostgreSQL is running: `psql -l`
- For Supabase: Verify connection string and password

### "Port 3000 already in use"
- Change PORT in backend/.env
- Or kill process: `lsof -ti:3000 | xargs kill`

### "CORS error" in browser
- Ensure CORS_ORIGIN in backend/.env matches frontend URL
- Default: http://localhost:5173

### "Module not found"
- Run `npm install` in both backend and frontend
- Delete node_modules and reinstall if needed

### WebSocket not connecting
- Check VITE_SOCKET_URL in frontend/.env
- Ensure backend is running
- Check browser console for errors

## 📊 Game Data

All game data (cards and states) is stored in JSON files:

- **Cards**: `backend/src/data/Electoral_Strategy_Cards.json` (85 cards)
- **States**: `backend/src/data/Electoral_Strategy_States.json` (51 states)

To modify:
1. Edit the JSON files
2. Restart backend: `npm run dev`
3. Changes take effect immediately

## 🎯 Roadmap

### ✅ Phase 1: MVP (Weeks 1-2)
- [x] Project setup
- [x] Database schema
- [x] Game creation/joining
- [ ] Basic game board
- [ ] Card playing (next!)

### Phase 2: Core Gameplay (Weeks 3-4)
- [ ] Full card mechanics
- [ ] Event system
- [ ] Dice rolls
- [ ] Turn management
- [ ] Electoral vote calculation

### Phase 3: Advanced Features (Week 5)
- [ ] Debate rounds
- [ ] Running mate selection
- [ ] Victory conditions
- [ ] Game over screen

### Phase 4: Polish (Week 6)
- [ ] Mobile responsive design
- [ ] Animations
- [ ] Sound effects (optional)
- [ ] Analytics
- [ ] Bug fixes

### Future Enhancements
- [ ] Spectator mode
- [ ] Game replays
- [ ] Leaderboards
- [ ] Tournaments
- [ ] AI opponents

## 🤝 Contributing

This is your project! Modify anything you want:

1. Create a feature branch: `git checkout -b feature-name`
2. Make changes and test
3. Commit: `git commit -am "Add feature"`
4. Push: `git push origin feature-name`

## 📝 License

MIT License - feel free to use this code however you want!

## 🆘 Getting Help

If you get stuck:

1. Check this README
2. Read the technical spec: `~/Electoral_Strategy_Web_Game_Technical_Spec.md`
3. Check the implementation roadmap: `~/Electoral_Strategy_Web_Implementation_Roadmap.md`
4. Search for error messages online
5. Ask for help!

## 🎉 Have Fun!

You're building a real multiplayer game! This is an awesome project that combines:
- Full-stack development
- Real-time communications
- Game logic
- Database design
- Deployment

Take it step by step, test frequently, and enjoy the process!

---

**Next Steps:**
1. Get the backend running (follow Quick Start above)
2. Get the frontend running
3. Create a game and join from another browser tab
4. Start implementing card playing mechanics (see Week 3 in roadmap)

Good luck! 🚀🎮🗳️
