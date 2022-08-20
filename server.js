import express from "express";
import path from "path";
import open from "open";

const app = express();
let port = process.env.PORT || 3001;

app.use(express.static(path.join(__dirname, "dist/")));

// Main
app.get("/*", function (req, res) {
  res.sendFile(path.join(__dirname, "src", "index.html"));
});

app.listen(port, () => {
  console.log(`App listening on port ${port}! http://localhost:${port}`);
  open(`http://localhost:${port}`);
});
