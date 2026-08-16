import request from 'supertest';
import express from 'express';
import gamesRouter from '../../src/routes/games';

// Mock the database connection
jest.mock('../../src/db/connection', () => ({
  query: jest.fn(),
}));

const { query } = require('../../src/db/connection');

describe('Games API Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/games', gamesRouter);
    jest.clearAllMocks();
  });

  describe('POST /api/games/create', () => {
    it('should create a new game and return game data', async () => {
      const mockGameId = '123e4567-e89b-12d3-a456-426614174000';
      const mockPlayerId = '223e4567-e89b-12d3-a456-426614174000';
      const mockGameCode = 'ABC123';

      // Mock game code check (no existing game with this code)
      query.mockResolvedValueOnce({
        rows: [],
      });

      // Mock game creation
      query.mockResolvedValueOnce({
        rows: [{ id: mockGameId, game_code: mockGameCode, incumbent_party: 'Democrat' }],
      });

      // Mock player creation
      query.mockResolvedValueOnce({
        rows: [{ id: mockPlayerId }],
      });

      // Mock set host player
      query.mockResolvedValueOnce({
        rows: [],
      });

      // Mock initial game states creation (51 states)
      for (let i = 0; i < 51; i++) {
        query.mockResolvedValueOnce({
          rows: [],
        });
      }

      const response = await request(app)
        .post('/api/games/create')
        .send({ playerName: 'Test Player' })
        .expect(201);

      expect(response.body).toHaveProperty('gameId', mockGameId);
      expect(response.body).toHaveProperty('playerId', mockPlayerId);
      expect(response.body).toHaveProperty('gameCode', mockGameCode);
    });

    it('should return 400 if player name is missing', async () => {
      const response = await request(app)
        .post('/api/games/create')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle database errors gracefully', async () => {
      query.mockRejectedValueOnce(new Error('Database connection failed'));

      const response = await request(app)
        .post('/api/games/create')
        .send({ playerName: 'Test Player' })
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/games/join', () => {
    it('should allow a player to join an existing game', async () => {
      const mockGameId = '123e4567-e89b-12d3-a456-426614174000';
      const mockPlayerId = '323e4567-e89b-12d3-a456-426614174000';
      const mockGameCode = 'ABC123';

      // Mock game lookup
      query.mockResolvedValueOnce({
        rows: [{
          id: mockGameId,
          game_code: mockGameCode,
          status: 'lobby',
          settings: { maxPlayers: 4 },
        }],
      });

      // Mock player count check
      query.mockResolvedValueOnce({
        rows: [{ count: '2' }],
      });

      // Mock player creation
      query.mockResolvedValueOnce({
        rows: [{ id: mockPlayerId }],
      });

      const response = await request(app)
        .post('/api/games/join')
        .send({
          gameCode: mockGameCode,
          playerName: 'Second Player',
        })
        .expect(200);

      expect(response.body).toHaveProperty('gameId', mockGameId);
      expect(response.body).toHaveProperty('playerId', mockPlayerId);
    });

    it('should return 404 if game code is not found', async () => {
      query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .post('/api/games/join')
        .send({
          gameCode: 'INVALID',
          playerName: 'Test Player',
        })
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 if game is already in progress', async () => {
      const mockGameId = '123e4567-e89b-12d3-a456-426614174000';

      query.mockResolvedValueOnce({
        rows: [{
          id: mockGameId,
          game_code: 'ABC123',
          status: 'in_progress',
          settings: { maxPlayers: 4 },
        }],
      });

      const response = await request(app)
        .post('/api/games/join')
        .send({
          gameCode: 'ABC123',
          playerName: 'Late Player',
        })
        .expect(400);

      expect(response.body.error).toContain('started');
    });

    it('should return 400 if game is full', async () => {
      const mockGameId = '123e4567-e89b-12d3-a456-426614174000';

      // Mock game lookup
      query.mockResolvedValueOnce({
        rows: [{
          id: mockGameId,
          game_code: 'ABC123',
          status: 'lobby',
          settings: { maxPlayers: 4 },
        }],
      });

      // Mock player count check (already 4 players)
      query.mockResolvedValueOnce({
        rows: [{ count: '4' }],
      });

      const response = await request(app)
        .post('/api/games/join')
        .send({
          gameCode: 'ABC123',
          playerName: 'Fifth Player',
        })
        .expect(400);

      expect(response.body.error).toContain('full');
    });
  });

  describe('GET /api/games/:gameId', () => {
    it('should return game data for valid game ID', async () => {
      const mockGameId = '123e4567-e89b-12d3-a456-426614174000';

      // Mock game lookup
      query.mockResolvedValueOnce({
        rows: [{
          id: mockGameId,
          game_code: 'ABC123',
          status: 'lobby',
          current_round: 0,
        }],
      });

      // Mock players lookup
      query.mockResolvedValueOnce({
        rows: [],
      });

      // Mock game states lookup
      query.mockResolvedValueOnce({
        rows: [],
      });

      const response = await request(app)
        .get(`/api/games/${mockGameId}`)
        .expect(200);

      expect(response.body).toHaveProperty('game');
      expect(response.body.game).toHaveProperty('id', mockGameId);
      expect(response.body.game).toHaveProperty('game_code', 'ABC123');
      expect(response.body).toHaveProperty('players');
      expect(response.body).toHaveProperty('states');
    });

    it('should return 404 for non-existent game', async () => {
      query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .get('/api/games/nonexistent-id')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });
});
