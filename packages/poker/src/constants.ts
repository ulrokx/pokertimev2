export const suits = ["s", "h", "c", "d"] as const;

export const ranks = [
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "T",
  "J",
  "Q",
  "K",
  "A",
] as const;

export const idOfRank = (rank: Rank) => ranks.indexOf(rank);

export type Suit = (typeof suits)[number];
export type Rank = (typeof ranks)[number];

export const positions = [
  "SB",
  "BB",
  "UTG",
  "UTG+1",
  "UTG+2",
  "LJ",
  "HJ",
  "CO",
  "BTN",
] as const;

export type Position = (typeof positions)[number];

export const positionsForSizedGame = {
  1: ["BTN"],
  2: ["BTN", "BB"],
  3: ["BTN", "SB", "BB"],
  4: ["BTN", "SB", "BB", "UTG"],
  5: ["BTN", "SB", "BB", "UTG", "CO"],
  6: ["BTN", "SB", "BB", "UTG", "UTG+1", "CO"],
  7: ["BTN", "SB", "BB", "UTG", "UTG+1", "HJ", "CO"],
  8: ["BTN", "SB", "BB", "UTG", "UTG+1", "UTG+2", "HJ", "CO"],
  9: ["BTN", "SB", "BB", "UTG", "UTG+1", "UTG+2", "LJ", "HJ", "CO"],
} as Record<number, Position[]>;
