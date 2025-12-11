import { describe, it, expect } from 'vitest';
import { BRACKET8_BLUEPRINT, BRACKET8_SEED_ORDER, MatchBlueprint, MatchCode } from '@/lib/brackets/bracket8';

describe('BRACKET8_BLUEPRINT', () => {
  it('contains exactly 13 matches for 8-player double elimination', () => {
    expect(BRACKET8_BLUEPRINT).toHaveLength(13);
  });

  it('has 7 winners bracket matches', () => {
    const winnersMatches = BRACKET8_BLUEPRINT.filter((m) => m.bracket === 'winners');
    expect(winnersMatches).toHaveLength(7);
  });

  it('has 5 losers bracket matches', () => {
    const losersMatches = BRACKET8_BLUEPRINT.filter((m) => m.bracket === 'losers');
    expect(losersMatches).toHaveLength(5);
  });

  it('has 1 final match', () => {
    const finalMatches = BRACKET8_BLUEPRINT.filter((m) => m.bracket === 'final');
    expect(finalMatches).toHaveLength(1);
  });

  it('has unique match codes', () => {
    const codes = BRACKET8_BLUEPRINT.map((m) => m.code);
    const uniqueCodes = new Set(codes);
    expect(uniqueCodes.size).toBe(codes.length);
  });

  it('has valid nextWinner references', () => {
    const validCodes = new Set(BRACKET8_BLUEPRINT.map((m) => m.code));

    BRACKET8_BLUEPRINT.forEach((match) => {
      if (match.nextWinner) {
        expect(validCodes.has(match.nextWinner)).toBe(true);
      }
    });
  });

  it('has valid nextLoser references', () => {
    const validCodes = new Set(BRACKET8_BLUEPRINT.map((m) => m.code));

    BRACKET8_BLUEPRINT.forEach((match) => {
      if (match.nextLoser) {
        expect(validCodes.has(match.nextLoser)).toBe(true);
      }
    });
  });

  it('final match has no nextWinner or nextLoser', () => {
    const finalMatch = BRACKET8_BLUEPRINT.find((m) => m.bracket === 'final');
    expect(finalMatch?.nextWinner).toBeUndefined();
    expect(finalMatch?.nextLoser).toBeUndefined();
  });

  it('winners bracket round 1 matches feed into losers bracket', () => {
    const winnersRound1 = BRACKET8_BLUEPRINT.filter(
      (m) => m.bracket === 'winners' && m.round === 1
    );

    winnersRound1.forEach((match) => {
      expect(match.nextLoser).toBeDefined();
      const loserMatch = BRACKET8_BLUEPRINT.find((m) => m.code === match.nextLoser);
      expect(loserMatch?.bracket).toBe('losers');
    });
  });

  it('all winners bracket matches except final have progression paths', () => {
    const winnersMatches = BRACKET8_BLUEPRINT.filter(
      (m) => m.bracket === 'winners' && m.round < 3
    );

    winnersMatches.forEach((match) => {
      expect(match.nextWinner).toBeDefined();
      expect(match.nextLoser).toBeDefined();
    });
  });
});

describe('BRACKET8_SEED_ORDER', () => {
  it('contains 4 pairings for 4 first-round matches', () => {
    expect(BRACKET8_SEED_ORDER).toHaveLength(4);
  });

  it('each pairing has 2 seeds', () => {
    BRACKET8_SEED_ORDER.forEach((pair) => {
      expect(pair).toHaveLength(2);
    });
  });

  it('uses all seeds from 1 to 8', () => {
    const allSeeds = BRACKET8_SEED_ORDER.flat();
    expect(allSeeds.sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('pairs seed 1 with seed 8 (strongest vs weakest)', () => {
    const firstPair = BRACKET8_SEED_ORDER[0];
    expect(firstPair).toContain(1);
    expect(firstPair).toContain(8);
  });

  it('pairs seed 2 with seed 7', () => {
    const thirdPair = BRACKET8_SEED_ORDER[2];
    expect(thirdPair).toContain(2);
    expect(thirdPair).toContain(7);
  });

  it('follows standard bracket seeding (1v8, 4v5, 2v7, 3v6)', () => {
    expect(BRACKET8_SEED_ORDER).toEqual([
      [1, 8],
      [4, 5],
      [2, 7],
      [3, 6],
    ]);
  });
});

describe('Double elimination bracket flow', () => {
  function getMatch(code: MatchCode): MatchBlueprint {
    const match = BRACKET8_BLUEPRINT.find((m) => m.code === code);
    if (!match) throw new Error(`Match ${code} not found`);
    return match;
  }

  it('W1 winner goes to W5, loser goes to L1', () => {
    const w1 = getMatch('W1');
    expect(w1.nextWinner).toBe('W5');
    expect(w1.nextLoser).toBe('L1');
  });

  it('winners bracket final winner goes to grand final', () => {
    const w7 = getMatch('W7');
    expect(w7.nextWinner).toBe('F1');
  });

  it('losers bracket final winner goes to grand final', () => {
    const l5 = getMatch('L5');
    expect(l5.nextWinner).toBe('F1');
  });

  it('losers bracket matches only have nextWinner (no nextLoser)', () => {
    const losersMatches = BRACKET8_BLUEPRINT.filter((m) => m.bracket === 'losers');
    losersMatches.forEach((match) => {
      expect(match.nextLoser).toBeUndefined();
    });
  });
});
