import express from "express";
import path from "path";
import open from "open";
import http from "http";
import { Server } from "socket.io";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server);
let port = process.env.PORT || 3001;

app.use(express.static(path.join(__dirname, "dist/")));
app.use(express.static(path.join(__dirname, "src/css")));

// Main
app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(port, () => {
  console.log(`App listening on port ${port}! http://localhost:${port}`);
  open(`http://localhost:${port}`);
});

io.on("connection", (socket) => {
  console.log("a user connected");
});

server.listen(3000, () => {
  console.log("listening on *:3000");
});
