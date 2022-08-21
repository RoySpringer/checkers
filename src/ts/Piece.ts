export type Color = PieceColor | "highlight";
export type PieceColor = "black" | "white";

export const PIECE_COLORS: string[] = ["black", "white", "highlight"];

export const getOppositeColor = (color: PieceColor): PieceColor => {
  return PIECE_COLORS[(PIECE_COLORS.indexOf(color) + 1) % 2] as PieceColor;
};

export default class Piece {
  private _color: Color;

  constructor(color: Color) {
    this._color = color;
  }

  public get color(): Color {
    return this._color;
  }
}
