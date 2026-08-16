export interface Game {
  id: string;
  game_code: string;
  host_player_id: string;
  status: 'lobby' | 'in_progress' | 'completed';
  current_round: number;
  current_turn_player_id: string | null;
  incumbent_party: 'Democrat' | 'Republican' | null;
  settings: {
    maxPlayers: number;
    startingHandSize: number;
  };
  created_at: Date;
  started_at: Date | null;
  completed_at: Date | null;
}

export interface Player {
  id: string;
  game_id: string;
  player_name: string;
  party: 'Democrat' | 'Republican' | null;
  turn_order: number | null;
  running_mate: string | null;
  electoral_votes: number;
  media_points: number;
  rally_markers: Record<string, number>;
  is_connected: boolean;
  joined_at: Date;
}

export interface Card {
  id: string;
  name: string;
  type: string;
  subtype: string;
  cost: number;
  primary_effect: string;
  backlash: string;
  special: string | null;
  requires_dice: boolean;
  dice_mechanic: string | DiceMechanic | null;
  flavor_text: string;
  target_states: string[];
  backlash_states: string[];
}

export interface DiceMechanic {
  type: string;
  outcomes?: Array<{ roll: number | number[]; result: string }>;
  base_value?: number;
  when?: string;
}

export interface State {
  abbreviation: string;
  name: string;
  electoral_votes: number;
  starting_lean: number;
  lean_category: string;
  priority_issues: string[];
  region: string;
}

export interface GameState {
  id: string;
  game_id: string;
  state_abbr: string;
  current_lean: number;
  controlling_player_id: string | null;
}

export interface CreateGameRequest {
  playerName: string;
}

export interface JoinGameRequest {
  gameCode: string;
  playerName: string;
}

export interface CreateGameResponse {
  gameId: string;
  gameCode: string;
  playerId: string;
}

export interface JoinGameResponse {
  gameId: string;
  playerId: string;
}
