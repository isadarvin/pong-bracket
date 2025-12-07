import { MatchStatus, Prisma, TournamentStatus } from "@prisma/client";
import { prisma } from "../prisma";

type ReportParams = {
  matchId: string;
  winnerId: number;
  player1Score?: number | null;
  player2Score?: number | null;
};

async function placeIntoMatch(matchId: string, playerId: number, tx: Prisma.TransactionClient) {
  const match = await tx.match.findUnique({ where: { id: matchId } });
  if (!match) return;

  if (match.player1Id && match.player2Id) {
    return;
  }

  const targetField = match.player1Id ? "player2Id" : "player1Id";
  await tx.match.update({
    where: { id: matchId },
    data: { [targetField]: playerId },
  });
}

async function maybeFinalizeTournament(tournamentId: number, tx: Prisma.TransactionClient) {
  const tournament = await tx.tournament.findUnique({
    where: { id: tournamentId },
    include: { players: true, matches: true },
  });
  if (!tournament) return;

  const allCompleted = tournament.matches.every((m) => m.status === MatchStatus.completed);
  if (!allCompleted) return;

  // Calculate rankings: winner = 1, runner-up = 2, others by elimination order (later elimination = better rank)
  const winnerId = tournament.winnerPlayerId;
  const ordered = [...tournament.players].sort((a, b) => {
    if (a.playerId === winnerId) return -1;
    if (b.playerId === winnerId) return 1;
    if (a.eliminationOrder && b.eliminationOrder) {
      return b.eliminationOrder - a.eliminationOrder;
    }
    return 0;
  });

  await Promise.all(
    ordered.map((player, idx) =>
      tx.tournamentPlayer.update({
        where: { id: player.id },
        data: { finalRank: idx + 1 },
      }),
    ),
  );

  await tx.tournament.update({
    where: { id: tournamentId },
    data: { status: TournamentStatus.completed },
  });
}

export async function reportMatch(params: ReportParams) {
  return prisma.$transaction(async (tx) => {
    const match = await tx.match.findUnique({
      where: { id: params.matchId },
      include: {
        tournament: true,
      },
    });

    if (!match) {
      throw new Error("Match not found");
    }

    if (match.status === MatchStatus.completed) {
      throw new Error("Match already completed");
    }

    const { player1Id, player2Id } = match;
    if (!player1Id || !player2Id) {
      throw new Error("Match missing players");
    }

    const winnerId = params.winnerId;
    if (winnerId !== player1Id && winnerId !== player2Id) {
      throw new Error("Winner not in match");
    }
    const loserId = winnerId === player1Id ? player2Id : player1Id;

    const winnerPlayerRecord = await tx.tournamentPlayer.findUnique({ where: { id: winnerId } });

    await tx.match.update({
      where: { id: match.id },
      data: {
        winnerId,
        player1Score: params.player1Score ?? null,
        player2Score: params.player2Score ?? null,
        status: MatchStatus.completed,
      },
    });

    await tx.tournamentPlayer.update({
      where: { id: winnerId },
      data: { winsCount: { increment: 1 } },
    });

    const loser = await tx.tournamentPlayer.update({
      where: { id: loserId },
      data: { lossCount: { increment: 1 } },
    });

    if (loser.lossCount >= 2 || !match.nextLoserMatchId) {
      const maxElimination =
        (await tx.tournamentPlayer.aggregate({
          where: { tournamentId: match.tournamentId },
          _max: { eliminationOrder: true },
        }))._max.eliminationOrder ?? 0;
      await tx.tournamentPlayer.update({
        where: { id: loserId },
        data: { eliminationOrder: maxElimination + 1 },
      });
    } else {
      await placeIntoMatch(match.nextLoserMatchId, loserId, tx);
    }

    if (match.nextWinnerMatchId) {
      await placeIntoMatch(match.nextWinnerMatchId, winnerId, tx);
    }

    if (match.bracket === "final" || !match.nextWinnerMatchId) {
      await tx.tournament.update({
        where: { id: match.tournamentId },
        data: { winnerPlayerId: winnerPlayerRecord?.playerId },
      });
    }

    await maybeFinalizeTournament(match.tournamentId, tx);
  });
}

export async function autoAdvanceIfBye(matchId: string) {
  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) return;

  const players = [match.player1Id, match.player2Id].filter(Boolean) as number[];
  if (players.length === 1) {
    const winnerId = players[0];
    await prisma.$transaction(async (tx) => {
      await tx.match.update({
        where: { id: matchId },
        data: { winnerId, status: MatchStatus.completed },
      });
      await tx.tournamentPlayer.update({
        where: { id: winnerId },
        data: { winsCount: { increment: 1 } },
      });
      if (match.nextWinnerMatchId) {
        await placeIntoMatch(match.nextWinnerMatchId, winnerId, tx);
      }
    });
  }
}
