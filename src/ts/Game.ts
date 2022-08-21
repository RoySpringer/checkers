import Board, { BoardEvent, EVENT_BOARD_CLICKED } from "./Board";
import Piece from "./Piece";
import Node from "./Node";
import { Socket } from "socket.io-client";

interface Player {
  id: number;
  name: string;
  color: "black" | "white";
  points: number;
}

interface GameObject {
  id: number;
  players: Player[];
  currentPlayer?: Player;
  gameState: "lobby";
  turns: 0;
  /** Player id of the winnner */
  winner: number;
}

export const enum GAME_STATE {
  IN_LOBBY = "lobby",
  STARTING = "starting",
  STARTED = "started",
  WIN = "win",
}

export default class Game {
  private _board: Board;
  private _localPlayer?: Player;
  private _opponent?: Player;
  private _currentPlayer?: Player;
  private _selectedNode?: Node;
  private _players: Player[] = [];
  private _turns: number = 0;
  private _socket: Socket;
  private _gameObject?: GameObject;

  constructor(socket: Socket) {
    this._board = new Board(8, 8);
    this._socket = socket;
    this.setupSocketListeners();

    // this.setupPlayer();
    this.setupBoard();
    // this.setupPlayers();
  }

  public setupSocketListeners(): void {
    this.socket.on("gameCreated", (gameObject: GameObject) => {
      console.log("Game Created");
      this.setupGame(gameObject);
      this.askPlayerName();
    });
    this.socket.on("gameJoined", (gameObject: GameObject) => {
      console.log("Game Joined");
      this.setupGame(gameObject);
      if (gameObject.players.length > 0) {
        this.setupOpponentPlayer(gameObject.players[0]);
      }
      this.askPlayerName();
    });
    this.socket.on("playerCreated", (e) => {
      this.setupLocalPlayer(e);
    });
    this.socket.on("playerJoined", (e) => {
      console.log("Player Joined");
      this.setupOpponentPlayer(e);
    });
    this.socket.on("syncGameState", (gameObject: GameObject) => {
      console.log("GameSync", gameObject);
      this.setupGame(gameObject);
    });
    this.socket.on("gameStart", (gameObject: GameObject) => {
      this.setupPlayers(gameObject);
    });
  }

  public askPlayerName(): void {
    if (!this._gameObject) return;
    let name = null;
    do {
      name = window.prompt("What's your name?");
    } while (name === null || name.trim() === "");

    this.socket.emit("createPlayer", { gameId: this._gameObject!.id, name });
  }

  public setupGame(gameObject: GameObject): void {
    this._gameObject = gameObject;
    if (gameObject.players.length > 0) {
      for (const player of gameObject.players) {
        if (player.id !== this._localPlayer?.id) {
          this.setupOpponentPlayer(player);
        }
      }
    }
  }

  public setupLocalPlayer(player: Player) {
    console.log("Setup Local Player", player);
    const { id, name, color, points } = player;
    this._localPlayer = { id, name, color, points };
  }

  public setupOpponentPlayer(player: Player) {
    console.log("Setup Opponent Player", player);
    const { id, name, color, points } = player;
    this._opponent = { id, name, color, points };
  }

  public setupPlayers(gameObject: GameObject) {
    this._players = gameObject.players;
    this._currentPlayer = gameObject.currentPlayer;
  }

  public setupBoard() {
    this._board.drawBoard();
    this._board.addEventListener(EVENT_BOARD_CLICKED, (e) =>
      this.handleClick(e)
    );
    this._board.setupPieces();
  }

  private handleClick(event: Event) {
    const boardEvent = event as BoardEvent;
    const piece = boardEvent.nodeView.model.getPiece();
    const node = boardEvent.nodeView.model;

    if (!this._currentPlayer) return;
    if (this._currentPlayer.id !== this._localPlayer?.id) return;

    const canHit = this._board.canColorHitOppositeNode(
      this._currentPlayer.color
    );

    if (piece) {
      if (piece.color === this._currentPlayer?.color) {
        this._board.clearHighlights();
        if (this._selectedNode === node) {
          this.resetSelected();
          return;
        }
        this._selectedNode = node;
        const { availableNodes } = this._board.getAvailableMoveNodes(node.id);
        for (const highlight of availableNodes) {
          highlight.placePiece(new Piece("highlight"));
        }
      } else if (piece.color === "highlight") {
        this._board.clearHighlights();
        if (!this._selectedNode) return;

        const hitNode = this._board.getHitNode(this._selectedNode, node, true);
        // Check if the player is hitting other player, if not this move is illegal
        if (canHit && hitNode === undefined) {
          this.resetSelected();
          return;
        }

        hitNode?.removePiece();
        let piece = this._selectedNode.removePiece();
        if (!piece) {
          piece = new Piece(this._currentPlayer?.color!);
        }
        node.placePiece(piece);
        this.handleTurn();
      }
    }
  }

  public resetSelected() {
    this._selectedNode = undefined;
  }

  private handleTurn() {
    if (!this._currentPlayer) return;
    const canHit = this._board.canColorHitOppositeNode(
      this._currentPlayer.color
    );
    if (canHit) return;
    this._turns++;
    this._currentPlayer = this._players[this._turns % 2];
  }

  // Getters / Setters
  get socket(): Socket {
    return this._socket;
  }
}
