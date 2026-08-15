import { useState } from 'react';
import { State } from '../../types';
import statesDataJson from '../../data/Electoral_Strategy_States.json';
import USAMap from './USAMap';

const statesData = statesDataJson.states as State[];

interface GameStateData {
  state_abbr: string;
  current_lean: number;
  controlling_player_id: string | null;
}

interface StateMapProps {
  gameStates: GameStateData[];
  onStateClick?: (stateAbbr: string) => void;
  selectedStates?: string[];
}

type SortOption = 'alphabetical' | 'lean' | 'electoral_votes' | 'swing_states' | 'region';
type ViewMode = 'grid' | 'map';

function StateMap({ gameStates, onStateClick, selectedStates = [] }: StateMapProps) {
  const [sortBy, setSortBy] = useState<SortOption>('alphabetical');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const getStateColor = (lean: number): string => {
    if (lean >= 10) return '#1e40af'; // Strong Blue
    if (lean >= 7) return '#3b82f6';  // Lean Blue
    if (lean >= 3) return '#93c5fd';  // Tilt Blue
    if (lean > -3) return '#d1d5db';  // Toss-up
    if (lean > -7) return '#fca5a5';  // Tilt Red
    if (lean > -10) return '#ef4444'; // Lean Red
    return '#991b1b'; // Strong Red
  };

  const getLeanCategory = (lean: number): string => {
    if (lean >= 10) return 'Strong Blue';
    if (lean >= 7) return 'Lean Blue';
    if (lean >= 3) return 'Tilt Blue';
    if (lean > -3) return 'Toss-up';
    if (lean > -7) return 'Tilt Red';
    if (lean > -10) return 'Lean Red';
    return 'Strong Red';
  };

  const getSortedStates = (): (State & { currentLean: number })[] => {
    const statesWithLean = statesData.map(state => {
      const gameState = gameStates.find(gs => gs.state_abbr === state.abbreviation);
      return {
        ...state,
        currentLean: gameState?.current_lean || state.starting_lean
      };
    });

    switch (sortBy) {
      case 'alphabetical':
        return statesWithLean.sort((a, b) => a.name.localeCompare(b.name));

      case 'lean':
        // Sort by lean: most blue first, then toss-ups, then most red
        return statesWithLean.sort((a, b) => b.currentLean - a.currentLean);

      case 'electoral_votes':
        // Sort by electoral votes (highest first), then alphabetically
        return statesWithLean.sort((a, b) => {
          if (b.electoral_votes !== a.electoral_votes) {
            return b.electoral_votes - a.electoral_votes;
          }
          return a.name.localeCompare(b.name);
        });

      case 'swing_states':
        // Sort by absolute value of lean (closest to 0 first = most competitive)
        return statesWithLean.sort((a, b) => {
          const aDistance = Math.abs(a.currentLean);
          const bDistance = Math.abs(b.currentLean);
          if (aDistance !== bDistance) {
            return aDistance - bDistance;
          }
          return b.electoral_votes - a.electoral_votes; // Then by EV
        });

      case 'region':
        // Sort by region, then alphabetically within region
        return statesWithLean.sort((a, b) => {
          if (a.region !== b.region) {
            return a.region.localeCompare(b.region);
          }
          return a.name.localeCompare(b.name);
        });

      default:
        return statesWithLean;
    }
  };

  const sortedStates = getSortedStates();

  return (
    <div className="space-y-4">
      {/* View Controls */}
      <div className="flex justify-between items-center mb-4">
        {/* View Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'grid'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Grid View
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'map'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Map View
          </button>
        </div>

        {/* Sort controls - only show in grid view */}
        {viewMode === 'grid' && (
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <span>Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="alphabetical">Alphabetical</option>
              <option value="lean">Current Leaning</option>
              <option value="electoral_votes">Electoral Votes</option>
              <option value="swing_states">Swing States</option>
              <option value="region">Region</option>
            </select>
          </label>
        )}
      </div>

      {/* Conditional view rendering */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {sortedStates.map((state: State & { currentLean: number }) => {
            const lean = state.currentLean;
            const color = getStateColor(lean);
            const isSelected = selectedStates.includes(state.abbreviation);

            return (
              <button
                key={state.abbreviation}
                onClick={() => onStateClick?.(state.abbreviation)}
                className={`p-3 rounded-lg transition-all duration-200 ${
                  isSelected ? 'ring-4 ring-yellow-400 shadow-lg transform scale-105' : 'hover:shadow-lg'
                } ${onStateClick ? 'cursor-pointer' : 'cursor-default'}`}
                style={{ backgroundColor: color }}
                disabled={!onStateClick}
              >
                <div className="text-white text-center">
                  <div className="text-lg font-bold mb-1">{state.abbreviation}</div>
                  <div className="text-xs opacity-90">{state.electoral_votes} EV</div>
                  <div className="text-xs opacity-75 mt-1">
                    Lean: {lean > 0 ? '+' : ''}{lean}
                  </div>
                  <div className="text-xs font-semibold mt-1 opacity-90">
                    {getLeanCategory(lean)}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <USAMap
          gameStates={gameStates}
          statesData={sortedStates}
          onStateClick={onStateClick}
          selectedStates={selectedStates}
          getStateColor={getStateColor}
        />
      )}
    </div>
  );
}

export default StateMap;
