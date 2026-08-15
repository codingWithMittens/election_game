import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { joinGame } from '../lib/api';

function JoinGame() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [gameCode, setGameCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Prefill game code from URL query param
  useEffect(() => {
    const codeFromUrl = searchParams.get('code');
    if (codeFromUrl) {
      setGameCode(codeFromUrl.toUpperCase().slice(0, 6));
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!gameCode.trim()) {
      setError('Please enter a game code');
      return;
    }

    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await joinGame(gameCode.toUpperCase().trim(), playerName.trim());

      // Store game info in localStorage
      localStorage.setItem('gameId', response.gameId);
      localStorage.setItem('playerId', response.playerId);
      localStorage.setItem('gameCode', gameCode.toUpperCase().trim());
      localStorage.setItem('playerName', playerName.trim());

      // Navigate to game
      navigate(`/game/${response.gameId}`);
    } catch (err: any) {
      console.error('Error joining game:', err);
      setError(err.response?.data?.error || 'Failed to join game. Please check the code and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGameCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Auto-uppercase and limit to 6 characters
    const value = e.target.value.toUpperCase().slice(0, 6);
    setGameCode(value);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <button
          onClick={() => navigate('/')}
          className="mb-6 text-gray-600 hover:text-gray-900 flex items-center gap-2"
        >
          ← Back to Home
        </button>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🔗</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Join Game</h1>
            <p className="text-gray-600">
              Enter the game code to join
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="gameCode" className="block text-sm font-medium text-gray-700 mb-2">
                Game Code
              </label>
              <input
                type="text"
                id="gameCode"
                value={gameCode}
                onChange={handleGameCodeChange}
                placeholder="ABC123"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition text-center text-2xl font-mono tracking-wider"
                maxLength={6}
                disabled={loading}
              />
              <p className="mt-2 text-xs text-gray-500 text-center">
                6-character code from game host
              </p>
            </div>

            <div>
              <label htmlFor="playerName" className="block text-sm font-medium text-gray-700 mb-2">
                Your Name
              </label>
              <input
                type="text"
                id="playerName"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition"
                maxLength={50}
                disabled={loading}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !gameCode.trim() || !playerName.trim()}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
            >
              {loading ? 'Joining Game...' : 'Join Game'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center">
              Don't have a code? Ask the host to create a game first
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default JoinGame;
