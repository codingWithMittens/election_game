# Electoral Strategy - Web Game Technical Specification
## Browser-Based Multiplayer Implementation

**Version**: 1.0
**Created**: 2026-08-14
**Target**: 2-4 player online multiplayer game

---

## 🎯 GAME OVERVIEW

**What**: Electoral Strategy converted to a web-based multiplayer game
**How**: Host creates a game → Gets a join code → Up to 3 friends join → Play in real-time
**Why**: Eliminates manual tracking, automates all calculations, enables remote play

---

## 🏗️ TECHNICAL ARCHITECTURE

### Stack Recommendation

**Frontend:**
- **React** (with TypeScript) - Component-based UI
- **Vite** - Fast build tool and dev server
- **TailwindCSS** - Rapid styling
- **Zustand** or **React Context** - State management
- **Socket.io-client** - Real-time updates

**Backend:**
- **Node.js + Express** - API server
- **Socket.io** - Real-time WebSocket communication
- **PostgreSQL** or **MongoDB** - Game state persistence
- **Redis** (optional) - Session management and caching

**Deployment:**
- **Frontend**: Vercel or Netlify (free tier)
- **Backend**: Railway, Render, or Fly.io (free/cheap tier)
- **Database**: Supabase (PostgreSQL) or MongoDB Atlas (free tier)

---

## 📊 DATABASE SCHEMA

### PostgreSQL Schema

```sql
-- Game Sessions
CREATE TABLE games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_code VARCHAR(6) UNIQUE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'waiting', -- waiting, in_progress, completed
    current_round INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    settings JSONB DEFAULT '{}'::jsonb
);

-- Players
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    player_number INTEGER NOT NULL, -- 1-4
    name VARCHAR(50) NOT NULL,
    color VARCHAR(7) NOT NULL, -- hex color
    campaign_points INTEGER DEFAULT 5,
    electoral_votes INTEGER DEFAULT 0,
    running_mate VARCHAR(50), -- Which running mate they chose
    is_host BOOLEAN DEFAULT FALSE,
    connected BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(game_id, player_number)
);

-- Player Hands (cards currently held)
CREATE TABLE player_hands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    card_id VARCHAR(20) NOT NULL, -- e.g., POL-HEA-001
    drawn_at TIMESTAMP DEFAULT NOW()
);

-- Game State (states and their current lean)
CREATE TABLE game_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    state_abbr VARCHAR(2) NOT NULL,
    current_lean INTEGER NOT NULL, -- -15 to +15
    controlled_by INTEGER, -- player_number or NULL
    rally_markers JSONB DEFAULT '[]'::jsonb, -- Array of {player_number, turns_remaining}
    UNIQUE(game_id, state_abbr)
);

-- Active Events
CREATE TABLE active_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    event_card_id VARCHAR(20) NOT NULL,
    severity VARCHAR(10) NOT NULL, -- minor, standard, major
    duration_remaining INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Game Log (history of all actions)
CREATE TABLE game_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL,
    player_id UUID REFERENCES players(id),
    action_type VARCHAR(50) NOT NULL, -- card_played, event_drawn, debate_won, etc.
    action_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Discarded Cards
CREATE TABLE discard_pile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    card_id VARCHAR(20) NOT NULL,
    discarded_by UUID REFERENCES players(id),
    discarded_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_games_code ON games(game_code);
CREATE INDEX idx_players_game ON players(game_id);
CREATE INDEX idx_game_states_game ON game_states(game_id);
CREATE INDEX idx_active_events_game ON active_events(game_id);
CREATE INDEX idx_game_log_game ON game_log(game_id);
```

---

## 🔌 API ENDPOINTS

### REST API Endpoints

#### Game Management

**POST `/api/games/create`**
```json
Request:
{
  "hostName": "Alice",
  "settings": {
    "maxPlayers": 4,
    "roundLimit": 12
  }
}

Response:
{
  "gameId": "550e8400-e29b-41d4-a716-446655440000",
  "gameCode": "ABC123",
  "hostPlayer": {
    "id": "...",
    "name": "Alice",
    "playerNumber": 1,
    "color": "#3B82F6"
  }
}
```

**POST `/api/games/join`**
```json
Request:
{
  "gameCode": "ABC123",
  "playerName": "Bob"
}

Response:
{
  "gameId": "550e8400-e29b-41d4-a716-446655440000",
  "player": {
    "id": "...",
    "name": "Bob",
    "playerNumber": 2,
    "color": "#EF4444"
  },
  "gameState": { /* full game state */ }
}
```

**GET `/api/games/:gameId/state`**
```json
Response:
{
  "game": {
    "id": "...",
    "gameCode": "ABC123",
    "status": "in_progress",
    "currentRound": 5
  },
  "players": [ /* array of players */ ],
  "states": [ /* all 51 states with current lean */ ],
  "activeEvents": [ /* current events */ ],
  "currentTurn": {
    "playerNumber": 2,
    "phase": "action" // upkeep, draw, event, action, cleanup
  }
}
```

#### Game Actions

**POST `/api/games/:gameId/actions/play-card`**
```json
Request:
{
  "playerId": "...",
  "cardId": "POL-HEA-001",
  "targets": {
    "states": ["PA", "MI"],
    "opponent": null
  }
}

Response:
{
  "success": true,
  "effects": {
    "leanChanges": {
      "PA": +3,
      "MI": +3
    },
    "backlash": {
      "TX": -2
    }
  },
  "newGameState": { /* updated state */ }
}
```

**POST `/api/games/:gameId/actions/draw-event`**
```json
Request:
{
  "playerId": "..."
}

Response:
{
  "eventCard": {
    "id": "EVE-ECO-001",
    "name": "Economic Recession"
  },
  "diceRoll": 5, // 1-6 for severity
  "severity": "major", // minor, standard, major
  "effects": {
    "duration": 4,
    "leanChanges": { /* affected states */ }
  }
}
```

**POST `/api/games/:gameId/actions/end-turn`**
```json
Request:
{
  "playerId": "..."
}

Response:
{
  "nextPlayer": {
    "id": "...",
    "name": "Charlie",
    "playerNumber": 3
  },
  "roundAdvanced": false
}
```

#### Debate Rounds

**POST `/api/games/:gameId/debate/submit`**
```json
Request:
{
  "playerId": "...",
  "debateCardId": "SPE-DEB-001" // Knockout Blow
}

Response:
{
  "waiting": true,
  "message": "Waiting for other players..."
}
```

**GET `/api/games/:gameId/debate/results`**
```json
Response:
{
  "results": [
    {
      "playerNumber": 1,
      "card": "Knockout Blow",
      "baseValue": 3,
      "diceRoll": 5,
      "total": 8
    },
    {
      "playerNumber": 2,
      "card": "Steady Performance",
      "baseValue": 2,
      "diceRoll": 6,
      "total": 8
    }
  ],
  "winner": null, // tie - needs reroll
  "effects": null
}
```

---

## 🔄 WEBSOCKET EVENTS

### Socket.io Events

**Client → Server**

```javascript
// Join game room
socket.emit('join-game', { gameId, playerId });

// Player action
socket.emit('player-action', {
  gameId,
  playerId,
  action: 'play-card',
  data: { cardId, targets }
});

// Player ready (for debate or round start)
socket.emit('player-ready', { gameId, playerId });
```

**Server → Client**

```javascript
// Game state updated
socket.on('game-state-updated', (gameState) => {
  // Update UI with new state
});

// Player joined/left
socket.on('player-connected', (player) => {
  // Show notification
});

socket.on('player-disconnected', (player) => {
  // Show warning
});

// Turn changed
socket.on('turn-changed', ({ currentPlayer, phase }) => {
  // Update turn indicator
});

// Event occurred
socket.on('event-drawn', (eventData) => {
  // Animate event card appearing
});

// Debate started
socket.on('debate-started', ({ round }) => {
  // Show debate UI
});

// Chat message (optional)
socket.on('chat-message', ({ playerName, message }) => {
  // Display in chat
});

// Game ended
socket.on('game-ended', ({ winner, finalScores }) => {
  // Show victory screen
});
```

---

## 🎨 FRONTEND ARCHITECTURE

### React Component Structure

```
src/
├── App.tsx
├── main.tsx
├── components/
│   ├── game/
│   │   ├── GameLobby.tsx           # Waiting room before game starts
│   │   ├── GameBoard.tsx           # Main game view
│   │   ├── USMap.tsx               # Interactive electoral map
│   │   ├── StateCard.tsx           # Individual state display
│   │   ├── PlayerDashboard.tsx    # Your hand, points, score
│   │   ├── OpponentPanel.tsx       # Other players' info
│   │   ├── TurnIndicator.tsx       # Whose turn it is
│   │   ├── RoundTracker.tsx        # Round 1-12 display
│   │   └── VictoryScreen.tsx       # Game over display
│   ├── cards/
│   │   ├── CardHand.tsx            # Your current cards
│   │   ├── Card.tsx                # Single card display
│   │   ├── CardPlayModal.tsx       # Choose targets, confirm play
│   │   ├── EventCardDisplay.tsx    # Active events
│   │   └── DebateCard.tsx          # Debate round cards
│   ├── actions/
│   │   ├── ActionPanel.tsx         # Available actions this turn
│   │   ├── PlayCardButton.tsx      # Play a card action
│   │   ├── DrawButton.tsx          # Draw cards
│   │   ├── EndTurnButton.tsx       # End turn
│   │   └── DiceRoller.tsx          # Animated dice roll
│   ├── ui/
│   │   ├── JoinGameForm.tsx        # Enter game code
│   │   ├── CreateGameForm.tsx      # Start new game
│   │   ├── GameCodeDisplay.tsx     # Show code for others to join
│   │   ├── PlayerList.tsx          # Show all players
│   │   ├── ChatPanel.tsx           # Optional chat
│   │   ├── GameLog.tsx             # History of actions
│   │   └── Notification.tsx        # Toast notifications
│   └── shared/
│       ├── Button.tsx
│       ├── Modal.tsx
│       ├── Tooltip.tsx
│       └── LoadingSpinner.tsx
├── hooks/
│   ├── useGameState.ts             # Game state management
│   ├── useSocket.ts                # WebSocket connection
│   ├── useCardPlay.ts              # Card playing logic
│   ├── useDebate.ts                # Debate mechanics
│   └── useDiceRoll.ts              # Dice animation
├── lib/
│   ├── api.ts                      # REST API calls
│   ├── socket.ts                   # Socket.io setup
│   ├── gameLogic.ts                # Game rules engine
│   ├── cardEffects.ts              # Calculate card effects
│   └── stateCalculations.ts       # Electoral vote calculations
├── data/
│   ├── cards.json                  # Card database
│   ├── states.json                 # States database
│   └── components.json             # Game components
├── types/
│   ├── game.ts                     # Game state types
│   ├── cards.ts                    # Card types
│   └── api.ts                      # API response types
└── utils/
    ├── gameCode.ts                 # Generate/validate codes
    ├── colors.ts                   # Player colors
    └── animations.ts               # Animation helpers
```

---

## 🎮 USER FLOWS

### Flow 1: Create Game

```
1. User clicks "Create Game"
   ├─→ Enters their name
   └─→ Optionally chooses settings (max players, round limit)

2. Frontend: POST /api/games/create
   ├─→ Backend generates 6-character game code (e.g., "ABC123")
   ├─→ Creates game record in database
   └─→ Creates player 1 (host)

3. User sees lobby screen:
   ├─→ Game code displayed prominently: "ABC123"
   ├─→ "Share this code with friends!"
   ├─→ Player list showing just them
   └─→ "Start Game" button (disabled until 2+ players)

4. WebSocket connection established
   └─→ Listening for other players joining
```

### Flow 2: Join Game

```
1. User clicks "Join Game"
   ├─→ Enters game code: "ABC123"
   └─→ Enters their name

2. Frontend: POST /api/games/join
   ├─→ Backend validates code exists
   ├─→ Checks game not full (< 4 players)
   ├─→ Creates new player record
   └─→ Returns game state

3. All players notified:
   └─→ Socket emits 'player-connected' to all in game

4. User sees lobby with all current players
   └─→ Waiting for host to start game
```

### Flow 3: Game Start

```
1. Host clicks "Start Game"
   ├─→ POST /api/games/:gameId/start
   └─→ Backend initializes game:
       ├─→ Each player chooses running mate (modal)
       ├─→ Shuffle and deal starting hands (7 cards each)
       ├─→ Initialize all state lean markers
       ├─→ Set round to 1
       └─→ Determine random first player

2. All players transition to game board:
   ├─→ US map showing all states
   ├─→ Player's hand displayed at bottom
   ├─→ Turn indicator shows current player
   └─→ Round tracker shows "Round 1"

3. First player's turn begins
   └─→ Action panel enables for that player only
```

### Flow 4: Playing a Card

```
1. Player selects card from hand
   ├─→ Card details modal appears
   └─→ Shows: Effect, Cost, Targets needed

2. If card requires targets:
   ├─→ States on map highlight (clickable)
   ├─→ Or opponent selection appears
   └─→ Player selects targets

3. Click "Play Card"
   ├─→ POST /api/games/:gameId/actions/play-card
   └─→ Backend validates:
       ├─→ Player has enough campaign points
       ├─→ Valid targets selected
       ├─→ Player's turn
       └─→ Card in player's hand

4. If card requires dice:
   ├─→ Animated dice roll shown to all players
   └─→ Result determines effect

5. Effects applied:
   ├─→ State lean markers update (animated)
   ├─→ Campaign points deducted
   ├─→ Card moved to discard pile
   └─→ All players see updates via WebSocket

6. Game log updated:
   └─→ "Alice played Infrastructure Investment in PA, MI, WI"
```

### Flow 5: Debate Round (Rounds 4, 8, 12)

```
1. Round 4 starts:
   └─→ All players see "DEBATE ROUND!" notification

2. Each player shown 3 debate cards:
   ├─→ Knockout Blow (Base 3)
   ├─→ Steady Performance (Base 2)
   └─→ Gaffe Recovery (Base 1)

3. Players select their card (hidden):
   └─→ POST /api/games/:gameId/debate/submit

4. When all players submitted:
   ├─→ Cards revealed simultaneously
   ├─→ All players roll dice (animated)
   ├─→ Totals calculated: Base + Roll
   └─→ Winner determined (highest total)

5. If tie:
   ├─→ Tied players reroll
   └─→ Repeat until winner

6. Effects applied:
   ├─→ Winner gets their "win" effect
   ├─→ Losers get their "lose" effect (if any)
   └─→ State lean markers update

7. Debate cards returned to pool
   └─→ Normal turns resume
```

### Flow 6: Game End

```
1. Victory condition checked after each turn:
   ├─→ Does any player have 270+ electoral votes?
   └─→ OR is it the end of Round 12?

2. If victory condition met:
   ├─→ Socket emits 'game-ended' to all players
   └─→ Game status set to 'completed'

3. Victory screen shown:
   ├─→ Winner announced with confetti animation
   ├─→ Final electoral vote counts
   ├─→ States controlled by each player (colored map)
   ├─→ Game statistics:
       ├─→ Cards played
       ├─→ Campaign points spent
       └─→ Swing states won
   └─→ "Play Again" button (creates new game with same players)
```

---

## 🎲 GAME LOGIC IMPLEMENTATION

### Card Effect Resolution

```typescript
// lib/cardEffects.ts

interface CardEffect {
  leanChanges: Record<string, number>; // state abbr -> lean change
  backlash: Record<string, number>;
  campaignPointChange: number;
  rallyMarkers?: Array<{state: string, duration: number}>;
  specialEffects?: any;
}

function calculateCardEffect(
  card: Card,
  gameState: GameState,
  targets: any,
  diceRoll?: number
): CardEffect {
  const effects: CardEffect = {
    leanChanges: {},
    backlash: {},
    campaignPointChange: -card.cost
  };

  // Handle dice mechanics
  if (card.requires_dice && diceRoll) {
    const outcome = getDiceOutcome(card, diceRoll);
    // Modify effects based on dice result
  }

  // Apply primary effects
  card.target_states.forEach(state => {
    effects.leanChanges[state] = parseEffectValue(card.primary_effect);
  });

  // Apply backlash
  card.backlash_states?.forEach(state => {
    effects.backlash[state] = parseEffectValue(card.backlash);
  });

  // Check for active events that modify effects
  gameState.activeEvents.forEach(event => {
    if (cardMatchesEvent(card, event)) {
      // Modify effects based on event
    }
  });

  return effects;
}

function applyEffects(
  gameState: GameState,
  playerNumber: number,
  effects: CardEffect
): GameState {
  const newState = { ...gameState };

  // Update state leans
  Object.entries(effects.leanChanges).forEach(([stateAbbr, change]) => {
    const state = newState.states.find(s => s.abbreviation === stateAbbr);
    if (state) {
      state.currentLean += change * getLeanModifier(playerNumber);
      state.currentLean = Math.max(-15, Math.min(15, state.currentLean));

      // Check if control changed
      updateStateControl(state, playerNumber);
    }
  });

  // Apply backlash
  Object.entries(effects.backlash).forEach(([stateAbbr, change]) => {
    // Similar to above
  });

  // Update electoral votes
  recalculateElectoralVotes(newState);

  return newState;
}

function getLeanModifier(playerNumber: number): number {
  // Players 1 & 3 are "Blue" (+lean)
  // Players 2 & 4 are "Red" (-lean)
  return [1, -1, 1, -1][playerNumber - 1];
}
```

### State Control Logic

```typescript
function updateStateControl(state: GameState_State, playerNumber: number): void {
  const leanThreshold = 7;

  if (state.currentLean >= leanThreshold) {
    state.controlledBy = getBluePlayerNumbers().find(p => /* closest blue player */);
  } else if (state.currentLean <= -leanThreshold) {
    state.controlledBy = getRedPlayerNumbers().find(p => /* closest red player */);
  } else {
    state.controlledBy = null; // Contested
  }
}

function recalculateElectoralVotes(gameState: GameState): void {
  // Reset all players' electoral votes
  gameState.players.forEach(p => p.electoralVotes = 0);

  // Sum up controlled states
  gameState.states.forEach(state => {
    if (state.controlledBy !== null) {
      const player = gameState.players.find(p => p.playerNumber === state.controlledBy);
      if (player) {
        player.electoralVotes += state.electoralVotes;
      }
    }
  });
}
```

### Turn Management

```typescript
function advanceTurn(gameState: GameState): GameState {
  const newState = { ...gameState };

  // Move to next player
  const currentIndex = gameState.players.findIndex(
    p => p.playerNumber === gameState.currentTurn.playerNumber
  );
  const nextIndex = (currentIndex + 1) % gameState.players.length;
  const nextPlayer = gameState.players[nextIndex];

  newState.currentTurn.playerNumber = nextPlayer.playerNumber;
  newState.currentTurn.phase = 'upkeep';

  // If we're back to player 1, advance round
  if (nextPlayer.playerNumber === 1) {
    newState.currentRound += 1;

    // Check for special rounds
    if ([4, 8, 12].includes(newState.currentRound)) {
      newState.isDebateRound = true;
    }

    // Check for game end
    if (newState.currentRound > 12) {
      newState.status = 'completed';
      determineWinner(newState);
    }
  }

  return newState;
}
```

---

## 🎨 UI/UX DESIGN PATTERNS

### Real-time Feedback

```typescript
// When opponent plays a card, all players see:
function CardPlayedAnimation({ player, card, effects }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-8 max-w-md">
        <h2>{player.name} played {card.name}</h2>

        {/* Show card image */}
        <CardDisplay card={card} />

        {/* Animate state changes */}
        <StateChangesAnimation effects={effects} />

        {/* Dismiss after 3 seconds */}
      </div>
    </div>
  );
}

// State lean changes animate
function StateChangesAnimation({ effects }) {
  return (
    <div className="space-y-2">
      {Object.entries(effects.leanChanges).map(([state, change]) => (
        <div key={state} className="flex items-center gap-2">
          <span className="font-bold">{state}</span>
          <AnimatedNumber value={change} className={change > 0 ? 'text-blue-600' : 'text-red-600'} />
          <span className="text-sm text-gray-600">lean</span>
        </div>
      ))}
    </div>
  );
}
```

### Interactive Map

```typescript
function USMap({ gameState, onStateClick, interactiveStates }) {
  return (
    <svg viewBox="0 0 1000 600" className="w-full h-full">
      {gameState.states.map(state => (
        <StatePolygon
          key={state.abbreviation}
          state={state}
          fillColor={getStateColor(state)}
          onClick={() => interactiveStates?.includes(state.abbreviation) && onStateClick(state)}
          interactive={interactiveStates?.includes(state.abbreviation)}
        />
      ))}
    </svg>
  );
}

function getStateColor(state: GameState_State): string {
  if (state.controlledBy === null) return '#F3F4F6'; // Gray

  const lean = state.currentLean;
  if (lean >= 10) return '#1E40AF'; // Strong Blue
  if (lean >= 7) return '#3B82F6';  // Lean Blue
  if (lean >= 1) return '#93C5FD';  // Light Blue
  if (lean <= -10) return '#B91C1C'; // Strong Red
  if (lean <= -7) return '#EF4444';  // Lean Red
  if (lean <= -1) return '#FCA5A5';  // Light Red
  return '#F3F4F6';
}
```

---

## 🔐 SECURITY & VALIDATION

### Server-side Validation

```typescript
// Always validate on server, never trust client
function validateCardPlay(
  gameId: string,
  playerId: string,
  cardId: string,
  targets: any
): ValidationResult {
  const game = getGame(gameId);
  const player = getPlayer(playerId);

  // Check it's player's turn
  if (game.currentTurn.playerNumber !== player.playerNumber) {
    return { valid: false, error: 'Not your turn' };
  }

  // Check player has the card
  const cardInHand = player.hand.find(c => c.id === cardId);
  if (!cardInHand) {
    return { valid: false, error: 'Card not in hand' };
  }

  // Check player has enough campaign points
  if (player.campaignPoints < cardInHand.cost) {
    return { valid: false, error: 'Insufficient campaign points' };
  }

  // Validate targets
  if (!validateTargets(cardInHand, targets)) {
    return { valid: false, error: 'Invalid targets' };
  }

  return { valid: true };
}
```

### Anti-Cheat Measures

```typescript
// Prevent players from seeing others' hands
function getGameStateForPlayer(gameId: string, playerId: string): GameState {
  const fullState = getGame(gameId);

  return {
    ...fullState,
    players: fullState.players.map(p => ({
      ...p,
      hand: p.id === playerId ? p.hand : { count: p.hand.length } // Hide cards
    }))
  };
}

// All random events (dice, card draws) happen on server
function rollDice(): number {
  return Math.floor(Math.random() * 6) + 1; // Server-side only
}
```

---

## 📱 RESPONSIVE DESIGN

### Mobile Considerations

```typescript
// Detect mobile and adjust layout
function GameBoard() {
  const isMobile = useMediaQuery('(max-width: 768px)');

  if (isMobile) {
    return (
      <div className="flex flex-col h-screen">
        {/* Map takes top 40% */}
        <div className="h-2/5 border-b">
          <USMap compact />
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          <PlayerDashboard />
          <CardHand layout="horizontal-scroll" />
        </div>

        {/* Fixed action buttons */}
        <div className="sticky bottom-0 bg-white border-t p-4">
          <ActionPanel />
        </div>
      </div>
    );
  }

  // Desktop layout
  return (
    <div className="grid grid-cols-12 h-screen">
      <div className="col-span-8">
        <USMap />
      </div>
      <div className="col-span-4">
        <Sidebar />
      </div>
    </div>
  );
}
```

---

## 🚀 DEPLOYMENT STRATEGY

### Recommended Setup

**Option 1: Fully Managed (Easiest)**
```
Frontend: Vercel (free)
├─→ Auto-deploys from GitHub
└─→ Environment variables for API URL

Backend: Railway or Render (free tier)
├─→ Auto-deploys from GitHub
└─→ Environment variables for DB

Database: Supabase (PostgreSQL, free tier)
├─→ 500MB storage
└─→ Built-in auth (if needed later)

Total Cost: $0/month (free tiers)
Upgrade when needed: ~$20-40/month
```

**Option 2: Self-hosted (More control)**
```
VPS: DigitalOcean Droplet ($6/month)
├─→ Docker containers for frontend + backend
└─→ PostgreSQL on same server

Domain: Namecheap (~$10/year)
SSL: Let's Encrypt (free)

Total Cost: ~$7/month
```

### Environment Variables

```bash
# Frontend (.env)
VITE_API_URL=https://api.electoral-strategy.com
VITE_SOCKET_URL=https://api.electoral-strategy.com

# Backend (.env)
DATABASE_URL=postgresql://user:pass@host:5432/electoral_strategy
REDIS_URL=redis://localhost:6379
PORT=3000
NODE_ENV=production
CORS_ORIGIN=https://electoral-strategy.com
```

---

## 📈 SCALABILITY CONSIDERATIONS

### Performance Optimizations

**Database Indexing:**
```sql
-- Critical indexes for fast queries
CREATE INDEX idx_games_status ON games(status) WHERE status = 'in_progress';
CREATE INDEX idx_players_connected ON players(game_id, connected);
CREATE INDEX idx_game_states_controlled ON game_states(game_id, controlled_by);
```

**Caching Strategy:**
```typescript
// Use Redis to cache active game states
async function getGameState(gameId: string): Promise<GameState> {
  // Try cache first
  const cached = await redis.get(`game:${gameId}`);
  if (cached) return JSON.parse(cached);

  // Load from DB
  const gameState = await loadFromDatabase(gameId);

  // Cache for 30 seconds
  await redis.setex(`game:${gameId}`, 30, JSON.stringify(gameState));

  return gameState;
}
```

**Socket.io Rooms:**
```typescript
// Use rooms to limit broadcasts
io.on('connection', (socket) => {
  socket.on('join-game', ({ gameId }) => {
    socket.join(gameId); // Join room

    // Broadcast only to players in this game
    io.to(gameId).emit('player-connected', playerData);
  });
});
```

---

## 🧪 TESTING STRATEGY

### Unit Tests

```typescript
// lib/cardEffects.test.ts
import { calculateCardEffect } from './cardEffects';

describe('Card Effects', () => {
  it('should apply Infrastructure Investment correctly', () => {
    const card = getCard('POL-ECO-002');
    const gameState = createMockGameState();
    const effects = calculateCardEffect(card, gameState, {});

    expect(effects.leanChanges['PA']).toBe(3);
    expect(effects.leanChanges['MI']).toBe(3);
    expect(effects.backlash['TX']).toBe(-1);
  });

  it('should apply dice roll outcomes for Attack Ad', () => {
    const card = getCard('CAM-MED-002');
    const effects1 = calculateCardEffect(card, gameState, {}, 1); // Backfire
    expect(effects1.leanChanges[targetState]).toBe(-1); // Hurts you

    const effects2 = calculateCardEffect(card, gameState, {}, 6); // Devastating
    expect(effects2.leanChanges[targetState]).toBe(-3); // Hurts opponent
  });
});
```

### Integration Tests

```typescript
// api/games.test.ts
describe('Game API', () => {
  it('should create game and return valid code', async () => {
    const response = await request(app)
      .post('/api/games/create')
      .send({ hostName: 'Alice' });

    expect(response.status).toBe(200);
    expect(response.body.gameCode).toMatch(/^[A-Z0-9]{6}$/);
  });

  it('should allow player to join with valid code', async () => {
    const game = await createGame('Alice');

    const response = await request(app)
      .post('/api/games/join')
      .send({ gameCode: game.gameCode, playerName: 'Bob' });

    expect(response.status).toBe(200);
    expect(response.body.player.playerNumber).toBe(2);
  });
});
```

---

## 📝 IMPLEMENTATION ROADMAP

See next document for detailed week-by-week implementation plan.

---

**This technical spec provides the complete foundation for building Electoral Strategy as a web game!**

Next: Implementation roadmap and starter code.
