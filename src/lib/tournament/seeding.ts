import { TournamentPlayer } from "@prisma/client";

function shuffle<T>(list: T[]) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function seedPlayers(players: TournamentPlayer[]): TournamentPlayer[] {
  const grouped: Record<number, TournamentPlayer[]> = {};
  players.forEach((p) => {
    grouped[p.skillRating] = grouped[p.skillRating] || [];
    grouped[p.skillRating].push(p);
  });

  const orderedRatings = Object.keys(grouped)
    .map((n) => Number(n))
    .sort((a, b) => b - a);

  const seededList: TournamentPlayer[] = [];
  orderedRatings.forEach((rating) => {
    seededList.push(...shuffle(grouped[rating]));
  });

  return seededList.map((player, idx) => ({
    ...player,
    seed: idx + 1,
  }));
}
