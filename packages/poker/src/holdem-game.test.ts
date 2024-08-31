import { describe, expect, it } from "vitest";
import { Seat } from "./seat";
import { Action, HoldemGame } from "./holdem-game";
import { Deck } from "./deck";

describe("poker", () => {
  it("should create hand for 2 players", async () => {
    const deck = await Deck.shuffled();
    const game = new HoldemGame({
      seats: [new Seat("p-1", 100), new Seat("p-2", 100)],
      buttonSeatId: "p-1",
      deck,
    });

    const { communityCards, nextToAct, pot, seats, state } =
      game.getHandState();

    expect(communityCards).toEqual([]);
    expect(nextToAct).toEqual("BTN");
    expect(pot).toEqual(3);
    expect(state).toEqual("preflop");

    expect(seats["BTN"].id).toEqual("p-1");
  });

  it("should support a heads up game", async () => {
    const deck = await Deck.shuffled();
    const game = new HoldemGame({
      seats: [new Seat("p-1", 100), new Seat("p-2", 100)],
      buttonSeatId: "p-1",
      deck,
    });

    expect(game.getHandState().state).toEqual("preflop");
    game.act("BTN", { action: Action.CALL });
    game.act("BB", { action: Action.CHECK });
    expect(game.getHandState().state).toEqual("flop");
    game.act("BB", { action: Action.BET, amount: 4 });
    game.act("BTN", { action: Action.CALL });
    expect(game.getHandState().state).toEqual("turn");
    game.act("BB", { action: Action.CHECK });
    game.act("BTN", { action: Action.BET, amount: 8 });
    game.act("BB", { action: Action.BET, amount: 24 });
    game.act("BTN", { action: Action.CALL });
    expect(game.getHandState().state).toEqual("river");
    game.act("BB", { action: Action.CHECK });
    game.act("BTN", { action: Action.BET, amount: 50 });
    game.act("BB", { action: Action.CALL });
    expect(game.getHandState().state).toEqual("showdown");
    expect(game.getHandState().outcome).toBeDefined();
  });

  it("should support a heads up game with a fold", async () => {
    const deck = await Deck.shuffled();
    const game = new HoldemGame({
      seats: [new Seat("p-1", 100), new Seat("p-2", 100)],
      buttonSeatId: "p-1",
      deck,
    });

    expect(game.getHandState().state).toEqual("preflop");
    game.act("BTN", { action: Action.CALL });
    game.act("BB", { action: Action.FOLD });
    expect(game.getHandState().state).toEqual("showdown");
    expect(game.getHandState().outcome).toBeDefined();
  });

  it("should support a 3 player game", async () => {
    const deck = await Deck.shuffled();
    const game = new HoldemGame({
      seats: [new Seat("p-1", 100), new Seat("p-2", 100), new Seat("p-3", 100)],
      buttonSeatId: "p-1",
      deck,
    });

    expect(game.getHandState().state).toEqual("preflop");
    game.act("BTN", { action: Action.CALL });
    game.act("SB", { action: Action.CALL });
    game.act("BB", { action: Action.CHECK });
    expect(game.getHandState().state).toEqual("flop");
    game.act("SB", { action: Action.CHECK });
    game.act("BB", { action: Action.CHECK });
    game.act("BTN", { action: Action.CHECK });
    expect(game.getHandState().state).toEqual("turn");
    game.act("SB", { action: Action.CHECK });
    game.act("BB", { action: Action.BET, amount: 4 });
    game.act("BTN", { action: Action.CALL });
    game.act("SB", { action: Action.FOLD });
    expect(game.getHandState().state).toEqual("river");
    game.act("BB", { action: Action.CHECK });
    game.act("BTN", {
      action: Action.BET,
      amount: game.getSeatByPosition("BTN").remainingStack,
    });
    game.act("BB", { action: Action.CALL });
    expect(game.getHandState().state).toEqual("showdown");
    expect(game.getHandState().outcome).toBeDefined();
  });
});
