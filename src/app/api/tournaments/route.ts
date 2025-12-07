import { NextResponse } from "next/server";
import { TournamentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdminToken, hashTournamentPassword } from "@/lib/auth";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(2),
  joinDeadlineOffsetMinutes: z.number().int().positive(),
  tournamentPassword: z.string().min(4),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") as TournamentStatus | null;

  const tournaments = await prisma.tournament.findMany({
    where: status ? { status } : {},
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { players: true } },
      winner: { select: { playerId: true, name: true } },
    },
  });

  return NextResponse.json({ tournaments });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = createSchema.parse(body);
    const adminToken = request.headers.get("x-admin-token");
    requireAdminToken(adminToken);

    const now = new Date();
    const joinDeadline = new Date(now.getTime() + data.joinDeadlineOffsetMinutes * 60 * 1000);

    const tournament = await prisma.tournament.create({
      data: {
        name: data.name,
        joinDeadline,
        status: TournamentStatus.joining,
        tournamentPasswordHash: hashTournamentPassword(data.tournamentPassword),
      },
      select: {
        id: true,
        name: true,
        joinDeadline: true,
        status: true,
      },
    });

    return NextResponse.json(tournament, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.status || 400 });
  }
}
