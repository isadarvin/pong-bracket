'use client';

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { ThemeSetter } from "@/components/theme/ThemeSetter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusPill } from "@/components/ui/status-pill";

type Player = {
  id: number;
  name: string;
  seed: number | null;
  finalRank: number | null;
  lossCount: number;
  winsCount: number;
};

type Match = {
  id: string;
  bracket: "winners" | "losers" | "final";
  round: number;
  matchIndex: number;
  player1Id: number | null;
  player2Id: number | null;
  winnerId: number | null;
  status: "pending" | "completed";
  player1Score: number | null;
  player2Score: number | null;
};

type Tournament = {
  id: number;
  name: string;
  status: "joining" | "in_progress" | "completed";
  joinDeadline?: string;
  winner?: number | null;
};

type TournamentResponse = {
  tournament: Tournament;
  players: Player[];
  matches: Match[];
};

export default function TournamentPage() {
  const { id } = useParams<{ id: string }>();
  const [password, setPassword] = useState("");
  const [data, setData] = useState<TournamentResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formState, setFormState] = useState<
    Record<string, { winnerId: number | null; player1Score: number | null; player2Score: number | null }>
  >({});
  const [reporterId, setReporterId] = useState<number | null>(null);
  const [reporterInput, setReporterInput] = useState<string>("");
  const [candidatePlayerId, setCandidatePlayerId] = useState<number | null>(null);
  const [storedReporterId, setStoredReporterId] = useState<number | null>(null);

  const loadTournament = async (pass: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/tournaments/${id}`, {
        headers: { "x-tournament-password": pass },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Unable to load tournament");
      setData(json);
      sessionStorage.setItem(`tournament-${id}-password`, pass);
    } catch (err: any) {
      setError(err.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const stored = sessionStorage.getItem(`tournament-${id}-password`);
    if (stored) {
      setPassword(stored);
      loadTournament(stored);
    }
    const storedPlayerId = sessionStorage.getItem(`tournament-${id}-playerId`);
    if (storedPlayerId) {
      const parsed = Number(storedPlayerId);
      setStoredReporterId(parsed);
      setReporterInput(String(parsed));
    }
  }, [id]);

  useEffect(() => {
    if (storedReporterId && data) {
      const found = data.players.find((p) => p.id === storedReporterId);
      if (found) {
        setCandidatePlayerId(found.id);
      }
    }
  }, [storedReporterId, data]);

  const playerLookup = useMemo(() => {
    const map = new Map<number, Player>();
    data?.players.forEach((p) => map.set(p.id, p));
    return map;
  }, [data]);

  const groupedByBracket = useMemo(() => {
    const base = {
      winners: [] as Match[][],
      losers: [] as Match[][],
      final: [] as Match[][],
    };
    data?.matches.forEach((m) => {
      const list = base[m.bracket];
      list[m.round - 1] = list[m.round - 1] ? [...list[m.round - 1], m] : [m];
    });
    return base;
  }, [data]);

  const submitResult = async (match: Match) => {
    const state = formState[match.id];
    if (!state?.winnerId) {
      setError("Select a winner before submitting");
      return;
    }
    if (!reporterId) {
      setError("Enter your player ID (from join) to report");
      return;
    }
    if (reporterId !== match.player1Id && reporterId !== match.player2Id) {
      setError("Your player ID must be one of the players in this match");
      return;
    }
    setError(null);
    try {
      const res = await fetch(`/api/matches/${match.id}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tournamentPassword: password,
          reporterTournamentPlayerId: reporterId,
          winnerTournamentPlayerId: state.winnerId,
          player1Score: state.player1Score,
          player2Score: state.player2Score,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Unable to submit result");
      await loadTournament(password);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const reporterPlayer =
    reporterId && data ? data.players.find((p) => p.id === reporterId) ?? null : null;
  const candidatePlayer =
    candidatePlayerId && data ? data.players.find((p) => p.id === candidatePlayerId) ?? null : null;

  const saveReporterId = () => {
    if (!candidatePlayer) {
      setError("Select your player first");
      return;
    }
    if (!reporterInput) {
      setError("Enter your player ID");
      return;
    }
    const parsed = Number(reporterInput);
    if (Number.isNaN(parsed)) {
      setError("Player ID must be a number");
      return;
    }
    if (parsed !== candidatePlayer.id) {
      setError("Player ID must match the selected player");
      return;
    }
    setReporterId(parsed);
    sessionStorage.setItem(`tournament-${id}-playerId`, String(parsed));
    setError(null);
  };

  const renderMatch = (match: Match) => {
    const p1 = match.player1Id ? playerLookup.get(match.player1Id) ?? null : null;
    const p2 = match.player2Id ? playerLookup.get(match.player2Id) ?? null : null;
    const state = formState[match.id] || { winnerId: reporterId, player1Score: null, player2Score: null };
    const isPending = match.status === "pending";
    const canReport =
      isPending && reporterId !== null && (match.player1Id === reporterId || match.player2Id === reporterId);

    return (
      <Card
        key={match.id}
        className={`p-4 space-y-3 h-full flex flex-col justify-between min-h-[150px] ${
          canReport ? "" : "opacity-60"
        }`}
      >
        <div className="flex justify-between items-center">
          <p className="text-xs uppercase tracking-wide text-[var(--ink-soft)]">
            {match.bracket} R{match.round}
          </p>
          <span className="text-xs font-semibold text-[var(--ink-soft)]">
            {match.status === "pending" ? "Pending" : "Completed"}
          </span>
        </div>
        <div className="space-y-2">
          <MatchPlayerRow
            player={p1}
            isWinner={match.winnerId === p1?.id}
            selectable={isPending && canReport}
            onSelect={() =>
              setFormState((prev) => ({
                ...prev,
                [match.id]: { ...state, winnerId: p1?.id || null },
              }))
            }
          />
          <MatchPlayerRow
            player={p2}
            isWinner={match.winnerId === p2?.id}
            selectable={isPending && canReport}
            onSelect={() =>
              setFormState((prev) => ({
                ...prev,
                [match.id]: { ...state, winnerId: p2?.id || null },
              }))
            }
          />
        </div>

        {isPending && (
          <div className="grid grid-cols-2 gap-2 items-center">
            <Input
              label="P1 score"
              type="number"
              value={state.player1Score ?? ""}
              disabled={!canReport}
              onChange={(e) =>
                setFormState((prev) => ({
                  ...prev,
                  [match.id]: { ...state, player1Score: Number(e.target.value) },
                }))
              }
            />
            <Input
              label="P2 score"
              type="number"
              value={state.player2Score ?? ""}
              disabled={!canReport}
              onChange={(e) =>
                setFormState((prev) => ({
                  ...prev,
                  [match.id]: { ...state, player2Score: Number(e.target.value) },
                }))
              }
            />
            <Button className="col-span-2" onClick={() => submitResult(match)} disabled={!canReport}>
              Submit result
            </Button>
          </div>
        )}

        {!isPending && match.winnerId && (
          <p className="text-sm text-success">Winner: {playerLookup.get(match.winnerId)?.name}</p>
        )}
      </Card>
    );
  };

  const needsPassword = !data && !loading;

  return (
    <>
      <ThemeSetter theme="player" />
      <div className="max-w-6xl mx-auto px-5 py-10 space-y-6">
        <header className="flex flex-col gap-2">
          <p className="uppercase text-xs tracking-[0.3em] text-[var(--ink-soft)]">Bracket</p>
          <h1 className="text-4xl font-semibold">{data?.tournament.name ?? "Tournament"}</h1>
          {data?.tournament.status && <StatusPill status={data.tournament.status as any} />}
        </header>

        {needsPassword && (
          <Card className="p-5 space-y-3" tone="accent">
            <p className="text-sm text-[var(--ink-soft)]">
              Enter the tournament password to view the bracket and report scores.
            </p>
            <Input
              label="Tournament password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button onClick={() => loadTournament(password)}>Unlock</Button>
          </Card>
        )}

        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

        {data && (
          <div className="grid gap-6">
            {!reporterPlayer ? (
              <Card className="p-5 space-y-4">
                <h2 className="text-xl font-semibold">Select your player</h2>
                <p className="text-sm text-[var(--ink-soft)]">
                  Pick yourself from the roster, then enter your player ID to start reporting. You can
                  still view the bracket afterward.
                </p>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {data.players.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setCandidatePlayerId(p.id);
                        setReporterInput("");
                      }}
                      className={`text-left rounded-card border px-4 py-3 transition-colors ${
                        candidatePlayerId === p.id
                          ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                          : "border-[var(--accent-soft)] hover:border-[var(--accent)]/70"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{p.name}</span>
                        {p.seed && <span className="text-xs text-[var(--ink-soft)]">Seed {p.seed}</span>}
                      </div>
                      <p className="text-xs text-[var(--ink-soft)]">
                        Record: {p.winsCount}–{p.lossCount}
                      </p>
                    </button>
                  ))}
                </div>
                {candidatePlayer && (
                  <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                    <Input
                      label={`Enter ID for ${candidatePlayer.name}`}
                      type="number"
                      value={reporterInput}
                      onChange={(e) => setReporterInput(e.target.value)}
                      placeholder="Paste your player ID"
                    />
                    <Button onClick={saveReporterId}>Confirm</Button>
                  </div>
                )}
              </Card>
            ) : (
              <Card className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">
                    Reporting as {reporterPlayer.name} (ID #{reporterPlayer.id})
                  </p>
                  <p className="text-xs text-[var(--ink-soft)]">You can still view all matches.</p>
                </div>
                <Button variant="secondary" size="sm" onClick={() => setReporterId(null)}>
                  Change
                </Button>
              </Card>
            )}

            {reporterPlayer && (
              <>
                <Card className="p-5">
                  <h2 className="text-2xl font-semibold mb-3">Players</h2>
                  <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {data.players.map((p) => (
                      <div
                        key={p.id}
                        className={`rounded-card border px-4 py-3 bg-[var(--bg)] ${
                          p.id === reporterPlayer.id
                            ? "border-[var(--accent)]"
                            : "border-[var(--accent-soft)]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">{p.name}</span>
                          {p.seed && <span className="text-xs text-[var(--ink-soft)]">Seed {p.seed}</span>}
                        </div>
                        <p className="text-xs text-[var(--ink-soft)]">
                          Record: {p.winsCount}–{p.lossCount}
                        </p>
                        {p.finalRank && data.tournament.status === "completed" && (
                          <p className="text-xs text-success">Final rank: {p.finalRank}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>

                <div className="space-y-4">
                  <h2 className="text-2xl font-semibold">Bracket</h2>
                  <div className="overflow-x-auto">
                    <div className="flex gap-4 min-w-full">
                      {groupedByBracket.winners.length > 0 && (
                        <div className="space-y-2 min-w-[220px]">
                          <h3 className="text-lg font-semibold">Winners</h3>
                          {groupedByBracket.winners.map((round, idx) => (
                            <div key={idx} className="space-y-2">
                              <p className="text-xs uppercase tracking-wide text-[var(--ink-soft)]">
                                Round {idx + 1}
                              </p>
                              <div
                                className="grid gap-3"
                                style={{ gridTemplateRows: `repeat(${round.length}, minmax(150px, auto))` }}
                              >
                                {round.map(renderMatch)}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {groupedByBracket.losers.length > 0 && (
                        <div className="space-y-2 min-w-[220px]">
                          <h3 className="text-lg font-semibold">Losers</h3>
                          {groupedByBracket.losers.map((round, idx) => (
                            <div key={idx} className="space-y-2">
                              <p className="text-xs uppercase tracking-wide text-[var(--ink-soft)]">
                                Round {idx + 1}
                              </p>
                              <div
                                className="grid gap-3"
                                style={{ gridTemplateRows: `repeat(${round.length}, minmax(150px, auto))` }}
                              >
                                {round.map(renderMatch)}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {groupedByBracket.final.length > 0 && (
                        <div className="space-y-2 min-w-[220px]">
                          <h3 className="text-lg font-semibold">Grand Final</h3>
                          {groupedByBracket.final.map((round, idx) => (
                            <div key={idx} className="space-y-2">
                              <div
                                className="grid gap-3"
                                style={{ gridTemplateRows: `repeat(${round.length}, minmax(150px, auto))` }}
                              >
                                {round.map(renderMatch)}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}

function MatchPlayerRow({
  player,
  isWinner,
  selectable,
  onSelect,
}: {
  player: Player | null;
  isWinner: boolean;
  selectable: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={selectable && player ? onSelect : undefined}
      className="w-full text-left rounded-lg border border-[var(--accent-soft)] px-3 py-2 bg-[var(--bg)] hover:border-[var(--accent)] transition-colors"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold">{player?.name ?? "TBD"}</p>
          {player?.seed && <p className="text-xs text-[var(--ink-soft)]">Seed {player.seed}</p>}
        </div>
        {isWinner && <span className="text-success text-sm font-semibold">Winner</span>}
      </div>
    </button>
  );
}
