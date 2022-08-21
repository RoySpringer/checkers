export default class GameManager {
  games = [];

  createGame() {
    const gameObject = {
      id: this.games.length,
      players: [],
      currentPlayer: undefined,
      gameState: "lobby",
      turns: 0,
      winnder: undefined,
    };
    this.games.push(gameObject);
    return gameObject;
  }

  shouldCreateGame() {
    if (this.games === 0) return true;
    const openGame = this.getOpenGame();
    if (!openGame) return true;
    return false;
  }

  getOpenGame() {
    return this.games.find(
      (game) => game.players.length != 2 && game.gameState === "lobby"
    );
  }

  getGame(id) {
    if (id < this.games.length) {
      return this.games[id];
    }
    return null;
  }

  addPlayerGame(id, playerName, socketId) {
    const currentGame = this.getGame(id);
    if (currentGame) {
      if (currentGame.players.length <= 1) {
        const player = {
          id: currentGame.players.length,
          socketId: socketId,
          name: playerName,
          color: currentGame.players.length === 0 ? "black" : "white",
          points: 0,
        };
        currentGame.players.push(player);
        return player;
      }
    }
    return false;
  }

  getOpponent(id, playerId) {
    const currentGame = this.getGame(id);
    console.log({ currentGame });
    if (currentGame) {
      if (currentGame.players.length === 1) return false;
      return currentGame.players[(playerId + 1) % 2];
    }
  }

  getPlayers(id) {
    const currentGame = this.getGame(id);
    if (currentGame) {
      return currentGame.players;
    }
    return [];
  }

  gameCanStart(id) {
    const currentGame = this.getGame(id);
    if (currentGame) {
      return currentGame.players.length === 2;
    }
    return false;
  }

  startGame(id) {
    const currentGame = this.getGame(id);
    if (currentGame && this.gameCanStart(id)) {
      currentGame.currentPlayer = currentGame.players[0];
      currentGame.gameState = "started";
      return currentGame;
    }
    return false;
  }

  endGame(id, playerLeftId = -1) {
    const currentGame = this.getGame(id);
    if (currentGame && currentGame.gameState === "started") {
      currentGame.gameState = "end";
      if (playerLeftId != -1) {
        currentGame.winner = (playerLeftId + 1) % 2;
      }
    }
    return currentGame;
  }

  changeTurn(id) {
    const currentGame = this.getGame(id);
    if (currentGame && currentGame.gameState === "started") {
      currentGame.turns++;
      currentGame.currentPlayer = currentGame.players[currentGame.turns % 2];
    }
    return currentGame;
  }

  addPointPlayer(id, playerId, points = 1) {
    const currentGame = this.getGame(id);
    if (currentGame && currentGame.gameState === "started") {
      const player = currentGame.players.find((item) => item.id === playerId);
      if (player) {
        player.points += points;
      }
    }
  }

  getWinnerGame(id) {
    const currentGame = this.getGame(id);
    if (currentGame && currentGame.gameState === "started") {
      for (const player of currentGame.players) {
        if (player.points >= 12) {
          return player;
        }
      }
    }
    return false;
  }
}
