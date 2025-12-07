'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ThemeSetter } from "@/components/theme/ThemeSetter";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
  const [step, setStep] = useState<"password" | "join">("password");
  const [message, setMessage] = useState<string | null>(null);
  const [tournament, setTournament] = useState<TournamentInfo | null>(null);
  const [name, setName] = useState("");
  const [skill, setSkill] = useState(3);

  useEffect(() => {
    loadTournaments();
  }, []);

  useEffect(() => {
    if (selectedId) {
      const stored = sessionStorage.getItem(`tournament-${selectedId}-password`);
      if (stored) setPassword(stored);
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
      setStep("join");
    } catch (err: any) {
      setMessage(err.message);
    }
  };

  const handleJoin = async () => {
    setMessage(null);
    if (!selectedId) {
      setMessage("Select a tournament");
      return;
    }
    try {
      const res = await fetch(`/api/tournaments/${selectedId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          skill,
          tournamentPassword: password,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to join");
      setMessage(`Joined as ${name}. Your player id: ${data.tournamentPlayerId}`);
      sessionStorage.setItem(`tournament-${selectedId}-playerId`, String(data.tournamentPlayerId));
      setName("");
      setSkill(3);
    } catch (err: any) {
      setMessage(err.message);
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

        <Card className="p-6 space-y-4" tone="accent">
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

          {step === "join" && (
            <div className="grid gap-4">
              <p className="text-sm text-[var(--ink-soft)]">
                Selected: <strong>{tournament?.name}</strong>
              </p>
              {tournament?.status === "joining" ? (
                <>
                  <Input
                    label="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="You"
                  />
                  <label className="flex flex-col gap-2 text-sm text-[var(--ink-soft)]">
                    <span className="font-semibold text-[var(--ink)]">Skill (1–5)</span>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      value={skill}
                      onChange={(e) => setSkill(Number(e.target.value))}
                    />
                    <span className="text-xs text-[var(--ink-soft)]">Self-rated: {skill}</span>
                  </label>
                  <Button onClick={handleJoin}>Join tournament</Button>
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
    </>
  );
}
