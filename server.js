import express from "express";
import path from "path";
import open from "open";
import http from "http";
import { Server } from "socket.io";
import { fileURLToPath } from "url";
import GameManager from "./server/GameManager.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const gameManager = new GameManager();
let port = process.env.PORT || 3001;

app.use(express.static(path.join(__dirname, "dist/")));
app.use(express.static(path.join(__dirname, "src/css/")));
app.use(
  express.static(path.join(__dirname, "node_modules/socket.io/client-dist/"))
);

// Main
app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, "index.html"));
});

io.on("connection", (socket) => {
  console.log("a user connected", socket.id);
  let gameObject;
  if (gameManager.shouldCreateGame()) {
    gameObject = gameManager.createGame();
    socket.emit("gameCreated", gameObject);
  } else {
    gameObject = gameManager.getOpenGame();
    socket.emit("gameJoined", gameObject);
  }

  socket.on("createPlayer", ({ gameId, name }) => {
    const player = gameManager.addPlayerGame(gameId, name, socket.id);
    if (player) {
      socket.emit("playerCreated", player);
    }
    const opponent = gameManager.getOpponent(gameId, player.id);
    if (opponent) {
      io.to(opponent.socketId).emit("playerJoined", player);
    }
    if (gameManager.gameCanStart(gameId)) {
      const game = gameManager.startGame(gameId);

      gameManager.getPlayers(gameId).forEach((player) => {
        io.to(player.socketId).emit("syncGameState", game);
        io.to(player.socketId).emit("gameStart", game);
      });
    }
  });

  socket.on("endTurn", ({ gameId }) => {
    const game = gameManager.changeTurn(gameId);
    gameManager.getPlayers(gameId).forEach((player) => {
      io.to(player.socketId).emit("syncGameState", game);
    });
  });

  socket.on("sendMoves", ({ gameId, playerId, moves }) => {
    const opponent = gameManager.getOpponent(gameId, playerId);
    console.log(moves);
    if (opponent) {
      io.to(opponent.socketId).emit("updateBoard", moves);
    }
  });

  socket.on("disconnect", () => {
    const game = gameManager.endGame(gameObject.id);
    io.emit("endGame", game);
  });
});

server.listen(port, () => {
  console.log(`Server listening on port ${port}! http://localhost:${port}`);
  open(`http://localhost:${port}`);
  open(`http://localhost:${port}`);
});
