import { generateGameCode } from '../../src/lib/gameCode';

describe('Game Code Generation', () => {
  describe('generateGameCode', () => {
    it('should generate a 6-character code', () => {
      const code = generateGameCode();
      expect(code).toHaveLength(6);
    });

    it('should only contain alphanumeric characters', () => {
      const code = generateGameCode();
      expect(code).toMatch(/^[A-Z0-9]+$/);
    });

    it('should not contain ambiguous characters (I, O, 0, 1)', () => {
      const codes = Array.from({ length: 100 }, () => generateGameCode());
      codes.forEach(code => {
        expect(code).not.toContain('I');
        expect(code).not.toContain('O');
        expect(code).not.toContain('0');
        expect(code).not.toContain('1');
      });
    });

    it('should generate unique codes (probabilistically)', () => {
      const codes = new Set();
      for (let i = 0; i < 1000; i++) {
        codes.add(generateGameCode());
      }
      // With a good random generator, we should get close to 1000 unique codes
      expect(codes.size).toBeGreaterThan(990);
    });

    it('should always return uppercase codes', () => {
      const codes = Array.from({ length: 50 }, () => generateGameCode());
      codes.forEach(code => {
        expect(code).toBe(code.toUpperCase());
      });
    });
  });
});
