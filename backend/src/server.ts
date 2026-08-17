import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import gamesRouter from './routes/games';
import { initializeSocketHandlers } from './socket/handlers';
import { readFileSync } from 'fs';
import { join } from 'path';
import { query } from './db/connection';

dotenv.config();

// Initialize database on startup
async function initializeDatabase() {
  try {
    console.log('🗄️  Initializing database...');

    // Read and execute schema (idempotent - uses IF NOT EXISTS)
    const schemaPath = join(__dirname, 'db/schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');

    await query(schema);
    console.log('✅ Database schema ready');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    // Don't exit - let server start anyway
    // Tables might already exist from previous deployment
  }
}

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/games', gamesRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Database debug endpoint
app.get('/api/debug/db', async (req, res) => {
  try {
    const result = await query('SELECT NOW() as current_time, current_database() as db_name');
    const tablesResult = await query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    res.json({
      status: 'connected',
      database: result.rows[0],
      tables: tablesResult.rows.map(r => r.table_name),
      env: {
        hasDbUrl: !!process.env.DATABASE_URL,
        nodeEnv: process.env.NODE_ENV
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      env: {
        hasDbUrl: !!process.env.DATABASE_URL,
        nodeEnv: process.env.NODE_ENV
      }
    });
  }
});

// Game creation diagnostic endpoint
app.get('/api/debug/game-create-test', async (req, res) => {
  const steps: any[] = [];
  try {
    // Step 1: Import states data
    steps.push({ step: 1, name: 'Import states data', status: 'starting' });
    const statesDataJson = await import('./data/Electoral_Strategy_States.json');
    const testStatesData = (statesDataJson as any).states;
    steps.push({ step: 1, name: 'Import states data', status: 'success', count: testStatesData.length });

    // Step 2: Test game code generation
    steps.push({ step: 2, name: 'Generate game code', status: 'starting' });
    const { generateGameCode } = await import('./lib/gameCode');
    const testCode = generateGameCode();
    steps.push({ step: 2, name: 'Generate game code', status: 'success', code: testCode });

    // Step 3: Test game insertion
    steps.push({ step: 3, name: 'Insert test game', status: 'starting' });
    const gameResult = await query(
      `INSERT INTO games (game_code, status, incumbent_party)
       VALUES ($1, 'lobby', 'Democrat')
       RETURNING id, game_code`,
      [testCode]
    );
    steps.push({ step: 3, name: 'Insert test game', status: 'success', gameId: gameResult.rows[0].id });

    // Step 4: Test player insertion
    steps.push({ step: 4, name: 'Insert test player', status: 'starting' });
    const playerResult = await query(
      `INSERT INTO players (game_id, player_name, turn_order)
       VALUES ($1, 'TestPlayer', 0)
       RETURNING id`,
      [gameResult.rows[0].id]
    );
    steps.push({ step: 4, name: 'Insert test player', status: 'success', playerId: playerResult.rows[0].id });

    // Step 5: Test game state insertion
    steps.push({ step: 5, name: 'Insert game states', status: 'starting' });
    for (const state of testStatesData.slice(0, 3)) {  // Test with first 3 states
      await query(
        `INSERT INTO game_states (game_id, state_abbr, current_lean)
         VALUES ($1, $2, $3)`,
        [gameResult.rows[0].id, state.abbreviation, state.starting_lean]
      );
    }
    steps.push({ step: 5, name: 'Insert game states', status: 'success', statesInserted: 3 });

    // Clean up
    await query('DELETE FROM games WHERE id = $1', [gameResult.rows[0].id]);

    res.json({ status: 'all_tests_passed', steps });
  } catch (error) {
    steps.push({
      step: 'error',
      name: 'Test failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({ status: 'test_failed', steps });
  }
});

// Initialize Socket.io handlers
initializeSocketHandlers(io);

const PORT = process.env.PORT || 3000;

// Initialize database then start server
initializeDatabase().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`
🎮 Electoral Strategy Server Running!
📡 Server: http://localhost:${PORT}
🔌 WebSocket: ws://localhost:${PORT}
🏥 Health: http://localhost:${PORT}/health
  `);
  });
}).catch((error) => {
  console.error('Failed to initialize:', error);
  process.exit(1);
});

export { io };
