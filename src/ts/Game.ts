import Board, { BoardEvent, EVENT_BOARD_CLICKED } from "./Board";
import Piece from "./Piece";
import Node from "./Node";

interface Player {
  name: string;
  color: "black" | "white";
  points: number;
}

export default class Game {
  private _board: Board;
  private _boardElement?: Element;
  private _localPlayer?: Player;
  private _currentPlayer?: Player;
  private _selectedNode?: Node;
  private _posibleHits: Node[];
  private _players: Player[] = [];
  private _turns: number = 0;

  constructor() {
    this._board = new Board(8, 8);
    // this.setupPlayer();
    this.setupBoard();
    this.setupPlayers();
  }

  public setupPlayers() {
    this._players.push({ name: "Player 1", color: "black", points: 0 });
    this._players.push({ name: "Player 2", color: "white", points: 0 });
    this._currentPlayer = this._players[this._turns % 2];
  }

  public setupBoard() {
    this._boardElement = this._board.drawBoard();
    this._board.addEventListener(EVENT_BOARD_CLICKED, (e) =>
      this.handleClick(e)
    );
    this._board.setupPieces();
  }

  private handleClick(event: Event) {
    const boardEvent = event as BoardEvent;
    const piece = boardEvent.nodeView.model.getPiece();
    const node = boardEvent.nodeView.model;

    if (piece) {
      if (piece.color === this._currentPlayer?.color) {
        this._board.clearHighlights();
        if (this._selectedNode === node) {
          this._selectedNode = undefined;
          this._posibleHits = [];
          return;
        }
        this._selectedNode = node;
        const { availableNodes, hitNodes } = this._board.getAvailableNodes(
          node.id
        );

        this._posibleHits = hitNodes;
        for (const highlight of availableNodes) {
          highlight.placePiece(new Piece("highlight"));
        }
      } else if (piece.color === "highlight") {
        this._board.clearHighlights();
        if (this._posibleHits.length > 0) {
          console.log(this._posibleHits);
          for (const hitNode of this._posibleHits) {
            console.log({ hitNode, selected: this._selectedNode, node });
            if (
              (this._selectedNode!.x < hitNode.x && node.x > hitNode.x) ||
              (node.x < hitNode.x && this._selectedNode!.x > hitNode.x)
            ) {
              hitNode.removePiece();
            }
          }
        }
        let piece = this._selectedNode!.removePiece();
        if (!piece) {
          piece = new Piece(this._currentPlayer?.color!);
        }
        node.placePiece(piece);
        this.handleTurn();
      }
    }
  }

  private handleTurn() {
    this._turns++;
    this._currentPlayer = this._players[this._turns % 2];
  }
}
