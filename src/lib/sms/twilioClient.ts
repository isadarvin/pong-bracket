import twilio from "twilio";

function getTwilioConfig() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    throw new Error(
      "Missing Twilio configuration. Required: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER"
    );
  }

  return { accountSid, authToken, fromNumber };
}

export async function sendSMS(to: string, body: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { accountSid, authToken, fromNumber } = getTwilioConfig();
    const client = twilio(accountSid, authToken);

    await client.messages.create({
      body,
      from: fromNumber,
      to,
    });

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send SMS";
    console.error("SMS send error:", message);
    return { success: false, error: message };
  }
}

export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
