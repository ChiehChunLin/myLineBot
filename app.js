"use strict";

const express = require("express");
const dotenv = require("dotenv").config();
const line = require("@line/bot-sdk");
const fs = require("fs");
const path = require("path");
const util = require("util");
const { pipeline } = require("stream");

const baseURL = process.env.LINE_CHANNEL_BASE_URL;
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET
};
const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET
});
const blobClient = new line.messagingApi.MessagingApiBlobClient({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN
});

const app = express();

app.get("/", (req, res) => {
  res.send("homepage.");
});

app.post("/", line.middleware(config), (req, res) => {
  if (req.body.destination) {
    console.log("Destination User ID: " + req.body.destination);
  }

  // req.body.events should be an array of events
  if (!Array.isArray(req.body.events)) {
    return res.status(500).end();
  }
  Promise.all(
    req.body.events.map(handleEvent)
  ) /* 傳入的訊息都會經過 handleEvent */
    .then((result) => res.status(200).json(result))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

/* 這邊是 line 回覆訊息的 handleEvent function */
function handleEvent(event) {
  if (event.replyToken && event.replyToken.match(/^(.)\1*$/)) {
    return console.log("Test hook recieved: " + JSON.stringify(event.message));
  }

  switch (event.type) {
    case "message":
      const message = event.message;
      switch (message.type) {
        case "text":
          return handleText(message, event.replyToken, event.source);
        case "image":
          return handleImage(message, event.replyToken);
        case "video":
          return handleVideo(message, event.replyToken);
        default:
          throw new Error(`Unknown message: ${JSON.stringify(message)}`);
      }

    case "join":
      return replyText(event.replyToken, `Joined ${event.source.type}`);

    case "leave":
      return console.log(`Left: ${JSON.stringify(event)}`);

    default:
      throw new Error(`Unknown event: ${JSON.stringify(event)}`);
  }
}

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is listening on ${port}`);
});

const replyText = (token, texts) => {
  texts = Array.isArray(texts) ? texts : [texts];
  return client.replyMessage({
    replyToken: token,
    messages: texts.map((text) => ({ type: "text", text }))
  });
};

async function handleText(message, replyToken, source) {
  const buttonsImageURL = `${baseURL}/static/buttons/1040.jpg`;

  switch (message.text) {
    case "profile":
      if (source.userId) {
        return client
          .getProfile(source.userId)
          .then((profile) =>
            replyText(replyToken, [
              `Display name: ${profile.displayName}`,
              `Status message: ${profile.statusMessage}`
            ])
          );
      } else {
        return replyText(
          replyToken,
          "Bot can't use profile API without user ID"
        );
      }
    case "buttons":
      return client.replyMessage({
        replyToken,
        messages: [
          {
            type: "template",
            altText: "Buttons alt text",
            template: {
              type: "buttons",
              thumbnailImageUrl: buttonsImageURL,
              title: "My button sample",
              text: "Hello, my button",
              actions: [
                { label: "Go to line.me", type: "uri", uri: "https://line.me" },
                {
                  label: "Say hello1",
                  type: "postback",
                  data: "hello こんにちは"
                },
                {
                  label: "言 hello2",
                  type: "postback",
                  data: "hello こんにちは",
                  text: "hello こんにちは"
                },
                { label: "Say message", type: "message", text: "Rice=米" }
              ]
            }
          }
        ]
      });
    case "confirm":
      return client.replyMessage({
        replyToken,
        messages: [
          {
            type: "template",
            altText: "Confirm alt text",
            template: {
              type: "confirm",
              text: "Do it?",
              actions: [
                { label: "Yes", type: "message", text: "Yes!" },
                { label: "No", type: "message", text: "No!" }
              ]
            }
          }
        ]
      });
    case "carousel":
      return client.replyMessage({
        replyToken,
        messages: [
          {
            type: "template",
            altText: "Carousel alt text",
            template: {
              type: "carousel",
              columns: [
                {
                  thumbnailImageUrl: buttonsImageURL,
                  title: "hoge",
                  text: "fuga",
                  actions: [
                    {
                      label: "Go to line.me",
                      type: "uri",
                      uri: "https://line.me"
                    },
                    {
                      label: "Say hello1",
                      type: "postback",
                      data: "hello こんにちは"
                    }
                  ]
                },
                {
                  thumbnailImageUrl: buttonsImageURL,
                  title: "hoge",
                  text: "fuga",
                  actions: [
                    {
                      label: "言 hello2",
                      type: "postback",
                      data: "hello こんにちは",
                      text: "hello こんにちは"
                    },
                    { label: "Say message", type: "message", text: "Rice=米" }
                  ]
                }
              ]
            }
          }
        ]
      });
    case "image carousel":
      return client.replyMessage({
        replyToken,
        messages: [
          {
            type: "template",
            altText: "Image carousel alt text",
            template: {
              type: "image_carousel",
              columns: [
                {
                  imageUrl: buttonsImageURL,
                  action: {
                    label: "Go to LINE",
                    type: "uri",
                    uri: "https://line.me"
                  }
                },
                {
                  imageUrl: buttonsImageURL,
                  action: {
                    label: "Say hello1",
                    type: "postback",
                    data: "hello こんにちは"
                  }
                },
                {
                  imageUrl: buttonsImageURL,
                  action: {
                    label: "Say message",
                    type: "message",
                    text: "Rice=米"
                  }
                },
                {
                  imageUrl: buttonsImageURL,
                  action: {
                    label: "datetime",
                    type: "datetimepicker",
                    data: "DATETIME",
                    mode: "datetime"
                  }
                }
              ]
            }
          }
        ]
      });
    case "datetime":
      return client.replyMessage({
        replyToken,
        messages: [
          {
            type: "template",
            altText: "Datetime pickers alt text",
            template: {
              type: "buttons",
              text: "Select date / time !",
              actions: [
                {
                  type: "datetimepicker",
                  label: "date",
                  data: "DATE",
                  mode: "date"
                },
                {
                  type: "datetimepicker",
                  label: "time",
                  data: "TIME",
                  mode: "time"
                },
                {
                  type: "datetimepicker",
                  label: "datetime",
                  data: "DATETIME",
                  mode: "datetime"
                }
              ]
            }
          }
        ]
      });
    case "imagemap":
      return client.replyMessage({
        replyToken,
        messages: [
          {
            type: "imagemap",
            baseUrl: `${baseURL}/static/rich`,
            altText: "Imagemap alt text",
            baseSize: { width: 1040, height: 1040 },
            actions: [
              {
                area: { x: 0, y: 0, width: 520, height: 520 },
                type: "uri",
                linkUri: "https://store.line.me/family/manga/en"
              },
              {
                area: { x: 520, y: 0, width: 520, height: 520 },
                type: "uri",
                linkUri: "https://store.line.me/family/music/en"
              },
              {
                area: { x: 0, y: 520, width: 520, height: 520 },
                type: "uri",
                linkUri: "https://store.line.me/family/play/en"
              },
              {
                area: { x: 520, y: 520, width: 520, height: 520 },
                type: "message",
                text: "URANAI!"
              }
            ],
            video: {
              originalContentUrl: `${baseURL}/static/imagemap/video.mp4`,
              previewImageUrl: `${baseURL}/static/imagemap/preview.jpg`,
              area: {
                x: 280,
                y: 385,
                width: 480,
                height: 270
              },
              externalLink: {
                linkUri: "https://line.me",
                label: "LINE"
              }
            }
          }
        ]
      });
    case "bye":
      switch (source.type) {
        case "user":
          return replyText(replyToken, "Bot can't leave from 1:1 chat");
        case "group":
          return replyText(replyToken, "Leaving group").then(() =>
            client.leaveGroup(source.groupId)
          );
        case "room":
          return replyText(replyToken, "Leaving room").then(() =>
            client.leaveRoom(source.roomId)
          );
      }
    default:
      console.log(`Echo message to ${replyToken}: ${message.text}`);
      return replyText(replyToken, message.text);
  }
}

async function handleImage(message, replyToken) {
  function sendReply(originalContentUrl, previewImageUrl) {
    return client.replyMessage({
      replyToken,
      messages: [
        {
          type: "image",
          originalContentUrl,
          previewImageUrl
        }
      ]
    });
  }
  try {
    if (message.contentProvider.type === "line") {
      const downloadPath = path.join(
        __dirname,
        "downloaded",
        `${message.id}.jpg`
      );
      const previewPath = path.join(
        __dirname,
        "downloaded",
        `${message.id}-preview.jpg`
      );

      await downloadContent(message.id, downloadPath);

      // ImageMagick is needed here to run 'convert'
      // Please consider security and performance by yourself
      // cp.execSync(
      //   `convert -resize 240x jpeg:${downloadPath} jpeg:${previewPath}`
      // );
    }
    return replyText(replyToken, "images are saved.");
  } catch (err) {
    console.log(err.message);
    return replyText(replyToken, "images fail to save.");
  }
}

async function handleVideo(message, replyToken) {
  console.log(`handleVideo: ${replyToken} ${JSON.stringify(message)}}`);

  function sendReply(originalContentUrl, previewImageUrl) {
    return client.replyMessage({
      replyToken,
      messages: [
        {
          type: "video",
          originalContentUrl,
          previewImageUrl
        }
      ]
    });
  }
  try {
    if (message.contentProvider.type === "line") {
      const downloadPath = path.join(
        __dirname,
        "downloaded",
        `${message.id}.mp4`
      );
      const previewPath = path.join(
        __dirname,
        "downloaded",
        `${message.id}-preview.jpg`
      );

      await downloadContent(message.id, downloadPath);

      // FFmpeg and ImageMagick is needed here to run 'convert'
      // Please consider security and performance by yourself
      // cp.execSync(`convert mp4:${downloadPath}[0] jpeg:${previewPath}`);
      return replyText(replyToken, "videos are saved.");
    }
  } catch (err) {
    console.log(err.message);
    return replyText(replyToken, "videos fail to save.");
  }
}

async function downloadContent(messageId, downloadPath) {
  const stream = await blobClient.getMessageContent(messageId);

  const pipelineAsync = util.promisify(pipeline);

  const writable = fs.createWriteStream(downloadPath);
  await pipelineAsync(stream, writable);
}
