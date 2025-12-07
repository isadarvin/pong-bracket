export type MatchCode =
  | "W1"
  | "W2"
  | "W3"
  | "W4"
  | "W5"
  | "W6"
  | "W7"
  | "L1"
  | "L2"
  | "L3"
  | "L4"
  | "L5"
  | "F1";

export type MatchBlueprint = {
  code: MatchCode;
  bracket: "winners" | "losers" | "final";
  round: number;
  matchIndex: number;
  nextWinner?: MatchCode;
  nextLoser?: MatchCode;
};

export const BRACKET8_BLUEPRINT: MatchBlueprint[] = [
  { code: "W1", bracket: "winners", round: 1, matchIndex: 1, nextWinner: "W5", nextLoser: "L1" },
  { code: "W2", bracket: "winners", round: 1, matchIndex: 2, nextWinner: "W5", nextLoser: "L1" },
  { code: "W3", bracket: "winners", round: 1, matchIndex: 3, nextWinner: "W6", nextLoser: "L2" },
  { code: "W4", bracket: "winners", round: 1, matchIndex: 4, nextWinner: "W6", nextLoser: "L2" },
  { code: "W5", bracket: "winners", round: 2, matchIndex: 1, nextWinner: "W7", nextLoser: "L3" },
  { code: "W6", bracket: "winners", round: 2, matchIndex: 2, nextWinner: "W7", nextLoser: "L4" },
  { code: "W7", bracket: "winners", round: 3, matchIndex: 1, nextWinner: "F1", nextLoser: "L5" },

  { code: "L1", bracket: "losers", round: 1, matchIndex: 1, nextWinner: "L3" },
  { code: "L2", bracket: "losers", round: 1, matchIndex: 2, nextWinner: "L4" },
  { code: "L3", bracket: "losers", round: 2, matchIndex: 1, nextWinner: "L5" },
  { code: "L4", bracket: "losers", round: 2, matchIndex: 2, nextWinner: "L5" },
  { code: "L5", bracket: "losers", round: 3, matchIndex: 1, nextWinner: "F1" },

  { code: "F1", bracket: "final", round: 1, matchIndex: 1 },
];

// Seed pairing for the initial four winners bracket matches.
export const BRACKET8_SEED_ORDER = [
  [1, 8],
  [4, 5],
  [2, 7],
  [3, 6],
];
