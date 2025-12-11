import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminToken } from "@/lib/auth";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; playerId: string }> }
) {
  try {
    const { id, playerId } = await params;
    const tournamentId = Number(id);
    const tournamentPlayerId = Number(playerId);
    const adminToken = request.headers.get("x-admin-token");
    requireAdminToken(adminToken);

    // Verify the tournament is still in joining phase
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { status: true },
    });

    if (!tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }

    if (tournament.status !== "joining") {
      return NextResponse.json(
        { error: "Cannot remove players after tournament has started" },
        { status: 400 }
      );
    }

    // Delete the tournament player
    await prisma.tournamentPlayer.delete({
      where: {
        id: tournamentPlayerId,
        tournamentId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    const status = (error as { status?: number }).status || 400;
    return NextResponse.json({ error: message }, { status });
  }
}
