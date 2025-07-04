const express = require("express");
const path = require("path");
const router = express.Router();
const admin = require("./firebase/admin");
const { getLocalIP } = require("./utils/network");
require("dotenv").config();
// admin.initializeApp();

const app = express();
app.use(express.json());

app.use("/", require("./routes/notification"));
app.use("/", require("./routes/audioRoutes"));
app.use("/",require("./routes/homeRoutes.js"));

app.get("/", async (req, res) => {
  res.sendFile(path.join(__dirname, "/html/index.html"));
});

app.get("/ping", (req, res) => {
  res.send("pong");
});

port=process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`✅ Server running at http://${getLocalIP()}:${port}`);
  console.log(`📁 Server script located at: ${__dirname}`);
});