import { useState } from 'react';
import { Card } from '../../types';

interface EventCardModalProps {
  isOpen: boolean;
  eventCard: Card | null;
  onRollDice: () => void;
  onClose: () => void;
  diceResults?: { [playerId: string]: { playerName: string; party: string; roll: number } };
  currentPlayerId: string;
  totalPlayers: number;
}

function EventCardModal({ isOpen, eventCard, onRollDice, onClose, diceResults = {}, currentPlayerId, totalPlayers }: EventCardModalProps) {
  const [hasRolled, setHasRolled] = useState(false);

  if (!isOpen || !eventCard) return null;

  const currentPlayerRolled = currentPlayerId in diceResults;
  const allPlayersRolled = Object.keys(diceResults).length === totalPlayers;

  const handleRoll = () => {
    if (!hasRolled) {
      onRollDice();
      setHasRolled(true);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 rounded-t-2xl">
          <h2 className="text-3xl font-bold mb-2">📰 Breaking News Event!</h2>
          <p className="text-purple-100">A major event has occurred that affects all campaigns</p>
        </div>

        {/* Event Card Content */}
        <div className="p-6">
          <div className="bg-purple-50 border-2 border-purple-300 rounded-xl p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold text-purple-900 mb-2">{eventCard.name}</h3>
                <span className="inline-block px-3 py-1 bg-purple-200 text-purple-800 rounded-full text-sm font-semibold">
                  {eventCard.type}
                </span>
              </div>
            </div>

            <p className="text-gray-700 text-lg leading-relaxed mb-4">
              {eventCard.flavor_text}
            </p>

            <div className="bg-white rounded-lg p-4 border-l-4 border-purple-500">
              <p className="font-semibold text-purple-900 mb-2">Effect:</p>
              <p className="text-gray-800">{eventCard.primary_effect}</p>
            </div>

            {eventCard.backlash && (
              <div className="bg-red-50 rounded-lg p-4 border-l-4 border-red-500 mt-4">
                <p className="font-semibold text-red-900 mb-2">Backlash:</p>
                <p className="text-gray-800">{eventCard.backlash}</p>
              </div>
            )}
          </div>

          {/* Dice Rolling Section */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-xl p-6">
            <h4 className="text-xl font-bold text-amber-900 mb-3">🎲 Roll to Determine Impact</h4>
            <p className="text-gray-700 mb-4">
              Each player must roll a die to see how this event affects their campaign.
            </p>

            {!currentPlayerRolled && (
              <button
                onClick={handleRoll}
                disabled={hasRolled}
                className={`w-full py-3 px-6 rounded-lg font-bold text-lg transition-all ${
                  hasRolled
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                }`}
              >
                {hasRolled ? 'Dice Rolled...' : 'Roll Dice'}
              </button>
            )}

            {/* Dice Results */}
            {Object.keys(diceResults).length > 0 && (
              <div className="mt-6 space-y-3">
                <h5 className="font-bold text-gray-800 mb-2">Results:</h5>
                {Object.entries(diceResults).map(([playerId, result]) => (
                  <div
                    key={playerId}
                    className={`p-4 rounded-lg border-2 ${
                      result.party === 'Democrat'
                        ? 'bg-blue-50 border-blue-300'
                        : 'bg-red-50 border-red-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-gray-900">{result.playerName}</p>
                        <p className="text-sm text-gray-600">{result.party}</p>
                      </div>
                      <div className="text-4xl font-bold text-gray-800">
                        🎲 {result.roll}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* OK Button - only show when all players have rolled */}
          {allPlayersRolled && (
            <div className="mt-6">
              <button
                onClick={onClose}
                className="w-full py-3 px-6 rounded-lg font-bold text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
              >
                OK
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EventCardModal;
