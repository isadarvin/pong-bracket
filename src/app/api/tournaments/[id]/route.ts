import { NextRequest, NextResponse } from "next/server";
import { TournamentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { verifyTournamentPassword, requireAdminToken } from "@/lib/auth";

function isValidAdminToken(token?: string | null): boolean {
  const adminSecret = process.env.ADMIN_PASSWORD;
  return !!(adminSecret && token && token === adminSecret);
}

async function requirePasswordIfNeeded(tournamentId: number, password?: string | null, adminToken?: string | null) {
  // Admin token bypasses tournament password requirement
  if (isValidAdminToken(adminToken)) return;

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { status: true, tournamentPasswordHash: true },
  });
  if (!tournament) throw new Error("Tournament not found");
  if (tournament.status === TournamentStatus.completed) return;
  if (!password) {
    throw new Error("Tournament password required");
  }
  if (!verifyTournamentPassword(password, tournament.tournamentPasswordHash)) {
    throw new Error("Invalid tournament password");
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const tournamentId = Number(id);
    const password = request.headers.get("x-tournament-password");
    const adminToken = request.headers.get("x-admin-token");
    const url = new URL(request.url);
    const passwordParam = url.searchParams.get("password");

    await requirePasswordIfNeeded(tournamentId, password || passwordParam, adminToken);

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        players: {
          include: { globalPlayer: true },
          orderBy: { seed: "asc" },
        },
        matches: true,
        winner: { select: { playerId: true, name: true } },
      },
    });

    if (!tournament) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const players = tournament.players.map((p) => ({
      id: p.id,
      name: p.globalPlayer.name,
      skillRating: p.skillRating,
      seed: p.seed,
      finalRank: p.finalRank,
      lossCount: p.lossCount,
      winsCount: p.winsCount,
    }));

    return NextResponse.json({
      tournament: {
        id: tournament.id,
        name: tournament.name,
        status: tournament.status,
        createdAt: tournament.createdAt,
        joinDeadline: tournament.joinDeadline,
        winner: tournament.winner,
      },
      players,
      matches: tournament.matches,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    const status = (error as { status?: number }).status || 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const tournamentId = Number(id);
    const adminToken = request.headers.get("x-admin-token");
    requireAdminToken(adminToken);

    // Delete in order: matches -> tournament players -> tournament
    await prisma.match.deleteMany({
      where: { tournamentId },
    });

    await prisma.tournamentPlayer.deleteMany({
      where: { tournamentId },
    });

    await prisma.tournament.delete({
      where: { id: tournamentId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    const status = (error as { status?: number }).status || 400;
    return NextResponse.json({ error: message }, { status });
  }
}
