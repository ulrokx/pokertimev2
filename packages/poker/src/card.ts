import { Rank, ranks, Suit, suits } from "./constants";

export const suitOfSuitId = (suitId: number): Suit => {
  if (suitId < 0 || suitId >= 4) {
    throw new Error("Invalid suit id");
  }
  return suits[suitId]!;
};

export const rankOfRankId = (rankId: number): Rank => {
  if (rankId < 0 || rankId >= 13) {
    throw new Error("Invalid rank id");
  }
  return ranks[rankId]!;
};

export const card = (name: string) => {
  return Card.fromName(name);
};

export class Card {
  constructor(
    public suit: Suit,
    public rank: Rank,
    public hidden: boolean,
  ) {}

  public static hidden(): Card {
    return new Card("h", "2", true);
  }

  public static fromId(id: number): Card {
    if (id === -1) {
      return new Card("h", "2", true);
    }
    if (id < 0 || id >= 52) {
      throw new Error("Invalid card id");
    }
    const suit = suits[Math.floor(id / 13)] as Suit;
    const rank = ranks[id % 13] as Rank;
    return new Card(suit, rank, false);
  }

  public static fromName(name: string): Card {
    if (name === "XX") {
      return new Card("h", "2", true);
    }
    if (name.length !== 2) {
      throw new Error("Invalid card name");
    }
    const suit = name[1] as Suit;
    const rank = name[0] as Rank;
    return new Card(suit, rank, false);
  }

  public get id(): number {
    if (this.hidden) {
      return -1;
    }
    return suits.indexOf(this.suit) * 13 + ranks.indexOf(this.rank);
  }

  public get rankId(): number {
    return ranks.indexOf(this.rank);
  }

  public get suitId(): number {
    return suits.indexOf(this.suit);
  }

  public toString(): string {
    if (this.hidden) {
      return "XX";
    }
    return this.rank + this.suit;
  }
}
