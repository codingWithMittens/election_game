# Testing the Playable PoC

The UI and game logic are now complete! Here's how to test the multiplayer game.

## Prerequisites

Make sure you have:
- PostgreSQL running (local or Supabase)
- Database setup completed (`npm run db:setup` in backend)
- Backend `.env` file configured with `DATABASE_URL`

## Setup Steps

### 1. Install Frontend Dependencies

```bash
cd frontend
npm install
```

### 2. Create Frontend .env File

```bash
cd frontend
cp .env.example .env
```

The default values should work for local development:
```
VITE_API_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000
```

### 3. Start Backend Server

```bash
cd backend
npm run dev
```

You should see:
```
🎮 Electoral Strategy Server Running!
📡 Server: http://localhost:3000
🔌 WebSocket: ws://localhost:3000
🏥 Health: http://localhost:3000/health
```

### 4. Start Frontend Server

In a new terminal:

```bash
cd frontend
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

## Testing the Game Flow

### Test 1: Create and Join Game

1. **Open Browser 1** (normal window)
   - Navigate to http://localhost:5173
   - Click "Create Game"
   - Enter your name (e.g., "Alice")
   - Note the 6-character game code

2. **Open Browser 2** (incognito/private window)
   - Navigate to http://localhost:5173
   - Click "Join Game"
   - Enter the game code from Browser 1
   - Enter your name (e.g., "Bob")

3. **Verify Lobby**
   - Both browsers should show the lobby
   - Both players should appear in the players list
   - Green "Connected" status for both

### Test 2: Start Game

1. **In Browser 1** (host)
   - Click "Start Game" button

2. **Verify Both Browsers**
   - Game board should appear
   - 51 state tiles displayed with colors
   - Electoral vote counts showing (0 for both players)
   - Round 1, Player 1's turn indicated
   - 5 cards visible at bottom of screen

### Test 3: Play Cards

1. **In Browser 1** (Player 1's turn)
   - Click on a card in your hand at the bottom
   - Card should highlight with yellow ring
   - Click on a state tile (e.g., Pennsylvania)
   - State should highlight
   - Click "Play Card" button

2. **Verify Both Browsers**
   - State lean value should update
   - State color may change
   - Card should disappear from hand
   - Both players see the updated map

3. **In Browser 1**
   - Click "End Turn" button

4. **Verify Both Browsers**
   - Turn should switch to Player 2
   - Browser 2 can now play cards
   - Browser 1 sees "Wait for your turn" message

### Test 4: Continue Playing

1. **In Browser 2** (Player 2's turn)
   - Select a card
   - Select a state
   - Play the card
   - End turn

2. **Repeat several turns**
   - Take turns playing cards
   - Watch states change color as lean values shift
   - When a state reaches ±7 lean, electoral votes should be awarded

### Expected Behaviors

✅ **Lobby**
- Real-time player list updates
- Host can start with 2+ players
- Non-host sees "waiting" message

✅ **Game Board**
- All 51 states displayed in grid
- Colors range from dark blue (strong blue) to dark red (strong red)
- Electoral vote counts visible
- Current turn clearly indicated

✅ **Card Playing**
- Can only play on your turn
- Card selection highlights card
- State selection highlights state
- "Play Card" button only appears when both selected
- Error messages for invalid actions

✅ **Turn Management**
- Turn automatically advances when "End Turn" clicked
- Round increments after all players take a turn
- New card drawn at start of turn

✅ **Real-time Sync**
- All players see changes immediately
- State updates visible to all
- Turn changes visible to all

## Common Issues

### Frontend won't start
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Backend database error
```bash
cd backend
npm run db:setup
```

### WebSocket not connecting
- Check backend is running on port 3000
- Check VITE_SOCKET_URL in frontend/.env
- Check browser console for errors

### States not updating
- Check browser console for errors
- Check backend console for socket events
- Verify PostgreSQL connection

## What's Working

✅ Game creation with unique codes
✅ Multiplayer join via code
✅ Real-time lobby with player list
✅ Game start with initial hands (5 cards each)
✅ Turn-based card playing
✅ State lean updates
✅ State color visualization
✅ Turn management
✅ Round tracking
✅ WebSocket synchronization

## Known Limitations (PoC)

- No electoral vote calculation yet (shows 0)
- Simplified card effect parsing (only lean changes)
- No media points system
- No dice rolling for cards that require it
- No victory detection
- No running mate selection
- No event cards
- No game over screen
- Cards don't check target state restrictions

## Next Steps for Full Game

1. Implement full card effect parsing
2. Add media points and cost checking
3. Add dice rolling mechanic
4. Calculate electoral votes based on state control (±7 threshold)
5. Implement victory detection (270 votes)
6. Add running mate selection
7. Add event card system
8. Add game log/history
9. Mobile responsive design improvements
10. Add animations and sound effects

## Success Criteria for PoC

You've successfully tested the PoC if:
- ✅ Two players can join a game
- ✅ Both see the lobby update in real-time
- ✅ Game starts and shows cards
- ✅ Players can take turns playing cards
- ✅ State lean values update
- ✅ State colors change
- ✅ Both players see updates immediately

Enjoy your multiplayer Electoral Strategy game! 🎮🗳️
