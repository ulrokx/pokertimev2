import { Card } from "./card";
import { Position } from "./constants";
import { HoldemGameAction } from "./holdem-game";

export class Seat {
  constructor(
    public id: string,
    public stack: number,
  ) {}
}

type LastAction = HoldemGameAction | null;

type HoleCards = [Card, Card];

export class HoldemSeat extends Seat {
  public allIn: boolean = false;
  public folded: boolean = false;
  public lastAction: LastAction = null;
  public inPot: number = 0;

  public remainingStack: number;

  constructor(
    id: string,
    stack: number,
    public position: Position,
    public prevPosition: Position,
    public nextPosition: Position,
    public cards: HoleCards,
  ) {
    super(id, stack);
    this.remainingStack = stack;
  }
}
