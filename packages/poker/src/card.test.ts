import { describe, expect, it } from "vitest";
import { Card } from "./card";

describe("test", () => {
  it("creates a card from id", () => {
    const card = Card.fromId(5);
    expect(card.rank).toEqual("7");
    expect(card.suit).toEqual("s");
    expect(card.toString()).toEqual("7s");
  });

  it("fails to create a card from invalid id", () => {
    expect(() => Card.fromId(-2)).toThrow();
    expect(() => Card.fromId(52)).toThrow();
  });

  it("creates an hidden card", () => {
    const card = Card.hidden();
    expect(card.hidden).toEqual(true);
  });
});
