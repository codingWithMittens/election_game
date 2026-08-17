import { Card } from '../types';

export interface CardSelectionRule {
  type: 'AUTO' | 'CHOOSE_ONE' | 'CHOOSE_MULTIPLE';
  minStates: number;
  maxStates: number;
  validStates: string[]; // Empty array means any state is valid
}

/**
 * Determines the selection rules for a card based on its primary_effect text
 */
export function getCardSelectionRules(card: Card): CardSelectionRule {
  const effect = card.primary_effect.toLowerCase();

  // Cards that apply automatically to their target states (no player choice)
  if (
    effect.includes('all swing states') ||
    effect.includes('all states') ||
    effect.includes('rust belt') ||
    effect.includes('border states') ||
    effect.includes('military-base states') ||
    effect.includes('tech hubs') ||
    effect.includes('energy-production') ||
    effect.includes('climate-priority') ||
    effect.includes('working-class states') ||
    effect.includes('business states') ||
    effect.includes('service-industry') ||
    effect.includes('high-immigration') ||
    effect.includes('tech-hub states') ||
    effect.includes('high-debt states') ||
    effect.includes('urban states') ||
    effect.includes('rural states') ||
    effect.includes('suburban areas') ||
    effect.includes('high-veteran states') ||
    effect.includes('rural swing states') ||
    effect.includes('senior-heavy') ||
    effect.includes('business-friendly') ||
    effect.includes('youth-heavy') ||
    effect.includes('outdoor recreation') ||
    effect.includes('school challenges') ||
    effect.includes('young voters') ||
    (card.target_states && card.target_states.length > 0 && !effect.includes('choose'))
  ) {
    return {
      type: 'AUTO',
      minStates: 0,
      maxStates: 0,
      validStates: card.target_states || []
    };
  }

  // Cards that let player choose 1 state
  if (
    effect.includes('choose 1 state') ||
    effect.includes('target opponent loses') ||
    effect.includes('+3 lean in 1 state') ||
    effect.includes('+2 lean in 1 urban')
  ) {
    // Check if there's a restriction on which states are valid
    let validStates: string[] = [];

    if (effect.includes('urban/suburban')) {
      // For now, we'll need to define urban/suburban states
      // This could be moved to a config file
      validStates = ['PA', 'MI', 'WI', 'GA', 'NC', 'AZ', 'NV', 'FL', 'OH', 'VA', 'CO'];
    } else if (card.target_states && card.target_states.length > 0) {
      validStates = card.target_states;
    }

    return {
      type: 'CHOOSE_ONE',
      minStates: 1,
      maxStates: 1,
      validStates
    };
  }

  // Cards that let player choose multiple states
  if (effect.includes('up to 3 states')) {
    return {
      type: 'CHOOSE_MULTIPLE',
      minStates: 0,
      maxStates: 3,
      validStates: [] // Any state is valid
    };
  }

  // Cards with regions (special case - needs separate handling)
  if (effect.includes('choose 1 region')) {
    return {
      type: 'CHOOSE_MULTIPLE',
      minStates: 3,
      maxStates: 5,
      validStates: [] // Any connected states
    };
  }

  // Default: card applies automatically to all its target states
  return {
    type: 'AUTO',
    minStates: 0,
    maxStates: 0,
    validStates: card.target_states || []
  };
}

/**
 * Validates that the selected states match the card's selection rules
 */
export function validateStateSelection(
  card: Card,
  selectedStates: string[]
): { valid: boolean; error?: string } {
  const rules = getCardSelectionRules(card);

  // AUTO cards don't need state selection from player
  if (rules.type === 'AUTO') {
    if (selectedStates.length > 0) {
      return {
        valid: false,
        error: 'This card automatically applies to its target states. No selection needed.'
      };
    }
    return { valid: true };
  }

  // Check minimum states
  if (selectedStates.length < rules.minStates) {
    return {
      valid: false,
      error: `You must select at least ${rules.minStates} state(s).`
    };
  }

  // Check maximum states
  if (selectedStates.length > rules.maxStates) {
    return {
      valid: false,
      error: `You can only select up to ${rules.maxStates} state(s).`
    };
  }

  // Check if selected states are valid
  if (rules.validStates.length > 0) {
    const invalidStates = selectedStates.filter(
      state => !rules.validStates.includes(state)
    );

    if (invalidStates.length > 0) {
      return {
        valid: false,
        error: `Invalid state(s) for this card: ${invalidStates.join(', ')}`
      };
    }
  }

  return { valid: true };
}

/**
 * Get a human-readable description of selection requirements
 */
export function getSelectionDescription(card: Card): string {
  const rules = getCardSelectionRules(card);

  if (rules.type === 'AUTO') {
    if (rules.validStates.length === 0) {
      return 'Applies automatically';
    }
    return `Applies automatically to: ${rules.validStates.join(', ')}`;
  }

  if (rules.type === 'CHOOSE_ONE') {
    if (rules.validStates.length > 0) {
      return `Choose 1 state from: ${rules.validStates.join(', ')}`;
    }
    return 'Choose 1 state';
  }

  if (rules.type === 'CHOOSE_MULTIPLE') {
    const stateRange = rules.minStates === rules.maxStates
      ? `${rules.maxStates}`
      : `${rules.minStates}-${rules.maxStates}`;

    if (rules.validStates.length > 0) {
      return `Choose ${stateRange} state(s) from: ${rules.validStates.join(', ')}`;
    }
    return `Choose ${stateRange} state(s)`;
  }

  return 'Unknown selection rule';
}
