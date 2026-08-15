import { Card } from '../../types';

interface SelectedCardProps {
  card: Card;
  party?: 'Democrat' | 'Republican' | null;
  selectedStates: string[];
  onPlayCard: () => void;
  onDiscardCard: () => void;
  onCancel: () => void;
  isMyTurn: boolean;
}

function SelectedCard({
  card,
  party,
  selectedStates,
  onPlayCard,
  onDiscardCard,
  onCancel,
  isMyTurn
}: SelectedCardProps) {
  const containerBg = party === 'Democrat'
    ? 'bg-blue-200 bg-opacity-80'
    : party === 'Republican'
    ? 'bg-red-200 bg-opacity-80'
    : 'bg-gray-200 bg-opacity-80';

  const borderColor = party === 'Democrat'
    ? 'border-blue-300'
    : party === 'Republican'
    ? 'border-red-300'
    : 'border-gray-300';

  const textColor = party === 'Democrat'
    ? 'text-blue-900'
    : party === 'Republican'
    ? 'text-red-900'
    : 'text-gray-900';

  return (
    <div className={`inline-block ${containerBg} rounded-xl shadow-lg p-4 border-2 ${borderColor} mb-6`}>
      <h3 className={`font-bold ${textColor} mb-3`}>Selected Card</h3>

      <div>
        {/* Card display */}
        <div className="w-56 h-[20rem] bg-white rounded-lg shadow-lg border-2 border-gray-300 self-start">
          <div className="p-3 flex flex-col h-full">
            {/* Card Header */}
            <div className="mb-2">
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-bold text-sm text-gray-900 leading-tight flex-1 text-center">
                  {card.name}
                </h3>
                <div className="flex-shrink-0 ml-2">
                  <span className="inline-block bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded">
                    {card.cost} MP
                  </span>
                </div>
              </div>
              <div className="flex gap-1.5 justify-center">
                <span className="inline-block bg-gray-200 text-gray-700 text-xs px-1.5 py-0.5 rounded">
                  {card.type}
                </span>
                {card.subtype && (
                  <span className="inline-block bg-gray-200 text-gray-700 text-xs px-1.5 py-0.5 rounded">
                    {card.subtype}
                  </span>
                )}
              </div>
            </div>

            {/* Card Effect */}
            <div className="mb-1.5 text-left">
              <p className="text-xs font-semibold text-blue-600 mb-0.5">Effect:</p>
              <p className="text-xs text-gray-700 leading-snug">• {card.primary_effect}</p>
            </div>

            {/* Backlash */}
            {card.backlash && card.backlash !== 'None' && (
              <div className="mb-1.5 text-left">
                <p className="text-xs font-semibold text-red-600 mb-0.5">Backlash:</p>
                <p className="text-xs text-gray-700 leading-snug">• {card.backlash}</p>
              </div>
            )}

            {/* Special */}
            {card.special && card.special !== 'None' && (
              <div className="mb-1.5 text-left">
                <p className="text-xs font-semibold text-purple-600 mb-0.5">Special:</p>
                <p className="text-xs text-gray-700 leading-snug">• {card.special}</p>
              </div>
            )}

            {/* Dice Mechanic */}
            {card.requires_dice && card.dice_mechanic && (
              <div className="mb-1.5 text-left">
                <p className="text-xs font-semibold text-green-600 mb-0.5">🎲 Dice:</p>
                {typeof card.dice_mechanic === 'string' ? (
                  <p className="text-xs text-gray-700 leading-snug">• {card.dice_mechanic}</p>
                ) : (
                  <div className="text-xs text-gray-700">
                    <p className="font-semibold leading-snug">• {card.dice_mechanic.type}</p>
                    {card.dice_mechanic.outcomes && (
                      <ul className="mt-0.5 space-y-0.5 ml-2">
                        {card.dice_mechanic.outcomes.map((outcome, idx) => (
                          <li key={idx} className="text-xs leading-snug">
                            • Roll {Array.isArray(outcome.roll) ? outcome.roll.join(',') : outcome.roll}: {outcome.result}
                          </li>
                        ))}
                      </ul>
                    )}
                    {card.dice_mechanic.base_value && (
                      <p className="text-xs mt-0.5 leading-snug ml-2">• Base value: {card.dice_mechanic.base_value}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Target States */}
            {card.target_states && card.target_states.length > 0 && (
              <div className="mb-1.5 text-left">
                <p className="text-xs text-gray-500 leading-snug">
                  Targets: {card.target_states.join(', ')}
                </p>
              </div>
            )}

            {/* Flavor Text */}
            {card.flavor_text && (
              <div className="mt-auto pt-1.5 border-t border-gray-200 text-center">
                <p className="text-xs italic text-gray-500 leading-snug">{card.flavor_text}</p>
              </div>
            )}
          </div>
        </div>

        {/* Info section */}
        <div className="mt-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-900">
            {selectedStates.length > 0 ? (
              <>
                <span className="font-semibold">Targeting:</span> {selectedStates.join(', ')}
              </>
            ) : card.target_states && card.target_states.length > 0 ? (
              <>
                <span className="font-semibold">Auto-targeting:</span> {card.target_states.join(', ')}
              </>
            ) : (
              <span className="text-amber-700">⚠️ Select target state(s) on the map</span>
            )}
          </p>
        </div>

        {/* Action buttons inline below card */}
        <div className="flex gap-2 mt-3">
          {selectedStates.length > 0 && (
            <button
              onClick={onPlayCard}
              disabled={!isMyTurn}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-2 px-3 rounded-lg transition-colors shadow-lg text-sm"
            >
              Play
            </button>
          )}
          <button
            onClick={onDiscardCard}
            disabled={!isMyTurn}
            className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-2 px-3 rounded-lg transition-colors shadow-lg text-sm"
          >
            Discard
          </button>
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-3 rounded-lg transition-colors shadow-lg text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default SelectedCard;
