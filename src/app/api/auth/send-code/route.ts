import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendSMS, generateVerificationCode } from "@/lib/sms/twilioClient";
import { z } from "zod";

const sendCodeSchema = z.object({
  phoneNumber: z.string().min(10).max(15),
  name: z.string().min(2),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber, name } = sendCodeSchema.parse(body);

    const code = generateVerificationCode();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Find existing player by phone number, or create new one
    const existingPlayer = await prisma.globalPlayer.findFirst({
      where: { phoneNumber },
    });

    if (existingPlayer) {
      await prisma.globalPlayer.update({
        where: { playerId: existingPlayer.playerId },
        data: {
          name,
          verificationCode: code,
          verificationExpiry: expiry,
          verified: false,
        },
      });
    } else {
      await prisma.globalPlayer.create({
        data: {
          phoneNumber,
          name,
          verificationCode: code,
          verificationExpiry: expiry,
          verified: false,
        },
      });
    }

    const result = await sendSMS(
      phoneNumber,
      `Your Pong Tournament verification code is: ${code}`
    );

    if (!result.success) {
      return NextResponse.json(
        { error: "Failed to send verification code" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
