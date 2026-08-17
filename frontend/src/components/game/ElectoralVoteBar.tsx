interface Player {
  id: string;
  player_name: string;
  party: 'Democrat' | 'Republican' | null;
  electoral_votes: number;
}

interface GameStateData {
  state_abbr: string;
  current_lean: number;
  controlling_player_id: string | null;
}

interface State {
  abbreviation: string;
  name: string;
  electoral_votes: number;
  starting_lean: number;
  lean_category: string;
  priority_issues: string[];
  region: string;
}

interface ElectoralVoteBarProps {
  players: Player[];
  gameStates: GameStateData[];
  statesData: State[];
  currentPlayerId: string;
  currentTurnPlayerId: string | null;
}

function ElectoralVoteBar({ players, gameStates, statesData, currentPlayerId, currentTurnPlayerId }: ElectoralVoteBarProps) {
  const democrat = players.find(p => p.party === 'Democrat');
  const republican = players.find(p => p.party === 'Republican');

  const totalVotes = 538;
  const winThreshold = 270;

  // Calculate votes by lean category
  // Lean categories:
  // Strong Blue: >= 10
  // Lean Blue: 7-9
  // Tilt Blue: 3-6
  // Toss-up: -2 to 2
  // Tilt Red: -6 to -3
  // Lean Red: -9 to -7
  // Strong Red: <= -10

  const leanCategories = {
    strongBlue: 0,
    leanBlue: 0,
    tiltBlue: 0,
    tossup: 0,
    tiltRed: 0,
    leanRed: 0,
    strongRed: 0,
  };

  gameStates.forEach(gs => {
    const state = statesData.find(s => s.abbreviation === gs.state_abbr);
    if (!state) return;

    const lean = gs.current_lean;
    const votes = state.electoral_votes;

    if (lean >= 10) leanCategories.strongBlue += votes;
    else if (lean >= 7) leanCategories.leanBlue += votes;
    else if (lean >= 3) leanCategories.tiltBlue += votes;
    else if (lean > -3) leanCategories.tossup += votes;
    else if (lean > -7) leanCategories.tiltRed += votes;
    else if (lean > -10) leanCategories.leanRed += votes;
    else leanCategories.strongRed += votes;
  });

  // Calculate percentages
  const strongBluePercent = (leanCategories.strongBlue / totalVotes) * 100;
  const leanBluePercent = (leanCategories.leanBlue / totalVotes) * 100;
  const tiltBluePercent = (leanCategories.tiltBlue / totalVotes) * 100;
  const tossupPercent = (leanCategories.tossup / totalVotes) * 100;
  const tiltRedPercent = (leanCategories.tiltRed / totalVotes) * 100;
  const leanRedPercent = (leanCategories.leanRed / totalVotes) * 100;
  const strongRedPercent = (leanCategories.strongRed / totalVotes) * 100;

  const winPercent = (winThreshold / totalVotes) * 100;

  const isMyTurn = currentPlayerId === currentTurnPlayerId;
  const turnText = isMyTurn ? "Your turn" : "Their turn";

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <div className="text-left">
          {democrat?.id === currentPlayerId && (
            <p className={`text-lg font-bold mb-1 ${isMyTurn ? 'text-green-600' : 'text-gray-500'}`}>
              {turnText}
            </p>
          )}
          <p className="text-lg font-semibold text-blue-700">
            {democrat?.player_name || 'Democrat'}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-1">Current Polls</p>
          <p className="text-2xl font-bold text-gray-900">{winThreshold}</p>
        </div>
        <div className="text-right">
          {republican?.id === currentPlayerId && (
            <p className={`text-lg font-bold mb-1 ${isMyTurn ? 'text-green-600' : 'text-gray-500'}`}>
              {turnText}
            </p>
          )}
          <p className="text-lg font-semibold text-red-700">
            {republican?.player_name || 'Republican'}
          </p>
        </div>
      </div>

      {/* Progress bar with lean categories */}
      <div className="relative h-12 bg-gray-200 rounded-full overflow-hidden border-2 border-gray-400">
        {/* Build segments from left to right */}
        <div className="absolute left-0 top-0 h-full flex w-full">
          {/* Strong Blue */}
          {strongBluePercent > 0 && (
            <div
              className="h-full bg-blue-800 transition-all duration-500 flex items-center justify-center"
              style={{ width: `${strongBluePercent}%` }}
              title={`Strong Blue: ${leanCategories.strongBlue} votes`}
            >
              {leanCategories.strongBlue > 0 && (
                <span className="text-white text-xs font-bold">{leanCategories.strongBlue}</span>
              )}
            </div>
          )}

          {/* Lean Blue */}
          {leanBluePercent > 0 && (
            <div
              className="h-full bg-blue-600 transition-all duration-500 flex items-center justify-center"
              style={{ width: `${leanBluePercent}%` }}
              title={`Lean Blue: ${leanCategories.leanBlue} votes`}
            >
              {leanCategories.leanBlue > 0 && (
                <span className="text-white text-xs font-bold">{leanCategories.leanBlue}</span>
              )}
            </div>
          )}

          {/* Tilt Blue */}
          {tiltBluePercent > 0 && (
            <div
              className="h-full bg-blue-300 transition-all duration-500 flex items-center justify-center"
              style={{ width: `${tiltBluePercent}%` }}
              title={`Tilt Blue: ${leanCategories.tiltBlue} votes`}
            >
              {leanCategories.tiltBlue > 0 && (
                <span className="text-blue-900 text-xs font-bold">{leanCategories.tiltBlue}</span>
              )}
            </div>
          )}

          {/* Toss-up */}
          {tossupPercent > 0 && (
            <div
              className="h-full bg-gray-400 transition-all duration-500 flex items-center justify-center"
              style={{ width: `${tossupPercent}%` }}
              title={`Toss-up: ${leanCategories.tossup} votes`}
            >
              {leanCategories.tossup > 0 && (
                <span className="text-white text-xs font-bold">{leanCategories.tossup}</span>
              )}
            </div>
          )}

          {/* Tilt Red */}
          {tiltRedPercent > 0 && (
            <div
              className="h-full bg-red-300 transition-all duration-500 flex items-center justify-center"
              style={{ width: `${tiltRedPercent}%` }}
              title={`Tilt Red: ${leanCategories.tiltRed} votes`}
            >
              {leanCategories.tiltRed > 0 && (
                <span className="text-red-900 text-xs font-bold">{leanCategories.tiltRed}</span>
              )}
            </div>
          )}

          {/* Lean Red */}
          {leanRedPercent > 0 && (
            <div
              className="h-full bg-red-600 transition-all duration-500 flex items-center justify-center"
              style={{ width: `${leanRedPercent}%` }}
              title={`Lean Red: ${leanCategories.leanRed} votes`}
            >
              {leanCategories.leanRed > 0 && (
                <span className="text-white text-xs font-bold">{leanCategories.leanRed}</span>
              )}
            </div>
          )}

          {/* Strong Red */}
          {strongRedPercent > 0 && (
            <div
              className="h-full bg-red-800 transition-all duration-500 flex items-center justify-center"
              style={{ width: `${strongRedPercent}%` }}
              title={`Strong Red: ${leanCategories.strongRed} votes`}
            >
              {leanCategories.strongRed > 0 && (
                <span className="text-white text-xs font-bold">{leanCategories.strongRed}</span>
              )}
            </div>
          )}
        </div>

        {/* Win threshold marker */}
        <div
          className="absolute top-0 h-full w-1 bg-yellow-400 border-x-2 border-yellow-600 z-10"
          style={{ left: `${winPercent}%` }}
        >
          <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-bold text-yellow-600">
            ★
          </div>
        </div>
      </div>
    </div>
  );
}

export default ElectoralVoteBar;
