-- Electoral Strategy Database Schema
-- PostgreSQL 14+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Games table
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_code VARCHAR(6) UNIQUE NOT NULL,
  host_player_id UUID,
  status VARCHAR(20) NOT NULL DEFAULT 'lobby', -- lobby, in_progress, completed
  current_round INTEGER DEFAULT 0,
  current_turn_player_id UUID,
  cards_played_this_turn INTEGER DEFAULT 0,
  settings JSONB DEFAULT '{"maxPlayers": 4, "startingHandSize": 5}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP,
  completed_at TIMESTAMP
);

-- Players table
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player_name VARCHAR(100) NOT NULL,
  party VARCHAR(20) CHECK (party IN ('Democrat', 'Republican')),
  turn_order INTEGER,
  running_mate VARCHAR(100),
  electoral_votes INTEGER DEFAULT 0,
  media_points INTEGER DEFAULT 0,
  rally_markers JSONB DEFAULT '{}',
  is_connected BOOLEAN DEFAULT true,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(game_id, turn_order)
);

-- Player hands (cards currently held by players)
CREATE TABLE player_hands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  card_id VARCHAR(50) NOT NULL,
  drawn_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Game states (current lean/control of each state)
CREATE TABLE game_states (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  state_abbr VARCHAR(2) NOT NULL,
  current_lean INTEGER DEFAULT 0, -- -15 to +15
  controlling_player_id UUID REFERENCES players(id),
  UNIQUE(game_id, state_abbr)
);

-- Active events (event cards currently affecting the game)
CREATE TABLE active_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  card_id VARCHAR(50) NOT NULL,
  severity INTEGER, -- dice result for events
  rounds_remaining INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Game log (history of all actions)
CREATE TABLE game_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  round INTEGER NOT NULL,
  player_id UUID REFERENCES players(id),
  action_type VARCHAR(50) NOT NULL, -- play_card, end_turn, debate, etc.
  action_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Discard pile
CREATE TABLE discard_pile (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  card_id VARCHAR(50) NOT NULL,
  discarded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_games_game_code ON games(game_code);
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_players_game_id ON players(game_id);
CREATE INDEX idx_player_hands_player_id ON player_hands(player_id);
CREATE INDEX idx_game_states_game_id ON game_states(game_id);
CREATE INDEX idx_active_events_game_id ON active_events(game_id);
CREATE INDEX idx_game_log_game_id ON game_log(game_id);
CREATE INDEX idx_discard_pile_game_id ON discard_pile(game_id);
