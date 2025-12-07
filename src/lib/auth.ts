import crypto from "node:crypto";

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

export function requireAdminToken(token?: string | null) {
  const adminSecret = process.env.ADMIN_PASSWORD;
  if (!adminSecret) {
    throw new AuthError("ADMIN_PASSWORD not configured", 500);
  }

  if (!token || token !== adminSecret) {
    throw new AuthError("Invalid admin token", 401);
  }
}

export function hashTournamentPassword(password: string) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export function verifyTournamentPassword(password: string, hash: string) {
  return hashTournamentPassword(password) === hash;
}
