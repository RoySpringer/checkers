export const PIECE_COLORS: string[] = ["black", "white", "highlight"];

export default class Piece {
  private _color: "black" | "white" | "highlight";

  constructor(color: "black" | "white" | "highlight") {
    this._color = color;
  }

  public get color(): "black" | "white" | "highlight" {
    return this._color;
  }
}
