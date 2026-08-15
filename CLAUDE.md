# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Electoral Strategy is a browser-based multiplayer game implementing the Electoral College strategy board game. It supports 2-4 players who campaign for the presidency using cards to influence state lean and control electoral votes. The goal is to reach 270 electoral votes to win.

**Tech Stack:**
- Backend: Node.js + Express + Socket.io + PostgreSQL
- Frontend: React + TypeScript + Vite + TailwindCSS
- Real-time: WebSocket communication via Socket.io

## Development Commands

### Backend (from `backend/` directory)

```bash
# Install dependencies
npm install

# Development server (with auto-restart)
npm run dev

# Production build
npm run build
npm start

# Database setup
npm run db:setup    # Creates all tables from schema.sql
npm run db:seed     # Seeds cards and states data
```

### Frontend (from `frontend/` directory)

```bash
# Install dependencies
npm install

# Development server (with HMR)
npm run dev

# Production build
npm run build
npm run preview     # Preview production build
```

### Database Operations

```bash
# Connect to database
psql $DATABASE_URL

# Reset database (caution!)
psql $DATABASE_URL -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
npm run db:setup
```

## Architecture

### Multiplayer Game Flow

1. **Game Creation**: Host creates game → receives 6-character code → game enters "lobby" status
2. **Joining**: Players join using code → added to players table → WebSocket connection established
3. **Game Start**: Host starts game → status changes to "in_progress" → initial hands dealt → turn order established
4. **Gameplay**: Players take turns playing cards → state lean updated → electoral votes recalculated → victory checked
5. **Real-time Sync**: All state changes broadcast via Socket.io to keep all players synchronized

### Database Schema Design

The database uses 7 core tables:

- **games**: Stores game metadata, status, current turn/round
- **players**: Player info, electoral votes, media points, turn order
- **game_states**: Current lean value for each state in each game (denormalized for performance)
- **player_hands**: Cards currently held by players
- **discard_pile**: Played/discarded cards
- **active_events**: Event cards currently affecting the game
- **game_log**: Complete action history for game replays

Key design decisions:
- UUIDs for all primary keys
- Cascading deletes on game deletion
- JSONB for flexible settings/rally_markers
- State lean stored as integer (-15 to +15)
- Card data stored in JSON files, referenced by ID

### WebSocket Event Flow

**Client → Server:**
- `join_room`: Join game room, get current state
- `start_game`: Start game (host only), deal initial hands
- `play_card`: Play card, apply effects, update state
- `end_turn`: End turn, advance to next player

**Server → Client:**
- `player_joined`: Broadcast when player joins lobby
- `game_state`: Send current game state to joining player
- `game_started`: Broadcast when game begins
- `hand_updated`: Send updated hand to specific player
- `card_played`: Broadcast card play and state changes
- `turn_ended`: Broadcast turn change and new round

### Frontend State Management

The frontend uses a combination of:
- React component state for local UI
- Socket.io event handlers for real-time updates
- API calls for initial game creation/joining
- Environment variables for API/Socket URLs

No global state management library is currently used (no Redux/Zustand/etc).

### Card Effect System

Card effects are stored as strings in the JSON data (e.g., "+2 lean to target state"). The backend parses these effects using regex to extract:
- Lean change amount (e.g., "+2", "-3")
- Whether dice roll multiplies the effect
- Target state requirements

Current implementation is simplified - production would need more robust effect parsing.

## Important Implementation Details

### State Control Mechanics

- States have lean values from -15 to +15
- Control threshold: ±7 (absolute value of 7 or greater)
- Lean ≥7: Player 0 controls (by convention)
- Lean ≤-7: Player 1 controls (by convention)
- -6 to +6: Toss-up, no control
- Electoral votes only count when state is controlled

### Game Code Generation

Uses `generateGameCode()` in `backend/src/lib/gameCode.ts`:
- 6 alphanumeric characters
- Excludes I, O, 0, 1 to avoid confusion
- Guaranteed unique by checking existing codes in database loop

### Turn Management

- Turn order stored in `players.turn_order` (0-indexed)
- Current turn tracked in `games.current_turn_player_id`
- Round increments when turn cycles back to first player
- Debate rounds occur at rounds 4, 8, 12 (see `isDebateRound()`)

### Card Drawing

When a turn ends, the next player automatically draws a card. The backend:
1. Filters out cards already in hands or discard pile
2. Randomly selects from remaining cards
3. Adds to next player's hand

If deck is empty, no card is drawn (not yet implemented: reshuffling discard pile).

## Data Files

Game data is stored in JSON files, duplicated in both backend and frontend:

- `backend/src/data/Electoral_Strategy_Cards.json` - All 85 cards
- `backend/src/data/Electoral_Strategy_States.json` - All 51 states (50 states + DC)

Cards reference states by abbreviation. States include:
- `electoral_votes`: Number of electoral votes
- `starting_lean`: Initial lean value
- `priority_issues`: Array of issues (for future card targeting)
- `region`: Geographic region

## Environment Configuration

### Backend (.env)

```
DATABASE_URL=postgresql://user:password@host:5432/dbname
PORT=3000
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
```

### Frontend (.env)

```
VITE_API_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000
```

## Development Status

**Implemented:**
- Game creation/joining with code system
- Lobby system with WebSocket connections
- Basic game start with hand dealing
- Card playing with state lean updates
- Turn management and round tracking
- Action logging

**Not Yet Implemented:**
- Running mate selection
- Full card effect parsing (currently simplified regex)
- Event cards and dice rolling
- Debate rounds
- Victory detection and game over screen
- Media points system
- Rally markers
- Deck reshuffling when empty
- Comprehensive error handling

## Common Development Tasks

### Adding a New API Endpoint

1. Add route handler to `backend/src/routes/games.ts`
2. Use `query()` from `backend/src/db/connection.ts` for database access
3. Add TypeScript types to `backend/src/types/index.ts`
4. Add corresponding function to `frontend/src/lib/api.ts`

### Adding a New Socket Event

1. Add handler in `backend/src/socket/handlers.ts` inside `initializeSocketHandlers()`
2. Use `io.to(gameId).emit()` to broadcast to all players in game
3. Use `socket.emit()` to send to individual player
4. Add listener in frontend components

### Modifying Game Logic

Core game logic functions are in `backend/src/lib/gameLogic.ts`:
- Electoral vote calculation: `calculateElectoralVotes()`
- State control: `getControllingPlayer()`
- Victory check: `checkVictory()`
- Card validation: `canPlayCard()`
- Effect application: `applyCardEffect()`

### Testing Multiplayer Locally

1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd frontend && npm run dev`
3. Open http://localhost:5173 in normal browser
4. Create game, get code
5. Open http://localhost:5173 in incognito/private window
6. Join with code
7. Both players should see each other in lobby

## Known Issues

- Card draw logic in `socket/handlers.ts:295-305` has async filter issue (filters execute async but results used sync)
- No disconnect handling to mark players offline
- No game cleanup for abandoned games
- State control determination assumes 2 players (needs party affiliation for 3-4 players)
- Lean values can overflow if not clamped properly

## Reference Documents

See project root for comprehensive documentation:
- `README.md` - Full setup guide and deployment instructions
- `GETTING_STARTED.md` - Quick start guide
- `PROJECT_STATUS.md` - Current implementation status
