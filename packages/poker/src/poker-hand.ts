import { Card, rankOfRankId, suitOfSuitId } from "./card";
import { idOfRank, Rank, Suit } from "./constants";

const bitCount = (x: number) => {
  x = x - ((x >> 1) & 0x55555555);
  x = (x & 0x33333333) + ((x >> 2) & 0x33333333);
  return (((x + (x >> 4)) & 0xf0f0f0f) * 0x1010101) >> 24;
};

const keepNmsb = (x: number, n: number) => {
  let result = 0;
  for (let i = 31; i >= 0; --i) {
    if (x & (1 << i)) {
      result |= 1 << i;
      if (--n === 0) {
        break;
      }
    }
  }
  return result;
};

const WHEEL = 0b1_0000_0000_1111;

const findStraight = (rankSet: number) => {
  const isStraight =
    rankSet & (rankSet << 1) & (rankSet << 2) & (rankSet << 3) & (rankSet << 4);
  if (isStraight != 0) {
    return keepNmsb(isStraight, 1);
  } else if ((rankSet & WHEEL) === WHEEL) {
    return 1 << 3;
  } else {
    return 0;
  }
};

const nRanksOfSet = (rankSet: number, n: number) => {
  const ranks = [];
  for (let i = 12; i >= 0; i--) {
    if (rankSet & (1 << i)) {
      ranks.push(i);
    }
    if (ranks.length === n) {
      break;
    }
  }
  return ranks;
};

const firstRankOfSet = (rankSet: number) => {
  const rank = nRanksOfSet(rankSet, 1)[0];
  if (rank === undefined) {
    throw new Error("Rank not found");
  }
  return rankOfRankId(rank);
};

export class PokerHand {
  public hand: Hand;
  constructor(public cards: Card[]) {
    this.hand = getHand(cards);
  }

  asInt() {
    return handToInt(this.hand);
  }

  compare(other: PokerHand) {
    return this.asInt() === other.asInt()
      ? 0
      : this.asInt() > other.asInt()
        ? 1
        : -1;
  }
}

// stolen from https://github.com/b-inary/postflop-solver/blob/main/src/hand.rs
export const getHand = (hand: Card[]): Hand => {
  let rankSet = 0;
  const rankSetSuit = Array(4).fill(0);
  const rankSetOfCount = Array(5).fill(0);
  const rankCount = Array(13).fill(0);

  for (const { rankId, suitId } of hand) {
    rankSet |= 1 << rankId;
    rankSetSuit[suitId] |= 1 << rankId;
    rankCount[rankId] += 1;
  }

  for (let i = 0; i < 13; i++) {
    rankSetOfCount[rankCount[i]] |= 1 << i;
  }

  let flushSuit = null;

  for (let i = 0; i < 4; i++) {
    if (bitCount(rankSetSuit[i]) >= 5) {
      flushSuit = i;
    }
  }

  const isStraight = findStraight(rankSet);

  if (flushSuit !== null) {
    const isStraightFlush = findStraight(rankSetSuit[flushSuit]);
    if (isStraightFlush !== 0) {
      return {
        kind: "StraightFlush",
        high: firstRankOfSet(isStraightFlush),
        suit: suitOfSuitId(flushSuit),
      };
    } else {
      return {
        kind: "Flush",
        ranks: nRanksOfSet(rankSetSuit[flushSuit], 5).map(rankOfRankId),
        suit: suitOfSuitId(flushSuit),
      };
    }
  }
  if (rankSetOfCount[4] !== 0) {
    const kicker = keepNmsb(rankSet ^ rankSetOfCount[4], 1);
    return {
      kind: "FourOfAKind",
      kicker: firstRankOfSet(kicker),
      quad: firstRankOfSet(keepNmsb(rankSetOfCount[4], 1)),
    };
  }
  if (rankSetOfCount[3] !== 0 && rankSetOfCount[2] !== 0) {
    return {
      kind: "FullHouse",
      trips: firstRankOfSet(keepNmsb(rankSetOfCount[3], 1)),
      pair: firstRankOfSet(keepNmsb(rankSetOfCount[2], 1)),
    };
  }
  if (isStraight !== 0) {
    return { kind: "Straight", high: firstRankOfSet(isStraight) };
  }
  if (rankSetOfCount[3] !== 0) {
    const trips = keepNmsb(rankSetOfCount[3], 1);
    return {
      kind: "ThreeOfAKind",
      trips: firstRankOfSet(trips),
      kickers: nRanksOfSet(rankSet ^ trips, 2).map(rankOfRankId),
    };
  }
  if (bitCount(rankSetOfCount[2]) >= 2) {
    const [high, low] = nRanksOfSet(rankSetOfCount[2], 2) as [number, number];
    const kicker = keepNmsb(rankSet ^ (1 << high) ^ (1 << low), 1);
    return {
      kind: "TwoPair",
      high: rankOfRankId(high),
      low: rankOfRankId(low),
      kicker: firstRankOfSet(kicker),
    };
  }
  if (rankSetOfCount[2] !== 0) {
    const pair = keepNmsb(rankSetOfCount[2], 1);
    return {
      kind: "Pair",
      pair: firstRankOfSet(pair),
      kickers: nRanksOfSet(rankSet ^ pair, 3).map(rankOfRankId),
    };
  }
  return {
    kind: "HighCard",
    kickers: nRanksOfSet(rankSet, 5).map(rankOfRankId),
  };
};

/**
 * We can encode each of the hands into a number then compare them normally
 * Royal flushes - 1
 * Straight flushes - 5 high to A high, 10 total
 * Quads - 13
 * Full houses - 13 for top card, 12 for bottom card (13 * 12 = 156)
 * Flushes - 13 * 12 * 11 * 10 * 9
 * Straights - 10, suits don't matter
 * Trips - 13 * 12 * 11
 * Two pair - 13 * 12 * 11
 * Pair - 13 * 12
 * High card - 13 * 12 * 11 * 10 * 9
 */

interface HandADT {
  StraightFlush: { high: Rank; suit: Suit };
  FourOfAKind: { quad: Rank; kicker: Rank };
  FullHouse: { trips: Rank; pair: Rank };
  Flush: { ranks: Rank[]; suit: Suit };
  Straight: { high: Rank };
  ThreeOfAKind: { trips: Rank; kickers: Rank[] };
  TwoPair: { high: Rank; low: Rank; kicker: Rank };
  Pair: { pair: Rank; kickers: Rank[] };
  HighCard: { kickers: Rank[] };
}

type ToADT<T> = {
  [K in keyof T]: { kind: K } & T[K];
}[keyof T];

export type Hand = ToADT<HandADT>;

/**
 * Converts 7 4-bit numbers into a single 32-bit number starting from the most significant bit
 */
const encodeHex = (numbers: number[]) => {
  if (numbers.length > 7) {
    throw new Error("Too many numbers");
  }
  return numbers.reduce((acc, cur, i) => {
    if (cur < 0 || cur > 15) {
      throw new Error("Invalid number");
    }
    return acc | (cur << (24 - i * 4));
  }, 0);
};

export const handToInt = (hand: Hand) => {
  switch (hand.kind) {
    case "StraightFlush":
      return encodeHex([14, idOfRank(hand.high)]);
    case "FourOfAKind":
      return encodeHex([13, idOfRank(hand.quad), idOfRank(hand.kicker)]);
    case "FullHouse":
      return encodeHex([12, idOfRank(hand.trips), idOfRank(hand.pair)]);
    case "Flush":
      return encodeHex([11, ...hand.ranks.map(idOfRank)]);
    case "Straight":
      return encodeHex([10, idOfRank(hand.high)]);
    case "ThreeOfAKind":
      return encodeHex([
        9,
        idOfRank(hand.trips),
        ...hand.kickers.map(idOfRank),
      ]);
    case "TwoPair":
      return encodeHex([
        8,
        idOfRank(hand.high),
        idOfRank(hand.low),
        idOfRank(hand.kicker),
      ]);
    case "Pair":
      return encodeHex([7, idOfRank(hand.pair), ...hand.kickers.map(idOfRank)]);
    case "HighCard":
      return encodeHex([6, ...hand.kickers.map(idOfRank)]);
  }
};
