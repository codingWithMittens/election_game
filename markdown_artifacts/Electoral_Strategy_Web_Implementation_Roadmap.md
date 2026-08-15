# Electoral Strategy - Web Implementation Roadmap
## 6-Week Build Plan + Starter Code

**Target**: Fully functional multiplayer web game
**Timeline**: 6 weeks (part-time) or 3 weeks (full-time)
**Skill Level**: Intermediate JavaScript/TypeScript

---

## 🗺️ OVERVIEW

This roadmap takes you from zero to a deployed, playable Electoral Strategy web game.

**Milestones:**
- Week 1: Project setup + Basic game creation/joining
- Week 2: Game board + Card display
- Week 3: Card playing mechanics + Turn management
- Week 4: Event system + Dice rolls
- Week 5: Debate rounds + Polish
- Week 6: Testing + Deployment

---

## 📅 WEEK 1: Foundation

### Day 1-2: Project Setup

**Backend Setup:**
```bash
# Create backend project
mkdir electoral-strategy-backend
cd electoral-strategy-backend
npm init -y

# Install dependencies
npm install express socket.io pg cors dotenv
npm install -D typescript @types/node @types/express @types/socket.io ts-node nodemon

# TypeScript setup
npx tsc --init
```

**Create project structure:**
```
electoral-strategy-backend/
├── src/
│   ├── server.ts
│   ├── db/
│   │   ├── connection.ts
│   │   ├── schema.sql
│   │   └── queries.ts
│   ├── routes/
│   │   └── games.ts
│   ├── socket/
│   │   └── handlers.ts
│   ├── lib/
│   │   ├── gameCode.ts
│   │   └── gameLogic.ts
│   └── types/
│       └── game.ts
├── package.json
└── tsconfig.json
```

**Frontend Setup:**
```bash
# Create frontend project
npm create vite@latest electoral-strategy-frontend -- --template react-ts
cd electoral-strategy-frontend

# Install dependencies
npm install
npm install socket.io-client axios zustand react-router-dom
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

**Create frontend structure:**
```
electoral-strategy-frontend/
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── CreateGame.tsx
│   │   ├── JoinGame.tsx
│   │   └── Game.tsx
│   ├── components/
│   │   └── (will add later)
│   ├── lib/
│   │   ├── api.ts
│   │   └── socket.ts
│   ├── hooks/
│   │   └── useGameState.ts
│   ├── types/
│   │   └── game.ts
│   └── data/
│       ├── cards.json (copy from your data files)
│       └── states.json (copy from your data files)
├── package.json
└── tailwind.config.js
```

### Day 3-4: Database Setup

**Create PostgreSQL database:**
```bash
# If using Supabase (recommended for beginners):
# 1. Go to supabase.com
# 2. Create new project
# 3. Get connection string from settings
# 4. Add to .env file

# Or local PostgreSQL:
createdb electoral_strategy
psql electoral_strategy < src/db/schema.sql
```

**schema.sql:**
```sql
-- Copy the schema from Electoral_Strategy_Web_Game_Technical_Spec.md
-- (The complete schema with all tables)
```

**Test database connection:**
```typescript
// src/db/connection.ts
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function query(text: string, params?: any[]) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('Executed query', { text, duration, rows: res.rowCount });
  return res;
}

export default pool;
```

### Day 5-7: Game Code Generation & Basic API

**Game code generator:**
```typescript
// src/lib/gameCode.ts
export function generateGameCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid confusing chars
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function validateGameCode(code: string): boolean {
  return /^[A-Z0-9]{6}$/.test(code);
}
```

**Create Game API:**
```typescript
// src/routes/games.ts
import { Router } from 'express';
import { query } from '../db/connection';
import { generateGameCode } from '../lib/gameCode';

const router = Router();

router.post('/create', async (req, res) => {
  try {
    const { hostName } = req.body;

    // Generate unique game code
    let gameCode = generateGameCode();
    let exists = true;

    while (exists) {
      const result = await query(
        'SELECT id FROM games WHERE game_code = $1',
        [gameCode]
      );
      exists = result.rows.length > 0;
      if (exists) gameCode = generateGameCode();
    }

    // Create game
    const gameResult = await query(
      `INSERT INTO games (game_code, status, current_round)
       VALUES ($1, $2, $3)
       RETURNING id, game_code`,
      [gameCode, 'waiting', 1]
    );

    const game = gameResult.rows[0];

    // Create host player
    const playerResult = await query(
      `INSERT INTO players (game_id, player_number, name, color, is_host, campaign_points)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [game.id, 1, hostName, '#3B82F6', true, 5]
    );

    const player = playerResult.rows[0];

    res.json({
      gameId: game.id,
      gameCode: game.game_code,
      hostPlayer: player
    });
  } catch (error) {
    console.error('Error creating game:', error);
    res.status(500).json({ error: 'Failed to create game' });
  }
});

router.post('/join', async (req, res) => {
  try {
    const { gameCode, playerName } = req.body;

    // Find game
    const gameResult = await query(
      'SELECT * FROM games WHERE game_code = $1',
      [gameCode]
    );

    if (gameResult.rows.length === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }

    const game = gameResult.rows[0];

    if (game.status !== 'waiting') {
      return res.status(400).json({ error: 'Game already started' });
    }

    // Count existing players
    const playerCountResult = await query(
      'SELECT COUNT(*) FROM players WHERE game_id = $1',
      [game.id]
    );

    const playerCount = parseInt(playerCountResult.rows[0].count);

    if (playerCount >= 4) {
      return res.status(400).json({ error: 'Game is full' });
    }

    const playerNumber = playerCount + 1;
    const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B'];

    // Create player
    const playerResult = await query(
      `INSERT INTO players (game_id, player_number, name, color, is_host, campaign_points)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [game.id, playerNumber, playerName, colors[playerNumber - 1], false, 5]
    );

    const player = playerResult.rows[0];

    res.json({
      gameId: game.id,
      player: player
    });
  } catch (error) {
    console.error('Error joining game:', error);
    res.status(500).json({ error: 'Failed to join game' });
  }
});

export default router;
```

**Server setup:**
```typescript
// src/server.ts
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import gamesRouter from './routes/games';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/games', gamesRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Socket.io connection
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-game', ({ gameId }) => {
    socket.join(gameId);
    io.to(gameId).emit('player-connected', { socketId: socket.id });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

**Test backend:**
```bash
npm run dev  # Should see "Server running on port 3000"
```

---

## 📅 WEEK 2: Frontend UI & Game Board

### Day 8-9: Home, Create, and Join Pages

**Home page:**
```tsx
// src/pages/Home.tsx
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-red-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-2xl p-8">
        <h1 className="text-4xl font-bold text-center mb-2">
          Electoral Strategy
        </h1>
        <p className="text-gray-600 text-center mb-8">
          Campaign for the Presidency
        </p>

        <div className="space-y-4">
          <Link
            to="/create"
            className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg text-center transition"
          >
            Create New Game
          </Link>

          <Link
            to="/join"
            className="block w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-4 rounded-lg text-center transition"
          >
            Join Existing Game
          </Link>
        </div>

        <div className="mt-8 text-center text-sm text-gray-600">
          <p>2-4 Players • 60-90 minutes</p>
        </div>
      </div>
    </div>
  );
}
```

**Create game page:**
```tsx
// src/pages/CreateGame.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

export default function CreateGame() {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/games/create', { hostName: name });
      const { gameId, gameCode, hostPlayer } = response.data;

      // Store in localStorage for now
      localStorage.setItem('playerId', hostPlayer.id);
      localStorage.setItem('gameId', gameId);

      navigate(`/game/${gameId}`, { state: { gameCode } });
    } catch (error) {
      console.error('Failed to create game:', error);
      alert('Failed to create game. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-red-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-2xl p-8">
        <h1 className="text-3xl font-bold text-center mb-6">Create Game</h1>

        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              maxLength={50}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !name}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-lg transition"
          >
            {loading ? 'Creating...' : 'Create Game'}
          </button>
        </form>

        <button
          onClick={() => navigate('/')}
          className="w-full mt-4 text-gray-600 hover:text-gray-800"
        >
          ← Back
        </button>
      </div>
    </div>
  );
}
```

**Join game page:**
```tsx
// src/pages/JoinGame.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

export default function JoinGame() {
  const [name, setName] = useState('');
  const [gameCode, setGameCode] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/games/join', {
        gameCode: gameCode.toUpperCase(),
        playerName: name
      });

      const { gameId, player } = response.data;

      localStorage.setItem('playerId', player.id);
      localStorage.setItem('gameId', gameId);

      navigate(`/game/${gameId}`);
    } catch (error: any) {
      console.error('Failed to join game:', error);
      alert(error.response?.data?.error || 'Failed to join game');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-red-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-2xl p-8">
        <h1 className="text-3xl font-bold text-center mb-6">Join Game</h1>

        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Game Code
            </label>
            <input
              type="text"
              value={gameCode}
              onChange={(e) => setGameCode(e.target.value.toUpperCase())}
              placeholder="ABC123"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl font-mono tracking-widest"
              required
              maxLength={6}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              maxLength={50}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !name || gameCode.length !== 6}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-lg transition"
          >
            {loading ? 'Joining...' : 'Join Game'}
          </button>
        </form>

        <button
          onClick={() => navigate('/')}
          className="w-full mt-4 text-gray-600 hover:text-gray-800"
        >
          ← Back
        </button>
      </div>
    </div>
  );
}
```

**API client:**
```typescript
// src/lib/api.ts
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

**Router setup:**
```tsx
// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import CreateGame from './pages/CreateGame';
import JoinGame from './pages/JoinGame';
import Game from './pages/Game';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create" element={<CreateGame />} />
        <Route path="/join" element={<JoinGame />} />
        <Route path="/game/:gameId" element={<Game />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

### Day 10-11: Game Lobby & WebSocket Integration

**Socket client:**
```typescript
// src/lib/socket.ts
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL);
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
```

**Game lobby component:**
```tsx
// src/components/GameLobby.tsx
import { useEffect, useState } from 'react';
import { getSocket } from '../lib/socket';

interface Player {
  id: string;
  name: string;
  playerNumber: number;
  color: string;
  isHost: boolean;
}

interface GameLobbyProps {
  gameId: string;
  gameCode: string;
  players: Player[];
  onStartGame: () => void;
  isHost: boolean;
}

export default function GameLobby({
  gameId,
  gameCode,
  players,
  onStartGame,
  isHost
}: GameLobbyProps) {
  const [copied, setCopied] = useState(false);

  const copyGameCode = () => {
    navigator.clipboard.writeText(gameCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Game Code Display */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h1 className="text-3xl font-bold text-center mb-4">
            Game Lobby
          </h1>

          <div className="text-center">
            <p className="text-gray-600 mb-2">Share this code with friends:</p>
            <div className="flex items-center justify-center gap-4">
              <div className="text-5xl font-mono font-bold tracking-widest bg-gray-100 px-8 py-4 rounded-lg">
                {gameCode}
              </div>
              <button
                onClick={copyGameCode}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
              >
                {copied ? '✓ Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </div>

        {/* Players List */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-4">
            Players ({players.length}/4)
          </h2>

          <div className="space-y-3">
            {players.map((player) => (
              <div
                key={player.id}
                className="flex items-center gap-4 p-4 rounded-lg"
                style={{ backgroundColor: `${player.color}20` }}
              >
                <div
                  className="w-12 h-12 rounded-full"
                  style={{ backgroundColor: player.color }}
                />
                <div className="flex-1">
                  <p className="font-bold">{player.name}</p>
                  <p className="text-sm text-gray-600">Player {player.playerNumber}</p>
                </div>
                {player.isHost && (
                  <span className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-bold">
                    HOST
                  </span>
                )}
              </div>
            ))}

            {/* Empty slots */}
            {[...Array(4 - players.length)].map((_, i) => (
              <div
                key={`empty-${i}`}
                className="flex items-center gap-4 p-4 rounded-lg border-2 border-dashed border-gray-300"
              >
                <div className="w-12 h-12 rounded-full bg-gray-200" />
                <p className="text-gray-400">Waiting for player...</p>
              </div>
            ))}
          </div>
        </div>

        {/* Start Game Button */}
        {isHost && (
          <button
            onClick={onStartGame}
            disabled={players.length < 2}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-4 px-6 rounded-lg text-xl transition"
          >
            {players.length < 2
              ? 'Waiting for at least 2 players...'
              : 'Start Game'}
          </button>
        )}

        {!isHost && (
          <div className="text-center text-gray-600">
            Waiting for host to start the game...
          </div>
        )}
      </div>
    </div>
  );
}
```

### Day 12-14: US Map Component

**Simplified US Map (you can use a library like `react-simple-maps` or create SVG manually):**

```tsx
// src/components/USMap.tsx
import { useState } from 'react';
import statesData from '../data/states.json';

interface StateData {
  abbreviation: string;
  name: string;
  electoralVotes: number;
  currentLean: number;
  controlledBy: number | null;
}

interface USMapProps {
  states: StateData[];
  onStateClick?: (state: StateData) => void;
  highlightStates?: string[]; // States that can be clicked
}

export default function USMap({ states, onStateClick, highlightStates }: USMapProps) {
  const [hoveredState, setHoveredState] = useState<string | null>(null);

  const getStateColor = (state: StateData): string => {
    if (state.currentLean >= 10) return '#1E40AF'; // Strong Blue
    if (state.currentLean >= 7) return '#3B82F6';  // Blue
    if (state.currentLean >= 1) return '#93C5FD';  // Light Blue
    if (state.currentLean === 0) return '#F3F4F6'; // Neutral
    if (state.currentLean <= -10) return '#B91C1C'; // Strong Red
    if (state.currentLean <= -7) return '#EF4444';  // Red
    return '#FCA5A5';  // Light Red
  };

  const isInteractive = (abbr: string) =>
    highlightStates?.includes(abbr) ?? false;

  // For now, simple list view (replace with actual SVG map later)
  return (
    <div className="grid grid-cols-6 gap-2 p-4">
      {states.map((state) => (
        <button
          key={state.abbreviation}
          onClick={() => isInteractive(state.abbreviation) && onStateClick?.(state)}
          onMouseEnter={() => setHoveredState(state.abbreviation)}
          onMouseLeave={() => setHoveredState(null)}
          className={`
            p-4 rounded-lg font-bold transition-all
            ${isInteractive(state.abbreviation) ? 'cursor-pointer hover:scale-110' : 'cursor-default'}
            ${hoveredState === state.abbreviation ? 'ring-4 ring-yellow-400' : ''}
          `}
          style={{ backgroundColor: getStateColor(state) }}
          disabled={!isInteractive(state.abbreviation)}
        >
          <div className="text-xs">{state.abbreviation}</div>
          <div className="text-lg">{state.electoralVotes}</div>
        </button>
      ))}
    </div>
  );
}
```

**Week 2 Deliverable**: You should be able to create a game, join it with multiple browser tabs, see the lobby, and view a basic map.

---

## 📅 WEEK 3-4: Core Gameplay

I'll continue with weeks 3-6 in the next section to keep this response manageable.

### Key Files to Create:

Week 3:
- Card hand display
- Card playing modal
- Turn management
- State lean updates

Week 4:
- Event drawing
- Dice roll animations
- Campaign points tracking
- Electoral vote calculation

Week 5:
- Debate rounds
- Running mate selection
- Victory conditions
- Game over screen

Week 6:
- Testing
- Bug fixes
- Deployment
- Documentation

---

## 🚀 QUICK START SCRIPT

I can create a starter template with all the boilerplate code. Would you like me to:

1. Create a complete starter codebase with all Week 1 code pre-written?
2. Create deployment scripts for Railway/Vercel?
3. Create a Docker setup for easy local development?

Let me know and I'll generate the complete starter project!

---

**This gives you everything you need to start building the web version!**

Next: Would you like the complete starter codebase, or shall I continue with weeks 3-6 of the roadmap?
