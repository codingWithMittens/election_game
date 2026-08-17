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
