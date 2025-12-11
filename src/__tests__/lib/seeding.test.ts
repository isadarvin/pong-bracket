import { describe, it, expect } from 'vitest';
import { seedPlayers } from '@/lib/tournament/seeding';
import { TournamentPlayer } from '@prisma/client';

// Helper to create mock tournament players
function createMockPlayer(id: number, skillRating: number): TournamentPlayer {
  return {
    id,
    tournamentId: 1,
    playerId: `player-${id}`,
    skillRating,
    seed: null,
    finalRank: null,
    lossCount: 0,
    eliminationOrder: null,
    winsCount: 0,
  };
}

describe('seedPlayers', () => {
  it('assigns seeds in order from highest to lowest skill rating', () => {
    const players = [
      createMockPlayer(1, 3),
      createMockPlayer(2, 5),
      createMockPlayer(3, 1),
      createMockPlayer(4, 4),
    ];

    const seeded = seedPlayers(players);

    // Highest skill (5) should be seed 1
    const topPlayer = seeded.find((p) => p.skillRating === 5);
    expect(topPlayer?.seed).toBe(1);

    // Lowest skill (1) should be seed 4
    const bottomPlayer = seeded.find((p) => p.skillRating === 1);
    expect(bottomPlayer?.seed).toBe(4);
  });

  it('assigns consecutive seeds starting from 1', () => {
    const players = [
      createMockPlayer(1, 2),
      createMockPlayer(2, 4),
      createMockPlayer(3, 3),
      createMockPlayer(4, 1),
    ];

    const seeded = seedPlayers(players);
    const seeds = seeded.map((p) => p.seed).sort((a, b) => (a ?? 0) - (b ?? 0));

    expect(seeds).toEqual([1, 2, 3, 4]);
  });

  it('handles players with the same skill rating', () => {
    const players = [
      createMockPlayer(1, 3),
      createMockPlayer(2, 3),
      createMockPlayer(3, 3),
      createMockPlayer(4, 3),
    ];

    const seeded = seedPlayers(players);
    const seeds = seeded.map((p) => p.seed).sort((a, b) => (a ?? 0) - (b ?? 0));

    // All should get unique seeds 1-4
    expect(seeds).toEqual([1, 2, 3, 4]);
  });

  it('handles a single player', () => {
    const players = [createMockPlayer(1, 5)];
    const seeded = seedPlayers(players);

    expect(seeded).toHaveLength(1);
    expect(seeded[0].seed).toBe(1);
  });

  it('handles empty player list', () => {
    const seeded = seedPlayers([]);
    expect(seeded).toEqual([]);
  });

  it('preserves all player data while adding seed', () => {
    const player = createMockPlayer(42, 4);
    const seeded = seedPlayers([player]);

    expect(seeded[0]).toMatchObject({
      id: 42,
      tournamentId: 1,
      playerId: 'player-42',
      skillRating: 4,
      lossCount: 0,
      winsCount: 0,
    });
    expect(seeded[0].seed).toBe(1);
  });

  it('correctly orders 8 players for tournament seeding', () => {
    const players = [
      createMockPlayer(1, 5),
      createMockPlayer(2, 4),
      createMockPlayer(3, 3),
      createMockPlayer(4, 2),
      createMockPlayer(5, 5),
      createMockPlayer(6, 4),
      createMockPlayer(7, 3),
      createMockPlayer(8, 2),
    ];

    const seeded = seedPlayers(players);

    // Players with skill 5 should be seeds 1-2
    const skill5Players = seeded.filter((p) => p.skillRating === 5);
    expect(skill5Players.every((p) => p.seed !== null && p.seed <= 2)).toBe(true);

    // Players with skill 2 should be seeds 7-8
    const skill2Players = seeded.filter((p) => p.skillRating === 2);
    expect(skill2Players.every((p) => p.seed !== null && p.seed >= 7)).toBe(true);
  });
});
