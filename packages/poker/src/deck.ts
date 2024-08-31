import shuffle from "crypto-secure-shuffle";
import { Card } from "./card";

export class Deck {
  private nextCardIndex = 0;

  constructor(private cards: Card[]) {}

  public static async shuffled() {
    const cards = Array.from({ length: 52 }, (_, i) => Card.fromId(i));
    await shuffle(cards);

    return new Deck(cards);
  }

  public draw() {
    if (this.nextCardIndex === this.cards.length) {
      throw new Error("No cards left in the deck");
    }

    return this.cards[this.nextCardIndex++]!;
  }
}
