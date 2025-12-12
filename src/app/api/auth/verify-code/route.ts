import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const verifyCodeSchema = z.object({
  phoneNumber: z.string().min(10).max(15),
  code: z.string().length(6),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber, code } = verifyCodeSchema.parse(body);

    const player = await prisma.globalPlayer.findFirst({
      where: { phoneNumber },
    });

    if (!player) {
      return NextResponse.json(
        { error: "Phone number not found. Please request a new code." },
        { status: 404 }
      );
    }

    if (!player.verificationCode || !player.verificationExpiry) {
      return NextResponse.json(
        { error: "No verification code found. Please request a new code." },
        { status: 400 }
      );
    }

    if (new Date() > player.verificationExpiry) {
      return NextResponse.json(
        { error: "Verification code expired. Please request a new code." },
        { status: 400 }
      );
    }

    if (player.verificationCode !== code) {
      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 400 }
      );
    }

    // Mark as verified and clear the code
    await prisma.globalPlayer.update({
      where: { playerId: player.playerId },
      data: {
        verified: true,
        verificationCode: null,
        verificationExpiry: null,
      },
    });

    return NextResponse.json({
      success: true,
      playerId: player.playerId,
      name: player.name,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
