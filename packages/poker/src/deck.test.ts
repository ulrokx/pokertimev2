import { describe, expect, it } from "vitest";
import { Deck } from "./deck";
import { Card } from "./card";

describe("deck", () => {
  it("should create a deck", () => {
    const cards = Array.from({ length: 52 }, (_, i) => Card.fromId(i));
    const deck = new Deck(cards);

    expect(deck.draw().id).toEqual(0);
  });

  it("should create a shuffled deck", async () => {
    const deck = await Deck.shuffled();
    const card = deck.draw();
    expect(card).toBeInstanceOf(Card);
    expect(card.id).toBeGreaterThanOrEqual(0);
    expect(card.id).toBeLessThanOrEqual(51);
  });
});
