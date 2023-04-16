const express = require("express");
const fs = require("fs");
const server = express();
const p = "./endpoints/";
require('dotenv').config();

server.use(express.static("public"));

for (const f of fs.readdirSync(p)) {
  try {
    const f_ = require(`${p}${f}`);
    server[f_.method](f_.path, (req, res) => {
      f_.run(req, res);
    })
  } catch (err) {
    console.error(`Failed to load ${p}${f}, ${err}`);
  }
}

server.listen(process.env.PORT, () => {
  `Server is running on port ${process.env.PORT}`
})