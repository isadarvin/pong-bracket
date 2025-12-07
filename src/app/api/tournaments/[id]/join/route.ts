import { NextRequest, NextResponse } from "next/server";
import { TournamentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { verifyTournamentPassword } from "@/lib/auth";
import { z } from "zod";

const joinSchema = z.object({
  name: z.string().min(2),
  skill: z.number().int().min(1).max(5),
  tournamentPassword: z.string(),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await request.json();
    const data = joinSchema.parse(body);
    const { id } = await params;
    const tournamentId = Number(id);

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
    });
    if (!tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }
    if (tournament.status !== TournamentStatus.joining) {
      return NextResponse.json({ error: "Tournament closed for joining" }, { status: 400 });
    }
    if (!verifyTournamentPassword(data.tournamentPassword, tournament.tournamentPasswordHash)) {
      return NextResponse.json({ error: "Invalid tournament password" }, { status: 401 });
    }

    const existingPlayer = await prisma.globalPlayer.findFirst({
      where: { name: data.name },
    });

    const globalPlayer =
      existingPlayer ||
      (await prisma.globalPlayer.create({
        data: { name: data.name },
      }));

    const tournamentPlayer = await prisma.tournamentPlayer.create({
      data: {
        tournamentId,
        playerId: globalPlayer.playerId,
        skillRating: data.skill,
      },
    });

    const players = await prisma.tournamentPlayer.findMany({
      where: { tournamentId },
      include: { globalPlayer: true },
      orderBy: { id: "asc" },
    });

    return NextResponse.json({
      tournamentPlayerId: tournamentPlayer.id,
      players: players.map((p) => ({
        id: p.id,
        name: p.globalPlayer.name,
        skill: p.skillRating,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
