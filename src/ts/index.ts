import Game from "./Game";
import { io, Socket } from "socket.io-client";

// please note that the types are reversed
const socket: Socket = io();

new Game(socket);
