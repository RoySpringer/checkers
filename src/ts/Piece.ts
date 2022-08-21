export const PIECE_COLORS: string[] = ["black", "white", "highlight"];

export const getOppositeColor = (
  color: "black" | "white"
): "black" | "white" => {
  return PIECE_COLORS[(PIECE_COLORS.indexOf(color) + 1) % 2] as
    | "black"
    | "white";
};

export default class Piece {
  private _color: "black" | "white" | "highlight";

  constructor(color: "black" | "white" | "highlight") {
    this._color = color;
  }

  public get color(): "black" | "white" | "highlight" {
    return this._color;
  }
}
