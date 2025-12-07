'use client';

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ThemeSetter } from "@/components/theme/ThemeSetter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusPill } from "@/components/ui/status-pill";

type Tournament = {
  id: number;
  name: string;
  status: "joining" | "in_progress" | "completed";
  createdAt: string;
  joinDeadline: string;
  winner: { playerId: string; name: string } | null;
  _count: { players: number };
};

const TOKEN_KEY = "pong-admin-token";

export default function AdminPage() {
  const [adminToken, setAdminToken] = useState<string>("");
  const [authorized, setAuthorized] = useState(false);
  const [tokenInput, setTokenInput] = useState("");
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    tournamentPassword: "",
    joinDeadlineOffsetMinutes: 120,
  });

  useEffect(() => {
    const stored = sessionStorage.getItem(TOKEN_KEY);
    if (stored) {
      setAdminToken(stored);
      setTokenInput(stored);
      setAuthorized(true);
    }
  }, []);

  useEffect(() => {
    loadTournaments();
  }, []);

  const loadTournaments = async () => {
    const res = await fetch("/api/tournaments");
    if (res.ok) {
      const data = await res.json();
      setTournaments(data.tournaments);
    }
  };

  const handleCreate = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/tournaments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": adminToken,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Unable to create tournament");
      }
      setMessage("Tournament created");
      setForm((prev) => ({ ...prev, name: "" }));
      await loadTournaments();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to create tournament";
      setMessage(message);
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async (id: number) => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/tournaments/${id}/start`, {
        method: "POST",
        headers: {
          "x-admin-token": adminToken,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to start tournament");
      setMessage("Tournament started");
      await loadTournaments();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to start tournament";
      setMessage(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (adminToken) sessionStorage.setItem(TOKEN_KEY, adminToken);
  }, [adminToken]);

  const handleAuth = () => {
    if (!tokenInput) {
      setMessage("Enter the admin password");
      return;
    }
    setAdminToken(tokenInput);
    setAuthorized(true);
    setMessage(null);
  };

  const resetAuth = () => {
    sessionStorage.removeItem(TOKEN_KEY);
    setAuthorized(false);
    setAdminToken("");
    setTokenInput("");
  };

  const headerCopy = useMemo(
    () => ({
      title: "Admin Dashboard",
      blurb: "Create tournaments, seed by skill, and kick off play.",
    }),
    [],
  );

  return (
    <>
      <ThemeSetter theme="admin" />
      <div className="max-w-6xl mx-auto px-5 py-10 space-y-8">
        <header className="flex flex-col gap-2">
          <p className="uppercase text-xs tracking-[0.25em] text-[var(--ink-soft)]">Organize</p>
          <h1 className="text-4xl font-semibold">{headerCopy.title}</h1>
          <p className="text-base text-[var(--ink-soft)]">{headerCopy.blurb}</p>
        </header>

        {!authorized ? (
          <Card className="p-6 space-y-4">
            <p className="text-sm text-[var(--ink-soft)]">
              Enter the admin password to create or start tournaments.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Input
                label="Admin password"
                type="password"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Enter admin token"
              />
              <Button onClick={handleAuth}>Continue</Button>
            </div>
            {message && <p className="text-sm text-[var(--danger)]">{message}</p>}
          </Card>
        ) : (
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[var(--ink-soft)]">Admin access unlocked</p>
              <button
                type="button"
                onClick={resetAuth}
                className="text-xs font-semibold text-[var(--accent)] hover:underline"
              >
                Change password
              </button>
            </div>
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div className="flex-1 grid gap-3 md:grid-cols-3">
                <Input
                  label="Tournament name"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Office Ladder – Dec"
                />
                <Input
                  label="Tournament password"
                  type="password"
                  value={form.tournamentPassword}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, tournamentPassword: e.target.value }))
                  }
                  placeholder="court123"
                />
                <label className="flex flex-col gap-2 text-sm text-[var(--ink-soft)]">
                  <span className="font-semibold text-[var(--ink)]">Join window (hours)</span>
                  <input
                    type="number"
                    className="h-11 px-3 rounded-md border border-transparent border-b-2 bg-[var(--bg)] focus:border-b-[var(--accent)] focus:outline-none transition-colors text-[var(--ink)]"
                    value={form.joinDeadlineOffsetMinutes / 60}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        joinDeadlineOffsetMinutes: Number(e.target.value) * 60,
                      }))
                    }
                    min={1}
                    step={1}
                  />
                </label>
              </div>
              <Button disabled={loading} onClick={handleCreate}>
                Create tournament
              </Button>
            </div>
            {message && <p className="text-sm text-[var(--ink-soft)]">{message}</p>}
          </Card>
        )}

        <div className="grid gap-4">
          {tournaments.length === 0 && (
            <Card className="p-6">
              <p className="text-[var(--ink-soft)]">
                No tournaments yet – create one to start the next match.
              </p>
            </Card>
          )}
          {tournaments.map((t) => (
            <Card key={t.id} className="p-5">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-2xl font-semibold">{t.name}</h3>
                    <StatusPill status={t.status} />
                  </div>
                  <p className="text-sm text-[var(--ink-soft)]">
                    Join deadline {format(new Date(t.joinDeadline), "MMM d, h:mma")} •{" "}
                    {t._count.players} players
                  </p>
                  {t.winner && t.status === "completed" && (
                    <p className="text-sm text-success">Winner: {t.winner.name}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {t.status === "joining" && (
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={loading || !authorized}
                      onClick={() => handleStart(t.id)}
                    >
                      Start
                    </Button>
                  )}
                  <Link
                    href={`/tournament/${t.id}`}
                    className="inline-flex h-9 items-center justify-center rounded-full border border-[var(--accent)] px-3 text-sm font-semibold text-[var(--accent)] hover:bg-[var(--accent-soft)] transition-colors"
                  >
                    View bracket
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
