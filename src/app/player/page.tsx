'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ThemeSetter } from "@/components/theme/ThemeSetter";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

type TournamentInfo = { id: number; name: string; status: "joining" | "in_progress" | "completed" };
type TournamentListItem = {
  id: number;
  name: string;
  status: "joining" | "in_progress" | "completed";
};

export default function PlayerEntry() {
  const router = useRouter();
  const [tournaments, setTournaments] = useState<TournamentListItem[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [password, setPassword] = useState<string>("");
  const [step, setStep] = useState<"password" | "phone" | "verify" | "join">("password");
  const [message, setMessage] = useState<string | null>(null);
  const [tournament, setTournament] = useState<TournamentInfo | null>(null);
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [skill, setSkill] = useState(3);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [joinedPlayerName, setJoinedPlayerName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadTournaments();
  }, []);

  useEffect(() => {
    if (selectedId) {
      const stored = sessionStorage.getItem(`tournament-${selectedId}-password`);
      if (stored) setPassword(stored);
      const storedPhone = sessionStorage.getItem("verified-phone");
      if (storedPhone) setPhoneNumber(storedPhone);
    }
  }, [selectedId]);

  const loadTournaments = async () => {
    const res = await fetch("/api/tournaments");
    if (!res.ok) return;
    const data = await res.json();
    setTournaments(data.tournaments);
  };

  const verifyPassword = async () => {
    setMessage(null);
    if (!selectedId) {
      setMessage("Select a tournament");
      return;
    }
    try {
      const res = await fetch(`/api/tournaments/${selectedId}`, {
        headers: { "x-tournament-password": password },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to verify tournament");
      setTournament({
        id: data.tournament.id,
        name: data.tournament.name,
        status: data.tournament.status,
      });
      sessionStorage.setItem(`tournament-${selectedId}-password`, password);

      // Check if we already have a verified phone
      const storedPhone = sessionStorage.getItem("verified-phone");
      if (storedPhone) {
        setPhoneNumber(storedPhone);
        setStep("join");
      } else {
        setStep("phone");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to verify tournament";
      setMessage(message);
    }
  };

  const sendVerificationCode = async () => {
    setMessage(null);
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to send code");
      setStep("verify");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to send verification code";
      setMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyCode = async () => {
    setMessage(null);
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, code: verificationCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to verify code");

      // Store verified phone for future use
      sessionStorage.setItem("verified-phone", phoneNumber);
      setStep("join");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to verify code";
      setMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async () => {
    setMessage(null);
    if (!selectedId) {
      setMessage("Select a tournament");
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`/api/tournaments/${selectedId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber,
          skill,
          tournamentPassword: password,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to join");
      sessionStorage.setItem(`tournament-${selectedId}-playerId`, String(data.tournamentPlayerId));
      setJoinedPlayerName(name);
      setShowSuccessModal(true);
      setSkill(3);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to join";
      setMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <ThemeSetter theme="player" />
      <div className="max-w-3xl mx-auto px-5 py-12 space-y-6">
        <header className="space-y-2 text-center">
          <p className="uppercase text-xs tracking-[0.3em] text-[var(--ink-soft)]">Players</p>
          <h1 className="text-4xl font-semibold">Enter tournament</h1>
          <p className="text-[var(--ink-soft)]">Bring the password you received from the organizer.</p>
        </header>

        <Card className="p-6 space-y-4">
          {step === "password" && (
            <div className="grid gap-4">
              <div className="grid gap-3">
                <p className="text-sm text-[var(--ink-soft)]">
                  Select your tournament, then enter the organizer password.
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {tournaments.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedId(t.id)}
                      className={`rounded-card border px-3 py-3 text-left transition-colors ${
                        selectedId === t.id
                          ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                          : "border-[var(--ink-soft)]/20 bg-[var(--bg)] hover:border-[var(--accent)]/60"
                      }`}
                    >
                      <span className="font-semibold block">{t.name}</span>
                      <span className="text-xs uppercase tracking-wide text-[var(--ink-soft)]">
                        {t.status.replace("_", " ")}
                      </span>
                    </button>
                  ))}
                  {tournaments.length === 0 && (
                    <p className="text-sm text-[var(--ink-soft)]">
                      No tournaments yet. Ask the organizer to create one.
                    </p>
                  )}
                </div>
              </div>
              <Input
                label="Tournament password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button onClick={verifyPassword}>Continue</Button>
            </div>
          )}

          {step === "phone" && (
            <div className="grid gap-4">
              <p className="text-sm text-[var(--ink-soft)]">
                Selected: <strong>{tournament?.name}</strong>
              </p>
              <p className="text-sm text-[var(--ink-soft)]">
                Enter your name and phone number to verify your identity.
              </p>
              <Input
                label="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="You"
              />
              <Input
                label="Phone number"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1234567890"
              />
              <Button onClick={sendVerificationCode} disabled={isLoading || !name || !phoneNumber}>
                {isLoading ? "Sending..." : "Send verification code"}
              </Button>
              <Button variant="ghost" onClick={() => setStep("password")}>
                Back
              </Button>
            </div>
          )}

          {step === "verify" && (
            <div className="grid gap-4">
              <p className="text-sm text-[var(--ink-soft)]">
                Selected: <strong>{tournament?.name}</strong>
              </p>
              <p className="text-sm text-[var(--ink-soft)]">
                Enter the 6-digit code sent to {phoneNumber}
              </p>
              <Input
                label="Verification code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="123456"
                maxLength={6}
              />
              <Button onClick={verifyCode} disabled={isLoading || verificationCode.length !== 6}>
                {isLoading ? "Verifying..." : "Verify"}
              </Button>
              <Button variant="ghost" onClick={sendVerificationCode} disabled={isLoading}>
                Resend code
              </Button>
              <Button variant="ghost" onClick={() => setStep("phone")}>
                Change phone number
              </Button>
            </div>
          )}

          {step === "join" && (
            <div className="grid gap-4">
              <p className="text-sm text-[var(--ink-soft)]">
                Selected: <strong>{tournament?.name}</strong>
              </p>
              {tournament?.status === "joining" ? (
                <>
                  <p className="text-sm text-[var(--ink-soft)]">
                    Verified as: <strong>{name || "Player"}</strong> ({phoneNumber})
                  </p>
                  <label className="flex flex-col gap-2 text-sm text-[var(--ink-soft)]">
                    <span className="font-semibold text-[var(--ink)]">Skill (1-5)</span>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      value={skill}
                      onChange={(e) => setSkill(Number(e.target.value))}
                    />
                    <span className="text-xs text-[var(--ink-soft)]">Self-rated: {skill}</span>
                  </label>
                  <Button onClick={handleJoin} disabled={isLoading}>
                    {isLoading ? "Joining..." : "Join tournament"}
                  </Button>
                  <Button variant="ghost" onClick={() => {
                    sessionStorage.removeItem("verified-phone");
                    setPhoneNumber("");
                    setName("");
                    setVerificationCode("");
                    setStep("phone");
                  }}>
                    Use different phone
                  </Button>
                </>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-[var(--ink-soft)]">
                    Joining is closed. Continue to the live bracket to report scores.
                  </p>
                  <Button
                    onClick={() => {
                      if (selectedId) router.push(`/tournament/${selectedId}`);
                    }}
                  >
                    Go to bracket
                  </Button>
                </div>
              )}
            </div>
          )}
          {message && <p className="text-sm text-[var(--ink-soft)]">{message}</p>}
        </Card>
      </div>

      <Modal open={showSuccessModal} onClose={() => setShowSuccessModal(false)}>
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 mx-auto rounded-full bg-[var(--accent-soft)] flex items-center justify-center">
            <svg className="w-6 h-6 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold">You&apos;re in!</h2>
          <p className="text-[var(--ink-soft)]">
            <strong>{joinedPlayerName}</strong> has been registered for <strong>{tournament?.name}</strong>.
          </p>
          <div className="bg-[var(--bg)] rounded-lg p-4 text-left space-y-2">
            <p className="font-semibold text-sm">What&apos;s next?</p>
            <ul className="text-sm text-[var(--ink-soft)] space-y-1">
              <li>1. Wait for the organizer to start the tournament</li>
              <li>2. You&apos;ll receive an SMS when the tournament starts</li>
              <li>3. Play your matches and report scores</li>
            </ul>
          </div>
          <div className="flex flex-col gap-2 pt-2">
            <Button onClick={() => router.push(`/tournament/${selectedId}`)}>
              View bracket
            </Button>
            <Button variant="ghost" onClick={() => setShowSuccessModal(false)}>
              Register another player
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
