import { GameState, Player, State } from '../types';
import statesDataJson from '../data/Electoral_Strategy_States.json';

const statesData = (statesDataJson as any).states as State[];

/**
 * Calculates electoral votes for each player based on state control
 */
export function calculateElectoralVotes(gameStates: GameState[], players: Player[]): Record<string, number> {
  const votes: Record<string, number> = {};

  // Initialize all players to 0
  players.forEach(p => votes[p.id] = 0);

  gameStates.forEach(gs => {
    const state = statesData.find(s => s.abbreviation === gs.state_abbr);
    if (!state) return;

    // Control threshold is ±7
    // Positive lean = Democrat control, Negative lean = Republican control
    if (gs.current_lean >= 7) {
      // Democrats control this state
      const democrat = players.find(p => p.party === 'Democrat');
      if (democrat) {
        votes[democrat.id] = (votes[democrat.id] || 0) + state.electoral_votes;
      }
    } else if (gs.current_lean <= -7) {
      // Republicans control this state
      const republican = players.find(p => p.party === 'Republican');
      if (republican) {
        votes[republican.id] = (votes[republican.id] || 0) + state.electoral_votes;
      }
    }
  });

  return votes;
}

/**
 * Determines the controlling player for a state based on lean
 */
export function getControllingPlayer(lean: number, players: Player[]): string | null {
  if (Math.abs(lean) < 7) {
    return null; // No control
  }

  // In a 2-player game, positive lean = player 0, negative = player 1
  // This is simplified; full implementation would track party affiliation
  if (lean >= 7) {
    return players[0]?.id || null;
  } else {
    return players[1]?.id || null;
  }
}

/**
 * Checks if any player has won (270+ electoral votes)
 */
export function checkVictory(electoralVotes: Record<string, number>): string | null {
  for (const [playerId, votes] of Object.entries(electoralVotes)) {
    if (votes >= 270) {
      return playerId;
    }
  }
  return null;
}

/**
 * Rolls a die (1-6)
 */
export function rollDie(): number {
  return Math.floor(Math.random() * 6) + 1;
}

/**
 * Gets the lean category for display
 */
export function getLeanCategory(lean: number): string {
  if (lean >= 10) return 'Strong Blue';
  if (lean >= 7) return 'Lean Blue';
  if (lean >= 3) return 'Tilt Blue';
  if (lean > -3) return 'Toss-up';
  if (lean > -7) return 'Tilt Red';
  if (lean > -10) return 'Lean Red';
  return 'Strong Red';
}

/**
 * Gets color for state based on lean
 */
export function getStateColor(lean: number): string {
  if (lean >= 10) return '#1e40af'; // Strong Blue
  if (lean >= 7) return '#3b82f6';  // Lean Blue
  if (lean >= 3) return '#93c5fd';  // Tilt Blue
  if (lean > -3) return '#d1d5db'; // Toss-up
  if (lean > -7) return '#fca5a5'; // Tilt Red
  if (lean > -10) return '#ef4444'; // Lean Red
  return '#991b1b'; // Strong Red
}

/**
 * Validates if a card can be played
 */
export function canPlayCard(
  cardId: string,
  playerId: string,
  playerHand: string[],
  mediaPoints: number,
  cardCost: number
): { valid: boolean; reason?: string } {
  if (!playerHand.includes(cardId)) {
    return { valid: false, reason: 'Card not in hand' };
  }

  if (mediaPoints < cardCost) {
    return { valid: false, reason: 'Not enough media points' };
  }

  return { valid: true };
}

/**
 * Applies a card effect to game states
 */
export function applyCardEffect(
  cardEffect: string,
  targetStates: string[],
  gameStates: GameState[],
  diceRoll?: number
): GameState[] {
  const updatedStates = [...gameStates];

  // Parse effect (simplified - real implementation would be more robust)
  const leanMatch = cardEffect.match(/([+-]\d+)/);
  if (!leanMatch) return updatedStates;

  let leanChange = parseInt(leanMatch[1]);

  // Apply dice modifier if present
  if (diceRoll) {
    leanChange = leanChange * diceRoll;
  }

  targetStates.forEach(stateAbbr => {
    const stateIndex = updatedStates.findIndex(s => s.state_abbr === stateAbbr);
    if (stateIndex !== -1) {
      updatedStates[stateIndex] = {
        ...updatedStates[stateIndex],
        current_lean: Math.max(-15, Math.min(15, updatedStates[stateIndex].current_lean + leanChange))
      };
    }
  });

  return updatedStates;
}

/**
 * Determines if it's a debate round
 */
export function isDebateRound(round: number): boolean {
  return round === 4 || round === 8 || round === 12;
}

/**
 * Shuffles an array (Fisher-Yates algorithm)
 */
export function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
