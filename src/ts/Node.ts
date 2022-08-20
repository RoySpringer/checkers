import Piece from "./Piece";

export const EVENT_UPDATED: string = "updated";

export default class Node extends EventTarget {
  private _id: number;
  private _x: number;
  private _y: number;
  private _isAvailable: boolean;
  private _piece: Piece | null = null;
  private _willHit: boolean = false;

  constructor(id: number, x: number, y: number, isAvailable: boolean) {
    super();
    this._id = id;
    this._x = x;
    this._y = y;
    this._isAvailable = isAvailable;
  }

  public removePiece(): Piece | null {
    const piece = this._piece;
    this._piece = null;
    this.dispatchEvent(new Event(EVENT_UPDATED));
    return piece;
  }

  public placePiece(piece: Piece): void {
    if (!this.isAvailable) return;
    this._piece = piece;
    this.dispatchEvent(new Event(EVENT_UPDATED));
  }

  public getPiece(): Piece | null {
    return this._piece;
  }

  /**
   * Also returns false when piece is a highlight
   */
  public hasPiece(): boolean {
    return this._piece?.color === "black" || this._piece?.color === "white";
  }

  // Getter / Setters
  get id(): number {
    return this._id;
  }

  get x(): number {
    return this._x;
  }

  get y(): number {
    return this._y;
  }

  get isAvailable(): boolean {
    return this._isAvailable;
  }

  get willHit(): boolean {
    return this._willHit;
  }

  set willHit(value: boolean) {
    this._willHit = value;
    this.dispatchEvent(new Event(EVENT_UPDATED));
  }
}
