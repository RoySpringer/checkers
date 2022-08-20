import Node, { EVENT_UPDATED } from "./Node";
import { PIECE_COLORS } from "./Piece";

export default class NodeView {
  private _view: Element;
  private _model: Node;

  constructor(model: Node) {
    this._model = model;
    this._model.addEventListener(EVENT_UPDATED, (e) => this.updateView(e));
    this._view = this.createView();
  }

  private updateView(event: Event): void {
    const piece = this._model.getPiece();
    this.removePieces();
    if (piece) {
      this.view.classList.add(`piece-${piece.color}`);
    }
  }

  private removePieces(): void {
    for (const color of PIECE_COLORS) {
      this.view.classList.remove(`piece-${color}`);
    }
  }

  private createView(): Element {
    const nodeValue = document.createElement("span");
    const div = document.createElement("div");
    div.classList.add("node");
    div.classList.add(this._model.isAvailable ? "beige" : "brown");
    div.dataset.nodeId = "" + this._model.id;
    div.append(nodeValue);
    this._view = div;
    return div;
  }

  /**
   * Getters and setters
   */
  public get view(): Element {
    return this._view;
  }

  public get model(): Node {
    return this._model;
  }
}
