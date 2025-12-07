import { MatchStatus } from "@prisma/client";
import { prisma } from "../prisma";
import { BRACKET8_BLUEPRINT, BRACKET8_SEED_ORDER, MatchCode } from "../brackets/bracket8";
import { seedPlayers } from "./seeding";
import { autoAdvanceIfBye } from "./matchProgression";

export async function initializeEightPlayerBracket(tournamentId: number) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: { players: true },
  });

  if (!tournament) {
    throw new Error("Tournament not found");
  }

  const seededPlayers = seedPlayers(tournament.players);
  await Promise.all(
    seededPlayers.map((player) =>
      prisma.tournamentPlayer.update({
        where: { id: player.id },
        data: { seed: player.seed },
      }),
    ),
  );

  const bracketPlayers = seededPlayers.slice(0, 8);

  const seedToPlayer = new Map<number, number>();
  bracketPlayers.forEach((player) => {
    if (player.seed) {
      seedToPlayer.set(player.seed, player.id);
    }
  });

  const matchIdByCode: Record<MatchCode, string> = {} as Record<MatchCode, string>;

  await prisma.$transaction(async (tx) => {
    const created = await Promise.all(
      BRACKET8_BLUEPRINT.map((bp) =>
        tx.match.create({
          data: {
            tournamentId,
            bracket: bp.bracket,
            round: bp.round,
            matchIndex: bp.matchIndex,
            status: MatchStatus.pending,
          },
        }),
      ),
    );

    created.forEach((match, idx) => {
      matchIdByCode[BRACKET8_BLUEPRINT[idx].code] = match.id;
    });

    await Promise.all(
      BRACKET8_BLUEPRINT.map((bp) =>
        tx.match.update({
          where: { id: matchIdByCode[bp.code] },
          data: {
            nextWinnerMatchId: bp.nextWinner ? matchIdByCode[bp.nextWinner] : null,
            nextLoserMatchId: bp.nextLoser ? matchIdByCode[bp.nextLoser] : null,
          },
        }),
      ),
    );

    const initialCodes: MatchCode[] = ["W1", "W2", "W3", "W4"];
    await Promise.all(
      initialCodes.map((code, idx) => {
        const [seedA, seedB] = BRACKET8_SEED_ORDER[idx];
        const player1Id = seedToPlayer.get(seedA) ?? null;
        const player2Id = seedToPlayer.get(seedB) ?? null;
        return tx.match.update({
          where: { id: matchIdByCode[code] },
          data: { player1Id, player2Id },
        });
      }),
    );
  });

  // Auto-advance BYE slots
  await Promise.all(
    Object.values(matchIdByCode).map(async (id) => {
      await autoAdvanceIfBye(id);
    }),
  );

  return {
    bracketSize: 8,
    matchCount: BRACKET8_BLUEPRINT.length,
  };
}
