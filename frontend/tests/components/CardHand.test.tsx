import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CardHand from '../../src/components/cards/CardHand';
import { Card } from '../../src/types';

describe('CardHand Component', () => {
  const mockCards: Card[] = [
    {
      id: 'card-1',
      name: 'Campaign Rally',
      type: 'strategy',
      description: 'Boost your support in a state',
      effect: '+3 lean to target state',
      target: 'single',
      dice_mechanic: null,
    },
    {
      id: 'card-2',
      name: 'Media Blitz',
      type: 'event',
      description: 'Launch a media campaign',
      effect: '+2 lean to all states in region',
      target: 'region',
      dice_mechanic: null,
    },
  ];

  it('should render all cards when expanded', () => {
    render(<CardHand cards={mockCards} party="Democrat" />);

    expect(screen.getByText('Campaign Rally')).toBeInTheDocument();
    expect(screen.getByText('Media Blitz')).toBeInTheDocument();
  });

  it('should show card count in header', () => {
    render(<CardHand cards={mockCards} party="Democrat" />);

    expect(screen.getByText(/2 cards/i)).toBeInTheDocument();
  });

  it('should call onCardClick when card is clicked', () => {
    const handleCardClick = vi.fn();

    render(
      <CardHand
        cards={mockCards}
        onCardClick={handleCardClick}
        party="Democrat"
      />
    );

    const cardButton = screen.getByText('Campaign Rally').closest('button');
    fireEvent.click(cardButton!);

    expect(handleCardClick).toHaveBeenCalledWith(mockCards[0]);
  });

  it('should render selected card view when card is selected', () => {
    const mockSelectedCard = mockCards[0];

    render(
      <CardHand
        cards={mockCards}
        selectedCard={mockSelectedCard}
        party="Democrat"
      />
    );

    expect(screen.getByText('Selected Card')).toBeInTheDocument();
    expect(screen.getByText('Campaign Rally')).toBeInTheDocument();
  });

  it('should show action buttons when card is selected and isMyTurn', () => {
    const mockSelectedCard = mockCards[0];
    const handlePlayCard = vi.fn();
    const handleDiscardCard = vi.fn();

    render(
      <CardHand
        cards={mockCards}
        selectedCard={mockSelectedCard}
        party="Democrat"
        isMyTurn={true}
        onPlayCard={handlePlayCard}
        onDiscardCard={handleDiscardCard}
      />
    );

    expect(screen.getByText('Play Card')).toBeInTheDocument();
    expect(screen.getByText('Discard')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('should apply Democratic party styling', () => {
    const { container } = render(
      <CardHand cards={mockCards} party="Democrat" />
    );

    expect(container.querySelector('.bg-blue-50')).toBeInTheDocument();
  });

  it('should apply Republican party styling', () => {
    const { container } = render(
      <CardHand cards={mockCards} party="Republican" />
    );

    expect(container.querySelector('.bg-red-50')).toBeInTheDocument();
  });

  it('should toggle between collapsed and expanded states', () => {
    render(<CardHand cards={mockCards} party="Democrat" />);

    // Initially expanded - should show card names
    expect(screen.getByText('Campaign Rally')).toBeInTheDocument();

    // Find and click the collapse button
    const collapseButton = screen.getByText('▲').closest('button');
    fireEvent.click(collapseButton!);

    // Now collapsed - cards should not be visible
    expect(screen.queryByText('Campaign Rally')).not.toBeInTheDocument();
    expect(screen.getByText(/2 cards/i)).toBeInTheDocument();
    expect(screen.getByText('▼')).toBeInTheDocument();
  });

  it('should show target state info when states are selected', () => {
    const mockSelectedCard = mockCards[0];

    render(
      <CardHand
        cards={mockCards}
        selectedCard={mockSelectedCard}
        selectedStates={['CA', 'TX']}
        party="Democrat"
        isMyTurn={true}
      />
    );

    expect(screen.getByText(/Targeting: CA, TX/i)).toBeInTheDocument();
  });

  it('should render empty state when no cards', () => {
    render(<CardHand cards={[]} party="Democrat" />);

    expect(screen.getByText(/0 cards/i)).toBeInTheDocument();
  });
});
