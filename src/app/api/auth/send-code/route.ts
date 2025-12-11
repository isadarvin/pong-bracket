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

    // Upsert the player - create if new, update verification code if exists
    await prisma.globalPlayer.upsert({
      where: { phoneNumber },
      update: {
        name,
        verificationCode: code,
        verificationExpiry: expiry,
        verified: false,
      },
      create: {
        phoneNumber,
        name,
        verificationCode: code,
        verificationExpiry: expiry,
        verified: false,
      },
    });

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
