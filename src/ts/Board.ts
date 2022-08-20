import Node from "./Node";
import NodeView from "./NodeView";
import Piece from "./Piece";

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
  public drawBoard(selector = "main-area"): Element {
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

  public getGridNode(index: number): Node | undefined {
    const row = Math.floor(index / this.width);
    const col = Math.floor(index % this.width);
    return this.getGridNodeXY(col, row);
  }

  public getGridNodeXY(x: number, y: number): Node | undefined {
    if (x < 0 || x > this.width) return undefined;
    if (y < 0 || y > this.height) return undefined;
    return this._nodes[y][x];
  }

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

  public getAvailableNodes(index: number): {
    availableNodes: Node[];
    hitNodes: Node[];
  } {
    const node = this.getGridNode(index);
    let nodes: Node[] = [];
    let hitNodes = [];
    if (node && node.getPiece() !== null) {
      const color: string = node.getPiece()!.color;
      if (color === "black") {
        nodes = this.getBottomNeighbors(node);
        const emptyNodes = nodes.filter((item) => !item.hasPiece());
        const colorNodes = nodes.filter(
          (item) => item.getPiece()?.color === "white"
        );
        // Check hits
        for (const colorNode of colorNodes) {
          let x = colorNode.x - 1;
          let y = colorNode.y + 1;
          if (y > this.height) break;
          if (node.x < colorNode.x) {
            x = colorNode.x + 1;
          }
          if (x < 0 || x >= this.width) continue;
          const nextNode = this._nodes[y][x];
          if (!nextNode.hasPiece()) {
            colorNode.willHit = true;
            hitNodes.push(colorNode);
            hitNodes.push(nextNode);
          }
        }
        // User must hit player
        if (hitNodes.length > 0) {
          nodes = hitNodes;
        } else {
          nodes = emptyNodes;
        }
      } else if (color === "white") {
        nodes = this.getTopNeighbors(node);
        const emptyNodes = nodes.filter((item) => !item.hasPiece());
        const colorNodes = nodes.filter(
          (item) => item.getPiece()?.color === "black"
        );
        // Check hits
        for (const colorNode of colorNodes) {
          let x = colorNode.x - 1;
          let y = colorNode.y - 1;
          if (y < 0) break;
          if (node.x < colorNode.x) {
            x = colorNode.x + 1;
          }
          if (x < 0 || x >= this.width) continue;
          const nextNode = this._nodes[y][x];
          if (!nextNode.hasPiece()) {
            colorNode.willHit = true;
            hitNodes.push(colorNode);
            hitNodes.push(nextNode);
          }
        }
        // User must hit player
        if (hitNodes.length > 0) {
          nodes = hitNodes;
        } else {
          nodes = emptyNodes;
        }
      }
    }
    return {
      availableNodes: nodes.filter((item) => !item.hasPiece()),
      hitNodes: nodes.filter((item) => item.hasPiece()),
    };
  }

  public getTopNeighbors(node: Node): Node[] {
    const nodes: Node[] = [];
    if (node.y - 1 >= 0) {
      if (node.x - 1 >= 0) nodes.push(this._nodes[node.y - 1][node.x - 1]);
      if (node.x + 1 < this.width)
        nodes.push(this._nodes[node.y - 1][node.x + 1]);
    }
    return nodes;
  }

  public getBottomNeighbors(node: Node): Node[] {
    const nodes: Node[] = [];
    console.log(node);
    console.log(node.x - 1 >= 0);
    console.log(node.x + 1 < this.width);
    console.log(this._nodes[node.y + 1][node.x - 1]);
    if (node.y + 1 < this.height) {
      if (node.x - 1 >= 0) nodes.push(this._nodes[node.y + 1][node.x - 1]);
      if (node.x + 1 < this.width)
        nodes.push(this._nodes[node.y + 1][node.x + 1]);
    }
    return nodes;
  }

  // Get the diff for the board.
  private getMainArea(selector: string): Element {
    let mainArea = document.querySelector(selector);
    if (mainArea === null) {
      mainArea = document.createElement("main");
      mainArea.classList.add(selector);
      document.body.append(mainArea);
    }
    return mainArea;
  }

  private handleClickView(event: Event) {
    const node = event.target as HTMLDivElement;
    const nodeId = Number.parseInt(node.dataset.nodeId || "-1");
    if (nodeId != -1) {
      const nodeView = this._nodeViews[nodeId];
      this.dispatchEvent(new BoardEvent(EVENT_BOARD_CLICKED, nodeView));
    }
  }

  // Getters / Setters
  public get width(): number {
    return this._width;
  }
  public get height(): number {
    return this._height;
  }
}
