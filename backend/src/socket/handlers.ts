import { Server, Socket } from 'socket.io';
import { query } from '../db/connection';
import cardsDataJson from '../data/Electoral_Strategy_Cards.json';
import { Card } from '../types';
import { calculateElectoralVotes } from '../lib/gameLogic';
import { validateStateSelection, getCardSelectionRules } from '../lib/cardRules';

const cardsData = (cardsDataJson as any).cards as Card[];

interface JoinRoomData {
  gameId: string;
  playerId: string;
}

interface StartGameData {
  gameId: string;
}

interface PlayCardData {
  gameId: string;
  playerId: string;
  cardId: string;
  targetStates?: string[];
  diceRoll?: number | null;
}

interface EndTurnData {
  gameId: string;
  playerId: string;
}

interface EndGameData {
  gameId: string;
  playerId: string;
}

export function initializeSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log('Client connected:', socket.id);

    /**
     * Join a game room
     */
    socket.on('join_room', async (data: JoinRoomData) => {
      const { gameId, playerId } = data;
      
      socket.join(gameId);
      
      // Mark player as connected
      await query(
        'UPDATE players SET is_connected = true WHERE id = $1',
        [playerId]
      );

      // Get current game state
      const gameResult = await query('SELECT * FROM games WHERE id = $1', [gameId]);
      const playersResult = await query(
        'SELECT * FROM players WHERE game_id = $1 ORDER BY turn_order',
        [gameId]
      );
      const statesResult = await query(
        'SELECT * FROM game_states WHERE game_id = $1',
        [gameId]
      );

      // Get player's hand if game is in progress
      const game = gameResult.rows[0];
      if (game.status === 'in_progress') {
        const handResult = await query(
          'SELECT card_id FROM player_hands WHERE player_id = $1 ORDER BY drawn_at ASC',
          [playerId]
        );

        const hand = handResult.rows.map(row =>
          cardsData.find(c => c.id === row.card_id)
        );

        // Send hand to the specific player
        socket.emit('hand_updated', {
          playerId,
          hand
        });
      }

      // Broadcast player joined
      io.to(gameId).emit('player_joined', {
        players: playersResult.rows
      });

      // Send current state to joining player
      socket.emit('game_state', {
        game: gameResult.rows[0],
        players: playersResult.rows,
        states: statesResult.rows
      });
    });

    /**
     * Start the game
     */
    socket.on('start_game', async (data: StartGameData) => {
      const { gameId } = data;

      try {
        // Get players
        const playersResult = await query(
          'SELECT * FROM players WHERE game_id = $1 ORDER BY turn_order',
          [gameId]
        );

        const players = playersResult.rows;

        if (players.length < 2) {
          socket.emit('error', { message: 'Need at least 2 players to start' });
          return;
        }

        // Assign parties (alternating Democrat/Republican)
        const parties = ['Democrat', 'Republican'];
        for (let i = 0; i < players.length; i++) {
          const party = parties[i % 2];
          console.log(`Assigning party ${party} to player ${players[i].id}`);
          await query(
            'UPDATE players SET party = $1 WHERE id = $2',
            [party, players[i].id]
          );
        }

        // Re-fetch players to get updated party assignments
        const updatedPlayersResult = await query(
          'SELECT * FROM players WHERE game_id = $1 ORDER BY turn_order',
          [gameId]
        );
        const updatedPlayers = updatedPlayersResult.rows;
        console.log('Updated players with parties:', updatedPlayers);

        // Update game status
        await query(
          `UPDATE games
           SET status = 'in_progress',
               started_at = CURRENT_TIMESTAMP,
               current_round = 1,
               current_turn_player_id = $1
           WHERE id = $2`,
          [updatedPlayers[0].id, gameId]
        );

        // Deal initial hands (exclude event cards from main deck)
        const deck = cardsData.filter(card => card.type !== 'Event');
        const shuffledDeck = [...deck];
        const startingHandSize = 5;

        for (const player of updatedPlayers) {
          for (let i = 0; i < startingHandSize; i++) {
            if (shuffledDeck.length > 0) {
              const randomIndex = Math.floor(Math.random() * shuffledDeck.length);
              const card = shuffledDeck.splice(randomIndex, 1)[0];

              await query(
                'INSERT INTO player_hands (player_id, card_id) VALUES ($1, $2)',
                [player.id, card.id]
              );
            }
          }
        }

        // Get updated game state
        const gameResult = await query('SELECT * FROM games WHERE id = $1', [gameId]);
        const statesResult = await query(
          'SELECT * FROM game_states WHERE game_id = $1',
          [gameId]
        );

        // Get player hands
        const hands: Record<string, any[]> = {};
        for (const player of updatedPlayers) {
          const handResult = await query(
            'SELECT card_id FROM player_hands WHERE player_id = $1 ORDER BY drawn_at ASC',
            [player.id]
          );
          hands[player.id] = handResult.rows.map(row =>
            cardsData.find(c => c.id === row.card_id)
          );
        }

        // Broadcast game started
        io.to(gameId).emit('game_started', {
          game: gameResult.rows[0],
          players: updatedPlayers,
          states: statesResult.rows
        });

        // Send hands to each player
        for (const player of updatedPlayers) {
          io.to(gameId).emit('hand_updated', {
            playerId: player.id,
            hand: hands[player.id]
          });
        }
      } catch (error) {
        console.error('Error starting game:', error);
        console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
        socket.emit('error', { message: 'Failed to start game' });
      }
    });

    /**
     * Play a card
     */
    socket.on('play_card', async (data: PlayCardData) => {
      const { gameId, playerId, cardId, targetStates, diceRoll } = data;

      try {
        // Verify it's player's turn and check card limit
        const gameResult = await query(
          'SELECT current_turn_player_id, cards_played_this_turn FROM games WHERE id = $1',
          [gameId]
        );

        if (gameResult.rows[0].current_turn_player_id !== playerId) {
          socket.emit('error', { message: 'Not your turn' });
          return;
        }

        // Check 3-card-per-turn limit
        if (gameResult.rows[0].cards_played_this_turn >= 3) {
          socket.emit('error', { message: 'Maximum 3 cards per turn' });
          return;
        }

        // Get card details
        const card = cardsData.find(c => c.id === cardId);
        if (!card) {
          socket.emit('error', { message: 'Invalid card' });
          return;
        }

        // Validate state selection
        const selectionRules = getCardSelectionRules(card);
        const effectiveTargetStates = targetStates || [];
        const validation = validateStateSelection(card, effectiveTargetStates);

        if (!validation.valid) {
          socket.emit('error', { message: validation.error || 'Invalid state selection' });
          return;
        }

        // For AUTO cards, use the card's target states
        const statesToApply = selectionRules.type === 'AUTO'
          ? card.target_states || []
          : effectiveTargetStates;

        // Remove card from hand
        await query(
          'DELETE FROM player_hands WHERE player_id = $1 AND card_id = $2',
          [playerId, cardId]
        );

        // Add to discard pile
        await query(
          'INSERT INTO discard_pile (game_id, card_id) VALUES ($1, $2)',
          [gameId, cardId]
        );

        // Apply card effect
        if (statesToApply && statesToApply.length > 0) {
          let leanChange = 0;

          // If card requires dice and has dice mechanic outcomes
          if (card.requires_dice && diceRoll && card.dice_mechanic && typeof card.dice_mechanic === 'object' && card.dice_mechanic.outcomes) {
            // Find matching outcome for the dice roll
            const outcome = card.dice_mechanic.outcomes.find(o =>
              Array.isArray(o.roll) ? o.roll.includes(diceRoll) : o.roll === diceRoll
            );

            if (outcome) {
              // Parse the outcome result for lean change
              const match = outcome.result.match(/([+-]\d+)/);
              if (match) {
                leanChange = parseInt(match[1]);
              }
            }
          } else {
            // Parse primary effect to determine lean change
            const match = card.primary_effect.match(/([+-]\d+)/);
            leanChange = match ? parseInt(match[1]) : 2;
          }

          // Apply lean change to target states
          for (const stateAbbr of statesToApply) {
            await query(
              `UPDATE game_states
               SET current_lean = GREATEST(-15, LEAST(15, current_lean + $1))
               WHERE game_id = $2 AND state_abbr = $3`,
              [leanChange, gameId, stateAbbr]
            );
          }
        }

        // Increment cards played this turn
        await query(
          'UPDATE games SET cards_played_this_turn = cards_played_this_turn + 1 WHERE id = $1',
          [gameId]
        );

        // Log action
        const gameState = await query('SELECT current_round FROM games WHERE id = $1', [gameId]);
        await query(
          `INSERT INTO game_log (game_id, round, player_id, action_type, action_data)
           VALUES ($1, $2, $3, 'play_card', $4)`,
          [gameId, gameState.rows[0].current_round, playerId, JSON.stringify({ cardId, targetStates })]
        );

        // Get updated state
        const statesResult = await query(
          'SELECT * FROM game_states WHERE game_id = $1',
          [gameId]
        );

        const handResult = await query(
          'SELECT card_id FROM player_hands WHERE player_id = $1 ORDER BY drawn_at ASC',
          [playerId]
        );

        const hand = handResult.rows.map(row => 
          cardsData.find(c => c.id === row.card_id)
        );

        // Get updated cards_played_this_turn
        const updatedGame = await query(
          'SELECT cards_played_this_turn FROM games WHERE id = $1',
          [gameId]
        );

        // Broadcast card played
        io.to(gameId).emit('card_played', {
          playerId,
          cardId,
          cardName: card.name,
          targetStates: statesToApply,
          diceRoll,
          states: statesResult.rows,
          cardsPlayedThisTurn: updatedGame.rows[0].cards_played_this_turn
        });

        io.to(gameId).emit('hand_updated', {
          playerId,
          hand
        });

        // Check if player has used all 3 cards and auto-end turn
        const updatedGameResult = await query(
          'SELECT cards_played_this_turn FROM games WHERE id = $1',
          [gameId]
        );

        if (updatedGameResult.rows[0].cards_played_this_turn >= 3) {
          // Notify that turn is auto-ending
          io.to(gameId).emit('turn_limit_reached', { playerId });

          // Auto-end turn after a brief delay (1.5 seconds)
          setTimeout(async () => {
            try {
              // Execute end turn logic directly
              const gameResult = await query('SELECT * FROM games WHERE id = $1', [gameId]);
              const game = gameResult.rows[0];

              const playersResult = await query(
                'SELECT * FROM players WHERE game_id = $1 ORDER BY turn_order',
                [gameId]
              );

              const players = playersResult.rows;
              const currentPlayerIndex = players.findIndex(p => p.id === playerId);
              const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
              const nextPlayer = players[nextPlayerIndex];

              let newRound = game.current_round;
              if (nextPlayerIndex === 0) {
                newRound += 1;
              }

              const statesResult = await query('SELECT * FROM game_states WHERE game_id = $1', [gameId]);
              const electoralVotes = calculateElectoralVotes(statesResult.rows, players);

              for (const [playerId, votes] of Object.entries(electoralVotes)) {
                await query('UPDATE players SET electoral_votes = $1 WHERE id = $2', [votes, playerId]);
              }

              await query(
                `UPDATE games SET current_turn_player_id = $1, current_round = $2, cards_played_this_turn = 0 WHERE id = $3`,
                [nextPlayer.id, newRound, gameId]
              );

              const nextPlayerHandResult = await query(
                'SELECT card_id FROM player_hands WHERE player_id = $1 ORDER BY drawn_at ASC',
                [nextPlayer.id]
              );
              const cardsInHand = nextPlayerHandResult.rows.length;
              const cardsToRefill = Math.max(0, 5 - cardsInHand);

              if (cardsToRefill > 0) {
                const usedCardsResult = await query(
                  `SELECT DISTINCT ph.card_id
                   FROM player_hands ph
                   JOIN players p ON ph.player_id = p.id
                   WHERE p.game_id = $1`,
                  [gameId]
                );
                const discardedCardsResult = await query(
                  'SELECT card_id FROM discard_pile WHERE game_id = $1',
                  [gameId]
                );
                const usedCardIds = usedCardsResult.rows.map(r => r.card_id);
                const discardedCardIds = discardedCardsResult.rows.map(r => r.card_id);
                const allUsedCardIds = [...usedCardIds, ...discardedCardIds];
                const availableCards = cardsData.filter(c => !allUsedCardIds.includes(c.id));

                const newCards = [];
                for (let i = 0; i < Math.min(cardsToRefill, availableCards.length); i++) {
                  const randomIndex = Math.floor(Math.random() * availableCards.length);
                  const newCard = availableCards.splice(randomIndex, 1)[0];
                  newCards.push(newCard);
                  await query(
                    'INSERT INTO player_hands (player_id, card_id) VALUES ($1, $2)',
                    [nextPlayer.id, newCard.id]
                  );
                }
              }

              io.to(gameId).emit('turn_ended', {
                nextPlayerId: nextPlayer.id,
                currentRound: newRound
              });

              const nextPlayerHandRefreshed = await query(
                'SELECT card_id FROM player_hands WHERE player_id = $1 ORDER BY drawn_at ASC',
                [nextPlayer.id]
              );
              const hand = nextPlayerHandRefreshed.rows.map(row =>
                cardsData.find(c => c.id === row.card_id)
              );
              io.to(gameId).emit('hand_updated', {
                playerId: nextPlayer.id,
                hand
              });
            } catch (error) {
              console.error('Error auto-ending turn:', error);
            }
          }, 1500);
        }
      } catch (error) {
        console.error('Error playing card:', error);
        socket.emit('error', { message: 'Failed to play card' });
      }
    });

    /**
     * Discard a card
     */
    socket.on('discard_card', async (data: PlayCardData) => {
      const { gameId, playerId, cardId } = data;

      try {
        // Verify it's player's turn and check card limit
        const gameResult = await query(
          'SELECT current_turn_player_id, cards_played_this_turn FROM games WHERE id = $1',
          [gameId]
        );

        if (gameResult.rows[0].current_turn_player_id !== playerId) {
          socket.emit('error', { message: 'Not your turn' });
          return;
        }

        // Check 3-card-per-turn limit (discards count as cards played)
        if (gameResult.rows[0].cards_played_this_turn >= 3) {
          socket.emit('error', { message: 'Maximum 3 cards per turn' });
          return;
        }

        // Remove card from hand
        await query(
          'DELETE FROM player_hands WHERE player_id = $1 AND card_id = $2',
          [playerId, cardId]
        );

        // Add to discard pile
        await query(
          'INSERT INTO discard_pile (game_id, card_id) VALUES ($1, $2)',
          [gameId, cardId]
        );

        // Increment cards played this turn
        await query(
          'UPDATE games SET cards_played_this_turn = cards_played_this_turn + 1 WHERE id = $1',
          [gameId]
        );

        // Log action
        const gameState = await query('SELECT current_round FROM games WHERE id = $1', [gameId]);
        await query(
          `INSERT INTO game_log (game_id, round, player_id, action_type, action_data)
           VALUES ($1, $2, $3, 'discard_card', $4)`,
          [gameId, gameState.rows[0].current_round, playerId, JSON.stringify({ cardId })]
        );

        // Get updated hand
        const handResult = await query(
          'SELECT card_id FROM player_hands WHERE player_id = $1 ORDER BY drawn_at ASC',
          [playerId]
        );

        const hand = handResult.rows.map(row =>
          cardsData.find(c => c.id === row.card_id)
        );

        // Get card name for broadcast
        const card = cardsData.find(c => c.id === cardId);

        // Get updated cards_played_this_turn
        const updatedGame = await query(
          'SELECT cards_played_this_turn FROM games WHERE id = $1',
          [gameId]
        );

        // Broadcast card discarded
        io.to(gameId).emit('card_discarded', {
          playerId,
          cardName: card?.name || 'Unknown card',
          cardsPlayedThisTurn: updatedGame.rows[0].cards_played_this_turn
        });

        io.to(gameId).emit('hand_updated', {
          playerId,
          hand
        });

        // Check if player has used all 3 cards and auto-end turn
        const updatedGameResult = await query(
          'SELECT cards_played_this_turn FROM games WHERE id = $1',
          [gameId]
        );

        if (updatedGameResult.rows[0].cards_played_this_turn >= 3) {
          // Notify that turn is auto-ending
          io.to(gameId).emit('turn_limit_reached', { playerId });

          // Auto-end turn after a brief delay (1.5 seconds)
          setTimeout(async () => {
            try {
              // Execute end turn logic directly
              const gameResult = await query('SELECT * FROM games WHERE id = $1', [gameId]);
              const game = gameResult.rows[0];

              const playersResult = await query(
                'SELECT * FROM players WHERE game_id = $1 ORDER BY turn_order',
                [gameId]
              );

              const players = playersResult.rows;
              const currentPlayerIndex = players.findIndex(p => p.id === playerId);
              const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
              const nextPlayer = players[nextPlayerIndex];

              let newRound = game.current_round;
              if (nextPlayerIndex === 0) {
                newRound += 1;
              }

              const statesResult = await query('SELECT * FROM game_states WHERE game_id = $1', [gameId]);
              const electoralVotes = calculateElectoralVotes(statesResult.rows, players);

              for (const [playerId, votes] of Object.entries(electoralVotes)) {
                await query('UPDATE players SET electoral_votes = $1 WHERE id = $2', [votes, playerId]);
              }

              await query(
                `UPDATE games SET current_turn_player_id = $1, current_round = $2, cards_played_this_turn = 0 WHERE id = $3`,
                [nextPlayer.id, newRound, gameId]
              );

              const nextPlayerHandResult = await query(
                'SELECT card_id FROM player_hands WHERE player_id = $1 ORDER BY drawn_at ASC',
                [nextPlayer.id]
              );
              const cardsInHand = nextPlayerHandResult.rows.length;
              const cardsToRefill = Math.max(0, 5 - cardsInHand);

              if (cardsToRefill > 0) {
                const usedCardsResult = await query(
                  `SELECT DISTINCT ph.card_id
                   FROM player_hands ph
                   JOIN players p ON ph.player_id = p.id
                   WHERE p.game_id = $1`,
                  [gameId]
                );
                const discardedCardsResult = await query(
                  'SELECT card_id FROM discard_pile WHERE game_id = $1',
                  [gameId]
                );
                const usedCardIds = usedCardsResult.rows.map(r => r.card_id);
                const discardedCardIds = discardedCardsResult.rows.map(r => r.card_id);
                const allUsedCardIds = [...usedCardIds, ...discardedCardIds];
                const availableCards = cardsData.filter(c => !allUsedCardIds.includes(c.id));

                const newCards = [];
                for (let i = 0; i < Math.min(cardsToRefill, availableCards.length); i++) {
                  const randomIndex = Math.floor(Math.random() * availableCards.length);
                  const newCard = availableCards.splice(randomIndex, 1)[0];
                  newCards.push(newCard);
                  await query(
                    'INSERT INTO player_hands (player_id, card_id) VALUES ($1, $2)',
                    [nextPlayer.id, newCard.id]
                  );
                }
              }

              io.to(gameId).emit('turn_ended', {
                nextPlayerId: nextPlayer.id,
                currentRound: newRound
              });

              const nextPlayerHandRefreshed = await query(
                'SELECT card_id FROM player_hands WHERE player_id = $1 ORDER BY drawn_at ASC',
                [nextPlayer.id]
              );
              const hand = nextPlayerHandRefreshed.rows.map(row =>
                cardsData.find(c => c.id === row.card_id)
              );
              io.to(gameId).emit('hand_updated', {
                playerId: nextPlayer.id,
                hand
              });
            } catch (error) {
              console.error('Error auto-ending turn:', error);
            }
          }, 1500);
        }
      } catch (error) {
        console.error('Error discarding card:', error);
        socket.emit('error', { message: 'Failed to discard card' });
      }
    });

    /**
     * End turn
     */
    socket.on('end_turn', async (data: EndTurnData) => {
      const { gameId, playerId } = data;

      try {
        // Get current game state
        const gameResult = await query(
          'SELECT * FROM games WHERE id = $1',
          [gameId]
        );

        const game = gameResult.rows[0];

        if (game.current_turn_player_id !== playerId) {
          socket.emit('error', { message: 'Not your turn' });
          return;
        }

        // Get all players
        const playersResult = await query(
          'SELECT * FROM players WHERE game_id = $1 ORDER BY turn_order',
          [gameId]
        );

        const players = playersResult.rows;
        const currentPlayerIndex = players.findIndex(p => p.id === playerId);
        const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
        const nextPlayer = players[nextPlayerIndex];

        // If we're back to first player, increment round
        let newRound = game.current_round;
        if (nextPlayerIndex === 0) {
          newRound += 1;
        }

        // Calculate and update electoral votes
        const statesResult = await query(
          'SELECT * FROM game_states WHERE game_id = $1',
          [gameId]
        );
        const electoralVotes = calculateElectoralVotes(statesResult.rows, players);

        for (const [playerId, votes] of Object.entries(electoralVotes)) {
          await query(
            'UPDATE players SET electoral_votes = $1 WHERE id = $2',
            [votes, playerId]
          );
        }

        // If player ended turn without playing any cards, discard their entire hand
        if (game.cards_played_this_turn === 0) {
          // Get all cards in current player's hand
          const currentPlayerHandResult = await query(
            'SELECT card_id FROM player_hands WHERE player_id = $1 ORDER BY drawn_at ASC',
            [playerId]
          );

          // Move all cards from hand to discard pile
          for (const row of currentPlayerHandResult.rows) {
            await query(
              'INSERT INTO discard_pile (game_id, card_id) VALUES ($1, $2)',
              [gameId, row.card_id]
            );
          }

          // Remove all cards from current player's hand
          await query(
            'DELETE FROM player_hands WHERE player_id = $1',
            [playerId]
          );

          // Log the skip action
          await query(
            `INSERT INTO game_log (game_id, round, player_id, action_type, action_data)
             VALUES ($1, $2, $3, $4, $5)`,
            [gameId, game.current_round, playerId, 'skip_turn', JSON.stringify({ message: 'Player skipped turn and discarded all cards' })]
          );

          // Send updated empty hand to current player
          io.to(gameId).emit('hand_updated', {
            playerId: playerId,
            hand: []
          });
        }

        // Update game and reset cards played counter
        await query(
          `UPDATE games
           SET current_turn_player_id = $1, current_round = $2, cards_played_this_turn = 0
           WHERE id = $3`,
          [nextPlayer.id, newRound, gameId]
        );

        // Check if it's an event round (every 3rd round)
        if (newRound % 3 === 0 && nextPlayerIndex === 0) {
          // Get all event cards
          const eventCards = cardsData.filter(card => card.type === 'Event');

          // Pick a random event card
          if (eventCards.length > 0) {
            const randomEventIndex = Math.floor(Math.random() * eventCards.length);
            const eventCard = eventCards[randomEventIndex];

            // Log the event
            await query(
              `INSERT INTO game_log (game_id, round, action_type, action_data)
               VALUES ($1, $2, $3, $4)`,
              [gameId, newRound, 'event_card_drawn', JSON.stringify({ cardId: eventCard.id })]
            );

            // Broadcast event card to all players
            io.to(gameId).emit('event_card_drawn', {
              eventCard: eventCard,
              round: newRound
            });
          }
        }

        // Broadcast turn ended
        io.to(gameId).emit('turn_ended', {
          nextPlayerId: nextPlayer.id,
          currentRound: newRound
        });
      } catch (error) {
        console.error('Error ending turn:', error);
        socket.emit('error', { message: 'Failed to end turn' });
      }
    });

    /**
     * Deal cards - draw 5 new cards for current player
     */
    socket.on('deal_cards', async (data: { gameId: string; playerId: string }) => {
      const { gameId, playerId } = data;

      try {
        // Get current game state
        const gameResult = await query(
          'SELECT * FROM games WHERE id = $1',
          [gameId]
        );

        const game = gameResult.rows[0];

        // Verify it's the player's turn
        if (game.current_turn_player_id !== playerId) {
          socket.emit('error', { message: 'Not your turn' });
          return;
        }

        // Check current hand size
        const currentHandResult = await query(
          'SELECT card_id FROM player_hands WHERE player_id = $1 ORDER BY drawn_at ASC',
          [playerId]
        );

        if (currentHandResult.rows.length >= 5) {
          socket.emit('error', { message: 'Your hand is already full (5 cards)' });
          return;
        }

        const cardsNeeded = 5 - currentHandResult.rows.length;

        // Get all cards currently in hands for this game
        const cardsInHandsResult = await query(
          `SELECT DISTINCT ph.card_id
           FROM player_hands ph
           JOIN players p ON ph.player_id = p.id
           WHERE p.game_id = $1`,
          [gameId]
        );

        // Get all cards in discard pile
        const cardsInDiscardResult = await query(
          'SELECT card_id FROM discard_pile WHERE game_id = $1',
          [gameId]
        );

        const usedCardIds = new Set([
          ...cardsInHandsResult.rows.map(r => r.card_id),
          ...cardsInDiscardResult.rows.map(r => r.card_id)
        ]);

        // Filter out event cards from the main deck (they're a separate deck)
        let remainingCards = cardsData.filter(card =>
          !usedCardIds.has(card.id) && card.type !== 'Event'
        );

        // Draw cards until hand is full (up to 5 total)
        for (let i = 0; i < cardsNeeded && remainingCards.length > 0; i++) {
          const randomIndex = Math.floor(Math.random() * remainingCards.length);
          const randomCard = remainingCards[randomIndex];

          await query(
            'INSERT INTO player_hands (player_id, card_id) VALUES ($1, $2)',
            [playerId, randomCard.id]
          );

          // Remove drawn card from remaining cards
          remainingCards = remainingCards.filter(card => card.id !== randomCard.id);
          usedCardIds.add(randomCard.id);
        }

        // Get updated hand for player
        const updatedHandResult = await query(
          'SELECT card_id FROM player_hands WHERE player_id = $1 ORDER BY drawn_at ASC',
          [playerId]
        );

        const updatedHand = updatedHandResult.rows.map(row =>
          cardsData.find(c => c.id === row.card_id)
        );

        // Send updated hand to player
        io.to(gameId).emit('hand_updated', {
          playerId: playerId,
          hand: updatedHand
        });

        // Log the deal action
        await query(
          `INSERT INTO game_log (game_id, round, player_id, action_type, action_data)
           VALUES ($1, $2, $3, $4, $5)`,
          [gameId, game.current_round, playerId, 'deal_cards', JSON.stringify({ cardsDealt: updatedHand.length })]
        );
      } catch (error) {
        console.error('Error dealing cards:', error);
        socket.emit('error', { message: 'Failed to deal cards' });
      }
    });

    /**
     * End game - notify all players
     */
    socket.on('end_game', async (data: EndGameData) => {
      const { gameId, playerId } = data;

      try {
        // Get player name who ended the game
        const playerResult = await query(
          'SELECT player_name FROM players WHERE id = $1',
          [playerId]
        );

        const playerName = playerResult.rows[0]?.player_name || 'a player';

        // Update game status to completed
        await query(
          'UPDATE games SET status = $1 WHERE id = $2',
          ['completed', gameId]
        );

        // Broadcast to all players in the game
        io.to(gameId).emit('game_ended', {
          endedBy: playerName
        });

        console.log(`Game ${gameId} ended by ${playerName}`);
      } catch (error) {
        console.error('Error ending game:', error);
        socket.emit('error', { message: 'Failed to end game' });
      }
    });

    /**
     * Roll dice for event card
     */
    socket.on('roll_event_dice', async (data: { gameId: string; playerId: string; eventCardId: string }) => {
      const { gameId, playerId, eventCardId } = data;

      try {
        // Roll a d6
        const diceRoll = Math.floor(Math.random() * 6) + 1;

        // Get player info
        const playerResult = await query(
          'SELECT player_name, party FROM players WHERE id = $1',
          [playerId]
        );

        const player = playerResult.rows[0];

        // Log the dice roll
        const gameResult = await query('SELECT current_round FROM games WHERE id = $1', [gameId]);
        const currentRound = gameResult.rows[0]?.current_round || 0;

        await query(
          `INSERT INTO game_log (game_id, round, player_id, action_type, action_data)
           VALUES ($1, $2, $3, $4, $5)`,
          [gameId, currentRound, playerId, 'event_dice_roll', JSON.stringify({ eventCardId, diceRoll })]
        );

        // Broadcast the dice roll result to all players
        io.to(gameId).emit('event_dice_rolled', {
          playerId,
          playerName: player.player_name,
          party: player.party,
          diceRoll,
          eventCardId
        });

        console.log(`Player ${player.player_name} rolled ${diceRoll} for event ${eventCardId}`);
      } catch (error) {
        console.error('Error rolling event dice:', error);
        socket.emit('error', { message: 'Failed to roll dice' });
      }
    });

    /**
     * Disconnect
     */
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
}
