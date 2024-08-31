import { describe, expect, it } from "vitest";
import { card } from "./card";
import { Hand, PokerHand } from "./poker-hand";

describe("poker-hand", () => {
  it.for<{ input: PokerHand; expected: Hand }>([
    {
      input: new PokerHand([
        card("Th"),
        card("Jh"),
        card("Qh"),
        card("Kh"),
        card("Ah"),
      ]),
      expected: { kind: "StraightFlush", high: "A", suit: "h" },
    },
    {
      input: new PokerHand([
        card("2h"),
        card("3h"),
        card("4h"),
        card("5h"),
        card("6h"),
      ]),
      expected: { kind: "StraightFlush", high: "6", suit: "h" },
    },
    {
      input: new PokerHand([
        card("2h"),
        card("2c"),
        card("2d"),
        card("2s"),
        card("3h"),
      ]),
      expected: { kind: "FourOfAKind", kicker: "3", quad: "2" },
    },
    {
      input: new PokerHand([
        card("2h"),
        card("2c"),
        card("2d"),
        card("3s"),
        card("3h"),
      ]),
      expected: { kind: "FullHouse", trips: "2", pair: "3" },
    },
    {
      input: new PokerHand([
        card("2h"),
        card("3c"),
        card("4d"),
        card("5s"),
        card("6h"),
      ]),
      expected: { kind: "Straight", high: "6" },
    },
    {
      input: new PokerHand([
        card("2h"),
        card("3h"),
        card("4h"),
        card("5h"),
        card("7h"),
      ]),
      expected: { kind: "Flush", ranks: ["7", "5", "4", "3", "2"], suit: "h" },
    },
    {
      input: new PokerHand([
        card("8h"),
        card("8c"),
        card("8s"),
        card("9h"),
        card("Td"),
      ]),
      expected: { kind: "ThreeOfAKind", kickers: ["T", "9"], trips: "8" },
    },
    {
      input: new PokerHand([
        card("2h"),
        card("2c"),
        card("3d"),
        card("3s"),
        card("4h"),
      ]),
      expected: { kind: "TwoPair", high: "3", low: "2", kicker: "4" },
    },
    {
      input: new PokerHand([
        card("8h"),
        card("8d"),
        card("3h"),
        card("4d"),
        card("5d"),
      ]),
      expected: { kind: "Pair", pair: "8", kickers: ["5", "4", "3"] },
    },
    {
      input: new PokerHand([
        card("Ah"),
        card("Jd"),
        card("8h"),
        card("4c"),
        card("2s"),
      ]),
      expected: { kind: "HighCard", kickers: ["A", "J", "8", "4", "2"] },
    },
  ])(`getHand returns $expected.kind`, ({ input, expected }) => {
    expect(input.hand).toEqual(expected);
  });
});
