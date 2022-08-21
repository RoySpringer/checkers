import Board, { BoardEvent, EVENT_BOARD_CLICKED } from "./Board";
import Piece, { Color } from "./Piece";
import Node from "./Node";
import { Socket } from "socket.io-client";

interface Player {
  id: number;
  name: string;
  color: "black" | "white";
  points: number;
}

interface NodeUpdate {
  id: number;
  action: "removed" | "changed";
  color?: Color;
}

interface GameObject {
  id: number;
  players: Player[];
  currentPlayer?: Player;
  gameState: "lobby";
  turns: 0;
  /** Player id of the winnner */
  winner: number;
  moves?: NodeUpdate[];
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
  private _socket: Socket;
  private _gameObject?: GameObject;
  private _moves: NodeUpdate[] = [];

  constructor(socket: Socket) {
    this._board = new Board(8, 8);
    this._socket = socket;
    this.setupSocketListeners();
    this.setupBoard();
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
      this.syncGame(gameObject);
    });
    this.socket.on("gameStart", (gameObject: GameObject) => {
      this.setupPlayers(gameObject);
    });
    this.socket.on("updateBoard", (nodesUpdate: NodeUpdate[]) => {
      this.handleMoves(nodesUpdate);
    });
  }

  /**
   * Promps the playername untill filled in.
   */
  public askPlayerName(): void {
    if (!this._gameObject) return;
    let name = null;
    do {
      name = window.prompt("What's your name?");
    } while (name === null || name.trim() === "");

    this.socket.emit("createPlayer", { gameId: this._gameObject!.id, name });
  }

  /**
   * Syncs the game
   * @param gameObject The new game state object
   */
  public syncGame(gameObject: GameObject): void {
    this._gameObject = gameObject;
    this._currentPlayer = gameObject.currentPlayer;
  }

  /**
   * Sets the game
   * @param gameObject The new game state object
   */
  public setupGame(gameObject: GameObject): void {
    this._gameObject = gameObject;
  }

  /**
   * Setup the local player
   * @param player The player
   */
  public setupLocalPlayer(player: Player) {
    console.log("Setup Local Player", player);
    const { id, name, color, points } = player;
    this._localPlayer = { id, name, color, points };
  }

  /**
   * Setup the opponent
   * @param player The player
   */
  public setupOpponentPlayer(player: Player) {
    console.log("Setup Opponent Player", player);
    const { id, name, color, points } = player;
    this._opponent = { id, name, color, points };
  }

  /**
   * Setup the current player and resync all the players
   * @param gameObject The new game state object
   */
  public setupPlayers(gameObject: GameObject) {
    this._currentPlayer = gameObject.currentPlayer;
    for (const player of gameObject.players) {
      if (this._localPlayer?.id === player.id) {
        this.setupLocalPlayer(player);
      }
      if (this._opponent?.id === player.id) {
        this.setupOpponentPlayer(player);
      }
    }
  }

  /**
   * Set up the board. Draws the board and add the listeners
   */
  public setupBoard() {
    this._board.drawBoard();
    this._board.addEventListener(EVENT_BOARD_CLICKED, (e) =>
      this.handleClick(e)
    );
    this._board.setupPieces();
  }

  /**
   * The moves handler
   * @param moves Moves list. A custom object to update the board
   */
  private handleMoves(moves: NodeUpdate[]) {
    for (const move of moves) {
      const currentNode = this._board.getGridNode(move.id);
      if (move.action === "removed") {
        currentNode?.removePiece();
      } else if (move.action === "changed") {
        if (move.color) {
          currentNode?.placePiece(new Piece(move.color));
        } else {
          console.error("Got change action without a color");
        }
      }
    }
  }

  /**
   * Handles all the games click logic
   * @param event BoardEvent send by the board.
   */
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
        if (hitNode) {
          this._moves.push({ id: hitNode.id, action: "removed" });
        }
        let piece = this._selectedNode.removePiece();
        this._moves.push({ id: this._selectedNode.id, action: "removed" });
        if (!piece) {
          piece = new Piece(this._currentPlayer?.color!);
        }
        this._moves.push({
          id: node.id,
          action: "changed",
          color: piece.color,
        });
        node.placePiece(piece);
        this.handleTurn();
      }
    }
  }

  /**
   * Reset the selected node
   */
  public resetSelected() {
    this._selectedNode = undefined;
  }

  /**
   * Handles the end turn state for the player
   */
  private handleTurn() {
    if (!this._currentPlayer) return;
    const canHit = this._board.canColorHitOppositeNode(
      this._currentPlayer.color
    );
    if (canHit) return;
    this.socket.emit("sendMoves", {
      gameId: this._gameObject?.id,
      playerId: this._localPlayer?.id,
      moves: this._moves,
    });
    this._moves = [];
    this.socket.emit("endTurn", { gameId: this._gameObject?.id });
  }

  /**
   * Getters and setters
   */
  get socket(): Socket {
    return this._socket;
  }
}
