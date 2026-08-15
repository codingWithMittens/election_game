import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ElectoralVoteBar from '../../src/components/game/ElectoralVoteBar';

describe('ElectoralVoteBar Component', () => {
  const mockPlayers = [
    {
      id: 'player-1',
      player_name: 'Alice',
      party: 'Democrat' as const,
      electoral_votes: 150,
      is_connected: true,
      turn_order: 0,
    },
    {
      id: 'player-2',
      player_name: 'Bob',
      party: 'Republican' as const,
      electoral_votes: 120,
      is_connected: true,
      turn_order: 1,
    },
  ];

  const mockStatesData = [
    { abbreviation: 'CA', name: 'California', electoral_votes: 54, starting_lean: 0, lean_category: '', priority_issues: [], region: 'West' },
    { abbreviation: 'TX', name: 'Texas', electoral_votes: 40, starting_lean: 0, lean_category: '', priority_issues: [], region: 'South' },
  ];

  const mockGameStates = [
    { state_abbr: 'CA', current_lean: 10, controlling_player_id: 'player-1' },
    { state_abbr: 'TX', current_lean: -10, controlling_player_id: 'player-2' },
  ];

  it('should render electoral vote counts for both players', () => {
    render(
      <ElectoralVoteBar
        players={mockPlayers}
        gameStates={mockGameStates}
        statesData={mockStatesData}
      />
    );

    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument();
  });

  it('should show player names', () => {
    render(
      <ElectoralVoteBar
        players={mockPlayers}
        gameStates={mockGameStates}
        statesData={mockStatesData}
      />
    );

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('should render with zero votes when no states controlled', () => {
    const emptyGameStates = [
      { state_abbr: 'CA', current_lean: 0, controlling_player_id: null },
      { state_abbr: 'TX', current_lean: 0, controlling_player_id: null },
    ];

    const playersWithZero = mockPlayers.map(p => ({ ...p, electoral_votes: 0 }));

    render(
      <ElectoralVoteBar
        players={playersWithZero}
        gameStates={emptyGameStates}
        statesData={mockStatesData}
      />
    );

    const zeroVotes = screen.getAllByText('0');
    expect(zeroVotes.length).toBeGreaterThan(0);
  });

  it('should highlight player approaching victory (>= 250 votes)', () => {
    const playersNearVictory = [
      { ...mockPlayers[0], electoral_votes: 260 },
      mockPlayers[1],
    ];

    const { container } = render(
      <ElectoralVoteBar
        players={playersNearVictory}
        gameStates={mockGameStates}
        statesData={mockStatesData}
      />
    );

    // Should have some visual indicator for player near victory
    expect(container.querySelector('[class*="pulse"]')).toBeInTheDocument();
  });

  it('should display victory line at 270 votes', () => {
    render(
      <ElectoralVoteBar
        players={mockPlayers}
        gameStates={mockGameStates}
        statesData={mockStatesData}
      />
    );

    expect(screen.getByText('270 to win')).toBeInTheDocument();
  });

  it('should show correct proportion of bar filled', () => {
    // With 150 and 120 votes out of 538 total
    const { container } = render(
      <ElectoralVoteBar
        players={mockPlayers}
        gameStates={mockGameStates}
        statesData={mockStatesData}
      />
    );

    const democratBar = container.querySelector('[style*="27.88"]'); // 150/538 * 100
    const republicanBar = container.querySelector('[style*="22.30"]'); // 120/538 * 100

    expect(democratBar || republicanBar).toBeTruthy();
  });
});
