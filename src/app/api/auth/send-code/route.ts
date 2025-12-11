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
    console.log("[send-code] Starting request");

    const body = await request.json();
    console.log("[send-code] Parsed body:", { phoneNumber: body.phoneNumber, name: body.name });

    const { phoneNumber, name } = sendCodeSchema.parse(body);

    const code = generateVerificationCode();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    console.log("[send-code] Looking for existing player");

    // Find existing player by phone number, or create new one
    const existingPlayer = await prisma.globalPlayer.findFirst({
      where: { phoneNumber },
    });

    console.log("[send-code] Existing player:", existingPlayer ? "found" : "not found");

    if (existingPlayer) {
      console.log("[send-code] Updating existing player");
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
      console.log("[send-code] Creating new player");
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

    console.log("[send-code] Player saved, sending SMS");

    const result = await sendSMS(
      phoneNumber,
      `Your Pong Tournament verification code is: ${code}`
    );

    console.log("[send-code] SMS result:", result);

    if (!result.success) {
      console.error("[send-code] SMS failed:", result.error);
      return NextResponse.json(
        { error: `Failed to send verification code: ${result.error}` },
        { status: 500 }
      );
    }

    console.log("[send-code] Success");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[send-code] Error:", error);
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
