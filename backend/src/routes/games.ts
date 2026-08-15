import { Router, Request, Response } from 'express';
import { query } from '../db/connection';
import { generateGameCode } from '../lib/gameCode';
import { CreateGameRequest, JoinGameRequest, State } from '../types';
import statesDataJson from '../data/Electoral_Strategy_States.json';

const statesData: State[] = (statesDataJson as any).states;

const router = Router();

/**
 * POST /api/games/create
 * Creates a new game and adds the host player
 */
router.post('/create', async (req: Request, res: Response) => {
  try {
    const { playerName } = req.body as CreateGameRequest;

    if (!playerName || playerName.trim().length === 0) {
      return res.status(400).json({ error: 'Player name is required' });
    }

    // Generate unique game code
    let gameCode = generateGameCode();
    let codeExists = true;
    
    while (codeExists) {
      const result = await query('SELECT id FROM games WHERE game_code = $1', [gameCode]);
      if (result.rows.length === 0) {
        codeExists = false;
      } else {
        gameCode = generateGameCode();
      }
    }

    // Create game
    const gameResult = await query(
      `INSERT INTO games (game_code, status) 
       VALUES ($1, 'lobby') 
       RETURNING id, game_code`,
      [gameCode]
    );

    const game = gameResult.rows[0];

    // Create host player
    const playerResult = await query(
      `INSERT INTO players (game_id, player_name, turn_order) 
       VALUES ($1, $2, 0) 
       RETURNING id`,
      [game.id, playerName.trim()]
    );

    const player = playerResult.rows[0];

    // Set host player
    await query(
      'UPDATE games SET host_player_id = $1 WHERE id = $2',
      [player.id, game.id]
    );

    // Initialize game states with starting lean values
    for (const state of statesData) {
      await query(
        `INSERT INTO game_states (game_id, state_abbr, current_lean) 
         VALUES ($1, $2, $3)`,
        [game.id, state.abbreviation, state.starting_lean]
      );
    }

    res.json({
      gameId: game.id,
      gameCode: game.game_code,
      playerId: player.id
    });
  } catch (error) {
    console.error('Error creating game:', error);
    res.status(500).json({ error: 'Failed to create game' });
  }
});

/**
 * POST /api/games/join
 * Joins an existing game
 */
router.post('/join', async (req: Request, res: Response) => {
  try {
    const { gameCode, playerName } = req.body as JoinGameRequest;

    if (!gameCode || !playerName) {
      return res.status(400).json({ error: 'Game code and player name are required' });
    }

    // Find game
    const gameResult = await query(
      'SELECT id, status, settings FROM games WHERE game_code = $1',
      [gameCode.toUpperCase()]
    );

    if (gameResult.rows.length === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }

    const game = gameResult.rows[0];

    if (game.status !== 'lobby') {
      return res.status(400).json({ error: 'Game has already started' });
    }

    // Check player count
    const playerCountResult = await query(
      'SELECT COUNT(*) as count FROM players WHERE game_id = $1',
      [game.id]
    );

    const playerCount = parseInt(playerCountResult.rows[0].count);
    const maxPlayers = game.settings.maxPlayers || 4;

    if (playerCount >= maxPlayers) {
      return res.status(400).json({ error: 'Game is full' });
    }

    // Add player
    const playerResult = await query(
      `INSERT INTO players (game_id, player_name, turn_order) 
       VALUES ($1, $2, $3) 
       RETURNING id`,
      [game.id, playerName.trim(), playerCount]
    );

    const player = playerResult.rows[0];

    res.json({
      gameId: game.id,
      playerId: player.id
    });
  } catch (error) {
    console.error('Error joining game:', error);
    res.status(500).json({ error: 'Failed to join game' });
  }
});

/**
 * GET /api/games/:gameId
 * Gets game details
 */
router.get('/:gameId', async (req: Request, res: Response) => {
  try {
    const { gameId } = req.params;

    const gameResult = await query(
      'SELECT * FROM games WHERE id = $1',
      [gameId]
    );

    if (gameResult.rows.length === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }

    const game = gameResult.rows[0];

    // Get players
    const playersResult = await query(
      'SELECT * FROM players WHERE game_id = $1 ORDER BY turn_order',
      [gameId]
    );

    // Get game states
    const statesResult = await query(
      'SELECT * FROM game_states WHERE game_id = $1',
      [gameId]
    );

    res.json({
      game,
      players: playersResult.rows,
      states: statesResult.rows
    });
  } catch (error) {
    console.error('Error fetching game:', error);
    res.status(500).json({ error: 'Failed to fetch game' });
  }
});

export default router;
