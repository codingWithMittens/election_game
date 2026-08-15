import {
  calculateElectoralVotes,
  getControllingPlayer,
  checkVictory,
  canPlayCard,
  getLeanCategory,
  getStateColor,
  rollDie
} from '../../src/lib/gameLogic';
import { GameState, Player } from '../../src/types';

describe('Game Logic Tests', () => {
  const mockPlayers: Player[] = [
    {
      id: 'player-1',
      game_id: 'game-1',
      player_name: 'Alice',
      party: 'Democrat',
      turn_order: 0,
      running_mate: null,
      electoral_votes: 0,
      media_points: 10,
      rally_markers: {},
      is_connected: true,
      joined_at: new Date(),
    },
    {
      id: 'player-2',
      game_id: 'game-1',
      player_name: 'Bob',
      party: 'Republican',
      turn_order: 1,
      running_mate: null,
      electoral_votes: 0,
      media_points: 10,
      rally_markers: {},
      is_connected: true,
      joined_at: new Date(),
    },
  ];

  describe('getControllingPlayer', () => {
    it('should return first player for lean >= 7', () => {
      expect(getControllingPlayer(7, mockPlayers)).toBe('player-1');
      expect(getControllingPlayer(10, mockPlayers)).toBe('player-1');
      expect(getControllingPlayer(15, mockPlayers)).toBe('player-1');
    });

    it('should return second player for lean <= -7', () => {
      expect(getControllingPlayer(-7, mockPlayers)).toBe('player-2');
      expect(getControllingPlayer(-10, mockPlayers)).toBe('player-2');
      expect(getControllingPlayer(-15, mockPlayers)).toBe('player-2');
    });

    it('should return null for toss-up states', () => {
      expect(getControllingPlayer(0, mockPlayers)).toBeNull();
      expect(getControllingPlayer(3, mockPlayers)).toBeNull();
      expect(getControllingPlayer(-3, mockPlayers)).toBeNull();
      expect(getControllingPlayer(6, mockPlayers)).toBeNull();
      expect(getControllingPlayer(-6, mockPlayers)).toBeNull();
    });
  });

  describe('calculateElectoralVotes', () => {
    it('should calculate correct electoral votes', () => {
      const gameStates: GameState[] = [
        {
          id: 'state-1',
          game_id: 'game-1',
          state_abbr: 'CA',
          current_lean: 10,
          controlling_player_id: 'player-1',
        },
        {
          id: 'state-2',
          game_id: 'game-1',
          state_abbr: 'TX',
          current_lean: -10,
          controlling_player_id: 'player-2',
        },
      ];

      const result = calculateElectoralVotes(gameStates, mockPlayers);

      expect(result['player-1']).toBe(54); // California
      expect(result['player-2']).toBe(40); // Texas
    });

    it('should not count toss-up states', () => {
      const gameStates: GameState[] = [
        {
          id: 'state-1',
          game_id: 'game-1',
          state_abbr: 'CA',
          current_lean: 0,
          controlling_player_id: null,
        },
      ];

      const result = calculateElectoralVotes(gameStates, mockPlayers);

      expect(result['player-1']).toBe(0);
      expect(result['player-2']).toBe(0);
    });
  });

  describe('checkVictory', () => {
    it('should return winner when player has >= 270 votes', () => {
      const votes = {
        'player-1': 270,
        'player-2': 268,
      };

      expect(checkVictory(votes)).toBe('player-1');
    });

    it('should return null when no player has reached 270', () => {
      const votes = {
        'player-1': 200,
        'player-2': 180,
      };

      expect(checkVictory(votes)).toBeNull();
    });
  });

  describe('canPlayCard', () => {
    it('should allow playing card when in hand and enough media points', () => {
      const result = canPlayCard('card-1', 'player-1', ['card-1', 'card-2'], 10, 5);
      expect(result.valid).toBe(true);
    });

    it('should reject card not in hand', () => {
      const result = canPlayCard('card-3', 'player-1', ['card-1', 'card-2'], 10, 5);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Card not in hand');
    });

    it('should reject when not enough media points', () => {
      const result = canPlayCard('card-1', 'player-1', ['card-1'], 3, 5);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Not enough media points');
    });
  });

  describe('getLeanCategory', () => {
    it('should return correct categories for positive leans', () => {
      expect(getLeanCategory(15)).toBe('Strong Blue');
      expect(getLeanCategory(8)).toBe('Lean Blue');
      expect(getLeanCategory(4)).toBe('Tilt Blue');
    });

    it('should return Toss-up for neutral leans', () => {
      expect(getLeanCategory(0)).toBe('Toss-up');
      expect(getLeanCategory(2)).toBe('Toss-up');
      expect(getLeanCategory(-2)).toBe('Toss-up');
    });

    it('should return correct categories for negative leans', () => {
      expect(getLeanCategory(-4)).toBe('Tilt Red');
      expect(getLeanCategory(-8)).toBe('Lean Red');
      expect(getLeanCategory(-15)).toBe('Strong Red');
    });
  });

  describe('getStateColor', () => {
    it('should return blue colors for positive leans', () => {
      expect(getStateColor(15)).toBe('#1e40af');
      expect(getStateColor(8)).toBe('#3b82f6');
      expect(getStateColor(4)).toBe('#93c5fd');
    });

    it('should return gray for toss-up', () => {
      expect(getStateColor(0)).toBe('#d1d5db');
    });

    it('should return red colors for negative leans', () => {
      expect(getStateColor(-4)).toBe('#fca5a5');
      expect(getStateColor(-8)).toBe('#ef4444');
      expect(getStateColor(-15)).toBe('#991b1b');
    });
  });

  describe('rollDie', () => {
    it('should return a number between 1 and 6', () => {
      for (let i = 0; i < 100; i++) {
        const roll = rollDie();
        expect(roll).toBeGreaterThanOrEqual(1);
        expect(roll).toBeLessThanOrEqual(6);
        expect(Number.isInteger(roll)).toBe(true);
      }
    });
  });
});
