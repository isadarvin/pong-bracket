import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyTournamentPassword } from "@/lib/auth";
import { reportMatch } from "@/lib/tournament/matchProgression";
import { z } from "zod";

const reportSchema = z.object({
  tournamentPassword: z.string(),
  reporterTournamentPlayerId: z.number().int(),
  winnerTournamentPlayerId: z.number().int(),
  player1Score: z.number().int().nullable().optional(),
  player2Score: z.number().int().nullable().optional(),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ matchId: string }> }) {
  try {
    const { matchId } = await params;
    const body = await request.json();
    const data = reportSchema.parse(body);

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { tournament: true },
    });

    if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });

    if (
      data.reporterTournamentPlayerId !== match.player1Id &&
      data.reporterTournamentPlayerId !== match.player2Id
    ) {
      return NextResponse.json({ error: "Reporter not in match" }, { status: 401 });
    }

    if (
      data.winnerTournamentPlayerId !== match.player1Id &&
      data.winnerTournamentPlayerId !== match.player2Id
    ) {
      return NextResponse.json({ error: "Winner must be in match" }, { status: 400 });
    }

    if (
      !verifyTournamentPassword(data.tournamentPassword, match.tournament.tournamentPasswordHash)
    ) {
      return NextResponse.json({ error: "Invalid tournament password" }, { status: 401 });
    }

    await reportMatch({
      matchId,
      winnerId: data.winnerTournamentPlayerId,
      player1Score: data.player1Score ?? null,
      player2Score: data.player2Score ?? null,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
