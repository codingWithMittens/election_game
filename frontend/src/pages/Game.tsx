import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { initializeSocket, connectSocket, disconnectSocket } from '../lib/socket';
import { getGame } from '../lib/api';
import StateMap from '../components/game/StateMap';
import CardHand from '../components/cards/CardHand';
import ElectoralVoteBar from '../components/game/ElectoralVoteBar';
import { Card } from '../types';
import type { Socket } from 'socket.io-client';
import statesDataJson from '../data/Electoral_Strategy_States.json';

const statesData = (statesDataJson as any).states;

interface Player {
  id: string;
  player_name: string;
  party: 'Democrat' | 'Republican' | null;
  turn_order: number;
  electoral_votes: number;
  is_connected: boolean;
}

interface GameData {
  id: string;
  game_code: string;
  status: 'lobby' | 'in_progress' | 'completed';
  host_player_id: string;
  current_turn_player_id: string | null;
  current_round: number;
  cards_played_this_turn?: number;
}

interface GameStateData {
  state_abbr: string;
  current_lean: number;
  controlling_player_id: string | null;
}

function Game() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();

  const [socket, setSocket] = useState<Socket | null>(null);
  const [game, setGame] = useState<GameData | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [states, setStates] = useState<GameStateData[]>([]);
  const [hand, setHand] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Card playing state
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [diceRoll, setDiceRoll] = useState<number | null>(null);
  const [showDiceRoll, setShowDiceRoll] = useState(false);

  // Card result notification
  const [cardResult, setCardResult] = useState<{
    cardName: string;
    targetStates: string[];
    leanChanges: { state: string; oldLean: number; newLean: number }[];
    diceRoll?: number;
    playerId?: string;
  } | null>(null);

  // Copy link state
  const [linkCopied, setLinkCopied] = useState(false);

  // End game confirmation
  const [showEndGameConfirm, setShowEndGameConfirm] = useState(false);

  const playerId = localStorage.getItem('playerId');
  const gameCode = localStorage.getItem('gameCode');

  useEffect(() => {
    if (!gameId || !playerId) {
      navigate('/');
      return;
    }

    // Persist gameId in localStorage for page refresh
    localStorage.setItem('currentGameId', gameId);

    const loadGameAndConnect = async () => {
      try {
        // Load initial game state
        const gameData = await getGame(gameId);
        setGame(gameData.game);
        setPlayers(gameData.players);
        setStates(gameData.states);

        // Initialize socket
        const newSocket = initializeSocket();
        setSocket(newSocket);

        // Set up socket listeners
        newSocket.on('connect', () => {
          console.log('Socket connected');
          newSocket.emit('join_room', { gameId, playerId });
        });

        newSocket.on('game_state', (data) => {
          setGame(data.game);
          setPlayers(data.players);
          setStates(data.states);
        });

        newSocket.on('player_joined', (data) => {
          setPlayers(data.players);
        });

        newSocket.on('game_started', (data) => {
          setGame(data.game);
          setPlayers(data.players);
          setStates(data.states);
        });

        newSocket.on('hand_updated', (data) => {
          if (data.playerId === playerId) {
            setHand(data.hand || []);
          }
        });

        newSocket.on('card_played', (data) => {
          // Calculate lean changes
          const leanChanges = data.targetStates?.map((stateAbbr: string) => {
            const oldState = states.find(s => s.state_abbr === stateAbbr);
            const newState = data.states.find((s: GameStateData) => s.state_abbr === stateAbbr);
            return {
              state: stateAbbr,
              oldLean: oldState?.current_lean || 0,
              newLean: newState?.current_lean || 0
            };
          }) || [];

          setStates(data.states);

          // Update cards played this turn
          if (data.cardsPlayedThisTurn !== undefined) {
            setGame(prev => prev ? { ...prev, cards_played_this_turn: data.cardsPlayedThisTurn } : null);
          }

          // Show card result notification
          if (data.cardId && data.cardName) {
            setCardResult({
              cardName: data.cardName,
              targetStates: data.targetStates || [],
              leanChanges,
              diceRoll: data.diceRoll,
              playerId: data.playerId
            });
          }

          // Reset selection after card is played
          setSelectedCard(null);
          setSelectedStates([]);
        });

        newSocket.on('card_discarded', (data) => {
          // Update cards played this turn
          if (data.cardsPlayedThisTurn !== undefined) {
            setGame(prev => prev ? { ...prev, cards_played_this_turn: data.cardsPlayedThisTurn } : null);
          }
        });

        newSocket.on('turn_ended', (data) => {
          setGame(prev => prev ? { ...prev, current_turn_player_id: data.nextPlayerId, current_round: data.currentRound, cards_played_this_turn: 0 } : null);
        });

        newSocket.on('turn_limit_reached', (data) => {
          if (data.playerId === playerId) {
            setError('You\'ve used all 3 cards! Your turn is ending...');
            setTimeout(() => setError(''), 2000);
          }
        });

        newSocket.on('error', (data) => {
          setError(data.message);
          setTimeout(() => setError(''), 5000);
        });

        newSocket.on('game_ended', (data) => {
          // Show message that game was ended
          setError(`Game ended by ${data.endedBy || 'a player'}`);

          // Clear game state from localStorage
          localStorage.removeItem('currentGameId');

          // Disconnect and navigate after a short delay
          setTimeout(() => {
            if (newSocket) {
              newSocket.disconnect();
            }
            navigate('/');
          }, 2000);
        });

        connectSocket();
        setLoading(false);
      } catch (err: any) {
        console.error('Error loading game:', err);
        setError('Failed to load game');
        setLoading(false);
      }
    };

    loadGameAndConnect();

    return () => {
      disconnectSocket();
    };
  }, [gameId, playerId, navigate]);

  const handleStartGame = () => {
    if (socket && game) {
      socket.emit('start_game', { gameId: game.id });
    }
  };

  const handleCardClick = (card: Card) => {
    if (game?.current_turn_player_id !== playerId) {
      setError("It's not your turn!");
      setTimeout(() => setError(''), 3000);
      return;
    }

    setSelectedCard(card);

    // If card has predefined target states, use those automatically
    if (card.target_states && card.target_states.length > 0) {
      setSelectedStates(card.target_states);
    } else {
      // Card requires player to select states
      setSelectedStates([]);
    }
  };

  const handleStateClick = (stateAbbr: string) => {
    if (!selectedCard) {
      setError('Select a card first!');
      setTimeout(() => setError(''), 3000);
      return;
    }

    // If card has predefined targets, don't allow manual selection
    if (selectedCard.target_states && selectedCard.target_states.length > 0) {
      setError('This card has fixed targets!');
      setTimeout(() => setError(''), 3000);
      return;
    }

    // Toggle state selection for cards that need manual targeting
    if (selectedStates.includes(stateAbbr)) {
      setSelectedStates(selectedStates.filter(s => s !== stateAbbr));
    } else {
      // Allow selecting multiple states
      setSelectedStates([...selectedStates, stateAbbr]);
    }
  };

  const handlePlayCard = () => {
    if (!selectedCard || !socket || !game) {
      return;
    }

    if (selectedStates.length === 0) {
      setError('Select target state(s) or choose a different card!');
      setTimeout(() => setError(''), 3000);
      return;
    }

    // If card requires dice and no roll yet, prompt for dice roll
    if (selectedCard.requires_dice && diceRoll === null) {
      setShowDiceRoll(true);
      return;
    }

    socket.emit('play_card', {
      gameId: game.id,
      playerId,
      cardId: selectedCard.id,
      targetStates: selectedStates,
      diceRoll: diceRoll
    });

    // Reset dice roll after playing
    setDiceRoll(null);
    setShowDiceRoll(false);
  };

  const handleCopyLink = async () => {
    if (!gameCode) return;

    const shareUrl = `${window.location.origin}/join?code=${gameCode}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleRollDice = () => {
    const roll = Math.floor(Math.random() * 6) + 1;
    setDiceRoll(roll);
    setShowDiceRoll(false);

    // Auto-play the card after rolling
    setTimeout(() => {
      if (socket && game && selectedCard) {
        socket.emit('play_card', {
          gameId: game.id,
          playerId,
          cardId: selectedCard.id,
          targetStates: selectedStates,
          diceRoll: roll
        });
        setDiceRoll(null);
      }
    }, 100);
  };

  const handleDiscardCard = () => {
    if (!selectedCard || !socket || !game) {
      return;
    }

    socket.emit('discard_card', {
      gameId: game.id,
      playerId,
      cardId: selectedCard.id
    });

    setSelectedCard(null);
    setSelectedStates([]);
  };

  const handleEndTurn = () => {
    console.log('handleEndTurn called');
    console.log('socket:', socket);
    console.log('game:', game);
    console.log('playerId:', playerId);
    console.log('current_turn_player_id:', game?.current_turn_player_id);

    if (!socket || !game) {
      console.log('Missing socket or game');
      return;
    }

    if (game.current_turn_player_id !== playerId) {
      console.log('Not your turn');
      setError("It's not your turn!");
      setTimeout(() => setError(''), 3000);
      return;
    }

    console.log('Emitting end_turn event');
    socket.emit('end_turn', {
      gameId: game.id,
      playerId
    });

    setSelectedCard(null);
    setSelectedStates([]);
  };

  const handleEndGame = () => {
    // Close confirmation modal
    setShowEndGameConfirm(false);

    // Emit end game event to notify all players
    if (socket && game) {
      socket.emit('end_game', {
        gameId: game.id,
        playerId
      });
    }

    // Clear game state from localStorage
    localStorage.removeItem('currentGameId');

    // Disconnect and navigate
    if (socket) {
      socket.disconnect();
    }
    navigate('/');
  };

  const isHost = game?.host_player_id === playerId;
  const isMyTurn = game?.current_turn_player_id === playerId;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <div className="text-xl text-gray-600">Loading game...</div>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <div className="text-xl text-gray-600 mb-4">Game not found</div>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // Lobby view
  if (game.status === 'lobby') {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">Game Lobby</h1>
              <div className="inline-block bg-gray-100 px-6 py-3 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Game Code</p>
                <div className="flex items-center gap-3">
                  <p className="text-3xl font-mono font-bold text-blue-600">{gameCode}</p>
                  <button
                    onClick={handleCopyLink}
                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                    title="Copy invite link"
                  >
                    {linkCopied ? (
                      <span className="text-green-600">✓</span>
                    ) : (
                      <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <p className="mt-4 text-gray-600">
                {linkCopied ? 'Link copied to clipboard!' : 'Share this code or click the link icon to copy an invite link'}
              </p>
            </div>

            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">
                Players ({players.length}/4)
              </h2>
              <div className="space-y-3">
                {players.map((player, index) => (
                  <div
                    key={player.id}
                    className={`flex items-center justify-between p-4 rounded-lg ${
                      player.id === playerId ? 'bg-blue-50 border-2 border-blue-200' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">
                        {player.id === game.host_player_id ? '👑' : '🎮'}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {player.player_name}
                          {player.id === playerId && ' (You)'}
                          {player.id === game.host_player_id && ' (Host)'}
                        </p>
                        <p className="text-sm text-gray-500">Player {index + 1}</p>
                      </div>
                    </div>
                    <div>
                      {player.is_connected ? (
                        <span className="flex items-center gap-2 text-green-600 text-sm">
                          <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                          Connected
                        </span>
                      ) : (
                        <span className="flex items-center gap-2 text-gray-400 text-sm">
                          <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                          Disconnected
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              {isHost ? (
                <div>
                  <button
                    onClick={handleStartGame}
                    disabled={players.length < 2}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-lg transition-colors duration-200 text-lg"
                  >
                    {players.length < 2 ? 'Waiting for players...' : 'Start Game'}
                  </button>
                  {players.length < 2 && (
                    <p className="mt-3 text-center text-sm text-gray-500">
                      Need at least 2 players to start
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-600">
                  <p className="text-lg">Waiting for host to start the game...</p>
                  <p className="text-sm mt-2">
                    {players.length < 2 && 'Need at least 2 players'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Get current player's party for theming
  const currentPlayer = players.find(p => p.id === playerId);
  const partyTheme = currentPlayer?.party === 'Democrat'
    ? 'from-blue-50 to-blue-100'
    : currentPlayer?.party === 'Republican'
    ? 'from-red-50 to-red-100'
    : 'from-gray-50 to-gray-100';

  // Game in progress view
  return (
    <div className={`min-h-screen p-4 pb-96 bg-gradient-to-br ${partyTheme}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header with Electoral Vote Bar */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <div>
                <div className="flex gap-2 mb-1">
                  <span className="inline-block bg-gray-200 text-gray-700 text-xs font-semibold px-2 py-1 rounded">
                    Weeks until election: {12 - game.current_round}
                  </span>
                  {isMyTurn && (
                    <>
                      <span className="inline-block bg-blue-200 text-blue-700 text-xs font-semibold px-2 py-1 rounded">
                        Cards: {game?.cards_played_this_turn || 0}/3
                      </span>
                      <span className="inline-block bg-green-200 text-green-700 text-xs font-semibold px-2 py-1 rounded">
                        Turns left: {3 - (game?.cards_played_this_turn || 0)}
                      </span>
                    </>
                  )}
                </div>
                <p className="text-lg font-semibold">
                  Current Turn: {players.find(p => p.id === game.current_turn_player_id)?.player_name || 'Unknown'}
                  {isMyTurn && <span className="ml-2 text-green-600">← YOU</span>}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 ${
                  currentPlayer?.party === 'Democrat'
                    ? 'bg-blue-600 text-white'
                    : currentPlayer?.party === 'Republican'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-600 text-white'
                }`}>
                  <span>{currentPlayer?.party || 'Independent'}</span>
                  {game?.incumbent_party === currentPlayer?.party && (
                    <span className="text-xs bg-white bg-opacity-30 px-2 py-0.5 rounded" title="Incumbent Party">
                      ★
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setShowEndGameConfirm(true)}
                  className="text-sm text-gray-500 hover:text-red-600 underline transition-colors"
                >
                  End Game
                </button>
              </div>
            </div>
          </div>
          <ElectoralVoteBar players={players} gameStates={states} statesData={statesData} />
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Card Result Notification */}
        {cardResult && (
          <div className="fixed top-4 right-4 bg-white border-2 border-green-500 rounded-2xl shadow-2xl p-6 max-w-md z-50 animate-slide-in-right">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-xl font-bold text-green-700 flex items-center gap-2">
                  ✓ {players.find(p => p.id === cardResult.playerId)?.player_name || 'Player'} played card
                </h3>
                <p className="text-lg font-semibold text-gray-900">{cardResult.cardName}</p>
              </div>
              <button
                onClick={() => setCardResult(null)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                ✕
              </button>
            </div>

            {cardResult.diceRoll && (
              <div className="mb-3 bg-purple-50 border border-purple-200 p-3 rounded-lg">
                <p className="text-sm font-semibold text-purple-700">
                  🎲 Dice Roll: {cardResult.diceRoll}
                </p>
              </div>
            )}

            <div className="space-y-2 mb-4">
              <p className="text-sm font-semibold text-gray-700">State Changes:</p>
              {cardResult.leanChanges.map((change, idx) => {
                const diff = change.newLean - change.oldLean;
                const stateName = statesData.find((s: any) => s.abbreviation === change.state)?.name || change.state;
                return (
                  <div key={idx} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span className="text-sm font-medium text-gray-900">{stateName}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">{change.oldLean}</span>
                      <span className={`text-sm font-bold ${diff > 0 ? 'text-blue-600' : diff < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                        {diff > 0 ? '+' : ''}{diff}
                      </span>
                      <span className="text-xs text-gray-900 font-semibold">{change.newLean}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Overall Impact */}
            <div className="border-t-2 border-gray-200 pt-3">
              {(() => {
                const totalChange = cardResult.leanChanges.reduce((sum, change) => sum + (change.newLean - change.oldLean), 0);
                const avgChange = cardResult.leanChanges.length > 0 ? totalChange / cardResult.leanChanges.length : 0;
                return (
                  <div className={`p-3 rounded-lg ${totalChange > 0 ? 'bg-blue-50 border border-blue-200' : totalChange < 0 ? 'bg-red-50 border border-red-200' : 'bg-gray-50 border border-gray-200'}`}>
                    <p className="text-sm font-semibold text-gray-700 mb-1">Overall Impact:</p>
                    <p className={`text-lg font-bold ${totalChange > 0 ? 'text-blue-600' : totalChange < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                      {totalChange > 0 ? '+' : ''}{totalChange} total lean shift
                      {cardResult.leanChanges.length > 1 && (
                        <span className="text-sm font-normal text-gray-600">
                          {' '}({avgChange > 0 ? '+' : ''}{avgChange.toFixed(1)} avg)
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {totalChange > 0 ? '← Toward Democrats' : totalChange < 0 ? '→ Toward Republicans' : 'No net change'}
                    </p>
                  </div>
                );
              })()}
            </div>

            {/* Dismiss button */}
            <button
              onClick={() => setCardResult(null)}
              className="mt-4 w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Dice Roll Modal */}
        {showDiceRoll && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
              <div className="text-center">
                <div className="text-6xl mb-4">🎲</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Roll the Dice!</h2>
                <p className="text-gray-600 mb-2">This card requires a dice roll</p>
                {selectedCard && selectedCard.dice_mechanic && typeof selectedCard.dice_mechanic === 'object' && selectedCard.dice_mechanic.outcomes && (
                  <div className="mt-4 mb-6 bg-gray-50 p-4 rounded-lg text-left">
                    <p className="font-semibold text-sm text-gray-700 mb-2">Possible Outcomes:</p>
                    <ul className="space-y-1 text-xs text-gray-600">
                      {selectedCard.dice_mechanic.outcomes.map((outcome, idx) => (
                        <li key={idx}>
                          <span className="font-semibold">
                            Roll {Array.isArray(outcome.roll) ? outcome.roll.join(',') : outcome.roll}:
                          </span>{' '}
                          {outcome.result}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div>
                  <button
                    onClick={handleRollDice}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors text-lg"
                  >
                    Roll Dice (1d6)
                  </button>
                  <button
                    onClick={() => setShowDiceRoll(false)}
                    className="mt-3 w-full bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold py-2 px-6 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* End Game Confirmation Modal */}
        {showEndGameConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
              <div className="text-center">
                <div className="text-6xl mb-4">⚠️</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">End Game?</h2>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to end the game and return to the home screen? This will disconnect you from the game.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowEndGameConfirm(false)}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEndGame}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                  >
                    End Game
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}


        {/* Turn status */}
        {!selectedCard && (
          <div className="mb-6">
            {isMyTurn ? (
              <div className="bg-green-600 bg-opacity-90 text-white font-semibold py-3 px-6 rounded-lg shadow-lg text-center">
                <span>Select a card to play or </span>
                <button
                  onClick={handleEndTurn}
                  className="bg-white text-green-700 hover:bg-gray-100 font-bold py-1.5 px-3 rounded transition-colors inline-block"
                >
                  End Turn
                </button>
              </div>
            ) : (
              <div className="bg-blue-600 bg-opacity-90 text-white font-semibold py-3 px-6 rounded-lg text-center shadow-lg">
                {players.find(p => p.id === game?.current_turn_player_id)?.player_name || 'Opponent'} is playing...
              </div>
            )}
          </div>
        )}

        {/* State Map */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">United States Electoral Map</h2>
          <StateMap
            gameStates={states}
            onStateClick={selectedCard ? handleStateClick : undefined}
            selectedStates={selectedStates}
            playerParty={currentPlayer?.party || null}
            cardEffect={(() => {
              if (!selectedCard) return null;

              // Determine if card effect helps or hurts the player
              const effect = selectedCard.primary_effect;
              const playerParty = currentPlayer?.party;

              // Check if effect increases lean (positive numbers) or decreases lean (negative numbers)
              const leanMatch = effect.match(/([+-]?\d+)\s*lean/i);
              if (!leanMatch) return null;

              const leanChange = parseInt(leanMatch[1]);

              // For Democrats: positive lean change is good, negative is bad
              // For Republicans: negative lean change is good, positive is bad
              if (playerParty === 'Democrat') {
                return leanChange > 0 ? 'positive' : 'negative';
              } else if (playerParty === 'Republican') {
                return leanChange < 0 ? 'positive' : 'negative';
              }

              return null;
            })()}
          />
        </div>

        {/* Card Hand - Fixed at bottom */}
        <div className="fixed bottom-0 left-0 right-0 z-20 flex justify-start" style={{ pointerEvents: selectedCard ? 'none' : 'auto' }}>
          <div className="p-4" style={{ pointerEvents: 'auto' }}>
            <CardHand
              cards={hand}
              onCardClick={isMyTurn ? handleCardClick : undefined}
              selectedCard={selectedCard}
              party={currentPlayer?.party || null}
              selectedStates={selectedStates}
              onPlayCard={handlePlayCard}
              onDiscardCard={handleDiscardCard}
              onCancel={() => {
                setSelectedCard(null);
                setSelectedStates([]);
              }}
              isMyTurn={isMyTurn}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Game;
