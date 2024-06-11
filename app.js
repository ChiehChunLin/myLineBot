"use strict";

const express = require("express");
const dotenv = require("dotenv").config();
const line = require("@line/bot-sdk");

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET
};

const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN
});

const app = express();

app.get("/", (req, res) => {
  res.send("homepage.");
});

app.post("/callback", line.middleware(config), (req, res) => {
  Promise.all(
    req.body.events.map(handleEvent)
  ) /* 傳入的訊息都會經過 handleEvent */
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

/* 這邊是 line 回覆訊息的 handleEvent function */
function handleEvent(event) {
  /* 傳入的訊息是 event */
  if (event.type !== "message" || event.message.type !== "text") {
    return Promise.resolve(null);
  }

  const echo = { type: "text", text: event.message.text };

  return client.replyMessage({
    replyToken: event.replyToken,
    messages: [echo]
    /* 回傳的訊息是 [echo...] */
    /* [{type: 'text', text: event.message.text},{type: 'text', text: event.message.text}...] */
  });
}

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is listening on ${port}`);
});
