import { NextResponse } from "next/server";
import { TournamentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdminToken } from "@/lib/auth";
import { initializeEightPlayerBracket } from "@/lib/tournament/bracketInitializer";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const tournamentId = Number(params.id);
    const adminToken = request.headers.get("x-admin-token");
    requireAdminToken(adminToken);

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: { players: true },
    });

    if (!tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }
    if (tournament.status !== TournamentStatus.joining) {
      return NextResponse.json({ error: "Tournament already started" }, { status: 400 });
    }

    const playerCount = tournament.players.length;
    if (playerCount < 8 || playerCount > 16) {
      return NextResponse.json({ error: "Player count must be between 8 and 16" }, { status: 400 });
    }

    const bracket = await initializeEightPlayerBracket(tournamentId);

    await prisma.tournament.update({
      where: { id: tournamentId },
      data: { status: TournamentStatus.in_progress },
    });

    return NextResponse.json({
      status: TournamentStatus.in_progress,
      bracketSize: bracket.bracketSize,
      matchCount: bracket.matchCount,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    // @ts-expect-error optional status from custom errors
    const status = (error as { status?: number }).status || 400;
    return NextResponse.json({ error: message }, { status });
  }
}
