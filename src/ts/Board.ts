import Node from "./Node";
import NodeView from "./NodeView";
import Piece, { Color, getOppositeColor, PieceColor } from "./Piece";

const HIT_MAP = [
  { x: -2, y: -2 },
  { x: 2, y: -2 },
  { x: -2, y: 2 },
  { x: 2, y: 2 },
];

export const EVENT_BOARD_CLICKED: string = "board_clicked";

export class BoardEvent extends Event {
  public nodeView: NodeView;

  constructor(type: string, nodeView: NodeView) {
    super(type);
    this.nodeView = nodeView;
  }
}

export default class Board extends EventTarget {
  private _width: number = 0;
  private _height: number = 0;
  private _nodes: Node[][] = [];
  private _nodeViews: NodeView[] = [];

  constructor(width: number, height: number) {
    super();
    this._width = width;
    this._height = height;
    this.generateGrid();
  }

  private generateGrid(): void {
    let id: number = 0;
    for (let y = 0; y < this.height; y++) {
      this._nodes[y] = [];
      for (let x = 0; x < this.width; x++) {
        const node = new Node(id, x, y, (id + y) % 2 === 0);
        this._nodes[y][x] = node;
        this._nodeViews[id] = new NodeView(node);
        id++;
      }
    }
  }

  /**
   * Draw the board
   * @param selector The selector where the board should be drawn
   * @returns {Element} Board with all the nodes
   */
  public drawBoard(selector = ".main-area"): Element {
    const mainArea = this.getMainArea(selector);
    let id = 0;
    for (let y = 0; y < this.height; y++) {
      const div = document.createElement("div");
      div.classList.add("grid-row");
      for (let x = 0; x < this.width; x++) {
        const nodeView = this._nodeViews[id];
        nodeView.view.addEventListener("click", (e) => this.handleClickView(e));
        div.append(nodeView.view);
        id++;
      }
      mainArea.append(div);
    }
    return mainArea;
  }

  /**
   * Setup both sides with pieces
   */
  public setupPieces() {
    // Setup black
    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < this.width; x++) {
        const currentNode = this._nodes[y][x];
        if (currentNode.isAvailable) {
          currentNode.placePiece(new Piece("black"));
        }
      }
    }

    // Setup white
    for (let y = this.height - 1; y >= this.height - 3; y--) {
      for (let x = 0; x < this.width; x++) {
        const currentNode = this._nodes[y][x];
        if (currentNode.isAvailable) {
          currentNode.placePiece(new Piece("white"));
        }
      }
    }
  }

  /**
   * Gets the node based on index
   * @param index The id of the node
   * @returns The node or undefined if note within the board range
   */
  public getGridNode(index: number): Node | undefined {
    const row = Math.floor(index / this.width);
    const col = Math.floor(index % this.width);
    return this.getGridNodeXY(col, row);
  }

  /**
   * Gets the node based on x, y position
   * @param x x-pos of the node
   * @param y y-pos of the node
   * @returns The node or undefined if note within the board range
   */
  public getGridNodeXY(x: number, y: number): Node | undefined {
    if (x < 0 || x >= this.width) return undefined;
    if (y < 0 || y >= this.height) return undefined;
    return this._nodes[y][x];
  }

  /**
   * Clears the plieces with the highlight piece on it
   * and removes the willHit boolean
   */
  public clearHighlights(): void {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const currentNode = this._nodes[y][x];
        currentNode.willHit = false;
        if (currentNode.getPiece()?.color === "highlight") {
          currentNode.removePiece();
        }
      }
    }
  }

  /**
   * Get all the posible moves for a node, following the must hit rule.
   * @param index The id of the node
   * @returns Object with the availableNodes and the posible hitNodes
   */
  public getAvailableMoveNodes(index: number): {
    availableNodes: Node[];
    hitNodes: Node[];
  } {
    const node = this.getGridNode(index);
    let availableNodes: Node[] = [];
    let hitNodes: Node[] = [];
    if (node && node.getPiece() !== null) {
      const color: string = node.getPiece()!.color;
      let emptyNodes: Node[] = [];
      if (color === "black") {
        availableNodes = this.getBottomNeighbors(node);
        emptyNodes = availableNodes.filter((item) => !item.hasPiece());
      } else if (color === "white") {
        availableNodes = this.getTopNeighbors(node);
        emptyNodes = availableNodes.filter((item) => !item.hasPiece());
      }
      availableNodes = emptyNodes;

      // Check hits
      const { hits, hitSpots } = this.getHits(node, true);
      if (hits.length > 0) {
        // User must hit player
        availableNodes = hitSpots;
        hitNodes = hits;
      }
    }
    return {
      availableNodes,
      hitNodes,
    };
  }

  /**
   * Get all the available top neighbors
   * @param node The node to find the neighbors for
   * @returns List of all the top neighbors diagonally
   */
  public getTopNeighbors(node: Node): Node[] {
    const nodes: Node[] = [];
    if (node.y - 1 >= 0) {
      if (node.x - 1 >= 0) nodes.push(this._nodes[node.y - 1][node.x - 1]);
      if (node.x + 1 < this.width)
        nodes.push(this._nodes[node.y - 1][node.x + 1]);
    }
    return nodes;
  }

  /**
   * Get all the available bottom neighbors
   * @param node The node to find the neighbors for
   * @returns List of all the bottom neighbors diagonally
   */
  public getBottomNeighbors(node: Node): Node[] {
    const nodes: Node[] = [];
    if (node.y + 1 < this.height) {
      if (node.x - 1 >= 0) nodes.push(this._nodes[node.y + 1][node.x - 1]);
      if (node.x + 1 < this.width)
        nodes.push(this._nodes[node.y + 1][node.x + 1]);
    }
    return nodes;
  }

  /**
   * Get all the available neighbors
   * @param node The node to find the neighbors for
   * @returns List of all the neighbors diagonally
   */
  public getAllNeighbors(node: Node): Node[] {
    return [...this.getBottomNeighbors(node), ...this.getTopNeighbors(node)];
  }

  /**
   * Checks whether the node can hit another node
   * @param node The node to check if it can hit
   * @returns true or false
   */
  public nodeCanHit(node: Node): boolean {
    return this.getHits(node).hits.length != 0;
  }

  /**
   * Returns all the possible hits it can make.
   * @param node The node to do the check upon
   * @param showHits Whether or not to highlight the hit nodes
   * @returns Returns an object with the hits node array and the hitSpots array(Where the spot is it can go.)
   */
  public getHits(
    node: Node,
    showHits: boolean = false
  ): { hits: Node[]; hitSpots: Node[] } {
    const hits: Node[] = [];
    const hitSpots: Node[] = [];
    if (!node.hasPiece()) return { hits, hitSpots };
    const allNeighbors = this.getAllNeighbors(node);
    const oppositeColor = getOppositeColor(
      node.getPiece()!.color as PieceColor
    );
    const filterdNeighbors = allNeighbors.filter(
      (item) => item.hasPiece() && item.getPiece()?.color === oppositeColor
    );

    // Check hits
    for (const colorNode of filterdNeighbors) {
      for (const hitPattern of HIT_MAP) {
        const toNode = this.getGridNodeXY(
          node.x + hitPattern.x,
          node.y + hitPattern.y
        );
        if (!toNode || toNode.hasPiece()) continue;
        if (
          ((node.x < colorNode.x && toNode.x > colorNode.x) ||
            (toNode.x < colorNode.x && node.x > colorNode.x)) &&
          ((node.y < colorNode.y && toNode.y > colorNode.y) ||
            (toNode.y < colorNode.y && node.y > colorNode.y))
        ) {
          hits.push(colorNode);
          hitSpots.push(toNode);
          if (showHits) {
            colorNode.willHit = true;
          }
        }
      }
    }
    return { hits, hitSpots };
  }

  /**
   * Checks wheter the toNode is a possible hitArea
   * @param fromNode The from node
   * @param toNode The to node
   * @returns true or false whether the toNode is a possible available hit area to go to and a valid node.
   */
  public isInHitMap(fromNode: Node, toNode: Node): boolean {
    for (const hitLoc of HIT_MAP) {
      const currentToNode = this.getGridNodeXY(
        fromNode.x + hitLoc.x,
        fromNode.y + hitLoc.y
      );
      if (!currentToNode) continue;
      if (currentToNode.x === toNode.x && currentToNode.y === toNode.y)
        return true;
    }
    return false;
  }

  /**
   * Returns the node it will hit.
   * @param fromNode The from node
   * @param toNode The to node
   * @param mustHaveOppositePiece boolean to only check of the opposite color
   * @returns A node it will hit or none if none where found.
   */
  public getHitNode(
    fromNode: Node,
    toNode: Node,
    mustHaveOppositePiece: boolean = false
  ): Node | undefined {
    if (!this.isInHitMap(fromNode, toNode)) return undefined;
    const x = toNode.x > fromNode.x ? fromNode.x + 1 : fromNode.x - 1;
    const y = toNode.y > fromNode.y ? fromNode.y + 1 : fromNode.y - 1;
    const node = this.getGridNodeXY(x, y);
    if (mustHaveOppositePiece) {
      if (node?.hasPiece() && fromNode.hasPiece()) {
        const oppositeColor = getOppositeColor(
          node.getPiece()?.color as PieceColor
        );
        if (fromNode.getPiece()?.color === oppositeColor) {
          return node;
        }
      }
    }
    return this.getGridNodeXY(x, y);
  }

  /**
   * Return the available nodes.
   * @returns The nodes with the boolean isAvailable true
   */
  public getAvailableNodes(): Node[] {
    return this._nodes.flat().filter((item) => item.isAvailable);
  }

  /**
   * Returns the available color pieces.
   * @param color The color of the piece
   * @returns The available nodes with a color piece on it.
   */
  public getNodesByColor(color: Color): Node[] {
    return this.getAvailableNodes().filter(
      (item) => item.hasPiece() && item.getPiece()?.color === color
    );
  }

  /**
   * Returns whether or not the color can hit the other color.
   * @param color The color of the piece
   * @returns If the color can hit the other color
   */
  public canColorHitOppositeNode(color: PieceColor): boolean {
    const coloredNodes = this.getNodesByColor(color);
    for (const colorNode of coloredNodes) {
      const canHit = this.nodeCanHit(colorNode);
      if (canHit) return true;
    }
    return false;
  }

  /**
   * Return the main board Element
   * @param selector the selector string
   * @returns the Element of where the board is drawn
   */
  private getMainArea(selector: string): Element {
    let mainArea = document.querySelector(selector);
    if (mainArea === null) {
      mainArea = document.createElement("main");
      mainArea.classList.add(selector);
      document.body.append(mainArea);
    }
    return mainArea;
  }

  /**
   * Handles the event of a node view being clicked
   * @param event
   */
  private handleClickView(event: Event) {
    const node = event.target as HTMLDivElement;
    const nodeId = Number.parseInt(node.dataset.nodeId || "-1");
    if (nodeId != -1) {
      const nodeView = this._nodeViews[nodeId];
      this.dispatchEvent(new BoardEvent(EVENT_BOARD_CLICKED, nodeView));
    }
  }

  /**
   * Getters and setters
   */
  public get width(): number {
    return this._width;
  }
  public get height(): number {
    return this._height;
  }
}
