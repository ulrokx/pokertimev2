import { Card } from "./card";
import { Position, positionsForSizedGame } from "./constants";
import { Deck } from "./deck";
import { PokerHand } from "./poker-hand";
import { HoldemSeat, Seat } from "./seat";
import { rotateArrayLeft } from "./util";

enum BettingRound {
  PREFLOP = "preflop",
  FLOP = "flop",
  TURN = "turn",
  RIVER = "river",
  SHOWDOWN = "showdown",
}

export enum Action {
  FOLD = "fold",
  CHECK = "check",
  CALL = "call",
  BET = "bet",
}

export type HoldemGameAction =
  | {
      action: Action.FOLD | Action.CHECK | Action.CALL;
    }
  | {
      action: Action.BET;
      amount: number;
    };

type ActionLogItem = {
  seatId: string;
  action: HoldemGameAction;
};

interface HoldemGameStateOptions {
  includeCardsFor?: [Position] | "ALL";
  includeActionLog?: boolean;
}

interface HoldemGameState {
  state: BettingRound;
  pot: number;
  nextToAct: Position;
  seats: Record<Position, HoldemSeat>;
  communityCards: Card[];
  actionLog?: ActionLogItem[];
  outcome?: HoldemGameOutcome;
}

interface HoldemGameOutcome {
  finalHands: Record<Position, PokerHand>;
  winners: Position[];
  newStacks: Record<Position, number>;
}

export class HoldemGame {
  private seats: Record<Position, HoldemSeat>;
  private state: BettingRound = BettingRound.PREFLOP;
  private pot: number = 0;
  private lastBet: number = 0;
  private nextToAct: Position;
  private actionLog: ActionLogItem[] = [];
  private communityCards: Card[] = [];
  private outcome?: HoldemGameOutcome;

  public serialize() {
	return JSON.stringify({
		seats: this.seats,
		state: this.state,
		pot: this.pot,
		lastBet: this.lastBet,
		nextToAct: this.nextToAct,
		actionLog: this.actionLog,
		communityCards: this.communityCards,
		outcome: this.outcome,
		deck: this.deck.serialize(),
	})
  }

  private fromSerialized(serialized: string) {
	const parsed = JSON.parse(serialized);
	this.seats = parsed.seats;
	this.state = parsed.state;
	this.pot = parsed.pot;
	this.lastBet = parsed.lastBet;
	this.nextToAct = parsed.nextToAct;
	this.actionLog = parsed.actionLog;
	this.communityCards = parsed.communityCards;
	this.outcome = parsed.outcome;
	this.deck = Deck.fromSerialized(parsed
		  }

  constructor(
  seats: Seat[],
  buttonSeatId: string,
  private deck: Deck
) {
    const seatCount = Object.keys(seats).length;
    if (seatCount < 2) {
      throw new Error("At least 2 seats are required to start a hand");
    }

    const positions = positionsForSizedGame[seatCount];

    if (!positions) {
      throw new Error("Unsupported number of seats");
    }

    const buttonIndex = seats.findIndex(({ id }) => id === buttonSeatId);

    if (buttonIndex === -1) {
      throw new Error("Button seat id not found in seats");
    }

    seats = rotateArrayLeft(seats, buttonIndex);

    this.seats = seats.reduce<Record<Position, HoldemSeat>>(
      (acc, seat, index) => {
        const position = positions.at(index)!;
        acc[position] = new HoldemSeat(
          seat.id,
          seat.stack,
          position,
          positions.at(index - 1)!,
          positions.at((index + 1) % seatCount)!,
          [deck.draw(), deck.draw()],
        );
        return acc;
      },
      {} as Record<Position, HoldemSeat>,
    );

    const bb = this.seats["BB"];
    let sb: HoldemSeat;
    if (seatCount === 2) {
      sb = this.seats["BTN"];
    } else {
      sb = this.seats["SB"];
    }
    this.nextToAct = sb.position;
    this.bet(sb, 1);
    this.bet(bb, 2);
    this.nextToAct = bb.nextPosition;
  }

  public act(position: Position, action: HoldemGameAction) {
    if (this.nextToAct !== position) {
      throw new Error("Not this player's turn");
    }
    const seat = this.seats[position];
    this.actionLog.push({ seatId: seat.id, action });
    switch (action.action) {
      case Action.FOLD:
        seat.folded = true;
        this.removeSeatFromLl(seat);
        break;
      case Action.CHECK:
        seat.lastAction = action;
        break;
      case Action.CALL:
        this.call(seat);
        break;
      case Action.BET:
        this.bet(seat, action.amount);
        break;
    }
    seat.lastAction = action;
    if (this.nonFoldedSeats().length === 1) {
      const winner = this.activeSeats()[0]!.position;
      this.outcome = {
        finalHands: this.getPokerHands(),
        winners: [winner],
        newStacks: Object.values(this.seats).reduce(
          (acc, seat) => {
            acc[seat.position] = seat.remainingStack;
            if (seat.position === winner) {
              acc[seat.position] += this.pot;
            }
            return acc;
          },
          {} as Record<Position, number>,
        ),
      };
      this.state = BettingRound.SHOWDOWN;
      return;
    }
    this.nextToAct = this.seats[this.nextToAct].nextPosition;
    this.advanceStateIfPossible();
  }

  private getPokerHands() {
    return Object.values(this.seats).reduce<Record<Position, PokerHand>>(
      (acc, seat) => {
        const holeCards = seat.cards;
        const communityCards = this.communityCards;
        acc[seat.position] = new PokerHand([...holeCards, ...communityCards]);
        return acc;
      },
      {} as Record<Position, PokerHand>,
    );
  }

  private shouldAdvanceState() {
    const activeSeats = this.nonFoldedSeats();
    return activeSeats.every(
      (seat) =>
        seat.allIn || (seat.inPot === activeSeats[0]!.inPot && seat.lastAction),
    );
  }

  private advanceState() {
    if (this.state === BettingRound.SHOWDOWN) {
      throw new Error("Hand is already at showdown");
    }

    if (this.state === BettingRound.RIVER) {
      this.state = BettingRound.SHOWDOWN;
      this.showdown();
      return;
    }

    this.activeSeats().forEach((seat) => {
      seat.lastAction = null;
      seat.inPot = 0;
    });

    if (this.state === BettingRound.PREFLOP) {
      this.state = BettingRound.FLOP;
      this.communityCards = [
        this.deck.draw(),
        this.deck.draw(),
        this.deck.draw(),
      ];
    } else if (this.state === BettingRound.FLOP) {
      this.state = BettingRound.TURN;
      this.communityCards.push(this.deck.draw());
    } else if (this.state === BettingRound.TURN) {
      this.state = BettingRound.RIVER;
      this.communityCards.push(this.deck.draw());
    }
    this.lastBet = 0;
    this.nextToAct = this.seats["BTN"].nextPosition;
  }

  private showdown() {
    const activeSeats = this.activeSeats();
    const hands = activeSeats.reduce(
      (acc, seat) => {
        const holeCards = seat.cards;
        const communityCards = this.communityCards;
        acc[seat.position] = new PokerHand([...holeCards, ...communityCards]);
        return acc;
      },
      {} as Record<Position, PokerHand>,
    );
    const sortedHands = Object.entries(hands).sort(([_, hand1], [__, hand2]) =>
      hand2.compare(hand1),
    );
    const winners = sortedHands
      .filter(([_, hand]) => hand.compare(sortedHands[0]![1]) === 0)
      .map(([position]) => position as Position);
    const winnings = this.pot / winners.length;
    this.outcome = {
      finalHands: hands,
      winners,
      newStacks: activeSeats.reduce(
        (acc, seat) => {
          acc[seat.position] = seat.remainingStack;
          if (winners.includes(seat.position)) {
            acc[seat.position] += winnings;
          }
          return acc;
        },
        {} as Record<Position, number>,
      ),
    };
  }

  private advanceStateIfPossible() {
    if (this.shouldAdvanceState()) {
      this.advanceState();
    }
  }

  private activeSeats() {
    return Object.values(this.seats).filter(
      (seat) => !seat.folded && !seat.allIn,
    );
  }

  private nonFoldedSeats() {
    return Object.values(this.seats).filter((seat) => !seat.folded);
  }

  private bet(seat: HoldemSeat, amount: number) {
    if (amount > seat.remainingStack) {
      throw new Error("Bet amount exceeds remaining stack");
    }
    const allIn = amount === seat.remainingStack;
    if (this.lastBet) {
      if (amount < this.lastBet) {
        throw new Error("Bet amount is less than last bet");
      }
      if (amount === this.lastBet) {
        throw new Error("Bet amount is equal to last bet");
      }
      if (!allIn && amount < this.lastBet * 2) {
        throw new Error("Bet amount is less than twice the last bet");
      }
    }
    if (allIn) {
      seat.allIn = true;
      this.removeSeatFromLl(seat);
    }
    const amountToPutInPot = amount - seat.inPot;
    seat.remainingStack -= amountToPutInPot;
    seat.inPot += amountToPutInPot;
    this.pot += amountToPutInPot;
    this.lastBet = amount;
  }

  private call(seat: HoldemSeat) {
    if (!this.lastBet) {
      throw new Error("No bet to call");
    }
    if (seat.remainingStack <= this.lastBet) {
      seat.allIn = true;
      this.removeSeatFromLl(seat);
    }
    const callAmount = Math.min(seat.remainingStack, this.lastBet);
    const amountToPutInPot = callAmount - seat.inPot;
    seat.inPot += amountToPutInPot;
    this.pot += amountToPutInPot;
    seat.remainingStack -= amountToPutInPot;
  }

  private removeSeatFromLl(seat: HoldemSeat) {
    const prev = this.seats[seat.prevPosition];
    const next = this.seats[seat.nextPosition];
    prev.nextPosition = next.position;
    next.prevPosition = prev.position;
  }

  public getSeatByPosition(position: Position) {
    if (!this.seats[position]) {
      throw new Error("Seat not found");
    }
    return this.seats[position];
  }

  public getButtonSeat() {
    return this.getSeatByPosition("BTN");
  }

  public getSeats() {
    return this.seats;
  }

  public getHandState({
    includeActionLog = false,
    includeCardsFor = "ALL",
  }: HoldemGameStateOptions = {}): HoldemGameState {
    return {
      state: this.state,
      pot: this.pot,
      nextToAct: this.nextToAct,
      actionLog: includeActionLog ? this.actionLog : undefined,
      communityCards: this.communityCards,
      seats: Object.values(this.seats).reduce<Record<Position, HoldemSeat>>(
        (acc, seat) => {
          acc[seat.position] = {
            ...seat,
            cards:
              includeCardsFor === "ALL" ||
              includeCardsFor.includes(seat.position)
                ? seat.cards
                : [Card.hidden(), Card.hidden()],
          };
          return acc;
        },
        {} as Record<Position, HoldemSeat>,
      ),
      outcome: this.outcome,
    };
  }
}
