"use strict";

const express = require("express");
const path = require("path");
const dotenv = require("dotenv").config();
const lineBot = require("./controllers/lineBot_controller");

const app = express();
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.send("homepage.");
});
app.get("/s3", async (req, res) => {
  const imgUrl = lineBot.getImageUrl(
    "FILE/PATH/TO/AWS_S3"
  );
  res.render("imageDisplay", { imgUrl });
});
app.post("/", lineBot.lineAuthCheck(lineBot.config), (req, res) => {
  if (req.body.destination) {
    console.log("Destination User ID: " + req.body.destination);
  }

  // req.body.events should be an array of events
  if (!Array.isArray(req.body.events)) {
    return res.status(500).end();
  }
  Promise.all(
    req.body.events.map(lineBot.handleEvent)
  ) /* 傳入的訊息都會經過 handleEvent */
    .then((result) => res.status(200).json(result))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is listening on ${port}`);
});
