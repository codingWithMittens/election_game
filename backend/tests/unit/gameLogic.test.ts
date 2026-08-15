import {
  calculateElectoralVotes,
  getControllingPlayer,
  checkVictory,
  canPlayCard,
  applyCardEffect
} from '../../src/lib/gameLogic';

describe('Game Logic - Electoral Vote Calculation', () => {
  const mockStatesData = [
    { abbreviation: 'CA', electoral_votes: 54, starting_lean: 10 },
    { abbreviation: 'TX', electoral_votes: 40, starting_lean: -10 },
    { abbreviation: 'FL', electoral_votes: 30, starting_lean: 0 },
    { abbreviation: 'PA', electoral_votes: 19, starting_lean: 2 },
  ];

  describe('getControllingPlayer', () => {
    it('should return player 0 for lean >= 7', () => {
      expect(getControllingPlayer(7, 'player-0', 'player-1')).toBe('player-0');
      expect(getControllingPlayer(10, 'player-0', 'player-1')).toBe('player-0');
      expect(getControllingPlayer(15, 'player-0', 'player-1')).toBe('player-0');
    });

    it('should return player 1 for lean <= -7', () => {
      expect(getControllingPlayer(-7, 'player-0', 'player-1')).toBe('player-1');
      expect(getControllingPlayer(-10, 'player-0', 'player-1')).toBe('player-1');
      expect(getControllingPlayer(-15, 'player-0', 'player-1')).toBe('player-1');
    });

    it('should return null for toss-up states (-6 to 6)', () => {
      expect(getControllingPlayer(0, 'player-0', 'player-1')).toBeNull();
      expect(getControllingPlayer(3, 'player-0', 'player-1')).toBeNull();
      expect(getControllingPlayer(-3, 'player-0', 'player-1')).toBeNull();
      expect(getControllingPlayer(6, 'player-0', 'player-1')).toBeNull();
      expect(getControllingPlayer(-6, 'player-0', 'player-1')).toBeNull();
    });
  });

  describe('calculateElectoralVotes', () => {
    it('should calculate correct electoral votes for controlled states', () => {
      const gameStates = [
        { state_abbr: 'CA', current_lean: 10, controlling_player_id: 'player-0' },
        { state_abbr: 'TX', current_lean: -10, controlling_player_id: 'player-1' },
        { state_abbr: 'FL', current_lean: 3, controlling_player_id: null },
        { state_abbr: 'PA', current_lean: 8, controlling_player_id: 'player-0' },
      ];

      const result = calculateElectoralVotes(gameStates, mockStatesData);

      expect(result['player-0']).toBe(73); // CA (54) + PA (19)
      expect(result['player-1']).toBe(40); // TX (40)
    });

    it('should not count toss-up states', () => {
      const gameStates = [
        { state_abbr: 'CA', current_lean: 0, controlling_player_id: null },
        { state_abbr: 'TX', current_lean: 5, controlling_player_id: null },
        { state_abbr: 'FL', current_lean: -6, controlling_player_id: null },
        { state_abbr: 'PA', current_lean: 6, controlling_player_id: null },
      ];

      const result = calculateElectoralVotes(gameStates, mockStatesData);

      expect(result['player-0'] || 0).toBe(0);
      expect(result['player-1'] || 0).toBe(0);
    });

    it('should handle empty game states', () => {
      const result = calculateElectoralVotes([], mockStatesData);
      expect(Object.keys(result).length).toBe(0);
    });
  });

  describe('checkVictory', () => {
    it('should return winner when player has >= 270 electoral votes', () => {
      const players = [
        { id: 'player-0', electoral_votes: 270 },
        { id: 'player-1', electoral_votes: 268 },
      ];

      expect(checkVictory(players as any)).toBe('player-0');
    });

    it('should return null when no player has reached 270', () => {
      const players = [
        { id: 'player-0', electoral_votes: 200 },
        { id: 'player-1', electoral_votes: 180 },
      ];

      expect(checkVictory(players as any)).toBeNull();
    });

    it('should return first player to reach 270 in case of tie', () => {
      const players = [
        { id: 'player-0', electoral_votes: 280 },
        { id: 'player-1', electoral_votes: 280 },
      ];

      expect(checkVictory(players as any)).toBe('player-0');
    });
  });

  describe('canPlayCard', () => {
    const mockCard = {
      id: 'card-1',
      name: 'Test Card',
      type: 'strategy' as const,
      description: 'Test',
      effect: '+2 lean',
      target: 'single' as const,
      dice_mechanic: null,
    };

    it('should allow playing card when targets are provided for single target card', () => {
      expect(canPlayCard(mockCard, ['CA'])).toBe(true);
    });

    it('should reject playing single target card without targets', () => {
      expect(canPlayCard(mockCard, [])).toBe(false);
    });

    it('should allow playing all states card without targets', () => {
      const allStatesCard = { ...mockCard, target: 'all_states' as const };
      expect(canPlayCard(allStatesCard, [])).toBe(true);
    });

    it('should allow playing region card with region target', () => {
      const regionCard = { ...mockCard, target: 'region' as const };
      expect(canPlayCard(regionCard, ['Midwest'])).toBe(true);
    });
  });

  describe('applyCardEffect', () => {
    it('should parse and apply positive lean change', () => {
      const card = {
        id: 'card-1',
        name: 'Campaign Rally',
        type: 'strategy' as const,
        description: 'Boost support',
        effect: '+3 lean to target state',
        target: 'single' as const,
        dice_mechanic: null,
      };

      const result = applyCardEffect(card, ['CA'], 1);

      expect(result.leanChanges).toHaveLength(1);
      expect(result.leanChanges[0].state).toBe('CA');
      expect(result.leanChanges[0].amount).toBe(3);
    });

    it('should parse and apply negative lean change', () => {
      const card = {
        id: 'card-2',
        name: 'Opposition Attack',
        type: 'strategy' as const,
        description: 'Reduce opponent support',
        effect: '-2 lean to target state',
        target: 'single' as const,
        dice_mechanic: null,
      };

      const result = applyCardEffect(card, ['TX'], 1);

      expect(result.leanChanges).toHaveLength(1);
      expect(result.leanChanges[0].state).toBe('TX');
      expect(result.leanChanges[0].amount).toBe(-2);
    });

    it('should multiply effect by dice roll when dice mechanic exists', () => {
      const card = {
        id: 'card-3',
        name: 'Media Blitz',
        type: 'event' as const,
        description: 'Roll for impact',
        effect: '+1 lean (multiplied by dice)',
        target: 'single' as const,
        dice_mechanic: { type: 'multiply', outcomes: [] },
      };

      const result = applyCardEffect(card, ['FL'], 5); // Dice roll = 5

      expect(result.leanChanges).toHaveLength(1);
      expect(result.leanChanges[0].state).toBe('FL');
      expect(result.leanChanges[0].amount).toBe(5); // 1 * 5
    });

    it('should handle multiple target states', () => {
      const card = {
        id: 'card-4',
        name: 'Regional Campaign',
        type: 'strategy' as const,
        description: 'Target multiple states',
        effect: '+2 lean',
        target: 'multi' as const,
        dice_mechanic: null,
      };

      const result = applyCardEffect(card, ['CA', 'OR', 'WA'], 1);

      expect(result.leanChanges).toHaveLength(3);
      expect(result.leanChanges.map(c => c.state)).toEqual(['CA', 'OR', 'WA']);
      result.leanChanges.forEach(change => {
        expect(change.amount).toBe(2);
      });
    });
  });
});
