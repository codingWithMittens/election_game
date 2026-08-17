import { useState } from 'react';
import { Card } from '../../types';
import { getCardSelectionRules } from '../../lib/cardRules';

interface CardHandProps {
  cards: Card[];
  onCardClick?: (card: Card) => void;
  selectedCard?: Card | null;
  party?: 'Democrat' | 'Republican' | null;
  selectedStates?: string[];
  onPlayCard?: () => void;
  onDiscardCard?: () => void;
  onCancel?: () => void;
  onDealCards?: () => void;
  isMyTurn?: boolean;
}

function CardHand({
  cards,
  onCardClick,
  selectedCard,
  party,
  selectedStates = [],
  onPlayCard,
  onDiscardCard,
  onCancel,
  onDealCards,
  isMyTurn = false
}: CardHandProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Darker backgrounds with higher transparency
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

  const hoverBg = party === 'Democrat'
    ? 'hover:bg-blue-100'
    : party === 'Republican'
    ? 'hover:bg-red-100'
    : 'hover:bg-gray-100';

  const textColor = party === 'Democrat'
    ? 'text-blue-900'
    : party === 'Republican'
    ? 'text-red-900'
    : 'text-gray-900';

  if (!cards || cards.length === 0) {
    return (
      <div className={`${containerBg} border-2 ${borderColor} rounded-lg p-4 text-center`}>
        <p className={textColor}>No cards in hand</p>
        {isMyTurn && onDealCards && (
          <button
            onClick={onDealCards}
            className="mt-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors shadow-lg"
          >
            Deal Cards
          </button>
        )}
      </div>
    );
  }

  if (!isExpanded) {
    return (
      <div className={`${containerBg} rounded-xl shadow-lg p-3 border ${borderColor}`}>
        <button
          onClick={() => setIsExpanded(true)}
          className={`w-full flex items-center justify-between ${textColor} ${hoverBg} rounded-lg p-2 transition-colors`}
        >
          <span className="font-semibold">Your Hand ({cards.length} cards)</span>
          <span className="text-xl">▼</span>
        </button>
      </div>
    );
  }

  // Get card type styling
  const getCardTypeStyles = (type: string) => {
    switch (type) {
      case 'Policy':
        return {
          bg: 'bg-gradient-to-br from-blue-50 to-blue-100',
          border: 'border-blue-400',
          hoverBorder: 'hover:border-blue-500',
          typeBadge: 'bg-blue-600 text-white',
          accent: 'text-blue-600',
          headerGradient: 'from-blue-500 to-blue-600'
        };
      case 'Campaign':
        return {
          bg: 'bg-gradient-to-br from-green-50 to-green-100',
          border: 'border-green-400',
          hoverBorder: 'hover:border-green-500',
          typeBadge: 'bg-green-600 text-white',
          accent: 'text-green-600',
          headerGradient: 'from-green-500 to-green-600'
        };
      case 'Event':
        return {
          bg: 'bg-gradient-to-br from-purple-50 to-purple-100',
          border: 'border-purple-400',
          hoverBorder: 'hover:border-purple-500',
          typeBadge: 'bg-purple-600 text-white',
          accent: 'text-purple-600',
          headerGradient: 'from-purple-500 to-purple-600'
        };
      case 'Special':
        return {
          bg: 'bg-gradient-to-br from-amber-50 to-amber-100',
          border: 'border-amber-400',
          hoverBorder: 'hover:border-amber-500',
          typeBadge: 'bg-amber-600 text-white',
          accent: 'text-amber-600',
          headerGradient: 'from-amber-500 to-amber-600'
        };
      default:
        return {
          bg: 'bg-white',
          border: 'border-gray-300',
          hoverBorder: 'hover:border-gray-400',
          typeBadge: 'bg-gray-600 text-white',
          accent: 'text-gray-600',
          headerGradient: 'from-gray-500 to-gray-600'
        };
    }
  };

  // Render a single card
  const renderCard = (card: Card, index: number, isSelectedView: boolean = false) => {
    const typeStyles = getCardTypeStyles(card.type);

    return (
    <button
      key={`${card.id}-${index}`}
      onClick={() => !isSelectedView && onCardClick?.(card)}
      className={`flex-shrink-0 w-56 h-[20rem] rounded-lg shadow-lg transition-all duration-200 border-2 self-start ${typeStyles.bg} ${
        selectedCard?.id === card.id && !isSelectedView
          ? 'border-yellow-400 ring-2 ring-yellow-400 transform -translate-y-1 shadow-2xl'
          : `${typeStyles.border} ${typeStyles.hoverBorder} hover:-translate-y-1`
      } ${onCardClick && !isSelectedView ? 'cursor-pointer' : 'cursor-default'}`}
      disabled={!onCardClick || isSelectedView}
    >
      {/* Decorative header bar */}
      <div className={`h-2 rounded-t-lg bg-gradient-to-r ${typeStyles.headerGradient}`}></div>

      <div className="p-3 flex flex-col h-full">
        {/* Card Header - Top section */}
        <div className="mb-2">
          <div className="flex justify-between items-start mb-1">
            <h3 className="font-bold text-sm text-gray-900 leading-tight flex-1 text-center">
              {card.name}
            </h3>
            <div className="flex-shrink-0 ml-2">
              <span className="inline-block bg-indigo-600 text-white text-xs font-bold px-2 py-0.5 rounded">
                {card.cost} MP
              </span>
            </div>
          </div>
          <div className="flex gap-1.5 justify-center">
            <span className={`inline-block ${typeStyles.typeBadge} text-xs font-semibold px-1.5 py-0.5 rounded`}>
              {card.type}
            </span>
            {card.subtype && (
              <span className="inline-block bg-gray-300 text-gray-700 text-xs px-1.5 py-0.5 rounded">
                {card.subtype}
              </span>
            )}
          </div>
        </div>

        {/* Card Effect */}
        <div className="mb-1.5 text-left">
          <p className={`text-xs font-semibold ${typeStyles.accent} mb-0.5`}>Effect:</p>
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
    </button>
    );
  };

  // If a card is selected, show only that card with buttons
  if (selectedCard) {
    return (
      <div className={`inline-block ${containerBg} rounded-xl shadow-lg p-4 border-2 ${borderColor}`}>
        <h3 className={`font-bold ${textColor} mb-3`}>Selected Card</h3>

        <div>
          {renderCard(selectedCard, -1, true)}

          {/* Info section */}
          <div className="mt-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-900">
              {(() => {
                const rules = getCardSelectionRules(selectedCard);

                if (rules.type === 'AUTO') {
                  return (
                    <>
                      <span className="font-semibold">Auto-applies to:</span>{' '}
                      {rules.validStates.length > 0 ? rules.validStates.join(', ') : 'All states'}
                    </>
                  );
                }

                if (selectedStates.length > 0) {
                  return (
                    <>
                      <span className="font-semibold">Targeting:</span> {selectedStates.join(', ')}
                    </>
                  );
                }

                return <span className="text-amber-700">⚠️ Select target state(s) on the map</span>;
              })()}
            </p>
          </div>

          {/* Action buttons inline below card */}
          <div className="flex gap-2 mt-3">
            {(() => {
              const rules = getCardSelectionRules(selectedCard);
              const canPlay = rules.type === 'AUTO' || selectedStates.length > 0;

              return canPlay && (
                <button
                  onClick={onPlayCard}
                  disabled={!isMyTurn}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-2 px-3 rounded-lg transition-colors shadow-lg text-sm"
                >
                  Play
                </button>
              );
            })()}
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

  // Collapsed view - no card selected
  if (!isExpanded) {
    return (
      <div className={`${containerBg} rounded-xl shadow-lg p-3 border ${borderColor}`}>
        <button
          onClick={() => {
            console.log('Expand clicked');
            setIsExpanded(true);
          }}
          className={`w-full flex items-center justify-between ${textColor} ${hoverBg} rounded-lg p-2 transition-colors cursor-pointer`}
          type="button"
        >
          <span className="font-semibold">Your Hand ({cards.length} cards)</span>
          <span className="text-xl">▼</span>
        </button>
      </div>
    );
  }

  // Expanded view - show all cards
  return (
    <div className={`${containerBg} rounded-xl shadow-lg p-4 border ${borderColor}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className={`font-semibold ${textColor}`}>Your Hand ({cards.length} cards)</h3>
        <div className="flex gap-2 items-center">
          {isMyTurn && onDealCards && cards.length < 5 && (
            <button
              onClick={onDealCards}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1.5 px-3 rounded-lg transition-colors shadow-lg text-sm"
            >
              Deal Cards
            </button>
          )}
          <button
            onClick={() => setIsExpanded(false)}
            className={`${textColor} ${hoverBg} rounded px-2 py-1 transition-colors`}
          >
            ▲ Collapse
          </button>
        </div>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 items-start">
        {cards.map((card, index) => renderCard(card, index))}
      </div>
    </div>
  );
}

export default CardHand;
