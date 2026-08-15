/**
 * Generates a random 6-character alphanumeric game code
 */
export function generateGameCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluded I, O, 0, 1 to avoid confusion
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Validates a game code format
 */
export function isValidGameCode(code: string): boolean {
  return /^[A-Z0-9]{6}$/.test(code);
}
